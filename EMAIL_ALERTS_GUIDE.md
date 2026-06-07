# EMAIL ALERTS SYSTEM DOCUMENTATION

## Overview
Comprehensive role-based email notification system for Business and Enterprise plan users. Sends operational alerts, business intelligence digests, and critical system notifications.

---

## 📋 **Alert Types**

### **Operational Alerts** (Real-time)
| Alert | Recipients | Trigger | Example |
|-------|-----------|---------|---------|
| **Low Stock** | Admin, Manager, Warehouse | Stock ≤ threshold | "Coca-Cola 50cl now has 5 units (threshold: 10)" |
| **Overdue Payment** | Admin, Manager | Balance > credit limit | "ABC Store owes ₦150,000 (limit: ₦100,000)" |
| **Large Order** | Admin, Manager | Order > ₦100,000 | "New order worth ₦250,000 from XYZ Mart" |
| **Order Status** | Admin, Manager, Sales Rep* | Status changes | "Order #1234 dispatched to ABC Store" |
| **New Retailer** | Admin, Manager | Retailer created | "New retailer 'Shop X' added by John" |
| **Staff Activity** | Admin only | User added/removed | "New sales rep 'Jane Doe' invited" |

\* *Sales reps only receive alerts for their own orders*

### **Business Intelligence** (Scheduled)
| Alert | Recipients | Frequency | Content |
|-------|-----------|-----------|---------|
| **Daily Summary** | Admin, Manager | Daily at 8 PM | Sales, orders, new retailers, low stock items |
| **Weekly Digest** | Admin, Manager | Monday 9 AM | Week performance, top products, payment trends |
| **Monthly Summary** | Admin only | 1st of month | Revenue, growth, customer stats |

### **Critical Alerts** (Immediate)
| Alert | Recipients | Trigger | Priority |
|-------|-----------|---------|----------|
| **Fraud Detection** | Admin, Manager | Suspicious activity | 🔴 High |
| **System Error** | Admin only | App crashes | 🔴 High |
| **Payment Failure** | Admin, Manager | Paystack webhook fails | 🟡 Medium |
| **Subscription Warning** | Admin only | Trial expiring (3 days) | 🟡 Medium |

---

## 🎯 **Role-Based Access**

### Admin (Business Owner)
✅ Receives ALL alerts  
✅ Can configure alert preferences  
✅ Gets daily/weekly/monthly summaries

### Manager
✅ Operational alerts (stock, orders, payments)  
✅ Business intelligence digests  
✅ Critical fraud/payment alerts  
❌ Staff activity alerts  
❌ Monthly summaries

### Sales Rep
✅ Only their own order status updates  
❌ Other alerts not visible

### Warehouse Staff
✅ Low stock alerts only  
❌ No business intelligence or financial alerts

---

## 🚀 **Implementation**

### Automatic Triggers (Already Integrated)

#### 1. Low Stock Alert
**Trigger:** Stock movement reduces quantity to/below threshold

```javascript
// In /app/app/api/[[...path]]/route.js (stock movements endpoint)
if (newStock <= threshold && newStock > 0) {
  await sendLowStockAlert(businessId, product, newStock, threshold)
}
```

**Email Preview:**
```
Subject: ⚠️ Low Stock Alert: Coca-Cola 50cl

Current Stock: 5 units
Threshold: 10 units
SKU: CC-50CL

[Manage Products Button]
```

#### 2. Large Order Alert
**Trigger:** Order total > ₦100,000

```javascript
// In /app/app/api/[[...path]]/route.js (orders POST endpoint)
await sendLargeOrderAlert(businessId, order, retailer, items, 100000)
```

**Email Preview:**
```
Subject: 📦 Large Order Alert: ₦250,000

Order ID: #a7b3c9d2
Total Amount: ₦250,000
Items: 15 products
Retailer: ABC Supermarket

[View Order Button]
```

#### 3. Overdue Payment Alert
**Trigger:** Manual call when reviewing credit (coming in Phase 2)

```javascript
await sendOverduePaymentAlert(businessId, retailer, balance, creditLimit)
```

---

## ⏰ **Scheduled Alerts (Cron Jobs)**

### Daily Summary (8 PM daily)

**Setup with cron-job.org or similar:**

