-- ============================================
-- CREATE FIRST SUPER ADMIN
-- Run this script in Supabase SQL Editor AFTER creating the super admin user in Supabase Auth
-- ============================================

-- STEP 1: First, create a user in Supabase Auth Dashboard with email/password
-- Go to: Authentication → Users → Add User
-- Email: admin@yourdomain.com
-- Password: (set a strong password)
-- Copy the UUID that gets generated

-- STEP 2: Run this script, replacing the values below:

INSERT INTO platform_admins (
  name,
  email,
  auth_user_id,
  role,
  status
) VALUES (
  'Super Admin',                              -- Replace with admin name
  'admin@yourdomain.com',                     -- Replace with admin email
  '00000000-0000-0000-0000-000000000000',    -- Replace with auth user UUID from Step 1
  'super_admin',
  'active'
) ON CONFLICT (email) DO NOTHING;

-- Verify the super admin was created
SELECT * FROM platform_admins;

-- ============================================
-- IMPORTANT NOTES:
-- ============================================
-- 1. The auth_user_id MUST match the UUID from Supabase Auth
-- 2. Super admins do NOT have a business_id
-- 3. They can only access /platform/* routes
-- 4. All their actions are logged in platform_audit_logs
-- 5. To add more super admins later, repeat this process
