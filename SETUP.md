# 🚨 CRITICAL: Database Setup Required

## Before you can use DistributionFlow, you MUST execute the SQL schema in Supabase.

### Quick Setup (5 minutes)

**Step 1: Open Supabase SQL Editor**
1. Go to: https://supabase.com/dashboard
2. Select your project: `ghleuwwnrerfanyfyclt`
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**

**Step 2: Copy and Execute Schema**
1. Open the file: `/app/database/schema.sql`
2. Copy **ALL** of its contents (it's a long file)
3. Paste into the Supabase SQL editor
4. Click **RUN** or press `Ctrl+Enter`
5. Wait for "Success. No rows returned" message

**Step 3: Verify Setup**
1. Click **Table Editor** in Supabase sidebar
2. You should see these tables:
   - ✅ businesses
   - ✅ users
   - ✅ retailers
   - ✅ products
   - ✅ stock_movements
   - ✅ orders
   - ✅ order_items
   - ✅ payments
   - ✅ audit_logs

**Step 4: Test the Application**
1. Visit: https://distrib-flow-2.preview.emergentagent.com
2. Click "Get Started" or "Sign Up"
3. Create your business account
4. Start using DistributionFlow!

---

## What the Schema Creates

### Tables (9 total)
- **businesses**: Your company information
- **users**: Staff members with roles
- **retailers**: Your customers
- **products**: Your inventory items
- **stock_movements**: Stock in/out tracking
- **orders**: Customer orders
- **order_items**: Order line items
- **payments**: Payment records
- **audit_logs**: Activity tracking

### Security (Row Level Security)
- Each business's data is completely isolated
- No business can see another's data
- Enforced at database level (unhackable)

### Business Logic (Triggers)
- Auto-block retailers exceeding credit limits
- Auto-update timestamps
- Maintain data integrity

### Performance (Indexes)
- Fast queries on all tables
- Optimized for large datasets
- Supports thousands of products/retailers

---

## Application URLs

- **Production**: https://distrib-flow-2.preview.emergentagent.com
- **Local**: http://localhost:3000

## Credentials Already Configured

Your Supabase credentials are already in the `.env` file:
- ✅ Supabase URL
- ✅ Supabase Anon Key
- ✅ Database connection string

## Common Issues

### "Failed to load data"
**Solution**: Execute the SQL schema in Supabase

### "Unauthorized"
**Solution**: Make sure you're signed up and logged in

### "Cannot create business"
**Solution**: 
1. Check that schema is executed
2. Verify RLS policies are active
3. Check Supabase logs for errors

---

## Quick Test After Setup

1. **Sign Up**
   - Go to /signup
   - Fill business details
   - Create account (should work instantly)

2. **Add a Product**
   - Go to Dashboard → Products
   - Click "Add Product"
   - Enter: Coca-Cola 50cl, Price: 150, Stock: 100
   - Click "Create Product"

3. **Add a Retailer**
   - Go to Dashboard → Retailers
   - Click "Add Retailer"
   - Enter: Shop Name, Credit Limit: 50000
   - Click "Create Retailer"

4. **Create an Order**
   - Go to Dashboard → Orders
   - Click "New Order"
   - Select retailer and product
   - Set quantity: 10
   - Choose payment: Credit
   - Click "Create Order"
   - Check: Stock should reduce by 10!

5. **Record Payment**
   - Go to Dashboard → Payments
   - Click "Record Payment"
   - Select retailer
   - Enter amount
   - Click "Record Payment"
   - Check: Retailer balance should reduce!

If all 5 steps work → **DistributionFlow is working perfectly!** 🎉

---

## Need Help?

1. Check that schema is executed (most common issue)
2. Verify you're using correct Supabase project
3. Check browser console for errors (F12)
4. Review Supabase logs in dashboard

---

**Remember**: The database schema MUST be executed before the application will work!
