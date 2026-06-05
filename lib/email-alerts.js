// Email Alerts System
// Sends role-based email notifications for premium users

import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'
import { hasFeature, FEATURES } from './subscription'

const resend = new Resend(process.env.RESEND_API_KEY)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

function getAdminClient() {
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

// Alert types and their role access
export const ALERT_TYPES = {
  // Operational Alerts
  LOW_STOCK: 'low_stock',
  OVERDUE_PAYMENT: 'overdue_payment',
  LARGE_ORDER: 'large_order',
  ORDER_STATUS: 'order_status',
  NEW_RETAILER: 'new_retailer',
  STAFF_ACTIVITY: 'staff_activity',
  
  // Business Intelligence
  DAILY_SUMMARY: 'daily_summary',
  WEEKLY_DIGEST: 'weekly_digest',
  MONTHLY_SUMMARY: 'monthly_summary',
  
  // Critical Alerts
  FRAUD_DETECTION: 'fraud_detection',
  SYSTEM_ERROR: 'system_error',
  PAYMENT_FAILURE: 'payment_failure',
  SUBSCRIPTION_WARNING: 'subscription_warning'
}

// Role-based alert routing
const ALERT_ROLE_ACCESS = {
  [ALERT_TYPES.LOW_STOCK]: ['admin', 'manager', 'warehouse'],
  [ALERT_TYPES.OVERDUE_PAYMENT]: ['admin', 'manager'],
  [ALERT_TYPES.LARGE_ORDER]: ['admin', 'manager'],
  [ALERT_TYPES.ORDER_STATUS]: ['admin', 'manager', 'sales_rep'], // Sales reps get their own only
  [ALERT_TYPES.NEW_RETAILER]: ['admin', 'manager'],
  [ALERT_TYPES.STAFF_ACTIVITY]: ['admin'],
  [ALERT_TYPES.DAILY_SUMMARY]: ['admin', 'manager'],
  [ALERT_TYPES.WEEKLY_DIGEST]: ['admin', 'manager'],
  [ALERT_TYPES.MONTHLY_SUMMARY]: ['admin'],
  [ALERT_TYPES.FRAUD_DETECTION]: ['admin', 'manager'],
  [ALERT_TYPES.SYSTEM_ERROR]: ['admin'],
  [ALERT_TYPES.PAYMENT_FAILURE]: ['admin', 'manager'],
  [ALERT_TYPES.SUBSCRIPTION_WARNING]: ['admin']
}

/**
 * Check if business has email alerts enabled
 */
async function hasEmailAlerts(businessId) {
  try {
    return await hasFeature(businessId, 'email_alerts')
  } catch (error) {
    console.error('Error checking email_alerts feature:', error)
    return false
  }
}

/**
 * Get users who should receive an alert
 */
async function getAlertRecipients(businessId, alertType, contextUserId = null) {
  const supabase = getAdminClient()
  
  const allowedRoles = ALERT_ROLE_ACCESS[alertType] || []
  
  const { data: users, error } = await supabase
    .from('users')
    .select('id, email, name, role')
    .eq('business_id', businessId)
    .eq('status', 'active')
    .in('role', allowedRoles)
  
  if (error) throw error
  
  // For order status alerts, filter to relevant sales rep if specified
  if (alertType === ALERT_TYPES.ORDER_STATUS && contextUserId) {
    return users.filter(u => u.role !== 'sales_rep' || u.id === contextUserId)
  }
  
  return users || []
}

/**
 * Send email alert
 */
async function sendEmailAlert(to, subject, html) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'DistributionFlow <alerts@distributionflow.com>',
      to: [to],
      subject: subject,
      html: html
    })

    if (error) {
      console.error('Resend error:', error)
      return { success: false, error }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Email send error:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Log alert for audit trail
 */
async function logAlert(businessId, userId, alertType, subject, status) {
  const supabase = getAdminClient()
  
  try {
    await supabase.from('alert_logs').insert({
      business_id: businessId,
      user_id: userId,
      alert_type: alertType,
      subject: subject,
      status: status,
      sent_at: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error logging alert:', error)
  }
}

// ============================================
// ALERT TEMPLATES
// ============================================

function getLowStockTemplate(product, currentStock, threshold) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%); padding: 20px; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">⚠️ Low Stock Alert</h1>
      </div>
      
      <div style="background: #fff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
        <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
          <strong>${product.name}</strong> is running low on stock.
        </p>
        
        <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
          <p style="margin: 0; color: #92400e;">
            <strong>Current Stock:</strong> ${currentStock} units<br>
            <strong>Threshold:</strong> ${threshold} units<br>
            <strong>SKU:</strong> ${product.sku || 'N/A'}
          </p>
        </div>
        
        <p style="color: #6b7280; margin-top: 20px;">
          Please restock this product soon to avoid stockouts and lost sales.
        </p>
        
        <a href="${process.env.NEXT_PUBLIC_BASE_URL}/products" 
           style="display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px;">
          Manage Products
        </a>
      </div>
      
      <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
        <p>DistributionFlow - Inventory Management System</p>
      </div>
    </div>
  `
}

function getOverduePaymentTemplate(retailer, balance, creditLimit) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 20px; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">💳 Overdue Payment Alert</h1>
      </div>
      
      <div style="background: #fff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
        <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
          <strong>${retailer.shop_name}</strong> has exceeded their credit limit.
        </p>
        
        <div style="background: #fee2e2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0;">
          <p style="margin: 0; color: #991b1b;">
            <strong>Current Balance:</strong> ₦${parseFloat(balance).toLocaleString()}<br>
            <strong>Credit Limit:</strong> ₦${parseFloat(creditLimit).toLocaleString()}<br>
            <strong>Overdue:</strong> ₦${(parseFloat(balance) - parseFloat(creditLimit)).toLocaleString()}
          </p>
        </div>
        
        <p style="color: #6b7280; margin-top: 20px;">
          <strong>Retailer Details:</strong><br>
          Owner: ${retailer.owner_name || 'N/A'}<br>
          Phone: ${retailer.phone || 'N/A'}<br>
          Address: ${retailer.address || 'N/A'}
        </p>
        
        <a href="${process.env.NEXT_PUBLIC_BASE_URL}/retailers" 
           style="display: inline-block; background: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px;">
          View Retailer
        </a>
      </div>
      
      <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
        <p>DistributionFlow - Credit Management System</p>
      </div>
    </div>
  `
}

function getLargeOrderTemplate(order, retailer, items) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 20px; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">📦 Large Order Notification</h1>
      </div>
      
      <div style="background: #fff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
        <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
          A large order has been placed by <strong>${retailer.shop_name}</strong>.
        </p>
        
        <div style="background: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0;">
          <p style="margin: 0; color: #1e40af;">
            <strong>Order ID:</strong> #${order.id.substring(0, 8)}<br>
            <strong>Total Amount:</strong> ₦${parseFloat(order.total_amount).toLocaleString()}<br>
            <strong>Items:</strong> ${items.length} products<br>
            <strong>Payment Status:</strong> ${order.payment_status}
          </p>
        </div>
        
        <a href="${process.env.NEXT_PUBLIC_BASE_URL}/orders" 
           style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px;">
          View Order
        </a>
      </div>
      
      <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
        <p>DistributionFlow - Order Management System</p>
      </div>
    </div>
  `
}

function getDailySummaryTemplate(metrics, businessName) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%); padding: 20px; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">📊 Daily Sales Summary</h1>
        <p style="color: #e9d5ff; margin: 5px 0 0 0;">${businessName}</p>
      </div>
      
      <div style="background: #fff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
        <h2 style="color: #374151; font-size: 18px; margin-bottom: 20px;">Today's Performance</h2>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0;">
          <div style="background: #f3f4f6; padding: 15px; border-radius: 6px;">
            <p style="color: #6b7280; font-size: 12px; margin: 0;">Total Sales</p>
            <p style="color: #111827; font-size: 24px; font-weight: bold; margin: 5px 0 0 0;">
              ₦${parseFloat(metrics.totalSales || 0).toLocaleString()}
            </p>
          </div>
          
          <div style="background: #f3f4f6; padding: 15px; border-radius: 6px;">
            <p style="color: #6b7280; font-size: 12px; margin: 0;">Orders</p>
            <p style="color: #111827; font-size: 24px; font-weight: bold; margin: 5px 0 0 0;">
              ${metrics.totalOrders || 0}
            </p>
          </div>
        </div>
        
        <div style="background: #f9fafb; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <p style="color: #374151; font-weight: bold; margin: 0 0 10px 0;">Quick Stats:</p>
          <p style="color: #6b7280; font-size: 14px; margin: 5px 0;">
            • New Retailers: ${metrics.newRetailers || 0}<br>
            • Low Stock Items: ${metrics.lowStockItems || 0}<br>
            • Outstanding Debt: ₦${parseFloat(metrics.totalDebt || 0).toLocaleString()}
          </p>
        </div>
        
        <a href="${process.env.NEXT_PUBLIC_BASE_URL}/dashboard" 
           style="display: inline-block; background: #8b5cf6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px;">
          View Full Dashboard
        </a>
      </div>
      
      <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
        <p>DistributionFlow - Daily Digest</p>
      </div>
    </div>
  `
}

