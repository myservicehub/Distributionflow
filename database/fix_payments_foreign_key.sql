-- ============================================
-- Fix Payments Table Foreign Key
-- ============================================
-- This script fixes the foreign key relationship between
-- payments and users tables. The error indicates Supabase
-- is looking for 'payments_received_by_fkey' but it might
-- not exist or have a different name.
--
-- INSTRUCTIONS:
-- 1. Log into your Supabase dashboard
-- 2. Navigate to SQL Editor
-- 3. Copy and paste this entire script
-- 4. Click "Run" to execute
-- ============================================

-- First, check if the foreign key exists
DO $$
BEGIN
    -- Drop the old foreign key if it exists (might have wrong name)
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'payments_recorded_by_fkey' 
        AND table_name = 'payments'
    ) THEN
        ALTER TABLE payments DROP CONSTRAINT payments_recorded_by_fkey;
        RAISE NOTICE 'Dropped existing payments_recorded_by_fkey constraint';
    END IF;

    -- Drop any other foreign key on recorded_by column
    IF EXISTS (
        SELECT 1 FROM information_schema.key_column_usage 
        WHERE table_name = 'payments' 
        AND column_name = 'recorded_by'
        AND constraint_name LIKE '%_fkey'
    ) THEN
        EXECUTE (
            SELECT 'ALTER TABLE payments DROP CONSTRAINT ' || constraint_name
            FROM information_schema.key_column_usage 
            WHERE table_name = 'payments' 
            AND column_name = 'recorded_by'
            AND constraint_name LIKE '%_fkey'
            LIMIT 1
        );
        RAISE NOTICE 'Dropped existing foreign key on recorded_by column';
    END IF;
END $$;

-- Make sure the recorded_by column exists
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS recorded_by UUID;

-- Create the foreign key with the correct name that Supabase expects
ALTER TABLE payments 
ADD CONSTRAINT payments_received_by_fkey 
FOREIGN KEY (recorded_by) 
REFERENCES users(id) 
ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_payments_recorded_by ON payments(recorded_by);

-- Add comment for documentation
COMMENT ON COLUMN payments.recorded_by IS 'User who recorded this payment (foreign key to users table)';

-- Refresh Supabase schema cache
NOTIFY pgrst, 'reload schema';

-- Success message
SELECT 'Payments foreign key fixed successfully! The relationship between payments and users is now properly configured.' AS result;
