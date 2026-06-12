-- Complete cleanup and rebuild of stock_movements constraints
-- Run this in Supabase SQL Editor

-- Step 1: Drop ALL existing check constraints on stock_movements
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT conname 
        FROM pg_constraint 
        WHERE conrelid = 'stock_movements'::regclass 
        AND contype = 'c'
    ) LOOP
        EXECUTE 'ALTER TABLE stock_movements DROP CONSTRAINT IF EXISTS ' || quote_ident(r.conname) || ' CASCADE';
    END LOOP;
END $$;

-- Step 2: Add missing columns
ALTER TABLE stock_movements
ADD COLUMN IF NOT EXISTS quantity_before INTEGER DEFAULT 0;

ALTER TABLE stock_movements
ADD COLUMN IF NOT EXISTS quantity_after INTEGER DEFAULT 0;

ALTER TABLE stock_movements
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id);

-- Step 3: Add type column if it doesn't exist
ALTER TABLE stock_movements
ADD COLUMN IF NOT EXISTS type VARCHAR(20);

-- Step 4: If movement_type exists, copy its data to type, then drop it
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name='stock_movements' AND column_name='movement_type') 
    THEN
        -- Copy data from movement_type to type
        UPDATE stock_movements SET type = movement_type WHERE type IS NULL;
        -- Drop the old column
        ALTER TABLE stock_movements DROP COLUMN movement_type;
    END IF;
END $$;

-- Step 5: Clean up type values
UPDATE stock_movements 
SET type = CASE 
    WHEN LOWER(type) = 'in' THEN 'in'
    WHEN LOWER(type) = 'out' THEN 'out'
    WHEN LOWER(type) = 'adjustment' THEN 'adjustment'
    ELSE 'adjustment'
END
WHERE type IS NOT NULL;

UPDATE stock_movements 
SET type = 'adjustment' 
WHERE type IS NULL;

-- Step 6: Add the new check constraint
ALTER TABLE stock_movements
ADD CONSTRAINT stock_movements_type_check
CHECK (type IN ('in', 'out', 'adjustment'));

-- Step 7: Make type NOT NULL
ALTER TABLE stock_movements
ALTER COLUMN type SET NOT NULL;

-- Step 8: Set default for future inserts
ALTER TABLE stock_movements
ALTER COLUMN type SET DEFAULT 'adjustment';

-- Step 9: Add indexes
CREATE INDEX IF NOT EXISTS stock_movements_user_idx ON stock_movements(user_id);
CREATE INDEX IF NOT EXISTS stock_movements_product_date_idx ON stock_movements(product_id, created_at DESC);
CREATE INDEX IF NOT EXISTS stock_movements_type_idx ON stock_movements(type);

-- Done! Verify
SELECT 'Migration completed successfully!' as status;
