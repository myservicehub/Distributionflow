# Fix Unassigned Order ea4c0b5e

## Issue
Order `ea4c0b5e` shows "Unassigned" because:
- It has `sales_rep_id = 9bc84847-139e-4f42-81c3-b6d1cd44be79`
- But this user ID doesn't exist or the foreign key relationship fails

## Solution Options

### Option 1: Update order to current user (Doris)
Run this SQL to assign the order to Doris:

```sql
-- First, get Doris's user ID
SELECT id, name, email 
FROM users 
WHERE email = 'eseimieghandoris@yahoo.com';

-- Then update the order (replace USER_ID with actual ID from above)
UPDATE orders 
SET sales_rep_id = 'USER_ID_HERE'
WHERE id = 'ea4c0b5e-5c5b-4ade-8ba3-ea8c6cc78cd0';
```

### Option 2: Set to NULL if truly unassigned
If this order should remain unassigned:

```sql
UPDATE orders 
SET sales_rep_id = NULL
WHERE id = 'ea4c0b5e-5c5b-4ade-8ba3-ea8c6cc78cd0';
```

### Option 3: Find and assign to correct retailer's sales rep
If the retailer has an assigned_rep_id, use that:

```sql
-- Get the retailer's assigned rep
SELECT r.id, r.shop_name, r.assigned_rep_id, u.name as rep_name
FROM retailers r
LEFT JOIN users u ON u.id = r.assigned_rep_id
WHERE r.id = (SELECT retailer_id FROM orders WHERE id LIKE 'ea4c0b5e%');

-- Update order to use retailer's assigned rep
UPDATE orders o
SET sales_rep_id = (
  SELECT assigned_rep_id 
  FROM retailers 
  WHERE id = o.retailer_id
)
WHERE o.id LIKE 'ea4c0b5e%';
```

## Recommended Action

Run **Option 3** first - it will automatically assign the order to the retailer's assigned sales rep.

If the retailer has no assigned rep, then the order will correctly show "Unassigned".
