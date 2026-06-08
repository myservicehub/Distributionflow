import { NextResponse } from 'next/server'
import { createSupabaseClient, getUserBusinessId, handleCORS, getPaginationParams, buildPaginationResponse, errorResponse, successResponse } from '@/lib/api/helpers'
import { enforceSubscription } from '@/lib/api/subscription'
import { CreateRetailerSchema, UpdateRetailerSchema, parseBody } from '@/lib/api/validation'
import { logAudit, AUDIT_ACTIONS, RESOURCE_TYPES } from '@/lib/audit-logger'
import { sendNotification } from '@/lib/notifications'

// Helper to apply sales rep filter
function applySalesRepFilter(query, userContext, columnName = 'assigned_rep_id') {
  if (userContext.role === 'sales_rep') {
    return query.eq(columnName, userContext.userId)
  }
  return query
}

/**
 * GET /api/retailers
 * List all retailers with pagination
 */
export async function GET(request) {
  const supabase = createSupabaseClient()
  
  const userContext = await getUserBusinessId(supabase)
  if (!userContext) {
    return errorResponse('Unauthorized', 401)
  }

  try {
    const { page, pageSize, from, to } = getPaginationParams(request)

    let query = supabase
      .from('retailers')
      .select('*', { count: 'exact' })
      .eq('business_id', userContext.businessId)
      .order('created_at', { ascending: false })
      .range(from, to)

    // Sales reps only see their assigned retailers
    query = applySalesRepFilter(query, userContext, 'assigned_rep_id')

    const { data: retailers, error, count } = await query

    if (error) throw error

    // Fetch assigned rep data using admin client
    const { createClient } = await import('@supabase/supabase-js')
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const retailersWithRep = await Promise.all(
      (retailers || []).map(async (retailer) => {
        if (retailer.assigned_rep_id) {
          const { data: assignedRep } = await supabaseAdmin
            .from('users')
            .select('id, name, email, role')
            .eq('id', retailer.assigned_rep_id)
            .single()
          
          return { ...retailer, users: assignedRep }
        }
        return { ...retailer, users: null }
      })
    )

    const response = buildPaginationResponse(retailersWithRep, count, { page, pageSize })
    return successResponse(response)
  } catch (error) {
    console.error('Error fetching retailers:', error)
    return errorResponse('Failed to fetch retailers', 500)
  }
}

/**
 * POST /api/retailers
 * Create a new retailer
 */
export async function POST(request) {
  const supabase = createSupabaseClient()
  
  const userContext = await getUserBusinessId(supabase)
  if (!userContext) {
    return errorResponse('Unauthorized', 401)
  }

  // Subscription check
  const subscriptionError = await enforceSubscription(userContext.businessId)
  if (subscriptionError) {
    return errorResponse(subscriptionError.message, 402)
  }

  // Permission check
  if (!['admin', 'manager'].includes(userContext.role)) {
    return errorResponse('Forbidden: Only admins and managers can create retailers', 403)
  }

  try {
    // Check plan limits
    const { data: planData } = await supabase
      .from('businesses')
      .select('plans(features)')
      .eq('id', userContext.businessId)
      .single()

    const maxRetailers = planData?.plans?.features?.max_retailers || 999999

    const { count: currentRetailers } = await supabase
      .from('retailers')
      .select('*', { count: 'exact', head: true })
      .eq('business_id', userContext.businessId)

    if (currentRetailers >= maxRetailers) {
      return errorResponse(
        `Your current plan allows ${maxRetailers} retailers. You have ${currentRetailers}. Please upgrade to add more.`,
        402
      )
    }

    const body = await request.json()
    const { error: validationError, data: validatedData } = parseBody(CreateRetailerSchema, body)
    
    if (validationError) {
      return validationError
    }

    // Create retailer
    const { data: retailer, error: createError } = await supabase
      .from('retailers')
      .insert([{
        ...validatedData,
        business_id: userContext.businessId,
        current_balance: 0,
        status: 'active'
      }])
      .select()
      .single()

    if (createError) throw createError

    // Audit log
    await logAudit(
      supabase,
      userContext.userId,
      userContext.businessId,
      AUDIT_ACTIONS.CREATE,
      RESOURCE_TYPES.RETAILER,
      retailer.id,
      { retailer_name: retailer.shop_name }
    )

    // Notification
    if (validatedData.assigned_rep_id) {
      await sendNotification(
        supabase,
        validatedData.assigned_rep_id,
        userContext.businessId,
        'retailer_assigned',
        `You have been assigned a new retailer: ${retailer.shop_name}`,
        { retailer_id: retailer.id }
      )
    }

    return successResponse({ success: true, data: retailer }, 201)
  } catch (error) {
    console.error('Error creating retailer:', error)
    return errorResponse('Failed to create retailer', 500)
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS(request) {
  return handleCORS(new NextResponse(null, { status: 200 }))
}
