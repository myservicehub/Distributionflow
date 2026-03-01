-- ============================================
-- FIX INSERT/UPDATE/DELETE RLS POLICIES FOR ALL USER ROLES
-- ============================================
-- This script updates INSERT, UPDATE, and DELETE policies to allow
-- non-owner users to modify data based on their role.
-- 
-- ROLE-SPECIFIC RULES:
-- - admin, manager: Can INSERT, UPDATE, DELETE most data
-- - sales_rep: Can create orders, add order items
-- - warehouse: Can create stock movements
-- ============================================

-- STEP 1: Drop existing restrictive INSERT/UPDATE/DELETE policies
-- ============================================

-- Retailers
DROP POLICY IF EXISTS "create_retailers" ON retailers;
DROP POLICY IF EXISTS "update_retailers" ON retailers;
DROP POLICY IF EXISTS "delete_retailers" ON retailers;

-- Products  
DROP POLICY IF EXISTS "create_products" ON products;
DROP POLICY IF EXISTS "update_products" ON products;
DROP POLICY IF EXISTS "delete_products" ON products;

-- Stock Movements
DROP POLICY IF EXISTS "create_stock_movements" ON stock_movements;

-- Orders
DROP POLICY IF EXISTS "create_orders" ON orders;
DROP POLICY IF EXISTS "update_orders" ON orders;

-- Order Items
DROP POLICY IF EXISTS "create_order_items" ON order_items;

-- Payments
DROP POLICY IF EXISTS "create_payments" ON payments;

-- Audit Logs
DROP POLICY IF EXISTS "create_audit_logs" ON audit_logs;

-- STEP 2: Create new INSERT/UPDATE/DELETE policies with role-based access
-- ============================================

-- ============================================
-- RETAILERS: Admin and Manager can manage
-- ============================================
CREATE POLICY "staff_can_create_retailers" ON retailers
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.auth_user_id = auth.uid() 
      AND users.business_id = retailers.business_id
      AND users.status = 'active'
      AND users.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "staff_can_update_retailers" ON retailers
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.auth_user_id = auth.uid() 
      AND users.business_id = retailers.business_id
      AND users.status = 'active'
      AND users.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "admin_can_delete_retailers" ON retailers
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.auth_user_id = auth.uid() 
      AND users.business_id = retailers.business_id
      AND users.status = 'active'
      AND users.role = 'admin'
    )
  );

-- ============================================
-- PRODUCTS: Admin and Manager can manage
-- ============================================
CREATE POLICY "staff_can_create_products" ON products
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.auth_user_id = auth.uid() 
      AND users.business_id = products.business_id
      AND users.status = 'active'
      AND users.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "staff_can_update_products" ON products
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.auth_user_id = auth.uid() 
      AND users.business_id = products.business_id
      AND users.status = 'active'
      AND users.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "admin_can_delete_products" ON products
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.auth_user_id = auth.uid() 
      AND users.business_id = products.business_id
      AND users.status = 'active'
      AND users.role = 'admin'
    )
  );

-- ============================================
-- STOCK MOVEMENTS: Warehouse, Manager, Admin can create
-- ============================================
CREATE POLICY "staff_can_create_stock_movements" ON stock_movements
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.auth_user_id = auth.uid() 
      AND users.business_id = stock_movements.business_id
      AND users.status = 'active'
      AND users.role IN ('admin', 'manager', 'warehouse')
    )
  );

-- ============================================
-- ORDERS: Sales reps can create, Managers can update
-- ============================================
CREATE POLICY "staff_can_create_orders" ON orders
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.auth_user_id = auth.uid() 
      AND users.business_id = orders.business_id
      AND users.status = 'active'
      AND users.role IN ('admin', 'manager', 'sales_rep')
    )
  );

CREATE POLICY "staff_can_update_orders" ON orders
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.auth_user_id = auth.uid() 
      AND users.business_id = orders.business_id
      AND users.status = 'active'
      AND users.role IN ('admin', 'manager')
    )
  );

-- ============================================
-- ORDER ITEMS: Sales reps can create
-- ============================================
CREATE POLICY "staff_can_create_order_items" ON order_items
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders o
      INNER JOIN users u ON u.business_id = o.business_id
      WHERE o.id = order_items.order_id
      AND u.auth_user_id = auth.uid()
      AND u.status = 'active'
      AND u.role IN ('admin', 'manager', 'sales_rep')
    )
  );

-- ============================================
-- PAYMENTS: All staff can record payments
-- ============================================
CREATE POLICY "staff_can_create_payments" ON payments
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.auth_user_id = auth.uid() 
      AND users.business_id = payments.business_id
      AND users.status = 'active'
    )
  );

-- ============================================
-- AUDIT LOGS: All staff can create audit logs
-- ============================================
CREATE POLICY "staff_can_create_audit_logs" ON audit_logs
  FOR INSERT
  WITH CHECK (
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
-- Run this after applying to verify all policies:

-- SELECT tablename, policyname, cmd 
-- FROM pg_policies 
-- WHERE schemaname = 'public' 
-- AND tablename IN ('retailers', 'products', 'orders', 'order_items', 'payments', 'stock_movements', 'audit_logs')
-- ORDER BY tablename, cmd, policyname;
