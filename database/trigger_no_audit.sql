-- SIMPLIFIED TRIGGER: Remove audit logging from trigger
-- Let the API handle audit logging instead

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

SELECT 'Trigger updated - audit logging removed from trigger!' as status;
