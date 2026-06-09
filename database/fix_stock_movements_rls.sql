-- Fix stock_movements RLS policies
-- The error occurs because an RLS policy references user_id which doesn't exist

-- First, check what RLS policies exist
-- SELECT * FROM pg_policies WHERE tablename = 'stock_movements';

-- Disable RLS temporarily to see if that's the issue
-- ALTER TABLE stock_movements DISABLE ROW LEVEL SECURITY;

-- OR better approach: Fix/recreate RLS policies correctly
-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view stock_movements for their business" ON stock_movements;
DROP POLICY IF EXISTS "Users can insert stock_movements for their business" ON stock_movements;
DROP POLICY IF EXISTS "Users can view their business stock movements" ON stock_movements;
DROP POLICY IF EXISTS "Users can manage their business stock movements" ON stock_movements;
DROP POLICY IF EXISTS "stock_movements_select_policy" ON stock_movements;
DROP POLICY IF EXISTS "stock_movements_insert_policy" ON stock_movements;

-- Enable RLS
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;

-- Create proper RLS policies that don't reference user_id
-- Allow users to view stock movements for their business
CREATE POLICY "Allow users to view stock movements for their business"
ON stock_movements
FOR SELECT
USING (
  business_id IN (
    SELECT business_id FROM users WHERE auth_user_id = auth.uid()
  )
);

-- Allow admin/manager/warehouse to insert stock movements
CREATE POLICY "Allow authorized users to insert stock movements"
ON stock_movements
FOR INSERT
WITH CHECK (
  business_id IN (
    SELECT business_id FROM users 
    WHERE auth_user_id = auth.uid() 
    AND role IN ('admin', 'manager', 'warehouse')
  )
);

-- Allow admin/manager/warehouse to update stock movements
CREATE POLICY "Allow authorized users to update stock movements"
ON stock_movements
FOR UPDATE
USING (
  business_id IN (
    SELECT business_id FROM users 
    WHERE auth_user_id = auth.uid() 
    AND role IN ('admin', 'manager', 'warehouse')
  )
);

-- Allow admin to delete stock movements
CREATE POLICY "Allow admin to delete stock movements"
ON stock_movements
FOR DELETE
USING (
  business_id IN (
    SELECT business_id FROM users 
    WHERE auth_user_id = auth.uid() 
    AND role = 'admin'
  )
);
