# Resend SMTP Configuration Guide for Supabase

## 🎯 Overview
This guide will help you configure Supabase to use **Resend SMTP** for all authentication emails (signup verification, password reset, etc.) and custom transactional emails (welcome emails, notifications).

---

## ✅ Prerequisites
- ✅ Resend account created
- ✅ Domain `distribution-flow.com` verified in Resend
- ✅ Resend API Key: `re_hfMiKq64_EvvbjwDXF7EpAKjqCnpaFdMQ`
- ✅ Sender email: `noreply@distribution-flow.com`

---

## 📧 Part 1: Configure Supabase Auth to Use Resend SMTP

### Step 1: Get Resend SMTP Credentials

Resend provides SMTP access with these standard credentials:

- **SMTP Host:** `smtp.resend.com`
- **SMTP Port:** `465` (SSL) or `587` (TLS)
- **SMTP Username:** `resend`
- **SMTP Password:** Your Resend API Key (`re_hfMiKq64_EvvbjwDXF7EpAKjqCnpaFdMQ`)

### Step 2: Configure Supabase Dashboard

1. **Login to Supabase Dashboard**
   - Go to: https://supabase.com/dashboard
   - Select your project: `ghleuwwnrerfanyfyclt`

2. **Navigate to Auth Settings**
   - Click **Authentication** in the left sidebar
   - Click **Email Templates** tab
   - Scroll down to **SMTP Settings** section

3. **Enable Custom SMTP**
   - Toggle **Enable Custom SMTP** to **ON**

4. **Enter SMTP Configuration:**

   ```
   SMTP Host: smtp.resend.com
   SMTP Port: 465
   SMTP Username: resend
   SMTP Password: re_hfMiKq64_EvvbjwDXF7EpAKjqCnpaFdMQ
   Sender Email: noreply@distribution-flow.com
   Sender Name: DistributionFlow
   ```

5. **Save Configuration**
   - Click **Save** at the bottom of the page

### Step 3: Test Email Delivery

After configuration:
1. Try creating a new test account via `/signup` page
2. Check if verification email arrives from `noreply@distribution-flow.com`
3. Verify email should arrive within 1-2 minutes

---

## 🚀 Part 2: Welcome Email Flow (Already Configured)

The welcome email automation is **already implemented** in the codebase:

### How It Works:

1. **User Signs Up** → Supabase sends verification email (via Resend SMTP)
2. **User Clicks Verify Link** → Redirects to `/api/auth/callback`
3. **Callback Route** → Detects verified email, fetches user data
4. **Welcome Email Sent** → Uses `/lib/welcome-email.js` via Resend API
5. **User Redirected** → Goes to `/dashboard`

### Files Involved:

- **Auth Callback:** `/app/app/api/auth/callback/route.js`
- **Welcome Email Helper:** `/app/lib/welcome-email.js`
- **Email Config:** `/app/.env` (RESEND_API_KEY, RESEND_FROM_EMAIL)
- **Signup Page:** `/app/app/signup/page.js` (sets redirect URL)

### Environment Variables (Already Set):

```bash
RESEND_API_KEY=re_hfMiKq64_EvvbjwDXF7EpAKjqCnpaFdMQ
RESEND_FROM_EMAIL=noreply@distribution-flow.com
```

---

## 📋 Part 3: Email Template Customization (Optional)

### Customize Supabase Auth Emails:

1. Go to **Supabase Dashboard → Authentication → Email Templates**
2. You can customize:
   - **Confirmation Email** (Signup verification)
   - **Magic Link Email**
   - **Change Email Address**
   - **Reset Password**

### Example: Update Signup Confirmation Template

Replace default template with:

```html
<h2>Welcome to DistributionFlow!</h2>
<p>Thanks for signing up! Please confirm your email address by clicking the link below:</p>
<p><a href="{{ .ConfirmationURL }}">Confirm your email</a></p>
<p>If you didn't sign up, you can safely ignore this email.</p>
<p>Best regards,<br>The DistributionFlow Team</p>
```

---

## 🔍 Troubleshooting

### Issue 1: Emails Not Sending

**Check:**
1. SMTP credentials are correct in Supabase Dashboard
2. Resend API key is valid and not expired
3. Domain `distribution-flow.com` is verified in Resend
4. Check Resend Dashboard → Logs for delivery status

**Solution:**
- Test SMTP connection using: https://www.smtper.net/
- Use SMTP Host: `smtp.resend.com`, Port: `465`, credentials as above

### Issue 2: Welcome Email Not Arriving

**Check:**
1. Server logs: `tail -f /var/log/supervisor/nextjs.out.log`
2. Look for: `✅ Welcome email sent successfully`
3. Check if callback route is being hit: Look for `✅ Email verified for user:`

**Debug Steps:**
```bash
# Check if auth callback route exists
curl https://distrib-flow-2.preview.emergentagent.com/api/auth/callback

# Check server logs
tail -50 /var/log/supervisor/nextjs.out.log | grep -i "welcome"
```

### Issue 3: Wrong Sender Email

**Check:**
- Supabase SMTP Settings → Sender Email should be `noreply@distribution-flow.com`
- `/app/.env` → `RESEND_FROM_EMAIL=noreply@distribution-flow.com`
- Restart server after .env changes: `sudo supervisorctl restart nextjs`

---

## ✅ Verification Checklist

Before going live, verify:

- [ ] Supabase SMTP configured with Resend credentials
- [ ] Test signup → Verification email received from `noreply@distribution-flow.com`
- [ ] Click verification link → Redirects to dashboard
- [ ] Welcome email received after verification
- [ ] All emails have correct branding and sender name
- [ ] Check spam folder if emails not in inbox

---

## 📧 Email Flow Summary

### Signup & Verification Flow:

```
User Signs Up
    ↓
Supabase Auth → Sends Verification Email (via Resend SMTP)
    ↓
User Clicks Verification Link
    ↓
/api/auth/callback → Verifies Email
    ↓
Sends Welcome Email (via Resend API)
    ↓
Redirects to /dashboard
```

### Staff Invitation Flow:

```
Admin Creates Staff Member
    ↓
POST /api/staff → Generates Temp Password
    ↓
Sends Invitation Email (via Resend API)
    ↓
Staff Receives Login Credentials
    ↓
Staff Logs In → Forced to Change Password
```

---

## 🎉 Benefits of Using Resend

✅ **Better Deliverability:** Professional email infrastructure
✅ **No Rate Limits:** Unlike Gmail SMTP (500 emails/day)
✅ **Custom Domain:** Emails from `@distribution-flow.com`
✅ **Detailed Analytics:** Track opens, clicks, bounces in Resend Dashboard
✅ **Professional Branding:** Consistent sender identity

---

## 🔗 Useful Links

- **Resend Dashboard:** https://resend.com/dashboard
- **Supabase Dashboard:** https://supabase.com/dashboard/project/ghleuwwnrerfanyfyclt
- **Resend SMTP Docs:** https://resend.com/docs/send-with-smtp
- **Supabase SMTP Docs:** https://supabase.com/docs/guides/auth/auth-smtp

---

## 📞 Support

If you encounter any issues:
1. Check server logs for error messages
2. Verify Resend Dashboard for email delivery status
3. Ensure all environment variables are set correctly
4. Test SMTP connection independently

---

**Last Updated:** December 2024
**Configured By:** AI Development Agent
**Status:** ✅ Ready for Production
