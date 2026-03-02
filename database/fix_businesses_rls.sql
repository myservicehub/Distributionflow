-- Check and fix businesses table RLS policies

-- First, check if businesses table exists and its structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'businesses'
ORDER BY ordinal_position;

-- Check existing RLS policies on businesses table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'businesses';

-- Enable RLS if not enabled
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view their own business" ON businesses;
DROP POLICY IF EXISTS "Users can view own business" ON businesses;
DROP POLICY IF EXISTS "Allow business read access" ON businesses;

-- Create policy allowing users to read their own business
CREATE POLICY "Users can view their own business"
ON businesses
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT business_id 
    FROM users 
    WHERE auth_user_id = auth.uid()
  )
);

-- Verify the policy was created
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'businesses';

SELECT 'Businesses table RLS policies updated successfully!' as status;
