# 🚀 HYBRID SUBSCRIPTION BILLING SYSTEM
## Complete Implementation Guide

---

## 📁 PROJECT STRUCTURE

```
/app
├── database/
│   └── subscription_system_migration.sql  ✅ Complete database schema
├── lib/
│   ├── subscription.js                    ✅ Feature gating & billing utilities
│   └── paystack.js                        ✅ Paystack integration utilities
├── app/api/
│   ├── subscriptions/route.js             ✅ Subscription management API
│   ├── webhooks/paystack/route.js         ✅ Paystack webhook handler
│   └── cron/check-trials/route.js         ✅ Daily trial expiry checker
└── .env                                    ✅ Updated with placeholders
```

---

## 🗄️ DATABASE SCHEMA

### Tables Created:
1. **`plans`** - Subscription plans (Starter, Business, Enterprise)
2. **`subscriptions`** - Active subscriptions with billing details
3. **`subscription_invoices`** - Invoice records
4. **`subscription_events`** - Audit trail

### Updated Tables:
- **`businesses`** - Added subscription fields:
  - `plan_id`, `subscription_status`, `trial_end_date`, `billing_cycle`

### Functions Created:
- `get_active_users_count(business_id)` - Count active users
- `calculate_subscription_amount(business_id, plan_id)` - Calculate billing
- `has_feature(business_id, feature_name)` - Check feature access
- `get_next_invoice_number()` - Generate invoice numbers

---

## 🎯 DEFAULT PLANS CREATED

| Plan | Base Price | Users | Features |
|------|-----------|-------|----------|
| **Starter** | ₦10,000/mo | 3 | Basic features only |
| **Business** | ₦30,000/mo | 10 | + Empty Lifecycle, SMS, Fraud Detection |
| **Enterprise** | ₦100,000/mo | Unlimited | All features + API access |

**Extra User Cost:**
- Starter: ₦2,000/user
- Business: ₦2,500/user
- Enterprise: ₦3,000/user

---

## 🔐 FEATURE GATING

### Available Features:
```javascript
import { FEATURES } from '@/lib/subscription'

FEATURES.EMPTY_LIFECYCLE      // Empty bottle management
FEATURES.MULTI_WAREHOUSE       // Multiple warehouse support
FEATURES.FRAUD_DETECTION       // Advanced fraud alerts
FEATURES.SMS_ALERTS            // SMS notifications
FEATURES.API_ACCESS            // REST API access
FEATURES.ADVANCED_REPORTS      // Advanced reporting
FEATURES.PRIORITY_SUPPORT      // Priority support
FEATURES.CUSTOM_INTEGRATIONS   // Custom integrations
```

### Usage Example:
```javascript
import { hasFeature, FEATURES } from '@/lib/subscription'

// In API route
const canUseEmptyBottles = await hasFeature(businessId, FEATURES.EMPTY_LIFECYCLE)

if (!canUseEmptyBottles) {
  return NextResponse.json({ 
    error: 'This feature requires Business plan or higher' 
  }, { status: 403 })
}
```

---

## 💰 BILLING CALCULATION

### Server-Side Function:
```javascript
import { calculateSubscriptionAmount } from '@/lib/subscription'

const billing = await calculateSubscriptionAmount(businessId)

// Returns:
{
  plan_id: "uuid",
  plan_name: "Business Plan",
  base_price: 30000,
  included_users: 10,
  active_users: 12,
  extra_users: 2,
  price_per_extra_user: 2500,
  extra_users_cost: 5000,
  total_amount: 35000,
  billing_cycle: "monthly"
}
```

---

## 🔄 SUBSCRIPTION FLOW

### 1. **New Business Signup**
- Automatically assigned to **Starter plan**
- `subscription_status = 'trial'`
- `trial_end_date = NOW() + 14 days`

### 2. **Start Paid Subscription**
```javascript
// Frontend: User selects plan
const response = await fetch('/api/subscriptions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    route: 'initialize-payment',
    plan_id: selectedPlanId,
    billing_cycle: 'monthly'
  })
})

const { authorization_url } = await response.json()

// Redirect to Paystack
window.location.href = authorization_url
```

### 3. **Payment Verification**
After payment, Paystack redirects to:
`/settings/billing/verify?reference=REF123`

```javascript
// Call verification endpoint
await fetch('/api/subscriptions', {
  method: 'POST',
  body: JSON.stringify({
    route: 'verify-payment',
    reference: 'REF123'
  })
})
```

### 4. **Subscription Activated**
- `subscription_status = 'active'`
- `subscription_end = NOW() + 30 days`
- Invoice created
- Event logged

---

## ⚠️ SUBSCRIPTION ENFORCEMENT

