# 💳 How Businesses Pay for Their Subscription - Complete Guide

## 🎯 Overview

Your DistributionFlow application has a **complete subscription and payment system** already implemented using **Paystack** payment gateway. Here's how businesses subscribe and pay:

---

## 📋 **Subscription Flow - How It Works**

### **1. Initial Signup (14-Day Free Trial)**

```
User Signs Up → Selects Plan → 14-Day Free Trial Starts
```

- New users select a plan (Starter, Business, or Enterprise)
- No payment required upfront
- Full access to all features for 14 days
- Trial end date stored in `businesses.trial_end_date`

---

### **2. After Trial Ends - Payment Required**

When the free trial ends:

**Option A: Automatic (Recommended Setup)**
- Cron job checks daily for expired trials (`/api/cron/check-subscriptions`)
- Business subscription status changes to `trial_expired`
- Users are prompted to upgrade when they login

**Option B: Manual**
- Admin navigates to **Settings → Billing**
- Views current plan and pricing
- Clicks "Upgrade to Paid Plan" or "Subscribe Now"

---

## 💰 **Payment Process - Step by Step**

### **Step 1: User Goes to Billing Page**

```
Dashboard → Settings Icon → Billing
```

Location: `/settings/billing`

The billing page shows:
- ✅ Current plan details (Starter/Business/Enterprise)
- ✅ Number of active users
- ✅ Cost breakdown (base price + extra users)
- ✅ Next billing date
- ✅ Available plans to upgrade/downgrade
- ✅ Payment history/invoices

---

### **Step 2: Select Plan & Click "Subscribe" or "Upgrade"**

When user clicks the upgrade/subscribe button:

1. **Frontend** calls `/api/subscriptions` with route: `initialize-payment`
2. **Backend** calculates total amount:
   - Base plan price (e.g., ₦35,000 for Business)
   - Extra user charges (if users exceed plan limit)
   - Example: Business plan (5 users) + 2 extra users = ₦35,000 + (2 × ₦5,000) = ₦45,000

3. **Backend** creates Paystack transaction:
   ```javascript
   initializeTransaction({
     email: user@business.com,
     amount: 45000, // in Naira
     reference: "SUB_12345_67890",
     callback_url: "https://distribution-flow.com/settings/billing/verify"
   })
   ```

4. **Paystack** returns authorization URL

---

### **Step 3: Redirect to Paystack Payment Page**

User is redirected to Paystack's secure payment page:

```
https://checkout.paystack.com/xxxxx
```

**Payment Options Available:**
- 💳 Debit/Credit Card
- 🏦 Bank Transfer
- 📱 USSD
- 💰 Bank (Direct Debit)

User completes payment on Paystack (secure, PCI-compliant)

---

### **Step 4: Payment Verification**

After successful payment:

1. **Paystack redirects** to your callback URL:
   ```
   https://distribution-flow.com/settings/billing/verify?reference=SUB_12345_67890
   ```

2. **Frontend** calls `/api/subscriptions` with route: `verify-payment`

3. **Backend verifies** with Paystack:
   ```javascript
   verifyTransaction(reference)
   // Returns: { status: 'success', amount: 45000, reference: 'SUB_12345_67890' }
   ```

4. **If payment successful:**
   - ✅ Update subscription status to `active`
   - ✅ Set next billing date (30 days from now)
   - ✅ Update business subscription in database
   - ✅ Create invoice record
   - ✅ Log subscription event
   - ✅ Redirect user to dashboard with success message

---

### **Step 5: Confirmation**

User sees:
- ✅ "Subscription activated successfully!"
- ✅ Access to all features
- ✅ Invoice generated (downloadable from billing page)
- ✅ Email confirmation (if email system configured)

---

## 🔄 **Recurring Payments - Monthly Billing**

### **How Monthly Billing Works:**

1. **Cron Job Runs Daily** (`/api/cron/check-subscriptions`)
   - Checks all subscriptions with upcoming billing dates
   - Sends reminders 7 days before billing
   - Identifies subscriptions due for renewal

2. **Renewal Process:**
   - Admin receives notification: "Your subscription renews in 7 days"
   - Admin goes to billing page
   - Clicks "Pay Now" or "Renew Subscription"
   - Follows same payment flow as Step 1-5 above

3. **Automatic Billing (Optional - Requires Setup):**
   - Enable Paystack recurring billing
   - Store payment authorization code
   - Auto-charge on renewal date

---

## 💳 **Paystack Configuration Required**

### **Current Status:**

