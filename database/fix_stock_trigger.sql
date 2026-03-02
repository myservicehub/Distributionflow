-- EMERGENCY FIX: Update business rules triggers to use correct column name
-- The stock_movements table uses "type" not "movement_type"

-- Drop existing triggers first
DROP TRIGGER IF EXISTS deduct_stock_on_confirm ON orders;
DROP FUNCTION IF EXISTS auto_deduct_stock_on_order_confirm();

-- Recreate the trigger with correct column name
CREATE OR REPLACE FUNCTION auto_deduct_stock_on_order_confirm()
RETURNS TRIGGER AS $$
DECLARE
  item RECORD;
BEGIN
  -- Only trigger when status changes to 'confirmed'
  IF NEW.status = 'confirmed' AND (OLD.status IS NULL OR OLD.status != 'confirmed') THEN
    
    -- Deduct stock for all order items
    FOR item IN 
      SELECT product_id, quantity 
      FROM order_items 
      WHERE order_id = NEW.id
    LOOP
      -- Deduct stock
      UPDATE products
      SET stock_quantity = stock_quantity - item.quantity
      WHERE id = item.product_id;
      
      -- Create stock movement record (using "type" column)
      INSERT INTO stock_movements (business_id, product_id, type, quantity, notes)
      VALUES (
        NEW.business_id,
        item.product_id,
        'out',
        item.quantity,
        format('Auto-deducted for order %s', NEW.id)
      );
    END LOOP;
    
    -- Update retailer balance if payment status is credit
    IF NEW.payment_status = 'credit' OR NEW.payment_status = 'partial' THEN
      UPDATE retailers
      SET current_balance = current_balance + NEW.total_amount
      WHERE id = NEW.retailer_id;
    END IF;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
CREATE TRIGGER deduct_stock_on_confirm
  AFTER INSERT OR UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION auto_deduct_stock_on_order_confirm();

-- Verify trigger is created
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'deduct_stock_on_confirm';
