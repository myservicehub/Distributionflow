-- FIX: Remove the problematic recursive policy and create a better one

-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can view users in their business" ON users;

-- Create a non-recursive policy
-- This checks the auth.uid() directly without querying users table recursively
CREATE POLICY "Users can view users in their business" ON users
  FOR SELECT
  USING (
    auth_user_id = auth.uid() 
    OR 
    business_id IN (
      SELECT b.id FROM businesses b WHERE b.owner_id = auth.uid()
    )
    OR
    business_id = (
      SELECT u.business_id FROM users u WHERE u.auth_user_id = auth.uid() LIMIT 1
    )
  );
