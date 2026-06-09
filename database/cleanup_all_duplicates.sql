-- =====================================================
-- COMPREHENSIVE DUPLICATE CLEANUP FOR ALL TABLES
-- =====================================================
-- Run this BEFORE add_unique_constraints.sql
-- This handles duplicates in all tables that will get unique constraints

-- =====================================================
-- TABLE 1: empty_items (business_id, name)
-- =====================================================

-- Check for duplicates
SELECT 
    'empty_items' as table_name,
    business_id,
    LOWER(TRIM(name)) as normalized_name,
    COUNT(*) as duplicate_count,
    STRING_AGG(id::text, ', ') as ids
FROM empty_items
GROUP BY business_id, LOWER(TRIM(name))
HAVING COUNT(*) > 1;

-- Clean up duplicates (keep oldest)
DELETE FROM empty_items
WHERE id IN (
    SELECT e.id
    FROM empty_items e
    INNER JOIN (
        SELECT 
            business_id,
            LOWER(TRIM(name)) as normalized_name,
            MIN(created_at) as oldest_created_at
        FROM empty_items
        GROUP BY business_id, LOWER(TRIM(name))
        HAVING COUNT(*) > 1
    ) dup
    ON e.business_id = dup.business_id
    AND LOWER(TRIM(e.name)) = dup.normalized_name
    AND e.created_at > dup.oldest_created_at
);

-- =====================================================
-- TABLE 2: retailers (business_id, shop_name)
-- =====================================================

-- Check for duplicates
SELECT 
    'retailers' as table_name,
    business_id,
    LOWER(TRIM(shop_name)) as normalized_name,
    COUNT(*) as duplicate_count,
    STRING_AGG(id::text, ', ') as ids
FROM retailers
GROUP BY business_id, LOWER(TRIM(shop_name))
HAVING COUNT(*) > 1;

-- Clean up duplicates (keep oldest)
DELETE FROM retailers
WHERE id IN (
    SELECT r.id
    FROM retailers r
    INNER JOIN (
        SELECT 
            business_id,
            LOWER(TRIM(shop_name)) as normalized_name,
            MIN(created_at) as oldest_created_at
        FROM retailers
        GROUP BY business_id, LOWER(TRIM(shop_name))
        HAVING COUNT(*) > 1
    ) dup
    ON r.business_id = dup.business_id
    AND LOWER(TRIM(r.shop_name)) = dup.normalized_name
    AND r.created_at > dup.oldest_created_at
);

-- =====================================================
-- TABLE 3: retailers (business_id, phone)
-- =====================================================

-- Check for duplicate phones
SELECT 
    'retailers (phone)' as table_name,
    business_id,
    phone,
    COUNT(*) as duplicate_count,
    STRING_AGG(id::text, ', ') as ids
FROM retailers
WHERE phone IS NOT NULL AND phone != ''
GROUP BY business_id, phone
HAVING COUNT(*) > 1;

-- Clean up duplicate phones (keep oldest)
DELETE FROM retailers
WHERE id IN (
    SELECT r.id
    FROM retailers r
    INNER JOIN (
        SELECT 
            business_id,
            phone,
            MIN(created_at) as oldest_created_at
        FROM retailers
        WHERE phone IS NOT NULL AND phone != ''
        GROUP BY business_id, phone
        HAVING COUNT(*) > 1
    ) dup
    ON r.business_id = dup.business_id
    AND r.phone = dup.phone
    AND r.created_at > dup.oldest_created_at
);

-- =====================================================
-- TABLE 4: products (business_id, name)
-- =====================================================

-- Check for duplicates
SELECT 
    'products' as table_name,
    business_id,
    LOWER(TRIM(name)) as normalized_name,
    COUNT(*) as duplicate_count,
    STRING_AGG(id::text, ', ') as ids
FROM products
GROUP BY business_id, LOWER(TRIM(name))
HAVING COUNT(*) > 1;

-- Clean up duplicates (keep oldest)
DELETE FROM products
WHERE id IN (
    SELECT p.id
    FROM products p
    INNER JOIN (
        SELECT 
            business_id,
            LOWER(TRIM(name)) as normalized_name,
            MIN(created_at) as oldest_created_at
        FROM products
        GROUP BY business_id, LOWER(TRIM(name))
        HAVING COUNT(*) > 1
    ) dup
    ON p.business_id = dup.business_id
    AND LOWER(TRIM(p.name)) = dup.normalized_name
    AND p.created_at > dup.oldest_created_at
);

