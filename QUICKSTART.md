# 🚀 QUICK START - Staff Management Setup

## What You Need to Do (2 Simple Steps)

### ✅ STEP 1: Add Service Role Key (2 minutes)

**Get the key from Supabase:**
1. Go to https://app.supabase.com
2. Click your project
3. Click Settings (⚙️) → API
4. Find "service_role" key
5. Click copy button 📋

**Add it to your .env file:**
```bash
# Open terminal and run:
cd /app
nano .env

# Add this line at the bottom (paste your actual key):
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...your_key_here

# Save: Ctrl+X, then Y, then Enter

# Restart server:
sudo supervisorctl restart nextjs
```

---

### ✅ STEP 2: Apply Database Policies (1 minute)

**Copy the SQL script:**
```bash
# In terminal, run this to see the script:
cat /app/database/add_staff_management_policies.sql

# Select all and copy it (Ctrl+C)
```

**Run it in Supabase:**
1. Go to https://app.supabase.com
2. Click your project
3. Click SQL Editor (`</>` icon)
4. Click "+ New query"
5. Paste the SQL script (Ctrl+V)
6. Click "Run" button ▶️
7. Should see "Success. No rows returned" ✅

---

## 🎉 You're Done!

Now you can:
- Login to your app
- See "Staff" in the sidebar (admin only)
- Click "Add Staff Member"
- Create users with roles: Admin, Manager, Sales Rep, Warehouse
- Get auto-generated temporary passwords
- Edit and deactivate staff members

---

## 📖 Detailed Guides Available

For more detailed instructions with troubleshooting:
- **Complete Guide:** `/app/COMPLETE_SETUP_GUIDE.md`
- **Implementation Details:** `/app/STAFF_IMPLEMENTATION_SUMMARY.md`
- **Setup Help:** `/app/STAFF_SETUP_GUIDE.md`

---

## ❓ Quick Troubleshooting

**Problem:** POST /api/staff gives 500 error
```bash
# Check if key was added:
cat /app/.env | grep SERVICE_ROLE

# Check server logs:
tail -n 50 /var/log/supervisor/nextjs.out.log

# If you see "supabaseKey is required", the key wasn't loaded
# Make sure you restarted: sudo supervisorctl restart nextjs
```

**Problem:** SQL script gives "policy already exists" error
- This is OK! It means policies are already there. You can skip this step.

**Problem:** Can't see "Staff" menu
- Make sure you're logged in as an admin user
- Non-admin users won't see this menu (this is by design)

---

## 📋 The SQL Script (for easy copying)

Copy everything below and paste into Supabase SQL Editor:

```sql
-- ADD STAFF MANAGEMENT RLS POLICIES

CREATE POLICY "admin_view_all_users" ON users
  FOR SELECT
  USING (
    auth_user_id = auth.uid()
    OR
    business_id IN (
      SELECT b.id 
      FROM businesses b
      INNER JOIN users u ON u.business_id = b.id
      WHERE b.owner_id = auth.uid()
      AND u.auth_user_id = auth.uid()
      AND u.role = 'admin'
    )
  );

CREATE POLICY "admin_create_users" ON users
  FOR INSERT
  WITH CHECK (
    auth_user_id = auth.uid()
    OR
    business_id IN (
      SELECT b.id 
      FROM businesses b
      INNER JOIN users u ON u.business_id = b.id
      WHERE b.owner_id = auth.uid()
      AND u.auth_user_id = auth.uid()
      AND u.role = 'admin'
    )
  );

CREATE POLICY "admin_update_users" ON users
  FOR UPDATE
  USING (
    auth_user_id = auth.uid()
    OR
    business_id IN (
      SELECT b.id 
      FROM businesses b
      INNER JOIN users u ON u.business_id = b.id
      WHERE b.owner_id = auth.uid()
      AND u.auth_user_id = auth.uid()
      AND u.role = 'admin'
    )
  );

CREATE POLICY "admin_delete_users" ON users
  FOR DELETE
  USING (
    business_id IN (
      SELECT b.id 
      FROM businesses b
      INNER JOIN users u ON u.business_id = b.id
      WHERE b.owner_id = auth.uid()
      AND u.auth_user_id = auth.uid()
      AND u.role = 'admin'
    )
  );
```

---

Need help? Just ask! 😊
