# 🚀 QUICK START: Subscription System Setup

## Step 1: Run Database Migration ⚡

### Option A: Via Supabase Dashboard (Recommended)
1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Create a new query
4. Copy and paste the entire content from `/app/database/subscription_system_migration.sql`
5. Click **RUN**
6. Wait for "Subscription system schema created successfully!" message

### Option B: Via API (if you have psql access)
```bash
psql "postgresql://[YOUR_SUPABASE_CONNECTION_STRING]" -f /app/database/subscription_system_migration.sql
```

---

## Step 2: Verify Migration ✅

Run this query in Supabase SQL Editor:

```sql
-- Check if all tables exist
SELECT 
  (SELECT COUNT(*) FROM plans) as plans_count,
  (SELECT COUNT(*) FROM subscriptions) as subscriptions_count,
  (SELECT COUNT(*) FROM subscription_invoices) as invoices_count,
  (SELECT COUNT(*) FROM subscription_events) as events_count,
  (SELECT COUNT(*) FROM businesses WHERE subscription_status = 'trial') as trial_businesses;
```

**Expected Result:**
- `plans_count`: 3 (Starter, Business, Enterprise)
- `subscriptions_count`: 0 (initially)
- `invoices_count`: 0 (initially)
- `events_count`: 0 (initially)
- `trial_businesses`: [Number of your existing businesses]

---

## Step 3: Test the System 🧪

### Test 1: Get Available Plans
```bash
curl http://localhost:3000/api/subscriptions?route=plans
```

**Expected:** Array of 3 plans with pricing and features

### Test 2: Get Current Subscription
```bash
# (Requires authentication - test in browser or with auth header)
curl http://localhost:3000/api/subscriptions?route=subscription \
  -H "Cookie: [your-auth-cookie]"
```

**Expected:** Current subscription details showing trial status

### Test 3: Calculate Billing
```bash
curl http://localhost:3000/api/subscriptions?route=calculate-billing \
  -H "Cookie: [your-auth-cookie]"
```

**Expected:** Billing breakdown with active users and total amount

### Test 4: Check Feature Access
```bash
curl "http://localhost:3000/api/subscriptions?route=check-feature&feature=empty_lifecycle" \
  -H "Cookie: [your-auth-cookie]"
```