### Middleware Example (Add to main API route):

```javascript
// In /app/app/api/[[...path]]/route.js

import { isSubscriptionActive } from '@/lib/subscription'

export async function POST(request) {
  const body = await request.json()
  const route = body.route
  
  // ... get userProfile ...

  // ENFORCE SUBSCRIPTION FOR CRITICAL OPERATIONS
  const restrictedRoutes = [
    'create-order',
    'confirm-delivery',
    'record-payment',
    'add-staff',
    'add-product',
    'update-inventory'
  ]

  if (restrictedRoutes.includes(route)) {
    const isActive = await isSubscriptionActive(userProfile.business_id)
    
    if (!isActive) {
      return NextResponse.json({ 
        error: 'Your subscription has expired. Please renew to continue operations.',
        subscription_required: true
      }, { status: 402 }) // 402 Payment Required
    }
  }

  // Continue with normal processing...
}
```

### Frontend Banner Component:

```javascript
'use client'

import { useEffect, useState } from 'react'

export function SubscriptionBanner() {
  const [status, setStatus] = useState(null)

  useEffect(() => {
    fetch('/api/subscriptions?route=subscription')
      .then(r => r.json())
      .then(data => setStatus(data.subscription_status))
  }, [])

  if (status === 'expired' || status === 'cancelled') {
    return (
      <div className="bg-red-600 text-white p-4 text-center">
        ⚠️ Your subscription has expired. 
        <a href="/settings/billing" className="underline ml-2">
          Renew now to continue operations
        </a>
      </div>
    )
  }

  if (status === 'trial') {
    return (
      <div className="bg-blue-600 text-white p-4 text-center">
        🎉 You're on a free trial. 
        <a href="/settings/billing" className="underline ml-2">
          Subscribe now
        </a>
      </div>
    )
  }

  return null
}
```

---

## 🎨 BILLING DASHBOARD (To Be Built)

### Create: `/app/app/settings/billing/page.js`

**Should Display:**
- Current plan details
- Active users count
- Extra users & cost
- Total monthly cost
- Next billing date
- Upgrade/Downgrade buttons
- Invoice history
- Payment method

**Example Layout:**
```
┌─────────────────────────────────────┐
│  Current Plan: Business             │
│  Base Price: ₦30,000/month          │
│  Included Users: 10                 │
│  Active Users: 12                   │
│  Extra Users: 2 × ₦2,500 = ₦5,000   │
│  ──────────────────────────────────  │
│  Total: ₦35,000/month               │
│  Next Billing: Apr 3, 2026          │
│                                     │
│  [Upgrade Plan] [View Invoices]     │
└─────────────────────────────────────┘
```

---

## 🪝 PAYSTACK WEBHOOK SETUP

1. **In Paystack Dashboard:**
   - Go to Settings → Webhooks
   - Add URL: `https://your-domain.com/api/webhooks/paystack`
   - Copy your secret key

2. **Events Handled:**
   - `charge.success` - Payment successful
   - `subscription.create` - Subscription created
   - `subscription.disable` - Subscription cancelled
   - `subscription.not_renew` - Auto-renewal disabled

3. **Security:**
   - All webhooks are verified using HMAC SHA512
   - Invalid signatures are rejected

---

## ⏰ CRON JOB SETUP

### Endpoint: `/api/cron/check-trials`

**Purpose:** Expire trials daily

**Setup Options:**

#### Option 1: External Cron Service (Recommended)
Use services like:
- cron-job.org
- EasyCron
- GitHub Actions

**Configuration:**
- URL: `https://your-domain.com/api/cron/check-trials`
- Method: POST
- Schedule: Daily at 00:00 UTC
- Headers: `Authorization: Bearer YOUR_CRON_SECRET`

#### Option 2: Vercel Cron (If deployed on Vercel)
Add to `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/check-trials",
    "schedule": "0 0 * * *"
  }]
}
```

---

## 🔒 ENVIRONMENT VARIABLES

```env
# Existing vars
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# NEW: Paystack Integration
PAYSTACK_SECRET_KEY=sk_test_YOUR_SECRET_KEY_HERE
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_YOUR_PUBLIC_KEY_HERE

# NEW: Cron Job Security
CRON_SECRET=your-random-secret-here
```

---

## 🧪 TESTING CHECKLIST

### Before Adding Real Paystack Keys:

1. ✅ **Run Database Migration**
   - Execute `subscription_system_migration.sql` in Supabase dashboard
   - Verify tables created
   - Check existing businesses have `subscription_status = 'trial'`

2. ✅ **Test API Endpoints**
   ```bash
   # Get plans
   curl http://localhost:3000/api/subscriptions?route=plans

   # Get current subscription
   curl http://localhost:3000/api/subscriptions?route=subscription

   # Calculate billing
   curl http://localhost:3000/api/subscriptions?route=calculate-billing
   ```

