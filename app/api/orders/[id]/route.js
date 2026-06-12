import { NextResponse } from 'next/server'
import { createSupabaseClient, getUserBusinessId, handleCORS, errorResponse, successResponse } from '@/lib/api/helpers'
import { enforceSubscription } from '@/lib/api/subscription'
import { logAudit, AUDIT_ACTIONS, RESOURCE_TYPES } from '@/lib/audit-logger'
import { sendNotification } from '@/lib/notifications'
import { sendDriverDispatchSMS, sendDeliverySMS, formatNigerianPhone } from '@/lib/sms-notifications'
import { createClient } from '@supabase/supabase-js'

// Create admin client for driver lookups
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const adminSupabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

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
        order_items(*, products(name, sku, selling_price, cost_price, empty_item_id))
      `)
      .eq('id', params.id)
      .eq('business_id', userContext.businessId)
      .single()

    if (error) {
      console.error('Error fetching order:', error)
      return errorResponse('Order not found', 404)
    }
    
    if (!order) {
      return errorResponse('Order not found', 404)
    }
    
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
    const { action, order_status, payment_status, notes, delivery_notes, driver_id, driver_name, driver_phone, vehicle_number } = body

    // Build update payload first
    const updatePayload = { updated_at: new Date().toISOString() }

    // Handle action-based updates from delivery board
    let effectiveOrderStatus = order_status
    let effectiveDeliveryStatus = body.delivery_status
    
    if (action) {
      switch (action) {
        case 'pack':
          effectiveDeliveryStatus = 'packed'
          updatePayload.packed_at = new Date().toISOString()
          break
        case 'dispatch':
          effectiveDeliveryStatus = 'out_for_delivery'
          updatePayload.dispatched_at = new Date().toISOString()
          break
        case 'deliver':
          effectiveDeliveryStatus = 'delivered'
          effectiveOrderStatus = 'completed'
          updatePayload.delivered_at = new Date().toISOString()
          break
        default:
          // Unknown action - ignore
          break
      }
    }

    // Permission checks by action or status
    if (effectiveOrderStatus === 'confirmed' || effectiveOrderStatus === 'cancelled') {
      if (!['admin', 'manager'].includes(userContext.role)) {
        return errorResponse('Forbidden: Only admins and managers can approve/reject orders', 403)
      }
    }

    if (effectiveDeliveryStatus === 'packed' || effectiveDeliveryStatus === 'out_for_delivery') {
      if (!['admin', 'manager', 'warehouse'].includes(userContext.role)) {
        return errorResponse('Forbidden: Only warehouse staff can update delivery status', 403)
      }
    }
    
    // Map order_status to BOTH new and old database columns for compatibility
    if (effectiveOrderStatus !== undefined) {
      // Old status column only accepts: pending, confirmed, delivered, cancelled
      // Map 'completed' to 'delivered' for backwards compatibility
      updatePayload.status = effectiveOrderStatus === 'completed' ? 'delivered' : effectiveOrderStatus
      updatePayload.order_status = effectiveOrderStatus  // New column accepts 'completed'
      
      // Auto-set delivery_status based on order_status for delivery workflow
      if (effectiveOrderStatus === 'confirmed' && effectiveDeliveryStatus === undefined) {
        effectiveDeliveryStatus = 'preparing'  // Start delivery workflow
        updatePayload.confirmed_at = new Date().toISOString()
        updatePayload.confirmed_by = userContext.userId
      } else if (effectiveOrderStatus === 'cancelled' && effectiveDeliveryStatus === undefined) {
        effectiveDeliveryStatus = 'not_started'  // Cancel delivery workflow
      }
    }
    
    if (effectiveDeliveryStatus !== undefined) {
      updatePayload.delivery_status = effectiveDeliveryStatus
    }
    
    if (payment_status !== undefined) updatePayload.payment_status = payment_status
    if (notes !== undefined) updatePayload.notes = notes
    if (delivery_notes !== undefined) updatePayload.delivery_notes = delivery_notes
    if (driver_id !== undefined) updatePayload.driver_id = driver_id
    if (driver_name !== undefined) updatePayload.driver_name = driver_name
    if (vehicle_number !== undefined) updatePayload.vehicle_number = vehicle_number
    
    // Set dispatched_at timestamp when status changes to dispatched (if not already set by action)
    if (effectiveOrderStatus === 'dispatched' || effectiveDeliveryStatus === 'out_for_delivery') {
      if (!updatePayload.dispatched_at) {
        updatePayload.dispatched_at = new Date().toISOString()
      }
    }

    const { data: order, error: updateError } = await supabase
      .from('orders')
      .update(updatePayload)
      .eq('id', params.id)
      .eq('business_id', userContext.businessId)
      .select()
      .single()

    if (updateError) {
      // Check if order not found
      if (updateError.code === 'PGRST116') {
        return errorResponse('Order not found', 404)
      }
      throw updateError
    }
    
    if (!order) return errorResponse('Order not found', 404)

    // Send notifications on status changes
    if (order_status === 'approved') {
      await sendNotification({
        title: 'Order Approved',
        message: `Order #${order.order_number} has been approved.`,
        type: 'order',
        targetRoles: ['sales_rep'],
        businessId: userContext.businessId,
        triggeredBy: userContext.userId,
        relatedTable: 'orders',
        relatedRecordId: order.id
      })
    } else if (order_status === 'rejected') {
      await sendNotification({
        title: 'Order Rejected',
        message: `Order #${order.order_number} has been rejected.`,
        type: 'order',
        targetRoles: ['sales_rep'],
        businessId: userContext.businessId,
        triggeredBy: userContext.userId,
        relatedTable: 'orders',
        relatedRecordId: order.id
      })
    }

    // Handle driver assignment and dispatch notifications
    if (body.driver_id || body.driver_name) {
      try {
        // Get full order details with retailer info
        const { data: fullOrder } = await adminSupabase
          .from('orders')
          .select('*, retailers(shop_name, address, phone), drivers(name, phone, user_id)')
          .eq('id', params.id)
          .single()

        if (fullOrder) {
          // Send in-app notification to driver if driver has a user account
          if (fullOrder.drivers?.user_id) {
            await sendNotification({
              title: 'New Delivery Assignment',
              message: `You've been assigned to deliver Order #${fullOrder.order_number} to ${fullOrder.retailers?.shop_name || 'a retailer'}.`,
              type: 'order',
              targetRoles: ['driver'],
              businessId: userContext.businessId,
              triggeredBy: userContext.userId,
              relatedTable: 'orders',
              relatedRecordId: fullOrder.id
            })
          }

          // Send SMS to driver if phone is available
          const driverPhone = fullOrder.drivers?.phone || body.driver_phone
          if (driverPhone) {
            const formattedPhone = formatNigerianPhone(driverPhone)
            if (formattedPhone) {
              await sendDriverDispatchSMS({
                to: formattedPhone,
                driverName: fullOrder.drivers?.name || body.driver_name || 'Driver',
                orderReference: fullOrder.order_number,
                retailerName: fullOrder.retailers?.shop_name || 'the retailer',
                deliveryAddress: fullOrder.retailers?.address || 'the delivery address'
              })
            }
          }

          // Send SMS to retailer about dispatch
          if (fullOrder.retailers?.phone && order_status === 'dispatched') {
            const retailerPhone = formatNigerianPhone(fullOrder.retailers.phone)
            if (retailerPhone) {
              await sendDeliverySMS({
                to: retailerPhone,
                orderReference: fullOrder.order_number,
                status: 'out_for_delivery',
                retailerName: fullOrder.retailers.shop_name,
                driverName: fullOrder.drivers?.name || body.driver_name,
                vehicleNumber: fullOrder.vehicle_number || body.vehicle_number
              })
            }
          }
        }
      } catch (notifError) {
        console.error('Error sending driver notifications:', notifError)
        // Don't fail the whole request if notifications fail
      }
    }

    // Only log audit if we have valid context
    if (userContext.businessId && userContext.userId) {
      await logAudit(supabase, userContext.userId, userContext.businessId,
        AUDIT_ACTIONS.UPDATE, RESOURCE_TYPES.ORDER, order.id,
        { order_number: order.order_number, new_status: order_status || payment_status })
    }

    return successResponse({ success: true, data: order })
  } catch (error) {
    console.error('Error updating order:', error)
    return errorResponse('Failed to update order', 500)
  }
}

export async function OPTIONS() {
  return handleCORS(new NextResponse(null, { status: 200 }))
}
