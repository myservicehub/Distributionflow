# User Authentication System - Complete Guide

## 🔐 How User Authentication Works

---

## Overview

Your DistributionFlow app uses **Supabase Auth** for secure user authentication. Here's the complete flow:

---

## 1. Account Creation Flow

### Step 1: User Signs Up

**URL**: `https://distributionflow.netlify.app/signup?plan=business`

**User fills form:**
- Business Name
- Business Address
- Owner Name
- Email Address
- Password

**User clicks "Create Account"**

---

### Step 2: Account Created in Database

**What happens behind the scenes:**

```javascript
1. Create Supabase Auth User
   └─ Email: user@example.com
   └─ Password: [hashed securely]
   └─ Status: unconfirmed (if email verification enabled)

2. Create Business Record
   └─ Business name, address
   └─ Owner ID (linked to auth user)
   └─ Plan ID (selected plan)
   └─ Trial status (14 days)

3. Create User Profile
   └─ Name, email
   └─ Role: admin
   └─ Business ID (linked to business)
   └─ Status: active
```

---

### Step 3: Email Verification Sent

**If email confirmation is enabled:**

✅ User sees "Check Your Email" screen
✅ Verification email sent to user's inbox
✅ Email contains unique verification link
✅ Link expires in 24 hours

**Email content:**
- Subject: "Welcome to DistributionFlow - Please Verify Your Email"
- From: Your Gmail (via SMTP)
- Contains: Verification button/link

---

## 2. Email Verification Process

### How It Works:

1. **User receives email**
2. **User clicks verification link**
3. **Supabase verifies the token**
4. **User status changes to "confirmed"**
5. **User redirected to dashboard**
6. **Session created automatically**

**What the verification link looks like:**
```
https://distributionflow.netlify.app/auth/callback?
  token=abc123...
  &type=signup
  &redirect_to=/dashboard
```

---

## 3. Authentication States

### A. Unverified User (Email Confirmation Required)

**Status:**
- ✅ Account exists in database
- ❌ Cannot login yet
- ⏳ Must verify email first

**What they see:**
- "Check your email" screen after signup
- Login attempt shows: "Email not confirmed"

---

### B. Verified User (Email Confirmed)

**Status:**
- ✅ Account exists
- ✅ Email verified
- ✅ Can login

**What they can do:**
- Login anytime
- Access dashboard
- Use all features

---

## 4. Login Process

### URL: `https://distributionflow.netlify.app/login`

**How it works:**

```javascript
1. User enters email + password
2. Supabase checks credentials
3. If valid:
   ├─ Check if email is confirmed
   ├─ Check if user is active
   ├─ Create session token (JWT)
   └─ Redirect to dashboard
4. If invalid:
   └─ Show error message
```

---

### Login Flow Diagram:

```
User enters credentials
        ↓
Email confirmed? 
   ├─ NO → "Please verify your email"
   └─ YES → Continue
        ↓
Credentials valid?
   ├─ NO → "Invalid email or password"
   └─ YES → Continue
        ↓
Super admin?
   ├─ YES → Redirect to /platform/dashboard
   └─ NO → Redirect to /dashboard
        ↓
Session created (JWT token stored)
        ↓
User logged in!
```

---

## 5. Session Management

### How Sessions Work:

**JWT Token:**
- Created when user logs in
- Stored in browser (httpOnly cookie)
- Expires after 1 hour (default)
- Auto-refreshed if user is active

**Session Contents:**
```json
{
  "user_id": "uuid-123",
  "email": "user@example.com",
  "role": "admin",
  "business_id": "business-uuid",
  "exp": 1234567890
}
```

---

### Session Lifecycle:

```
Login → Session created (1 hour)
   ↓
User active → Auto-refresh (extends 1 hour)
   ↓
1 hour inactive → Session expires
   ↓
User must login again
```

---

## 6. Middleware Protection

### How Routes Are Protected:

**File**: `/app/lib/supabase/middleware.js`

**What it does:**
1. Checks every page request
2. Verifies if user has valid session
3. Redirects unauthenticated users to login
4. Allows access if authenticated

