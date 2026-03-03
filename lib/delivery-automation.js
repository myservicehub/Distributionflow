/**
 * Delivery Automation Services
 * Background jobs for delivery delay warnings and auto-cancel pending orders
 */

import { createClient } from '@supabase/supabase-js'
import { sendNotification } from './notifications'
import { sendDeliverySMS, sendDelayWarningSMS } from './sms-notifications'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

/**
 * Check for delayed deliveries and send warnings
 * Should be run periodically (every hour)
 */
export async function checkDelayedDeliveries() {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Get all businesses
    const { data: businesses } = await supabase
      .from('businesses')
      .select('id, name')
    
    if (!businesses || businesses.length === 0) return { processed: 0 }
    
    let totalWarnings = 0
    
    for (const business of businesses) {
      // Get business settings
      const { data: settings } = await supabase
        .from('delivery_automation_settings')
        .select('settings')
        .eq('business_id', business.id)
        .maybeSingle()
      
      const delayThresholdHours = settings?.settings?.delivery_delay_warning_hours || 24
      const thresholdDate = new Date()
      thresholdDate.setHours(thresholdDate.getHours() - delayThresholdHours)
      
      // Find orders that are out for delivery and past threshold
      const { data: delayedOrders } = await supabase
        .from('orders')
        .select(`
          id,
          delivery_reference,
          dispatched_at,
          retailer_id,
          total_amount,
          retailers (
            shop_name,
            phone_number
          )
        `)
        .eq('business_id', business.id)
        .eq('delivery_status', 'out_for_delivery')
        .lt('dispatched_at', thresholdDate.toISOString())
      
      if (!delayedOrders || delayedOrders.length === 0) continue
      
      for (const order of delayedOrders) {
        const hoursSinceDispatch = Math.floor(
          (new Date() - new Date(order.dispatched_at)) / (1000 * 60 * 60)
        )
        
        // Send in-app notification
        await sendNotification({
          title: 'Delivery Delay Warning',
          message: `Order #${order.id.substring(0, 8)} for ${order.retailers?.shop_name} has been out for delivery for ${hoursSinceDispatch} hours. Please investigate.`,
          type: 'order',
          targetRole: 'all',
          businessId: business.id,
          triggeredBy: null,
          relatedTable: 'orders',
          relatedRecordId: order.id
        })
        
        // Send SMS to retailer if phone number available
        if (order.retailers?.phone_number) {
          await sendDelayWarningSMS({
            to: order.retailers.phone_number,
            orderReference: order.id,
            hoursSinceDispatch
          })
        }
        
        totalWarnings++
      }
    }
    
    console.log(`Delivery delay check complete. ${totalWarnings} warnings sent.`)
    return { processed: totalWarnings }
  } catch (error) {
    console.error('Error checking delayed deliveries:', error)
    return { error: error.message }
  }
}

/**
 * Auto-cancel orders that have been pending too long
 * Should be run periodically (every 6 hours)
 */
