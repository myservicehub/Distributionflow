-- =====================================================
-- Driver Role Migration for DistributionFlow
-- Run this in Supabase SQL Editor BEFORE deploying code
-- =====================================================

-- 1. Expand the role check constraint to include 'driver'
ALTER TABLE users
  DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE users
  ADD CONSTRAINT users_role_check
  CHECK (role IN ('admin', 'manager', 'sales_rep', 'warehouse', 'driver'));

-- 2. Add proof of delivery fields to orders table
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS proof_of_delivery_url TEXT,
  ADD COLUMN IF NOT EXISTS proof_of_delivery_note TEXT,
  ADD COLUMN IF NOT EXISTS proof_captured_at TIMESTAMPTZ;

-- 3. Create Supabase Storage bucket for delivery photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('proof-of-delivery', 'proof-of-delivery', false)
ON CONFLICT (id) DO NOTHING;

-- 4. Storage RLS policies
CREATE POLICY IF NOT EXISTS "Drivers can upload proof of delivery"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'proof-of-delivery'
  AND auth.role() = 'authenticated'
);

CREATE POLICY IF NOT EXISTS "Business users can view proof of delivery"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'proof-of-delivery'
  AND auth.role() = 'authenticated'
);

-- 5. Link driver user accounts to driver records
ALTER TABLE drivers
  ADD COLUMN IF NOT EXISTS user_id UUID
    REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS auth_user_id UUID
    REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_drivers_user_id
  ON drivers(user_id);

CREATE INDEX IF NOT EXISTS idx_drivers_auth_user_id
  ON drivers(auth_user_id);

-- 6. Add delivery stats columns to drivers table
ALTER TABLE drivers
  ADD COLUMN IF NOT EXISTS total_deliveries INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS successful_deliveries INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS failed_deliveries INTEGER DEFAULT 0;

-- 7. Create function to increment driver delivery counts
CREATE OR REPLACE FUNCTION increment_driver_deliveries(
  p_driver_id UUID,
  p_success BOOLEAN
)
RETURNS VOID AS $$
BEGIN
  UPDATE drivers
  SET 
    total_deliveries = total_deliveries + 1,
    successful_deliveries = CASE WHEN p_success THEN successful_deliveries + 1 ELSE successful_deliveries END,
    failed_deliveries = CASE WHEN NOT p_success THEN failed_deliveries + 1 ELSE failed_deliveries END,
    updated_at = NOW()
  WHERE id = p_driver_id;
END;
$$ LANGUAGE plpgsql;

-- 8. Verify migration
SELECT 
  column_name, 
  data_type
FROM information_schema.columns
WHERE table_name = 'orders'
  AND column_name IN ('proof_of_delivery_url', 'proof_of_delivery_note', 'proof_captured_at');

SELECT 
  column_name, 
  data_type
FROM information_schema.columns
WHERE table_name = 'drivers'
  AND column_name IN ('user_id', 'auth_user_id', 'total_deliveries');

SELECT id, name, public
FROM storage.buckets
WHERE id = 'proof-of-delivery';
