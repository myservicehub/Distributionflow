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
    const { searchParams } = new URL(request.url)
    const { page, pageSize, from, to } = getPaginationParams(request)
    
    // Date filtering
    const dateFrom = searchParams.get('from')
    const dateTo = searchParams.get('to')

    let query = supabase
      .from('orders')
      .select('*, retailers(shop_name, owner_name), sales_rep:users!orders_sales_rep_id_fkey(name), order_items(*, products(name, sku))', { count: 'exact' })
      .eq('business_id', userContext.businessId)
      .order('created_at', { ascending: false })
      .range(from, to)
    
    // Apply date filters if provided
    if (dateFrom) {
      query = query.gte('created_at', dateFrom)
    }
    if (dateTo) {
      query = query.lte('created_at', dateTo)
    }

    // Sales reps only see their orders
    query = applySalesRepFilter(query, userContext, 'sales_rep_id')

    const { data: orders, error, count } = await query

    if (error) throw error

    // Format response with nested data
    const formattedOrders = (orders || []).map(order => ({
      ...order,
      retailer_name: order.retailers?.shop_name || 'N/A',
      sales_rep_name: order.sales_rep?.name || 'N/A'  // Fixed: use sales_rep alias, not users
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

    // Determine the amount actually paid based on payment_status
    let amountPaid = 0
    if (validatedData.payment_status === 'paid') {
      amountPaid = subtotal
    } else if (validatedData.payment_status === 'partial') {
      const partial = validatedData.amount_paid
      if (partial === undefined || partial === null || partial <= 0) {
        return errorResponse('For a partial payment, amount_paid must be greater than 0.', 400)
      }
      if (partial >= subtotal) {
        return errorResponse('Partial amount must be less than the order total. Use "Paid" instead.', 400)
      }
      amountPaid = partial
    } // 'credit' → amountPaid stays 0

    const outstanding = subtotal - amountPaid

    // DUPLICATE CHECK: Check for identical order in last 60 seconds (double-submit guard)
    const sixtySecondsAgo = new Date(Date.now() - 60000).toISOString()
    const calculatedTotal = subtotal
    
    const { data: recentOrder } = await supabase
      .from('orders')
      .select('id, created_at')
      .eq('business_id', userContext.businessId)
      .eq('retailer_id', validatedData.retailer_id)
      .gte('total_amount', calculatedTotal - 0.01)
      .lte('total_amount', calculatedTotal + 0.01)
      .gte('created_at', sixtySecondsAgo)
      .maybeSingle()

    if (recentOrder) {
      return errorResponse(
        'An identical order was just created for this retailer. If this is intentional, please wait 60 seconds and try again.',
        409,
        {
          error: 'Duplicate order',
          code: 'DUPLICATE_ORDER'
        }
      )
    }

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
        delivery_status: 'not_started',  // Initialize delivery workflow
        is_legacy_order: false,  // Mark as new workflow order
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

    // Update retailer balance with any outstanding amount, and record the payment
    if (outstanding > 0) {
      const { data: retailer } = await supabase
        .from('retailers')
        .select('current_balance')
        .eq('id', validatedData.retailer_id)
        .eq('business_id', userContext.businessId)
        .single()

      const newBalance = parseFloat(retailer?.current_balance || 0) + outstanding
      await supabase
        .from('retailers')
        .update({ current_balance: newBalance, updated_at: new Date().toISOString() })
        .eq('id', validatedData.retailer_id)
        .eq('business_id', userContext.businessId)
    }

    if (amountPaid > 0) {
      await supabase
        .from('payments')
        .insert({
          business_id: userContext.businessId,
          retailer_id: validatedData.retailer_id,
          amount_paid: amountPaid,
          payment_method: 'cash',
          notes: `Payment recorded with order ${order.id} (${validatedData.payment_status})`,
          recorded_by: userContext.userId,
        })
    }

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