export async function autoCancelPendingOrders() {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Get all businesses
    const { data: businesses } = await supabase
      .from('businesses')
      .select('id, name')
    
    if (!businesses || businesses.length === 0) return { processed: 0 }
    
    let totalCancelled = 0
    
    for (const business of businesses) {
      // Get business settings
      const { data: settings } = await supabase
        .from('delivery_automation_settings')
        .select('settings')
        .eq('business_id', business.id)
        .maybeSingle()
      
      const autoCancelHours = settings?.settings?.auto_cancel_pending_hours || 48
      const thresholdDate = new Date()
      thresholdDate.setHours(thresholdDate.getHours() - autoCancelHours)
      
      // Find old pending orders
      const { data: pendingOrders } = await supabase
        .from('orders')
        .select(`
          id,
          sales_rep_id,
          retailer_id,
          total_amount,
          created_at,
          retailers (
            shop_name
          ),
          users:sales_rep_id (
            name,
            email
          )
        `)
        .eq('business_id', business.id)
        .in('order_status', ['pending', 'awaiting_credit_approval'])
        .eq('is_legacy_order', false)
        .lt('created_at', thresholdDate.toISOString())
      
      if (!pendingOrders || pendingOrders.length === 0) continue
      
      for (const order of pendingOrders) {
        // Update order status to cancelled
        await supabase
          .from('orders')
          .update({
            order_status: 'cancelled',
            status: 'cancelled'
          })
          .eq('id', order.id)
        
        const hoursPending = Math.floor(
          (new Date() - new Date(order.created_at)) / (1000 * 60 * 60)
        )
        
        // Send notification to sales rep and managers
        await sendNotification({
          title: 'Order Auto-Cancelled',
          message: `Order #${order.id.substring(0, 8)} for ${order.retailers?.shop_name || 'Unknown'} was automatically cancelled after ${hoursPending} hours without approval.`,
          type: 'order',
          targetRole: 'all',
          businessId: business.id,
          triggeredBy: null,
          relatedTable: 'orders',
          relatedRecordId: order.id
        })
        
        totalCancelled++
      }
    }
    
    console.log(`Auto-cancel check complete. ${totalCancelled} orders cancelled.`)
    return { processed: totalCancelled }
  } catch (error) {
    console.error('Error auto-cancelling orders:', error)
    return { error: error.message }
  }
}

/**
 * Run all automation tasks
 * This can be called from a cron job or API endpoint
 */
export async function runDeliveryAutomation() {
  console.log('Running delivery automation tasks...')
  
  const delayResults = await checkDelayedDeliveries()
  const cancelResults = await autoCancelPendingOrders()
  
  return {
    timestamp: new Date().toISOString(),
    delayWarnings: delayResults,
    autoCancelled: cancelResults
  }
}

/**
 * Calculate delivery statistics for a business
 */
export async function calculateDeliveryStats(businessId, startDate = null, endDate = null) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    let query = supabase
      .from('orders')
      .select('*')
      .eq('business_id', businessId)
      .eq('order_status', 'completed')
      .not('is_legacy_order', 'eq', true)
    
    if (startDate) query = query.gte('created_at', startDate)
    if (endDate) query = query.lte('created_at', endDate)
    
    const { data: orders } = await query
    
    if (!orders || orders.length === 0) {
      return {
        totalOrders: 0,
        averageDeliveryTime: 0,
        onTimeDeliveryRate: 0,
        failedDeliveryRate: 0
      }
    }
    
    // Calculate average delivery time (confirmed to delivered)
    const deliveryTimes = orders
      .filter(o => o.confirmed_at && o.delivered_at)
      .map(o => {
        const confirmed = new Date(o.confirmed_at)
        const delivered = new Date(o.delivered_at)
        return (delivered - confirmed) / (1000 * 60 * 60) // hours
      })
    
    const avgDeliveryTime = deliveryTimes.length > 0
      ? deliveryTimes.reduce((a, b) => a + b, 0) / deliveryTimes.length
      : 0
    
    // Calculate on-time delivery rate (delivered within 48 hours)
    const onTimeDeliveries = deliveryTimes.filter(t => t <= 48).length
    const onTimeRate = deliveryTimes.length > 0
      ? (onTimeDeliveries / deliveryTimes.length) * 100
      : 0
    
    // Get failed deliveries
    const { data: failedOrders } = await supabase
      .from('orders')
      .select('id')
      .eq('business_id', businessId)
      .eq('delivery_status', 'failed')
      .not('is_legacy_order', 'eq', true)
    
    const failedRate = orders.length > 0
      ? ((failedOrders?.length || 0) / (orders.length + (failedOrders?.length || 0))) * 100
      : 0
    
    return {
      totalOrders: orders.length,
      averageDeliveryTime: Math.round(avgDeliveryTime * 10) / 10,
      onTimeDeliveryRate: Math.round(onTimeRate * 10) / 10,
      failedDeliveryRate: Math.round(failedRate * 10) / 10,
      totalRevenue: orders.reduce((sum, o) => sum + parseFloat(o.total_amount), 0)
    }
  } catch (error) {
    console.error('Error calculating delivery stats:', error)
    throw error
  }
}
