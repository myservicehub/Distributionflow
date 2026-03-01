# 🚨 CRITICAL FIX: RLS Policies for Multi-Role Access

## 📋 Summary

**Problem:** Non-admin users (managers, sales reps, warehouse staff) see blank dashboards with 401 Unauthorized errors after logging in successfully.

**Root Cause:** The current RLS (Row-Level Security) policies in Supabase only grant data access to the business owner. All other authenticated users in the business are blocked.

**Solution:** Apply new RLS policies that allow all authenticated users in a business to access data based on their role.

---

## ✅ What I've Created

### 1. **fix_rls_policies_for_all_roles.sql** - The Main Fix
Location: `/app/database/fix_rls_policies_for_all_roles.sql`

This SQL script:
- Drops the restrictive SELECT policies
- Creates new SELECT policies that check `business_id` instead of `owner_id`
- Implements role-specific access for sales_reps (only see their own orders)
- Ensures data isolation between different businesses

**Key Features:**
- ✅ Admin, Manager, Warehouse: Can see ALL data in their business
- ✅ Sales Rep: Can see products, retailers, payments BUT only THEIR OWN orders
- ✅ All users must have `status = 'active'`
- ✅ Perfect multi-tenancy: Users can ONLY see data from their own business

### 2. **APPLY_RLS_FIX.md** - Step-by-Step Instructions
Location: `/app/database/APPLY_RLS_FIX.md`

Simple guide on how to apply the SQL script in Supabase dashboard.

### 3. **RLS_TESTING_PLAN.md** - Comprehensive Test Cases
Location: `/app/database/RLS_TESTING_PLAN.md`

Detailed test cases for:
- Admin access (should already work)
- Manager access (currently broken, will be fixed)
- Sales rep access with role restrictions (currently broken, will be fixed)
- Warehouse access (currently broken, will be fixed)

### 4. **diagnostic_queries.sql** - Debugging Helpers
Location: `/app/database/diagnostic_queries.sql`

8 diagnostic queries to help you:
- Check which policies are currently active
- Verify RLS is enabled on tables
- List all users and their businesses
- Find users with configuration issues
- Test policies for specific users
- More...

---

## 🎯 How to Apply the Fix

### Step 1: Open Supabase Dashboard
1. Go to https://supabase.com/dashboard
2. Select your DistributionFlow project
3. Click on **SQL Editor** in the left sidebar

### Step 2: Run the Fix Script
1. Open `/app/database/fix_rls_policies_for_all_roles.sql` in your code editor
2. Copy the entire contents
3. Paste into Supabase SQL Editor
4. Click **Run** (or Ctrl/Cmd + Enter)

You should see:
```
DROP POLICY
DROP POLICY
...
CREATE POLICY
CREATE POLICY
...
Success. No rows returned
```

### Step 3: Verify Policies Were Applied
Run this query in the SQL Editor:

```sql
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
AND policyname LIKE 'authenticated_users%'
ORDER BY tablename;
```

You should see 7 new policies:
- `authenticated_users_view_retailers`
- `authenticated_users_view_products`
- `authenticated_users_view_stock_movements`
- `authenticated_users_view_orders`
- `authenticated_users_view_order_items`
- `authenticated_users_view_payments`
- `authenticated_users_view_audit_logs`

### Step 4: Test the Fix
1. **Log out** of your DistributionFlow app
2. **Log in as a manager** or sales rep user (one you invited earlier)
3. The dashboard should now load with data!
4. Check browser console - should see NO 401 errors

---

## 🔍 What Changed in the Policies

### Before (Restrictive)
```sql
CREATE POLICY "view_products" ON products
  FOR SELECT
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
  );
```
❌ Only the business **owner** can see products

### After (Role-Based)
```sql
CREATE POLICY "authenticated_users_view_products" ON products
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.auth_user_id = auth.uid() 
      AND users.business_id = products.business_id
      AND users.status = 'active'
    )
  );
```
✅ ANY authenticated user in the business can see products

### Special Rule for Sales Reps (Orders)
```sql
CREATE POLICY "authenticated_users_view_orders" ON orders
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.auth_user_id = auth.uid() 
      AND users.business_id = orders.business_id
      AND users.status = 'active'
      AND (
        users.role IN ('admin', 'manager', 'warehouse')
        OR 
        (users.role = 'sales_rep' AND orders.sales_rep_id = users.id)
      )
    )
  );
```
✅ Sales reps can only see orders where `sales_rep_id` = their user ID

---

## 🛡️ Security Guarantees

1. **Multi-Tenancy Enforced:** Users can ONLY access data from their own business
2. **Role-Based Access:** Sales reps have restricted order access
3. **Active Users Only:** Inactive/suspended users cannot access data
4. **No Infinite Recursion:** Policies are carefully designed to avoid the recursion bug that occurred before

---

## 🧪 Testing Checklist

After applying the fix, verify:

- [ ] Manager users can log in and see dashboard with data
- [ ] Manager users can see ALL orders (not just their own)
- [ ] Sales rep users can log in and see products/retailers
- [ ] Sales reps can ONLY see their own orders
- [ ] Warehouse users can access inventory data
- [ ] NO 401 errors in browser console
- [ ] Users from Business A cannot see data from Business B

---

## 🚨 Troubleshooting

### If you still see 401 errors:

1. **Check user status:**
   ```sql
   SELECT email, role, status, auth_user_id, business_id 
   FROM users 
   WHERE email = 'problematic.user@example.com';
   ```
   - Ensure `status = 'active'`
   - Ensure `auth_user_id` is not NULL
   - Ensure `business_id` matches the business they should access

2. **Run diagnostic queries:**
   Use the queries in `/app/database/diagnostic_queries.sql` to investigate

3. **Check Supabase logs:**
   Go to Supabase Dashboard → Logs → Postgres Logs
   Look for policy violation errors

### If policies are not working:

1. **Verify RLS is enabled:**
   ```sql
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE schemaname = 'public' 
   AND tablename IN ('products', 'orders', 'retailers');
   ```

2. **Re-run the fix script:** Sometimes policies don't apply correctly on first try

---

## 📝 Next Steps After Fix

Once the RLS policies are fixed and tested:

1. ✅ **Backend Testing:** Use the backend testing agent to verify all API endpoints
2. ✅ **Frontend Testing:** Test all pages with different user roles
3. ✅ **Move to P1 Tasks:** Implement detailed reports (debt aging, sales by rep, inventory)

---

## 📚 Related Files

- `/app/database/fix_rls_policies_for_all_roles.sql` - The main fix
- `/app/database/APPLY_RLS_FIX.md` - Application guide
- `/app/database/RLS_TESTING_PLAN.md` - Test cases
- `/app/database/diagnostic_queries.sql` - Debugging helpers
- `/app/database/RESET_DATABASE.sql` - Original (restrictive) policies

---

## ⚠️ Important Notes

1. **This fix only addresses SELECT policies** - INSERT, UPDATE, DELETE policies are unchanged
2. **The `users` table policies are NOT modified** - Avoiding infinite recursion risk
3. **Backward compatible:** Admin users (business owners) still have full access
4. **Safe to apply:** Can be rolled back by re-running RESET_DATABASE.sql

---

Need help? Check the diagnostic queries or review the testing plan!
