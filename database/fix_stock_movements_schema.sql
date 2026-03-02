-- Fix stock_movements table schema
-- This adds the movement_type column if it doesn't exist

-- Check if movement_type column exists, if not add it
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'stock_movements' 
        AND column_name = 'movement_type'
    ) THEN
        ALTER TABLE stock_movements 
        ADD COLUMN movement_type TEXT CHECK (movement_type IN ('in', 'out'));
        
        -- Set default value for existing records
        UPDATE stock_movements 
        SET movement_type = 'out' 
        WHERE movement_type IS NULL;
    END IF;
END $$;

-- Verify the column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'stock_movements'
ORDER BY ordinal_position;
