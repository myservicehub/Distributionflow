import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { logAudit, AUDIT_ACTIONS, RESOURCE_TYPES } from '@/lib/audit-logger'
import { sendStaffInvitation } from '@/lib/email'
import { can } from '@/lib/permissions'
import { sendNotification } from '@/lib/notifications'

// Initialize Supabase client (server-side with service role for admin operations)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Helper to create authenticated Supabase client from request
async function getSupabaseClient() {
  const cookieStore = await cookies()
  
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          // Ignore
        }
      },
    },
  })
}

// Helper function to handle CORS
function handleCORS(response) {
  response.headers.set('Access-Control-Allow-Origin', process.env.CORS_ORIGINS || '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  response.headers.set('Access-Control-Allow-Credentials', 'true')
  return response
}

// OPTIONS handler for CORS
export async function OPTIONS() {
  return handleCORS(new NextResponse(null, { status: 200 }))
}

// Get current user's business ID  
async function getUserBusinessId(supabase) {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    console.log('Auth user:', user?.id, 'Error:', authError)
    
    if (!user) {
      console.log('No user found in auth')
      return null
    }

    // Get user profile first - this works for ALL roles (admin, manager, sales_rep, warehouse)
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('id, role, business_id, status')
      .eq('auth_user_id', user.id)
      .maybeSingle()

    console.log('User profile:', userProfile, 'Error:', profileError)

    if (!userProfile || !userProfile.business_id) {
      console.log('No user profile or business_id found for user')
      return null
    }

    if (userProfile.status !== 'active') {
      console.log('User is not active:', userProfile.status)
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

      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

      // Get total sales today
      const { data: salesToday } = await supabase
        .from('orders')
        .select('total_amount')
        .eq('business_id', userContext.businessId)
        .gte('created_at', today.toISOString())
        .eq('status', 'confirmed')

      const totalSalesToday = salesToday?.reduce((sum, order) => sum + parseFloat(order.total_amount), 0) || 0

      // Get total sales this month
      const { data: salesMonth } = await supabase
        .from('orders')
        .select('total_amount')
        .eq('business_id', userContext.businessId)
        .gte('created_at', startOfMonth.toISOString())
        .eq('status', 'confirmed')

      const totalSalesMonth = salesMonth?.reduce((sum, order) => sum + parseFloat(order.total_amount), 0) || 0

      // Get total outstanding debt
      const { data: retailers } = await supabase
        .from('retailers')
        .select('current_balance')
        .eq('business_id', userContext.businessId)

      const totalDebt = retailers?.reduce((sum, retailer) => sum + parseFloat(retailer.current_balance), 0) || 0

      // Get overdue retailers (balance > credit limit)
      const { data: overdueRetailers } = await supabase
        .from('retailers')
        .select('id, shop_name, current_balance, credit_limit')
        .eq('business_id', userContext.businessId)
        .eq('status', 'blocked')

      // Get low stock products
      const { data: lowStockProducts } = await supabase
        .from('products')
        .select('id, name, stock_quantity, low_stock_threshold')
        .eq('business_id', userContext.businessId)
        .filter('stock_quantity', 'lte', 'low_stock_threshold')

      // Get sales by rep
      const { data: salesByRep } = await supabase
        .from('orders')
        .select('sales_rep_id, total_amount, users(name)')
        .eq('business_id', userContext.businessId)
        .eq('status', 'confirmed')

      const repSales = {}
      salesByRep?.forEach(order => {
        const repName = order.users?.name || 'Unknown'
        if (!repSales[repName]) {
          repSales[repName] = 0
        }
        repSales[repName] += parseFloat(order.total_amount)
      })

      return handleCORS(NextResponse.json({
        totalSalesToday,
        totalSalesMonth,
        totalDebt,
        overdueRetailers: overdueRetailers || [],
        lowStockProducts: lowStockProducts || [],
        salesByRep: Object.entries(repSales).map(([name, total]) => ({ name, total }))
      }))
    }

    // ============================================
    // RETAILERS ENDPOINTS
    // ============================================

    if (route === '/retailers' && method === 'GET') {
      const userContext = await getUserBusinessId(supabase)
      if (!userContext) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      }

      // Build query without the user join (will fetch separately)
      let query = supabase
        .from('retailers')
        .select('*')
        .eq('business_id', userContext.businessId)
        .order('created_at', { ascending: false })

      // Apply sales rep filter - sales reps only see their assigned retailers
      query = applySalesRepFilter(query, userContext, 'assigned_rep_id')

      const { data: retailers, error } = await query

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

      return handleCORS(NextResponse.json(retailersWithRep))
    }

    if (route === '/retailers' && method === 'POST') {
      const userContext = await getUserBusinessId(supabase)
      if (!userContext) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      }

      // Check permission - only admin and manager can create retailers
      if (!['admin', 'manager'].includes(userContext.role)) {
        return handleCORS(NextResponse.json({ 
          error: 'Forbidden: Only admins and managers can create retailers' 
        }, { status: 403 }))
      }

      const body = await request.json()
      const { data, error } = await supabase
        .from('retailers')
        .insert({
          business_id: userContext.businessId,
          shop_name: body.shop_name,
          owner_name: body.owner_name,
          phone: body.phone,
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
        `Created retailer: ${body.shop_name}`,
        'retailer',
        data.id
      )

      return handleCORS(NextResponse.json(data))
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
      
      const { data, error } = await supabase
        .from('retailers')
        .update({
          shop_name: body.shop_name,
          owner_name: body.owner_name,
          phone: body.phone,
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
          'UPDATE_CREDIT_LIMIT',
          `Updated credit limit for ${body.shop_name} to ${body.credit_limit}`,
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
      const { error } = await supabase
        .from('retailers')
        .delete()
        .eq('id', retailerId)
        .eq('business_id', userContext.businessId)

      if (error) throw error
      return handleCORS(NextResponse.json({ success: true }))
    }

    // ============================================
    // PRODUCTS ENDPOINTS
    // ============================================

    if (route === '/products' && method === 'GET') {
      const userContext = await getUserBusinessId(supabase)
      if (!userContext) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      }

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('business_id', userContext.businessId)
        .order('name')

      if (error) throw error
      return handleCORS(NextResponse.json(data || []))
    }

    if (route === '/products' && method === 'POST') {
      const userContext = await getUserBusinessId(supabase)
      if (!userContext) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      }

      const body = await request.json()
      const { data, error } = await supabase
        .from('products')
        .insert({
          business_id: userContext.businessId,
          name: body.name,
          sku: body.sku,
          cost_price: body.cost_price || 0,
          selling_price: body.selling_price,
          stock_quantity: body.stock_quantity || 0,
          low_stock_threshold: body.low_stock_threshold || 10
        })
        .select()
        .single()

      if (error) throw error
      return handleCORS(NextResponse.json(data))
    }

    if (route.startsWith('/products/') && method === 'PUT') {
      const userContext = await getUserBusinessId(supabase)
      if (!userContext) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      }

      const productId = route.split('/')[2]
      const body = await request.json()
      
      const { data, error } = await supabase
        .from('products')
        .update({
          name: body.name,
          sku: body.sku,
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
      return handleCORS(NextResponse.json(data))
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

      return handleCORS(NextResponse.json(movement))
    }

    // ============================================
    // ORDERS ENDPOINTS
    // ============================================

    if (route === '/orders' && method === 'GET') {
      const userContext = await getUserBusinessId(supabase)
      if (!userContext) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      }

      // Build query with order items and products
      let query = supabase
        .from('orders')
        .select('*, retailers(shop_name, owner_name), order_items(*, product:products(name, sku))')
        .eq('business_id', userContext.businessId)
        .order('created_at', { ascending: false })

      // Apply sales rep filter - sales reps only see their own orders
      query = applySalesRepFilter(query, userContext, 'sales_rep_id')

      const { data: orders, error } = await query

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
            
            return { ...order, sales_rep: salesRep }
          }
          return { ...order, sales_rep: null }
        })
      )
      
      return handleCORS(NextResponse.json(ordersWithSalesRep))
    }

    if (route === '/orders' && method === 'POST') {
      const userContext = await getUserBusinessId(supabase)
      if (!userContext) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      }

      // Check permission
      if (!canCreateOrders(userContext.role)) {
        return handleCORS(NextResponse.json({ 
          error: 'Forbidden: You do not have permission to create orders' 
        }, { status: 403 }))
      }

      const body = await request.json()
      
      // Check retailer credit limit if payment is credit
      if (body.payment_status === 'credit' || body.payment_status === 'partial') {
        const { data: retailer } = await supabase
          .from('retailers')
          .select('current_balance, credit_limit, status')
          .eq('id', body.retailer_id)
          .single()

        if (retailer && retailer.status === 'blocked') {
          return handleCORS(NextResponse.json({ 
            error: 'Retailer is blocked due to credit limit exceeded' 
          }, { status: 400 }))
        }

        const newBalance = parseFloat(retailer.current_balance) + parseFloat(body.total_amount)
        if (newBalance > parseFloat(retailer.credit_limit)) {
          return handleCORS(NextResponse.json({ 
            error: 'Order would exceed retailer credit limit' 
          }, { status: 400 }))
        }
      }

      // Create order - auto-assign to current user if sales rep
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          business_id: userContext.businessId,
          retailer_id: body.retailer_id,
          // Always set sales_rep_id: use body value, or current user's ID, or null
          sales_rep_id: body.sales_rep_id || (userContext.role === 'sales_rep' ? userContext.userId : userContext.userId),
          total_amount: body.total_amount,
          payment_status: body.payment_status,
          status: 'pending'
        })
        .select()
        .single()

      if (orderError) throw orderError

      // Create order items and update stock
      for (const item of body.items) {
        // Insert order item
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

        // Deduct stock
        const { data: product } = await supabase
          .from('products')
          .select('stock_quantity')
          .eq('id', item.product_id)
          .single()

        const newStock = product.stock_quantity - item.quantity
        if (newStock < 0) {
          throw new Error(`Insufficient stock for product ${item.product_id}`)
        }

        await supabase
          .from('products')
          .update({ stock_quantity: newStock })
          .eq('id', item.product_id)

        // Record stock movement
        await supabase
          .from('stock_movements')
          .insert({
            business_id: userContext.businessId,
            product_id: item.product_id,
            type: 'OUT',
            quantity: item.quantity,
            reference: `Order ${order.id}`,
            created_by: userContext.userId
          })
      }

      // Update retailer balance if credit
      if (body.payment_status === 'credit') {
        const { data: retailer } = await supabase
          .from('retailers')
          .select('current_balance')
          .eq('id', body.retailer_id)
          .single()

        const newBalance = parseFloat(retailer.current_balance) + parseFloat(body.total_amount)
        
        await supabase
          .from('retailers')
          .update({ current_balance: newBalance })
          .eq('id', body.retailer_id)
      }

      // Update order status to confirmed
      await supabase
        .from('orders')
        .update({ status: 'confirmed' })
        .eq('id', order.id)

      return handleCORS(NextResponse.json(order))
    }

    if (route.startsWith('/orders/') && route.endsWith('/items') && method === 'GET') {
      const userContext = await getUserBusinessId(supabase)
      if (!userContext) {
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

    // Update order status (approve/reject/dispatch/deliver)
    if (route.startsWith('/orders/') && method === 'PUT') {
      const userContext = await getUserBusinessId(supabase)
      if (!userContext) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      }

      const orderId = route.split('/')[2]
      const body = await request.json()
      const requestedStatus = body.status

      // Check permissions based on the action
      // Admin/Manager: Can approve/reject/confirm orders
      // Warehouse: Can mark as dispatched/delivered
      const canApprove = canConfirmOrders(userContext.role) // admin, manager
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
      } else {
        // For any other status changes, require admin/manager
        if (!canApprove) {
          return handleCORS(NextResponse.json({ 
            error: 'Forbidden: Insufficient permissions' 
          }, { status: 403 }))
        }
      }

      // Get order details
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

      // If confirming order, validate stock and deduct
      if (body.status === 'confirmed' && order.status !== 'confirmed') {
        // Validate stock availability
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

        // Deduct stock (if not using triggers)
        // Note: If you applied the business_rules_triggers.sql, this happens automatically
        // Uncomment below if you want manual control:
        /*
        for (const item of order.order_items) {
          await supabase
            .from('products')
            .update({ 
              stock_quantity: supabase.raw(`stock_quantity - ${item.quantity}`) 
            })
            .eq('id', item.product_id)

          await supabase
            .from('stock_movements')
            .insert({
              business_id: userContext.businessId,
              product_id: item.product_id,
              movement_type: 'out',
              quantity: item.quantity,
              notes: `Order ${orderId} confirmed`
            })
        }

        // Update retailer balance for credit orders
        if (order.payment_status === 'credit' || order.payment_status === 'partial') {
          await supabase
            .from('retailers')
            .update({ 
              current_balance: supabase.raw(`current_balance + ${order.total_amount}`) 
            })
            .eq('id', order.retailer_id)
        }
        */
      }

      // Update order status
      const { data: updatedOrder, error: updateError } = await supabase
        .from('orders')
        .update({ status: body.status })
        .eq('id', orderId)
        .eq('business_id', userContext.businessId)
        .select()
        .single()

      if (updateError) throw updateError

      // Send notification for order status changes
      try {
        const {createClient: createAdminClient} = await import('@supabase/supabase-js')
        const supabaseAdmin = createAdminClient(
          supabaseUrl,
          process.env.SUPABASE_SERVICE_ROLE_KEY
        )
        
        // Get retailer name
        const {data: retailer} = await supabaseAdmin
          .from('retailers')
          .select('shop_name')
          .eq('id', order.retailer_id)
          .single()
        
        // Get user name
        const {data: userName} = await supabaseAdmin
          .from('users')
          .select('name')
          .eq('id', userContext.userId)
          .single()
        
        let notificationTitle = ''
        let notificationMessage = ''
        let notificationType = 'order'
        
        if (body.status === 'confirmed') {
          notificationTitle = 'Order Approved'
          notificationMessage = `Order #${orderId.substring(0, 8)} for ${retailer?.shop_name || 'Unknown'} was approved by ${userName?.name || 'Unknown'}.`
        } else if (body.status === 'cancelled') {
          notificationTitle = 'Order Cancelled'
          notificationMessage = `Order #${orderId.substring(0, 8)} for ${retailer?.shop_name || 'Unknown'} was cancelled by ${userName?.name || 'Unknown'}.`
        } else if (body.status === 'dispatched') {
          notificationTitle = 'Order Dispatched'
          notificationMessage = `Order #${orderId.substring(0, 8)} for ${retailer?.shop_name || 'Unknown'} has been dispatched.`
        }
        
        if (notificationTitle) {
          await sendNotification({
            title: notificationTitle,
            message: notificationMessage,
            type: notificationType,
            targetRole: 'all',
            businessId: userContext.businessId,
            triggeredBy: userContext.userId,
            relatedTable: 'orders',
            relatedRecordId: orderId
          })
        }
      } catch (notifError) {
        console.error('Failed to send notification:', notifError)
        // Don't fail the request if notification fails
      }

      // Log audit event - TEMPORARILY DISABLED for debugging
      // await logAuditEvent(
      //   supabase,
      //   userContext,
      //   body.status === 'confirmed' ? 'APPROVE_ORDER' : 'UPDATE_ORDER',
      //   `Order ${orderId} status changed to ${body.status}`,
      //   'order',
      //   orderId
      // )
      
      console.log('Order approved successfully, audit logging disabled temporarily')

      return handleCORS(NextResponse.json(updatedOrder))
    }

    // ============================================
    // PAYMENTS ENDPOINTS
    // ============================================

    if (route === '/payments' && method === 'GET') {
      const userContext = await getUserBusinessId(supabase)
      if (!userContext) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      }

      // Fetch payments without joins first
      const { data: payments, error } = await supabase
        .from('payments')
        .select('*')
        .eq('business_id', userContext.businessId)
        .order('created_at', { ascending: false })

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

      return handleCORS(NextResponse.json(paymentsWithDetails))
    }

    if (route === '/payments' && method === 'POST') {
      const userContext = await getUserBusinessId(supabase)
      if (!userContext) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      }

      const body = await request.json()
      
      // Create payment record
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .insert({
          business_id: userContext.businessId,
          retailer_id: body.retailer_id,
          order_id: body.order_id || null,
          amount_paid: body.amount_paid,
          payment_method: body.payment_method,
          notes: body.notes,
          recorded_by: userContext.userId
        })
        .select()
        .single()

      if (paymentError) throw paymentError

      // Update retailer balance
      const { data: retailer } = await supabase
        .from('retailers')
        .select('current_balance, credit_limit')
        .eq('id', body.retailer_id)
        .single()

      const newBalance = parseFloat(retailer.current_balance) - parseFloat(body.amount_paid)
      const finalBalance = Math.max(0, newBalance) // Don't allow negative balance

      // Update status based on new balance
      const newStatus = finalBalance <= parseFloat(retailer.credit_limit) ? 'active' : 'blocked'

      await supabase
        .from('retailers')
        .update({ 
          current_balance: finalBalance,
          status: newStatus
        })
        .eq('id', body.retailer_id)

      // Send notification for large payments
      try {
        const {createClient: createAdminClient} = await import('@supabase/supabase-js')
        const supabaseAdmin = createAdminClient(
          supabaseUrl,
          process.env.SUPABASE_SERVICE_ROLE_KEY
        )
        
        // Get retailer name
        const {data: retailerData} = await supabaseAdmin
          .from('retailers')
          .select('shop_name')
          .eq('id', body.retailer_id)
          .single()
        
        // Get user name
        const {data: userData} = await supabaseAdmin
          .from('users')
          .select('name')
          .eq('id', userContext.userId)
          .single()
        
        // Check if it's a large payment (>50000)
        const isLargePayment = parseFloat(body.amount_paid) >= 50000
        
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

      // Use service role client to bypass RLS and fetch all staff
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

      const { data, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('business_id', userContext.businessId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return handleCORS(NextResponse.json(data || []))
    }

    if (route === '/staff' && method === 'POST') {
      const userContext = await getUserBusinessId(supabase)
      
      // Only admin can CREATE/MANAGE staff
      if (!userContext || userContext.role !== 'admin') {
        return handleCORS(NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 }))
      }

      const body = await request.json()
      
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

      // Get business name for email
      const { data: business } = await supabaseAdmin
        .from('businesses')
        .select('name')
        .eq('id', userContext.businessId)
        .single()

      // Use Supabase's inviteUserByEmail - sends professional invitation email
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
        body.email,
        {
          data: {
            name: body.name,
            role: body.role,
            business_id: userContext.businessId,
            business_name: business?.name || 'DistributionFlow',
            needs_password_change: false // User sets their own password via invitation
          },
          redirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/accept-invite`
        }
      )

      if (authError) {
        console.error('Auth user invitation error:', authError)
        throw new Error(`Failed to invite user: ${authError.message}`)
      }

      // Create user profile in users table using admin client to bypass RLS
      const { data: userProfile, error: profileError } = await supabaseAdmin
        .from('users')
        .insert({
          auth_user_id: authUser.user.id,
          business_id: userContext.businessId,
          email: body.email,
          name: body.name,
          role: body.role,
          status: 'active'
        })
        .select()
        .single()

      if (profileError) {
        // Rollback: delete auth user if profile creation fails
        await supabaseAdmin.auth.admin.deleteUser(authUser.user.id)
        throw profileError
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
        message: 'Staff member created and secure invitation email sent. They will set their own password.'
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
        .select('shop_name, current_balance, credit_limit, created_at')
        .eq('business_id', userContext.businessId)
        .gt('current_balance', 0)
        .order('current_balance', { ascending: false })

      if (error) throw error

      // Calculate aging (simplified - based on account creation date)
      const now = new Date()
      const aging = data?.map(retailer => {
        const daysSinceCreation = Math.floor((now - new Date(retailer.created_at)) / (1000 * 60 * 60 * 24))
        let category = '0-30 days'
        if (daysSinceCreation > 90) category = '90+ days'
        else if (daysSinceCreation > 60) category = '60-90 days'
        else if (daysSinceCreation > 30) category = '30-60 days'

        return {
          ...retailer,
          aging_category: category,
          days_outstanding: daysSinceCreation
        }
      })

      return handleCORS(NextResponse.json(aging || []))
    }

    if (route === '/reports/sales-by-rep' && method === 'GET') {
      const userContext = await getUserBusinessId(supabase)
      if (!userContext) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      }

      // Fetch orders with order items and products
      const { data: orders, error } = await supabase
        .from('orders')
        .select('id, sales_rep_id, total_amount, status, created_at, order_items(quantity, unit_price, total_price, product_id, products(name, sku))')
        .eq('business_id', userContext.businessId)
        .eq('status', 'confirmed')
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

      const logs = await getAuditLogs(userContext.businessId, {
        limit,
        resourceType,
        userId
      })

      return handleCORS(NextResponse.json(logs))
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
