import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { z } from 'zod'
import { logAudit, AUDIT_ACTIONS, RESOURCE_TYPES } from '@/lib/audit-logger'
import { sendStaffInvitation } from '@/lib/email'
import { can } from '@/lib/permissions'
import { sendNotification } from '@/lib/notifications'
import { sendDeliverySMS, formatNigerianPhone } from '@/lib/sms-notifications'
import { isSubscriptionActive, hasFeature, FEATURES, canAddUser } from '@/lib/subscription'
import { sendLowStockAlert, sendOverduePaymentAlert, sendLargeOrderAlert } from '@/lib/email-alerts'

// =============================================================================
// ZOD VALIDATION SCHEMAS
// =============================================================================

// Nigerian phone number validation
const NigerianPhone = z.string().regex(
  /^(\+234|0)[789][01]\d{8}$/,
  'Invalid Nigerian phone number (format: 0801234567 or +2348012345678)'
)

// Retailer schemas
const CreateRetailerSchema = z.object({
  shop_name: z.string().min(1, 'Shop name is required').max(255, 'Shop name too long'),
  owner_name: z.string().min(1, 'Owner name is required').max(255, 'Owner name too long'),
  phone: NigerianPhone,
  email: z.string().email('Invalid email address').optional().nullable().or(z.literal('')),
  address: z.string().max(500, 'Address too long').optional().nullable(),
  assigned_rep_id: z.string().uuid('Invalid rep ID').optional().nullable(),
  credit_limit: z.number().min(0, 'Credit limit cannot be negative').default(0),
})

const UpdateRetailerSchema = CreateRetailerSchema.partial().extend({
  status: z.enum(['active', 'inactive']).optional()
})

// Order schemas
const CreateOrderSchema = z.object({
  retailer_id: z.string().uuid('Invalid retailer ID'),
  items: z.array(z.object({
    product_id: z.string().uuid('Invalid product ID'),
    quantity: z.number().int().min(1, 'Quantity must be at least 1'),
    unit_price: z.number().min(0, 'Price cannot be negative'),
  })).min(1, 'At least one item is required'),
  payment_status: z.enum(['paid', 'unpaid', 'partial']).default('unpaid'),
  notes: z.string().max(1000, 'Notes too long').optional(),
})

// Payment schemas  
const CreatePaymentSchema = z.object({
  retailer_id: z.string().uuid('Invalid retailer ID'),
  amount: z.number().positive('Amount must be greater than 0'),
  payment_method: z.enum(['cash', 'bank_transfer', 'cheque', 'pos'], {
    errorMap: () => ({ message: 'Invalid payment method' })
  }),
  reference: z.string().max(255).optional(),
  notes: z.string().max(1000).optional(),
})

// Staff schemas
const CreateStaffSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  email: z.string().email('Invalid email address'),
  role: z.enum(['manager', 'sales_rep', 'warehouse'], {
    errorMap: () => ({ message: 'Invalid role' })
  }),
  phone: NigerianPhone.optional().nullable(),
})

// Product schemas
const CreateProductSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(255),
  sku: z.string().max(100).optional(),
  unit_price: z.number().min(0, 'Price cannot be negative'),
  cost_price: z.number().min(0, 'Cost cannot be negative').optional(),
  quantity: z.number().int().min(0, 'Quantity cannot be negative').default(0),
  low_stock_threshold: z.number().int().min(0).default(10),
  description: z.string().max(1000).optional(),
})

const UpdateProductSchema = CreateProductSchema.partial().extend({
  status: z.enum(['active', 'inactive']).optional()
})

/**
 * Parse and validate request body against a Zod schema
 * Returns either validated data or an error response
 */
function parseBody(schema, body) {
  const result = schema.safeParse(body)
  if (!result.success) {
    const errors = result.error.flatten().fieldErrors
    return {
      error: NextResponse.json({
        error: 'Validation failed',
        details: errors,
        message: Object.entries(errors)
          .map(([field, msgs]) => `${field}: ${msgs.join(', ')}`)
          .join('; ')
      }, { status: 400 }),
      data: null
    }
  }
  return { error: null, data: result.data }
}

/**
 * Extract and validate pagination parameters from request URL
 * Returns page, pageSize, from, and to for Supabase range queries
 */
function getPaginationParams(request) {
  const { searchParams } = new URL(request.url)
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '50', 10)))
  
  return {
    page,
    pageSize,
    from: (page - 1) * pageSize,
    to: (page - 1) * pageSize + pageSize - 1
  }
}

/**
 * Build paginated response with metadata
 */
function buildPaginatedResponse(data, count, page, pageSize) {
  return {
    data,
    pagination: {
      page,
      pageSize,
      total: count,
      totalPages: Math.ceil(count / pageSize),
      hasMore: (page * pageSize) < count,
      hasPrevious: page > 1
    }
  }
}

// Initialize Supabase client (server-side with service role for admin operations)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Helper to create authenticated Supabase client from request
async function getSupabaseClient() {
  return await createClient()
}

// Helper function to handle CORS
function handleCORS(response, request = null) {
  const allowedOrigins = (process.env.CORS_ORIGINS || process.env.NEXT_PUBLIC_BASE_URL || '').split(',').map(s => s.trim()).filter(Boolean)
  const origin = request?.headers?.get('origin') || ''
  const allowed = allowedOrigins.includes(origin) ? origin : (allowedOrigins[0] || '')
  
  if (allowed) {
    response.headers.set('Access-Control-Allow-Origin', allowed)
  }
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  response.headers.set('Access-Control-Allow-Credentials', 'true')
  return response
}

// OPTIONS handler for CORS
export async function OPTIONS(request) {
  return handleCORS(new NextResponse(null, { status: 200 }), request)
}

// Get current user's business ID  
async function getUserBusinessId(supabase) {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    console.log('[AUTH] Checking user:', user?.id, 'Error:', authError)
    
    if (!user) {
      console.log('[AUTH] No user found in session')
      return null
    }

    // Get user profile first - this works for ALL roles (admin, manager, sales_rep, warehouse)
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('id, role, business_id, status')
      .eq('auth_user_id', user.id)
      .maybeSingle()

    console.log('[AUTH] User profile query result:', {
      profile: userProfile,
      error: profileError,
      authUserId: user.id
    })

    if (!userProfile || !userProfile.business_id) {
      if (process.env.NODE_ENV === 'development') {
        console.log('No user profile or business_id found for user')
      }
      return null
    }

    if (userProfile.status !== 'active') {
      if (process.env.NODE_ENV === 'development') {
        console.log('User is not active:', userProfile.status)
      }
      return null
    }

    return { 
      businessId: userProfile.business_id, 
      role: userProfile.role, 
      userId: userProfile.id 
    }
  } catch (error) {
    console.error('Error in getUserBusinessId:', error)
    return null
  }
}

// ============================================
// SUBSCRIPTION ENFORCEMENT HELPERS
// ============================================

/**
 * Check if business subscription is active (trial or paid)
 */
async function checkSubscriptionStatus(businessId) {
  try {
    const isActive = await isSubscriptionActive(businessId)
    return isActive
  } catch (error) {
    console.error('Error checking subscription status:', error)
    return false
  }
}

/**
 * Check if business has access to a specific feature
 */
async function checkFeatureAccess(businessId, featureName) {
  try {
    const hasAccess = await hasFeature(businessId, featureName)
    return hasAccess
  } catch (error) {
    console.error('Error checking feature access:', error)
    return false
  }
}

/**
 * Middleware to enforce subscription status
 */
async function enforceSubscription(businessId) {
  const isActive = await checkSubscriptionStatus(businessId)
  if (!isActive) {
    return {
      error: 'Subscription expired',
      message: 'Your subscription has expired. Please upgrade to continue using the platform.',
      code: 'SUBSCRIPTION_EXPIRED'
    }
  }
  return null
}

/**
 * Middleware to enforce feature access
 */
async function enforceFeature(businessId, featureName, featureDisplayName) {
  const hasAccess = await checkFeatureAccess(businessId, featureName)
  if (!hasAccess) {
    return {
      error: 'Feature not available',
      message: `${featureDisplayName} is not available on your current plan. Please upgrade to access this feature.`,
      code: 'FEATURE_NOT_AVAILABLE',
      feature: featureName
    }
  }
  return null
}

// ============================================
// PERMISSION ENFORCEMENT HELPERS
// ============================================

function canEditCreditLimit(role) {
  return role === 'admin'
}

function canDeleteRecords(role) {
  return role === 'admin'
}

function canManageStaff(role) {
  return role === 'admin'
}

function canViewAllRetailers(role) {
  return ['admin', 'manager'].includes(role)
}

function canViewAllOrders(role) {
  return ['admin', 'manager', 'warehouse'].includes(role)
}

function canCreateOrders(role) {
  return ['admin', 'manager', 'sales_rep'].includes(role)
}

function canConfirmOrders(role) {
  return ['admin', 'manager'].includes(role)
}

function canManageInventory(role) {
  return ['admin', 'manager', 'warehouse'].includes(role)
}

function canEditProducts(role) {
  return ['admin', 'manager'].includes(role)
}

// Sales rep data filtering
function applySalesRepFilter(query, userContext, foreignKeyColumn = 'assigned_rep_id') {
  if (userContext.role === 'sales_rep') {
    return query.eq(foreignKeyColumn, userContext.userId)
  }
  return query
}

// Audit logging helper
async function logAuditEvent(supabase, userContext, action, details, entityType, resourceId) {
  try {
    // Ensure details is a JSON object if it's a string
    let detailsObj = details
    if (typeof details === 'string') {
      detailsObj = { message: details }
    }
    
    const logData = {
      business_id: userContext.businessId,
      user_id: userContext.userId,
      action,
      details: detailsObj,
      entity_type: entityType,
      resource_id: resourceId
    }
    
    console.log('Audit log data:', JSON.stringify(logData))
    
    const { error } = await supabase
      .from('audit_logs')
      .insert(logData)
    
    if (error) {
      console.error('Audit log insert error:', error)
    }
  } catch (error) {
    console.error('Audit log exception:', error)
  }
}