Your `.env` file has placeholder keys:
```bash
PAYSTACK_SECRET_KEY=sk_test_YOUR_SECRET_KEY_HERE
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_YOUR_PUBLIC_KEY_HERE
```

### **⚠️ ACTION REQUIRED: Get Real Paystack Keys**

1. **Sign up for Paystack:**
   - Go to: https://paystack.com
   - Create business account
   - Complete KYC verification

2. **Get API Keys:**
   - Dashboard → Settings → API Keys & Webhooks
   - Copy **Test Secret Key** (starts with `sk_test_`)
   - Copy **Test Public Key** (starts with `pk_test_`)

3. **Update Environment Variables:**

   **For Preview/Development:**
   ```bash
   PAYSTACK_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxx
   NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_xxxxxxxxxxxxxxxx
   ```

   **For Production (after going live):**
   ```bash
   PAYSTACK_SECRET_KEY=sk_live_xxxxxxxxxxxxxxxx
   NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_live_xxxxxxxxxxxxxxxx
   ```

4. **Add to Netlify Environment Variables:**
   - Netlify Dashboard → Site Settings → Environment Variables
   - Add both keys
   - Redeploy site

---

## 🎨 **Pricing Plans in Your App**

### **Starter Plan - ₦20,000/month**
- 3 users included
- Core order system
- Basic empty tracking
- 1 warehouse
- Up to 50 retailers

### **Business Plan - ₦35,000/month**
- 5 users included
- Full empty lifecycle
- Manufacturer tracking
- Up to 200 retailers

### **Enterprise Plan - ₦70,000/month**
- 10 users included
- Multi-warehouse
- Fraud detection
- Unlimited retailers

### **Extra User Pricing:**
- Additional users: **₦5,000/user/month**
- Example: Business plan + 3 extra users = ₦35,000 + ₦15,000 = ₦50,000/month

---

## 📊 **Admin Billing Dashboard Features**

Your `/settings/billing` page includes:

### **Current Subscription Card:**
- Plan name and status (trial/active/expired/cancelled)
- Number of included users vs active users
- Next billing date
- Total monthly cost

### **Available Plans Card:**
- All 3 plans displayed
- Current plan highlighted
- Upgrade/downgrade buttons
- Price comparison

### **Invoices Table:**
- Invoice date
- Amount paid
- Status (paid/pending/failed)
- Download invoice (PDF)

### **Usage Statistics:**
- Active users count
- Features enabled
- Storage usage (if applicable)

---

## 🔔 **Automated Reminders & Notifications**

The system automatically:

1. **7 Days Before Renewal:**
   - Notification: "Your subscription renews on [date]"
   - Email reminder (if configured)

2. **3 Days Before Expiry:**
   - Warning: "Your subscription expires soon"

3. **On Expiry:**
   - Status changes to `expired`
   - Limited access (view-only mode)
   - Prompt to renew

4. **7 Days After Expiry:**
   - Account suspended
   - Cannot access system
   - Data retained for 30 days

---

## 🎯 **User Journey Example**

### **Example: ABC Distributors Ltd**

**Day 1 - Signup:**
- Owner signs up, selects Business Plan (₦35,000/month)
- Gets 14-day free trial
- Trial ends: January 15, 2026

**Day 10 - Adds Staff:**
- Adds 7 staff members (2 more than plan includes)
- System calculates: ₦35,000 + (2 × ₦5,000) = ₦45,000/month

**Day 14 - Trial Ends:**
- Notification: "Your trial ends in 1 day. Subscribe now!"
- Owner clicks "Subscribe to Business Plan"

**Day 15 - Payment:**
1. Redirected to Paystack
2. Pays ₦45,000 via card
3. Payment confirmed
4. Subscription activated
5. Next billing: February 15, 2026

**February 8 - Renewal Reminder:**
- Email: "Your subscription renews in 7 days"
- Amount: ₦45,000

**February 15 - Renewal:**
- Owner logs in
- Billing page shows "Renewal due today"
- Clicks "Pay Now"
- Completes payment
- Subscription extended to March 15, 2026

---

## 🛠️ **API Endpoints for Payment**

### **Initialize Payment:**
```javascript
POST /api/subscriptions
{
  "route": "initialize-payment",
  "plan_id": "uuid-of-business-plan",
  "billing_cycle": "monthly"
}

Response:
{
  "authorization_url": "https://checkout.paystack.com/xxxxx",
  "reference": "SUB_12345_67890",
  "amount": 45000
}
```

