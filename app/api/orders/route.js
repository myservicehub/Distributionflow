import { NextResponse } from 'next/server'
import { createSupabaseClient, getUserBusinessId, handleCORS, getPaginationParams, buildPaginationResponse, errorResponse, successResponse } from '@/lib/api/helpers'
import { enforceSubscription } from '@/lib/api/subscription'
import { CreateOrderSchema, parseBody } from '@/lib/api/validation'
import { logAudit, AUDIT_ACTIONS, RESOURCE_TYPES } from '@/lib/audit-logger'
import { sendNotification } from '@/lib/notifications'

// Helper to apply sales rep filter
function applySalesRepFilter(query, userContext, columnName = 'sales_rep_id') {
  if (userContext.role === 'sales_rep') {
    return query.eq(columnName, userContext.userId)
  }
  return query
}

/**
 * GET /api/orders
 * List all orders with pagination
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
      .from('orders')
      .select('*, retailers(shop_name, owner_name), users!orders_sales_rep_id_fkey(name)', { count: 'exact' })
      .eq('business_id', userContext.businessId)
      .order('created_at', { ascending: false })
      .range(from, to)

    // Sales reps only see their orders
    query = applySalesRepFilter(query, userContext, 'sales_rep_id')

    const { data: orders, error, count } = await query

    if (error) throw error

    // Format response with nested data
    const formattedOrders = (orders || []).map(order => ({
      ...order,
      retailer_name: order.retailers?.shop_name || 'N/A',
      sales_rep_name: order.users?.name || 'N/A'
    }))

    const response = buildPaginationResponse(formattedOrders, count, { page, pageSize })
    return successResponse(response)
  } catch (error) {
    console.error('Error fetching orders:', error)
    return errorResponse('Failed to fetch orders', 500)
  }
}

/**
 * POST /api/orders
 * Create a new order
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

  try {
    const body = await request.json()
    const { error: validationError, data: validatedData } = parseBody(CreateOrderSchema, body)
    
    if (validationError) {
      return validationError
    }

    // Calculate totals
    const subtotal = validatedData.items.reduce((sum, item) => 
      sum + (item.quantity * item.unit_price), 0
    )

    // Create order
    const { data: order, error: createError } = await supabase
      .from('orders')
      .insert([{
        business_id: userContext.businessId,
        retailer_id: validatedData.retailer_id,
        sales_rep_id: userContext.userId,
        subtotal,
        total_amount: subtotal,
        payment_status: validatedData.payment_status,
        order_status: 'pending',
        notes: validatedData.notes || null
      }])
      .select()
      .single()

    if (createError) throw createError

    // Create order items
    const orderItems = validatedData.items.map(item => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.quantity * item.unit_price
    }))

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems)

    if (itemsError) throw itemsError

    // Audit log
    await logAudit(
      supabase,
      userContext.userId,
      userContext.businessId,
      AUDIT_ACTIONS.CREATE,
      RESOURCE_TYPES.ORDER,
      order.id,
      { order_number: order.order_number, total: order.total_amount }
    )

    // Notification to managers
    await sendNotification(
      supabase,
      null,
      userContext.businessId,
      'new_order',
      `New order #${order.order_number} created by ${userContext.role}`,
      { order_id: order.id }
    )

    return successResponse({ success: true, data: order }, 201)
  } catch (error) {
    console.error('Error creating order:', error)
    return errorResponse('Failed to create order', 500)
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS(request) {
  return handleCORS(new NextResponse(null, { status: 200 }))
}