```bash
# Daily at 8 PM WAT (7 PM UTC)
POST https://your-domain.com/api/alerts
Content-Type: application/json

{
  "action": "send-daily-summary-all",
  "cron_key": "your-secure-cron-key"
}
```

**Response:**
```json
{
  "success": true,
  "processed": 5,
  "results": [
    {
      "businessId": "abc-123",
      "businessName": "Doris Trading Store",
      "success": true,
      "sentTo": 2
    }
  ]
}
```

**Email Preview:**
```
Subject: 📊 Daily Sales Summary - Doris Trading Store

Today's Performance:
━━━━━━━━━━━━━━━━━━
Total Sales: ₦450,000
Orders: 23

Quick Stats:
• New Retailers: 2
• Low Stock Items: 4
• Outstanding Debt: ₦120,000

[View Full Dashboard Button]
```

### 🚀 Production Setup Instructions (Step-by-Step)

---

#### **STEP 1: Generate Secure Cron Key**

First, generate a strong secret key for cron authentication:

```bash
# Option 1: Using OpenSSL (recommended)
openssl rand -hex 32

# Option 2: Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Example output: a7f3c8b9e2d4f1a6c3b8e9f2d1a7c4b9e8f3d2a1c7b6e4f9d3a8c2b7e1f4d6a9
```

**Save this key** - you'll need it for both your app and the cron service.

---

#### **STEP 2: Add Cron Key to Environment Variables**

Add the generated key to your production environment:

**For Netlify/Vercel:**
1. Go to your project dashboard
2. Navigate to **Site settings** → **Environment variables**
3. Add new variable:
   - Key: `CRON_SECRET_KEY`
   - Value: `your-generated-key-from-step-1`
4. Click **Save**
5. **Redeploy** your site for changes to take effect

**Verify it's working:**
```bash
# In your deployed app, the endpoint should now validate the cron_key
curl -X POST https://your-domain.com/api/alerts \
  -H "Content-Type: application/json" \
  -d '{"action":"send-daily-summary-all","cron_key":"wrong-key"}'

# Should return: {"error": "Unauthorized"}
```

---

#### **STEP 3: Set Up Cron Jobs**

Choose one of these options:

---

##### **Option 1: cron-job.org (FREE - Recommended for Most Users)**

**Benefits:**
- ✅ Completely free
- ✅ No coding required
- ✅ Reliable service
- ✅ Email notifications on failures
- ✅ Web dashboard to monitor jobs

**Setup Instructions:**

1. **Create Account**
   - Go to https://cron-job.org
   - Sign up for free account
   - Verify your email

2. **Add Daily Summary Job**
   - Click **"Create Cronjob"**
   - Fill in details:
     - **Title:** `DistributionFlow - Daily Summary`
     - **URL:** `https://your-actual-domain.com/api/alerts`
     - **HTTP Method:** `POST`
     - **Request Method:** Select `POST`
   
   - **Headers Section:**
     ```
     Content-Type: application/json
     ```
   
   - **Request Body:**
     ```json
     {"action":"send-daily-summary-all","cron_key":"your-cron-key-from-step-1"}
     ```
   
   - **Schedule:**
     - **Every:** Day
     - **At:** `19:00` (UTC) — This is 8 PM WAT (Nigeria time)
     - **Time Zone:** UTC
   
   - **Notification Settings:**
     - Enable "Notify me on failure"
     - Add your email for alerts

   - Click **Create**

3. **Test Your Job**
   - In your cron-job.org dashboard
   - Find your job and click **"Execute now"**
   - Check "History" tab for results
   - Verify emails were sent by checking your inbox

4. **Monitor**
   - Check execution history weekly
   - Set up failure notifications
   - View logs in the dashboard

**Screenshot Guide:**
```
[Dashboard] → [Cronjobs] → [Create Cronjob]
Title: DistributionFlow - Daily Summary
URL: https://your-domain.com/api/alerts
Schedule: Every day at 19:00 (UTC)
[Save]
```

---

##### **Option 2: EasyCron.com (FREE Tier Available)**

**Benefits:**
- ✅ Free tier: 100 executions/month
- ✅ Better execution logs
- ✅ Webhook retry on failure

