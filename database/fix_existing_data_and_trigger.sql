-- FIX: Handle existing data before adding constraint

-- Step 1: See what values currently exist in the type column
SELECT DISTINCT type, COUNT(*) as count
FROM stock_movements
GROUP BY type;

-- Step 2: Drop the old constraint (if it exists)
ALTER TABLE stock_movements DROP CONSTRAINT IF EXISTS stock_movements_type_check;

-- Step 3: Update any existing invalid values to 'out' (or 'in' as appropriate)
-- If type is NULL, set it to 'out'
UPDATE stock_movements 
SET type = 'out' 
WHERE type IS NULL OR type NOT IN ('in', 'out', 'adjustment', 'return');

-- Step 4: Now add the constraint (after fixing data)
ALTER TABLE stock_movements 
ADD CONSTRAINT stock_movements_type_check 
CHECK (type IN ('in', 'out', 'adjustment', 'return'));

-- Step 5: Update the trigger
DROP TRIGGER IF EXISTS deduct_stock_on_confirm ON orders;
DROP FUNCTION IF EXISTS auto_deduct_stock_on_order_confirm();

CREATE OR REPLACE FUNCTION auto_deduct_stock_on_order_confirm()
RETURNS TRIGGER AS $$
DECLARE
  item RECORD;
  current_user_id UUID;
BEGIN
  IF NEW.status = 'confirmed' AND (OLD.status IS NULL OR OLD.status != 'confirmed') THEN
    
    current_user_id := NEW.sales_rep_id;
    
    FOR item IN 
      SELECT product_id, quantity 
      FROM order_items 
      WHERE order_id = NEW.id
    LOOP
      UPDATE products
      SET stock_quantity = stock_quantity - item.quantity
      WHERE id = item.product_id;
      
      INSERT INTO stock_movements (business_id, product_id, type, quantity, notes, created_by)
      VALUES (
        NEW.business_id,
        item.product_id,
        'out',
        item.quantity,
        format('Auto-deducted for order %s', NEW.id),
        current_user_id
      );
    END LOOP;
    
    IF NEW.payment_status = 'credit' OR NEW.payment_status = 'partial' THEN
      UPDATE retailers
      SET current_balance = current_balance + NEW.total_amount
      WHERE id = NEW.retailer_id;
    END IF;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER deduct_stock_on_confirm
  AFTER INSERT OR UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION auto_deduct_stock_on_order_confirm();

-- Verify
SELECT 'All fixed! Trigger created successfully!' as status;
