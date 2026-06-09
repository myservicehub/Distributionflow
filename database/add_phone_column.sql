-- Add missing phone column to users table
-- This fixes the "column users.phone does not exist" error

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS phone TEXT;

-- Add a comment to document this column
COMMENT ON COLUMN users.phone IS 'User phone number - added to fix RLS policy compatibility';
