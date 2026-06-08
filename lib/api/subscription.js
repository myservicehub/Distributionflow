import { isSubscriptionActive, hasFeature, FEATURES, canAddUser } from '@/lib/subscription'
import { errorResponse } from './helpers'

/**
 * Enforce active subscription for business
 * Returns error response if subscription is not active, null if OK
 */
export async function enforceSubscription(businessId) {
  const isActive = await isSubscriptionActive(businessId)
  
  if (!isActive) {
    return {
      error: 'Subscription required',
      message: 'Please activate your subscription to access this feature',
      code: 'SUBSCRIPTION_REQUIRED'
    }
  }
  
  return null
}

/**
 * Check if business has access to a specific feature
 * Returns error response if feature not available, null if OK
 */
export async function enforceFeature(businessId, feature) {
  const hasAccess = await hasFeature(businessId, feature)
  
  if (!hasAccess) {
    return {
      error: 'Feature not available',
      message: `Your subscription plan does not include ${feature}. Please upgrade.`,
      code: 'FEATURE_NOT_AVAILABLE'
    }
  }
  
  return null
}

/**
 * Check if business can add more users
 * Returns error response if limit reached, null if OK
 */
export async function enforceUserLimit(businessId) {
  const canAdd = await canAddUser(businessId)
  
  if (!canAdd) {
    return {
      error: 'User limit reached',
      message: 'You have reached your user limit. Please upgrade your plan.',
      code: 'USER_LIMIT_REACHED'
    }
  }
  
  return null
}
