# How to Login to Super Admin Dashboard

## Quick Answer
**URL**: `https://your-app-url.com/login` (same login page)  
**Access**: After logging in, super admins are automatically redirected to `/platform/dashboard`

---

## Setup Steps (First Time Only)

### Step 1: Run Platform Migration
1. Open your **Supabase SQL Editor**
2. Run the migration script: `/app/database/super_admin_platform_migration.sql`
3. This creates the `platform_admins` table and related functions

### Step 2: Create Super Admin User in Supabase Auth
1. Go to your **Supabase Dashboard**
2. Navigate to: **Authentication → Users → Add User**
3. Fill in:
   - **Email**: `admin@yourdomain.com` (your email)
   - **Password**: Set a strong password
   - **Auto Confirm User**: ✅ Check this
4. Click **Create User**
5. **IMPORTANT**: Copy the UUID that appears (you'll need it in the next step)

### Step 3: Add User to Platform Admins Table
1. Go back to **Supabase SQL Editor**
2. Run this SQL (replace the values with your info):

```sql
INSERT INTO platform_admins (
  name,
  email,
  auth_user_id,
  role,
  status
) VALUES (
  'Your Name',                              -- Replace with your name
  'admin@yourdomain.com',                   -- Replace with your email
  'PASTE-THE-UUID-FROM-STEP-2-HERE',       -- Replace with the UUID from Step 2
  'super_admin',
  'active'
) ON CONFLICT (email) DO NOTHING;

-- Verify it was created
SELECT * FROM platform_admins;
```

---

## Logging In

### 1. Go to Login Page
- Visit: `https://your-app-url.com/login`
- This is the SAME login page used by regular business users

### 2. Enter Credentials
- **Email**: The email you used in Step 2
- **Password**: The password you set in Step 2

### 3. Automatic Redirect
- If you're a **regular business user** → redirected to `/dashboard`
- If you're a **super admin** → redirected to `/platform/dashboard`

---

## Super Admin Dashboard Access

Once logged in, you can access:

### Main Routes:
- **Dashboard**: `/platform/dashboard` - Overview, KPIs, MRR/ARR
- **Businesses**: `/platform/businesses` - Manage all businesses
- **Subscriptions**: `/platform/subscriptions` - View all subscriptions
- **Revenue**: `/platform/revenue` - Revenue analytics
- **Analytics**: `/platform/analytics` - Usage statistics
- **Feature Flags**: `/platform/feature-flags` - Override features per business
- **Support**: `/platform/support` - Support tickets
- **Notifications**: `/platform/notifications` - Platform notifications
- **Settings**: `/platform/settings` - Platform settings

---

## Security Features

### 1. Route Protection
- Only users in `platform_admins` table with `role = 'super_admin'` can access `/platform/*`
- Regular users are automatically redirected to `/dashboard`
- Unauthenticated users are redirected to `/login`

### 2. Audit Logging
- All super admin actions are logged in `platform_audit_logs`
- Includes: who, what, when, IP address

### 3. Separate from Business Users
- Super admins do NOT have a `business_id`
- They cannot access regular business dashboards
- Business users cannot access platform dashboard

---

## Adding More Super Admins

To add another super admin, repeat Steps 2 & 3 above with a different email address.

---

## Troubleshooting

### "I can't see /platform/dashboard after logging in"

**Check:**
1. ✅ Did you run the platform migration SQL?
2. ✅ Does your user exist in Supabase Auth?
3. ✅ Did you add the user to `platform_admins` table?
4. ✅ Is the `auth_user_id` in `platform_admins` correct?
5. ✅ Is `status = 'active'` and `role = 'super_admin'`?

**Verify with SQL:**
```sql
-- Check if platform_admins table exists
SELECT * FROM platform_admins;

-- Check your specific admin record
SELECT * FROM platform_admins WHERE email = 'your-email@domain.com';

-- Get your Supabase Auth user ID
SELECT id, email FROM auth.users WHERE email = 'your-email@domain.com';
```

### "I get redirected to /dashboard instead of /platform"

This means you're logged in but not recognized as a super admin.

**Fix:**
1. Confirm your `auth_user_id` in `platform_admins` matches your Supabase Auth UUID
2. Run this query to check:
```sql
SELECT 
  pa.*,
  au.id as auth_id
FROM platform_admins pa
LEFT JOIN auth.users au ON au.email = pa.email
WHERE pa.email = 'your-email@domain.com';
```

If `auth_id` doesn't match `auth_user_id`, update it:
```sql
UPDATE platform_admins 
SET auth_user_id = (SELECT id FROM auth.users WHERE email = 'your-email@domain.com')
WHERE email = 'your-email@domain.com';
```

### "I forgot my super admin password"

1. Go to: `https://your-app-url.com/forgot-password`
2. Enter your super admin email
3. Follow the reset link sent to your email

---

## Quick Reference

| What | Where |
|------|-------|
| Login Page | `/login` |
| Super Admin Dashboard | `/platform/dashboard` |
| Database Table | `platform_admins` |
| Middleware Protection | `/app/lib/supabase/middleware.js` |
| Migration Script | `/app/database/super_admin_platform_migration.sql` |
| Setup Script | `/app/database/create_super_admin.sql` |

---

## Example: Complete Setup Commands

```sql
-- 1. Check if platform_admins table exists
SELECT * FROM platform_admins LIMIT 1;

-- 2. Get your Auth user ID (after creating user in Supabase dashboard)
SELECT id, email FROM auth.users WHERE email = 'admin@yourdomain.com';

-- 3. Create super admin record
INSERT INTO platform_admins (
  name,
  email,
  auth_user_id,
  role,
  status
) VALUES (
  'John Doe',
  'admin@yourdomain.com',
  '12345678-1234-1234-1234-123456789abc',  -- Replace with actual UUID
  'super_admin',
  'active'
);

-- 4. Verify
SELECT * FROM platform_admins WHERE email = 'admin@yourdomain.com';
```

---

Need help? Check the full implementation guide at `/app/SUPER_ADMIN_PLATFORM_GUIDE.md`
