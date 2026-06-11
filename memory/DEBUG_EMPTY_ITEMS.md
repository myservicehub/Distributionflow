# Fix retailer_empty_balances View - Add Missing Joins

## Issue
The view doesn't include empty_items or retailers data, causing "Unknown" to display.

## Solution
Drop and recreate the view as a TABLE with proper foreign keys, OR keep it as a view but ensure the API query includes the joins.

Since the API already has the join in the query (line 130-135), the issue is that the VIEW structure is fine but we need to verify the join is working.

Let me check the actual data:

```sql
-- Check what the view returns
SELECT * FROM retailer_empty_balances LIMIT 5;

-- Check if empty_items exist
SELECT id, name FROM empty_items LIMIT 5;

-- Check the join
SELECT 
  reb.*,
  ei.name as empty_item_name,
  r.shop_name
FROM retailer_empty_balances reb
LEFT JOIN empty_items ei ON ei.id = reb.empty_item_id
LEFT JOIN retailers r ON r.id = reb.retailer_id;
```

The API query at line 130-135 already does:
```javascript
.select(`
  *,
  empty_items(name, deposit_value),
  retailers(shop_name)
`)
```

So the issue might be that the API is using regular supabase client instead of adminSupabase for this query.

Let me check the code.
