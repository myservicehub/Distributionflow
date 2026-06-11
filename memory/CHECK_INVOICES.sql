# Check Invoices in Database

Run this SQL to check if invoices exist:

```sql
-- Check all invoices
SELECT id, invoice_number, business_id, amount, status, created_at
FROM invoices
ORDER BY created_at DESC
LIMIT 10;

-- Check specific invoice ID
SELECT id, invoice_number, business_id, plan_id, amount, status
FROM invoices
WHERE id = '61676747-fa69-4a02-b78b-3a0f435b11e7';

-- Check with joins
SELECT 
  i.*,
  b.name as business_name,
  p.display_name as plan_name
FROM invoices i
LEFT JOIN businesses b ON b.id = i.business_id
LEFT JOIN plans p ON p.id = i.plan_id
ORDER BY i.created_at DESC
LIMIT 5;
```

If no invoices exist, you may need to create a test invoice or make a payment to generate one.
