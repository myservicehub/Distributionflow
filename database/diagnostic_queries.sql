-- ============================================
-- DIAGNOSTIC QUERIES FOR RLS POLICY FIX
-- ============================================
-- Run these queries to understand the current state of your database
-- and diagnose any issues with the RLS policy fix.

-- ============================================
-- QUERY 1: Check Current RLS Policies
-- ============================================
-- This shows all SELECT policies on data tables
-- EXPECTED: Should see "authenticated_users_view_*" policies after fix

SELECT 
  tablename,
  policyname,
  permissive,
  cmd as operation
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('retailers', 'products', 'orders', 'order_items', 'payments', 'stock_movements', 'audit_logs', 'users')
AND cmd = 'SELECT'
ORDER BY tablename, policyname;

-- ============================================
-- QUERY 2: Check If RLS Is Enabled
-- ============================================
-- All tables should have rowsecurity = true

SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('businesses', 'users', 'retailers', 'products', 'orders', 'order_items', 'payments', 'stock_movements', 'audit_logs')
ORDER BY tablename;

-- ============================================
-- QUERY 3: List All Users and Their Business
-- ============================================
-- Helpful to see what users exist and their status

SELECT 
  u.id,
  u.email,
  u.role,
  u.status,
  u.auth_user_id,
  b.name as business_name,
  b.id as business_id,
  b.owner_id as business_owner_auth_id,
  CASE 
    WHEN b.owner_id = u.auth_user_id THEN 'YES (Owner)'
    ELSE 'NO (Staff)'
  END as is_business_owner
FROM users u
LEFT JOIN businesses b ON u.business_id = b.id
ORDER BY b.id, u.role, u.email;

-- ============================================
-- QUERY 4: Check User Status Issues
-- ============================================
-- Find users that might have problems accessing data

SELECT 
  u.email,
  u.role,
  u.status,
  CASE 
    WHEN u.auth_user_id IS NULL THEN '❌ Missing auth_user_id'
    WHEN u.business_id IS NULL THEN '❌ Missing business_id'
    WHEN u.status != 'active' THEN '⚠️ User not active'
    ELSE '✅ OK'
  END as issue
FROM users u
WHERE u.auth_user_id IS NULL 
   OR u.business_id IS NULL 
   OR u.status != 'active'
ORDER BY u.email;

-- ============================================
-- QUERY 5: Test Policy for Specific User
-- ============================================
-- Replace 'user@example.com' with the email of the user having issues
-- This checks if they should have access to products

SELECT 
  u.id as user_id,
  u.email,
  u.role,
  u.status,
  u.business_id,
  COUNT(p.id) as products_in_same_business
FROM users u
LEFT JOIN products p ON p.business_id = u.business_id
WHERE u.email = 'user@example.com'  -- CHANGE THIS
GROUP BY u.id, u.email, u.role, u.status, u.business_id;

-- ============================================
-- QUERY 6: Check Orders and Sales Rep Assignment
-- ============================================
-- Verify orders are properly assigned to sales reps

SELECT 
  o.id as order_id,
  o.business_id,
  r.shop_name as retailer,
  u.email as sales_rep_email,
  u.role as sales_rep_role,
  o.total_amount,
  o.status,
  o.created_at
FROM orders o
LEFT JOIN retailers r ON o.retailer_id = r.id
LEFT JOIN users u ON o.sales_rep_id = u.id
ORDER BY o.created_at DESC
LIMIT 10;

-- ============================================
-- QUERY 7: Count Data by Business
-- ============================================
-- See how much data each business has

SELECT 
  b.name as business_name,
  b.id as business_id,
  (SELECT COUNT(*) FROM users WHERE business_id = b.id) as users_count,
  (SELECT COUNT(*) FROM products WHERE business_id = b.id) as products_count,
  (SELECT COUNT(*) FROM retailers WHERE business_id = b.id) as retailers_count,
  (SELECT COUNT(*) FROM orders WHERE business_id = b.id) as orders_count,
  (SELECT COUNT(*) FROM payments WHERE business_id = b.id) as payments_count
FROM businesses b
ORDER BY b.created_at DESC;

-- ============================================
-- QUERY 8: Find Orphaned Data
-- ============================================
-- Check for data that doesn't belong to any valid business

-- Users without business
SELECT 'users' as table_name, COUNT(*) as orphaned_count
FROM users 
WHERE business_id IS NULL OR business_id NOT IN (SELECT id FROM businesses)

UNION ALL

-- Products without business
SELECT 'products', COUNT(*)
FROM products
WHERE business_id IS NULL OR business_id NOT IN (SELECT id FROM businesses)

UNION ALL

-- Retailers without business
SELECT 'retailers', COUNT(*)
FROM retailers
WHERE business_id IS NULL OR business_id NOT IN (SELECT id FROM businesses);
