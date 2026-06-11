# Create Missing retailer_empty_balances View

## Issue
The `retailer_empty_balances` table/view doesn't exist in the database.

## Solution
Create it as a VIEW that automatically calculates balances from `empty_movements` table.

---

## SQL to Execute

Run this in your Supabase SQL Editor:

```sql
-- Create the retailer_empty_balances VIEW
CREATE VIEW retailer_empty_balances AS
SELECT 
  ROW_NUMBER() OVER (ORDER BY em.business_id, em.retailer_id, em.empty_item_id) as id,
  em.business_id,
  em.retailer_id,
  em.empty_item_id,
  SUM(CASE 
    WHEN em.type = 'issued_to_retailer' THEN em.quantity
    WHEN em.type = 'returned_from_retailer' THEN -em.quantity
    ELSE 0
  END) as quantity_outstanding,
  MIN(em.created_at) as created_at,
  MAX(em.created_at) as updated_at
FROM empty_movements em
WHERE em.retailer_id IS NOT NULL
GROUP BY em.business_id, em.retailer_id, em.empty_item_id
HAVING SUM(CASE 
  WHEN em.type = 'issued_to_retailer' THEN em.quantity
  WHEN em.type = 'returned_from_retailer' THEN -em.quantity
  ELSE 0
END) > 0;

-- Grant access to authenticated users
GRANT SELECT ON retailer_empty_balances TO authenticated;
```

---

## What This Does

**Automatically calculates retailer balances by:**
1. Summing all `issued_to_retailer` movements (positive)
2. Subtracting all `returned_from_retailer` movements (negative)
3. Only showing retailers with outstanding balances (quantity > 0)
4. Grouping by business, retailer, and empty item type

**Benefits:**
- ✅ Always up-to-date (recalculates on every query)
- ✅ No manual updates needed
- ✅ Single source of truth (from `empty_movements`)
- ✅ No sync issues

---

## Verification

After creating the view, run this to see the current balances:

```sql
SELECT 
  reb.id,
  r.shop_name as retailer,
  ei.name as empty_item,
  reb.quantity_outstanding,
  reb.updated_at
FROM retailer_empty_balances reb
JOIN retailers r ON r.id = reb.retailer_id
JOIN empty_items ei ON ei.id = reb.empty_item_id
ORDER BY reb.quantity_outstanding DESC;
```

---

## Expected Result

You should see all retailers who currently have outstanding empty bottle balances (bottles they owe you).

If you see no results, it means either:
- No empty bottles have been issued yet, OR
- All issued bottles have been returned

To verify movements exist:
```sql
SELECT 
  type,
  COUNT(*) as count,
  SUM(quantity) as total_quantity
FROM empty_movements
WHERE retailer_id IS NOT NULL
GROUP BY type;
```

This will show you how many issuances and returns have been logged.
