-- COMPLETE FIX: Remove ALL recursive policies and create non-recursive ones

-- ============================================
-- DROP ALL EXISTING POLICIES
-- ============================================

-- Businesses policies
DROP POLICY IF EXISTS "Users can view their own businesses" ON businesses;
DROP POLICY IF EXISTS "Users can create businesses" ON businesses;
DROP POLICY IF EXISTS "Owners can update their businesses" ON businesses;

-- Users policies
DROP POLICY IF EXISTS "Users can view users in their business" ON users;
DROP POLICY IF EXISTS "Admin can create users" ON users;
DROP POLICY IF EXISTS "Admin can update users" ON users;
DROP POLICY IF EXISTS "Admin can delete users" ON users;

-- ============================================
-- CREATE NON-RECURSIVE POLICIES
-- ============================================

-- BUSINESSES POLICIES (No recursion - direct auth.uid() check)
CREATE POLICY "Users can view their own businesses" ON businesses
  FOR SELECT
  USING (owner_id = auth.uid());

CREATE POLICY "Users can create businesses" ON businesses
  FOR INSERT
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners can update their businesses" ON businesses
  FOR UPDATE
  USING (owner_id = auth.uid());

-- USERS POLICIES (No recursion - direct checks only)
CREATE POLICY "Users can view users in their business" ON users
  FOR SELECT
  USING (
    auth_user_id = auth.uid()
  );

CREATE POLICY "Users can insert themselves on signup" ON users
  FOR INSERT
  WITH CHECK (
    auth_user_id = auth.uid()
  );

CREATE POLICY "Admin can update users" ON users
  FOR UPDATE
  USING (
    business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  );

CREATE POLICY "Admin can delete users" ON users
  FOR DELETE
  USING (
    business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  );
