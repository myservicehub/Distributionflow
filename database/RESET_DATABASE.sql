-- ============================================
-- COMPLETE DATABASE RESET SCRIPT
-- This will clean everything and set up working RLS policies
-- ============================================

-- STEP 1: Delete all existing data
-- ============================================
TRUNCATE TABLE audit_logs CASCADE;
TRUNCATE TABLE payments CASCADE;
TRUNCATE TABLE order_items CASCADE;
TRUNCATE TABLE orders CASCADE;
TRUNCATE TABLE stock_movements CASCADE;
TRUNCATE TABLE products CASCADE;
TRUNCATE TABLE retailers CASCADE;
TRUNCATE TABLE users CASCADE;
TRUNCATE TABLE businesses CASCADE;

-- STEP 2: Drop ALL existing RLS policies
-- ============================================

-- Businesses
DROP POLICY IF EXISTS "Users can view their own businesses" ON businesses;
DROP POLICY IF EXISTS "Users can create businesses" ON businesses;
DROP POLICY IF EXISTS "Owners can update their businesses" ON businesses;

-- Users
DROP POLICY IF EXISTS "Users can view users in their business" ON users;
DROP POLICY IF EXISTS "Admin can create users" ON users;
DROP POLICY IF EXISTS "Users can insert themselves on signup" ON users;
DROP POLICY IF EXISTS "Admin can update users" ON users;
DROP POLICY IF EXISTS "Admin can delete users" ON users;

-- Retailers
DROP POLICY IF EXISTS "Users can view retailers in their business" ON retailers;
DROP POLICY IF EXISTS "Staff can create retailers" ON retailers;
DROP POLICY IF EXISTS "Admin/Manager can update retailers" ON retailers;
DROP POLICY IF EXISTS "Admin can delete retailers" ON retailers;

-- Products
DROP POLICY IF EXISTS "Users can view products in their business" ON products;
DROP POLICY IF EXISTS "Admin/Manager can create products" ON products;
DROP POLICY IF EXISTS "Admin/Manager can update products" ON products;
DROP POLICY IF EXISTS "Admin can delete products" ON products;

-- Stock Movements
DROP POLICY IF EXISTS "Users can view stock movements in their business" ON stock_movements;
DROP POLICY IF EXISTS "Warehouse/Manager can create stock movements" ON stock_movements;

-- Orders
DROP POLICY IF EXISTS "Users can view orders in their business" ON orders;
DROP POLICY IF EXISTS "Sales rep can create orders" ON orders;
DROP POLICY IF EXISTS "Admin/Manager can update orders" ON orders;

-- Order Items
DROP POLICY IF EXISTS "Users can view order items in their business" ON order_items;
DROP POLICY IF EXISTS "Sales rep can create order items" ON order_items;

-- Payments
DROP POLICY IF EXISTS "Users can view payments in their business" ON payments;
DROP POLICY IF EXISTS "Staff can create payments" ON payments;

-- Audit Logs
DROP POLICY IF EXISTS "Users can view audit logs in their business" ON audit_logs;
DROP POLICY IF EXISTS "Users can create audit logs" ON audit_logs;

-- STEP 3: Create SIMPLE, NON-RECURSIVE RLS Policies
-- ============================================
-- These policies use direct auth.uid() checks only
-- No circular references between tables

-- ============================================
-- BUSINESSES POLICIES
-- ============================================

CREATE POLICY "view_own_business" ON businesses
  FOR SELECT
  USING (owner_id = auth.uid());

CREATE POLICY "create_business" ON businesses
  FOR INSERT
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "update_own_business" ON businesses
  FOR UPDATE
  USING (owner_id = auth.uid());

CREATE POLICY "delete_own_business" ON businesses
  FOR DELETE
  USING (owner_id = auth.uid());

-- ============================================
-- USERS POLICIES
-- ============================================

CREATE POLICY "view_self" ON users
  FOR SELECT
  USING (auth_user_id = auth.uid());

CREATE POLICY "create_self" ON users
  FOR INSERT
  WITH CHECK (auth_user_id = auth.uid());

CREATE POLICY "update_own_profile" ON users
  FOR UPDATE
  USING (auth_user_id = auth.uid());

CREATE POLICY "delete_own_profile" ON users
  FOR DELETE
  USING (auth_user_id = auth.uid());

-- ============================================
-- RETAILERS POLICIES
-- ============================================

CREATE POLICY "view_retailers" ON retailers
  FOR SELECT
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "create_retailers" ON retailers
  FOR INSERT
  WITH CHECK (
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "update_retailers" ON retailers
  FOR UPDATE
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "delete_retailers" ON retailers
  FOR DELETE
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
  );

-- ============================================
-- PRODUCTS POLICIES
-- ============================================

CREATE POLICY "view_products" ON products
  FOR SELECT
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "create_products" ON products
  FOR INSERT
  WITH CHECK (
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "update_products" ON products
  FOR UPDATE
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "delete_products" ON products
  FOR DELETE
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
  );

-- ============================================
-- STOCK MOVEMENTS POLICIES
-- ============================================

CREATE POLICY "view_stock_movements" ON stock_movements
  FOR SELECT
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "create_stock_movements" ON stock_movements
  FOR INSERT
  WITH CHECK (
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
  );

-- ============================================
-- ORDERS POLICIES
-- ============================================

CREATE POLICY "view_orders" ON orders
  FOR SELECT
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "create_orders" ON orders
  FOR INSERT
  WITH CHECK (
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "update_orders" ON orders
  FOR UPDATE
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
  );

-- ============================================
-- ORDER ITEMS POLICIES
-- ============================================

CREATE POLICY "view_order_items" ON order_items
  FOR SELECT
  USING (
    order_id IN (
      SELECT o.id FROM orders o
      INNER JOIN businesses b ON o.business_id = b.id
      WHERE b.owner_id = auth.uid()
    )
  );

CREATE POLICY "create_order_items" ON order_items
  FOR INSERT
  WITH CHECK (
    order_id IN (
      SELECT o.id FROM orders o
      INNER JOIN businesses b ON o.business_id = b.id
      WHERE b.owner_id = auth.uid()
    )
  );

-- ============================================
-- PAYMENTS POLICIES
-- ============================================

CREATE POLICY "view_payments" ON payments
  FOR SELECT
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "create_payments" ON payments
  FOR INSERT
  WITH CHECK (
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
  );

-- ============================================
-- AUDIT LOGS POLICIES
-- ============================================

CREATE POLICY "view_audit_logs" ON audit_logs
  FOR SELECT
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "create_audit_logs" ON audit_logs
  FOR INSERT
  WITH CHECK (
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
  );
