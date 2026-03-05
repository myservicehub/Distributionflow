-- ============================================
-- PRODUCT-EMPTY LINKING SYSTEM
-- Connects products to their corresponding empty bottles
-- ============================================

-- Step 1: Add empty_item_id column to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS empty_item_id UUID;

-- Step 2: Add foreign key constraint
ALTER TABLE products 
ADD CONSTRAINT fk_products_empty_item 
FOREIGN KEY (empty_item_id) 
REFERENCES empty_items(id) 
ON DELETE SET NULL;

-- Step 3: Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_products_empty_item_id 
ON products(empty_item_id);

-- Step 4: Add comment to document the relationship
COMMENT ON COLUMN products.empty_item_id IS 'Links product to its corresponding empty bottle/container';

-- ============================================
-- Verification Query
-- Check which products have empty items linked
-- ============================================
SELECT 
    p.id as product_id,
    p.name as product_name,
    p.sku,
    p.empty_item_id,
    ei.name as empty_item_name,
    ei.deposit_value,
    CASE 
        WHEN p.empty_item_id IS NULL THEN '❌ No Empty Linked'
        ELSE '✅ Empty Linked'
    END as link_status
FROM products p
LEFT JOIN empty_items ei ON p.empty_item_id = ei.id
ORDER BY link_status DESC, p.name;

-- ============================================
-- Sample: Link existing products to empties (OPTIONAL)
-- ============================================
-- Uncomment and run if you want to auto-link by matching names

-- UPDATE products p
-- SET empty_item_id = ei.id
-- FROM empty_items ei
-- WHERE p.business_id = ei.business_id
--   AND LOWER(ei.name) LIKE '%' || LOWER(p.name) || '%'
--   AND p.empty_item_id IS NULL;

-- ============================================
-- Success Message
-- ============================================
DO $$
BEGIN
    RAISE NOTICE '✅ Product-Empty linking system installed!';
    RAISE NOTICE '✅ Products table now has empty_item_id column';
    RAISE NOTICE '✅ Ready to link products to their empties';
END $$;
