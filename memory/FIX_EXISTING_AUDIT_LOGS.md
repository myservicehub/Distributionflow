# Fix Existing Audit Logs

Your existing audit logs have `entity_type` set but `resource_type` is NULL. This is why they weren't showing up.

## Run this SQL to fix existing logs:

```sql
-- Copy entity_type to resource_type for all existing logs
UPDATE audit_logs 
SET resource_type = entity_type,
    entity_id = resource_id
WHERE resource_type IS NULL 
   OR entity_id IS NULL;

-- Verify the fix
SELECT 
  COUNT(*) as total_logs,
  COUNT(resource_type) as logs_with_resource_type,
  COUNT(entity_type) as logs_with_entity_type
FROM audit_logs;
```

## After running this SQL:

1. **Refresh the Activity Log page**
2. **You should see all your order creation logs**
3. **New logs will automatically populate both columns**

---

## What This Fixed

**Before:**
- Order creation set `entity_type = 'order'` and `resource_id = order_id`
- But Activity Log queried `resource_type` (which was NULL)
- Result: No logs shown

**After:**
- Order creation now sets BOTH `entity_type` AND `resource_type`
- Existing logs updated to have `resource_type` populated
- Result: All logs visible

---

**Run the SQL above and your Activity Log should show all order creation activities!** ✅
