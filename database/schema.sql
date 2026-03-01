-- ============================================
-- DistributionFlow Database Schema
-- Multi-Tenant FMCG Distribution System
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLES
-- ============================================

-- Businesses (Tenants)
CREATE TABLE IF NOT EXISTS businesses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  address TEXT,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_businesses_owner_id ON businesses(owner_id);

-- Users (Staff members within each business)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  auth_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'manager', 'sales_rep', 'warehouse')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(business_id, email)
);

CREATE INDEX idx_users_business_id ON users(business_id);
CREATE INDEX idx_users_auth_user_id ON users(auth_user_id);
CREATE INDEX idx_users_role ON users(role);

-- Retailers (Customers/Shops)
CREATE TABLE IF NOT EXISTS retailers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  shop_name VARCHAR(255) NOT NULL,
  owner_name VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  assigned_rep_id UUID REFERENCES users(id) ON DELETE SET NULL,
  credit_limit DECIMAL(15, 2) DEFAULT 0,
  current_balance DECIMAL(15, 2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'blocked')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_retailers_business_id ON retailers(business_id);
CREATE INDEX idx_retailers_assigned_rep_id ON retailers(assigned_rep_id);
CREATE INDEX idx_retailers_status ON retailers(status);

-- Products
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  sku VARCHAR(100),
  cost_price DECIMAL(15, 2) DEFAULT 0,
  selling_price DECIMAL(15, 2) NOT NULL,
  stock_quantity INTEGER DEFAULT 0,
  low_stock_threshold INTEGER DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(business_id, sku)
);

CREATE INDEX idx_products_business_id ON products(business_id);
CREATE INDEX idx_products_sku ON products(sku);

-- Stock Movements
CREATE TABLE IF NOT EXISTS stock_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('IN', 'OUT', 'ADJUSTMENT')),
  quantity INTEGER NOT NULL,
  reference VARCHAR(255),
  notes TEXT,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_stock_movements_business_id ON stock_movements(business_id);
CREATE INDEX idx_stock_movements_product_id ON stock_movements(product_id);
CREATE INDEX idx_stock_movements_type ON stock_movements(type);
CREATE INDEX idx_stock_movements_created_at ON stock_movements(created_at DESC);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  retailer_id UUID NOT NULL REFERENCES retailers(id) ON DELETE CASCADE,
  sales_rep_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  total_amount DECIMAL(15, 2) NOT NULL,
  payment_status VARCHAR(20) DEFAULT 'credit' CHECK (payment_status IN ('paid', 'credit', 'partial')),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'delivered', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_orders_business_id ON orders(business_id);
CREATE INDEX idx_orders_retailer_id ON orders(retailer_id);
CREATE INDEX idx_orders_sales_rep_id ON orders(sales_rep_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);

-- Order Items
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(15, 2) NOT NULL,
  total_price DECIMAL(15, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);

