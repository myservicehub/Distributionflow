-- ============================================
-- Add Only Missing Order Columns (SAFE VERSION)
-- ============================================
-- This script ONLY adds columns that don't exist yet.
-- It will NOT modify existing columns (including ENUMs).
--
-- INSTRUCTIONS:
-- 1. Log into your Supabase dashboard
-- 2. Navigate to SQL Editor
-- 3. Copy and paste this entire script
-- 4. Click "Run" to execute
-- ============================================

-- Add is_legacy_order flag (if not exists)
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS is_legacy_order BOOLEAN DEFAULT false;

-- Add confirmation tracking (if not exists)
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS confirmed_by UUID;

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMP WITH TIME ZONE;

-- Add workflow timestamps (if not exists)
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS packed_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS dispatched_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP WITH TIME ZONE;

-- Add delivery details (if not exists)
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS delivery_reference VARCHAR(255);

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS driver_name VARCHAR(255);

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS vehicle_number VARCHAR(100);

-- Add order notes (if not exists)
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add order number (if not exists)
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS order_number VARCHAR(50);

-- Add discount amount (if not exists)
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(15, 2) DEFAULT 0;

-- Add foreign key constraint for confirmed_by (if column exists and constraint doesn't)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'confirmed_by') THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'orders_confirmed_by_fkey' 
            AND table_name = 'orders'
        ) THEN
            ALTER TABLE orders 
            ADD CONSTRAINT orders_confirmed_by_fkey 
            FOREIGN KEY (confirmed_by) REFERENCES users(id) ON DELETE SET NULL;
            RAISE NOTICE 'Added foreign key constraint for confirmed_by';
        END IF;
    END IF;
END $$;

-- Create indexes for frequently queried columns (if not exists)
CREATE INDEX IF NOT EXISTS idx_orders_confirmed_by ON orders(confirmed_by);
CREATE INDEX IF NOT EXISTS idx_orders_confirmed_at ON orders(confirmed_at);
CREATE INDEX IF NOT EXISTS idx_orders_delivered_at ON orders(delivered_at);
CREATE INDEX IF NOT EXISTS idx_orders_packed_at ON orders(packed_at);
CREATE INDEX IF NOT EXISTS idx_orders_dispatched_at ON orders(dispatched_at);

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

-- Update existing orders to have default values for new columns
-- Only update NULL values, don't touch existing data
UPDATE orders 
SET 
  is_legacy_order = true,
  discount_amount = 0
WHERE is_legacy_order IS NULL OR discount_amount IS NULL;

-- Success message
SELECT 
    'Success! Added missing columns to orders table.' as status,
    'Note: order_status and delivery_status columns were not modified (they already exist)' as note;
