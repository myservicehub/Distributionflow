-- ============================================
-- FIX RLS POLICIES FOR ALL USER ROLES
-- ============================================
-- This script adds proper SELECT policies so that all authenticated users
-- in a business can access data, not just the owner.
-- 
-- ROLE-SPECIFIC RULES:
-- - admin, manager, warehouse: Can see ALL data in their business
-- - sales_rep: Can see all data EXCEPT orders (only their own orders)
-- ============================================

-- STEP 1: Drop existing restrictive policies that only allow owner access
-- ============================================

-- Retailers
DROP POLICY IF EXISTS "view_retailers" ON retailers;

-- Products  
DROP POLICY IF EXISTS "view_products" ON products;

-- Stock Movements
DROP POLICY IF EXISTS "view_stock_movements" ON stock_movements;

-- Orders
DROP POLICY IF EXISTS "view_orders" ON orders;

-- Order Items
DROP POLICY IF EXISTS "view_order_items" ON order_items;

-- Payments
DROP POLICY IF EXISTS "view_payments" ON payments;

-- Audit Logs
DROP POLICY IF EXISTS "view_audit_logs" ON audit_logs;

-- STEP 2: Create new SELECT policies for all authenticated users in the same business
-- ============================================

-- ============================================
-- RETAILERS: All users in business can view
-- ============================================
CREATE POLICY "authenticated_users_view_retailers" ON retailers
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.auth_user_id = auth.uid() 
      AND users.business_id = retailers.business_id
      AND users.status = 'active'
    )
  );

-- ============================================
-- PRODUCTS: All users in business can view
-- ============================================
CREATE POLICY "authenticated_users_view_products" ON products
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.auth_user_id = auth.uid() 
      AND users.business_id = products.business_id
      AND users.status = 'active'
    )
  );

-- ============================================
-- STOCK MOVEMENTS: All users in business can view
-- ============================================
CREATE POLICY "authenticated_users_view_stock_movements" ON stock_movements
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.auth_user_id = auth.uid() 
      AND users.business_id = stock_movements.business_id
      AND users.status = 'active'
    )
  );

-- ============================================
-- ORDERS: Role-specific access
-- - admin, manager, warehouse: See all orders in their business
-- - sales_rep: Only see their own orders (where assigned_to = their user_id)
-- ============================================
CREATE POLICY "authenticated_users_view_orders" ON orders
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.auth_user_id = auth.uid() 
      AND users.business_id = orders.business_id
      AND users.status = 'active'
      AND (
        -- Admin, manager, warehouse can see all orders
        users.role IN ('admin', 'manager', 'warehouse')
        OR 
        -- Sales rep can only see their own orders
        (users.role = 'sales_rep' AND orders.assigned_to = users.id)
      )
    )
  );

-- ============================================
-- ORDER ITEMS: Match parent order access
-- - If user can see the order, they can see the order items
-- ============================================
CREATE POLICY "authenticated_users_view_order_items" ON order_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders o
      INNER JOIN users u ON u.business_id = o.business_id
      WHERE o.id = order_items.order_id
      AND u.auth_user_id = auth.uid()
      AND u.status = 'active'
      AND (
        -- Admin, manager, warehouse can see all order items
        u.role IN ('admin', 'manager', 'warehouse')
        OR 
        -- Sales rep can only see order items for their own orders
        (u.role = 'sales_rep' AND o.assigned_to = u.id)
      )
    )
  );

-- ============================================
-- PAYMENTS: All users in business can view
-- ============================================
CREATE POLICY "authenticated_users_view_payments" ON payments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.auth_user_id = auth.uid() 
      AND users.business_id = payments.business_id
      AND users.status = 'active'
    )
  );

-- ============================================
-- AUDIT LOGS: All users in business can view
-- ============================================
CREATE POLICY "authenticated_users_view_audit_logs" ON audit_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.auth_user_id = auth.uid() 
      AND users.business_id = audit_logs.business_id
      AND users.status = 'active'
    )
  );

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Run these after applying the script to verify policies are in place:

-- SELECT tablename, policyname, permissive, roles, cmd, qual 
-- FROM pg_policies 
-- WHERE schemaname = 'public' 
-- AND tablename IN ('retailers', 'products', 'orders', 'order_items', 'payments', 'stock_movements', 'audit_logs')
-- ORDER BY tablename, policyname;
