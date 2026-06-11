# Create Test Invoice

Now that the invoices table exists, let's create a test invoice so you can test the viewing feature.

Run this SQL to create a sample invoice:

```sql
-- Create a test invoice
-- Replace the business_id and plan_id with your actual IDs

-- First, get your business_id and plan_id
SELECT b.id as business_id, b.name, p.id as plan_id, p.display_name
FROM businesses b
CROSS JOIN plans p
WHERE b.email = 'eseimieghandoris@yahoo.com'
LIMIT 1;

-- Then create a test invoice using those IDs
-- (Copy the IDs from the query above and replace in the INSERT below)

INSERT INTO invoices (
  business_id,
  plan_id,
  invoice_number,
  amount,
  status,
  billing_period_start,
  billing_period_end,
  payment_provider_reference,
  created_at
) VALUES (
  'YOUR_BUSINESS_ID_HERE',  -- Replace with actual business_id from query above
  'YOUR_PLAN_ID_HERE',       -- Replace with actual plan_id from query above
  'INV-' || LPAD(FLOOR(RANDOM() * 100000000)::TEXT, 8, '0'),
  70000,
  'paid',
  NOW() - INTERVAL '30 days',
  NOW(),
  'test_reference_' || FLOOR(RANDOM() * 1000000),
  NOW()
);

-- Verify the invoice was created
SELECT 
  i.id,
  i.invoice_number,
  i.amount,
  i.status,
  b.name as business_name,
  p.display_name as plan_name
FROM invoices i
JOIN businesses b ON b.id = i.business_id
JOIN plans p ON p.id = i.plan_id
ORDER BY i.created_at DESC
LIMIT 5;
```

After creating the test invoice, refresh your billing page and you'll see it in the "Recent Invoices" section with a working "View" button!
