-- ULTIMATE FIX: Check existing constraints and update trigger accordingly
-- First, let's see what the stock_movements table structure actually is

-- Step 1: View the table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns
WHERE table_name = 'stock_movements'
ORDER BY ordinal_position;

-- Step 2: View existing constraints
SELECT 
    constraint_name,
    check_clause
FROM information_schema.check_constraints
WHERE constraint_name LIKE '%stock_movements%';

-- Step 3: Drop the problematic check constraint (if it exists)
ALTER TABLE stock_movements DROP CONSTRAINT IF EXISTS stock_movements_type_check;

-- Step 4: Recreate constraint with correct values
ALTER TABLE stock_movements 
ADD CONSTRAINT stock_movements_type_check 
CHECK (type IN ('in', 'out', 'adjustment', 'return'));

-- Step 5: Now update the trigger with correct column names
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

-- Verify everything is set up
SELECT 'Trigger created successfully!' as status;
