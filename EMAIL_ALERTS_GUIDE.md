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

### Setup Instructions

**Option 1: cron-job.org (Recommended - Free)**
1. Go to https://cron-job.org
2. Create account
3. Add new cron job:
   - Title: "DistributionFlow Daily Summary"
   - URL: `https://your-netlify-url.com/api/alerts`
   - Method: POST
   - Request Body: `{"action":"send-daily-summary-all","cron_key":"YOUR_SECRET_KEY"}`
   - Schedule: Daily at 19:00 UTC (8 PM WAT)

**Option 2: Netlify Functions (Advanced)**
Create `/netlify/functions/daily-alerts.js`:
```javascript
exports.handler = async () => {
  const response = await fetch('https://your-domain.com/api/alerts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'send-daily-summary-all',
      cron_key: process.env.CRON_SECRET_KEY
    })
  })
  
  return { statusCode: 200, body: 'Sent' }
}
```

Then set up Netlify scheduled function.

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