-- =====================================================
-- TABLE 5: products (business_id, sku)
-- =====================================================

-- Check for duplicate SKUs
SELECT 
    'products (sku)' as table_name,
    business_id,
    UPPER(TRIM(sku)) as normalized_sku,
    COUNT(*) as duplicate_count,
    STRING_AGG(id::text, ', ') as ids
FROM products
WHERE sku IS NOT NULL AND sku != ''
GROUP BY business_id, UPPER(TRIM(sku))
HAVING COUNT(*) > 1;

-- Clean up duplicate SKUs (keep oldest)
DELETE FROM products
WHERE id IN (
    SELECT p.id
    FROM products p
    INNER JOIN (
        SELECT 
            business_id,
            UPPER(TRIM(sku)) as normalized_sku,
            MIN(created_at) as oldest_created_at
        FROM products
        WHERE sku IS NOT NULL AND sku != ''
        GROUP BY business_id, UPPER(TRIM(sku))
        HAVING COUNT(*) > 1
    ) dup
    ON p.business_id = dup.business_id
    AND UPPER(TRIM(p.sku)) = dup.normalized_sku
    AND p.created_at > dup.oldest_created_at
);

-- =====================================================
-- TABLE 6: users (email)
-- =====================================================

-- Check for duplicate emails
SELECT 
    'users' as table_name,
    LOWER(TRIM(email)) as normalized_email,
    COUNT(*) as duplicate_count,
    STRING_AGG(id::text, ', ') as ids
FROM users
GROUP BY LOWER(TRIM(email))
HAVING COUNT(*) > 1;

-- Clean up duplicate emails (keep oldest)
DELETE FROM users
WHERE id IN (
    SELECT u.id
    FROM users u
    INNER JOIN (
        SELECT 
            LOWER(TRIM(email)) as normalized_email,
            MIN(created_at) as oldest_created_at
        FROM users
        GROUP BY LOWER(TRIM(email))
        HAVING COUNT(*) > 1
    ) dup
    ON LOWER(TRIM(u.email)) = dup.normalized_email
    AND u.created_at > dup.oldest_created_at
);

-- =====================================================
-- FINAL VERIFICATION
-- =====================================================

-- Check all tables - should all return 0 rows
SELECT 'empty_items' as table_name, COUNT(*) as remaining_duplicates FROM (
    SELECT business_id, LOWER(TRIM(name)) FROM empty_items
    GROUP BY business_id, LOWER(TRIM(name)) HAVING COUNT(*) > 1
) x

UNION ALL

SELECT 'retailers (shop_name)', COUNT(*) FROM (
    SELECT business_id, LOWER(TRIM(shop_name)) FROM retailers
    GROUP BY business_id, LOWER(TRIM(shop_name)) HAVING COUNT(*) > 1
) x

UNION ALL

SELECT 'retailers (phone)', COUNT(*) FROM (
    SELECT business_id, phone FROM retailers
    WHERE phone IS NOT NULL AND phone != ''
    GROUP BY business_id, phone HAVING COUNT(*) > 1
) x

UNION ALL

SELECT 'products (name)', COUNT(*) FROM (
    SELECT business_id, LOWER(TRIM(name)) FROM products
    GROUP BY business_id, LOWER(TRIM(name)) HAVING COUNT(*) > 1
) x

UNION ALL

SELECT 'products (sku)', COUNT(*) FROM (
    SELECT business_id, UPPER(TRIM(sku)) FROM products
    WHERE sku IS NOT NULL AND sku != ''
    GROUP BY business_id, UPPER(TRIM(sku)) HAVING COUNT(*) > 1
) x

UNION ALL

SELECT 'users (email)', COUNT(*) FROM (
    SELECT LOWER(TRIM(email)) FROM users
    GROUP BY LOWER(TRIM(email)) HAVING COUNT(*) > 1
) x;

-- Expected: All counts should be 0

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
-- If all verification queries return 0, you can now run:
-- /app/database/add_unique_constraints.sql
