-- Fix stock_movements foreign key issue
-- The table has a user_id column but the foreign key constraint is missing or broken

-- Option 1: Drop the user_id column if it's not needed
-- ALTER TABLE stock_movements DROP COLUMN IF EXISTS user_id;

-- Option 2: Add the proper foreign key constraint
-- First, ensure any invalid user_id values are set to NULL
UPDATE stock_movements 
SET user_id = NULL 
WHERE user_id IS NOT NULL 
  AND user_id NOT IN (SELECT id FROM users);

-- Then add the foreign key constraint
ALTER TABLE stock_movements
DROP CONSTRAINT IF EXISTS stock_movements_user_id_fkey;

ALTER TABLE stock_movements
ADD CONSTRAINT stock_movements_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES users(id) 
ON DELETE SET NULL;

-- Add comment
COMMENT ON CONSTRAINT stock_movements_user_id_fkey ON stock_movements IS 'Fixed foreign key relationship to users table';
