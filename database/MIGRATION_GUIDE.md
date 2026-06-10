# Database Schema Migration Guide

This guide will help you fix all database schema mismatches discovered during the date range filter implementation.

## 🚨 CRITICAL: Run These Migrations in Order

The application code expects certain database columns that don't currently exist in your Supabase database. Running these migrations will resolve the 500/502 errors you're experiencing.

---

## Prerequisites

1. Access to your Supabase dashboard
2. SQL Editor permissions
3. **BACKUP YOUR DATABASE** before running any migrations (recommended)

---

## Step 1: Run Schema Audit (OPTIONAL - For Information)

**File:** `schema_audit_report.sql`

**Purpose:** This script will show you which columns are missing and provide a detailed report of your current database state.

**Instructions:**
1. Log into your Supabase dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `schema_audit_report.sql`
4. Click **Run**
5. Review the results to see what's missing

**Expected Output:** Multiple result tables showing which columns exist (true) and which are missing (false)

---

## Step 2: Fix Users Table (Phone Column) ✅ COMPLETED

**File:** `add_phone_column.sql`

**Status:** ✅ **You've already run this migration!**

**What it fixed:** 
- Added `phone` column to the `users` table
- Staff management page should now work

---

## Step 3: Fix Payments Foreign Key 🔴 REQUIRED

**File:** `fix_payments_foreign_key.sql`

**Purpose:** Fixes the foreign key relationship between `payments` and `users` tables that's causing 500 errors on the Payments page.

**Error it fixes:**
```
Could not find a relationship between 'payments' and 'users' in the schema cache
```

**Instructions:**
1. Log into your Supabase dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the **entire contents** of `fix_payments_foreign_key.sql`
4. Click **Run**
5. Wait for "Success" message

**What it does:**
- Drops any incorrectly named foreign key constraints
- Creates the foreign key with the name Supabase PostgREST expects (`payments_received_by_fkey`)
- Creates an index for better performance
- Refreshes the Supabase schema cache

**Verification:**
After running this script, test the Payments page:
1. Log into your app
2. Navigate to Dashboard → Payments
3. The page should load without errors
4. You should see a list of payments with user information

---

## Step 4: Add Missing Order Columns 🔴 REQUIRED

**File:** `add_missing_order_columns.sql`

**Purpose:** Adds all the workflow-related columns that the application expects in the `orders` table.

**Errors it fixes:**
- Order creation failures
- Order details 404/502 errors
- Order status updates failing

**Instructions:**
1. Log into your Supabase dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the **entire contents** of `add_missing_order_columns.sql`
4. Click **Run**
5. Wait for "Success" message (this may take 10-30 seconds depending on data size)

**What it adds:**
- `order_status` - New structured order status (pending, confirmed, completed, cancelled)
- `delivery_status` - Delivery workflow tracking (preparing, packed, out_for_delivery, delivered, etc.)
- `is_legacy_order` - Flag to distinguish old vs new workflow orders
- `confirmed_by` - User who confirmed the order
- `confirmed_at` - Timestamp of confirmation
- `packed_at` - Timestamp when order was packed
- `dispatched_at` - Timestamp when dispatched for delivery
- `delivered_at` - Timestamp when delivered
- `delivery_reference` - External tracking number
- `driver_name` - Delivery driver name
- `vehicle_number` - Vehicle registration
- `notes` - Additional order notes
- `order_number` - Human-readable order reference
- `discount_amount` - Discount applied to order

**Additional Benefits:**
- Creates indexes on new columns for better query performance
- Updates existing orders with backward-compatible default values
- Adds database comments for documentation

**Verification:**
After running this script:
1. Navigate to Dashboard → Orders
2. Click on any order to view details
3. The order detail page should load successfully
4. Create a new order - it should work without errors

---

## Migration Execution Order Summary

| Step | File | Status | Priority |
|------|------|--------|----------|
| 1 | `schema_audit_report.sql` | Optional | Info only |
| 2 | `add_phone_column.sql` | ✅ Complete | - |
| 3 | `fix_payments_foreign_key.sql` | ⏳ Pending | 🔴 HIGH |
| 4 | `add_missing_order_columns.sql` | ⏳ Pending | 🔴 HIGH |

---

## Expected Results After Running All Migrations

### ✅ What Should Work:
- **Staff Management Page** - Already fixed ✅
- **Payments Page** - Will work after Step 3
- **Orders List Page** - Already working ✅
- **Order Details Page** - Will work after Step 4
- **Create New Order** - Will work after Step 4
- **Order Workflow** (Confirm → Pack → Dispatch → Deliver) - Will work after Step 4

