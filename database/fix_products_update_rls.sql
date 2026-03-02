-- Check and fix products table RLS policies for UPDATE

-- Check existing UPDATE policies on products table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'products' AND cmd = 'UPDATE';

-- Drop existing UPDATE policies if restrictive
DROP POLICY IF EXISTS "Users can update products in their business" ON products;
DROP POLICY IF EXISTS "Allow product updates" ON products;
DROP POLICY IF EXISTS "Users can update own business products" ON products;

-- Create comprehensive UPDATE policy
CREATE POLICY "Users can update products in their business"
ON products
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

-- Verify the policy was created
SELECT policyname, cmd, qual
FROM pg_policies 
WHERE tablename = 'products' AND cmd = 'UPDATE';

SELECT 'Products UPDATE policy fixed!' as status;