**Setup:**
1. Sign up at https://www.easycron.com
2. Create new cron job:
   - **Cron Expression:** `0 19 * * *` (Daily at 7 PM UTC)
   - **URL:** `https://your-domain.com/api/alerts`
   - **HTTP Method:** POST
   - **POST Data:**
     ```
     action=send-daily-summary-all&cron_key=YOUR_CRON_KEY
     ```
3. Enable notifications
4. Save and test

---

##### **Option 3: Netlify Scheduled Functions (Advanced)**

**Benefits:**
- ✅ Runs in same infrastructure as your app
- ✅ No external dependencies
- ✅ Free on Netlify

**Setup:**

1. **Create function file:**

`/netlify/functions/scheduled-daily-alerts.js`
```javascript
// Netlify Scheduled Function
// Triggers: Daily at 8 PM WAT (7 PM UTC)

const fetch = require('node-fetch')

exports.handler = async (event, context) => {
  console.log('🕐 Running scheduled daily alerts...')
  
  try {
    const response = await fetch(`${process.env.URL}/api/alerts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'send-daily-summary-all',
        cron_key: process.env.CRON_SECRET_KEY
      })
    })

    const result = await response.json()
    
    console.log('✅ Daily alerts sent:', result)
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Daily alerts sent successfully',
        result
      })
    }
  } catch (error) {
    console.error('❌ Error sending daily alerts:', error)
    
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to send daily alerts',
        details: error.message
      })
    }
  }
}
```

2. **Configure schedule in netlify.toml:**

Add to your `/netlify.toml` file:
```toml
[functions]
  directory = "netlify/functions"

[[functions.scheduled-daily-alerts]]
  schedule = "0 19 * * *"  # Daily at 7 PM UTC (8 PM WAT)
```

3. **Deploy:**
```bash
git add netlify/functions/scheduled-daily-alerts.js netlify.toml
git commit -m "Add scheduled daily email alerts"
git push
```

4. **Verify in Netlify Dashboard:**
   - Go to **Functions** tab
   - You should see `scheduled-daily-alerts`
   - Check execution logs

---

##### **Option 4: GitHub Actions (For GitHub-hosted projects)**

**Setup:**

Create `.github/workflows/daily-alerts.yml`:
```yaml
name: Send Daily Email Alerts

on:
  schedule:
    # Runs at 7 PM UTC (8 PM WAT) every day
    - cron: '0 19 * * *'
  workflow_dispatch:  # Allows manual trigger for testing

jobs:
  send-alerts:
    runs-on: ubuntu-latest
    
    steps:
      - name: Trigger Daily Alerts
        run: |
          curl -X POST https://your-domain.com/api/alerts \
            -H "Content-Type: application/json" \
            -d '{"action":"send-daily-summary-all","cron_key":"${{ secrets.CRON_SECRET_KEY }}"}'
      
      - name: Check Status
        run: echo "Daily alerts triggered successfully"
```

Add `CRON_SECRET_KEY` to your GitHub repository secrets:
- Go to **Settings** → **Secrets and variables** → **Actions**
- Add secret: `CRON_SECRET_KEY`

---

#### **STEP 4: Verify Setup**

After setting up your cron job:

1. **Trigger Manual Test:**
   ```bash
   # Direct API call to test
   curl -X POST https://your-domain.com/api/alerts \
     -H "Content-Type: application/json" \
     -d '{"action":"send-daily-summary-all","cron_key":"your-actual-cron-key"}'
   ```

2. **Expected Response:**
   ```json
   {
     "success": true,
     "processed": 3,
     "results": [
       {
         "businessId": "abc-123",
         "businessName": "ABC Trading Store",
         "success": true,
         "sentTo": 2
       }
     ]
   }
   ```

3. **Check Email Inbox:**
   - Admins and managers should receive daily summary
   - Check spam folder if not found

4. **Monitor Logs:**
   - Check your cron service dashboard
   - View execution history
   - Set up failure alerts

---

#### **STEP 5: Weekly & Monthly Alerts (Optional)**

Set up additional cron jobs for weekly and monthly summaries:

**Weekly Digest (Every Monday at 9 AM WAT = 8 AM UTC):**
```json
{
  "action": "send-weekly-digest-all",
  "cron_key": "your-cron-key"
}
```
- **Cron Expression:** `0 8 * * 1` (Every Monday at 8 AM UTC)

**Monthly Summary (1st of month at 9 AM WAT = 8 AM UTC):**
```json
{
  "action": "send-monthly-summary-all",
  "cron_key": "your-cron-key"
}
```
- **Cron Expression:** `0 8 1 * *` (1st day of every month at 8 AM UTC)

---

#### **Production Checklist ✅**

Before going live, ensure:

- [ ] `CRON_SECRET_KEY` added to production environment
- [ ] Site redeployed after adding env variable
- [ ] Cron job created and tested
- [ ] Manual test successful (check response)
- [ ] Email received in inbox
- [ ] Failure notifications configured
- [ ] Execution logs monitored for first week

---

#### **Troubleshooting Production Issues**

**Issue 1: "Unauthorized" Error**
```json
{"error": "Unauthorized"}
```
**Fix:** 
- Verify `CRON_SECRET_KEY` matches in both:
  - Your production environment variables
  - Your cron job configuration
- Redeploy your app after adding env variable

---

**Issue 2: No Emails Received**
**Check:**
1. Business has Business/Enterprise plan
2. Users have active status
3. Resend API key is valid
4. Check application logs for errors

**Debug:**
```bash
# Check logs (Netlify example)
netlify logs --prod

