-- COMPLETE FIX: All RLS Policies Without Recursion
-- Run this entire file in Supabase SQL Editor

-- ============================================
-- DROP ALL EXISTING POLICIES
-- ============================================

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

-- ============================================
-- CREATE SIMPLE NON-RECURSIVE POLICIES
-- ============================================

-- Get business_id from businesses table directly using auth.uid()
-- This avoids querying users table

-- RETAILERS POLICIES
CREATE POLICY "Users can view retailers in their business" ON retailers
  FOR SELECT
  USING (business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid()));

CREATE POLICY "Staff can create retailers" ON retailers
  FOR INSERT
  WITH CHECK (business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid()));

CREATE POLICY "Admin/Manager can update retailers" ON retailers
  FOR UPDATE
  USING (business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid()));

CREATE POLICY "Admin can delete retailers" ON retailers
  FOR DELETE
  USING (business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid()));

-- PRODUCTS POLICIES
CREATE POLICY "Users can view products in their business" ON products
  FOR SELECT
  USING (business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid()));

CREATE POLICY "Admin/Manager can create products" ON products
  FOR INSERT
  WITH CHECK (business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid()));

CREATE POLICY "Admin/Manager can update products" ON products
  FOR UPDATE
  USING (business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid()));

CREATE POLICY "Admin can delete products" ON products
  FOR DELETE
  USING (business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid()));

-- STOCK MOVEMENTS POLICIES
CREATE POLICY "Users can view stock movements in their business" ON stock_movements
  FOR SELECT
  USING (business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid()));

CREATE POLICY "Warehouse/Manager can create stock movements" ON stock_movements
  FOR INSERT
  WITH CHECK (business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid()));

-- ORDERS POLICIES
CREATE POLICY "Users can view orders in their business" ON orders
  FOR SELECT
  USING (business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid()));

CREATE POLICY "Sales rep can create orders" ON orders
  FOR INSERT
  WITH CHECK (business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid()));

CREATE POLICY "Admin/Manager can update orders" ON orders
  FOR UPDATE
  USING (business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid()));

-- ORDER ITEMS POLICIES
CREATE POLICY "Users can view order items in their business" ON order_items
  FOR SELECT
  USING (order_id IN (
    SELECT id FROM orders WHERE business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
  ));

CREATE POLICY "Sales rep can create order items" ON order_items
  FOR INSERT
  WITH CHECK (order_id IN (
    SELECT id FROM orders WHERE business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
  ));

-- PAYMENTS POLICIES
CREATE POLICY "Users can view payments in their business" ON payments
  FOR SELECT
  USING (business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid()));

CREATE POLICY "Staff can create payments" ON payments
  FOR INSERT
  WITH CHECK (business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid()));

-- AUDIT LOGS POLICIES
CREATE POLICY "Users can view audit logs in their business" ON audit_logs
  FOR SELECT
  USING (business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid()));

CREATE POLICY "Users can create audit logs" ON audit_logs
  FOR INSERT
  WITH CHECK (business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid()));
