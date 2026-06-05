# SUBSCRIPTION ENFORCEMENT SYSTEM

## Overview
Comprehensive subscription and feature gating system to ensure businesses only access features they've paid for.

---

## 🎯 Subscription Tiers & Features

### **Starter Plan** (₦20,000/month)
- ✅ 3 users included
- ✅ 50 retailers max
- ✅ 100 products max
- ✅ Core order system
- ✅ Basic reports
- ❌ No empty bottle lifecycle
- ❌ No fraud detection
- ❌ No SMS alerts
- ❌ No API access

### **Business Plan** (₦35,000/month)
- ✅ 5 users included
- ✅ 200 retailers max
- ✅ 500 products max
- ✅ Empty bottle lifecycle ⭐
- ✅ Fraud detection ⭐
- ✅ SMS alerts ⭐
- ✅ Advanced reports ⭐
- ❌ No multi-warehouse
- ❌ No API access

### **Enterprise Plan** (₦70,000/month)
- ✅ 10 users included
- ✅ Unlimited retailers
- ✅ Unlimited products
- ✅ All Business features
- ✅ Multi-warehouse ⭐
- ✅ API access ⭐
- ✅ Priority support ⭐
- ✅ Custom integrations ⭐

---

## 🔒 Backend Enforcement

### 1. Subscription Status Checks

**Enforced on ALL critical endpoints:**
- ✅ GET /dashboard/metrics
- ✅ POST /retailers
- ✅ POST /products
- ✅ POST /orders
- ✅ POST /staff
- ✅ GET/POST /empty-bottles/*

**Logic:**
```javascript
// Check if subscription is active or trial
const subscriptionError = await enforceSubscription(businessId)
if (subscriptionError) {
  return { 
    error: 'Subscription expired',
    message: 'Please upgrade to continue.',
    code: 'SUBSCRIPTION_EXPIRED'
  }
}
```

### 2. Plan Limit Enforcement

#### Retailer Limits
```javascript
// Before creating a retailer
if (currentRetailers >= maxRetailers) {
  return {
    error: 'Retailer limit reached',
    message: `Your plan allows ${maxRetailers} retailers.`,
    upgradeUrl: '/settings/billing'
  }
}
```

#### Product Limits
```javascript
// Before creating a product
if (currentProducts >= maxProducts) {
  return {
    error: 'Product limit reached',
    message: `Your plan allows ${maxProducts} products.`,
    upgradeUrl: '/settings/billing'
  }
}
```

#### User Limits
```javascript
// Before adding a staff member
const userLimitCheck = await canAddUser(businessId)
if (!userLimitCheck.allowed) {
  return {
    error: 'User limit reached',
    message: userLimitCheck.message,
    upgradeUrl: '/settings/billing'
  }
}
```

### 3. Feature-Based Access Control

#### Empty Bottle Lifecycle (Business+ only)
```javascript
// /app/api/empty-bottles/route.js
const hasEmptyLifecycle = await hasFeature(businessId, FEATURES.EMPTY_LIFECYCLE)
if (!hasEmptyLifecycle) {
  return {
    error: 'Feature not available',
    message: 'Empty Bottle Lifecycle is available on Business and Enterprise plans only.',
    requiredFeature: 'empty_lifecycle',
    upgradeUrl: '/settings/billing'
  }
}
```

---

## 🎨 Frontend Gating

### Using the Subscription Hook

```javascript
import { useSubscription, useFeature } from '@/hooks/useSubscription'

function MyComponent() {
  const { isActive, features, planName, limits } = useSubscription()
  const hasEmptyLifecycle = useFeature('empty_lifecycle')
  
  if (!isActive) {
    return <div>Subscription expired. Please upgrade.</div>
  }
  
  return (
    <div>
      <h1>Plan: {planName}</h1>
      <p>Retailers: {currentCount} / {limits.max_retailers}</p>
      
      {hasEmptyLifecycle ? (
        <EmptyBottleFeature />
      ) : (
        <UpgradePrompt feature="Empty Bottle Lifecycle" />
      )}
    </div>
  )
}
```

### Using FeatureGate Component

```javascript
import { FeatureGate } from '@/components/UpgradePrompt'
import { useFeature } from '@/hooks/useSubscription'

function EmptyBottlesPage() {
  const hasAccess = useFeature('empty_lifecycle')
  
  return (
    <FeatureGate 
      hasAccess={hasAccess}
      feature="Empty Bottle Lifecycle"
      requiredPlan="Business or Enterprise"
    >
      {/* Content only shown if user has access */}
      <EmptyBottleManagement />
    </FeatureGate>
  )
}
```

### Using Inline Upgrade Prompts

```javascript
<UpgradePrompt 
  feature="Multi-Warehouse Management"
  requiredPlan="Enterprise"
  inline={true} // Compact version
