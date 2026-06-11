# Retailer Empty Balance KPI Fix

## Issue Reported
After issuing empty bottles to a retailer, the retailer empty balance KPI is showing incorrect values.

## Root Cause Analysis

The `retailer_empty_balances` should be tracking:
- **Issued to Retailer** (increases balance - retailer owes you bottles)
- **Returned from Retailer** (decreases balance - retailer returns bottles)

## Verification Steps

### Step 1: Check if `retailer_empty_balances` is a Table or View

Run this SQL in Supabase SQL Editor:

```sql
-- Check table type
SELECT 
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name = 'retailer_empty_balances';
```

**If it's a VIEW:** The code is broken because you cannot UPDATE/INSERT into views. We need to fix the code to only insert into `empty_movements` and let the view calculate balances.

**If it's a TABLE:** Continue to Step 2.

---

### Step 2: Check Current Balance Data

```sql
-- View all retailer balances
SELECT 
  reb.id,
  reb.retailer_id,
  r.shop_name,
  ei.name as empty_item_name,
  reb.quantity_outstanding,
  reb.created_at,
  reb.updated_at
FROM retailer_empty_balances reb
JOIN retailers r ON r.id = reb.retailer_id
JOIN empty_items ei ON ei.id = reb.empty_item_id
ORDER BY reb.updated_at DESC;
```

---

### Step 3: Check Empty Movements History

```sql
-- View recent empty movements
SELECT 
  em.id,
  em.type,
  em.quantity,
  r.shop_name as retailer,
  ei.name as empty_item,
  em.notes,
  em.created_at,
  u.name as created_by_user
FROM empty_movements em
LEFT JOIN retailers r ON r.id = em.retailer_id
JOIN empty_items ei ON ei.id = em.empty_item_id
LEFT JOIN users u ON u.id = em.created_by
ORDER BY em.created_at DESC
LIMIT 50;
```

---

### Step 4: Verify Balance Calculation

Compare the balance in `retailer_empty_balances` with the sum of movements:

```sql
-- Calculate expected balance from movements
WITH movement_totals AS (
  SELECT 
    retailer_id,
    empty_item_id,
    SUM(CASE 
      WHEN type = 'issued_to_retailer' THEN quantity
      WHEN type = 'returned_from_retailer' THEN -quantity
      ELSE 0
    END) as calculated_balance
  FROM empty_movements
  WHERE retailer_id IS NOT NULL
  GROUP BY retailer_id, empty_item_id
),
current_balances AS (
  SELECT 
    retailer_id,
    empty_item_id,
    quantity_outstanding as recorded_balance
  FROM retailer_empty_balances
)
SELECT 
  r.shop_name,
  ei.name as empty_item,
  mt.calculated_balance as calculated_from_movements,
  cb.recorded_balance as recorded_in_table,
  (mt.calculated_balance - COALESCE(cb.recorded_balance, 0)) as difference
FROM movement_totals mt
LEFT JOIN current_balances cb ON cb.retailer_id = mt.retailer_id AND cb.empty_item_id = mt.empty_item_id
JOIN retailers r ON r.id = mt.retailer_id
JOIN empty_items ei ON ei.id = mt.empty_item_id
WHERE mt.calculated_balance != COALESCE(cb.recorded_balance, 0)
ORDER BY difference DESC;
```

---

## Fix Options

### Option 1: If `retailer_empty_balances` is a VIEW (Recommended)

Replace the view with a calculated query. Update the API to NOT directly modify `retailer_empty_balances`:

**In `/app/app/api/empty-bottles/route.js`:**

Remove the code that updates `retailer_empty_balances` (lines 595-635) and replace with just logging the movement:

```javascript
// In 'issue-to-retailer' route (line 547)
// REMOVE lines 595-635 (balance update code)
// KEEP only the movement logging (lines 638-650)

// The view will automatically calculate the balance from movements
```

Then create/update the view:

```sql
-- Drop and recreate the view
DROP VIEW IF EXISTS retailer_empty_balances CASCADE;

CREATE VIEW retailer_empty_balances AS
SELECT 
  ROW_NUMBER() OVER (ORDER BY retailer_id, empty_item_id) as id,
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
```

---

### Option 2: If `retailer_empty_balances` is a TABLE (Keep Current Approach)

The code should work, but there might be a synchronization issue. Run this to recalculate all balances:

```sql
-- Recalculate all balances from movements
WITH movement_balances AS (
  SELECT 
    business_id,
    retailer_id,
    empty_item_id,
    SUM(CASE 
      WHEN type = 'issued_to_retailer' THEN quantity
      WHEN type = 'returned_from_retailer' THEN -quantity
      ELSE 0
    END) as calculated_balance
  FROM empty_movements
  WHERE retailer_id IS NOT NULL
  GROUP BY business_id, retailer_id, empty_item_id
)
UPDATE retailer_empty_balances reb
SET 
  quantity_outstanding = mb.calculated_balance,
  updated_at = NOW()
FROM movement_balances mb
WHERE reb.business_id = mb.business_id
  AND reb.retailer_id = mb.retailer_id
  AND reb.empty_item_id = mb.empty_item_id
  AND reb.quantity_outstanding != mb.calculated_balance;

-- Insert missing balances
INSERT INTO retailer_empty_balances (business_id, retailer_id, empty_item_id, quantity_outstanding, created_at, updated_at)
SELECT 
  business_id,
  retailer_id,
  empty_item_id,
  calculated_balance,
  NOW(),
  NOW()
FROM (
  SELECT 
    business_id,
    retailer_id,
    empty_item_id,
    SUM(CASE 
      WHEN type = 'issued_to_retailer' THEN quantity
      WHEN type = 'returned_from_retailer' THEN -quantity
      ELSE 0
    END) as calculated_balance
  FROM empty_movements
  WHERE retailer_id IS NOT NULL
  GROUP BY business_id, retailer_id, empty_item_id
) mb
WHERE calculated_balance > 0
  AND NOT EXISTS (
    SELECT 1 FROM retailer_empty_balances reb
    WHERE reb.business_id = mb.business_id
      AND reb.retailer_id = mb.retailer_id
      AND reb.empty_item_id = mb.empty_item_id
  );

-- Delete zero balances
DELETE FROM retailer_empty_balances
WHERE quantity_outstanding <= 0;
```

---

## Recommended Solution

I recommend **Option 1** (using a VIEW) because:
1. **Single source of truth:** Balances are always calculated from movements
2. **No sync issues:** Balances update automatically when movements change
3. **Audit trail:** All changes are logged in `empty_movements`
4. **Simpler code:** No need to manually update balances

---

## Next Steps

1. Run **Step 1** to check if it's a view or table
2. If VIEW: Apply **Option 1** fix
3. If TABLE: Run **Option 2** SQL to recalculate balances
4. Verify by issuing empty bottles again and checking the balance updates correctly

---

## Testing Checklist

After applying the fix:
- [ ] Issue empty bottles to a retailer
- [ ] Check retailer empty balance page shows correct balance
- [ ] Record a return from retailer
- [ ] Verify balance decreases correctly
- [ ] Check empty movements history shows all transactions
- [ ] Verify KPI dashboard shows correct totals