3. ✅ **Test Feature Gating**
   ```bash
   curl http://localhost:3000/api/subscriptions?route=check-feature&feature=empty_lifecycle
   ```

4. ✅ **Test Cron Job**
   ```bash
   curl -X POST http://localhost:3000/api/cron/check-trials \
     -H "Authorization: Bearer YOUR_CRON_SECRET"
   ```

### After Adding Paystack Keys:

5. ✅ **Test Payment Initialization**
6. ✅ **Complete a test payment**
7. ✅ **Verify subscription activation**
8. ✅ **Test webhook reception**
9. ✅ **Test plan upgrade**
10. ✅ **Test subscription cancellation**

---

## 🚀 DEPLOYMENT STEPS

1. **Run Migration**
   - Copy SQL from `database/subscription_system_migration.sql`
   - Run in Supabase SQL Editor
   - Verify all tables and functions created

2. **Add Environment Variables**
   - Add Paystack keys to production `.env`
   - Update `CRON_SECRET`

3. **Setup Paystack Webhook**
   - Add production webhook URL in Paystack dashboard

4. **Setup Cron Job**
   - Configure external cron service to call `/api/cron/check-trials` daily

5. **Deploy Application**
   - All code is ready and functional
   - Restart Next.js server

6. **Test End-to-End**
   - Make a test payment
   - Verify subscription activation
   - Test feature gating

---

## 📊 MONITORING

### Key Metrics to Track:
- Trial → Paid conversion rate
- Churn rate
- Average revenue per user (ARPU)
- Failed payments
- Plan distribution

### Logs to Monitor:
- Webhook events: Check `/var/log/supervisor/nextjs.out.log`
- Payment failures
- Subscription status changes
- Feature gate denials

---

## 🆘 TROUBLESHOOTING

### Common Issues:

**1. "Feature not available" even though plan should have it**
- Check `businesses.plan_id` is correctly set
- Verify `plans.features` JSON contains the feature
- Check `subscription_status IN ('active', 'trial')`

**2. Webhook not receiving events**
- Verify webhook URL in Paystack dashboard
- Check signature validation is working
- View Paystack webhook logs

**3. Billing calculation wrong**
- Run: `SELECT * FROM calculate_subscription_amount('business-id')`
- Check active users count
- Verify plan pricing

**4. Trial not expiring**
- Check cron job is running
- Verify `trial_end_date` is set correctly
- Run cron manually to test

---

## 📚 API DOCUMENTATION

### GET Endpoints

**Get Available Plans:**
```
GET /api/subscriptions?route=plans
```

**Get Current Subscription:**
```
GET /api/subscriptions?route=subscription
```

**Calculate Billing:**
```
GET /api/subscriptions?route=calculate-billing&plan_id=uuid
```

**Check User Limit:**
```
GET /api/subscriptions?route=check-user-limit
```

**Get Invoices:**
```
GET /api/subscriptions?route=invoices&limit=10
```

**Check Feature:**
```
GET /api/subscriptions?route=check-feature&feature=empty_lifecycle
```

### POST Endpoints

**Initialize Payment:**
```json
POST /api/subscriptions
{
  "route": "initialize-payment",
  "plan_id": "uuid",
  "billing_cycle": "monthly"
}
```

**Verify Payment:**
```json
POST /api/subscriptions
{
  "route": "verify-payment",
  "reference": "REF123"
}
```

**Upgrade Plan:**
```json
POST /api/subscriptions
{
  "route": "upgrade-plan",
  "new_plan_id": "uuid"
}
```

**Downgrade Plan:**
```json
POST /api/subscriptions
{
  "route": "downgrade-plan",
  "new_plan_id": "uuid"
}
```

**Cancel Subscription:**
```json
POST /api/subscriptions
{
  "route": "cancel-subscription"
}
```

---

## ✨ NEXT STEPS

1. **Run Database Migration** (CRITICAL!)
2. **Add Real Paystack Keys**
3. **Build Billing Dashboard UI** (Recommended next task)
4. **Add Subscription Enforcement** to existing API routes
5. **Setup Cron Job**
6. **Test Complete Flow**
7. **Go Live!**

---

## 📞 SUPPORT

For Paystack integration issues:
- Paystack Docs: https://paystack.com/docs
- Paystack Support: support@paystack.com

For subscription logic questions:
- Review `/lib/subscription.js` for all utility functions
- Check Supabase functions in the migration SQL

---

**Status:** ✅ Backend Implementation Complete | 🔨 UI Dashboard Pending | 🧪 Testing Required
