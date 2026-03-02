-- FINAL FIX: Update trigger to include all required columns
-- The stock_movements table requires: type, created_by

-- Drop existing trigger
DROP TRIGGER IF EXISTS deduct_stock_on_confirm ON orders;
DROP FUNCTION IF EXISTS auto_deduct_stock_on_order_confirm();

-- Recreate with ALL required columns
CREATE OR REPLACE FUNCTION auto_deduct_stock_on_order_confirm()
RETURNS TRIGGER AS $$
DECLARE
  item RECORD;
  current_user_id UUID;
BEGIN
  -- Only trigger when status changes to 'confirmed'
  IF NEW.status = 'confirmed' AND (OLD.status IS NULL OR OLD.status != 'confirmed') THEN
    
    -- Get the current user (from context or set a default)
    -- If you have a way to get current user ID, use it. Otherwise, use a system user or the sales rep
    current_user_id := NEW.sales_rep_id; -- or could be a system user UUID
    
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
      
      -- Create stock movement record with all required fields
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

-- Verify trigger created
SELECT trigger_name, event_object_table, action_statement
FROM information_schema.triggers
WHERE trigger_name = 'deduct_stock_on_confirm';
