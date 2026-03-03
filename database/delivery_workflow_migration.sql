-- ============================================
-- DELIVERY WORKFLOW AUTOMATION SYSTEM
-- Database Migration Script
-- ============================================

-- ============================================
-- STEP 1: CREATE ENUMS FOR ORDER AND DELIVERY STATUS
-- ============================================

-- Create order_status enum
DO $$ BEGIN
  CREATE TYPE order_status_enum AS ENUM (
    'pending',
    'awaiting_credit_approval',
    'confirmed',
    'cancelled',
    'completed'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create delivery_status enum
DO $$ BEGIN
  CREATE TYPE delivery_status_enum AS ENUM (
    'not_started',
    'preparing',
    'packed',
    'out_for_delivery',
    'delivered',
    'failed'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- STEP 2: ADD NEW COLUMNS TO ORDERS TABLE
-- ============================================

-- Add order_status column (new structured status)
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS order_status order_status_enum DEFAULT 'pending';

-- Add delivery_status column
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS delivery_status delivery_status_enum DEFAULT 'not_started';

-- Add confirmation tracking fields
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS confirmed_by UUID REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMP WITH TIME ZONE;

-- Add delivery tracking fields
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS packed_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS dispatched_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP WITH TIME ZONE;

-- Add delivery details
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS delivery_reference VARCHAR(100);

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS driver_name VARCHAR(255);

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS vehicle_number VARCHAR(50);

-- Add legacy flag to differentiate old vs new workflow orders
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS is_legacy_order BOOLEAN DEFAULT FALSE;

-- ============================================
-- STEP 3: MIGRATE EXISTING ORDERS
-- ============================================

-- Mark all existing orders as legacy
UPDATE orders 
SET is_legacy_order = TRUE
WHERE order_status IS NULL OR order_status = 'pending';

-- Map old status to new order_status for existing orders
UPDATE orders 
SET order_status = CASE 
  WHEN status = 'pending' THEN 'pending'::order_status_enum
  WHEN status = 'confirmed' THEN 'confirmed'::order_status_enum
  WHEN status = 'delivered' THEN 'completed'::order_status_enum
  WHEN status = 'cancelled' THEN 'cancelled'::order_status_enum
  ELSE 'pending'::order_status_enum
END
WHERE order_status IS NULL;

-- Set delivery_status for existing orders
UPDATE orders 
SET delivery_status = CASE 
  WHEN status = 'pending' THEN 'not_started'::delivery_status_enum
  WHEN status = 'confirmed' THEN 'preparing'::delivery_status_enum
  WHEN status = 'delivered' THEN 'delivered'::delivery_status_enum
  WHEN status = 'cancelled' THEN 'not_started'::delivery_status_enum
  ELSE 'not_started'::delivery_status_enum
END
WHERE delivery_status IS NULL OR delivery_status = 'not_started';

-- ============================================
-- STEP 4: CREATE INDEXES FOR NEW COLUMNS
-- ============================================

CREATE INDEX IF NOT EXISTS idx_orders_order_status ON orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_status ON orders(delivery_status);
CREATE INDEX IF NOT EXISTS idx_orders_confirmed_by ON orders(confirmed_by);
CREATE INDEX IF NOT EXISTS idx_orders_confirmed_at ON orders(confirmed_at);
CREATE INDEX IF NOT EXISTS idx_orders_is_legacy ON orders(is_legacy_order);

-- ============================================
-- STEP 5: UPDATE STOCK MOVEMENTS FOR RESERVATIONS
-- ============================================

-- Ensure stock_movements.type can handle new reservation types
ALTER TABLE stock_movements 
DROP CONSTRAINT IF EXISTS stock_movements_type_check;

ALTER TABLE stock_movements 
ADD CONSTRAINT stock_movements_type_check 
CHECK (type IN ('IN', 'OUT', 'ADJUSTMENT', 'in', 'out', 'RESERVED', 'RELEASED', 'RETURNED'));

-- Add order_id reference to stock_movements for tracking
ALTER TABLE stock_movements 
ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES orders(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_stock_movements_order_id ON stock_movements(order_id);

-- ============================================
-- STEP 6: CREATE AUTOMATION SETTINGS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS delivery_automation_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL UNIQUE REFERENCES businesses(id) ON DELETE CASCADE,
  settings JSONB DEFAULT '{
    "auto_cancel_pending_hours": 48,
    "delivery_delay_warning_hours": 24,
    "require_payment_confirmation_cash": true,
    "allow_admin_credit_override": true
  }'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_delivery_automation_business_id ON delivery_automation_settings(business_id);

-- ============================================
-- STEP 7: UPDATE RLS POLICIES FOR NEW COLUMNS
-- ============================================

-- Allow warehouse users to update delivery status
CREATE POLICY IF NOT EXISTS "Warehouse can update delivery status"
  ON orders FOR UPDATE
  USING (
    business_id IN (
      SELECT business_id FROM users 
      WHERE auth_user_id = auth.uid() 
      AND role IN ('admin', 'manager', 'warehouse')
    )
  )
  WITH CHECK (
    business_id IN (
      SELECT business_id FROM users 
      WHERE auth_user_id = auth.uid() 
      AND role IN ('admin', 'manager', 'warehouse')
    )
  );

-- ============================================
-- STEP 8: CREATE HELPER FUNCTIONS
-- ============================================

-- Function to check if order exceeds credit limit
CREATE OR REPLACE FUNCTION check_credit_limit_exceeded(
  p_retailer_id UUID,
  p_order_total DECIMAL
) RETURNS BOOLEAN AS $$
DECLARE
  v_current_balance DECIMAL;
  v_credit_limit DECIMAL;
BEGIN
  SELECT current_balance, credit_limit 
  INTO v_current_balance, v_credit_limit
  FROM retailers
  WHERE id = p_retailer_id;
  
  RETURN (v_current_balance + p_order_total) > v_credit_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to reserve stock for an order
CREATE OR REPLACE FUNCTION reserve_order_stock(p_order_id UUID)
RETURNS VOID AS $$
DECLARE
  v_item RECORD;
  v_business_id UUID;
  v_confirmed_by UUID;
BEGIN
  -- Get order details
  SELECT business_id, confirmed_by INTO v_business_id, v_confirmed_by
  FROM orders WHERE id = p_order_id;
  
  -- Reserve stock for each item
  FOR v_item IN 
    SELECT product_id, quantity 
    FROM order_items 
    WHERE order_id = p_order_id
  LOOP
    -- Deduct from available stock
    UPDATE products
    SET stock_quantity = stock_quantity - v_item.quantity
    WHERE id = v_item.product_id;
    
    -- Log stock movement as RESERVED
    INSERT INTO stock_movements (
      business_id, 
      product_id, 
      type, 
      quantity, 
      notes, 
      created_by,
      order_id
    ) VALUES (
      v_business_id,
      v_item.product_id,
      'RESERVED',
      v_item.quantity,
      'Stock reserved for order ' || p_order_id,
      v_confirmed_by,
      p_order_id
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to release reserved stock (for cancellations/failures)
CREATE OR REPLACE FUNCTION release_order_stock(p_order_id UUID, p_reason TEXT DEFAULT 'RELEASED')
RETURNS VOID AS $$
DECLARE
  v_item RECORD;
  v_business_id UUID;
BEGIN
  -- Get order details
  SELECT business_id INTO v_business_id
  FROM orders WHERE id = p_order_id;
  
  -- Release stock for each item
  FOR v_item IN 
    SELECT product_id, quantity 
    FROM order_items 
    WHERE order_id = p_order_id
  LOOP
    -- Add back to available stock
    UPDATE products
    SET stock_quantity = stock_quantity + v_item.quantity
    WHERE id = v_item.product_id;
    
    -- Log stock movement
    INSERT INTO stock_movements (
      business_id, 
      product_id, 
      type, 
      quantity, 
      notes, 
      created_by,
      order_id
    ) VALUES (
      v_business_id,
      v_item.product_id,
      p_reason,
      v_item.quantity,
      p_reason || ' for order ' || p_order_id,
      NULL,
      p_order_id
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check migration status
SELECT 
  'Orders migrated' as status,
  COUNT(*) as total_orders,
  COUNT(CASE WHEN is_legacy_order = TRUE THEN 1 END) as legacy_orders,
  COUNT(CASE WHEN is_legacy_order = FALSE THEN 1 END) as new_workflow_orders
FROM orders;

-- Check status distribution
SELECT 
  order_status,
  delivery_status,
  COUNT(*) as count
FROM orders
GROUP BY order_status, delivery_status
ORDER BY order_status, delivery_status;

SELECT 'Migration completed successfully!' as message;