/>
```

### Premium Badge

```javascript
import { PremiumBadge } from '@/components/UpgradePrompt'

<MenuItem>
  Advanced Reports
  <PremiumBadge />
</MenuItem>
```

---

## 📊 Helper Functions

### Check Subscription Status
```javascript
import { isSubscriptionActive } from '@/lib/subscription'

const isActive = await isSubscriptionActive(businessId)
// Returns true if status is 'active' or 'trial'
```

### Check Feature Access
```javascript
import { hasFeature, FEATURES } from '@/lib/subscription'

const canUseEmptyBottles = await hasFeature(businessId, FEATURES.EMPTY_LIFECYCLE)
```

### Check User Limits
```javascript
import { canAddUser } from '@/lib/subscription'

const { allowed, message, extraCost } = await canAddUser(businessId)
```

### Get Subscription Details
```javascript
import { getSubscriptionDetails } from '@/lib/subscription'

const details = await getSubscriptionDetails(businessId)
// Returns: plan info, features, status, trial_end_date, etc.
```

---

## 🚨 HTTP Status Codes

| Code | Meaning | Usage |
|------|---------|-------|
| 401 | Unauthorized | User not logged in |
| 402 | Payment Required | Subscription expired or feature not available |
| 403 | Forbidden | Permission denied (role-based) |

---

## 🔄 Subscription Statuses

| Status | Can Use System? | Notes |
|--------|----------------|-------|
| `trial` | ✅ Yes | 14-day free trial |
| `active` | ✅ Yes | Paid subscription |
| `expired` | ❌ No | Trial ended, no payment |
| `cancelled` | ❌ No | User cancelled |
| `suspended` | ❌ No | Admin suspended |

---

## 🧪 Testing Subscription Enforcement

### Test Expired Subscription
1. Update business subscription_status to 'expired'
2. Try creating a retailer/product/order
3. Should receive 402 error with upgrade message

### Test Plan Limits
1. Create 50 retailers (Starter plan limit)
2. Try creating 51st retailer
3. Should receive limit reached error

### Test Feature Access
1. Login as Starter plan user
2. Try accessing Empty Bottles page
3. Should see upgrade prompt

---

## 🛠️ Maintenance Tasks

### Expire Trials (Cron Job)
```javascript
import { checkAndExpireTrials } from '@/lib/subscription'

// Run daily at midnight
const { expired, errors } = await checkAndExpireTrials()
console.log(`Expired ${expired} trials`)
```

### Monitor Usage vs Limits
```javascript
// Check if business is approaching limits
const { count: retailers } = await supabase
  .from('retailers')
  .select('*', { count: 'exact' })
  .eq('business_id', businessId)

if (retailers >= maxRetailers * 0.9) {
  // Send notification: "You're approaching your retailer limit"
}
```

---

## 📝 Adding New Features

### 1. Add to Plans Table
```sql
UPDATE plans 
SET features = jsonb_set(features, '{new_feature}', 'true')
WHERE name IN ('business', 'enterprise');
```

### 2. Add to FEATURES Constant
```javascript
// /app/lib/subscription.js
export const FEATURES = {
  // ... existing features
  NEW_FEATURE: 'new_feature',
}
```

### 3. Enforce in Backend
```javascript
const hasNewFeature = await hasFeature(businessId, FEATURES.NEW_FEATURE)
if (!hasNewFeature) {
  return { error: 'Feature not available', ... }
}
```

### 4. Gate in Frontend
```javascript
const hasAccess = useFeature('new_feature')

<FeatureGate hasAccess={hasAccess} feature="New Feature">
  <NewFeatureComponent />
</FeatureGate>
```

---

## ✅ Current Protection Status

### ✅ PROTECTED:
- Dashboard access
- Retailer creation
- Product creation
- Order creation
- Staff management
- Empty bottle lifecycle
- Plan-based limits (retailers, products, users)

### ⚠️ TODO (Future Enhancements):
- SMS alerts gating
- API access gating
- Advanced reports gating
- Multi-warehouse gating
- Trial expiration cron job
- Usage analytics dashboard

---

## 🎓 Best Practices

1. **Always check subscription before critical operations**
2. **Show clear upgrade paths** (use upgradeUrl in errors)
3. **Fail gracefully** (show friendly messages)
4. **Log limit violations** (for sales follow-up)
5. **Test with all plan tiers**
6. **Monitor feature usage** (identify upgrade opportunities)

---

**Last Updated:** June 2026  
**Maintained by:** Development Team