// ============================================
// PUBLIC API
// ============================================

/**
 * Send low stock alert
 */
export async function sendLowStockAlert(businessId, product, currentStock, threshold) {
  try {
    // Check if business has email alerts
    const hasAlerts = await hasEmailAlerts(businessId)
    if (!hasAlerts) {
      console.log('Email alerts not enabled for business:', businessId)
      return { success: false, reason: 'feature_not_enabled' }
    }

    const recipients = await getAlertRecipients(businessId, ALERT_TYPES.LOW_STOCK)
    
    const subject = `⚠️ Low Stock Alert: ${product.name}`
    const html = getLowStockTemplate(product, currentStock, threshold)
    
    for (const user of recipients) {
      const result = await sendEmailAlert(user.email, subject, html)
      await logAlert(businessId, user.id, ALERT_TYPES.LOW_STOCK, subject, result.success ? 'sent' : 'failed')
    }
    
    return { success: true, sentTo: recipients.length }
  } catch (error) {
    console.error('Error sending low stock alert:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Send overdue payment alert
 */
export async function sendOverduePaymentAlert(businessId, retailer, balance, creditLimit) {
  try {
    const hasAlerts = await hasEmailAlerts(businessId)
    if (!hasAlerts) return { success: false, reason: 'feature_not_enabled' }

    const recipients = await getAlertRecipients(businessId, ALERT_TYPES.OVERDUE_PAYMENT)
    
    const subject = `💳 Payment Overdue: ${retailer.shop_name}`
    const html = getOverduePaymentTemplate(retailer, balance, creditLimit)
    
    for (const user of recipients) {
      const result = await sendEmailAlert(user.email, subject, html)
      await logAlert(businessId, user.id, ALERT_TYPES.OVERDUE_PAYMENT, subject, result.success ? 'sent' : 'failed')
    }
    
    return { success: true, sentTo: recipients.length }
  } catch (error) {
    console.error('Error sending overdue payment alert:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Send large order alert
 */
export async function sendLargeOrderAlert(businessId, order, retailer, items, threshold = 100000) {
  try {
    // Only send if order exceeds threshold
    if (parseFloat(order.total_amount) < threshold) {
      return { success: false, reason: 'below_threshold' }
    }

    const hasAlerts = await hasEmailAlerts(businessId)
    if (!hasAlerts) return { success: false, reason: 'feature_not_enabled' }

    const recipients = await getAlertRecipients(businessId, ALERT_TYPES.LARGE_ORDER)
    
    const subject = `📦 Large Order Alert: ₦${parseFloat(order.total_amount).toLocaleString()}`
    const html = getLargeOrderTemplate(order, retailer, items)
    
    for (const user of recipients) {
      const result = await sendEmailAlert(user.email, subject, html)
      await logAlert(businessId, user.id, ALERT_TYPES.LARGE_ORDER, subject, result.success ? 'sent' : 'failed')
    }
    
    return { success: true, sentTo: recipients.length }
  } catch (error) {
    console.error('Error sending large order alert:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Send daily summary (for cron job)
 */
export async function sendDailySummary(businessId) {
  try {
    const hasAlerts = await hasEmailAlerts(businessId)
    if (!hasAlerts) return { success: false, reason: 'feature_not_enabled' }

    const supabase = getAdminClient()
    
    // Get business name
    const { data: business } = await supabase
      .from('businesses')
      .select('name')
      .eq('id', businessId)
      .single()
    
    // Calculate today's metrics
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const { data: orders } = await supabase
      .from('orders')
      .select('total_amount')
      .eq('business_id', businessId)
      .gte('created_at', today.toISOString())
    
    const { data: retailers } = await supabase
      .from('retailers')
      .select('current_balance')
      .eq('business_id', businessId)
    
    const { count: lowStockCount } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('business_id', businessId)
      .filter('stock_quantity', 'lte', 'low_stock_threshold')
    
    const metrics = {
      totalSales: orders?.reduce((sum, o) => sum + parseFloat(o.total_amount), 0) || 0,
      totalOrders: orders?.length || 0,
      totalDebt: retailers?.reduce((sum, r) => sum + parseFloat(r.current_balance), 0) || 0,
      lowStockItems: lowStockCount || 0,
      newRetailers: 0 // Would need to track this
    }
    
    const recipients = await getAlertRecipients(businessId, ALERT_TYPES.DAILY_SUMMARY)
    
    const subject = `📊 Daily Summary - ${business?.name || 'Your Business'}`
    const html = getDailySummaryTemplate(metrics, business?.name || 'Your Business')
    
    for (const user of recipients) {
      const result = await sendEmailAlert(user.email, subject, html)
      await logAlert(businessId, user.id, ALERT_TYPES.DAILY_SUMMARY, subject, result.success ? 'sent' : 'failed')
    }
    
    return { success: true, sentTo: recipients.length }
  } catch (error) {
    console.error('Error sending daily summary:', error)
    return { success: false, error: error.message }
  }
}
