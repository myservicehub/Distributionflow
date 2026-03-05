-- ============================================
-- EMPTY BOTTLE LIFECYCLE MANAGEMENT SYSTEM
-- Complete Database Schema Migration
-- ============================================

-- 1. CREATE ENUM: empty_movement_type
CREATE TYPE empty_movement_type AS ENUM (
  'manufacturer_in',
  'issued_to_retailer',
  'returned_from_retailer',
  'returned_to_manufacturer',
  'adjustment',
  'damaged',
  'lost'
);

-- 2. CREATE TABLE: empty_items
CREATE TABLE IF NOT EXISTS empty_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(business_id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  deposit_value NUMERIC(10, 2) NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for empty_items
CREATE INDEX idx_empty_items_business_id ON empty_items(business_id);
CREATE INDEX idx_empty_items_active ON empty_items(business_id, is_active);

-- 3. CREATE TABLE: warehouse_empty_inventory
CREATE TABLE IF NOT EXISTS warehouse_empty_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(business_id) ON DELETE CASCADE,
  empty_item_id UUID NOT NULL REFERENCES empty_items(id) ON DELETE CASCADE,
  quantity_available INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT quantity_available_non_negative CHECK (quantity_available >= 0),
  CONSTRAINT unique_warehouse_empty_item UNIQUE (business_id, empty_item_id)
);

-- Indexes for warehouse_empty_inventory
CREATE INDEX idx_warehouse_empty_business_id ON warehouse_empty_inventory(business_id);
CREATE INDEX idx_warehouse_empty_item_id ON warehouse_empty_inventory(empty_item_id);

-- 4. CREATE TABLE: retailer_empty_balances
CREATE TABLE IF NOT EXISTS retailer_empty_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(business_id) ON DELETE CASCADE,
  retailer_id UUID NOT NULL REFERENCES retailers(id) ON DELETE CASCADE,
  empty_item_id UUID NOT NULL REFERENCES empty_items(id) ON DELETE CASCADE,
  quantity_outstanding INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT quantity_outstanding_non_negative CHECK (quantity_outstanding >= 0),
  CONSTRAINT unique_retailer_empty_item UNIQUE (business_id, retailer_id, empty_item_id)
);

-- Indexes for retailer_empty_balances
CREATE INDEX idx_retailer_empty_business_id ON retailer_empty_balances(business_id);
CREATE INDEX idx_retailer_empty_retailer_id ON retailer_empty_balances(retailer_id);
CREATE INDEX idx_retailer_empty_item_id ON retailer_empty_balances(empty_item_id);

-- 5. CREATE TABLE: empty_movements
CREATE TABLE IF NOT EXISTS empty_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(business_id) ON DELETE CASCADE,
  empty_item_id UUID NOT NULL REFERENCES empty_items(id) ON DELETE CASCADE,
  retailer_id UUID REFERENCES retailers(id) ON DELETE SET NULL,
  type empty_movement_type NOT NULL,
  quantity INTEGER NOT NULL,
  reference_type TEXT, -- 'order', 'manufacturer', 'adjustment', 'return'
  reference_id UUID,
  notes TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for empty_movements
CREATE INDEX idx_empty_movements_business_id ON empty_movements(business_id);
CREATE INDEX idx_empty_movements_empty_item_id ON empty_movements(empty_item_id);
CREATE INDEX idx_empty_movements_retailer_id ON empty_movements(retailer_id);
CREATE INDEX idx_empty_movements_type ON empty_movements(type);
CREATE INDEX idx_empty_movements_created_at ON empty_movements(created_at DESC);
CREATE INDEX idx_empty_movements_reference ON empty_movements(reference_type, reference_id);

-- 6. UPDATE PRODUCTS TABLE
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS is_returnable BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS empty_item_id UUID REFERENCES empty_items(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS empty_conversion_rate INTEGER DEFAULT 1;

-- Add constraint: if is_returnable = true, empty_item_id must not be null
ALTER TABLE products 
ADD CONSTRAINT products_returnable_check 
CHECK (
  (is_returnable = false) OR 
  (is_returnable = true AND empty_item_id IS NOT NULL)
);

-- Index for returnable products
CREATE INDEX idx_products_returnable ON products(business_id, is_returnable) WHERE is_returnable = true;

-- 7. CREATE FUNCTION: Auto-update warehouse_empty_inventory updated_at
CREATE OR REPLACE FUNCTION update_warehouse_empty_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_warehouse_empty_updated_at
BEFORE UPDATE ON warehouse_empty_inventory
FOR EACH ROW
EXECUTE FUNCTION update_warehouse_empty_timestamp();

-- 8. CREATE FUNCTION: Auto-update retailer_empty_balances updated_at
CREATE OR REPLACE FUNCTION update_retailer_empty_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_retailer_empty_updated_at
BEFORE UPDATE ON retailer_empty_balances
FOR EACH ROW
EXECUTE FUNCTION update_retailer_empty_timestamp();

-- 9. CREATE FUNCTION: Prevent negative warehouse inventory
CREATE OR REPLACE FUNCTION prevent_negative_warehouse_empty()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.quantity_available < 0 THEN
    RAISE EXCEPTION 'Warehouse empty inventory cannot be negative for item %', NEW.empty_item_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_prevent_negative_warehouse
BEFORE INSERT OR UPDATE ON warehouse_empty_inventory
FOR EACH ROW
EXECUTE FUNCTION prevent_negative_warehouse_empty();

-- 10. CREATE FUNCTION: Prevent negative retailer balance
CREATE OR REPLACE FUNCTION prevent_negative_retailer_empty()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.quantity_outstanding < 0 THEN
    RAISE EXCEPTION 'Retailer empty balance cannot be negative for retailer % and item %', 
      NEW.retailer_id, NEW.empty_item_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_prevent_negative_retailer
BEFORE INSERT OR UPDATE ON retailer_empty_balances
FOR EACH ROW
EXECUTE FUNCTION prevent_negative_retailer_empty();

-- 11. RLS POLICIES

-- Enable RLS on all tables
ALTER TABLE empty_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouse_empty_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE retailer_empty_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE empty_movements ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view empty items in their business
CREATE POLICY "Users can view empty items in their business"
ON empty_items
FOR SELECT
USING (
  business_id IN (
    SELECT business_id FROM users WHERE id = auth.uid()
  )
);

-- Policy: Admin/Manager can manage empty items
CREATE POLICY "Admin and managers can manage empty items"
ON empty_items
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.business_id = empty_items.business_id
    AND users.role IN ('admin', 'manager')
  )
);

