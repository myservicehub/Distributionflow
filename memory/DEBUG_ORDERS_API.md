# Debug: Check Orders API Response

Run this SQL query in Supabase to verify the data is correct:

```sql
-- Check what the database actually has
SELECT 
  o.id,
  o.sales_rep_id,
  r.shop_name as retailer_name,
  u.name as sales_rep_name,
  u.role as sales_rep_role,
  o.total_amount,
  o.created_at
FROM orders o
LEFT JOIN retailers r ON o.retailer_id = r.id
LEFT JOIN users u ON o.sales_rep_id = u.id
ORDER BY o.created_at DESC
LIMIT 5;
```

This will show us:
1. If sales_rep_id is actually populated in the orders table
2. If the join to users table is working
3. What names should be displayed

Please paste the results here.
