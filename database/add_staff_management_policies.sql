-- ============================================
-- ADD STAFF MANAGEMENT RLS POLICIES
-- ============================================
-- This script adds policies to allow admins to manage staff
-- Carefully designed to avoid circular dependencies

-- ============================================
-- USERS TABLE - ADD ADMIN POLICIES
-- ============================================

-- Policy: Allow admins to view all users in their business
CREATE POLICY "admin_view_all_users" ON users
  FOR SELECT
  USING (
    -- Allow if viewing self (existing policy covers this)
    auth_user_id = auth.uid()
    OR
    -- Allow if user is admin in the same business
    business_id IN (
      SELECT b.id 
      FROM businesses b
      INNER JOIN users u ON u.business_id = b.id
      WHERE b.owner_id = auth.uid()
      AND u.auth_user_id = auth.uid()
      AND u.role = 'admin'
    )
  );

-- Policy: Allow admins to create users in their business
CREATE POLICY "admin_create_users" ON users
  FOR INSERT
  WITH CHECK (
    -- Allow creating self (existing policy covers this)
    auth_user_id = auth.uid()
    OR
    -- Allow if current user is admin in the target business
    business_id IN (
      SELECT b.id 
      FROM businesses b
      INNER JOIN users u ON u.business_id = b.id
      WHERE b.owner_id = auth.uid()
      AND u.auth_user_id = auth.uid()
      AND u.role = 'admin'
    )
  );

-- Policy: Allow admins to update users in their business
CREATE POLICY "admin_update_users" ON users
  FOR UPDATE
  USING (
    -- Allow updating self (existing policy covers this)
    auth_user_id = auth.uid()
    OR
    -- Allow if current user is admin in the same business
    business_id IN (
      SELECT b.id 
      FROM businesses b
      INNER JOIN users u ON u.business_id = b.id
      WHERE b.owner_id = auth.uid()
      AND u.auth_user_id = auth.uid()
      AND u.role = 'admin'
    )
  );

-- Policy: Allow admins to delete (deactivate) users in their business
CREATE POLICY "admin_delete_users" ON users
  FOR DELETE
  USING (
    -- Admins can delete users in their business
    business_id IN (
      SELECT b.id 
      FROM businesses b
      INNER JOIN users u ON u.business_id = b.id
      WHERE b.owner_id = auth.uid()
      AND u.auth_user_id = auth.uid()
      AND u.role = 'admin'
    )
  );

-- ============================================
-- VERIFICATION QUERIES (Run these to test)
-- ============================================

-- 1. Check all policies on users table
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
-- FROM pg_policies 
-- WHERE tablename = 'users';

-- 2. Test as admin user (replace with actual auth.uid())
-- SELECT * FROM users WHERE business_id = 'your-business-id';
