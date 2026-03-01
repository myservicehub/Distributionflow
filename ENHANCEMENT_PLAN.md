# Staff Management Enhancement Plan
## All 5 Features Implementation

### Phase 1: Foundation - Audit Logging (30 mins)
**Why First:** Needed to track all subsequent changes

**Implementation:**
- Create audit log utility functions
- Add logging to all staff operations (create/update/delete)
- Add logging to critical operations (credit limit changes, retailer/product deletions)
- Create "Activity Log" page for admins
- Display: who did what, when, and what changed

**Database:**
- `audit_logs` table already exists
- Add helper function to insert logs

**Files:**
- New: `/app/lib/audit-logger.js`
- New: `/app/app/dashboard/activity-log/page.js`
- Update: `/app/app/api/[[...path]]/route.js` (add logging to staff endpoints)

---

### Phase 2: Authentication - Password Reset (45 mins)
**Why Second:** Core auth feature needed before other auth enhancements

**Implementation:**
- Add "Forgot Password?" link on login page
- Create password reset request page
- Use Supabase built-in password reset (sends email via Supabase)
- Create password reset confirmation page
- Update password using Supabase auth

**Flow:**
1. User clicks "Forgot Password?"
2. Enters email
3. Supabase sends reset email
4. User clicks link → redirected to reset page
5. User enters new password
6. Password updated

**Files:**
- Update: `/app/app/login/page.js` (add forgot password link)
- New: `/app/app/forgot-password/page.js`
- New: `/app/app/reset-password/page.js`

---

### Phase 3: Authentication - Force Password Change (30 mins)
**Why Third:** Builds on password reset functionality

**Implementation:**
- Check `needs_password_change` flag on login
- Redirect to "Change Password" page if flag is true
- Force user to change password before accessing dashboard
- Update flag to false after successful change
- Log password change in audit logs

**Flow:**
1. New staff logs in with temp password
2. Middleware detects `needs_password_change: true`
3. Redirects to `/change-password` page
4. User must change password
5. Flag updated → can access dashboard

**Files:**
- New: `/app/app/change-password/page.js`
- Update: `/app/middleware.js` (add password change check)
- Update: `/app/lib/auth-context.js` (check password change flag)

---

### Phase 4: Communication - Email Invitations with Resend (45 mins)
**Why Fourth:** Requires external API setup and builds on previous auth work

**Setup Required:**
1. Get Resend API key from user
2. Add to `.env`: `RESEND_API_KEY=...`
3. Verify sender domain (or use Resend test email)

**Implementation:**
- Install Resend SDK: `yarn add resend`
- Create email template for staff invitation
- Update POST /api/staff to send email instead of returning password
- Email contains:
  - Welcome message
  - Temporary password
  - Login link
  - Instructions
- Frontend: Show "Invitation sent!" instead of temp password

**Email Template:**
```
Subject: Welcome to [Business Name] - Your Account is Ready!

Hi [Name],

You've been added to [Business Name]'s DistributionFlow account as a [Role].

Your login credentials:
Email: [email]
Temporary Password: [tempPassword]

Login here: [app_url]/login

You'll be required to change your password on first login.

Welcome aboard!
```

**Files:**
- New: `/app/lib/email.js` (Resend integration)
- New: `/app/lib/email-templates/staff-invitation.js`
- Update: `/app/app/api/[[...path]]/route.js` (POST /api/staff)
- Update: `/app/app/dashboard/staff/page.js` (remove password display dialog)

---

### Phase 5: Authorization - Granular Role Permissions (60 mins)
**Why Last:** Most complex, touches entire app

**Permission Matrix:**

| Feature | Admin | Manager | Sales Rep | Warehouse |
|---------|-------|---------|-----------|-----------|
| **Staff Management** | Full | View only | No access | No access |
| **Retailers** | Full | Full | View, Create, Edit | View only |
| **Products** | Full | Full | View only | Full |
| **Orders** | Full | View, Edit | Full | View only |
| **Payments** | Full | Full | Full | No access |
| **Reports** | Full | Full | Limited | Limited |
| **Settings** | Full | No access | No access | No access |
| **Stock Movements** | Full | Full | View only | Full |

**Implementation:**
- Create permission utility: `can(user, action, resource)`
- Add permission checks to all API endpoints
- Add permission checks to frontend (hide/disable UI elements)
- Show "Access Denied" message for unauthorized actions
- Log permission violations in audit logs

**Files:**
- New: `/app/lib/permissions.js` (permission checker utility)
- Update: ALL API endpoints in `/app/app/api/[[...path]]/route.js`
- Update: ALL dashboard pages (conditional rendering based on role)
- Update: `/app/app/dashboard/layout.js` (conditional menu items)

---

## Implementation Summary

**Total Estimated Time:** ~3.5 hours

**Order of Implementation:**
1. ✅ Phase 1: Audit Logging (30 min)
2. ✅ Phase 2: Password Reset (45 min)
3. ✅ Phase 3: Force Password Change (30 min)
4. ✅ Phase 4: Email Invitations with Resend (45 min) - **Requires Resend API key**
5. ✅ Phase 5: Granular Role Permissions (60 min)

**User Action Required:**
- **Before Phase 4:** Get Resend API key from https://resend.com
  - Sign up for free account
  - Get API key
  - (Optional) Verify domain for production emails

**Testing After Each Phase:**
- Phase 1: Check activity log shows recent actions
- Phase 2: Test forgot password flow
- Phase 3: Create new staff, login, verify forced password change
- Phase 4: Create staff, verify email received
- Phase 5: Login as different roles, verify permissions enforced

---

## Next Steps

1. Start with Phase 1: Audit Logging
2. Test and verify
3. Move to Phase 2, and so on
4. After Phase 3, ask user for Resend API key
5. Complete Phase 4 & 5

Would you like me to proceed with this plan?
