# 🔄 Complete Database Reset Guide

## This will give you a fresh, working setup!

---

## ⚠️ IMPORTANT: This will delete ALL data!

This reset will:
- ✅ Delete all test data
- ✅ Remove broken RLS policies
- ✅ Create simple, working policies
- ✅ Allow proper signup flow

---

## 📋 Step-by-Step Instructions

### Step 1: Execute Reset Script in Supabase

1. **Go to Supabase SQL Editor**
   - URL: https://supabase.com/dashboard
   - Project: `ghleuwwnrerfanyfyclt`
   - Click **SQL Editor** → **New Query**

2. **Copy the ENTIRE script from:**
   `/app/database/RESET_DATABASE.sql`

3. **Paste into SQL Editor**

4. **Click RUN** (or press Ctrl+Enter)

5. **Wait for "Success" message**

---

### Step 2: Verify Reset

Run this query to confirm everything is empty:

```sql
SELECT 'businesses' as table_name, COUNT(*) as count FROM businesses
UNION ALL
SELECT 'users', COUNT(*) FROM users
UNION ALL
SELECT 'retailers', COUNT(*) FROM retailers
UNION ALL
SELECT 'products', COUNT(*) FROM products;
```

**Expected result:** All counts should be **0**

---

### Step 3: Logout from DistributionFlow

1. Go to: https://distrib-flow-2.preview.emergentagent.com
2. If you see a sidebar, click **Logout** button
3. OR just close the browser tab and open a fresh one

---

### Step 4: Create New Account (Proper Signup Flow)

1. **Go to Signup Page:**
   https://distrib-flow-2.preview.emergentagent.com/signup

2. **Fill in the form:**
   ```
   Business Name:     ABC Distributors Ltd
   Address:           123 Marina Street, Lagos, Nigeria
   Your Name:         Admin User
   Email:             admin@abcdist.com
   Password:          Test123456
   ```

3. **Click "Create Account"**

4. **You should be redirected to Dashboard automatically!**

---

### Step 5: Verify Everything Works

After signup, you should see:

✅ **Dashboard loads without errors**
✅ **Your business name in sidebar:** "ABC Distributors Ltd"
✅ **Your name and role:** "Admin User" with "ADMIN" badge
✅ **All metric cards show 0** (because no data yet)
✅ **No 401 errors in browser console** (press F12 to check)

---

### Step 6: Test Basic Features

**Test 1: Add a Product**
1. Click **Products** in sidebar
2. Click **Add Product**
3. Fill in:
   - Name: Coca-Cola 50cl
   - SKU: COKE-50
   - Selling Price: 150
   - Stock: 100
4. Click "Create Product"
5. **Should appear in table!** ✅

**Test 2: Add a Retailer**
1. Click **Retailers** in sidebar
2. Click **Add Retailer**
3. Fill in:
   - Shop Name: Ola's Supermarket
   - Credit Limit: 50000
4. Click "Create Retailer"
5. **Should appear in table!** ✅

---

## 🎯 What Changed?

### ❌ Old Policies (Broken):
- Used circular references between `users` and `businesses` tables
- Caused infinite recursion errors
- API couldn't authenticate properly

### ✅ New Policies (Working):
- Direct `auth.uid()` checks only
- No circular references
- Simple: "Can you see businesses where owner_id = your auth ID?"
- All data access checks `businesses.owner_id = auth.uid()`

---

## 🚀 After Reset, You Should Have:

**Working Features:**
- ✅ Signup creates business + user profile automatically
- ✅ Login works and redirects to dashboard
- ✅ Dashboard loads all data
- ✅ Can add/edit/delete products
- ✅ Can add/edit/delete retailers
- ✅ Can create orders (stock deducts)
- ✅ Can record payments (balance updates)
- ✅ All reports work
- ✅ No 401 errors
- ✅ No infinite recursion errors

---

## 🆘 If Something Still Doesn't Work:

**Check these:**

1. **Did you execute the entire reset script?**
   - Must run all 3 steps (truncate, drop policies, create policies)

2. **Did you logout before creating new account?**
   - Old session might interfere

3. **Did you use the signup page (not manual SQL)?**
   - Signup flow creates everything correctly

4. **Check browser console (F12):**
   - Should see no red errors
   - If you see 401 errors, the reset didn't work

5. **Verify policies exist:**
   ```sql
   SELECT schemaname, tablename, policyname 
   FROM pg_policies 
   WHERE schemaname = 'public'
   ORDER BY tablename;
   ```
   Should see policies like: `view_retailers`, `create_products`, etc.

---

## 📞 Quick Verification Checklist

After reset and signup:

- [ ] Executed reset script in Supabase
- [ ] All tables show count = 0
- [ ] Logged out from DistributionFlow
- [ ] Used signup page to create new account
- [ ] Redirected to dashboard automatically
- [ ] Dashboard shows business name in sidebar
- [ ] No errors in browser console (F12)
- [ ] Can add a product successfully
- [ ] Can add a retailer successfully
- [ ] All pages accessible (Products, Orders, Payments, Reports)

If all checkboxes are ✅, **DistributionFlow is working perfectly!** 🎉

---

## 🎊 Success = Clean Slate!

After this reset:
- Fresh database with working policies
- Proper account created via signup
- All features working
- No auth issues
- Ready to use!

---

**Execute the reset script now and let me know when you've created your new account!** 🚀
