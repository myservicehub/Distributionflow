-- NUCLEAR OPTION: Drop ALL order-related triggers and start fresh

-- Drop all possible triggers
DROP TRIGGER IF EXISTS deduct_stock_on_confirm ON orders CASCADE;
DROP TRIGGER IF EXISTS auto_block_retailer ON retailers CASCADE;
DROP TRIGGER IF EXISTS check_stock_availability ON order_items CASCADE;
DROP TRIGGER IF EXISTS log_credit_change ON retailers CASCADE;
DROP TRIGGER IF EXISTS update_balance_on_payment ON payments CASCADE;
DROP TRIGGER IF EXISTS low_stock_alert ON products CASCADE;
DROP TRIGGER IF EXISTS check_negative_stock ON products CASCADE;

-- Drop all possible functions
DROP FUNCTION IF EXISTS auto_deduct_stock_on_order_confirm() CASCADE;
DROP FUNCTION IF EXISTS auto_block_retailer_on_credit_limit() CASCADE;
DROP FUNCTION IF EXISTS validate_stock_for_order() CASCADE;
DROP FUNCTION IF EXISTS log_credit_limit_change() CASCADE;
DROP FUNCTION IF EXISTS auto_update_balance_on_payment() CASCADE;
DROP FUNCTION IF EXISTS check_low_stock_alert() CASCADE;
DROP FUNCTION IF EXISTS prevent_negative_stock() CASCADE;

-- Now create ONLY the essential trigger with NO audit logging
CREATE OR REPLACE FUNCTION auto_deduct_stock_on_order_confirm()
RETURNS TRIGGER AS $$
DECLARE
  item RECORD;
BEGIN
  IF NEW.status = 'confirmed' AND (OLD.status IS NULL OR OLD.status != 'confirmed') THEN
    
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
        'Auto-deducted for order ' || NEW.id,
        NEW.sales_rep_id
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
SELECT 'ALL TRIGGERS DROPPED AND RECREATED!' as status;
SELECT trigger_name, event_object_table 
FROM information_schema.triggers
WHERE event_object_table IN ('orders', 'retailers', 'products', 'payments', 'order_items');
