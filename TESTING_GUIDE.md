# Complete Testing Guide - Subscription System

## 🧪 Manual Testing Checklist

### Prerequisites
- ✅ Database migration completed
- ✅ Server running (localhost:3000)
- ✅ User with admin/manager role

---

## Test 1: Billing Dashboard Access

### Steps:
1. Log in as admin or manager
2. Look for "Billing" in the left sidebar
3. Click "Billing"

### Expected Results:
- ✅ Page loads at `/settings/billing`
- ✅ Shows current plan (likely "Starter Plan" with "trial" badge)
- ✅ Displays user usage (e.g., "1 of 3 included")
- ✅ Shows trial end date countdown
- ✅ Displays 3 plans: Starter, Business, Enterprise
- ✅ Each plan shows features with checkmarks
- ✅ "Upgrade" buttons visible (except on current plan)
- ✅ Invoice section shows (empty if no payments)

### If It Fails:
- Check browser console for errors
- Verify you're logged in as admin/manager
- Check `/api/subscriptions?route=get-billing-details` endpoint

---

## Test 2: Feature Gating - Empty Bottle Lifecycle

### Setup:
First, verify your current plan in database:
```sql
SELECT name, subscription_status, trial_end_date, plans.display_name 
FROM businesses 
JOIN plans ON businesses.plan_id = plans.id 
LIMIT 1;
```

### Test A: With Access (Trial or Business/Enterprise)
**Steps:**
1. Navigate to "Empty Items" page
2. Try to view empty items list
3. Try to create a new empty item

**Expected Results:**
- ✅ Page loads successfully
- ✅ Can view and create items
- ✅ No error messages

### Test B: Without Access (Expired or Starter)
**Steps to simulate:**
1. In Supabase, temporarily update your business:
   ```sql
   UPDATE businesses 
   SET plan_id = (SELECT id FROM plans WHERE name = 'starter'),
       subscription_status = 'active'
   WHERE id = 'YOUR_BUSINESS_ID';
   ```
2. Refresh the page
3. Try to access "Empty Items"

**Expected Results:**
- ❌ API returns 403 error
- ❌ Message: "Empty Bottle Lifecycle Management is not available on your current plan"
- ✅ Should show upgrade prompt

**Cleanup:**
```sql
UPDATE businesses 
SET subscription_status = 'trial',
    trial_end_date = NOW() + INTERVAL '14 days'
WHERE id = 'YOUR_BUSINESS_ID';
```

---

## Test 3: Payment Balance Update (Bug Fix)

### Steps:
1. Go to "Payments" page
2. Select a retailer (e.g., "Madam Esther")
3. Note their current balance (e.g., ₦50,000)
4. Record a payment of ₦10,000
5. Immediately check retailer's page or payments list

### Expected Results:
- ✅ Payment recorded successfully
- ✅ Retailer balance IMMEDIATELY updates (₦50,000 → ₦40,000)
- ✅ Status changes if balance drops below credit limit
- ✅ Console shows: "✅ Retailer balance updated successfully"

### Check Backend Logs:
```bash
tail -f /var/log/supervisor/nextjs.out.log | grep -i payment
```

Look for:
```
Payment processing: Retailer [ID], Old balance: 50000, Payment: 10000, New balance: 40000
✅ Retailer balance updated successfully. New balance: 40000, Status: active
```

---

## Test 4: Cron Job Endpoint

### Manual Test:
```bash
curl http://localhost:3000/api/cron/check-subscriptions
```

### Expected Response:
```json
{
  "success": true,
  "expired": 0,
  "errors": 0,
  "total": 0,
  "timestamp": "2026-03-05T..."
}
```

### Test Trial Expiration:

**Setup:**
```sql
-- Create a test business with expired trial
UPDATE businesses 
SET trial_end_date = NOW() - INTERVAL '1 day',
    subscription_status = 'trial'
WHERE id = 'YOUR_BUSINESS_ID';
```

**Run Cron:**
```bash
curl http://localhost:3000/api/cron/check-subscriptions
```

**Expected Response:**
```json
{
  "success": true,
  "expired": 1,
  "errors": 0,
  "total": 1,
  "timestamp": "..."
}
```

---

## API Endpoint Tests

### Get Plans:
```javascript
fetch('/api/subscriptions?route=get-plans')
  .then(r => r.json())
  .then(console.log)
```

### Get Billing Details:
```javascript
fetch('/api/subscriptions?route=get-billing-details')
  .then(r => r.json())
  .then(console.log)
```

### Check Feature Access:
```javascript
fetch('/api/subscriptions?route=check-feature&feature=empty_lifecycle')
  .then(r => r.json())
  .then(console.log)
```

---

## Success Criteria Summary

✅ Billing dashboard loads and displays correctly  
✅ Feature gating blocks Starter plan from Empty Bottle features  
✅ Payment balance updates immediately after recording  
✅ Subscription status checked on API requests  
✅ Cron endpoint runs without errors  
✅ Trial expiration works when triggered  
✅ User limit warnings display correctly  
✅ Plans display with accurate pricing and features  

---

**For detailed troubleshooting, see `/app/PHASE_3_COMPLETE.md`**