### ⚠️ Known Remaining Issues:
- **Server Memory Constraints** - The Next.js server may still occasionally crash due to 512MB memory limit. This is an infrastructure issue that requires increasing the Node.js heap size to 2GB+.
- **Order Details Timeout** - On large orders, the detail page may take 5-10 seconds to load. Consider adding database indexes (see Step 5 below).

---

## Step 5: Performance Optimization (OPTIONAL - Recommended)

After running Steps 3 & 4, you can optionally add performance indexes:

```sql
-- Add indexes for frequently queried columns (improves speed)
CREATE INDEX IF NOT EXISTS idx_orders_business_created ON orders(business_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_business_created ON payments(business_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order_product ON order_items(order_id, product_id);
```

Copy and paste this directly into the SQL Editor and run it.

---

## Troubleshooting

### Issue: Migration Script Fails

**Error:** `column already exists`
- **Solution:** This is safe to ignore. The script uses `ADD COLUMN IF NOT EXISTS` which won't create duplicate columns.

**Error:** `permission denied`
- **Solution:** Make sure you're logged in as a database owner or admin in Supabase.

### Issue: Payments Page Still Shows Error After Step 3

1. **Refresh the Supabase schema cache** manually:
   ```sql
   NOTIFY pgrst, 'reload schema';
   ```

2. **Restart your Supabase project** (in Supabase dashboard, go to Project Settings → Pause/Restart)

3. **Hard refresh your browser** (Ctrl+Shift+R / Cmd+Shift+R)

### Issue: Orders Still Don't Work After Step 4

1. **Verify the columns were added:**
   Run the `schema_audit_report.sql` again and check that all columns show `true`

2. **Check for data type mismatches:**
   If you have existing orders, make sure the migration's UPDATE statement ran successfully

---

## Rollback Instructions (If Needed)

If you encounter issues and need to rollback:

```sql
-- Rollback orders table changes (BE CAREFUL - this drops columns and data!)
ALTER TABLE orders DROP COLUMN IF EXISTS order_status CASCADE;
ALTER TABLE orders DROP COLUMN IF EXISTS delivery_status CASCADE;
ALTER TABLE orders DROP COLUMN IF EXISTS is_legacy_order CASCADE;
ALTER TABLE orders DROP COLUMN IF EXISTS confirmed_by CASCADE;
ALTER TABLE orders DROP COLUMN IF EXISTS confirmed_at CASCADE;
ALTER TABLE orders DROP COLUMN IF EXISTS packed_at CASCADE;
ALTER TABLE orders DROP COLUMN IF EXISTS dispatched_at CASCADE;
ALTER TABLE orders DROP COLUMN IF EXISTS delivered_at CASCADE;
ALTER TABLE orders DROP COLUMN IF EXISTS delivery_reference CASCADE;
ALTER TABLE orders DROP COLUMN IF EXISTS driver_name CASCADE;
ALTER TABLE orders DROP COLUMN IF EXISTS vehicle_number CASCADE;
ALTER TABLE orders DROP COLUMN IF EXISTS notes CASCADE;
ALTER TABLE orders DROP COLUMN IF EXISTS order_number CASCADE;
ALTER TABLE orders DROP COLUMN IF EXISTS discount_amount CASCADE;
```

**⚠️ WARNING:** Rolling back will delete any data stored in these columns!

---

## Testing After Migration

### Test Checklist:

- [ ] **Step 3 Verification:**
  - [ ] Navigate to Dashboard → Payments
  - [ ] Page loads without 500 error
  - [ ] Payments list displays correctly
  - [ ] "Recorded By" user information shows

- [ ] **Step 4 Verification:**
  - [ ] Navigate to Dashboard → Orders
  - [ ] Orders list loads successfully
  - [ ] Click on an order to view details
  - [ ] Order detail page loads (may take a few seconds)
  - [ ] Create a new order
  - [ ] Order is created successfully

---

## Need Help?

If you encounter issues during migration:

1. **Check the Supabase logs** (in your dashboard under Logs)
2. **Run the schema audit script** to verify current state
3. **Check the app logs** for any related errors
4. **Contact support** with the error message and which step failed

---

## Summary

This migration guide addresses the following issues:

✅ **Fixed (Already Done):**
- Staff page (phone column) - Step 2

🔴 **To Fix (Run Now):**
- Payments foreign key error - Step 3
- Orders workflow columns - Step 4

⚠️ **Infrastructure (Long-term):**
- Memory constraints (requires Node.js heap increase)
- API route refactoring (reduce monolithic file size)

**Estimated Time:** 5-10 minutes to run all required migrations
**Downtime:** None (migrations are non-breaking)
**Risk Level:** Low (all migrations use `IF NOT EXISTS` and are backward compatible)

---

**Document Version:** 1.0  
**Created:** June 2026  
**Purpose:** Fix database schema mismatches discovered during date range filter implementation
