-- ============================================
-- Database Schema Audit Report
-- ============================================
-- This script checks for common schema mismatches and
-- provides a comprehensive report of the current database state.
--
-- INSTRUCTIONS:
-- 1. Log into your Supabase dashboard
-- 2. Navigate to SQL Editor
-- 3. Copy and paste this entire script
-- 4. Click "Run" to execute
-- 5. Review the output to identify any issues
-- ============================================

-- Check for missing columns in orders table
SELECT 
    'ORDERS TABLE AUDIT' as check_category,
    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'order_status') as has_order_status,
    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'delivery_status') as has_delivery_status,
    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'is_legacy_order') as has_is_legacy_order,
    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'confirmed_by') as has_confirmed_by,
    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'confirmed_at') as has_confirmed_at,
    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'packed_at') as has_packed_at,
    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'dispatched_at') as has_dispatched_at,
    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'delivered_at') as has_delivered_at,
    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'delivery_reference') as has_delivery_reference,
    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'driver_name') as has_driver_name,
    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'vehicle_number') as has_vehicle_number,
    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'notes') as has_notes,
    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'order_number') as has_order_number,
    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'discount_amount') as has_discount_amount;

-- Check for missing columns in users table
SELECT 
    'USERS TABLE AUDIT' as check_category,
    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'phone') as has_phone;

-- Check for missing columns in payments table
SELECT 
    'PAYMENTS TABLE AUDIT' as check_category,
    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'recorded_by') as has_recorded_by;

-- Check foreign keys on payments table
SELECT 
    'PAYMENTS FOREIGN KEYS' as check_category,
    constraint_name,
    column_name
FROM information_schema.key_column_usage
WHERE table_name = 'payments' 
AND constraint_name LIKE '%_fkey'
ORDER BY column_name;

-- Check foreign keys on orders table
SELECT 
    'ORDERS FOREIGN KEYS' as check_category,
    constraint_name,
    column_name
FROM information_schema.key_column_usage
WHERE table_name = 'orders' 
AND constraint_name LIKE '%_fkey'
ORDER BY column_name;

-- List all columns in orders table
SELECT 
    'ORDERS COLUMNS LIST' as check_category,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'orders'
ORDER BY ordinal_position;

-- List all columns in payments table
SELECT 
    'PAYMENTS COLUMNS LIST' as check_category,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'payments'
ORDER BY ordinal_position;

-- List all columns in users table
SELECT 
    'USERS COLUMNS LIST' as check_category,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- Check indexes on frequently queried tables
SELECT 
    'DATABASE INDEXES' as check_category,
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename IN ('orders', 'payments', 'users', 'order_items', 'retailers', 'products')
ORDER BY tablename, indexname;

-- Summary report
SELECT 
    'AUDIT SUMMARY' as report_type,
    'Review the results above to identify missing columns and schema mismatches' as instructions,
    'All columns marked as "false" need to be added using the migration scripts' as action_required;
