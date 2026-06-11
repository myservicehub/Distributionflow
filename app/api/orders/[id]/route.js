import { NextResponse } from 'next/server'
import { createSupabaseClient, getUserBusinessId, handleCORS, errorResponse, successResponse } from '@/lib/api/helpers'
import { enforceSubscription } from '@/lib/api/subscription'
import { logAudit, AUDIT_ACTIONS, RESOURCE_TYPES } from '@/lib/audit-logger'
import { sendNotification } from '@/lib/notifications'

export async function GET(request, { params }) {
  const supabase = createSupabaseClient()
  const userContext = await getUserBusinessId(supabase)
  if (!userContext) return errorResponse('Unauthorized', 401)

  try {
    const { data: order, error } = await supabase
      .from('orders')
      .select(`
        *,
        retailers(shop_name, owner_name, phone, address),
        sales_rep:users!orders_sales_rep_id_fkey(name, email),
        order_items(*, products(name, sku, unit_price))
      `)
      .eq('id', params.id)
      .eq('business_id', userContext.businessId)
      .single()

    if (error || !order) return errorResponse('Order not found', 404)
    return successResponse(order)
  } catch (error) {
    console.error('Error fetching order:', error)
    return errorResponse('Failed to fetch order', 500)
  }
}

export async function PUT(request, { params }) {
  const supabase = createSupabaseClient()
  const userContext = await getUserBusinessId(supabase)
  if (!userContext) return errorResponse('Unauthorized', 401)

  const subscriptionError = await enforceSubscription(userContext.businessId)
  if (subscriptionError) return errorResponse(subscriptionError.message, 402)

  try {
    const body = await request.json()
    const { order_status, payment_status, notes, delivery_notes } = body

    // Permission checks by action
    if (order_status === 'approved' || order_status === 'rejected') {
      if (!['admin', 'manager'].includes(userContext.role)) {
        return errorResponse('Forbidden: Only admins and managers can approve/reject orders', 403)
      }
    }

    if (order_status === 'packed' || order_status === 'dispatched') {
      if (!['admin', 'manager', 'warehouse'].includes(userContext.role)) {
        return errorResponse('Forbidden: Only warehouse staff can update delivery status', 403)
      }
    }

    // Build update payload — only include fields that were sent
    const updatePayload = { updated_at: new Date().toISOString() }
    if (order_status !== undefined) updatePayload.order_status = order_status
    if (payment_status !== undefined) updatePayload.payment_status = payment_status
    if (notes !== undefined) updatePayload.notes = notes
    if (delivery_notes !== undefined) updatePayload.delivery_notes = delivery_notes

    const { data: order, error: updateError } = await supabase
      .from('orders')
      .update(updatePayload)
      .eq('id', params.id)
      .eq('business_id', userContext.businessId)
      .select()
      .single()

    if (updateError) throw updateError
    if (!order) return errorResponse('Order not found', 404)

    // Send notifications on status changes
    if (order_status === 'approved') {
      await sendNotification(supabase, order.sales_rep_id, userContext.businessId,
        'order_approved', `Order #${order.order_number} has been approved.`, { order_id: order.id })
    } else if (order_status === 'rejected') {
      await sendNotification(supabase, order.sales_rep_id, userContext.businessId,
        'order_rejected', `Order #${order.order_number} has been rejected.`, { order_id: order.id })
    }

    await logAudit(supabase, userContext.userId, userContext.businessId,
      AUDIT_ACTIONS.UPDATE, RESOURCE_TYPES.ORDER, order.id,
      { order_number: order.order_number, new_status: order_status || payment_status })

    return successResponse({ success: true, data: order })
  } catch (error) {
    console.error('Error updating order:', error)
    return errorResponse('Failed to update order', 500)
  }
}

export async function OPTIONS() {
  return handleCORS(new NextResponse(null, { status: 200 }))
}
