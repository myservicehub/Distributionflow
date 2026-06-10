# CRITICAL FIX: Supabase Schema Cache Issue

## Problem
Order creation is failing with error:
```
Could not find the 'subtotal' column of 'orders' in the schema cache
```

## Root Cause
Supabase PostgREST has cached an old database schema that includes a `subtotal` column that no longer exists (or never existed). When trying to insert/select orders, it tries to access this column and fails.

## Solution: Refresh Supabase Schema Cache

**Run this SQL in your Supabase SQL Editor:**

```sql
-- Reload the PostgREST schema cache
NOTIFY pgrst, 'reload schema';

-- Verify the orders table columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'orders' 
ORDER BY ordinal_position;
```

## After Running the SQL

1. Wait 5-10 seconds for the cache to reload
2. **Refresh your browser** (Ctrl+Shift+R)
3. **Try creating an order again**
4. It should work without the subtotal error

## If Still Not Working

If the error persists after reloading the schema cache:

### Option 1: Check if subtotal column exists
```sql
-- Check if subtotal column actually exists
SELECT EXISTS (
  SELECT 1 
  FROM information_schema.columns 
  WHERE table_name = 'orders' 
  AND column_name = 'subtotal'
) as subtotal_exists;
```

If it returns `true`, then you need to either:
- **Keep the column:** Add it to the backend select statement
- **Remove the column:** Drop it from the database

### Option 2: Drop the subtotal column (if it exists)
```sql
-- Only run if subtotal exists and you don't need it
ALTER TABLE orders DROP COLUMN IF EXISTS subtotal;

-- Then reload schema
NOTIFY pgrst, 'reload schema';
```

### Option 3: Add subtotal to backend (if you want to keep it)
If you want to keep the subtotal column, I need to update the backend to include it in queries.

## Expected Result

After refreshing the schema cache:
- ✅ Order creation should work
- ✅ No more "Could not find subtotal column" errors
- ✅ All order workflow features functional

---

**Please run the first SQL script and let me know the result!**
