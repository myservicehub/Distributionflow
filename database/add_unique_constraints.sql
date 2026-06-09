-- ================================================================
-- DATABASE UNIQUE CONSTRAINTS FOR DUPLICATE PREVENTION
-- ================================================================
-- Run this ONCE in your Supabase SQL Editor
-- All indexes use IF NOT EXISTS so it is safe to re-run
-- 
-- These constraints provide a safety net at the database level,
-- catching any duplicates that might bypass the application layer.
--
-- After running, verify with:
--   SELECT indexname, indexdef FROM pg_indexes
--   WHERE tablename IN ('retailers','products','empty_items')
--   AND indexname LIKE 'idx_%unique%';
-- ================================================================

-- ================================================================
-- 1. RETAILERS: Unique shop name per business (case-insensitive)
-- ================================================================
-- Uses a functional index on LOWER(shop_name) for case-insensitive uniqueness
-- Prevents: "ABC Store" and "abc store" from existing simultaneously

CREATE UNIQUE INDEX IF NOT EXISTS idx_retailers_unique_name
  ON retailers (business_id, LOWER(shop_name));

COMMENT ON INDEX idx_retailers_unique_name IS 
  'Ensures unique retailer shop names per business (case-insensitive)';


-- ================================================================
-- 2. RETAILERS: Unique phone per business (when provided)
-- ================================================================
-- Partial index: only enforces uniqueness when phone IS NOT NULL and not empty
-- Allows multiple retailers with NULL/empty phone

CREATE UNIQUE INDEX IF NOT EXISTS idx_retailers_unique_phone
  ON retailers (business_id, phone)
  WHERE phone IS NOT NULL AND phone != '';

COMMENT ON INDEX idx_retailers_unique_phone IS 
  'Ensures unique phone numbers per business (excludes NULL/empty values)';


-- ================================================================
-- 3. PRODUCTS: Unique name per business (case-insensitive)
-- ================================================================
-- Uses functional index on LOWER(name) for case-insensitive uniqueness
-- Prevents: "Coca Cola" and "coca cola" from existing simultaneously
-- Note: SKU uniqueness already enforced by existing UNIQUE(business_id, sku) constraint

CREATE UNIQUE INDEX IF NOT EXISTS idx_products_unique_name
  ON products (business_id, LOWER(name));

COMMENT ON INDEX idx_products_unique_name IS 
  'Ensures unique product names per business (case-insensitive). SKU uniqueness handled by existing constraint.';


-- ================================================================
-- 4. EMPTY ITEMS: Unique name per business (active items only)
-- ================================================================
-- Partial index: only enforces uniqueness for active items (is_active = true)
-- Allows reusing names for deactivated items if needed
-- Case-insensitive using LOWER(name)

CREATE UNIQUE INDEX IF NOT EXISTS idx_empty_items_unique_name
  ON empty_items (business_id, LOWER(name))
  WHERE is_active = true;

COMMENT ON INDEX idx_empty_items_unique_name IS 
  'Ensures unique empty item names per business (case-insensitive, active items only)';


-- ================================================================
-- VERIFICATION QUERIES
-- ================================================================
-- Run these queries after creating the indexes to verify they exist:

-- 1. List all unique indexes we just created
-- SELECT 
--   schemaname,
--   tablename,
--   indexname,
--   indexdef
-- FROM pg_indexes
-- WHERE indexname IN (
--   'idx_retailers_unique_name',
--   'idx_retailers_unique_phone',
--   'idx_products_unique_name',
--   'idx_empty_items_unique_name'
-- )
-- ORDER BY tablename, indexname;

-- 2. Check index sizes (useful for monitoring)
-- SELECT
--   schemaname,
--   tablename,
--   indexname,
--   pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
-- FROM pg_stat_user_indexes
-- WHERE indexrelname LIKE 'idx_%unique%'
-- ORDER BY pg_relation_size(indexrelid) DESC;

-- 3. Test that duplicate detection works (should fail with unique violation)
-- -- Uncomment to test (replace with real business_id):
-- -- INSERT INTO retailers (business_id, shop_name, phone) 
-- --   VALUES ('your-business-id', 'Test Shop', '08012345678');
-- -- INSERT INTO retailers (business_id, shop_name, phone) 
-- --   VALUES ('your-business-id', 'TEST SHOP', '08012345678'); -- Should fail

-- ================================================================
-- NOTES
-- ================================================================
-- 
-- 1. These are FUNCTIONAL/PARTIAL indexes, not table constraints
--    They won't appear in information_schema.table_constraints
--    Use pg_indexes view to verify them
--
-- 2. The indexes use LOWER() for case-insensitive matching
--    This matches the .ilike() queries in the application code
--
-- 3. Partial indexes (WHERE clauses) keep index size smaller
--    and only enforce rules where needed
--
-- 4. If any violations exist in current data, the CREATE INDEX
--    will fail with a detailed error showing the duplicates
--    Fix the data first, then re-run
--
-- 5. Performance impact: Negligible for inserts/updates
--    Improves query performance for name/phone lookups
--
-- 6. These complement (not replace) application-level checks
--    App checks provide better UX (user-friendly error messages)
--    DB constraints are the safety net (prevent bypasses)
--
-- ================================================================

-- ================================================================
-- ROLLBACK (IF NEEDED)
-- ================================================================
-- If you need to remove these indexes for any reason:
--
-- DROP INDEX IF EXISTS idx_retailers_unique_name;
-- DROP INDEX IF EXISTS idx_retailers_unique_phone;
-- DROP INDEX IF EXISTS idx_products_unique_name;
-- DROP INDEX IF EXISTS idx_empty_items_unique_name;
--
-- ================================================================
