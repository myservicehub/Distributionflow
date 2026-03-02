-- ============================================
-- PHASE 5: BUSINESS RULE ENFORCEMENT
-- ============================================
-- This script adds database-level business rules through triggers and constraints

-- ============================================
-- 1. PREVENT NEGATIVE STOCK
-- ============================================

-- Function to validate stock quantity
CREATE OR REPLACE FUNCTION prevent_negative_stock()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.stock_quantity < 0 THEN
    RAISE EXCEPTION 'Stock quantity cannot be negative for product %', NEW.name;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on products table
DROP TRIGGER IF EXISTS check_negative_stock ON products;
CREATE TRIGGER check_negative_stock
  BEFORE INSERT OR UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION prevent_negative_stock();

-- ============================================
-- 2. AUTO-BLOCK RETAILER WHEN CREDIT LIMIT EXCEEDED
-- ============================================

CREATE OR REPLACE FUNCTION auto_block_retailer_on_credit_limit()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if current balance exceeds credit limit
  IF NEW.current_balance > NEW.credit_limit THEN
    NEW.status = 'blocked';
    
    -- Log the auto-block event
    INSERT INTO audit_logs (business_id, user_id, action, details, entity_type, resource_id)
    VALUES (
      NEW.business_id,
      NULL,  -- System action
      'AUTO_BLOCK_RETAILER',
      format('Retailer %s auto-blocked: balance %.2f exceeds limit %.2f', 
        NEW.shop_name, NEW.current_balance, NEW.credit_limit),
      'retailer',
      NEW.id
    );
  ELSIF NEW.current_balance <= NEW.credit_limit AND OLD.status = 'blocked' THEN
    -- Auto-unblock if balance is back within limit
    NEW.status = 'active';
    
    INSERT INTO audit_logs (business_id, user_id, action, details, entity_type, resource_id)
    VALUES (
      NEW.business_id,
      NULL,
      'AUTO_UNBLOCK_RETAILER',
      format('Retailer %s auto-unblocked: balance %.2f within limit %.2f', 
        NEW.shop_name, NEW.current_balance, NEW.credit_limit),
      'retailer',
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS auto_block_retailer ON retailers;
CREATE TRIGGER auto_block_retailer
  BEFORE UPDATE ON retailers
  FOR EACH ROW
  WHEN (OLD.current_balance IS DISTINCT FROM NEW.current_balance OR 
        OLD.credit_limit IS DISTINCT FROM NEW.credit_limit)
  EXECUTE FUNCTION auto_block_retailer_on_credit_limit();

-- ============================================
-- 3. VALIDATE STOCK AVAILABILITY FOR ORDERS
-- ============================================

CREATE OR REPLACE FUNCTION validate_stock_for_order()
RETURNS TRIGGER AS $$
DECLARE
  available_stock INTEGER;
  product_name TEXT;
BEGIN
  -- Get current stock for the product
  SELECT stock_quantity, name INTO available_stock, product_name
  FROM products
  WHERE id = NEW.product_id;
  
  -- Check if enough stock is available
  IF available_stock < NEW.quantity THEN
    RAISE EXCEPTION 'Insufficient stock for product %: requested %, available %', 
      product_name, NEW.quantity, available_stock;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS check_stock_availability ON order_items;
CREATE TRIGGER check_stock_availability
  BEFORE INSERT OR UPDATE ON order_items
  FOR EACH ROW
  EXECUTE FUNCTION validate_stock_for_order();

-- ============================================
-- 4. AUTO-DEDUCT STOCK WHEN ORDER IS CONFIRMED
-- ============================================

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
      
      -- Create stock movement record
      INSERT INTO stock_movements (business_id, product_id, movement_type, quantity, notes)
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

DROP TRIGGER IF EXISTS deduct_stock_on_confirm ON orders;
CREATE TRIGGER deduct_stock_on_confirm
  AFTER INSERT OR UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION auto_deduct_stock_on_order_confirm();

-- ============================================
-- 5. AUTO-UPDATE RETAILER BALANCE ON PAYMENT
-- ============================================

CREATE OR REPLACE FUNCTION auto_update_balance_on_payment()
RETURNS TRIGGER AS $$
BEGIN
  -- Reduce retailer balance when payment is recorded
  UPDATE retailers
  SET current_balance = current_balance - NEW.amount
  WHERE id = NEW.retailer_id;
  
  -- Log audit event
  INSERT INTO audit_logs (business_id, user_id, action, details, entity_type, resource_id)
  VALUES (
    NEW.business_id,
    NULL,
    'PAYMENT_RECORDED',
    format('Payment of %.2f recorded for retailer', NEW.amount),
    'payment',
    NEW.id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_balance_on_payment ON payments;
CREATE TRIGGER update_balance_on_payment
  AFTER INSERT ON payments
  FOR EACH ROW
  EXECUTE FUNCTION auto_update_balance_on_payment();

-- ============================================
-- 6. AUDIT LOG ON CREDIT LIMIT CHANGES
-- ============================================

CREATE OR REPLACE FUNCTION log_credit_limit_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.credit_limit IS DISTINCT FROM NEW.credit_limit THEN
    INSERT INTO audit_logs (business_id, user_id, action, details, entity_type, resource_id)
    VALUES (
      NEW.business_id,
      NULL,
      'CREDIT_LIMIT_CHANGED',
      format('Credit limit changed from %.2f to %.2f for %s', 
        OLD.credit_limit, NEW.credit_limit, NEW.shop_name),
      'retailer',
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS log_credit_change ON retailers;
CREATE TRIGGER log_credit_change
  AFTER UPDATE ON retailers
  FOR EACH ROW
  WHEN (OLD.credit_limit IS DISTINCT FROM NEW.credit_limit)
  EXECUTE FUNCTION log_credit_limit_change();

-- ============================================
-- 7. LOW STOCK ALERT LOGGING
-- ============================================

CREATE OR REPLACE FUNCTION check_low_stock_alert()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if stock quantity drops below threshold
  IF NEW.stock_quantity <= NEW.low_stock_threshold AND 
     (OLD.stock_quantity IS NULL OR OLD.stock_quantity > NEW.low_stock_threshold) THEN
    
    INSERT INTO audit_logs (business_id, user_id, action, details, entity_type, resource_id)
    VALUES (
      NEW.business_id,
      NULL,
      'LOW_STOCK_ALERT',
      format('Product %s is low on stock: %d units remaining (threshold: %d)', 
        NEW.name, NEW.stock_quantity, NEW.low_stock_threshold),
      'product',
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS low_stock_alert ON products;
CREATE TRIGGER low_stock_alert
  AFTER UPDATE ON products
  FOR EACH ROW
  WHEN (OLD.stock_quantity IS DISTINCT FROM NEW.stock_quantity)
  EXECUTE FUNCTION check_low_stock_alert();

-- ============================================
-- VERIFICATION
-- ============================================
-- Check that all triggers are created:
SELECT 
  trigger_name, 
  event_manipulation, 
  event_object_table,
  action_timing
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;
