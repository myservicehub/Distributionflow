-- Add status column to products table for soft delete
-- Run this in Supabase SQL Editor

ALTER TABLE products
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';

-- Add check constraint
ALTER TABLE products
ADD CONSTRAINT products_status_check 
CHECK (status IN ('active', 'inactive'));

-- Add index for status filtering
CREATE INDEX IF NOT EXISTS products_status_idx ON products(business_id, status);

-- Set existing products to active
UPDATE products 
SET status = 'active' 
WHERE status IS NULL;
