// Notification Utility Functions
// Centralized notification management

import { createClient } from '@/lib/supabase/server'
import { sendEmailToAdminsAndManagers, isCriticalNotification } from '@/lib/email-notifications'

/**
 * Notification types and their configurations
 */
export const NOTIFICATION_TYPES = {
  INFO: 'info',
  WARNING: 'warning',
  CRITICAL: 'critical'
}

export const NOTIFICATION_ACTIONS = {
  // Financial
  PAYMENT_EDITED: 'payment_edited',
  PAYMENT_DELETED: 'payment_deleted',
  LARGE_PAYMENT: 'large_payment',
  CREDIT_LIMIT_CHANGED: 'credit_limit_changed',
  RETAILER_UNBLOCKED: 'retailer_unblocked',
  
  // Orders
  ORDER_CANCELLED: 'order_cancelled',
  ORDER_MODIFIED: 'order_modified',
  CREDIT_LIMIT_OVERRIDE: 'credit_limit_override',
  PARTIAL_PAYMENT: 'partial_payment',
  
  // Inventory
  STOCK_ADJUSTED: 'stock_adjusted',
  LOW_STOCK: 'low_stock',
  LARGE_STOCK_DEDUCTION: 'large_stock_deduction',
  NEGATIVE_STOCK_BLOCKED: 'negative_stock_blocked',
  
  // Staff
  STAFF_ADDED: 'staff_added',
  STAFF_ROLE_CHANGED: 'staff_role_changed',
  STAFF_DEACTIVATED: 'staff_deactivated'
}

/**
 * Send notification to admin and/or manager
 * @param {Object} params Notification parameters
 * @returns {Promise<Object>} Created notification
 */
export async function sendNotification({
  title,
  message,
  type = 'info',
  targetRole = 'all',
  businessId,
  triggeredBy,
  relatedTable = null,
  relatedRecordId = null
}) {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        business_id: businessId,
        title,
        message,
        type,
        target_role: targetRole,
        triggered_by: triggeredBy,
        related_table: relatedTable,
        related_record_id: relatedRecordId
      })
      .select()
      .single()
    
    if (error) {
      console.error('Error creating notification:', error)
      throw error
    }

    // Send email for critical notifications
    if (isCriticalNotification(data)) {
      try {
        // Import supabase admin client
        const { createClient: createAdminClient } = await import('@supabase/supabase-js')
        const supabaseAdmin = createAdminClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.SUPABASE_SERVICE_ROLE_KEY
        )

        // Check if email notifications are enabled for this business
        const { data: businessSettings } = await supabaseAdmin
          .from('business_settings')
          .select('settings')
          .eq('business_id', businessId)
          .maybeSingle()

        const emailEnabled = businessSettings?.settings?.notifications?.email_notifications_enabled ?? true

        if (emailEnabled) {
          // Send email to all admins and managers
          await sendEmailToAdminsAndManagers({
            notification: data,
            businessId,
            supabaseAdmin
          })
        } else {
          console.log('Email notifications disabled for this business')
        }
      } catch (emailError) {
        console.error('Failed to send email notification:', emailError)
        // Don't fail the notification if email fails
      }
    }
    
    return data
  } catch (error) {
    console.error('Failed to send notification:', error)
    // Don't throw - notifications should fail silently to not break main operations
    return null
  }
}

/**
 * Get business settings for notification thresholds
 * @param {string} businessId
 * @returns {Promise<Object>} Business settings
 */
export async function getBusinessSettings(businessId) {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('business_settings')
      .select('*')
      .eq('business_id', businessId)
      .single()
    
    if (error && error.code !== 'PGRST116') {
      throw error
    }
    
    // Return defaults if no settings exist
    return data || {
      large_payment_threshold: 250000,
      large_stock_deduction_threshold: 100,
      large_stock_deduction_type: 'absolute',
      notification_retention_days: 90,
      enable_sound_notifications: true,
      enable_email_notifications: false
    }
  } catch (error) {
    console.error('Error fetching business settings:', error)
    // Return defaults on error
    return {
      large_payment_threshold: 250000,
      large_stock_deduction_threshold: 100,
      large_stock_deduction_type: 'absolute',
      notification_retention_days: 90,
      enable_sound_notifications: true,
      enable_email_notifications: false
    }
  }
}

/**
 * Check if payment amount exceeds threshold
 * @param {number} amount
 * @param {string} businessId
 * @returns {Promise<boolean>}
 */
export async function isLargePayment(amount, businessId) {
  const settings = await getBusinessSettings(businessId)
  return parseFloat(amount) >= parseFloat(settings.large_payment_threshold)
}

/**
 * Check if stock deduction exceeds threshold
 * @param {number} quantity
 * @param {number} totalStock
 * @param {string} businessId
 * @returns {Promise<boolean>}
 */
