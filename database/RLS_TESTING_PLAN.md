# RLS Policy Fix - Testing Plan

## Overview
This document describes how to test the RLS policy fix that allows all authenticated users to access data in their business.

## Prerequisites
1. You must have applied the SQL script: `/app/database/fix_rls_policies_for_all_roles.sql`
2. You should have at least one invited user (manager or sales_rep) to test with

## Test Cases

### Test Case 1: Admin User Access (Should Already Work)
**User Role:** admin
**Expected Result:** Can see all data - products, retailers, orders, payments, etc.

**Steps:**
1. Sign up as a new business owner (or use existing admin account)
2. Navigate to Dashboard
3. Verify you can see:
   - Dashboard metrics (total sales, debt, low stock)
   - Products list
   - Retailers list
   - Orders list
   - Activity log

**Status:** ✅ Should already be working

---

### Test Case 2: Manager User Access (CRITICAL TEST)
**User Role:** manager
**Expected Result:** Can see ALL data in the business (same as admin)

**Steps:**
1. As admin, go to Staff Management
2. Invite a new user with role "Manager"
3. Check email and click the invitation link
4. Set password on the accept-invite page
5. Log in as the manager
6. Verify you can see:
   - Dashboard metrics
   - Products list
   - Retailers list
   - Orders list (ALL orders, not just their own)
   - Activity log

**Check Console:**
- Should be NO 401 errors
- All API calls should return 200

**Status:** 🔴 Currently BROKEN - will be fixed by RLS policy update

---

### Test Case 3: Sales Rep Access (Role-Specific Test)
**User Role:** sales_rep
**Expected Result:** Can see products, retailers, payments BUT only THEIR OWN orders

**Steps:**
1. As admin, go to Staff Management
2. Invite a new user with role "Sales Rep"
3. Accept invitation and log in as sales rep
4. Verify you can see:
   - Dashboard (with limited metrics)
   - Products list (all products)
   - Retailers list (all retailers)
5. Create a test order assigned to THIS sales rep
6. Verify the sales rep CAN see this order
7. As admin, create another order assigned to a DIFFERENT sales rep
8. Verify the first sales rep CANNOT see the other rep's order

**Check Console:**
- Should be NO 401 errors on products, retailers, payments
- Orders API should return only orders where `sales_rep_id = current_user.id`

**Status:** 🔴 Currently BROKEN - will be fixed by RLS policy update

---

### Test Case 4: Warehouse User Access
**User Role:** warehouse
**Expected Result:** Can see all data (same as manager)

**Steps:**
1. Invite a warehouse user
2. Accept invitation and log in
3. Verify access to all products, stock movements, orders

**Status:** 🔴 Currently BROKEN - will be fixed by RLS policy update

---

## Success Criteria

✅ **Fix is successful if:**
1. Manager users can log in and see their dashboard with data
2. Sales rep users can log in and see products/retailers
3. Sales reps can only see orders where they are the assigned sales_rep_id
4. NO 401 Unauthorized errors in browser console
5. All API endpoints return data appropriately

❌ **Fix failed if:**
1. Users still see blank dashboards
2. 401 errors persist in console
3. Users can see data from OTHER businesses
4. Sales reps can see ALL orders (not just their own)

---

## Debugging Tips

### If 401 errors persist:
1. **Check the user record in Supabase:**
   ```sql
   SELECT id, email, role, business_id, status, auth_user_id 
   FROM users 
   WHERE email = 'test@example.com';
   ```
   - Verify `status = 'active'`
   - Verify `business_id` is set correctly
   - Verify `auth_user_id` matches the Supabase auth user

2. **Check if policies were applied:**
   ```sql
   SELECT tablename, policyname 
   FROM pg_policies 
   WHERE policyname LIKE 'authenticated_users%';
   ```
   - Should see 7 policies (retailers, products, orders, order_items, payments, stock_movements, audit_logs)

3. **Check RLS is enabled:**
   ```sql
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE schemaname = 'public' 
   AND tablename IN ('products', 'orders', 'retailers');
   ```
   - All should have `rowsecurity = true`

### If users can see data from OTHER businesses:
- This is a CRITICAL security issue
- The policies are not filtering by business_id correctly
- Need to review the policy conditions

### Common Issues:
1. **User's `status` is not 'active'** → Update user record
2. **User's `business_id` is NULL** → This happens during invite flow, should be fixed by accept-invite page
3. **Policies not applied** → Re-run the SQL script
4. **RLS not enabled on tables** → Run `ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;`

---

## Post-Fix Verification

After applying the fix, run this query to see what policies are active:

```sql
SELECT 
  tablename,
  policyname,
  cmd as operation,
  CASE 
    WHEN qual IS NOT NULL THEN 'Has USING clause'
    WHEN with_check IS NOT NULL THEN 'Has WITH CHECK clause'
  END as policy_type
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('retailers', 'products', 'orders', 'order_items', 'payments', 'stock_movements', 'audit_logs')
ORDER BY tablename, cmd, policyname;
```

This should show the new `authenticated_users_view_*` policies for SELECT operations.
