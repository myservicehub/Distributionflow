-- Fix Unassigned Order ea4c0b5e
-- This order has a sales_rep_id that doesn't exist in the users table

-- Step 1: Check the current state
SELECT 
  o.id,
  o.sales_rep_id as current_rep_id,
  r.shop_name,
  r.assigned_rep_id,
  u.name as retailer_assigned_rep_name
FROM orders o
JOIN retailers r ON r.id = o.retailer_id
LEFT JOIN users u ON u.id = r.assigned_rep_id
WHERE o.id LIKE 'ea4c0b5e%';

-- Step 2: Update the order to use the retailer's assigned sales rep
UPDATE orders 
SET sales_rep_id = (
  SELECT assigned_rep_id 
  FROM retailers 
  WHERE id = orders.retailer_id
)
WHERE id LIKE 'ea4c0b5e%';

-- Step 3: Verify the fix
SELECT 
  o.id,
  o.sales_rep_id,
  r.shop_name,
  u.name as sales_rep_name
FROM orders o
JOIN retailers r ON r.id = o.retailer_id
LEFT JOIN users u ON u.id = o.sales_rep_id
WHERE o.id LIKE 'ea4c0b5e%';
