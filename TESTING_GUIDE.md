# ✅ Complete Testing Checklist for DistributionFlow

## Pre-Testing Setup (MUST DO FIRST)

### 1. ✅ Disable Email Confirmation in Supabase
- [ ] Go to https://supabase.com/dashboard
- [ ] Select project: `ghleuwwnrerfanyfyclt`
- [ ] Click **Authentication** → **Providers**
- [ ] Click **Email** → **Edit**
- [ ] **DISABLE** "Confirm email" toggle
- [ ] Click **Save**
- ✨ **This fixes the "email rate exceeded" error**

### 2. ✅ Execute Database Schema (4 Files in Order)

**File 1: Create Tables**
- [ ] SQL Editor → New Query
- [ ] Copy ALL from `/app/database/01_tables.sql`
- [ ] Paste and RUN
- [ ] Wait for "Success. No rows returned"

**File 2: Enable RLS**
- [ ] New Query
- [ ] Copy ALL from `/app/database/02_rls_enable.sql`
- [ ] Paste and RUN
- [ ] Success message

**File 3: RLS Policies**
- [ ] New Query
- [ ] Copy ALL from `/app/database/03_rls_policies.sql`
- [ ] Paste and RUN
- [ ] Success message

**File 4: Triggers**
- [ ] New Query
- [ ] Copy ALL from `/app/database/04_triggers.sql`
- [ ] Paste and RUN
- [ ] Success message

**Verify Tables Created:**
- [ ] Go to **Table Editor** in Supabase
- [ ] See all 9 tables: businesses, users, retailers, products, stock_movements, orders, order_items, payments, audit_logs

---

## 📋 Test 1: Signup Flow

### Steps:
1. [ ] Visit: https://distrib-flow-2.preview.emergentagent.com/signup
2. [ ] Fill in form:
   - Business Name: **ABC Distributors**
   - Address: **123 Lagos Street, Lagos**
   - Your Name: **John Doe**
   - Email: **john@abcdist.com**
   - Password: **password123**
3. [ ] Click "Create Account"

### Expected Results:
- [ ] No errors shown
- [ ] Redirected to `/dashboard`
- [ ] See welcome message with business name
- [ ] Dashboard shows "ABC Distributors" in sidebar
- [ ] User role shows "ADMIN" badge
- [ ] All dashboard cards show 0 (initial state)

### If Fails:
- Check browser console (F12) for errors
- Verify database schema executed
- Verify email confirmation disabled
- Share error message

---

## 📋 Test 2: Complete Order-to-Payment Flow

### Part A: Add Products

1. [ ] Click **Products** in sidebar
2. [ ] Click **Add Product** button
3. [ ] Fill in Product 1:
   - Name: **Coca-Cola 50cl**
   - SKU: **COKE-50**
   - Cost Price: **100**
   - Selling Price: **150**
   - Stock Quantity: **200**
   - Low Stock Alert: **20**
4. [ ] Click "Create Product"
5. [ ] Verify product appears in table
6. [ ] **Repeat** for Product 2:
   - Name: **Pepsi 50cl**
   - SKU: **PEPSI-50**
   - Cost Price: **95**
   - Selling Price: **140**
   - Stock Quantity: **150**
   - Low Stock Alert: **15**

**Expected:**
- [ ] Products appear in table
- [ ] Stock quantities correct
- [ ] No errors

### Part B: Add Retailers

1. [ ] Click **Retailers** in sidebar
2. [ ] Click **Add Retailer** button
3. [ ] Fill in Retailer 1:
   - Shop Name: **Ola's Supermarket**
   - Owner Name: **Ola Johnson**
   - Phone: **08012345678**
   - Address: **Victoria Island, Lagos**
   - Credit Limit: **50000**
4. [ ] Click "Create Retailer"
5. [ ] Verify retailer appears in table
6. [ ] **Repeat** for Retailer 2:
   - Shop Name: **Ngozi Mini Mart**
   - Owner Name: **Ngozi Okafor**
   - Phone: **08087654321**
   - Address: **Ikeja, Lagos**
   - Credit Limit: **30000**

**Expected:**
- [ ] Retailers appear in table
- [ ] Current Balance shows ₦0
- [ ] Status shows "active"
- [ ] Credit limits correct

### Part C: Create PAID Order (Test Stock Deduction)

1. [ ] Click **Orders** in sidebar
2. [ ] Click **New Order** button
3. [ ] Select Retailer: **Ola's Supermarket**
4. [ ] Payment Status: **Paid**
5. [ ] Add Item:
   - Product: **Coca-Cola 50cl**
   - Quantity: **20**
   - Price should auto-fill: **150**
   - Total: **3000**
6. [ ] Click "Create Order"

**Expected:**
- [ ] Order created successfully
- [ ] Redirected to orders list
- [ ] Order shows with "confirmed" status
- [ ] Payment status: "paid"

