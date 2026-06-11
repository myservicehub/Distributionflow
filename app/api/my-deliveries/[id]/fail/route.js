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
 * POST /api/my-deliveries/[id]/fail
 * Mark delivery as failed with reason
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
    const { reason, note, proof_url, latitude, longitude } = body

    if (!reason) {
      return errorResponse('Failure reason is required', 400)
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

    // Check if already completed
    if (order.delivery_status === 'delivered' || order.delivery_status === 'failed') {
      return errorResponse('This order has already been completed', 400)
    }

    // Build failure note
    const failureNote = `DELIVERY FAILED: ${reason}${note ? '. Additional notes: ' + note : ''}`

    // Update order with failure details
    const updateData = {
      delivery_status: 'failed',
      delivery_notes: failureNote,
      proof_of_delivery_note: note || null,
      updated_at: new Date().toISOString()
    }

    // Add proof photo if provided
    if (proof_url) {
      updateData.proof_of_delivery_url = proof_url
      updateData.proof_captured_at = new Date().toISOString()
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

    // Increment driver delivery stats (failed)
    if (order.driver_id) {
      const { error: statsError } = await adminSupabase
        .rpc('increment_driver_deliveries', {
          p_driver_id: order.driver_id,
          p_success: false
        })

      if (statsError) {
        console.error('Error updating driver stats:', statsError)
      }
    }

    // Send critical notification to admins/managers
    await sendNotification({
      title: 'Delivery Failed',
      message: `Order #${order.order_number} delivery to ${order.retailers?.shop_name || 'retailer'} failed. Reason: ${reason}`,
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
          status: 'failed',
          retailerName: order.retailers.shop_name
        })
      }
    }

    return successResponse({
      success: true,
      message: 'Delivery marked as failed',
      order: updatedOrder
    })

  } catch (error) {
    console.error('Error in POST /api/my-deliveries/[id]/fail:', error)
    return errorResponse('Failed to mark delivery as failed', 500)
  }
}
