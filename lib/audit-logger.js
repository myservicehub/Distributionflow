// Audit Logger Utility
// Logs all critical actions in the application

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Create admin client for logging (bypasses RLS)
const getAdminClient = () => {
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

/**
 * Log an action to audit_logs table
 * @param {Object} params - Logging parameters
 * @param {string} params.businessId - Business ID
 * @param {string} params.userId - User who performed the action
 * @param {string} params.action - Action performed (e.g., 'staff_created', 'staff_updated')
 * @param {string} params.resourceType - Type of resource (e.g., 'user', 'retailer', 'product')
 * @param {string} params.resourceId - ID of the resource
 * @param {Object} params.details - Additional details (what changed, etc.)
 * @param {string} params.ipAddress - Optional IP address
 */
export async function logAudit({
  businessId,
  userId,
  action,
  resourceType,
  resourceId,
  details = {},
  ipAddress = null
}) {
  try {
    const supabase = getAdminClient()
    
    const { error } = await supabase
      .from('audit_logs')
      .insert({
        business_id: businessId,
        user_id: userId,
        action: action,
        resource_type: resourceType,
        resource_id: resourceId,
        details: details,
        ip_address: ipAddress,
        created_at: new Date().toISOString()
      })

    if (error) {
      console.error('Audit log error:', error)
      // Don't throw - logging failures shouldn't break the app
    }
  } catch (error) {
    console.error('Audit log exception:', error)
    // Don't throw - logging failures shouldn't break the app
  }
}

/**
 * Get audit logs for a business
 * @param {string} businessId - Business ID
 * @param {Object} options - Query options
 * @param {number} options.limit - Number of logs to return
 * @param {string} options.resourceType - Filter by resource type
 * @param {string} options.userId - Filter by user
 */
export async function getAuditLogs(businessId, options = {}) {
  const { limit = 100, resourceType, userId } = options
  
  try {
    const supabase = getAdminClient()
    
    let query = supabase
      .from('audit_logs')
      .select('*, users(name, email)')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (resourceType) {
      query = query.eq('resource_type', resourceType)
    }

    if (userId) {
      query = query.eq('user_id', userId)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Get audit logs error:', error)
    return []
  }
}

// Action types for consistency
export const AUDIT_ACTIONS = {
  // Staff actions
  STAFF_CREATED: 'staff_created',
  STAFF_UPDATED: 'staff_updated',
  STAFF_DEACTIVATED: 'staff_deactivated',
  STAFF_REACTIVATED: 'staff_reactivated',
  
  // Retailer actions
  RETAILER_CREATED: 'retailer_created',
  RETAILER_UPDATED: 'retailer_updated',
  RETAILER_DELETED: 'retailer_deleted',
  CREDIT_LIMIT_CHANGED: 'credit_limit_changed',
  
  // Product actions
  PRODUCT_CREATED: 'product_created',
  PRODUCT_UPDATED: 'product_updated',
  PRODUCT_DELETED: 'product_deleted',
  
  // Order actions
  ORDER_CREATED: 'order_created',
  ORDER_UPDATED: 'order_updated',
  ORDER_CANCELLED: 'order_cancelled',
  
  // Payment actions
  PAYMENT_RECORDED: 'payment_recorded',
  PAYMENT_UPDATED: 'payment_updated',
  PAYMENT_DELETED: 'payment_deleted',
  
  // Auth actions
  PASSWORD_CHANGED: 'password_changed',
  PASSWORD_RESET: 'password_reset',
  LOGIN_SUCCESS: 'login_success',
  LOGIN_FAILED: 'login_failed'
}

// Resource types
export const RESOURCE_TYPES = {
  USER: 'user',
  RETAILER: 'retailer',
  PRODUCT: 'product',
  ORDER: 'order',
  PAYMENT: 'payment',
  BUSINESS: 'business'
}