// Route handler function
async function handleRoute(request, { params }) {
  const { path = [] } = params
  const route = `/${path.join('/')}`
  const method = request.method

  try {
    const supabase = await getSupabaseClient()

    // ============================================
    // DASHBOARD ENDPOINTS
    // ============================================
    
    if (route === '/dashboard/metrics' && method === 'GET') {
      const userContext = await getUserBusinessId(supabase)
      if (!userContext) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      }

      // SUBSCRIPTION CHECK: Enforce active subscription
      const subscriptionError = await enforceSubscription(userContext.businessId)
      if (subscriptionError) {
        return handleCORS(NextResponse.json(subscriptionError, { status: 402 }))
      }

      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

      try {
        // OPTIMIZED: Only select needed columns and use database filtering
        // Get total sales today (only select total_amount, not all columns)
        const { data: salesToday } = await supabase
          .from('orders')
          .select('total_amount')
          .eq('business_id', userContext.businessId)
          .gte('created_at', today.toISOString())
          .in('order_status', ['confirmed', 'completed'])

        const totalSalesToday = salesToday?.reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0) || 0

        // Get total sales this month
        const { data: salesMonth } = await supabase
          .from('orders')
          .select('total_amount')
          .eq('business_id', userContext.businessId)
          .gte('created_at', startOfMonth.toISOString())
          .in('order_status', ['confirmed', 'completed'])

        const totalSalesMonth = salesMonth?.reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0) || 0

        // Get total debt (only select current_balance)
        const { data: retailers } = await supabase
          .from('retailers')
          .select('current_balance')
          .eq('business_id', userContext.businessId)
          .eq('status', 'active')

        const totalDebt = retailers?.reduce((sum, retailer) => sum + parseFloat(retailer.current_balance || 0), 0) || 0

        // OPTIMIZED: Get only top 10 overdue retailers using database filter
        const { data: overdueRetailers } = await supabase
          .from('retailers')
          .select('id, shop_name, owner_name, current_balance, credit_limit')
          .eq('business_id', userContext.businessId)
          .eq('status', 'active')
          .order('current_balance', { ascending: false })
          .limit(100) // Limit to reasonable number for filtering

        const topOverdueRetailers = (overdueRetailers || [])
          .filter(r => parseFloat(r.current_balance || 0) > parseFloat(r.credit_limit || 0))
          .slice(0, 10) // Only take top 10

        // OPTIMIZED: Get only top 10 low stock products
        const { data: allProducts } = await supabase
          .from('products')
          .select('id, name, stock_quantity, low_stock_threshold')
          .eq('business_id', userContext.businessId)
          .order('stock_quantity', { ascending: true })
          .limit(50) // Limit initial fetch

        const lowStockProducts = (allProducts || [])
          .filter(p => (p.stock_quantity || 0) <= (p.low_stock_threshold || 10))
          .slice(0, 10) // Only take top 10

        // OPTIMIZED: Get sales by rep with minimal data
        const { data: salesByRep } = await supabase
          .from('orders')
          .select('sales_rep_id, total_amount, users!orders_sales_rep_id_fkey(name)')
          .eq('business_id', userContext.businessId)
          .gte('created_at', today.toISOString())
          .in('order_status', ['confirmed', 'completed'])

        const repSales = {}
        salesByRep?.forEach(order => {
          const repName = order.users?.name || 'Unknown'
          repSales[repName] = (repSales[repName] || 0) + parseFloat(order.total_amount || 0)
        })

        // Get recent activity (already limited)
        const { data: recentActivity } = await supabase
          .from('audit_logs')
          .select('id, action, entity_type, details, created_at, users!audit_logs_user_id_fkey(name)')
          .eq('business_id', userContext.businessId)
          .order('created_at', { ascending: false })
          .limit(10)

        return handleCORS(NextResponse.json({
          totalSalesToday,
          totalSalesMonth,
          totalDebt,
          overdueRetailers: topOverdueRetailers,
          lowStockProducts,
          salesByRep: Object.entries(repSales).map(([name, total]) => ({ name, total })),
          recentActivity: recentActivity || []
        }))
      } catch (error) {
        console.error('Error fetching dashboard metrics:', error)
        // Return empty data instead of failing
        return handleCORS(NextResponse.json({
          totalSalesToday: 0,
          totalSalesMonth: 0,
          totalDebt: 0,
          overdueRetailers: [],
          lowStockProducts: [],
          salesByRep: [],
          recentActivity: []
        }))
      }
    }

    // ============================================
    // RETAILERS ENDPOINTS
    // ============================================

    if (route === '/retailers' && method === 'GET') {
      const userContext = await getUserBusinessId(supabase)
      if (!userContext) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }), request)
      }

      // Get pagination parameters
      const { page, pageSize, from, to } = getPaginationParams(request)

      // Build query with pagination
      let query = supabase
        .from('retailers')
        .select('*', { count: 'exact' })
        .eq('business_id', userContext.businessId)
        .order('created_at', { ascending: false })
        .range(from, to)

      // Apply sales rep filter - sales reps only see their assigned retailers
      query = applySalesRepFilter(query, userContext, 'assigned_rep_id')

      const { data: retailers, error, count } = await query

      if (error) throw error

      // Use admin client to fetch sales rep data (to bypass RLS)
      const { createClient } = await import('@supabase/supabase-js')
      const supabaseAdmin = createClient(
        supabaseUrl,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        }
      )

      // Manually fetch assigned rep data for each retailer using admin client
      const retailersWithRep = await Promise.all(
        (retailers || []).map(async (retailer) => {
          if (retailer.assigned_rep_id) {
            const { data: assignedRep, error: repError } = await supabaseAdmin
              .from('users')
              .select('id, name, email, role')
              .eq('id', retailer.assigned_rep_id)
              .single()
            
            if (repError) {
              console.error('Error fetching assigned rep for retailer', retailer.id, ':', repError)
            }
            
            return { ...retailer, users: assignedRep }
          }
          return { ...retailer, users: null }
        })
      )

      const response = buildPaginatedResponse(retailersWithRep, count, page, pageSize)
      return handleCORS(NextResponse.json(response), request)
    }

    if (route === '/retailers' && method === 'POST') {
      const userContext = await getUserBusinessId(supabase)
      if (!userContext) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      }

      // SUBSCRIPTION CHECK: Enforce active subscription
      const subscriptionError = await enforceSubscription(userContext.businessId)
      if (subscriptionError) {
        return handleCORS(NextResponse.json(subscriptionError, { status: 402 }))
      }

      // Check permission - only admin and manager can create retailers
      if (!['admin', 'manager'].includes(userContext.role)) {
        return handleCORS(NextResponse.json({ 
          error: 'Forbidden: Only admins and managers can create retailers' 
        }, { status: 403 }))
      }

      // PLAN LIMIT CHECK: Enforce max_retailers limit
      const { data: planData } = await supabase
        .from('businesses')
        .select('plans(features)')
        .eq('id', userContext.businessId)
        .single()

      const maxRetailers = planData?.plans?.features?.max_retailers || 999999

      // Count current retailers
      const { count: currentRetailers } = await supabase
        .from('retailers')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', userContext.businessId)

      if (currentRetailers >= maxRetailers) {
        return handleCORS(NextResponse.json({
          error: 'Retailer limit reached',
          message: `Your current plan allows ${maxRetailers} retailers. You have ${currentRetailers}. Please upgrade to add more.`,
          code: 'LIMIT_REACHED',
          upgradeUrl: '/settings/billing'
        }, { status: 402 }), request)
      }

      const body = await request.json()
      
      // Validate request body with Zod
      const { error: validationError, data } = parseBody(CreateRetailerSchema, body)
      if (validationError) return handleCORS(validationError, request)
      
      // DUPLICATE CHECK: Safe parameterized queries to prevent SQL injection
      // Check by shop name (case-insensitive)
      const { data: byName } = await supabase
        .from('retailers')
        .select('id, shop_name')
        .eq('business_id', userContext.businessId)
        .ilike('shop_name', data.shop_name.trim())
        .maybeSingle()

      // Check by phone (only if phone provided)
      const byPhone = data.phone ? await supabase
        .from('retailers')
        .select('id, phone')
        .eq('business_id', userContext.businessId)
        .eq('phone', data.phone.trim())
        .maybeSingle()
        .then(r => r.data) : null

      if (byName || byPhone) {
        const field = byName ? 'shop_name' : 'phone'
        const fieldLabel = byName ? 'shop name' : 'phone number'
        return handleCORS(NextResponse.json({
          error: 'Duplicate retailer',
          message: `A retailer with this ${fieldLabel} already exists.`,
          code: 'DUPLICATE_ENTRY',
          field
        }, { status: 409 }), request)
      }

      const { data: insertedData, error } = await supabase
        .from('retailers')
        .insert({
          business_id: userContext.businessId,
          shop_name: body.shop_name,
          owner_name: body.owner_name,
          phone: body.phone,
          email: body.email || null,
          address: body.address,
          assigned_rep_id: body.assigned_rep_id || null,
          credit_limit: body.credit_limit || 0,
          current_balance: 0,
          status: 'active'
        })
        .select()
        .single()

      if (error) throw error

      // Log audit event
      await logAuditEvent(
        supabase,
        userContext,
        'CREATE_RETAILER',
        `Created retailer: ${insertedData.shop_name}`,
        'retailer',
        insertedData.id
      )

      return handleCORS(NextResponse.json(insertedData), request)
    }

    if (route.startsWith('/retailers/') && method === 'PUT') {
      const userContext = await getUserBusinessId(supabase)
      if (!userContext) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      }

      // Check permission - only admin and manager can edit retailers
      if (!['admin', 'manager'].includes(userContext.role)) {
        return handleCORS(NextResponse.json({ 
          error: 'Forbidden: Only admins and managers can edit retailers' 
        }, { status: 403 }))
      }

      const retailerId = route.split('/')[2]
      const body = await request.json()

      // Check if trying to edit credit limit without permission
      if (body.credit_limit !== undefined && !canEditCreditLimit(userContext.role)) {
        return handleCORS(NextResponse.json({ 
          error: 'Forbidden: Only admins can edit credit limits' 
        }, { status: 403 }))
      }
      
      // DUPLICATE CHECK: Check if new shop_name conflicts with a DIFFERENT retailer
      if (body.shop_name) {
        const { data: nameConflict } = await supabase
          .from('retailers')
          .select('id')
          .eq('business_id', userContext.businessId)
          .ilike('shop_name', body.shop_name.trim())
          .neq('id', retailerId)
          .maybeSingle()

        if (nameConflict) {
          return handleCORS(NextResponse.json({
            error: 'Duplicate retailer',
            message: 'Another retailer with this shop name already exists.',
            code: 'DUPLICATE_ENTRY',
            field: 'shop_name'
          }, { status: 409 }))
        }
      }

      // DUPLICATE CHECK: Check if new phone conflicts with a DIFFERENT retailer
      if (body.phone) {
        const { data: phoneConflict } = await supabase
          .from('retailers')
          .select('id')
          .eq('business_id', userContext.businessId)
          .eq('phone', body.phone.trim())
          .neq('id', retailerId)
          .maybeSingle()

        if (phoneConflict) {
          return handleCORS(NextResponse.json({
            error: 'Duplicate retailer',
            message: 'Another retailer with this phone number already exists.',
            code: 'DUPLICATE_ENTRY',
            field: 'phone'
          }, { status: 409 }))
        }
      }
      
      const { data, error } = await supabase
        .from('retailers')
        .update({
          shop_name: body.shop_name,
          owner_name: body.owner_name,
          phone: body.phone,
          email: body.email || null,
          address: body.address,
          assigned_rep_id: body.assigned_rep_id || null,
          credit_limit: body.credit_limit,
          status: body.status
        })
        .eq('id', retailerId)
        .eq('business_id', userContext.businessId)
        .select()
        .single()

      if (error) throw error

      // Log audit event for credit limit changes
      if (body.credit_limit !== undefined) {
        await logAuditEvent(
          supabase,
          userContext,
          'update',
          {
            shop_name: body.shop_name,
            credit_limit: body.credit_limit,
            field_changed: 'credit_limit'
          },
          'retailer',
          retailerId
        )
      } else {
        // Log general retailer update
        await logAuditEvent(
          supabase,
          userContext,
          'update',
          {
            shop_name: body.shop_name,
            owner_name: body.owner_name,
            status: body.status
          },
          'retailer',
          retailerId
        )
      }

      return handleCORS(NextResponse.json(data))
    }

    if (route.startsWith('/retailers/') && method === 'DELETE') {
      const userContext = await getUserBusinessId(supabase)
      if (!userContext || userContext.role !== 'admin') {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 403 }))
      }

      const retailerId = route.split('/')[2]
      
      // Get retailer details before deleting
      const { data: retailer } = await supabase
        .from('retailers')
        .select('shop_name, owner_name')
        .eq('id', retailerId)
        .eq('business_id', userContext.businessId)
        .single()
      
      const { error } = await supabase
        .from('retailers')
        .delete()
        .eq('id', retailerId)
        .eq('business_id', userContext.businessId)

      if (error) throw error
      
      // Log audit event
      await logAuditEvent(
        supabase,
        userContext,
        'delete',
        {
          shop_name: retailer?.shop_name || 'Unknown',
          owner_name: retailer?.owner_name
        },
        'retailer',
        retailerId
      )
      
      return handleCORS(NextResponse.json({ success: true }))
    }

    // ============================================
    // PRODUCTS ENDPOINTS
    // ============================================

    if (route === '/products' && method === 'GET') {
      const userContext = await getUserBusinessId(supabase)
      if (!userContext) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }), request)
      }

      // Get pagination parameters
      const { page, pageSize, from, to } = getPaginationParams(request)

      const { data, error, count } = await supabase
        .from('products')
        .select('*', { count: 'exact' })
        .eq('business_id', userContext.businessId)
        .order('name')
        .range(from, to)

      if (error) throw error
      
      const response = buildPaginatedResponse(data || [], count, page, pageSize)
      return handleCORS(NextResponse.json(response), request)
    }

    if (route === '/products' && method === 'POST') {
      const userContext = await getUserBusinessId(supabase)
      if (!userContext) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      }

      // SUBSCRIPTION CHECK: Enforce active subscription
      const subscriptionError = await enforceSubscription(userContext.businessId)
      if (subscriptionError) {
        return handleCORS(NextResponse.json(subscriptionError, { status: 402 }))
      }

      // PLAN LIMIT CHECK: Enforce max_products limit
      const { data: planData } = await supabase
        .from('businesses')
        .select('plans(features)')
        .eq('id', userContext.businessId)
        .single()

      const maxProducts = planData?.plans?.features?.max_products || 999999

      // Count current products
      const { count: currentProducts } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', userContext.businessId)

      if (currentProducts >= maxProducts) {
        return handleCORS(NextResponse.json({
          error: 'Product limit reached',
          message: `Your current plan allows ${maxProducts} products. You have ${currentProducts}. Please upgrade to add more.`,
          code: 'LIMIT_REACHED',
          upgradeUrl: '/settings/billing'
        }, { status: 402 }), request)
      }

      const body = await request.json()
      
      // Validate request body with Zod
      const { error: validationError, data } = parseBody(CreateProductSchema, body)
      if (validationError) return handleCORS(validationError, request)
      
      // DUPLICATE CHECK: Check for duplicate product name (case-insensitive)
      const { data: nameExists } = await supabase
        .from('products')
        .select('id, name')
        .eq('business_id', userContext.businessId)
        .ilike('name', data.name.trim())
        .maybeSingle()

      if (nameExists) {
        return handleCORS(NextResponse.json({
          error: 'Duplicate product',
          message: `A product named "${nameExists.name}" already exists.`,
          code: 'DUPLICATE_ENTRY',
          field: 'name'
        }, { status: 409 }))
      }

      // DUPLICATE CHECK: Check for duplicate SKU (only if SKU provided — SKU is optional)
      if (data.sku && data.sku.trim()) {
        const { data: skuExists } = await supabase
          .from('products')
          .select('id, sku')
          .eq('business_id', userContext.businessId)
          .eq('sku', data.sku.trim().toUpperCase())
          .maybeSingle()

        if (skuExists) {
          return handleCORS(NextResponse.json({
            error: 'Duplicate SKU',
            message: `SKU "${data.sku}" is already used by another product.`,
            code: 'DUPLICATE_ENTRY',
            field: 'sku'
          }, { status: 409 }))
        }
      }
      
      const { data: product, error } = await supabase
        .from('products')
        .insert({
          business_id: userContext.businessId,
          name: data.name,
          sku: data.sku ? data.sku.trim().toUpperCase() : null,
          cost_price: data.cost_price || 0,
          selling_price: data.unit_price,
          stock_quantity: data.quantity,
          low_stock_threshold: data.low_stock_threshold
        })
        .select()
        .single()

      if (error) throw error
      
      // Log audit event
      await logAuditEvent(
        supabase,
        userContext,
        'create',
        {
          name: body.name,
          sku: body.sku,
          selling_price: body.selling_price,
          stock_quantity: body.stock_quantity
        },
        'product',
        data.id
      )
      
      return handleCORS(NextResponse.json(data))
    }

    if (route.startsWith('/products/') && method === 'PUT') {
      const userContext = await getUserBusinessId(supabase)
      if (!userContext) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      }

      const productId = route.split('/')[2]
      const body = await request.json()
      
      // DUPLICATE CHECK: Check name conflict with a DIFFERENT product
      if (body.name) {
        const { data: nameConflict } = await supabase
          .from('products')
          .select('id')
          .eq('business_id', userContext.businessId)
          .ilike('name', body.name.trim())
          .neq('id', productId)
          .maybeSingle()

        if (nameConflict) {
          return handleCORS(NextResponse.json({
            error: 'Duplicate product',
            message: 'Another product with this name already exists.',
            code: 'DUPLICATE_ENTRY',
            field: 'name'
          }, { status: 409 }))
        }
      }

      // DUPLICATE CHECK: Check SKU conflict with a DIFFERENT product
      if (body.sku && body.sku.trim()) {
        const { data: skuConflict } = await supabase
          .from('products')
          .select('id')
          .eq('business_id', userContext.businessId)
          .eq('sku', body.sku.trim().toUpperCase())
          .neq('id', productId)
          .maybeSingle()

        if (skuConflict) {
          return handleCORS(NextResponse.json({
            error: 'Duplicate SKU',
            message: `SKU "${body.sku}" is already used by another product.`,
            code: 'DUPLICATE_ENTRY',
            field: 'sku'
          }, { status: 409 }))
        }
      }
      
      const { data, error } = await supabase
        .from('products')
        .update({
          name: body.name,
          sku: body.sku ? body.sku.trim().toUpperCase() : null,
          cost_price: body.cost_price,
          selling_price: body.selling_price,
          stock_quantity: body.stock_quantity,
          low_stock_threshold: body.low_stock_threshold
        })
        .eq('id', productId)
        .eq('business_id', userContext.businessId)
        .select()
        .single()

      if (error) throw error
      
      // Log audit event
      await logAuditEvent(
        supabase,
        userContext,
        'update',
        {
          name: body.name,
          sku: body.sku,
          selling_price: body.selling_price,
          stock_quantity: body.stock_quantity
        },
        'product',
        productId
      )
      
      return handleCORS(NextResponse.json(data))
    }

    // ============================================
    // PATCH: Update Product (for empty_item_id linking)
    // ============================================
    if (route.startsWith('/products/') && method === 'PATCH') {
      const userContext = await getUserBusinessId(supabase)
      if (!userContext) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }), request)
      }

      if (!['admin', 'manager'].includes(userContext.role)) {
        return handleCORS(NextResponse.json({ error: 'Forbidden' }, { status: 403 }), request)
      }

      const productId = route.split('/')[2] // Extract ID from /products/:id
      const body = await request.json()
      
      // Validate with partial schema (allows updating specific fields)
      const { error: validationError, data } = parseBody(UpdateProductSchema, body)
      if (validationError) return handleCORS(validationError, request)

      // Build update object from validated data
      const updateData = {
        ...data,
        updated_at: new Date().toISOString()
      }

      // Update product with validated data
      const { data: product, error: updateError } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', productId)
        .eq('business_id', userContext.businessId)
        .select()
        .single()

      if (updateError) {
        console.error('Error updating product:', updateError)
        return handleCORS(NextResponse.json({ error: updateError.message }, { status: 400 }), request)
      }

      if (!product) {
        return handleCORS(NextResponse.json({ error: 'Product not found' }, { status: 404 }), request)
      }

      return handleCORS(NextResponse.json(product), request)
    }

    if (route.startsWith('/products/') && method === 'DELETE') {
      const userContext = await getUserBusinessId(supabase)
      if (!userContext || userContext.role !== 'admin') {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 403 }))
      }

      const productId = route.split('/')[2]
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId)
        .eq('business_id', userContext.businessId)

      if (error) throw error
      return handleCORS(NextResponse.json({ success: true }))
    }

    // ============================================
    // STOCK MOVEMENTS ENDPOINTS
    // ============================================

    if (route === '/stock-movements' && method === 'GET') {
      const userContext = await getUserBusinessId(supabase)
      if (!userContext) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      }

      const { data, error } = await supabase
        .from('stock_movements')
        .select('*, product:products(name, sku)')
        .eq('business_id', userContext.businessId)
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) throw error
      return handleCORS(NextResponse.json(data || []))
    }

    if (route === '/stock-movements' && method === 'POST') {
      const userContext = await getUserBusinessId(supabase)
      if (!userContext) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      }

      // Check permission - admin, manager, or warehouse can manage inventory
      if (!canManageInventory(userContext.role)) {
        return handleCORS(NextResponse.json({ error: 'Forbidden: Insufficient permissions' }, { status: 403 }))
      }

      const body = await request.json()
      const { product_id, movement_type, quantity, notes } = body

      // Validate inputs
      if (!product_id || !movement_type || !quantity) {
        return handleCORS(NextResponse.json({ error: 'Missing required fields' }, { status: 400 }))
      }

      if (!['in', 'out'].includes(movement_type)) {
        return handleCORS(NextResponse.json({ error: 'Invalid movement_type. Must be "in" or "out"' }, { status: 400 }))
      }

      const qty = parseInt(quantity)
      if (isNaN(qty) || qty <= 0) {
        return handleCORS(NextResponse.json({ error: 'Quantity must be a positive number' }, { status: 400 }))
      }

      // Get current product stock
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('stock_quantity, name')
        .eq('id', product_id)
        .eq('business_id', userContext.businessId)
        .single()

      if (productError || !product) {
        return handleCORS(NextResponse.json({ error: 'Product not found' }, { status: 404 }))
      }

      // Calculate new stock quantity
      const currentStock = product.stock_quantity || 0
      const newStock = movement_type === 'in' ? currentStock + qty : currentStock - qty

      if (newStock < 0) {
        return handleCORS(NextResponse.json({ 
          error: `Insufficient stock. Current: ${currentStock}, Requested: ${qty}` 
        }, { status: 400 }))
      }

      // Update product stock
      const { error: updateError } = await supabase
        .from('products')
        .update({ stock_quantity: newStock })
        .eq('id', product_id)
        .eq('business_id', userContext.businessId)

      if (updateError) throw updateError

      // Create stock movement record
      const { data: movement, error: movementError } = await supabase
        .from('stock_movements')
        .insert({
          business_id: userContext.businessId,
          product_id,
          movement_type,
          quantity: qty,
          notes: notes || null
        })
        .select()
        .single()

      if (movementError) throw movementError

      // Log audit event
      await logAuditEvent(
        supabase,
        userContext,
        'STOCK_MOVEMENT',
        `${movement_type === 'in' ? 'Added' : 'Removed'} ${qty} units of ${product.name}. New stock: ${newStock}`,
        'stock_movement',
        movement.id
      )

      // Check for low stock and send alert
      const threshold = product.low_stock_threshold || 10
      if (newStock <= threshold && newStock > 0) {
        // Send email alert asynchronously (don't wait for it)
        sendLowStockAlert(userContext.businessId, product, newStock, threshold).catch(err => {
          console.error('Failed to send low stock alert:', err)
        })
      }

      return handleCORS(NextResponse.json(movement))
    }

    // ============================================
    // ORDERS ENDPOINTS
    // ============================================

    if (route === '/orders' && method === 'GET') {
      const userContext = await getUserBusinessId(supabase)
      if (!userContext) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }), request)
      }

      // Get pagination parameters and date filters
      const { page, pageSize, from, to } = getPaginationParams(request)
      const url = new URL(request.url)
      const dateFrom = url.searchParams.get('from')
      const dateTo = url.searchParams.get('to')

      // Build query with order items and products - explicitly select new workflow fields
      let query = supabase
        .from('orders')
        .select(`
          *,
          order_status,
          delivery_status,
          is_legacy_order,
          confirmed_by,
          confirmed_at,
          packed_at,
          dispatched_at,
          delivered_at,
          delivery_reference,
          driver_name,
          vehicle_number,
          retailers(shop_name, owner_name),
          order_items(*, product:products(name, sku))
        `, { count: 'exact' })
        .eq('business_id', userContext.businessId)

      // Apply date range filters
      if (dateFrom) query = query.gte('created_at', dateFrom)
      if (dateTo) query = query.lte('created_at', dateTo)

      query = query.order('created_at', { ascending: false })
        .range(from, to)

      // Apply sales rep filter - sales reps only see their own orders
      query = applySalesRepFilter(query, userContext, 'sales_rep_id')

      const { data: orders, error, count } = await query

      if (error) {
        console.error('Orders query error:', error)
        throw error
      }

      // Use admin client to fetch sales rep data (to bypass RLS)
      const { createClient } = await import('@supabase/supabase-js')
      const supabaseAdmin = createClient(
        supabaseUrl,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        }
      )

      // Manually fetch sales rep data for each order using admin client
      const ordersWithSalesRep = await Promise.all(
        (orders || []).map(async (order) => {
          if (order.sales_rep_id) {
            const { data: salesRep, error: repError } = await supabaseAdmin
              .from('users')
              .select('id, name, email, role')
              .eq('id', order.sales_rep_id)
              .single()
            
            if (repError) {
              console.error('Error fetching sales rep for order', order.id, ':', repError)
            }
            
            return { 
              ...order, 
              sales_rep: salesRep,
              sales_rep_name: salesRep?.name || 'Unassigned',
              retailer_name: order.retailers?.shop_name || 'Unknown'
            }
          }
          return { 
            ...order, 
            sales_rep: null,
            sales_rep_name: 'Unassigned',
            retailer_name: order.retailers?.shop_name || 'Unknown'
          }
        })
      )
      
      const response = buildPaginatedResponse(ordersWithSalesRep, count, page, pageSize)
      return handleCORS(NextResponse.json(response), request)
    }

    // GET single order with items
    if (route.startsWith('/orders/') && !route.endsWith('/items') && method === 'GET') {
      const userContext = await getUserBusinessId(supabase)
      if (!userContext) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      }

      // Extract order ID from route
      const orderId = route.split('/orders/')[1]

      // Fetch order with items
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select(`
          *,
          order_status,
          delivery_status,
          is_legacy_order,
          confirmed_by,
          confirmed_at,
          packed_at,
          dispatched_at,
          delivered_at,
          delivery_reference,
          driver_name,
          vehicle_number,
          retailers(shop_name, owner_name)
        `)
        .eq('id', orderId)
        .eq('business_id', userContext.businessId)
        .single()

      if (orderError) {
        console.error('Order query error:', orderError)
        return handleCORS(NextResponse.json({ error: 'Order not found' }, { status: 404 }))
      }

      // Fetch order items
      const { data: items, error: itemsError } = await supabase
        .from('order_items')
        .select(`
          *,
          product:products(name, sku)
        `)
        .eq('order_id', orderId)

      if (itemsError) {
        console.error('Order items query error:', itemsError)
      }

      // Format response
      const response = {
        ...order,
        retailer_name: order.retailers?.shop_name || 'Unknown',
        items: (items || []).map(item => ({
          ...item,
          product_name: item.product?.name || 'Unknown Product'
        }))
      }

      return handleCORS(NextResponse.json(response))
    }

    if (route === '/orders' && method === 'POST') {
      const userContext = await getUserBusinessId(supabase)
      if (!userContext) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }), request)
      }

      // SUBSCRIPTION CHECK: Enforce active subscription
      const subscriptionError = await enforceSubscription(userContext.businessId)
      if (subscriptionError) {
        return handleCORS(NextResponse.json(subscriptionError, { status: 402 }), request)
      }

      // Check permission
      if (!canCreateOrders(userContext.role)) {
        return handleCORS(NextResponse.json({ 
          error: 'Forbidden: You do not have permission to create orders' 
        }, { status: 403 }), request)
      }

      const body = await request.json()
      
      // Validate request body with Zod
      const { error: validationError, data } = parseBody(CreateOrderSchema, body)
      if (validationError) return handleCORS(validationError, request)
      
      // Calculate total for double-submit check
      const calculatedTotal = data.items.reduce((sum, item) => 
        sum + (item.quantity * item.unit_price), 0
      )
      
      // DOUBLE-SUBMIT GUARD: Check for identical order in the last 60 seconds
      const sixtySecondsAgo = new Date(Date.now() - 60000).toISOString()
      const { data: recentOrder } = await supabase
        .from('orders')
        .select('id, created_at')
        .eq('business_id', userContext.businessId)
        .eq('retailer_id', data.retailer_id)
        .eq('sales_rep_id', userContext.userId)
        .gte('total_amount', calculatedTotal - 0.01)  // Allow tiny rounding difference
        .lte('total_amount', calculatedTotal + 0.01)
        .gte('created_at', sixtySecondsAgo)
        .maybeSingle()

      if (recentOrder) {
        return handleCORS(NextResponse.json({
          error: 'Duplicate order',
          message: 'An identical order was just created for this retailer. If this is intentional, please wait 60 seconds and try again.',
          code: 'DUPLICATE_ORDER'
        }, { status: 409 }))
      }
      
      // STEP 1: Validate stock availability for all items
      for (const item of data.items) {
        const { data: product } = await supabase
          .from('products')
          .select('stock_quantity, name')
          .eq('id', item.product_id)
          .eq('business_id', userContext.businessId)
          .single()

        if (!product) {
          return handleCORS(NextResponse.json({ 
            error: `Product not found: ${item.product_id}` 
          }, { status: 404 }))
        }

        if (product.stock_quantity < item.quantity) {
          return handleCORS(NextResponse.json({ 
            error: `Insufficient stock for ${product.name}. Available: ${product.stock_quantity}, Requested: ${item.quantity}` 
          }, { status: 400 }))
        }
      }

      // STEP 2: Get retailer details and check credit limit
      const { data: retailer } = await supabase
        .from('retailers')
        .select('current_balance, credit_limit, status, shop_name')
        .eq('id', body.retailer_id)
        .single()

      if (!retailer) {
        return handleCORS(NextResponse.json({ 
          error: 'Retailer not found' 
        }, { status: 404 }))
      }

      if (retailer.status === 'blocked') {
        return handleCORS(NextResponse.json({ 
          error: 'Retailer is blocked due to credit limit exceeded' 
        }, { status: 400 }))
      }

      // STEP 3: Determine order status based on credit validation
      let orderStatus = 'pending'
      let deliveryStatus = 'not_started'
      let requiresCreditApproval = false

      if (body.payment_status === 'credit' || body.payment_status === 'partial') {
        const projectedBalance = parseFloat(retailer.current_balance) + parseFloat(body.total_amount)
        const creditLimit = parseFloat(retailer.credit_limit)
        
        if (projectedBalance > creditLimit) {
          // Exceeds credit limit - requires approval
          orderStatus = 'awaiting_credit_approval'
          requiresCreditApproval = true
        }
      }

      // STEP 4: Create order with new workflow fields
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          business_id: userContext.businessId,
          retailer_id: body.retailer_id,
          sales_rep_id: body.sales_rep_id || (userContext.role === 'sales_rep' ? userContext.userId : userContext.userId),
          total_amount: body.total_amount,
          payment_status: body.payment_status,
          status: 'pending', // Keep old status for backward compatibility
          order_status: orderStatus, // New structured status
          delivery_status: deliveryStatus,
          is_legacy_order: false // Mark as new workflow order
        })
        .select()
        .single()

      if (orderError) throw orderError

      // STEP 5: Create order items (DO NOT deduct stock yet - wait for approval)
      for (const item of body.items) {
        const { error: itemError } = await supabase
          .from('order_items')
          .insert({
            order_id: order.id,
            product_id: item.product_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.total_price
          })

        if (itemError) throw itemError
      }

      // STEP 6: Send notifications based on order status
      try {
        const {createClient: createAdminClient} = await import('@supabase/supabase-js')
        const supabaseAdmin = createAdminClient(
          supabaseUrl,
          process.env.SUPABASE_SERVICE_ROLE_KEY
        )
        
        const {data: salesRep} = await supabaseAdmin
          .from('users')
          .select('name')
          .eq('id', order.sales_rep_id)
          .single()

        if (requiresCreditApproval) {
          // CRITICAL: Credit approval required
          await sendNotification({
            title: 'Credit Approval Required',
            message: `Order #${order.id.substring(0, 8)} for ${retailer.shop_name} (₦${parseFloat(body.total_amount).toLocaleString()}) exceeds credit limit. Created by ${salesRep?.name || 'Sales Rep'}. Approval required.`,
            type: 'credit',
            targetRole: 'all',
            businessId: userContext.businessId,
            triggeredBy: userContext.userId,
            relatedTable: 'orders',
            relatedRecordId: order.id
          })
        } else {
          // Regular order notification
          await sendNotification({
            title: 'New Order Created',
            message: `Order #${order.id.substring(0, 8)} for ${retailer.shop_name} (₦${parseFloat(body.total_amount).toLocaleString()}) created by ${salesRep?.name || 'Sales Rep'}. Awaiting approval.`,
            type: 'order',
            targetRole: 'all',
            businessId: userContext.businessId,
            triggeredBy: userContext.userId,
            relatedTable: 'orders',
            relatedRecordId: order.id
          })
        }
      } catch (notifError) {
        console.error('Failed to send order notification:', notifError)
      }

      // Send large order email alert (async, don't block response)
      sendLargeOrderAlert(userContext.businessId, order, retailer, body.items, 100000).catch(err => {
        console.error('Failed to send large order alert:', err)
      })

      // Log audit event
      await logAuditEvent(
        supabase,
        userContext,
        'create',
        {
          order_id: order.id,
          retailer_name: retailer.shop_name,
          total_amount: body.total_amount,
          payment_status: body.payment_status,
          order_status: orderStatus,
          requires_approval: requiresCreditApproval
        },
        'order',
        order.id
      )

      return handleCORS(NextResponse.json({
        ...order,
        requires_credit_approval: requiresCreditApproval,
        message: requiresCreditApproval 
          ? 'Order created. Awaiting credit approval from manager/admin.'
          : 'Order created successfully. Awaiting manager approval.'
      }))
    }

    if (route.startsWith('/orders/') && route.endsWith('/items') && method === 'GET') {
      const userContext = await getUserBusinessId(supabase)
      if (!userContext) {

      // STEP 8: Process bottle exchange if provided
      if (body.bottle_exchange && body.bottle_exchange.enabled && body.bottle_exchange.empties && body.bottle_exchange.empties.length > 0) {
        console.log('Processing bottle exchange for order:', order.id)
        
        // Use admin client for bottle exchange
        const adminSupabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.SUPABASE_SERVICE_ROLE_KEY
        )

        for (const empty of body.bottle_exchange.empties) {
          if (!empty.empty_item_id || !empty.quantity) continue
          
          const quantity = parseInt(empty.quantity)

          // Add empties to warehouse inventory
          const { data: existing } = await adminSupabase
            .from('warehouse_empty_inventory')
            .select('quantity_available')
            .eq('business_id', userContext.businessId)
            .eq('empty_item_id', empty.empty_item_id)
            .maybeSingle()

          if (existing) {
            await adminSupabase
              .from('warehouse_empty_inventory')
              .update({ 
                quantity_available: existing.quantity_available + quantity,
                updated_at: new Date().toISOString()
              })
              .eq('business_id', userContext.businessId)
              .eq('empty_item_id', empty.empty_item_id)
          } else {
            await adminSupabase
              .from('warehouse_empty_inventory')
              .insert({
                business_id: userContext.businessId,
                empty_item_id: empty.empty_item_id,
                quantity_available: quantity
              })
          }

          // Log movement
          await adminSupabase
            .from('empty_movements')
            .insert({
              business_id: userContext.businessId,
              empty_item_id: empty.empty_item_id,
              retailer_id: body.retailer_id,
              type: 'returned_from_retailer',
              quantity,
              reference_type: 'order',
              reference_id: order.id,
              notes: `Customer brought empties with order ${order.id.slice(0,8)}`,
              created_by: userContext.userId
            })
        }

        const totalEmpties = body.bottle_exchange.empties.reduce((sum, e) => sum + parseInt(e.quantity || 0), 0)
        console.log(`✅ Bottle exchange processed: ${totalEmpties} empties added to warehouse`)
      }

        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      }

      const orderId = route.split('/')[2]
      const { data, error } = await supabase
        .from('order_items')
        .select('*, products(name, sku)')
        .eq('order_id', orderId)

      if (error) throw error
      return handleCORS(NextResponse.json(data || []))
    }

    // Update order status (NEW WORKFLOW - approve/reject/dispatch/deliver)
    if (route.startsWith('/orders/') && method === 'PUT') {
      const userContext = await getUserBusinessId(supabase)
      if (!userContext) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      }

      const orderId = route.split('/')[2]
      const body = await request.json()
      
      // Get current order state
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('id', orderId)
        .eq('business_id', userContext.businessId)
        .single()

      if (orderError) throw orderError
      if (!order) {
        return handleCORS(NextResponse.json({ error: 'Order not found' }, { status: 404 }))
      }

      // Initialize update object
      let updateData = {}
      let shouldReserveStock = false
      let shouldReleaseStock = false
      let notificationTitle = ''
      let notificationMessage = ''
      let notificationCategory = 'general'
      let notificationTargetRoles = ['admin', 'manager'] // Default: admin and manager

      // ========================================
      // WORKFLOW ACTIONS
      // ========================================

      // ACTION 1: APPROVE ORDER (Manager/Admin)
      if (body.action === 'approve') {
        if (!['admin', 'manager'].includes(userContext.role)) {
          return handleCORS(NextResponse.json({ 
            error: 'Forbidden: Only admins and managers can approve orders' 
          }, { status: 403 }))
        }

        // Validate stock availability before approval
        for (const item of order.order_items) {
          const { data: product } = await supabase
            .from('products')
            .select('stock_quantity, name')
            .eq('id', item.product_id)
            .single()

          if (product.stock_quantity < item.quantity) {
            return handleCORS(NextResponse.json({ 
              error: `Insufficient stock for ${product.name}: requested ${item.quantity}, available ${product.stock_quantity}` 
            }, { status: 400 }))
          }
        }

        updateData = {
          order_status: 'confirmed',
          delivery_status: 'preparing',
          confirmed_by: userContext.userId,
          confirmed_at: new Date().toISOString(),
          status: 'confirmed' // Keep old status for compatibility
        }
        
        shouldReserveStock = true
        notificationTitle = 'Order Ready for Dispatch'
        notificationMessage = `Order #${orderId.substring(0, 8)} for {RETAILER_NAME} is ready for delivery.`
        notificationCategory = 'dispatch'
        notificationTargetRoles = ['warehouse'] // Only warehouse users
      }

      // ACTION 2: REJECT ORDER (Manager/Admin)
      else if (body.action === 'reject') {
        if (!['admin', 'manager'].includes(userContext.role)) {
          return handleCORS(NextResponse.json({ 
            error: 'Forbidden: Only admins and managers can reject orders' 
          }, { status: 403 }))
        }

        updateData = {
          order_status: 'cancelled',
          delivery_status: 'not_started',
          status: 'cancelled'
        }
        
        notificationTitle = 'Order Rejected'
        notificationMessage = `Order #${orderId.substring(0, 8)} for {RETAILER_NAME} has been rejected. Reason: ${body.reason || 'Not specified'}.`
      }

      // ACTION 3: MARK AS PACKED (Warehouse)
      else if (body.action === 'pack') {
        if (!['admin', 'manager', 'warehouse'].includes(userContext.role)) {
          return handleCORS(NextResponse.json({ 
            error: 'Forbidden: Only warehouse staff can pack orders' 
          }, { status: 403 }))
        }

        if (order.order_status !== 'confirmed' || order.delivery_status !== 'preparing') {
          return handleCORS(NextResponse.json({ 
            error: 'Order must be in "preparing" status to be packed' 
          }, { status: 400 }))
        }

        updateData = {
          delivery_status: 'packed',
          packed_at: new Date().toISOString()
        }
        
        notificationTitle = 'Order Packed'
        notificationMessage = `Order #${orderId.substring(0, 8)} for {RETAILER_NAME} has been packed and is ready for dispatch.`
      }

      // ACTION 4: MARK AS OUT FOR DELIVERY (Warehouse)
      else if (body.action === 'dispatch') {
        if (!['admin', 'manager', 'warehouse'].includes(userContext.role)) {
          return handleCORS(NextResponse.json({ 
            error: 'Forbidden: Only warehouse staff can dispatch orders' 
          }, { status: 403 }))
        }

        if (order.delivery_status !== 'packed') {
          return handleCORS(NextResponse.json({ 
            error: 'Order must be packed before dispatch' 
          }, { status: 400 }))
        }

        updateData = {
          delivery_status: 'out_for_delivery',
          dispatched_at: new Date().toISOString(),
          driver_name: body.driver_name || null,
          vehicle_number: body.vehicle_number || null,
          delivery_reference: body.delivery_reference || `DEL-${Date.now()}`
        }
        
        notificationTitle = 'Order Dispatched'
        notificationMessage = `Order #${orderId.substring(0, 8)} for {RETAILER_NAME} is out for delivery. Driver: ${body.driver_name || 'N/A'}, Vehicle: ${body.vehicle_number || 'N/A'}.`
      }

      // ACTION 5: MARK AS DELIVERED (Warehouse/Manager)
      else if (body.action === 'deliver') {
        if (!['admin', 'manager', 'warehouse'].includes(userContext.role)) {
          return handleCORS(NextResponse.json({ 
            error: 'Forbidden: Only warehouse staff can mark as delivered' 
          }, { status: 403 }))
        }

        if (order.delivery_status !== 'out_for_delivery') {
          return handleCORS(NextResponse.json({ 
            error: 'Order must be out for delivery before marking as delivered' 
          }, { status: 400 }))
        }

        updateData = {
          order_status: 'completed',
          delivery_status: 'delivered',
          delivered_at: new Date().toISOString(),
          status: 'delivered' // Old status for compatibility
        }

        // Update retailer balance for credit orders
        if (order.payment_status === 'credit' || order.payment_status === 'partial') {
          const { data: retailer } = await supabase
            .from('retailers')
            .select('current_balance')
            .eq('id', order.retailer_id)
            .single()

          const newBalance = parseFloat(retailer.current_balance) + parseFloat(order.total_amount)
          
          await supabase
            .from('retailers')
            .update({ current_balance: newBalance })
            .eq('id', order.retailer_id)
        }

        // AUTOMATIC EMPTY BOTTLE ISSUANCE
        // When order is delivered, automatically issue empties to retailer for products with linked empties
        try {
          // Use admin client to bypass RLS
          const { createClient: createAdminClient } = await import('@supabase/supabase-js')
          const adminSupabase = createAdminClient(
            supabaseUrl,
            process.env.SUPABASE_SERVICE_ROLE_KEY,
            {
              auth: {
                autoRefreshToken: false,
                persistSession: false
              }
            }
          )

          // Get order items
          const { data: orderItems } = await adminSupabase
            .from('order_items')
            .select('product_id, quantity')
            .eq('order_id', orderId)

          if (orderItems && orderItems.length > 0) {
            // Get products with their linked empty items
            const productIds = orderItems.map(item => item.product_id)
            const { data: products } = await adminSupabase
              .from('products')
              .select('id, name, empty_item_id')
              .in('id', productIds)
              .not('empty_item_id', 'is', null)

            console.log(`🔍 Found ${products?.length || 0} products with linked empties for order ${orderId}`)

            // Create a map of product_id to empty_item_id
            const productEmptyMap = {}
            products?.forEach(product => {
              productEmptyMap[product.id] = product.empty_item_id
            })

            // Calculate empties to issue for each empty item type
            const emptiesToIssue = {}
            orderItems.forEach(item => {
              const emptyItemId = productEmptyMap[item.product_id]
              if (emptyItemId) {
                emptiesToIssue[emptyItemId] = (emptiesToIssue[emptyItemId] || 0) + item.quantity
              }
            })

            console.log(`📦 Empties to issue for order ${orderId}:`, emptiesToIssue)

            // Issue empties to retailer
            for (const [emptyItemId, quantity] of Object.entries(emptiesToIssue)) {
              // Check if retailer already has a balance for this empty item
              const { data: existingBalance } = await adminSupabase
                .from('retailer_empty_balances')
                .select('quantity_outstanding')
                .eq('business_id', userContext.business_id)
                .eq('retailer_id', order.retailer_id)
                .eq('empty_item_id', emptyItemId)
                .maybeSingle()

              if (existingBalance) {
                // Update existing balance
                const { error: updateError } = await adminSupabase
                  .from('retailer_empty_balances')
                  .update({ 
                    quantity_outstanding: existingBalance.quantity_outstanding + quantity,
                    updated_at: new Date().toISOString()
                  })
                  .eq('business_id', userContext.business_id)
                  .eq('retailer_id', order.retailer_id)
                  .eq('empty_item_id', emptyItemId)

                if (updateError) {
                  console.error('Error updating retailer balance:', updateError)
                } else {
                  console.log(`✅ Updated balance for empty ${emptyItemId}: ${existingBalance.quantity_outstanding} + ${quantity}`)
                }
              } else {
                // Create new balance record
                const { error: insertError } = await adminSupabase
                  .from('retailer_empty_balances')
                  .insert({
                    business_id: userContext.business_id,
                    retailer_id: order.retailer_id,
                    empty_item_id: emptyItemId,
                    quantity_outstanding: quantity
                  })

                if (insertError) {
                  console.error('Error creating retailer balance:', insertError)
                } else {
                  console.log(`✅ Created new balance for empty ${emptyItemId}: ${quantity}`)
                }
              }

              // Log the empty movement
              const { error: movementError } = await adminSupabase
                .from('empty_movements')
                .insert({
                  business_id: userContext.business_id,
                  empty_item_id: emptyItemId,
                  retailer_id: order.retailer_id,
                  type: 'issued_to_retailer',
                  quantity: quantity,
                  reference_type: 'order',
                  reference_id: orderId,
                  notes: `Automatic empty issuance for order #${orderId.substring(0, 8)}`,
                  created_by: userContext.id
                })

              if (movementError) {
                console.error('Error logging empty movement:', movementError)
              }
            }

            console.log(`✅ Automatically issued empties for order ${orderId}:`, emptiesToIssue)
          } else {
            console.log(`ℹ️ No order items found for order ${orderId}`)
          }
        } catch (emptyError) {
          console.error('❌ Error issuing empties:', emptyError)
          // Don't fail the order delivery if empty issuance fails
        }
        
        notificationTitle = 'Order Delivered'
        notificationMessage = `Order #${orderId.substring(0, 8)} for {RETAILER_NAME} has been successfully delivered.`
      }

      // ACTION 6: MARK AS FAILED DELIVERY (Warehouse/Manager)
      else if (body.action === 'fail_delivery') {
        if (!['admin', 'manager', 'warehouse'].includes(userContext.role)) {
          return handleCORS(NextResponse.json({ 
            error: 'Forbidden: Only warehouse staff can mark delivery as failed' 
          }, { status: 403 }))
        }

        updateData = {
          delivery_status: 'failed',
          order_status: 'cancelled',
          status: 'cancelled'
        }
        
        shouldReleaseStock = true
        notificationTitle = 'Delivery Failed'
        notificationMessage = `Delivery failed for Order #${orderId.substring(0, 8)} for {RETAILER_NAME}. Stock has been returned. Reason: ${body.reason || 'Not specified'}.`
      }

      // ACTION 7: LEGACY - Simple status update (for backward compatibility)
      else if (body.status) {
        // This maintains backward compatibility with old order update calls
        const requestedStatus = body.status
        const canApprove = canConfirmOrders(userContext.role)
        const canDispatch = ['admin', 'manager', 'warehouse'].includes(userContext.role)
        
        if (requestedStatus === 'confirmed' || requestedStatus === 'approved' || requestedStatus === 'rejected') {
          if (!canApprove) {
            return handleCORS(NextResponse.json({ 
              error: 'Forbidden: Only admins and managers can approve/reject orders' 
            }, { status: 403 }))
          }
        } else if (requestedStatus === 'dispatched' || requestedStatus === 'delivered') {
          if (!canDispatch) {
            return handleCORS(NextResponse.json({ 
              error: 'Forbidden: Insufficient permissions for dispatch operations' 
            }, { status: 403 }))
          }
        }

        updateData = { status: body.status }
      }

      // ========================================
      // EXECUTE UPDATE
      // ========================================

      if (Object.keys(updateData).length === 0) {
        return handleCORS(NextResponse.json({ error: 'No valid action specified' }, { status: 400 }))
      }

      // Perform stock reservation if needed
      if (shouldReserveStock) {
        try {
          // Use the database function to reserve stock
          const {createClient: createAdminClient} = await import('@supabase/supabase-js')
          const supabaseAdmin = createAdminClient(
            supabaseUrl,
            process.env.SUPABASE_SERVICE_ROLE_KEY
          )
          
          await supabaseAdmin.rpc('reserve_order_stock', { p_order_id: orderId })
        } catch (stockError) {
          console.error('Stock reservation error:', stockError)
          return handleCORS(NextResponse.json({ 
            error: 'Failed to reserve stock: ' + stockError.message 
          }, { status: 500 }))
        }
      }

      // Perform stock release if needed
      if (shouldReleaseStock) {
        try {
          const {createClient: createAdminClient} = await import('@supabase/supabase-js')
          const supabaseAdmin = createAdminClient(
            supabaseUrl,
            process.env.SUPABASE_SERVICE_ROLE_KEY
          )
          
          await supabaseAdmin.rpc('release_order_stock', { 
            p_order_id: orderId,
            p_reason: 'RETURNED'
          })
        } catch (stockError) {
          console.error('Stock release error:', stockError)
        }
      }

      // Update order
      const { data: updatedOrder, error: updateError } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId)
        .eq('business_id', userContext.businessId)
        .select()
        .single()

      if (updateError) throw updateError

      // ============================================
      // GENERATE INVOICE ON ORDER CONFIRMATION
      // ============================================
      if (body.action === 'approve' || (body.status === 'confirmed' || body.status === 'approved')) {
        try {
          const { generateAndSendInvoice } = await import('@/lib/invoice-generator')
          
          // Generate invoice and send to retailer (async, don't block response)
          generateAndSendInvoice(orderId).then(result => {
            if (result.success) {
              console.log(`✅ Invoice ${result.invoiceNumber} generated and ${result.emailSent ? 'emailed' : 'created'} for order ${orderId}`)
            } else {
              console.error(`❌ Invoice generation failed for order ${orderId}:`, result.error)
            }
          }).catch(err => {
            console.error('Invoice generation error:', err)
          })
        } catch (invoiceError) {
          console.error('Invoice module error:', invoiceError)
          // Don't fail the order confirmation if invoice generation fails
        }
      }

      // ============================================
      // AUTO EMPTY ISSUANCE ON DELIVERY
      // ============================================
      if (body.action === 'deliver' && updatedOrder) {
        try {
          // Get order items with product details
          const { data: orderItems } = await supabase
            .from('order_items')
            .select(`
              *,
              products(is_returnable, empty_item_id, empty_conversion_rate)
            `)
            .eq('order_id', orderId)

          // Process each item for empty issuance
          for (const item of orderItems || []) {
            if (item.products?.is_returnable && item.products?.empty_item_id) {
              const quantityToIssue = item.quantity * (item.products.empty_conversion_rate || 1)
              
              // Check warehouse empty stock
              const { data: warehouseStock } = await supabase
                .from('warehouse_empty_inventory')
                .select('quantity_available')
                .eq('business_id', userContext.businessId)
                .eq('empty_item_id', item.products.empty_item_id)
                .single()

              if (!warehouseStock || warehouseStock.quantity_available < quantityToIssue) {
                console.warn(`Insufficient empty stock for item ${item.products.empty_item_id}. Skipping auto-issuance.`)
                continue
              }

              // Reduce warehouse inventory
              await supabase
                .from('warehouse_empty_inventory')
                .update({ quantity_available: warehouseStock.quantity_available - quantityToIssue })
                .eq('business_id', userContext.businessId)
                .eq('empty_item_id', item.products.empty_item_id)

              // Increase retailer balance
              const { data: existingBalance } = await supabase
                .from('retailer_empty_balances')
                .select('quantity_outstanding')
                .eq('business_id', userContext.businessId)
                .eq('retailer_id', order.retailer_id)
                .eq('empty_item_id', item.products.empty_item_id)
                .single()

              const newBalance = (existingBalance?.quantity_outstanding || 0) + quantityToIssue

              await supabase
                .from('retailer_empty_balances')
                .upsert({
                  business_id: userContext.businessId,
                  retailer_id: order.retailer_id,
                  empty_item_id: item.products.empty_item_id,
                  quantity_outstanding: newBalance
                }, { onConflict: 'business_id,retailer_id,empty_item_id' })

              // Log empty movement
              await supabase
                .from('empty_movements')
                .insert({
                  business_id: userContext.businessId,
                  empty_item_id: item.products.empty_item_id,
                  retailer_id: order.retailer_id,
                  type: 'issued_to_retailer',
                  quantity: quantityToIssue,
                  reference_type: 'order',
                  reference_id: orderId,
                  created_by: userContext.userId
                })
            }
          }
        } catch (emptyError) {
          console.error('Empty issuance error:', emptyError)
          // Don't fail the delivery if empty issuance fails
        }
      }

      // Send notification if defined
      if (notificationTitle) {
        try {
          const {createClient: createAdminClient} = await import('@supabase/supabase-js')
          const supabaseAdmin = createAdminClient(
            supabaseUrl,
            process.env.SUPABASE_SERVICE_ROLE_KEY
          )
          
          // Get retailer details (name and phone)
          // Get retailer details (name and phone)
          const {data: retailer, error: retailerError} = await supabaseAdmin
            .from('retailers')
            .select('*')
            .eq('id', order.retailer_id)
            .single()
          
          if (retailerError) {
            console.error('Error fetching retailer for notification:', retailerError)
          }
          
          // Get user name
          const {data: userName} = await supabaseAdmin
            .from('users')
            .select('name')
            .eq('id', userContext.userId)
            .single()
          
          const finalMessage = notificationMessage.replace(
            '{RETAILER_NAME}',
            retailer?.shop_name || 'Unknown'
          )
          
          // Send in-app notification with role-specific targeting
          await sendNotification({
            title: notificationTitle,
            message: finalMessage,
            type: 'info',
            category: notificationCategory,
            targetRoles: notificationTargetRoles,
            businessId: userContext.businessId,
            triggeredBy: userContext.userId,
            relatedTable: 'orders',
            relatedRecordId: orderId
          })

          // Send SMS notification for key delivery events
          if (retailer?.phone_number && ['out_for_delivery', 'delivered', 'failed'].includes(body.action)) {
            const formattedPhone = formatNigerianPhone(retailer.phone_number)
            if (formattedPhone) {
              await sendDeliverySMS({
                to: formattedPhone,
                orderReference: orderId,
                status: body.action === 'dispatch' ? 'out_for_delivery' : body.action,
                retailerName: retailer.shop_name,
                driverName: body.driver_name,
                vehicleNumber: body.vehicle_number
              })
            }
          }
        } catch (notifError) {
          console.error('Failed to send notification:', notifError)
        }
      }

      // Log audit event for order status change
      await logAuditEvent(
        supabase,
        userContext,
        'update',
        {
          order_id: orderId,
          action: body.action,
          new_status: updateData.order_status || order.order_status,
          new_delivery_status: updateData.delivery_status || order.delivery_status,
          driver_name: body.driver_name,
          vehicle_number: body.vehicle_number
        },
        'order',
        orderId
      )

      return handleCORS(NextResponse.json({
        ...updatedOrder,
        message: notificationTitle || 'Order updated successfully'
      }))
    }

    // ============================================
    // PAYMENTS ENDPOINTS
    // ============================================

    if (route === '/payments' && method === 'GET') {
      const userContext = await getUserBusinessId(supabase)
      if (!userContext) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }), request)
      }

      // Get pagination parameters and date filters
      const { page, pageSize, from, to } = getPaginationParams(request)
      const url = new URL(request.url)
      const dateFrom = url.searchParams.get('from')
      const dateTo = url.searchParams.get('to')

      // Build payments query with date filters
      let query = supabase
        .from('payments')
        .select('*', { count: 'exact' })
        .eq('business_id', userContext.businessId)

      // Apply date range filters
      if (dateFrom) query = query.gte('created_at', dateFrom)
      if (dateTo) query = query.lte('created_at', dateTo)

      query = query.order('created_at', { ascending: false })
        .range(from, to)

      const { data: payments, error, count } = await query

      if (error) throw error

      // Use admin client to fetch retailer and user data (to bypass RLS)
      const { createClient } = await import('@supabase/supabase-js')
      const supabaseAdmin = createClient(
        supabaseUrl,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        }
      )

      // Manually fetch retailer and user data for each payment using admin client
      const paymentsWithDetails = await Promise.all(
        (payments || []).map(async (payment) => {
          let retailerData = null
          let userData = null
          
          // Fetch retailer data
          if (payment.retailer_id) {
            const { data: retailer, error: retailerError } = await supabaseAdmin
              .from('retailers')
              .select('id, shop_name, owner_name, current_balance')
              .eq('id', payment.retailer_id)
              .single()
            
            if (retailerError) {
              console.error('Error fetching retailer for payment', payment.id, ':', retailerError)
            } else {
              retailerData = retailer
            }
          }
          
          // Fetch user data (who recorded the payment)
          if (payment.recorded_by) {
            const { data: user, error: userError } = await supabaseAdmin
              .from('users')
              .select('id, name, email, role')
              .eq('id', payment.recorded_by)
              .single()
            
            if (userError) {
              console.error('Error fetching user for payment', payment.id, ':', userError)
            } else {
              userData = user
            }
          }
          
          return { ...payment, retailers: retailerData, users: userData }
        })
      )

      const response = buildPaginatedResponse(paymentsWithDetails, count, page, pageSize)
      return handleCORS(NextResponse.json(response), request)
    }

    if (route === '/payments' && method === 'POST') {
      const userContext = await getUserBusinessId(supabase)
      if (!userContext) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }), request)
      }

      const body = await request.json()
      
      // Validate request body with Zod
      const { error: validationError, data } = parseBody(CreatePaymentSchema, body)
      if (validationError) return handleCORS(validationError, request)
      
      // Use service role client for operations that might be affected by RLS
      const { createClient } = await import('@supabase/supabase-js')
      const adminSupabase = createClient(
        supabaseUrl,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        }
      )
      
      // DOUBLE-SUBMIT GUARD: Check for identical payment in the last 30 seconds
      const thirtySecondsAgo = new Date(Date.now() - 30000).toISOString()
      const { data: recentDuplicate } = await adminSupabase
        .from('payments')
        .select('id, created_at')
        .eq('business_id', userContext.businessId)
        .eq('retailer_id', data.retailer_id)
        .eq('amount_paid', data.amount)
        .eq('payment_method', data.payment_method)
        .gte('created_at', thirtySecondsAgo)
        .maybeSingle()

      if (recentDuplicate) {
        return handleCORS(NextResponse.json({
          error: 'Duplicate payment',
          message: 'An identical payment was just recorded for this retailer. If this is intentional, please wait 30 seconds and try again.',
          code: 'DUPLICATE_PAYMENT'
        }, { status: 409 }))
      }

      // Prevent overpayment (accidental wrong amount)
      const { data: currentRetailer } = await adminSupabase
        .from('retailers')
        .select('current_balance, shop_name')
        .eq('id', data.retailer_id)
        .eq('business_id', userContext.businessId)
        .single()

      if (!currentRetailer) {
        return handleCORS(NextResponse.json({
          error: 'Retailer not found'
        }, { status: 404 }), request)
      }

      if (parseFloat(data.amount) > parseFloat(currentRetailer.current_balance) * 1.1) {
        // Allow up to 10% overpayment (rounding), but block obvious errors
        return handleCORS(NextResponse.json({
          error: 'Payment exceeds balance',
          message: `Payment of ₦${parseFloat(data.amount).toLocaleString()} exceeds the outstanding balance of ₦${parseFloat(currentRetailer.current_balance).toLocaleString()} for ${currentRetailer.shop_name}. Please verify the amount.`,
          code: 'OVERPAYMENT',
          current_balance: currentRetailer.current_balance
        }, { status: 400 }), request)
      }
      
      // Create payment record using validated data
      const { data: payment, error: paymentError } = await adminSupabase
        .from('payments')
        .insert({
          business_id: userContext.businessId,
          retailer_id: data.retailer_id,
          order_id: body.order_id || null,
          amount_paid: data.amount,
          payment_method: data.payment_method,
          notes: data.notes,
          recorded_by: userContext.userId
        })
        .select()
        .single()

      if (paymentError) {
        console.error('Error creating payment:', paymentError)
        throw paymentError
      }

      // Atomic payment application — prevents race conditions
      const { data: updateResult, error: updateError } = await adminSupabase
        .rpc('apply_payment', {
          p_retailer_id: data.retailer_id,
          p_business_id: userContext.businessId,
          p_amount: parseFloat(data.amount)
        })

      if (updateError) {
        console.error('Error applying payment atomically:', updateError)
        throw new Error('Failed to update retailer balance')
      }

      const finalBalance = updateResult?.[0]?.new_balance ?? 0
      const newStatus = updateResult?.[0]?.new_status ?? 'active'

      console.log(`✅ Retailer balance updated successfully. New balance: ${finalBalance}, Status: ${newStatus}`)

      // Send notification for large payments
      try {
        // Get business settings for payment threshold
        const {data: businessSettings} = await adminSupabase
          .from('business_settings')
          .select('settings')
          .eq('business_id', userContext.businessId)
          .maybeSingle()
        
        const paymentThreshold = businessSettings?.settings?.notifications?.payment_threshold || 50000
        
        // Get retailer name
        const {data: retailerData} = await adminSupabase
          .from('retailers')
          .select('shop_name')
          .eq('id', body.retailer_id)
          .single()
        
        // Get user name
        const {data: userData} = await adminSupabase
          .from('users')
          .select('name')
          .eq('id', userContext.userId)
          .single()
        
        // Check if it's a large payment based on configured threshold
        const isLargePayment = parseFloat(body.amount_paid) >= paymentThreshold
        
        if (isLargePayment) {
          await sendNotification({
            title: 'Large Payment Recorded',
            message: `Large payment of ₦${parseFloat(body.amount_paid).toLocaleString()} recorded for ${retailerData?.shop_name || 'Unknown'} by ${userData?.name || 'Unknown'}.`,
            type: 'payment',
            targetRole: 'all',
            businessId: userContext.businessId,
            triggeredBy: userContext.userId,
            relatedTable: 'payments',
            relatedRecordId: payment.id
          })
        }
      } catch (notifError) {
        console.error('Failed to send payment notification:', notifError)
      }

      // Log audit event
      await logAuditEvent(
        supabase,
        userContext,
        'create',
        {
          retailer_id: body.retailer_id,
          amount: body.amount_paid,
          payment_method: body.payment_method,
          new_balance: finalBalance
        },
        'payment',
        payment.id
      )

      return handleCORS(NextResponse.json(payment))
    }

    // ============================================
    // STAFF/USERS ENDPOINTS
    // ============================================

    if (route === '/staff' && method === 'GET') {
      const userContext = await getUserBusinessId(supabase)
      if (!userContext) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      }

      // Allow admin and manager to VIEW staff (for assigning sales reps)
      if (!['admin', 'manager'].includes(userContext.role)) {
        return handleCORS(NextResponse.json({ error: 'Forbidden - Admin or Manager only' }, { status: 403 }))
      }

      // Query users table for staff in the same business
      const { data, error } = await supabase
        .from('users')
        .select('id, auth_user_id, email, name, role, business_id, status, created_at')
        .eq('business_id', userContext.businessId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching staff:', error)
        return handleCORS(NextResponse.json({ error: 'Failed to load staff', details: error.message }, { status: 500 }))
      }
      
      return handleCORS(NextResponse.json(data || []))
    }

    if (route === '/staff' && method === 'POST') {
      const userContext = await getUserBusinessId(supabase)
      
      // Only admin can CREATE/MANAGE staff
      if (!userContext || userContext.role !== 'admin') {
        return handleCORS(NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 }))
      }

      // SUBSCRIPTION CHECK: Enforce active subscription
      const subscriptionError = await enforceSubscription(userContext.businessId)
      if (subscriptionError) {
        return handleCORS(NextResponse.json(subscriptionError, { status: 402 }))
      }

      // USER LIMIT CHECK: Enforce user count limits
      const userLimitCheck = await canAddUser(userContext.businessId)
      if (!userLimitCheck.allowed) {
        return handleCORS(NextResponse.json({
          error: 'User limit reached',
          message: userLimitCheck.message,
          code: 'LIMIT_REACHED',
          upgradeUrl: '/settings/billing'
        }, { status: 402 }))
      }

      // If adding user requires extra payment, notify admin
      if (userLimitCheck.requiresConfirmation && userLimitCheck.extraCost > 0) {
        // Log this for potential follow-up billing
        console.log(`⚠️ Adding user will incur extra cost: ₦${userLimitCheck.extraCost}/month for business ${userContext.businessId}`)
      }

      const body = await request.json()
      
      // Validate request body with Zod
      const { error: validationError, data } = parseBody(CreateStaffSchema, body)
      if (validationError) return handleCORS(validationError, request)
      
      // Create service role client for admin operations
      const { createClient } = await import('@supabase/supabase-js')
      const supabaseAdmin = createClient(
        supabaseUrl,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        }
      )

      // DUPLICATE CHECK: Check if email already exists in this business
      const { data: existingUser } = await supabaseAdmin
        .from('users')
        .select('id, email, status')
        .eq('business_id', userContext.businessId)
        .eq('email', data.email.toLowerCase().trim())
        .maybeSingle()

      if (existingUser) {
        const statusMsg = existingUser.status === 'inactive'
          ? 'This email belongs to a deactivated staff member. Reactivate them from the staff list instead.'
          : 'A staff member with this email already exists in your business.'
        return handleCORS(NextResponse.json({
          error: 'Duplicate email',
          message: statusMsg,
          code: 'DUPLICATE_ENTRY',
          field: 'email'
        }, { status: 409 }))
      }

      // Get business name for email
      const { data: business } = await supabaseAdmin
        .from('businesses')
        .select('name')
        .eq('id', userContext.businessId)
        .single()

      // Generate cryptographically secure temporary password
      const tempPassword = `Df${randomBytes(10).toString('base64url')}!`

      // Create auth user with temporary password
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: data.email,
        password: tempPassword,
        email_confirm: true, // Auto-confirm email
        user_metadata: {
          name: data.name,
          role: data.role,
          business_id: userContext.businessId,
          business_name: business?.name || 'DistributionFlow',
          needs_password_change: true // Force password change on first login
        }
      })

      if (authError) {
        // Supabase error when email already exists in auth system
        if (authError.message?.includes('already been registered') ||
            authError.message?.includes('already exists') ||
            authError.code === 'email_exists') {
          return handleCORS(NextResponse.json({
            error: 'Email already registered',
            message: 'This email address is already registered in the system. The user may belong to another business.',
            code: 'DUPLICATE_ENTRY',
            field: 'email'
          }, { status: 409 }))
        }
        console.error('Auth user invitation error:', authError)
        throw new Error(`Failed to invite user: ${authError.message}`)
      }

      // Create user profile in users table using admin client to bypass RLS
      const { data: userProfile, error: profileError } = await supabaseAdmin
        .from('users')
        .insert({
          auth_user_id: authUser.user.id,
          business_id: userContext.businessId,
          email: data.email,
          name: data.name,
          role: data.role,
          status: 'active'
        })
        .select()
        .single()

      if (profileError) {
        // Rollback: delete auth user if profile creation fails
        await supabaseAdmin.auth.admin.deleteUser(authUser.user.id)
        throw profileError
      }

      // Send custom invitation email with credentials
      try {
        const { sendStaffInvitation } = await import('@/lib/email')
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://distribution-flow.com'
        await sendStaffInvitation({
          to: body.email,
          staffName: body.name,
          businessName: business?.name || 'DistributionFlow',
          role: body.role,
          tempPassword: tempPassword,
          loginUrl: `${baseUrl}/login`
        })
        console.log(`✅ Staff invitation email sent to ${body.email}`)
      } catch (emailError) {
        console.error('Failed to send staff invitation email:', emailError)
        // Don't fail the request if email fails
      }

      // Log the action
      await logAudit({
        businessId: userContext.businessId,
        userId: userContext.userId,
        action: AUDIT_ACTIONS.STAFF_CREATED,
        resourceType: RESOURCE_TYPES.USER,
        resourceId: userProfile.id,
        details: {
          staff_name: body.name,
          staff_email: body.email,
          staff_role: body.role,
          invitation_method: 'supabase_invitation'
        }
      })

      // Send notification for new staff
      try {
        const {createClient: createAdminClient} = await import('@supabase/supabase-js')
        const supabaseAdmin = createAdminClient(
          supabaseUrl,
          process.env.SUPABASE_SERVICE_ROLE_KEY
        )
        
        // Get admin name
        const {data: adminData} = await supabaseAdmin
          .from('users')
          .select('name')
          .eq('id', userContext.userId)
          .single()
        
        await sendNotification({
          title: 'New Staff Added',
          message: `New staff added: ${body.name} (${body.role}) by ${adminData?.name || 'Admin'}.`,
          type: 'staff',
          targetRole: 'all',
          businessId: userContext.businessId,
          triggeredBy: userContext.userId,
          relatedTable: 'users',
          relatedRecordId: userProfile.id
        })
      } catch (notifError) {
        console.error('Failed to send staff notification:', notifError)
      }

      return handleCORS(NextResponse.json({
        user: userProfile,
        invitationSent: true,
        message: `Staff member created successfully. Invitation email sent to ${body.email} with temporary password.`
      }))
    }

    if (route.startsWith('/staff/') && method === 'PUT') {
      const userContext = await getUserBusinessId(supabase)
      if (!userContext || userContext.role !== 'admin') {
        return handleCORS(NextResponse.json({ error: 'Unauthorized - Admin only' }, { status: 403 }))
      }

      const staffId = route.split('/')[2]
      const body = await request.json()
      
      // Use service role client to bypass RLS
      const { createClient } = await import('@supabase/supabase-js')
      const supabaseAdmin = createClient(
        supabaseUrl,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        }
      )

      // Get old data for audit log
      const { data: oldData } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', staffId)
        .single()

      const { data, error } = await supabaseAdmin
        .from('users')
        .update({
          name: body.name,
          role: body.role,
          status: body.status
        })
        .eq('id', staffId)
        .eq('business_id', userContext.businessId)
        .select()
        .single()

      if (error) throw error

      // Log the action
      const changes = {}
      if (oldData.name !== body.name) changes.name = { old: oldData.name, new: body.name }
      if (oldData.role !== body.role) changes.role = { old: oldData.role, new: body.role }
      if (oldData.status !== body.status) changes.status = { old: oldData.status, new: body.status }

      await logAudit({
        businessId: userContext.businessId,
        userId: userContext.userId,
        action: AUDIT_ACTIONS.STAFF_UPDATED,
        resourceType: RESOURCE_TYPES.USER,
        resourceId: staffId,
        details: {
          staff_name: data.name,
          staff_email: data.email,
          changes: changes
        }
      })

      return handleCORS(NextResponse.json(data))
    }

    if (route.startsWith('/staff/') && method === 'DELETE') {
      const userContext = await getUserBusinessId(supabase)
      if (!userContext || userContext.role !== 'admin') {
        return handleCORS(NextResponse.json({ error: 'Unauthorized - Admin only' }, { status: 403 }))
      }

      const staffId = route.split('/')[2]
      
      // Use service role client to bypass RLS
      const { createClient } = await import('@supabase/supabase-js')
      const supabaseAdmin = createClient(
        supabaseUrl,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        }
      )

      // Get staff data for audit log
      const { data: staffData } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', staffId)
        .single()

      // Soft delete - just mark as inactive
      const { data, error } = await supabaseAdmin
        .from('users')
        .update({ status: 'inactive' })
        .eq('id', staffId)
        .eq('business_id', userContext.businessId)
        .select()
        .single()

      if (error) throw error

      // Log the action
      await logAudit({
        businessId: userContext.businessId,
        userId: userContext.userId,
        action: AUDIT_ACTIONS.STAFF_DEACTIVATED,
        resourceType: RESOURCE_TYPES.USER,
        resourceId: staffId,
        details: {
          staff_name: staffData.name,
          staff_email: staffData.email,
          staff_role: staffData.role
        }
      })

      return handleCORS(NextResponse.json(data))
    }

    // ============================================
    // REPORTS ENDPOINTS
    // ============================================

    if (route === '/reports/debt-aging' && method === 'GET') {
      const userContext = await getUserBusinessId(supabase)
      if (!userContext) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      }

      const { data, error } = await supabase
        .from('retailers')
        .select(`
          shop_name,
          current_balance,
          credit_limit,
          created_at,
          payments (
            created_at
          )
        `)
        .eq('business_id', userContext.businessId)
        .gt('current_balance', 0)
        .order('current_balance', { ascending: false })

      if (error) throw error

      // Calculate aging based on last payment date (or account creation if never paid)
      const now = new Date()
      const aging = data?.map(retailer => {
        // Find the most recent payment date for this retailer
        const payments = retailer.payments || []
        const lastPaymentDate = payments.length > 0
          ? new Date(Math.max(...payments.map(p => new Date(p.created_at))))
          : null

        // Aging is from last payment, or from account creation if never paid
        const referenceDate = lastPaymentDate || new Date(retailer.created_at)
        const daysOutstanding = Math.floor(
          (now - referenceDate) / (1000 * 60 * 60 * 24)
        )

        let agingCategory = '0-30 days'
        if (daysOutstanding > 90) agingCategory = '90+ days'
        else if (daysOutstanding > 60) agingCategory = '60-90 days'
        else if (daysOutstanding > 30) agingCategory = '30-60 days'

        return {
          shop_name: retailer.shop_name,
          current_balance: retailer.current_balance,
          credit_limit: retailer.credit_limit,
          aging_category: agingCategory,
          days_outstanding: daysOutstanding,
          last_payment_date: lastPaymentDate?.toISOString() || null,
          never_paid: !lastPaymentDate
        }
      })

      return handleCORS(NextResponse.json(aging || []))
    }

    if (route === '/reports/sales-by-rep' && method === 'GET') {
      const userContext = await getUserBusinessId(supabase)
      if (!userContext) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      }

      // Get date range from query parameter
      const url = new URL(request.url)
      const range = url.searchParams.get('range') || '30d'

      const startDate = new Date()
      startDate.setHours(0, 0, 0, 0)
      if (range === '7d') startDate.setDate(startDate.getDate() - 7)
      else if (range === '30d') startDate.setDate(startDate.getDate() - 30)
      else if (range === '90d') startDate.setDate(startDate.getDate() - 90)
      else if (range === 'today') { /* already today */ }
      else startDate.setFullYear(2000) // 'all' — no date filter

      // Fetch orders with order items and products
      const { data: orders, error } = await supabase
        .from('orders')
        .select('id, sales_rep_id, total_amount, status, order_status, created_at, order_items(quantity, unit_price, total_price, product_id, products(name, sku))')
        .eq('business_id', userContext.businessId)
        .gte('created_at', startDate.toISOString())
        .or('order_status.in.(confirmed,completed),status.in.(confirmed,delivered)')
        .order('created_at', { ascending: false })

      if (error) throw error

      // Use admin client to fetch sales rep names (to bypass RLS)
      const { createClient } = await import('@supabase/supabase-js')
      const supabaseAdmin = createClient(
        supabaseUrl,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        }
      )

      // Get unique sales rep IDs
      const repIds = [...new Set(orders?.map(o => o.sales_rep_id).filter(Boolean))]
      
      // Fetch all sales reps data
      const { data: salesReps } = await supabaseAdmin
        .from('users')
        .select('id, name, email')
        .in('id', repIds)

      // Create a map of rep ID to rep data
      const repMap = {}
      salesReps?.forEach(rep => {
        repMap[rep.id] = rep
      })

      // Group by rep with product details including dates
      const repSales = {}
      orders?.forEach(order => {
        const repId = order.sales_rep_id
        const repData = repMap[repId]
        const repName = repData?.name || 'Unassigned'
        const orderDate = order.created_at
        
        if (!repSales[repName]) {
          repSales[repName] = { 
            name: repName, 
            email: repData?.email || '',
            total: 0, 
            orders: 0,
            items: 0,
            products: {}, // Track individual products
            sales: [] // Track individual sales with dates
          }
        }
        
        repSales[repName].total += parseFloat(order.total_amount)
        repSales[repName].orders += 1
        
        // Track individual products and their details
        order.order_items?.forEach(item => {
          repSales[repName].items += item.quantity
          
          const productName = item.products?.name || item.product_id
          const productSku = item.products?.sku || ''
          const productKey = `${productName}_${productSku}`
          
          if (!repSales[repName].products[productKey]) {
            repSales[repName].products[productKey] = {
              name: productName,
              sku: productSku,
              quantity: 0,
              totalValue: 0,
              unitPrice: item.unit_price,
              sales: [] // Individual sales of this product
            }
          }
          
          repSales[repName].products[productKey].quantity += item.quantity
          repSales[repName].products[productKey].totalValue += parseFloat(item.total_price)
          
          // Track individual sale with date
          repSales[repName].products[productKey].sales.push({
            date: orderDate,
            quantity: item.quantity,
            value: item.total_price,
            orderId: order.id
          })
        })
      })

      // Convert products object to array for easier frontend consumption
      const result = Object.values(repSales).map(rep => ({
        ...rep,
        products: Object.values(rep.products).map(product => ({
          ...product,
          sales: product.sales.sort((a, b) => new Date(b.date) - new Date(a.date)) // Sort by date desc
        }))
      }))

      return handleCORS(NextResponse.json(result))
    }

    if (route === '/reports/inventory' && method === 'GET') {
      const userContext = await getUserBusinessId(supabase)
      if (!userContext) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      }

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('business_id', userContext.businessId)
        .order('stock_quantity')

      if (error) throw error
      return handleCORS(NextResponse.json(data || []))
    }

    // ============================================
    // AUDIT LOGS ENDPOINT
    // ============================================

    if (route === '/audit-logs' && method === 'GET') {
      const userContext = await getUserBusinessId(supabase)
      if (!userContext || userContext.role !== 'admin') {
        return handleCORS(NextResponse.json({ error: 'Unauthorized - Admin only' }, { status: 403 }))
      }

      const { getAuditLogs } = await import('@/lib/audit-logger')
      
      const url = new URL(request.url)
      const limit = parseInt(url.searchParams.get('limit') || '100')
      const resourceType = url.searchParams.get('resource_type')
      const userId = url.searchParams.get('user_id')
      const dateFrom = url.searchParams.get('from')
      const dateTo = url.searchParams.get('to')

      const logs = await getAuditLogs(userContext.businessId, {
        limit,
        resourceType,
        userId,
        dateFrom,
        dateTo
      })

      return handleCORS(NextResponse.json(logs))
    }

    // ==================== NOTIFICATIONS ====================
    
    if (route === '/notifications' && method === 'GET') {
      const userContext = await getUserBusinessId(supabase)
      if (!userContext) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      }

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('business_id', userContext.businessId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return handleCORS(NextResponse.json(data || []))
    }

    if (route.startsWith('/notifications/') && method === 'PUT') {
      const userContext = await getUserBusinessId(supabase)
      if (!userContext) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      }

      const notificationId = route.split('/')[2]
      const body = await request.json()

      const { data, error } = await supabase
        .from('notifications')
        .update({ is_read: body.is_read })
        .eq('id', notificationId)
        .eq('business_id', userContext.businessId)
        .select()
        .single()

      if (error) throw error
      return handleCORS(NextResponse.json(data))
    }

    if (route.startsWith('/notifications/') && method === 'DELETE') {
      const userContext = await getUserBusinessId(supabase)
      if (!userContext) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      }

      const notificationId = route.split('/')[2]

      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('business_id', userContext.businessId)

      if (error) throw error
      return handleCORS(NextResponse.json({ success: true }))
    }

    if (route === '/notifications/mark-all-read' && method === 'POST') {
      const userContext = await getUserBusinessId(supabase)
      if (!userContext) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      }

      const { data, error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('business_id', userContext.businessId)
        .eq('is_read', false)
        .select()

      if (error) throw error
      return handleCORS(NextResponse.json({ success: true, updated: data?.length || 0 }))
    }

    // Route not found
    return handleCORS(NextResponse.json(
      { error: `Route ${route} not found` }, 
      { status: 404 }
    ))

  } catch (error) {
    console.error('API Error:', error)
    return handleCORS(NextResponse.json(
      { error: error.message || "Internal server error" }, 
      { status: 500 }
    ))
  }
}

// Export all HTTP methods
export const GET = handleRoute
export const POST = handleRoute
export const PUT = handleRoute
export const DELETE = handleRoute
export const PATCH = handleRoute