-- Payments
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  retailer_id UUID NOT NULL REFERENCES retailers(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  amount_paid DECIMAL(15, 2) NOT NULL,
  payment_method VARCHAR(50) DEFAULT 'cash',
  notes TEXT,
  recorded_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_payments_business_id ON payments(business_id);
CREATE INDEX idx_payments_retailer_id ON payments(retailer_id);
CREATE INDEX idx_payments_order_id ON payments(order_id);
CREATE INDEX idx_payments_created_at ON payments(created_at DESC);

-- Audit Log (for tracking important actions)
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_business_id ON audit_logs(business_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE retailers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- BUSINESSES POLICIES
-- ============================================

-- Users can see their own businesses
CREATE POLICY "Users can view their own businesses" ON businesses
  FOR SELECT
  USING (owner_id = auth.uid() OR id IN (
    SELECT business_id FROM users WHERE auth_user_id = auth.uid()
  ));

-- Users can create businesses (on signup)
CREATE POLICY "Users can create businesses" ON businesses
  FOR INSERT
  WITH CHECK (owner_id = auth.uid());

-- Only owners can update their businesses
CREATE POLICY "Owners can update their businesses" ON businesses
  FOR UPDATE
  USING (owner_id = auth.uid());

-- ============================================
-- USERS POLICIES
-- ============================================

-- Users can view other users in their business
CREATE POLICY "Users can view users in their business" ON users
  FOR SELECT
  USING (business_id IN (
    SELECT business_id FROM users WHERE auth_user_id = auth.uid()
  ));

-- Admin can insert users in their business
CREATE POLICY "Admin can create users" ON users
  FOR INSERT
  WITH CHECK (
    business_id IN (
      SELECT business_id FROM users 
      WHERE auth_user_id = auth.uid() AND role = 'admin'
    )
  );

-- Admin can update users in their business
CREATE POLICY "Admin can update users" ON users
  FOR UPDATE
  USING (
    business_id IN (
      SELECT business_id FROM users 
      WHERE auth_user_id = auth.uid() AND role = 'admin'
    )
  );

-- Admin can delete users in their business
CREATE POLICY "Admin can delete users" ON users
  FOR DELETE
  USING (
    business_id IN (
      SELECT business_id FROM users 
      WHERE auth_user_id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- RETAILERS POLICIES
-- ============================================

-- Users can view retailers in their business
CREATE POLICY "Users can view retailers in their business" ON retailers
  FOR SELECT
  USING (business_id IN (
    SELECT business_id FROM users WHERE auth_user_id = auth.uid()
  ));

-- Admin/Manager/Sales_rep can create retailers
CREATE POLICY "Staff can create retailers" ON retailers
  FOR INSERT
  WITH CHECK (
    business_id IN (
      SELECT business_id FROM users 
      WHERE auth_user_id = auth.uid() AND role IN ('admin', 'manager', 'sales_rep')
    )
  );

-- Admin/Manager can update retailers
CREATE POLICY "Admin/Manager can update retailers" ON retailers
  FOR UPDATE
  USING (
    business_id IN (
      SELECT business_id FROM users 
      WHERE auth_user_id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- Admin can delete retailers
CREATE POLICY "Admin can delete retailers" ON retailers
  FOR DELETE
  USING (
    business_id IN (
      SELECT business_id FROM users 
      WHERE auth_user_id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- PRODUCTS POLICIES
-- ============================================

-- Users can view products in their business
CREATE POLICY "Users can view products in their business" ON products
  FOR SELECT
  USING (business_id IN (
    SELECT business_id FROM users WHERE auth_user_id = auth.uid()
  ));

-- Admin/Manager can create products
CREATE POLICY "Admin/Manager can create products" ON products
  FOR INSERT
  WITH CHECK (
    business_id IN (
      SELECT business_id FROM users 
      WHERE auth_user_id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- Admin/Manager can update products
CREATE POLICY "Admin/Manager can update products" ON products
  FOR UPDATE
  USING (
    business_id IN (
      SELECT business_id FROM users 
      WHERE auth_user_id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- Admin can delete products
CREATE POLICY "Admin can delete products" ON products
  FOR DELETE
  USING (
    business_id IN (
      SELECT business_id FROM users 
      WHERE auth_user_id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- STOCK MOVEMENTS POLICIES
-- ============================================

-- Users can view stock movements in their business
CREATE POLICY "Users can view stock movements in their business" ON stock_movements
  FOR SELECT
  USING (business_id IN (
    SELECT business_id FROM users WHERE auth_user_id = auth.uid()
  ));

-- Warehouse/Manager can create stock movements
CREATE POLICY "Warehouse/Manager can create stock movements" ON stock_movements
  FOR INSERT
  WITH CHECK (
    business_id IN (
      SELECT business_id FROM users 
      WHERE auth_user_id = auth.uid() AND role IN ('admin', 'manager', 'warehouse')
    )
  );

-- ============================================
-- ORDERS POLICIES
-- ============================================

-- Users can view orders in their business
CREATE POLICY "Users can view orders in their business" ON orders
  FOR SELECT
  USING (business_id IN (
    SELECT business_id FROM users WHERE auth_user_id = auth.uid()
  ));

-- Sales rep can create orders
CREATE POLICY "Sales rep can create orders" ON orders
  FOR INSERT
  WITH CHECK (
    business_id IN (
      SELECT business_id FROM users 
      WHERE auth_user_id = auth.uid() AND role IN ('admin', 'manager', 'sales_rep')
    )
  );

-- Admin/Manager can update orders
CREATE POLICY "Admin/Manager can update orders" ON orders
  FOR UPDATE
  USING (
    business_id IN (
      SELECT business_id FROM users 
      WHERE auth_user_id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- ============================================
-- ORDER ITEMS POLICIES
-- ============================================

-- Users can view order items if they can see the order
CREATE POLICY "Users can view order items in their business" ON order_items
  FOR SELECT
  USING (order_id IN (
    SELECT id FROM orders WHERE business_id IN (
      SELECT business_id FROM users WHERE auth_user_id = auth.uid()
    )
  ));

-- Sales rep can create order items
CREATE POLICY "Sales rep can create order items" ON order_items
  FOR INSERT
  WITH CHECK (
    order_id IN (
      SELECT id FROM orders WHERE business_id IN (
        SELECT business_id FROM users 
        WHERE auth_user_id = auth.uid() AND role IN ('admin', 'manager', 'sales_rep')
      )
    )
  );

-- ============================================
-- PAYMENTS POLICIES
-- ============================================

-- Users can view payments in their business
CREATE POLICY "Users can view payments in their business" ON payments
  FOR SELECT
  USING (business_id IN (
    SELECT business_id FROM users WHERE auth_user_id = auth.uid()
  ));

-- Sales rep/Manager can create payments
CREATE POLICY "Staff can create payments" ON payments
  FOR INSERT
  WITH CHECK (
    business_id IN (
      SELECT business_id FROM users 
      WHERE auth_user_id = auth.uid() AND role IN ('admin', 'manager', 'sales_rep')
    )
  );

-- ============================================
-- AUDIT LOGS POLICIES
-- ============================================

-- Users can view audit logs in their business
CREATE POLICY "Users can view audit logs in their business" ON audit_logs
  FOR SELECT
  USING (business_id IN (
    SELECT business_id FROM users WHERE auth_user_id = auth.uid()
  ));

-- All authenticated users can insert audit logs
CREATE POLICY "Users can create audit logs" ON audit_logs
  FOR INSERT
  WITH CHECK (
    business_id IN (
      SELECT business_id FROM users WHERE auth_user_id = auth.uid()
    )
  );

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_businesses_updated_at BEFORE UPDATE ON businesses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_retailers_updated_at BEFORE UPDATE ON retailers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to auto-block retailer if balance exceeds credit limit
CREATE OR REPLACE FUNCTION check_retailer_credit_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.current_balance > NEW.credit_limit THEN
    NEW.status = 'blocked';
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER check_credit_limit_trigger BEFORE UPDATE OF current_balance ON retailers
  FOR EACH ROW EXECUTE FUNCTION check_retailer_credit_limit();
