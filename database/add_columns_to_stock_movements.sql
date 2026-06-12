-- Add missing columns to stock_movements table
-- Run this in Supabase SQL Editor

ALTER TABLE stock_movements
ADD COLUMN IF NOT EXISTS quantity_before INTEGER DEFAULT 0;

ALTER TABLE stock_movements
ADD COLUMN IF NOT EXISTS quantity_after INTEGER DEFAULT 0;

-- Add user_id if it doesn't exist (for audit trail)
ALTER TABLE stock_movements
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id);

-- Add index for better performance
CREATE INDEX IF NOT EXISTS stock_movements_user_idx ON stock_movements(user_id);
CREATE INDEX IF NOT EXISTS stock_movements_product_date_idx ON stock_movements(product_id, created_at DESC);
