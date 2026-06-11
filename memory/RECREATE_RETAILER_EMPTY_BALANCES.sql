# Fix Existing retailer_empty_balances View

## The view exists but may have incorrect structure

Run this SQL to drop and recreate with correct structure:

```sql
-- Drop the existing view
DROP VIEW IF EXISTS retailer_empty_balances CASCADE;

-- Recreate with correct structure
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

-- Grant access
GRANT SELECT ON retailer_empty_balances TO authenticated;

-- Verify it works
SELECT 
  reb.id,
  r.shop_name,
  ei.name as empty_item,
  reb.quantity_outstanding,
  reb.updated_at
FROM retailer_empty_balances reb
JOIN retailers r ON r.id = reb.retailer_id
JOIN empty_items ei ON ei.id = reb.empty_item_id
ORDER BY reb.updated_at DESC;
```

This will:
1. Drop the existing (possibly incorrect) view
2. Create it with the correct calculation
3. Show you the current balances
