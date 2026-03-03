-- Fix orders table RLS to allow warehouse users to read orders

-- Check existing policies
SELECT policyname, cmd, qual
FROM pg_policies 
WHERE tablename = 'orders';

-- Drop and recreate SELECT policy to include warehouse role
DROP POLICY IF EXISTS "Users can view orders in their business" ON orders;
DROP POLICY IF EXISTS "Allow order read access" ON orders;

-- Create comprehensive SELECT policy
CREATE POLICY "Users can view orders in their business"
ON orders
FOR SELECT
TO authenticated
USING (
  business_id IN (
    SELECT business_id 
    FROM users 
    WHERE auth_user_id = auth.uid()
  )
);

-- Also ensure UPDATE policy allows warehouse to update status
DROP POLICY IF EXISTS "Users can update orders in their business" ON orders;

CREATE POLICY "Users can update orders in their business"
ON orders
FOR UPDATE
TO authenticated
USING (
  business_id IN (
    SELECT business_id 
    FROM users 
    WHERE auth_user_id = auth.uid()
  )
)
WITH CHECK (
  business_id IN (
    SELECT business_id 
    FROM users 
    WHERE auth_user_id = auth.uid()
  )
);

-- Verify
SELECT tablename, policyname, cmd
FROM pg_policies 
WHERE tablename = 'orders'
ORDER BY cmd, policyname;

SELECT 'Orders RLS policies updated for warehouse access!' as status;
