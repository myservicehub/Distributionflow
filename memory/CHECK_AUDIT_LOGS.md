# Check Activity Log / Audit Logs

Please run this SQL in Supabase SQL Editor:

```sql
-- Check if audit logs exist at all
SELECT COUNT(*) as total_logs
FROM audit_logs;

-- Check recent audit logs
SELECT 
  id,
  action,
  entity_type,
  details,
  created_at,
  user_id
FROM audit_logs
ORDER BY created_at DESC
LIMIT 20;

-- Check for order-related logs specifically
SELECT 
  id,
  action,
  entity_type,
  details,
  created_at
FROM audit_logs
WHERE entity_type = 'order'
OR details::text LIKE '%order%'
ORDER BY created_at DESC
LIMIT 10;
```

**Please paste the results here so I can see:**
1. If ANY audit logs are being created
2. If order creation logs specifically are missing
3. What the recent logs look like

This will tell me if:
- The audit logging is completely broken
- Just order logs aren't working
- Or if it's a display/filter issue on the frontend