# Look for errors containing "email" or "alert"
```

---

**Issue 3: Cron Job Not Executing**
**Check:**
1. Cron service dashboard shows "Success" status
2. URL is correct (no trailing slash issues)
3. Schedule is in correct timezone (UTC)
4. Your production site is not sleeping (free tier limitations)

---

**Issue 4: Emails Going to Spam**
**Fix:**
1. Ask recipients to mark as "Not Spam"
2. Verify Resend domain is properly configured
3. Check Resend dashboard for delivery status

---

### 📊 Monitoring Your Alerts

**Weekly Checklist:**
- [ ] Check cron execution history
- [ ] Verify email delivery rates
- [ ] Review any failed jobs
- [ ] Check user feedback

**Monthly Review:**
- [ ] Analyze alert engagement
- [ ] Update alert thresholds if needed
- [ ] Review and improve email templates

---

### 🎯 Recommended Schedule Summary

| Alert Type | Frequency | Time (WAT) | Cron Expression |
|-----------|-----------|------------|-----------------|
| Daily Summary | Every day | 8:00 PM | `0 19 * * *` |
| Weekly Digest | Every Monday | 9:00 AM | `0 8 * * 1` |
| Monthly Summary | 1st of month | 9:00 AM | `0 8 1 * *` |

**Note:** All times are in UTC. WAT = UTC + 1 hour.

---

## 🔒 **Feature Gating**

### Plans with Email Alerts
| Plan | Email Alerts | SMS Alerts | Notes |
|------|-------------|-----------|-------|
| **Starter** | ❌ | ❌ | No alerts |
| **Business** | ✅ | ✅ | All alert types |
| **Enterprise** | ✅ | ✅ | Priority support |

### Enforcement
```javascript
// Automatically checked before sending any alert
const hasAlerts = await hasEmailAlerts(businessId)
if (!hasAlerts) {
  return { success: false, reason: 'feature_not_enabled' }
}
```

---

## 📧 **Email Configuration**

### Resend Setup (Already Configured)
- **From:** `alerts@distributionflow.com`
- **API Key:** Stored in `.env` as `RESEND_API_KEY`
- **Template Engine:** Inline HTML with brand styling

### Email Design
- Responsive (mobile-friendly)
- Brand colors (gradient headers)
- Clear call-to-action buttons
- Professional formatting

---

## 🧪 **Testing Email Alerts**

### Test Low Stock Alert
```bash
# 1. Reduce product stock below threshold
curl -X POST http://localhost:3000/api?route=/stock-movements \
  -H "Cookie: your-session-cookie" \
  -d '{
    "product_id": "product-uuid",
    "movement_type": "out",
    "quantity": 20
  }'

# 2. Check email inbox (admin/manager users)
# Should receive low stock alert if stock <= threshold
```

### Test Large Order Alert
```bash
# 1. Create order worth > ₦100,000
curl -X POST http://localhost:3000/api?route=/orders \
  -H "Cookie: your-session-cookie" \
  -d '{
    "retailer_id": "retailer-uuid",
    "total_amount": 250000,
    "items": [...]
  }'

