# Database Setup Instructions - Execute in Order

## Problem with Original File
The original `schema.sql` file is too large and may cause issues. Execute these 4 smaller files instead.

---

## Step-by-Step Instructions

### Step 1: Create Tables
1. Go to https://supabase.com/dashboard
2. Select project: `ghleuwwnrerfanyfyclt`
3. Click **SQL Editor** → **New Query**
4. Copy **ALL** contents from `/app/database/01_tables.sql`
5. Paste into SQL editor
6. Click **RUN**
7. Wait for "Success. No rows returned"

### Step 2: Enable RLS
1. Click **New Query** again
2. Copy **ALL** contents from `/app/database/02_rls_enable.sql`
3. Paste and **RUN**
4. Wait for success message

### Step 3: Create RLS Policies
1. Click **New Query** again
2. Copy **ALL** contents from `/app/database/03_rls_policies.sql`
3. Paste and **RUN**
4. Wait for success message

### Step 4: Create Triggers
1. Click **New Query** again
2. Copy **ALL** contents from `/app/database/04_triggers.sql`
3. Paste and **RUN**
4. Wait for success message

---

## Verify Setup

1. Go to **Table Editor** in Supabase
2. You should see all these tables:
   - ✅ businesses
   - ✅ users
   - ✅ retailers
   - ✅ products
   - ✅ stock_movements
   - ✅ orders
   - ✅ order_items
   - ✅ payments
   - ✅ audit_logs

3. Click on any table → **RLS** tab
4. Verify "Enable RLS" is ON
5. Verify policies are listed

---

## Test Signup

1. Visit: https://distrib-flow-2.preview.emergentagent.com/signup
2. Fill in:
   - Business Name: Test Distribution
   - Address: Lagos, Nigeria
   - Your Name: Test User
   - Email: test@example.com
   - Password: test123456
3. Click "Create Account"
4. Should redirect to dashboard

---

## If Still Not Working

**Check Browser Console:**
1. Press F12
2. Go to Console tab
3. Try signup again
4. Share any error messages

**Common Issues:**
- "relation does not exist" → Step 1 not executed
- "permission denied" → Steps 2 & 3 not executed
- "function does not exist" → Step 4 not executed

---

## Quick Verification Query

Run this in Supabase SQL Editor to check if tables exist:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

You should see all 9 tables listed.