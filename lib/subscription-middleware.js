// SUBSCRIPTION ENFORCEMENT MIDDLEWARE
// Add this to your existing API routes to enforce subscription rules

import { isSubscriptionActive, hasFeature, FEATURES } from '@/lib/subscription'

/**
 * Check if business has an active subscription
 * Returns 402 (Payment Required) if expired
 */
export async function enforceSubscription(businessId) {
  const isActive = await isSubscriptionActive(businessId)
  
  if (!isActive) {
    return {
      allowed: false,
      error: 'Your subscription has expired. Please renew to continue operations.',
      errorCode: 'SUBSCRIPTION_EXPIRED',
      statusCode: 402
    }
  }
  
  return { allowed: true }
}

/**
 * Check if business has access to a specific feature
 * Returns 403 (Forbidden) if feature not available in plan
 */
export async function enforceFeature(businessId, featureName) {
  const hasAccess = await hasFeature(businessId, featureName)
  
  if (!hasAccess) {
    return {
      allowed: false,
      error: `This feature is not available in your current plan. Upgrade to access ${featureName}.`,
      errorCode: 'FEATURE_NOT_AVAILABLE',
      feature: featureName,
      statusCode: 403
    }
  }
  
  return { allowed: true }
}

/**
 * EXAMPLE USAGE IN EXISTING API ROUTES
 * Add this to /app/app/api/[[...path]]/route.js
 */

/*

// At the top of your route.js file:
import { enforceSubscription, enforceFeature, FEATURES } from '@/app/lib/subscription-middleware'

export async function POST(request) {
  const body = await request.json()
  const route = body.route
  
  // ... get user and userProfile ...

  // ============================================
  // SUBSCRIPTION ENFORCEMENT
  // ============================================
  
  // 1. Enforce subscription for critical operations
  const restrictedRoutes = [
    'create-order',
    'confirm-delivery', 
    'record-payment',
    'add-staff',
    'add-product',
    'update-inventory',
    'create-retailer',
    'update-stock'
  ]

  if (restrictedRoutes.includes(route)) {
    const check = await enforceSubscription(userProfile.business_id)
    if (!check.allowed) {
      return NextResponse.json({ error: check.error }, { status: check.statusCode })
    }
  }

  // ============================================
  // FEATURE GATING ENFORCEMENT
  // ============================================

  // Example 1: Empty Bottle Lifecycle
  if (route.startsWith('empty-') || route === 'create-empty-item') {
    const check = await enforceFeature(userProfile.business_id, FEATURES.EMPTY_LIFECYCLE)
    if (!check.allowed) {
      return NextResponse.json({ 
        error: check.error,
        upgrade_required: true,
        feature: check.feature
      }, { status: check.statusCode })
    }
  }

  // Example 2: SMS Alerts
  if (route === 'send-sms-alert') {
    const check = await enforceFeature(userProfile.business_id, FEATURES.SMS_ALERTS)
    if (!check.allowed) {
      return NextResponse.json({ error: check.error }, { status: check.statusCode })
    }
  }

  // Example 3: Advanced Reports
  if (route === 'advanced-report' || route === 'reconciliation-report') {
    const check = await enforceFeature(userProfile.business_id, FEATURES.ADVANCED_REPORTS)
    if (!check.allowed) {
      return NextResponse.json({ error: check.error }, { status: check.statusCode })
    }
  }

  // Continue with normal processing...
  if (route === 'create-order') {
    // Your existing order creation logic
  }
  
  // ... rest of your routes ...
}

*/

/**
 * FRONTEND ENFORCEMENT (Optional - Backend is primary)
 * Add to components to hide/disable features
 */

/*

// Example component: FeatureGate.js
'use client'

import { useEffect, useState } from 'react'

export function FeatureGate({ feature, children, fallback = null }) {
  const [hasAccess, setHasAccess] = useState(null)

  useEffect(() => {
    fetch(`/api/subscriptions?route=check-feature&feature=${feature}`)
      .then(r => r.json())
      .then(data => setHasAccess(data.hasAccess))
  }, [feature])

  if (hasAccess === null) return <div>Loading...</div>
  if (!hasAccess) return fallback || <div>Feature not available</div>
  
  return children
}

// Usage:
<FeatureGate 
  feature="empty_lifecycle"
  fallback={<p>Upgrade to Business plan to use Empty Bottle Management</p>}
>
  <EmptyBottleManagementUI />
</FeatureGate>

*/

/**
 * QUICK INTEGRATION CHECKLIST
 */

/*

1. Import the middleware:
   import { enforceSubscription, enforceFeature, FEATURES } from '@/lib/subscription-middleware'

2. Add subscription check before critical routes:
   const check = await enforceSubscription(businessId)
   if (!check.allowed) return error response

3. Add feature checks for gated features:
   const check = await enforceFeature(businessId, FEATURES.EMPTY_LIFECYCLE)
   if (!check.allowed) return error response

4. Test with a business on trial vs expired vs active

5. Add upgrade prompts in error messages

*/

// Export for use in API routes
export { enforceSubscription, enforceFeature, FEATURES }
