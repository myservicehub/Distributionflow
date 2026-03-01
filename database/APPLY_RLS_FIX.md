# How to Apply RLS Policy Fix

## Problem
Non-admin users (manager, sales_rep, warehouse) are seeing blank dashboards with 401 Unauthorized errors because the current RLS policies only allow the business owner to access data.

## Solution
The file `fix_rls_policies_for_all_roles.sql` contains updated RLS policies that allow all authenticated users in a business to access data, with role-specific restrictions for sales_reps.

## Steps to Apply

### 1. Go to Supabase Dashboard
- Open your project at https://supabase.com/dashboard
- Navigate to the **SQL Editor** in the left sidebar

### 2. Execute the SQL Script
- Copy the entire contents of `/app/database/fix_rls_policies_for_all_roles.sql`
- Paste it into the SQL Editor
- Click **Run** (or press Ctrl/Cmd + Enter)

### 3. Verify the Policies Were Created
Run this verification query in the SQL Editor:

```sql
SELECT tablename, policyname, permissive, roles, cmd 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('retailers', 'products', 'orders', 'order_items', 'payments', 'stock_movements', 'audit_logs')
ORDER BY tablename, policyname;
```

You should see policies like:
- `authenticated_users_view_retailers`
- `authenticated_users_view_products`
- `authenticated_users_view_orders`
- etc.

### 4. Test the Fix
1. Log out of the application
2. Log back in as a **manager** or **sales_rep** user (one you previously invited)
3. The dashboard should now load with data
4. Check browser console - there should be NO 401 errors

## What Changed

### Before
- Only the business owner (the person who created the business) could see data
- All other users got 401 Unauthorized on API calls

### After
- **All roles** can see: products, retailers, payments, stock movements, audit logs
- **Admin, Manager, Warehouse**: Can see ALL orders in their business
- **Sales Rep**: Can only see their OWN orders (where `sales_rep_id` = their user ID)

## Troubleshooting

### If you still see 401 errors:
1. Verify the policies were applied (run the verification query above)
2. Check that the user has `status = 'active'` in the users table
3. Verify the user's `business_id` matches the data they're trying to access
4. Check browser console for specific error messages

### If you need to rollback:
Run the original `RESET_DATABASE.sql` script to restore the restrictive policies (but this will block non-admin users again).