-- Policy: Users can view warehouse empty inventory in their business
CREATE POLICY "Users can view warehouse empty inventory"
ON warehouse_empty_inventory
FOR SELECT
USING (
  business_id IN (
    SELECT business_id FROM users WHERE id = auth.uid()
  )
);

-- Policy: Admin/Manager/Warehouse can update warehouse inventory
CREATE POLICY "Authorized roles can update warehouse inventory"
ON warehouse_empty_inventory
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.business_id = warehouse_empty_inventory.business_id
    AND users.role IN ('admin', 'manager', 'warehouse')
  )
);

-- Policy: Users can view retailer empty balances in their business
CREATE POLICY "Users can view retailer empty balances"
ON retailer_empty_balances
FOR SELECT
USING (
  business_id IN (
    SELECT business_id FROM users WHERE id = auth.uid()
  )
  OR
  -- Sales reps can see their assigned retailers
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'sales_rep'
    AND retailer_empty_balances.retailer_id IN (
      SELECT id FROM retailers WHERE assigned_rep_id = auth.uid()
    )
  )
);

-- Policy: Admin/Manager/Warehouse can update retailer balances
CREATE POLICY "Authorized roles can update retailer balances"
ON retailer_empty_balances
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.business_id = retailer_empty_balances.business_id
    AND users.role IN ('admin', 'manager', 'warehouse', 'sales_rep')
  )
);

-- Policy: Users can view empty movements in their business
CREATE POLICY "Users can view empty movements"
ON empty_movements
FOR SELECT
USING (
  business_id IN (
    SELECT business_id FROM users WHERE id = auth.uid()
  )
);

-- Policy: Authorized roles can create empty movements
CREATE POLICY "Authorized roles can create empty movements"
ON empty_movements
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.business_id = empty_movements.business_id
    AND users.role IN ('admin', 'manager', 'warehouse', 'sales_rep')
  )
);

-- 12. CREATE VIEW: Empty inventory summary
CREATE OR REPLACE VIEW empty_inventory_summary AS
SELECT 
  ei.id as empty_item_id,
  ei.business_id,
  ei.name as empty_item_name,
  ei.deposit_value,
  COALESCE(wei.quantity_available, 0) as warehouse_quantity,
  COALESCE(SUM(reb.quantity_outstanding), 0) as total_retailer_outstanding,
  COALESCE(wei.quantity_available, 0) + COALESCE(SUM(reb.quantity_outstanding), 0) as total_in_circulation,
  ei.deposit_value * (COALESCE(wei.quantity_available, 0) + COALESCE(SUM(reb.quantity_outstanding), 0)) as total_deposit_value
FROM empty_items ei
LEFT JOIN warehouse_empty_inventory wei ON ei.id = wei.empty_item_id
LEFT JOIN retailer_empty_balances reb ON ei.id = reb.empty_item_id
WHERE ei.is_active = true
GROUP BY ei.id, ei.business_id, ei.name, ei.deposit_value, wei.quantity_available;

-- 13. GRANT PERMISSIONS (if needed)
-- GRANT ALL ON empty_items TO authenticated;
-- GRANT ALL ON warehouse_empty_inventory TO authenticated;
-- GRANT ALL ON retailer_empty_balances TO authenticated;
-- GRANT ALL ON empty_movements TO authenticated;

-- Verification queries
SELECT 'empty_items' as table_name, COUNT(*) as count FROM empty_items
UNION ALL
SELECT 'warehouse_empty_inventory', COUNT(*) FROM warehouse_empty_inventory
UNION ALL
SELECT 'retailer_empty_balances', COUNT(*) FROM retailer_empty_balances
UNION ALL
SELECT 'empty_movements', COUNT(*) FROM empty_movements;

-- Show enum values
SELECT enumlabel as movement_type 
FROM pg_enum 
WHERE enumtypid = 'empty_movement_type'::regtype 
ORDER BY enumsortorder;

COMMIT;
