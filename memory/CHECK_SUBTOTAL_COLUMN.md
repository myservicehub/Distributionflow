# Check if Subtotal Column Exists

Run this SQL in Supabase SQL Editor to check:

```sql
-- Check if subtotal column exists in orders table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'orders'
ORDER BY ordinal_position;
```

**Please copy and paste the ENTIRE result here.**

This will show us:
1. All columns in the orders table
2. Whether 'subtotal' exists or not
3. What columns are actually there

---

## Based on the Result:

### If subtotal DOES exist:
We need to either:
- Remove it: `ALTER TABLE orders DROP COLUMN subtotal;`
- Or include it in the backend code

### If subtotal DOES NOT exist:
The issue is with how we're doing the INSERT. We need to use a different approach.

---

**Please run the SQL above and paste ALL the results here!**