export async function isLargeStockDeduction(quantity, totalStock, businessId) {
  const settings = await getBusinessSettings(businessId)
  
  if (settings.large_stock_deduction_type === 'percentage') {
    const percentage = (quantity / totalStock) * 100
    return percentage >= settings.large_stock_deduction_threshold
  } else {
    return quantity >= settings.large_stock_deduction_threshold
  }
}

/**
 * Format currency for notifications
 * @param {number} amount
 * @returns {string}
 */
export function formatCurrency(amount) {
  return `₦${parseFloat(amount).toLocaleString()}`
}

/**
 * Get notification message templates
 */
export const NOTIFICATION_TEMPLATES = {
  // Financial
  PAYMENT_EDITED: (amount, retailer, user) => ({
    title: 'Payment Edited',
    message: `Payment of ${formatCurrency(amount)} for ${retailer} was edited by ${user}.`,
    type: NOTIFICATION_TYPES.WARNING
  }),
  
  PAYMENT_DELETED: (amount, retailer, user) => ({
    title: 'Payment Deleted',
    message: `Payment of ${formatCurrency(amount)} for ${retailer} was deleted by ${user}.`,
    type: NOTIFICATION_TYPES.CRITICAL
  }),
  
  LARGE_PAYMENT: (amount, retailer, user) => ({
    title: 'Large Payment Recorded',
    message: `Large payment of ${formatCurrency(amount)} recorded for ${retailer} by ${user}.`,
    type: NOTIFICATION_TYPES.INFO
  }),
  
  CREDIT_LIMIT_CHANGED: (retailer, oldLimit, newLimit, user) => ({
    title: 'Credit Limit Changed',
    message: `Credit limit for ${retailer} changed from ${formatCurrency(oldLimit)} to ${formatCurrency(newLimit)} by ${user}.`,
    type: NOTIFICATION_TYPES.WARNING
  }),
  
  RETAILER_UNBLOCKED: (retailer, user) => ({
    title: 'Retailer Unblocked',
    message: `Retailer ${retailer} was manually unblocked by ${user}.`,
    type: NOTIFICATION_TYPES.WARNING
  }),
  
  // Orders
  ORDER_CANCELLED: (orderId, retailer, user) => ({
    title: 'Order Cancelled',
    message: `Order #${orderId} for ${retailer} was cancelled by ${user}.`,
    type: NOTIFICATION_TYPES.WARNING
  }),
  
  ORDER_MODIFIED: (orderId, user) => ({
    title: 'Order Modified',
    message: `Order #${orderId} was modified after confirmation by ${user}.`,
    type: NOTIFICATION_TYPES.WARNING
  }),
  
  CREDIT_LIMIT_OVERRIDE: (orderId, retailer, amount) => ({
    title: 'Credit Limit Override',
    message: `Order #${orderId} for ${retailer} exceeds credit limit but was approved. Amount: ${formatCurrency(amount)}.`,
    type: NOTIFICATION_TYPES.CRITICAL
  }),
  
  // Inventory
  STOCK_ADJUSTED: (product, quantity, user) => ({
    title: 'Stock Adjusted',
    message: `Stock adjusted by ${quantity > 0 ? '+' : ''}${quantity} units for ${product} by ${user}.`,
    type: NOTIFICATION_TYPES.INFO
  }),
  
  LOW_STOCK: (product, quantity, threshold) => ({
    title: 'Low Stock Alert',
    message: `${product} is running low. Current stock: ${quantity} units (Threshold: ${threshold}).`,
    type: NOTIFICATION_TYPES.WARNING
  }),
  
  LARGE_STOCK_DEDUCTION: (product, quantity, user) => ({
    title: 'Large Stock Deduction',
    message: `Large stock deduction of ${quantity} units for ${product} by ${user}.`,
    type: NOTIFICATION_TYPES.WARNING
  }),
  
  // Staff
  STAFF_ADDED: (staffName, role, user) => ({
    title: 'New Staff Added',
    message: `New staff added: ${staffName} – ${role} by ${user}.`,
    type: NOTIFICATION_TYPES.INFO
  }),
  
  STAFF_ROLE_CHANGED: (staffName, oldRole, newRole, user) => ({
    title: 'Staff Role Changed',
    message: `${staffName}'s role changed from ${oldRole} to ${newRole} by ${user}.`,
    type: NOTIFICATION_TYPES.WARNING
  }),
  
  STAFF_DEACTIVATED: (staffName, user) => ({
    title: 'Staff Deactivated',
    message: `Staff account deactivated: ${staffName} by ${user}.`,
    type: NOTIFICATION_TYPES.WARNING
  })
}