---

### Route Protection Rules:

**Public Routes (No Auth Required):**
- `/` (homepage)
- `/pricing`
- `/about`
- `/contact`
- `/login`
- `/signup`

**Protected Routes (Auth Required):**
- `/dashboard/*` (business users)
- `/platform/*` (super admins only)

**Authentication Check:**
```javascript
// User visits /dashboard/orders
     ↓
Middleware checks session
     ↓
Session valid?
  ├─ YES → Allow access
  └─ NO → Redirect to /login?redirectTo=/dashboard/orders
```

---

## 7. User Types & Access Levels

### A. Business Users (Regular)

**After Email Verification:**
- ✅ Can login
- ✅ Access `/dashboard/*` routes
- ✅ See their business data only
- ❌ Cannot access `/platform/*`

**Data Isolation:**
- All queries filtered by `business_id`
- Can only see own:
  - Orders, retailers, products
  - Empty bottles, payments
  - Reports, users

---

### B. Super Admins (Platform Level)

**After Email Verification:**
- ✅ Can login
- ✅ Access `/platform/*` routes
- ✅ See all businesses data
- ✅ Manage all users
- ❌ Cannot access individual business dashboards

**Identified by:**
- `platform_admins` table has record
- `role = 'super_admin'`
- `status = 'active'`

---

## 8. Security Features

### A. Password Security

**Hashing:**
- Passwords hashed with bcrypt
- Never stored in plain text
- Minimum 6 characters required

**Password Reset:**
1. User clicks "Forgot Password"
2. Enters email
3. Reset link sent (expires in 1 hour)
4. User creates new password
5. Old password invalidated

---

### B. Email Verification

**Why Required:**
- Confirms real email address
- Prevents fake signups
- Reduces spam accounts
- Better security

**Bypass Options:**
- Disable in Supabase (testing only)
- Use custom SMTP (no rate limits)

---

### C. Session Security

**Features:**
- JWT tokens (industry standard)
- HttpOnly cookies (XSS protection)
- CSRF protection
- Automatic token refresh
- Secure flag (HTTPS only)

---

### D. Database Security (RLS)

**Row Level Security:**
- Users can only see own business data
- Enforced at database level
- Cannot bypass with API calls
- Super admin uses service role key

**Example:**
```sql
-- Business users can only see their own orders
CREATE POLICY "Users see own business orders"
ON orders FOR SELECT
USING (business_id = auth.uid_business());
```

---

## 9. Authentication Flow Examples

### Example 1: New User Signup

```
1. User goes to /signup?plan=business
2. Fills form:
   - Business: ABC Distributors
   - Email: john@abc.com
   - Password: secure123

3. Clicks "Create Account"

4. Backend creates:
   ✅ Auth user (unconfirmed)
   ✅ Business record
   ✅ User profile (admin role)

5. Email sent to john@abc.com

6. User sees "Check Your Email" screen

7. John checks email, clicks link

8. Email verified ✅

9. Redirected to /dashboard

10. Session created, logged in!
```

---

### Example 2: Existing User Login

```
1. User goes to /login

2. Enters:
   - Email: john@abc.com
   - Password: secure123

3. Clicks "Sign In"

4. Backend checks:
   ✅ Email confirmed? YES
   ✅ Credentials valid? YES
   ✅ Account active? YES

5. Session created (JWT token)

6. Redirected to /dashboard

7. Middleware verifies session on each page

8. User can navigate freely
```

---

### Example 3: Session Expired

```
1. User logged in 2 hours ago

2. Session expired (1 hour limit + no activity)

3. User tries to access /dashboard/orders

4. Middleware checks session
   ❌ Session invalid/expired

5. User redirected to:
   /login?redirectTo=/dashboard/orders

6. User logs in again

7. Redirected back to /dashboard/orders

8. New session created
```

---

## 10. Email Verification Options

### Option A: Email Confirmation ENABLED (Recommended)

**Pros:**
- ✅ Verifies real emails
- ✅ Better security
- ✅ Prevents spam
- ✅ Professional

**Cons:**
- ⏳ Extra step for users
- 📧 Need SMTP setup
- 💰 May have costs (if using service)