**Expected:** `{"feature":"empty_lifecycle","hasAccess":false}` (Starter plan doesn't have it)

### Test 5: Cron Job
```bash
curl -X POST http://localhost:3000/api/cron/check-trials \
  -H "Authorization: Bearer [YOUR_CRON_SECRET from .env]"
```

**Expected:** `{"success":true,"expired":0,"errors":0,"total":0}`

---

## Step 4: Add Paystack Keys (When Ready) 🔑

1. Get your Test keys from [Paystack Dashboard](https://dashboard.paystack.com/#/settings/developer)
2. Update `.env` file:

```env
# Replace these placeholders:
PAYSTACK_SECRET_KEY=sk_test_YOUR_ACTUAL_SECRET_KEY
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_YOUR_ACTUAL_PUBLIC_KEY
```

3. Restart server:
```bash
sudo supervisorctl restart nextjs
```

---

## Step 5: Test Payment Flow (After Adding Keys) 💳

1. Navigate to billing dashboard (once built): `/settings/billing`
2. Click "Upgrade Plan" or "Subscribe Now"
3. Complete payment with Paystack test card:
   - Card: `4084084084084081`
   - Expiry: Any future date
   - CVV: `408`
   - PIN: `0000`
   - OTP: `123456`
4. Verify subscription activated

---

## Step 6: Setup Webhook 🪝

1. Go to [Paystack Webhooks Settings](https://dashboard.paystack.com/#/settings/developer)
2. Add webhook URL: `https://your-production-domain.com/api/webhooks/paystack`
3. Copy the secret key (it's the same as your SECRET_KEY)
4. Test webhook using Paystack's "Send Test Event" feature

---

## Step 7: Setup Daily Cron Job ⏰

### Using cron-job.org (Free):
1. Go to [cron-job.org](https://cron-job.org)
2. Create free account
3. Create new cron job:
   - **Title:** "Check Trial Expiry"
   - **URL:** `https://your-domain.com/api/cron/check-trials`
   - **Schedule:** Every day at 00:00 (midnight)
   - **HTTP Method:** POST
   - **Headers:** Add `Authorization: Bearer [YOUR_CRON_SECRET]`
4. Save and enable

### Using GitHub Actions (Free alternative):
Create `.github/workflows/cron.yml`:

```yaml
name: Daily Cron
on:
  schedule:
    - cron: '0 0 * * *'  # Daily at midnight UTC
  workflow_dispatch:  # Allow manual trigger

jobs:
  check-trials:
    runs-on: ubuntu-latest
    steps:
      - name: Check Trial Expiry
        run: |
          curl -X POST https://your-domain.com/api/cron/check-trials \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

---

## Step 8: Add Subscription Enforcement 🔒

### Quick Integration into Existing API:

Edit `/app/app/api/[[...path]]/route.js`:

```javascript
// Add at the top
import { enforceSubscription, enforceFeature, FEATURES } from '@/lib/subscription-middleware'

export async function POST(request) {
  // ... existing code to get userProfile ...

  // ADD THIS BLOCK before processing routes:
  const restrictedRoutes = [
    'create-order', 'confirm-delivery', 'record-payment',
    'add-staff', 'add-product', 'update-inventory'
  ]

  if (restrictedRoutes.includes(route)) {
    const check = await enforceSubscription(userProfile.business_id)
    if (!check.allowed) {
      return NextResponse.json({ error: check.error }, { status: 402 })
    }
  }

  // Feature gate empty bottles
  if (route.includes('empty-bottles') || route === 'create-empty-item') {
    const check = await enforceFeature(userProfile.business_id, FEATURES.EMPTY_LIFECYCLE)
    if (!check.allowed) {
      return NextResponse.json({ error: check.error }, { status: 403 })
    }
  }

  // Continue with existing route handling...
}
```

---

## Troubleshooting Common Issues 🔧

### Issue: "plans_count is 0"
**Fix:** Migration didn't run completely. Re-run the SQL script.

### Issue: "Function has_feature does not exist"
**Fix:** Database functions weren't created. Check for SQL errors in migration.

### Issue: "Unauthorized" when calling API
**Fix:** User not logged in. Test in browser with active session.

### Issue: Paystack payment not redirecting back
**Fix:** Check `NEXT_PUBLIC_BASE_URL` is set correctly in `.env`

### Issue: Webhook not receiving events
**Fix:** 
1. Verify webhook URL in Paystack dashboard
2. Check URL is publicly accessible (not localhost)
3. View webhook logs in Paystack dashboard

### Issue: Trial not expiring
**Fix:** Cron job not running. Test manually: `curl -X POST [cron-endpoint]`

---

## Next Steps 📋

### Immediate (Critical):
1. ✅ Run database migration
2. ✅ Verify tables created
3. ✅ Test API endpoints

### Soon (High Priority):
4. 🔨 Build billing dashboard UI (`/settings/billing`)
5. 🔒 Add subscription enforcement to existing routes
6. 🎨 Add subscription banner component

### Later (When Ready):
7. 🔑 Add real Paystack keys
8. 💳 Test complete payment flow
9. 🪝 Setup webhook
10. ⏰ Setup cron job
11. 🚀 Deploy to production

---

## File Locations 📁

```
✅ Database Schema:       /app/database/subscription_system_migration.sql
✅ Utilities:             /app/lib/subscription.js
✅ Paystack Integration:  /app/lib/paystack.js
✅ API Routes:            /app/app/api/subscriptions/route.js
✅ Webhook Handler:       /app/app/api/webhooks/paystack/route.js
✅ Cron Job:              /app/app/api/cron/check-trials/route.js
✅ Middleware:            /app/lib/subscription-middleware.js
✅ Complete Guide:        /app/SUBSCRIPTION_SYSTEM_GUIDE.md
```

---

## Support & Documentation 📚

- **Complete Guide:** See `/app/SUBSCRIPTION_SYSTEM_GUIDE.md`
- **Paystack Docs:** https://paystack.com/docs
- **Paystack Test Cards:** https://paystack.com/docs/payments/test-payments

---

**🎉 You're all set! Start with Step 1 and work your way through.**

**Current Status:** 
- ✅ Backend code complete
- ✅ API endpoints ready
- ✅ Paystack integration ready (needs keys)
- ⏳ UI dashboard pending
- ⏳ Database migration pending (YOU MUST DO THIS FIRST!)
