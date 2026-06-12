-- Add missing columns to stock_movements table
-- Run this in Supabase SQL Editor

ALTER TABLE stock_movements
ADD COLUMN IF NOT EXISTS quantity_before INTEGER DEFAULT 0;

ALTER TABLE stock_movements
ADD COLUMN IF NOT EXISTS quantity_after INTEGER DEFAULT 0;

ALTER TABLE stock_movements
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id);

-- Rename movement_type to type if needed, or add type column
-- Check if movement_type exists and type doesn't
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='stock_movements' AND column_name='movement_type')
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='stock_movements' AND column_name='type') 
    THEN
        ALTER TABLE stock_movements RENAME COLUMN movement_type TO type;
    END IF;
END $$;

-- If neither exists, add type column
ALTER TABLE stock_movements
ADD COLUMN IF NOT EXISTS type VARCHAR(20) DEFAULT 'adjustment';

-- Add check constraint for type
ALTER TABLE stock_movements
DROP CONSTRAINT IF EXISTS stock_movements_type_check;

ALTER TABLE stock_movements
ADD CONSTRAINT stock_movements_type_check
CHECK (type IN ('in', 'out', 'adjustment'));

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS stock_movements_user_idx ON stock_movements(user_id);
CREATE INDEX IF NOT EXISTS stock_movements_product_date_idx ON stock_movements(product_id, created_at DESC);
CREATE INDEX IF NOT EXISTS stock_movements_type_idx ON stock_movements(type);