**Best for:**
- Production apps
- Public signup
- High security needs

---

### Option B: Email Confirmation DISABLED

**Pros:**
- ✅ Instant access
- ✅ Faster onboarding
- ✅ No SMTP needed
- ✅ Good for testing

**Cons:**
- ❌ No email verification
- ❌ Possible fake signups
- ❌ Less secure

**Best for:**
- Development/testing
- B2B (trusted users)
- Internal tools
- Quick demos

---

## 11. Authentication API Endpoints

### Your app uses these Supabase endpoints:

**Signup:**
```javascript
POST /auth/v1/signup
Body: { email, password }
Response: { user, session }
```

**Login:**
```javascript
POST /auth/v1/token?grant_type=password
Body: { email, password }
Response: { access_token, refresh_token, user }
```

**Verify Email:**
```javascript
POST /auth/v1/verify
Body: { token, type: 'signup' }
Response: { user, session }
```

**Logout:**
```javascript
POST /auth/v1/logout
Headers: { Authorization: 'Bearer {token}' }
Response: { success: true }
```

**Refresh Session:**
```javascript
POST /auth/v1/token?grant_type=refresh_token
Body: { refresh_token }
Response: { access_token, refresh_token }
```

---

## 12. Testing Authentication

### Test Checklist:

**Signup:**
- [ ] Can create account
- [ ] Email verification sent
- [ ] Can click verification link
- [ ] Redirects to dashboard
- [ ] Session created

**Login:**
- [ ] Can login with verified account
- [ ] Cannot login with unverified account
- [ ] Wrong password shows error
- [ ] Redirects to dashboard
- [ ] Session persists across pages

**Session:**
- [ ] Can navigate while logged in
- [ ] Cannot access protected routes when logged out
- [ ] Session expires after inactivity
- [ ] Refresh token works
- [ ] Logout clears session

**Security:**
- [ ] Can only see own business data
- [ ] Cannot access other business data
- [ ] Super admin can access platform
- [ ] Regular user cannot access platform

---

## 13. Common Issues & Solutions

### Issue: "Email not confirmed"

**Cause:** User trying to login before verifying email

**Fix:**
- Check email for verification link
- Use "Resend Email" button
- Or disable email confirmation in Supabase

---

### Issue: "Session expired"

**Cause:** User inactive for > 1 hour

**Fix:**
- User must login again
- Session will be refreshed

---

### Issue: "Cannot access dashboard"

**Cause:** Session invalid or user not authenticated

**Fix:**
- Clear browser cookies
- Login again
- Check middleware configuration

---

## 14. Security Best Practices

**For Users:**
1. ✅ Use strong passwords (8+ characters)
2. ✅ Verify email address
3. ✅ Don't share credentials
4. ✅ Logout on shared devices
5. ✅ Use unique password per service

**For Admins:**
1. ✅ Enable email verification
2. ✅ Use custom SMTP (not Supabase default)
3. ✅ Monitor failed login attempts
4. ✅ Regular security audits
5. ✅ Keep Supabase updated

---

## 15. Summary

**Your Authentication System:**

✅ **Secure** - Industry-standard JWT, bcrypt, RLS
✅ **Flexible** - Email verification on/off
✅ **Scalable** - Handles unlimited users
✅ **Multi-tenant** - Complete data isolation
✅ **Professional** - Custom email templates
✅ **User-friendly** - Clear error messages
✅ **Production-ready** - Battle-tested (Supabase)

**User Journey:**
```
Signup → Verify Email → Login → Access Dashboard → Use App
```

**Security Layers:**
```
1. Password hashing (bcrypt)
2. Email verification
3. JWT sessions
4. Middleware protection
5. Database RLS
6. HTTPS encryption
```

---

## 🚀 Your System is Ready!

Users can now:
1. ✅ Sign up with plan selection
2. ✅ Receive verification email
3. ✅ Verify email address
4. ✅ Login securely
5. ✅ Access their dashboard
6. ✅ Use the platform safely

**Everything is secure, scalable, and production-ready!** 🎉
