-- Add missing columns to stock_movements table (Safe Migration)
-- Run this in Supabase SQL Editor

-- Step 1: Add missing columns
ALTER TABLE stock_movements
ADD COLUMN IF NOT EXISTS quantity_before INTEGER DEFAULT 0;

ALTER TABLE stock_movements
ADD COLUMN IF NOT EXISTS quantity_after INTEGER DEFAULT 0;

ALTER TABLE stock_movements
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id);

-- Step 2: Handle movement_type vs type column
DO $$ 
BEGIN
    -- Rename movement_type to type if it exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='stock_movements' AND column_name='movement_type')
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='stock_movements' AND column_name='type') 
    THEN
        ALTER TABLE stock_movements RENAME COLUMN movement_type TO type;
    END IF;
END $$;

-- Add type column if neither exists
ALTER TABLE stock_movements
ADD COLUMN IF NOT EXISTS type VARCHAR(20);

-- Step 3: Clean up existing data BEFORE adding constraint
UPDATE stock_movements 
SET type = 'adjustment' 
WHERE type IS NULL OR type NOT IN ('in', 'out', 'adjustment');

-- Convert uppercase to lowercase if any
UPDATE stock_movements 
SET type = LOWER(type) 
WHERE type IN ('IN', 'OUT', 'ADJUSTMENT');

-- Set default for any remaining NULL values
UPDATE stock_movements 
SET type = 'adjustment' 
WHERE type IS NULL;

-- Step 4: Now add the check constraint
ALTER TABLE stock_movements
DROP CONSTRAINT IF EXISTS stock_movements_type_check;

ALTER TABLE stock_movements
ADD CONSTRAINT stock_movements_type_check
CHECK (type IN ('in', 'out', 'adjustment'));

-- Step 5: Make type NOT NULL
ALTER TABLE stock_movements
ALTER COLUMN type SET NOT NULL;

-- Step 6: Add indexes
CREATE INDEX IF NOT EXISTS stock_movements_user_idx ON stock_movements(user_id);
CREATE INDEX IF NOT EXISTS stock_movements_product_date_idx ON stock_movements(product_id, created_at DESC);
CREATE INDEX IF NOT EXISTS stock_movements_type_idx ON stock_movements(type);