### **Verify Payment:**
```javascript
POST /api/subscriptions
{
  "route": "verify-payment",
  "reference": "SUB_12345_67890"
}

Response:
{
  "success": true,
  "message": "Subscription activated successfully"
}
```

---

## 🔐 **Security & Compliance**

✅ **PCI-DSS Compliant:** All payments handled by Paystack (certified provider)
✅ **No Card Storage:** Your app never stores card details
✅ **Secure Webhooks:** Paystack webhooks verified with signatures
✅ **HTTPS Required:** All payment flows use SSL encryption
✅ **Transaction Logging:** All payments logged for audit trail

---

## 🧪 **Testing Payment Flow**

### **Before Going Live:**

1. **Use Paystack Test Keys:**
   - Test Secret Key: `sk_test_xxxxx`
   - Test Public Key: `pk_test_xxxxx`

2. **Test Card Numbers:**
   ```
   Successful Payment:
   Card: 4084 0840 8408 4081
   CVV: 408
   Expiry: 12/26
   PIN: 0000

   Failed Payment:
   Card: 5060 6666 6666 6666 4444
   CVV: 123
   Expiry: 12/26
   ```

3. **Test the Flow:**
   - Create test account
   - Go to billing page
   - Select plan → Click subscribe
   - Use test card
   - Verify subscription activates

---

## 📞 **Support for Users**

Your billing page should include:

- 📧 Support Email: support@distribution-flow.com
- 📱 WhatsApp/Phone support
- 💬 Live chat (optional)
- 📖 Help documentation
- ❓ FAQ section

---

## ✅ **Setup Checklist**

Before going live with payments:

- [ ] Paystack account created and verified
- [ ] Business details submitted to Paystack
- [ ] Bank account added for settlements
- [ ] Test keys obtained and tested
- [ ] Live keys obtained (after approval)
- [ ] Environment variables updated in Netlify
- [ ] Webhook URL configured in Paystack
- [ ] Test payment flow end-to-end
- [ ] Invoice generation working
- [ ] Email notifications configured
- [ ] Cron job for subscription checks active
- [ ] Terms of Service page created
- [ ] Refund policy documented

---

## 🚀 **Next Steps to Enable Payments**

1. **Create Paystack Account:**
   - Go to https://paystack.com
   - Sign up with your business email
   - Submit KYC documents

2. **Get API Keys:**
   - Start with test keys
   - Test thoroughly
   - Request live keys from Paystack

3. **Update Environment Variables:**
   - Update in Netlify Dashboard
   - Redeploy your app

4. **Configure Webhooks:**
   ```
   Webhook URL: https://distribution-flow.com/api/webhooks/paystack
   Events: charge.success, subscription.create
   ```

5. **Test Everything:**
   - Create test subscription
   - Make test payment
   - Verify activation
   - Check invoice generation
   - Test renewal flow

6. **Go Live:**
   - Switch to live keys
   - Monitor first few transactions
   - Provide customer support

---

## 💡 **Pro Tips**

1. **Offer Discounts:**
   - Annual billing (save 2 months)
   - Early bird pricing
   - Referral bonuses

2. **Grace Period:**
   - Give 3-5 days after expiry before suspension
   - Send multiple reminders

3. **Failed Payment Retry:**
   - Auto-retry failed payments after 3 days
   - Send notification to update card

4. **Customer Support:**
   - Quick response to payment issues
   - Clear billing documentation
   - Easy invoice download

---

## 📊 **Revenue Tracking**

Track these metrics:

- Monthly Recurring Revenue (MRR)
- Customer Lifetime Value (CLV)
- Churn Rate
- Trial-to-Paid Conversion Rate
- Average Revenue Per User (ARPU)

Use Paystack Dashboard for:
- Transaction history
- Settlement reports
- Customer analytics
- Revenue charts

---

## 🎉 **Summary**

Your subscription system is **fully implemented** and ready to use! 

**What you have:**
✅ Billing dashboard (/settings/billing)
✅ Payment initialization API
✅ Paystack integration
✅ Payment verification
✅ Invoice generation
✅ Subscription management
✅ User limit tracking
✅ Upgrade/downgrade flows
✅ Trial period handling

**What you need:**
⏳ Real Paystack API keys
⏳ Business verification with Paystack
⏳ Webhook configuration
⏳ Production testing

---

**Questions? Check:**
- Paystack Docs: https://paystack.com/docs
- Your billing page: `/settings/billing`
- Subscription API: `/api/subscriptions`

**Ready to accept payments and grow your business!** 🚀💰