**Verify Stock Deduction:**
1. [ ] Go to **Products**
2. [ ] Check Coca-Cola stock
   - **Before**: 200
   - **After**: 180 (200 - 20 = 180)
3. [ ] ✅ **Stock deducted correctly!**

**Verify Dashboard:**
1. [ ] Go to **Dashboard**
2. [ ] "Sales Today" should show: **₦3,000**
3. [ ] "Sales This Month" should show: **₦3,000**

### Part D: Create CREDIT Order (Test Balance Increase)

1. [ ] Click **Orders** in sidebar
2. [ ] Click **New Order** button
3. [ ] Select Retailer: **Ngozi Mini Mart**
4. [ ] Payment Status: **Credit**
5. [ ] Add Item 1:
   - Product: **Pepsi 50cl**
   - Quantity: **30**
   - Total: **4200** (30 × 140)
6. [ ] Add Item 2 (click "Add Item"):
   - Product: **Coca-Cola 50cl**
   - Quantity: **25**
   - Total: **3750** (25 × 150)
7. [ ] Total Amount: **₦7,950**
8. [ ] Click "Create Order"

**Expected:**
- [ ] Order created successfully
- [ ] Order shows "confirmed" status
- [ ] Payment status: "credit"

**Verify Stock Deductions:**
1. [ ] Go to **Products**
2. [ ] Coca-Cola: 180 → **155** (deducted 25)
3. [ ] Pepsi: 150 → **120** (deducted 30)
4. [ ] ✅ **Both stocks deducted!**

**Verify Retailer Balance:**
1. [ ] Go to **Retailers**
2. [ ] Find "Ngozi Mini Mart"
3. [ ] Current Balance: **₦7,950** (was ₦0)
4. [ ] Status: Still **"active"** (under credit limit)
5. [ ] ✅ **Balance updated!**

**Verify Dashboard:**
1. [ ] Go to **Dashboard**
2. [ ] "Sales Today": **₦10,950** (3000 + 7950)
3. [ ] "Total Outstanding Debt": **₦7,950**

### Part E: Record Payment (Test Balance Reduction)

1. [ ] Click **Payments** in sidebar
2. [ ] Click **Record Payment** button
3. [ ] Select Retailer: **Ngozi Mini Mart**
4. [ ] Should show: "Current Balance: ₦7,950"
5. [ ] Amount Paid: **5000**
6. [ ] Payment Method: **Cash**
7. [ ] Notes: **Partial payment received**
8. [ ] Click "Record Payment"

**Expected:**
- [ ] Payment recorded successfully
- [ ] Shows in payments table

**Verify Balance Updated:**
1. [ ] Go to **Retailers**
2. [ ] Find "Ngozi Mini Mart"
3. [ ] Current Balance: **₦2,950** (7950 - 5000)
4. [ ] Status: Still **"active"**
5. [ ] ✅ **Balance reduced!**

**Verify Dashboard:**
1. [ ] Go to **Dashboard**
2. [ ] "Total Outstanding Debt": **₦2,950** (updated)

### Part F: Test Credit Limit Blocking

1. [ ] Go to **Orders**
2. [ ] Click **New Order**
3. [ ] Select Retailer: **Ngozi Mini Mart** (balance: ₦2,950, limit: ₦30,000)
4. [ ] Payment Status: **Credit**
5. [ ] Add Item:
   - Product: **Coca-Cola 50cl**
   - Quantity: **200** (total: ₦30,000)
6. [ ] Try to create order

**Expected:**
- [ ] Should see error: "Order would exceed retailer credit limit"
- [ ] Order NOT created
- [ ] ✅ **Credit limit protection working!**

**Now test with smaller amount:**
1. [ ] Change quantity to **100** (total: ₦15,000)
2. [ ] New balance would be: 2,950 + 15,000 = **₦17,950** (under limit)
3. [ ] Create order

**Expected:**
- [ ] Order created successfully
- [ ] Stock deducted
- [ ] Balance updated to ₦17,950

---

## 📋 Test 3: Verify Reports Working

### Report 1: Dashboard Metrics

1. [ ] Go to **Dashboard**
2. [ ] Verify all cards have data:
   - Sales Today: **Has amount**
   - Sales This Month: **Has amount**
   - Total Outstanding Debt: **Has amount**
   - Low Stock Items: **Should be 0**
3. [ ] Check "Overdue Retailers" section
4. [ ] Check "Sales by Representative" section

### Report 2: Debt Aging Report

1. [ ] Click **Reports** in sidebar
2. [ ] Click **Debt Aging** tab
3. [ ] Should see retailers with outstanding balance
4. [ ] Check columns:
   - Retailer name
   - Outstanding balance
   - Credit limit
   - Aging category (0-30 days)
   - Days outstanding

**Expected:**
- [ ] Ngozi Mini Mart shows with balance
- [ ] Aging category shows correctly
- [ ] ✅ **Debt aging working!**

