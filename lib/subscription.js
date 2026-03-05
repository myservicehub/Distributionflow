// Subscription & Billing Utility Functions
// Server-side only

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

/**
 * Create admin Supabase client (bypasses RLS)
 */
function getAdminClient() {
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

/**
 * Check if a business has access to a specific feature
 * @param {string} businessId - Business UUID
 * @param {string} featureName - Feature key (e.g., 'empty_lifecycle', 'multi_warehouse')
 * @returns {Promise<boolean>}
 */
export async function hasFeature(businessId, featureName) {
  try {
    const supabase = getAdminClient()
    
    const { data, error } = await supabase.rpc('has_feature', {
      p_business_id: businessId,
      p_feature_name: featureName
    })

    if (error) {
      console.error('Error checking feature access:', error)
      return false
    }

    return data === true
  } catch (error) {
    console.error('Feature check error:', error)
    return false
  }
}

/**
 * Get active users count for a business
 * @param {string} businessId - Business UUID
 * @returns {Promise<number>}
 */
export async function getActiveUsersCount(businessId) {
  try {
    const supabase = getAdminClient()
    
    const { data, error } = await supabase.rpc('get_active_users_count', {
      p_business_id: businessId
    })

    if (error) throw error
    return data || 0
  } catch (error) {
    console.error('Error getting active users count:', error)
    return 0
  }
}

/**
 * Calculate subscription amount for a business
 * @param {string} businessId - Business UUID
 * @param {string} planId - Optional plan UUID (uses current plan if not provided)
 * @returns {Promise<Object>} Billing breakdown
 */
export async function calculateSubscriptionAmount(businessId, planId = null) {
  try {
    const supabase = getAdminClient()
    
    const { data, error } = await supabase.rpc('calculate_subscription_amount', {
      p_business_id: businessId,
      p_plan_id: planId
    })

    if (error) throw error
    
    // Return first row (function returns table)
    return data?.[0] || null
  } catch (error) {
    console.error('Error calculating subscription amount:', error)
    throw error
  }
}

/**
 * Check if business subscription is active
 * @param {string} businessId - Business UUID
 * @returns {Promise<boolean>}
 */
export async function isSubscriptionActive(businessId) {
  try {
    const supabase = getAdminClient()
    
    const { data, error } = await supabase
      .from('businesses')
      .select('subscription_status')
      .eq('business_id', businessId)
      .single()

    if (error) throw error
    
    return ['active', 'trial'].includes(data?.subscription_status)
  } catch (error) {
    console.error('Error checking subscription status:', error)
    return false
  }
}

/**
 * Get business subscription details
 * @param {string} businessId - Business UUID
 * @returns {Promise<Object>}
 */
export async function getSubscriptionDetails(businessId) {
  try {
    const supabase = getAdminClient()
    
    const { data, error } = await supabase
      .from('businesses')
      .select(`
        subscription_status,
        subscription_start,
        subscription_end,
        trial_end_date,
        billing_cycle,
        plan_id,
        plans (
          name,
          display_name,
          description,
          base_price,
          included_users,
          price_per_extra_user,
          features
        )
      `)
      .eq('business_id', businessId)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error getting subscription details:', error)
    return null
  }
}

/**
 * Get all available plans
 * @returns {Promise<Array>}
 */
export async function getAvailablePlans() {
  try {
    const supabase = getAdminClient()
    
    const { data, error } = await supabase
      .from('plans')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error getting plans:', error)
    return []
  }
}

/**
 * Create subscription record
 * @param {Object} subscriptionData - Subscription details
 * @returns {Promise<Object>}
 */
export async function createSubscription(subscriptionData) {
  try {
    const supabase = getAdminClient()
    
    const { data, error } = await supabase
      .from('subscriptions')
      .insert(subscriptionData)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error creating subscription:', error)
    throw error
  }
}

/**
 * Update business subscription status
 * @param {string} businessId - Business UUID
 * @param {Object} updates - Fields to update
 * @returns {Promise<boolean>}
 */
export async function updateBusinessSubscription(businessId, updates) {
  try {
    const supabase = getAdminClient()
    
    const { error } = await supabase
      .from('businesses')
      .update(updates)
      .eq('business_id', businessId)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error updating business subscription:', error)
    return false
  }
}

/**
 * Log subscription event
 * @param {Object} eventData - Event details
 * @returns {Promise<void>}
 */
export async function logSubscriptionEvent(eventData) {
  try {
    const supabase = getAdminClient()
    
    await supabase
      .from('subscription_events')
      .insert(eventData)
  } catch (error) {
    console.error('Error logging subscription event:', error)
  }
}

/**
 * Check if business can add more users
 * @param {string} businessId - Business UUID
 * @returns {Promise<Object>} { allowed: boolean, message: string, extraCost: number }
 */
export async function canAddUser(businessId) {
  try {
    const billing = await calculateSubscriptionAmount(businessId)
    
    if (!billing) {
      return { allowed: false, message: 'Unable to calculate billing', extraCost: 0 }
    }

    const newActiveUsers = billing.active_users + 1
    const newExtraUsers = Math.max(0, newActiveUsers - billing.included_users)
    const extraCost = newExtraUsers * billing.price_per_extra_user

    if (newExtraUsers > billing.extra_users) {
      return {
        allowed: true,
        message: `Adding this user will exceed your included user limit. Additional cost: ₦${extraCost.toLocaleString()}/month`,
        extraCost: billing.price_per_extra_user,
        requiresConfirmation: true
      }
    }

    return {
      allowed: true,
      message: 'User can be added within plan limits',
      extraCost: 0,
      requiresConfirmation: false
    }
  } catch (error) {
    console.error('Error checking user limit:', error)
    return { allowed: false, message: 'Error checking user limits', extraCost: 0 }
  }
}

/**
 * Get subscription invoices for a business
 * @param {string} businessId - Business UUID
 * @param {number} limit - Number of invoices to fetch
 * @returns {Promise<Array>}
 */
export async function getInvoices(businessId, limit = 10) {
  try {
    const supabase = getAdminClient()
    
    const { data, error } = await supabase
      .from('subscription_invoices')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error getting invoices:', error)
    return []
  }
}

/**
 * Create invoice
 * @param {Object} invoiceData - Invoice details
 * @returns {Promise<Object>}
 */
export async function createInvoice(invoiceData) {
  try {
    const supabase = getAdminClient()
    
    // Get next invoice number
    const { data: invoiceNumber } = await supabase.rpc('get_next_invoice_number')
    
    const { data, error } = await supabase
      .from('subscription_invoices')
      .insert({
        ...invoiceData,
        invoice_number: invoiceNumber
      })
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error creating invoice:', error)
    throw error
  }
}

/**
 * Check and expire trials (for cron job)
 * @returns {Promise<Object>} { expired: number, errors: number }
 */
export async function checkAndExpireTrials() {
  try {
    const supabase = getAdminClient()
    
    // Find businesses with expired trials
    const { data: expiredBusinesses, error: fetchError } = await supabase
      .from('businesses')
      .select('business_id, name')
      .eq('subscription_status', 'trial')
      .lt('trial_end_date', new Date().toISOString())

    if (fetchError) throw fetchError

    let expired = 0
    let errors = 0

    for (const business of expiredBusinesses || []) {
      try {
        // Update to expired status
        await updateBusinessSubscription(business.business_id, {
          subscription_status: 'expired'
        })

        // Log event
        await logSubscriptionEvent({
          business_id: business.business_id,
          event_type: 'trial_expired',
          previous_status: 'trial',
          new_status: 'expired',
          metadata: { expired_at: new Date().toISOString() }
        })

        expired++
      } catch (error) {
        console.error(`Error expiring trial for business ${business.business_id}:`, error)
        errors++
      }
    }

    return { expired, errors, total: expiredBusinesses?.length || 0 }
  } catch (error) {
    console.error('Error checking trials:', error)
    throw error
  }
}

// Feature gating constants
export const FEATURES = {
  EMPTY_LIFECYCLE: 'empty_lifecycle',
  MULTI_WAREHOUSE: 'multi_warehouse',
  FRAUD_DETECTION: 'fraud_detection',
  SMS_ALERTS: 'sms_alerts',
  API_ACCESS: 'api_access',
  ADVANCED_REPORTS: 'advanced_reports',
  PRIORITY_SUPPORT: 'priority_support',
  CUSTOM_INTEGRATIONS: 'custom_integrations'
}

// Subscription status constants
export const SUBSCRIPTION_STATUS = {
  TRIAL: 'trial',
  ACTIVE: 'active',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled',
  SUSPENDED: 'suspended'
}
