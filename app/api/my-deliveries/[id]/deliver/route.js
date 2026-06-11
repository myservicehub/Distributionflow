import { NextResponse } from 'next/server'
import { createSupabaseClient, getUserBusinessId, errorResponse, successResponse } from '@/lib/api/helpers'
import { createClient } from '@supabase/supabase-js'
import { sendNotification } from '@/lib/notifications'
import { sendDeliverySMS, formatNigerianPhone } from '@/lib/sms-notifications'

// Create admin client for bypassing RLS when needed
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const adminSupabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

/**
 * POST /api/my-deliveries/[id]/deliver
 * Mark delivery as completed with proof of delivery
 */
export async function POST(request, { params }) {
  const supabase = createSupabaseClient()
  const userContext = await getUserBusinessId(supabase)
  
  if (!userContext) {
    return errorResponse('Unauthorized', 401)
  }

  // Only drivers can access this endpoint
  if (userContext.role !== 'driver') {
    return errorResponse('Forbidden: Only drivers can access this endpoint', 403)
  }

  const orderId = params.id

  try {
    const body = await request.json()
    const { proof_url, note, latitude, longitude } = body

    if (!proof_url) {
      return errorResponse('Proof of delivery photo is required', 400)
    }

    // Verify this order is assigned to this driver
    const { data: order, error: orderError } = await adminSupabase
      .from('orders')
      .select('*, retailers(shop_name, owner_name, phone), driver_id, drivers(user_id)')
      .eq('id', orderId)
      .eq('business_id', userContext.businessId)
      .single()

    if (orderError || !order) {
      return errorResponse('Order not found', 404)
    }

    // Check if driver is assigned to this order
    const isAssigned = order.driver_id && order.drivers?.user_id === userContext.userId
    const isNameMatch = order.driver_name && order.driver_name.toLowerCase().includes(userContext.name?.toLowerCase())

    if (!isAssigned && !isNameMatch) {
      return errorResponse('You are not assigned to this delivery', 403)
    }

    // Check if already delivered
    if (order.delivery_status === 'delivered') {
      return errorResponse('This order has already been marked as delivered', 400)
    }

    // Update order with proof of delivery
    const updateData = {
      delivery_status: 'delivered',
      order_status: 'completed',
      proof_of_delivery_url: proof_url,
      proof_of_delivery_note: note || null,
      proof_captured_at: new Date().toISOString(),
      delivered_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    // Add location if provided
    if (latitude && longitude) {
      updateData.delivery_location = `POINT(${longitude} ${latitude})`
    }

    const { data: updatedOrder, error: updateError } = await adminSupabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating order:', updateError)
      throw updateError
    }

    // Increment driver delivery stats
    if (order.driver_id) {
      const { error: statsError } = await adminSupabase
        .rpc('increment_driver_deliveries', {
          p_driver_id: order.driver_id,
          p_success: true
        })

      if (statsError) {
        console.error('Error updating driver stats:', statsError)
      }
    }

    // Send notification to admins/managers
    await sendNotification({
      title: 'Delivery Completed',
      message: `Order #${order.order_number} has been delivered to ${order.retailers?.shop_name || 'retailer'} by ${userContext.name || 'driver'}.`,
      type: 'order',
      targetRoles: ['admin', 'manager'],
      businessId: userContext.businessId,
      triggeredBy: userContext.userId,
      relatedTable: 'orders',
      relatedRecordId: orderId
    })

    // Send SMS to retailer if phone is available
    if (order.retailers?.phone) {
      const formattedPhone = formatNigerianPhone(order.retailers.phone)
      if (formattedPhone) {
        await sendDeliverySMS({
          to: formattedPhone,
          orderReference: order.order_number,
          status: 'delivered',
          retailerName: order.retailers.shop_name
        })
      }
    }

    return successResponse({
      success: true,
      message: 'Delivery marked as completed',
      order: updatedOrder
    })

  } catch (error) {
    console.error('Error in POST /api/my-deliveries/[id]/deliver:', error)
    return errorResponse('Failed to mark delivery as completed', 500)
  }
}
