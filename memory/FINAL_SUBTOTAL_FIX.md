# URGENT: Subtotal Column Must Exist Somewhere

The error persists even after Supabase restart. This means `subtotal` MUST exist somewhere in your database.

## Please run this comprehensive check:

```sql
-- Check ALL tables for subtotal column
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE column_name = 'subtotal'
AND table_schema = 'public';
```

## AND check for any view definitions:
```sql
-- Get ALL view definitions
SELECT 
    table_name,
    view_definition
FROM information_schema.views
WHERE table_schema = 'public'
ORDER BY table_name;
```

---

## Alternative: Add the Subtotal Column

Since the error won't go away, the easiest fix might be to **just add the subtotal column**:

```sql
-- Add subtotal column to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS subtotal NUMERIC DEFAULT 0;

-- Set subtotal = total_amount for existing orders
UPDATE orders 
SET subtotal = total_amount 
WHERE subtotal IS NULL OR subtotal = 0;
```

After running this, try creating an order again.

---

**Please try one of these approaches and let me know the result!**
