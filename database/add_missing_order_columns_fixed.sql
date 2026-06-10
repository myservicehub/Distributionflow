-- ============================================
-- Add Missing Order Workflow Columns (FIXED)
-- ============================================
-- This migration adds all the missing columns that the application
-- code expects but handles existing ENUM types properly.
--
-- INSTRUCTIONS:
-- 1. Log into your Supabase dashboard
-- 2. Navigate to SQL Editor
-- 3. Copy and paste this entire script
-- 4. Click "Run" to execute
-- ============================================

-- First, check if order_status and delivery_status exist as ENUMs
DO $$
BEGIN
    -- If order_status exists as an enum, we'll keep it and just ensure values are correct
    -- If it doesn't exist, create it as VARCHAR for flexibility
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'order_status') THEN
        ALTER TABLE orders ADD COLUMN order_status VARCHAR(50);
        RAISE NOTICE 'Created order_status column as VARCHAR';
    ELSE
        RAISE NOTICE 'order_status column already exists, keeping existing type';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'delivery_status') THEN
        ALTER TABLE orders ADD COLUMN delivery_status VARCHAR(50);
        RAISE NOTICE 'Created delivery_status column as VARCHAR';
    ELSE
        RAISE NOTICE 'delivery_status column already exists, keeping existing type';
    END IF;
END $$;

-- Add is_legacy_order flag
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS is_legacy_order BOOLEAN DEFAULT false;

-- Add confirmation tracking
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS confirmed_by UUID REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMP WITH TIME ZONE;

-- Add workflow timestamps
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS packed_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS dispatched_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP WITH TIME ZONE;

-- Add delivery details
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS delivery_reference VARCHAR(255);

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS driver_name VARCHAR(255);

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS vehicle_number VARCHAR(100);

-- Add order notes
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add order number (optional - for human-readable reference)
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS order_number VARCHAR(50);

-- Add discount amount
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(15, 2) DEFAULT 0;

-- Create indexes for frequently queried columns (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_orders_order_status ON orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_status ON orders(delivery_status);
CREATE INDEX IF NOT EXISTS idx_orders_confirmed_by ON orders(confirmed_by);
CREATE INDEX IF NOT EXISTS idx_orders_confirmed_at ON orders(confirmed_at);
CREATE INDEX IF NOT EXISTS idx_orders_delivered_at ON orders(delivered_at);

-- Add comments for documentation
COMMENT ON COLUMN orders.is_legacy_order IS 'Flag to distinguish old orders from new workflow orders';
COMMENT ON COLUMN orders.confirmed_by IS 'User ID who confirmed the order (manager/admin approval)';
COMMENT ON COLUMN orders.confirmed_at IS 'Timestamp when order was confirmed';
COMMENT ON COLUMN orders.packed_at IS 'Timestamp when order was packed';
COMMENT ON COLUMN orders.dispatched_at IS 'Timestamp when order was dispatched for delivery';
COMMENT ON COLUMN orders.delivered_at IS 'Timestamp when order was delivered';
COMMENT ON COLUMN orders.delivery_reference IS 'External delivery reference or tracking number';
COMMENT ON COLUMN orders.driver_name IS 'Name of the delivery driver';
COMMENT ON COLUMN orders.vehicle_number IS 'Vehicle registration/identification number';
COMMENT ON COLUMN orders.notes IS 'Additional notes or comments about the order';
COMMENT ON COLUMN orders.order_number IS 'Human-readable order reference number';
COMMENT ON COLUMN orders.discount_amount IS 'Discount applied to the order';

-- Update existing orders to have default values for new columns (skip order_status and delivery_status)
UPDATE orders 
SET 
  is_legacy_order = COALESCE(is_legacy_order, true),
  discount_amount = COALESCE(discount_amount, 0)
WHERE is_legacy_order IS NULL OR discount_amount IS NULL;

-- Success message
SELECT 'Orders table schema updated successfully! All missing columns have been added.' AS result;