### Report 3: Sales by Rep

1. [ ] Click **Sales by Rep** tab
2. [ ] Should see your name (John Doe)
3. [ ] Total orders count
4. [ ] Total sales amount
5. [ ] Average order value

**Expected:**
- [ ] Your orders appear
- [ ] Totals calculated correctly
- [ ] ✅ **Sales report working!**

### Report 4: Inventory Report

1. [ ] Click **Inventory Report** tab
2. [ ] Should see all products
3. [ ] Stock quantities (after deductions)
4. [ ] Stock values calculated
5. [ ] Summary cards at bottom:
   - Total Products
   - Total Stock Value
   - Low Stock Items

**Expected:**
- [ ] All products listed
- [ ] Stock quantities match (after orders)
- [ ] Coca-Cola: **55** or **155** (depending on tests)
- [ ] Pepsi: **120**
- [ ] ✅ **Inventory report working!**

---

## 📋 Test 4: Mobile Device Testing

### Option A: Real Mobile Device

1. [ ] Open phone browser
2. [ ] Visit: https://distrib-flow-2.preview.emergentagent.com
3. [ ] Login with your account
4. [ ] Test navigation:
   - [ ] Hamburger menu works
   - [ ] Sidebar slides in/out
   - [ ] All pages accessible
5. [ ] Test creating order on mobile
6. [ ] Test viewing reports

### Option B: Browser Mobile Emulation

1. [ ] Open Chrome/Edge
2. [ ] Press **F12** (Developer Tools)
3. [ ] Click **Toggle Device Toolbar** (phone icon) or press Ctrl+Shift+M
4. [ ] Select device: **iPhone 12 Pro** or **Galaxy S20**
5. [ ] Reload page
6. [ ] Test all features:
   - [ ] Login works
   - [ ] Menu accessible
   - [ ] Tables scrollable
   - [ ] Forms usable
   - [ ] Buttons clickable

**Expected:**
- [ ] Responsive design works
- [ ] All features accessible
- [ ] No horizontal scroll
- [ ] Text readable
- [ ] Buttons large enough
- [ ] ✅ **Mobile responsive!**

---

## 🎯 Final Verification Checklist

### Data Integrity
- [ ] Products created and visible
- [ ] Retailers created with correct limits
- [ ] Orders created and stock deducted
- [ ] Payments recorded and balance updated
- [ ] All amounts calculated correctly

### Business Logic
- [ ] Stock deducts automatically on orders
- [ ] Balance increases on credit orders
- [ ] Balance decreases on payments
- [ ] Credit limit validation works
- [ ] Cannot create orders with insufficient stock

### Multi-Tenant Security
- [ ] Can only see own business data
- [ ] Cannot access other businesses (if you create second account)

### Reports
- [ ] Dashboard shows correct metrics
- [ ] All reports display data
- [ ] Calculations are accurate

### UI/UX
- [ ] All pages load without errors
- [ ] Forms work correctly
- [ ] Tables display data
- [ ] Buttons functional
- [ ] Mobile responsive

---

## 🎊 Success Criteria

✅ **Application is FULLY WORKING when:**

1. ✅ Can signup without errors
2. ✅ Can create products
3. ✅ Can create retailers
4. ✅ Can create orders (stock deducts)
5. ✅ Can record payments (balance updates)
6. ✅ Dashboard shows correct data
7. ✅ All reports work
8. ✅ Credit limit protection works
9. ✅ Mobile responsive
10. ✅ No console errors

---

## 🆘 Troubleshooting

### Issue: "Failed to load data"
**Fix:** Database schema not executed completely
- Re-run all 4 SQL files in order

### Issue: "Email rate exceeded"
**Fix:** Disable email confirmation in Supabase
- Auth → Providers → Email → Disable "Confirm email"

### Issue: "Unauthorized" errors
**Fix:** RLS policies not created
- Execute file 3: `03_rls_policies.sql`

### Issue: Stock not deducting
**Fix:** Check order creation logic
- Verify order shows "confirmed" status
- Check browser console for errors

### Issue: Balance not updating
**Fix:** Check payment recording
- Verify payment appears in payments table
- Check retailer balance in retailers table

---

## 📸 What to Check in Browser Console

Press **F12** and check **Console** tab:

**Should NOT see:**
- ❌ Red error messages
- ❌ "Failed to fetch"
- ❌ "Unauthorized"
- ❌ "relation does not exist"

**OK to see:**
- ✅ Successful API calls
- ✅ "POST /api/orders 200"
- ✅ "GET /api/products 200"

---

## 🚀 Ready to Test?

**Start here:**
1. ✅ Disable email confirmation
2. ✅ Execute 4 database files
3. ✅ Signup test
4. ✅ Create products
5. ✅ Create retailers
6. ✅ Create orders
7. ✅ Record payments
8. ✅ Check reports
9. ✅ Test mobile

**Let me know your progress at each step!**