# 2. Check email inbox
# Admins and managers should receive large order alert
```

### Test Daily Summary
```bash
# Manually trigger for a business
curl "http://localhost:3000/api/alerts?action=send-daily-summary&business_id=YOUR_BUSINESS_ID"

# Response:
# {
#   "success": true,
#   "sentTo": 2
# }
```

---

## 📊 **Alert Logs & Audit Trail**

### Database Table (Optional - Create if needed)
```sql
CREATE TABLE alert_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses(id),
  user_id UUID REFERENCES users(id),
  alert_type TEXT NOT NULL,
  subject TEXT NOT NULL,
  status TEXT NOT NULL, -- 'sent', 'failed'
  sent_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Query Alert History
```sql
-- Recent alerts for a business
SELECT * FROM alert_logs
WHERE business_id = 'your-business-id'
ORDER BY sent_at DESC
LIMIT 50;

-- Failed alerts
SELECT * FROM alert_logs
WHERE status = 'failed'
AND sent_at > NOW() - INTERVAL '7 days';
```

---

## 🎨 **Customization**

### Change Alert Thresholds

```javascript
// Large order threshold
sendLargeOrderAlert(businessId, order, retailer, items, 150000) // ₦150k instead of ₦100k

// Low stock threshold (in products table)
UPDATE products SET low_stock_threshold = 20 WHERE id = 'product-id';
```

### Add New Alert Type

1. Add to `ALERT_TYPES` in `/app/lib/email-alerts.js`:
```javascript
export const ALERT_TYPES = {
  // ...existing
  NEW_PAYMENT: 'new_payment'
}
```

2. Add role access:
```javascript
const ALERT_ROLE_ACCESS = {
  [ALERT_TYPES.NEW_PAYMENT]: ['admin', 'manager']
}
```

3. Create template function:
```javascript
function getNewPaymentTemplate(payment, retailer) {
  return `<div>...</div>`
}
```

4. Create public function:
```javascript
export async function sendNewPaymentAlert(businessId, payment, retailer) {
  // Similar structure to existing functions
}
```

5. Call it where needed:
```javascript
await sendNewPaymentAlert(businessId, payment, retailer)
```

---

## 🔧 **Troubleshooting**

### Emails Not Sending?

**1. Check Resend API Key**
```bash
echo $RESEND_API_KEY  # Should not be empty
```

**2. Check Feature Enabled**
```sql
SELECT name, features->>'email_alerts' as has_email_alerts
FROM plans;
-- business: true
-- enterprise: true
-- starter: NULL or false
```

**3. Check Business Plan**
```sql
SELECT b.name, b.subscription_status, p.name as plan_name, p.features->>'email_alerts'
FROM businesses b
JOIN plans p ON b.plan_id = p.id
WHERE b.id = 'your-business-id';
```

**4. Check Server Logs**
```bash
tail -f /var/log/supervisor/nextjs.out.log | grep -i "email"
```

### No Recipients Receiving Alerts?

**Check User Roles:**
```sql
SELECT email, name, role, status
FROM users
WHERE business_id = 'your-business-id';
```

- Must have `status = 'active'`
- Role must match alert type access

---

## 📈 **Future Enhancements**

### Phase 2 (Optional)
- ✅ User preferences (opt-in/opt-out per alert type)
- ✅ Weekly/monthly digest emails
- ✅ Fraud detection alerts integration
- ✅ Alert frequency throttling (don't spam)
- ✅ Rich attachments (PDF reports)

### Phase 3 (Advanced)
- ✅ WhatsApp alerts integration
- ✅ In-app notification + email
- ✅ Alert analytics dashboard
- ✅ Custom alert rules builder

---

## 📞 **Support**

**Issues?**
1. Check logs: `/var/log/supervisor/nextjs.out.log`
2. Verify Resend status: https://resend.com/dashboard
3. Test with manual API call

**Questions?**
- Email alerts: Check `/app/lib/email-alerts.js`
- Subscription gating: Check `/app/lib/subscription.js`
- Role access: Check `ALERT_ROLE_ACCESS` constant

---

**Last Updated:** June 2026  
**Version:** 1.0  
**Status:** ✅ Production Ready
