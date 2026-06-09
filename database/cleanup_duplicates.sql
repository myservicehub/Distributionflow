-- =====================================================
-- STEP 1: Identify and Clean Up Duplicate Empty Items
-- =====================================================
-- Run this BEFORE the unique constraints migration
-- 
-- This script finds duplicate empty_items and keeps only
-- the oldest one (by created_at), deleting the rest.

-- First, let's see what duplicates exist
SELECT 
    business_id,
    LOWER(TRIM(name)) as normalized_name,
    COUNT(*) as duplicate_count,
    STRING_AGG(id::text, ', ') as duplicate_ids
FROM empty_items
GROUP BY business_id, LOWER(TRIM(name))
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;

-- This shows you all the duplicates. Example output:
-- business_id | normalized_name | duplicate_count | duplicate_ids
-- The "testing" entry appears duplicated for business 45c20d8f...

-- =====================================================
-- STEP 2: Clean Up Duplicates (keeps oldest by created_at)
-- =====================================================

-- Delete duplicate empty_items, keeping only the oldest one per business+name
DELETE FROM empty_items
WHERE id IN (
    -- Select all duplicate IDs except the oldest one
    SELECT e.id
    FROM empty_items e
    INNER JOIN (
        -- Find all duplicates
        SELECT 
            business_id,
            LOWER(TRIM(name)) as normalized_name,
            MIN(created_at) as oldest_created_at
        FROM empty_items
        GROUP BY business_id, LOWER(TRIM(name))
        HAVING COUNT(*) > 1
    ) duplicates
    ON e.business_id = duplicates.business_id
    AND LOWER(TRIM(e.name)) = duplicates.normalized_name
    AND e.created_at > duplicates.oldest_created_at  -- Keep oldest, delete newer
);

-- This query will delete the duplicates while preserving the oldest entry

-- =====================================================
-- STEP 3: Verify cleanup was successful
-- =====================================================

-- Re-run the duplicate check - should return 0 rows
SELECT 
    business_id,
    LOWER(TRIM(name)) as normalized_name,
    COUNT(*) as duplicate_count
FROM empty_items
GROUP BY business_id, LOWER(TRIM(name))
HAVING COUNT(*) > 1;

-- Expected result: 0 rows (no more duplicates)

-- =====================================================
-- STEP 4: Check what was kept
-- =====================================================

-- Show the empty_items that were kept after cleanup
SELECT 
    id,
    business_id,
    name,
    deposit_value,
    created_at
FROM empty_items
WHERE business_id = '45c20d8f-aeb9-4474-a328-73c3c84df846'
ORDER BY name, created_at;

-- Now you can proceed with the unique constraints migration
-- Run: /app/database/add_unique_constraints.sql
