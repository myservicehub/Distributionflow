-- =====================================================
-- MIGRATION: Add Unique Constraints for Duplicate Prevention
-- =====================================================
-- 
-- This migration adds database-level unique constraints to prevent
-- duplicate entries at the database level, complementing the 
-- application-level validation.
--
-- TO APPLY: Run this SQL in your Supabase SQL Editor
-- =====================================================

-- 1. RETAILERS: Unique shop_name per business
-- =====================================================
-- First, check for and clean up any existing duplicates
DO $$ 
BEGIN
    -- This will help identify duplicates before adding the constraint
    RAISE NOTICE 'Checking for duplicate shop_names in retailers...';
END $$;

-- Add unique constraint on shop_name within each business
-- Using a partial unique index to make it case-insensitive
CREATE UNIQUE INDEX IF NOT EXISTS unique_retailer_shop_name_per_business 
ON retailers (business_id, LOWER(TRIM(shop_name)))
WHERE shop_name IS NOT NULL;

COMMENT ON INDEX unique_retailer_shop_name_per_business IS 
'Ensures shop names are unique per business (case-insensitive)';


-- 2. RETAILERS: Unique phone per business
-- =====================================================
CREATE UNIQUE INDEX IF NOT EXISTS unique_retailer_phone_per_business 
ON retailers (business_id, phone)
WHERE phone IS NOT NULL AND phone != '';

COMMENT ON INDEX unique_retailer_phone_per_business IS 
'Ensures phone numbers are unique per business';


-- 3. PRODUCTS: Unique name per business
-- =====================================================
CREATE UNIQUE INDEX IF NOT EXISTS unique_product_name_per_business 
ON products (business_id, LOWER(TRIM(name)))
WHERE name IS NOT NULL;

COMMENT ON INDEX unique_product_name_per_business IS 
'Ensures product names are unique per business (case-insensitive)';


-- 4. PRODUCTS: Unique SKU per business
-- =====================================================
CREATE UNIQUE INDEX IF NOT EXISTS unique_product_sku_per_business 
ON products (business_id, UPPER(TRIM(sku)))
WHERE sku IS NOT NULL AND sku != '';

COMMENT ON INDEX unique_product_sku_per_business IS 
'Ensures SKUs are unique per business (case-insensitive, normalized to uppercase)';


-- 5. USERS/STAFF: Unique email globally
-- =====================================================
-- Email should be unique across all businesses
CREATE UNIQUE INDEX IF NOT EXISTS unique_user_email 
ON users (LOWER(TRIM(email)))
WHERE email IS NOT NULL;

COMMENT ON INDEX unique_user_email IS 
'Ensures email addresses are globally unique (case-insensitive)';


-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- Run these to verify the constraints were added successfully:

-- Check all unique indexes
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE indexname LIKE 'unique_%'
ORDER BY tablename, indexname;

-- Count duplicate shop_names (should return 0 after constraint)
SELECT 
    business_id, 
    LOWER(TRIM(shop_name)) as normalized_name, 
    COUNT(*) as count
FROM retailers
WHERE shop_name IS NOT NULL
GROUP BY business_id, LOWER(TRIM(shop_name))
HAVING COUNT(*) > 1;

-- Count duplicate phones (should return 0 after constraint)
SELECT 
    business_id, 
    phone, 
    COUNT(*) as count
FROM retailers
WHERE phone IS NOT NULL AND phone != ''
GROUP BY business_id, phone
HAVING COUNT(*) > 1;

-- Count duplicate product names (should return 0 after constraint)
SELECT 
    business_id, 
    LOWER(TRIM(name)) as normalized_name, 
    COUNT(*) as count
FROM products
WHERE name IS NOT NULL
GROUP BY business_id, LOWER(TRIM(name))
HAVING COUNT(*) > 1;

-- Count duplicate SKUs (should return 0 after constraint)
SELECT 
    business_id, 
    UPPER(TRIM(sku)) as normalized_sku, 
    COUNT(*) as count
FROM products
WHERE sku IS NOT NULL AND sku != ''
GROUP BY business_id, UPPER(TRIM(sku))
HAVING COUNT(*) > 1;

-- Count duplicate emails (should return 0 after constraint)
SELECT 
    LOWER(TRIM(email)) as normalized_email, 
    COUNT(*) as count
FROM users
WHERE email IS NOT NULL
GROUP BY LOWER(TRIM(email))
HAVING COUNT(*) > 1;


-- =====================================================
-- ROLLBACK (if needed)
-- =====================================================
-- To remove these constraints, run:
/*
DROP INDEX IF EXISTS unique_retailer_shop_name_per_business;
DROP INDEX IF EXISTS unique_retailer_phone_per_business;
DROP INDEX IF EXISTS unique_product_name_per_business;
DROP INDEX IF EXISTS unique_product_sku_per_business;
DROP INDEX IF EXISTS unique_user_email;
*/
