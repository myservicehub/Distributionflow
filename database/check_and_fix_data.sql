-- Check what data exists in the database
-- Run these queries one by one in Supabase SQL Editor to diagnose the issue

-- 1. Check if any businesses exist
SELECT * FROM businesses;

-- 2. Check if any users exist
SELECT * FROM users;

-- 3. Check your auth user ID (this should show your auth account)
SELECT id, email, created_at FROM auth.users;

-- If you see auth user but no user/business records, run this to create them manually:
-- Replace 'YOUR_AUTH_USER_ID' with the actual ID from query 3 above

-- Example manual creation (UPDATE THE IDs!):
/*
-- Create business first
INSERT INTO businesses (name, address, owner_id)
VALUES ('ABC Distributors Ltd', '123 Marina Street, Lagos', 'YOUR_AUTH_USER_ID_HERE')
RETURNING id;

-- Then create user profile (use the business id from above)
INSERT INTO users (business_id, auth_user_id, name, email, role, is_active)
VALUES ('BUSINESS_ID_FROM_ABOVE', 'YOUR_AUTH_USER_ID_HERE', 'Admin User', 'admin@abcdist.com', 'admin', true);
*/
