// Platform Admin Utilities
// Server-side only functions for super admin operations

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Create admin client (bypasses RLS)
export function getAdminClient() {
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

// Check if user is super admin
export async function isSuperAdmin(authUserId) {
  const adminClient = getAdminClient()
  
  const { data, error } = await adminClient
    .from('platform_admins')
    .select('id, role, status')
    .eq('auth_user_id', authUserId)
    .eq('status', 'active')
    .single()
  
  return !error && data && data.role === 'super_admin'
}

// Get super admin profile
export async function getSuperAdminProfile(authUserId) {
  const adminClient = getAdminClient()
  
  const { data, error } = await adminClient
    .from('platform_admins')
    .select('*')
    .eq('auth_user_id', authUserId)
    .eq('status', 'active')
    .single()
  
  if (error) return null
  return data
}

// Log platform action
export async function logPlatformAction({
  adminId,
  action,
  targetType = null,
  targetId = null,
  details = {},
  ipAddress = null
}) {
  const adminClient = getAdminClient()
  
  const { error } = await adminClient
    .from('platform_audit_logs')
    .insert({
      admin_id: adminId,
      action,
      target_type: targetType,
      target_id: targetId,
      details,
      ip_address: ipAddress
    })
  
  if (error) {
    console.error('Failed to log platform action:', error)
  }
}

// Get platform KPIs
export async function getPlatformKPIs() {
  const adminClient = getAdminClient()
  
  const { data, error } = await adminClient
    .rpc('get_platform_kpis')
  
  if (error) throw error
  return data[0] || {}
}

// Get all businesses with details
export async function getAllBusinesses(filters = {}) {
  const adminClient = getAdminClient()
  
  let query = adminClient
    .from('businesses')
    .select(`
      *,
      plans (
        id,
        name,
        display_name,
        base_price,
        included_users,
        price_per_extra_user
      )
    `)
  
  // Apply filters
  if (filters.status) {
    query = query.eq('subscription_status', filters.status)
  }
  
  if (filters.plan) {
    query = query.eq('plan_id', filters.plan)
  }
  
  if (filters.businessStatus) {
    query = query.eq('status', filters.businessStatus)
  }
  
  query = query.order('created_at', { ascending: false })
  
  const { data, error } = await query
  
  if (error) throw error
  
  // Get active users count for each business
  const businessesWithUsers = await Promise.all(
    data.map(async (business) => {
      const { count } = await adminClient
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', business.id)
        .eq('status', 'active')
      
      return {
        ...business,
        active_users: count || 0
      }
    })
  )
  
  return businessesWithUsers
}

// Get business detail with all data
export async function getBusinessDetail(businessId) {
  const adminClient = getAdminClient()
  
  // Get business info
  const { data: business, error: businessError } = await adminClient
    .from('businesses')
    .select(`
      *,
      plans (*)
    `)
    .eq('id', businessId)
    .single()
  
  if (businessError) throw businessError
  
  // Get users count
  const { count: usersCount } = await adminClient
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('business_id', businessId)
    .eq('status', 'active')
  
  // Get retailers count
  const { count: retailersCount } = await adminClient
    .from('retailers')
    .select('*', { count: 'exact', head: true })
    .eq('business_id', businessId)
  
  // Get orders count (last 30 days)
  const { count: ordersCount } = await adminClient
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('business_id', businessId)
    .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
  
  // Get products count
  const { count: productsCount } = await adminClient
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('business_id', businessId)
  
  return {
    ...business,
    active_users: usersCount || 0,
    retailers_count: retailersCount || 0,
    orders_last_30_days: ordersCount || 0,
    products_count: productsCount || 0
  }
}

// Suspend business
export async function suspendBusiness(businessId, adminId, reason) {
  const adminClient = getAdminClient()
  
  const { error } = await adminClient
    .from('businesses')
    .update({
      status: 'suspended',
      suspended_at: new Date().toISOString(),
      suspended_by: adminId,
      suspension_reason: reason
    })
    .eq('id', businessId)
  
  if (error) throw error
  
  // Log action
  await logPlatformAction({
    adminId,
    action: 'business_suspended',
    targetType: 'business',
    targetId: businessId,
    details: { reason }
  })
}

// Reactivate business
export async function reactivateBusiness(businessId, adminId) {
  const adminClient = getAdminClient()
  
  const { error } = await adminClient
    .from('businesses')
    .update({
      status: 'active',
      suspended_at: null,
      suspended_by: null,
      suspension_reason: null
    })
    .eq('id', businessId)
  
  if (error) throw error
  
  // Log action
  await logPlatformAction({
    adminId,
    action: 'business_reactivated',
    targetType: 'business',
    targetId: businessId
  })
}

// Reset trial
export async function resetTrial(businessId, adminId, days = 14) {
  const adminClient = getAdminClient()
  
  const newTrialEnd = new Date()
  newTrialEnd.setDate(newTrialEnd.getDate() + days)
  
  const { error } = await adminClient
    .from('businesses')
    .update({
      subscription_status: 'trial',
      trial_end_date: newTrialEnd.toISOString()
    })
    .eq('id', businessId)
  
  if (error) throw error
  
  // Log action
  await logPlatformAction({
    adminId,
    action: 'trial_reset',
    targetType: 'business',
    targetId: businessId,
    details: { days, new_trial_end: newTrialEnd }
  })
}

// Create impersonation session
export async function createImpersonationSession(adminId, businessId) {
  const adminClient = getAdminClient()
  
  // Generate unique token
  const token = `imp_${Math.random().toString(36).substring(2)}_${Date.now()}`
  
  // Set expiry (2 hours)
  const expiresAt = new Date()
  expiresAt.setHours(expiresAt.getHours() + 2)
  
  const { data, error } = await adminClient
    .from('impersonation_sessions')
    .insert({
      admin_id: adminId,
      business_id: businessId,
      token,
      expires_at: expiresAt.toISOString()
    })
    .select()
    .single()
  
  if (error) throw error
  
  // Log action
  await logPlatformAction({
    adminId,
    action: 'impersonation_started',
    targetType: 'business',
    targetId: businessId,
    details: { token, expires_at: expiresAt }
  })
  
  return data
}

// Verify impersonation session
export async function verifyImpersonationSession(token) {
  const adminClient = getAdminClient()
  
  const { data, error } = await adminClient
    .from('impersonation_sessions')
    .select('*, businesses(*)')
    .eq('token', token)
    .is('ended_at', null)
    .gt('expires_at', new Date().toISOString())
    .single()
  
  if (error) return null
  return data
}

// End impersonation session
export async function endImpersonationSession(token) {
  const adminClient = getAdminClient()
  
  const { error } = await adminClient
    .from('impersonation_sessions')
    .update({ ended_at: new Date().toISOString() })
    .eq('token', token)
  
  if (error) throw error
}

// Get all subscriptions
export async function getAllSubscriptions(filters = {}) {
  const adminClient = getAdminClient()
  
  let query = adminClient
    .from('subscriptions')
    .select(`
      *,
      businesses (
        id,
        name,
        subscription_status
      ),
      plans (
        id,
        name,
        display_name,
        base_price
      )
    `)
  
  if (filters.status) {
    query = query.eq('status', filters.status)
  }
  
  query = query.order('created_at', { ascending: false })
  
  const { data, error } = await query
  
  if (error) throw error
  return data
}

// Get revenue analytics
export async function getRevenueAnalytics() {
  const adminClient = getAdminClient()
  
  // Get MRR and ARR
  const { data: mrrData } = await adminClient.rpc('calculate_platform_mrr')
  const mrr = mrrData || 0
  const arr = mrr * 12
  
  // Get active businesses count
  const { count: activeBusinesses } = await adminClient
    .from('businesses')
    .select('*', { count: 'exact', head: true })
    .eq('subscription_status', 'active')
    .eq('status', 'active')
  
  // Calculate ARPU
  const arpu = activeBusinesses > 0 ? mrr / activeBusinesses : 0
  
  // Get revenue by plan
  const { data: revenueByPlan } = await adminClient
    .from('businesses')
    .select(`
      plan_id,
      plans (
        name,
        display_name
      )
    `)
    .eq('subscription_status', 'active')
    .eq('status', 'active')
  
  // Calculate revenue for each plan
  const planRevenue = {}
  for (const business of revenueByPlan || []) {
    const planName = business.plans?.display_name || 'Unknown'
    planRevenue[planName] = (planRevenue[planName] || 0) + 1
  }
  
  return {
    mrr,
    arr,
    arpu,
    active_businesses: activeBusinesses,
    revenue_by_plan: planRevenue
  }
}

// Get feature overrides for a business
export async function getFeatureOverrides(businessId) {
  const adminClient = getAdminClient()
  
  const { data, error } = await adminClient
    .from('business_feature_overrides')
    .select('*')
    .eq('business_id', businessId)
  
  if (error) throw error
  return data
}

// Set feature override
export async function setFeatureOverride(businessId, featureName, enabled, reason, adminId) {
  const adminClient = getAdminClient()
  
  const { error } = await adminClient
    .from('business_feature_overrides')
    .upsert({
      business_id: businessId,
      feature_name: featureName,
      enabled,
      reason,
      created_by: adminId
    }, {
      onConflict: 'business_id,feature_name'
    })
  
  if (error) throw error
  
  // Log action
  await logPlatformAction({
    adminId,
    action: 'feature_override_set',
    targetType: 'business',
    targetId: businessId,
    details: { feature_name: featureName, enabled, reason }
  })
}

// Delete feature override
export async function deleteFeatureOverride(businessId, featureName, adminId) {
  const adminClient = getAdminClient()
  
  const { error } = await adminClient
    .from('business_feature_overrides')
    .delete()
    .eq('business_id', businessId)
    .eq('feature_name', featureName)
  
  if (error) throw error
  
  // Log action
  await logPlatformAction({
    adminId,
    action: 'feature_override_deleted',
    targetType: 'business',
    targetId: businessId,
    details: { feature_name: featureName }
  })
}

// Get platform audit logs
export async function getPlatformAuditLogs(limit = 100, filters = {}) {
  const adminClient = getAdminClient()
  
  let query = adminClient
    .from('platform_audit_logs')
    .select(`
      *,
      platform_admins (
        name,
        email
      )
    `)
    .order('created_at', { ascending: false })
    .limit(limit)
  
  if (filters.adminId) {
    query = query.eq('admin_id', filters.adminId)
  }
  
  if (filters.action) {
    query = query.eq('action', filters.action)
  }
  
  if (filters.targetType) {
    query = query.eq('target_type', filters.targetType)
  }
  
  const { data, error } = await query
  
  if (error) throw error
  return data
}

// Calculate MRR trend (last 12 months)
export async function getMRRTrend() {
  const adminClient = getAdminClient()
  
  const months = []
  const now = new Date()
  
  for (let i = 11; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    
    // For simplicity, using current MRR for all months
    // In production, you'd calculate historical MRR from subscription_invoices
    months.push({
      month: monthName,
      mrr: 0 // Would need historical calculation
    })
  }
  
  // Get current MRR
  const { data: currentMRR } = await adminClient.rpc('calculate_platform_mrr')
  months[months.length - 1].mrr = currentMRR || 0
  
  return months
}
