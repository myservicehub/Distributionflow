# 🚀 Enable Empty Bottle Lifecycle Feature - Quick Guide

## What This Does
This script will upgrade your subscription to include the **Empty Bottle Lifecycle Management** feature for **30 days free trial**.

---

## 📋 Instructions

### **Method 1: Using Supabase SQL Editor (Recommended)**

1. **Open Supabase Dashboard**
   - Go to your Supabase project: https://app.supabase.com
   - Login with your credentials

2. **Navigate to SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Copy and Paste the Script**
   - Open the file: `/app/database/enable_empty_lifecycle_feature.sql`
   - Copy the entire content
   - Paste it into the SQL Editor

4. **Run the Script**
   - Make sure you're logged in as the business owner
   - Click "Run" or press `Ctrl + Enter` (Windows/Linux) or `Cmd + Enter` (Mac)

5. **Check the Results**
   - You should see: `✅ Empty Lifecycle feature is now enabled!`
   - Verify `empty_lifecycle_enabled: true` in the final query result

6. **Refresh Your Dashboard**
   - Go back to your application
   - Hard refresh the page: `Ctrl + Shift + R` (Windows/Linux) or `Cmd + Shift + R` (Mac)
   - The 403 errors should be gone!

---

### **Method 2: Direct Database Command (Alternative)**

If you prefer, I can run this for you directly. Just confirm and I'll execute it.

---

## ✅ What You'll Get

After running this script:

1. **Subscription Upgraded to Business Plan (Trial)**
   - 30 days free trial
   - All Business plan features enabled
   - No payment required during trial

2. **Empty Lifecycle Feature Unlocked**
   - ✅ Create and manage empty items
   - ✅ Record manufacturer supply
   - ✅ **View retailer empty balances** (the new page you wanted!)
   - ✅ Process empty returns
   - ✅ Track empty movements

3. **No More 403 Errors**
   - All empty bottle API endpoints will work
   - Full access to all features

---

## 🔍 Verification Steps

After running the script:

1. **Check Your Billing Page**
   - Go to `/settings/billing`
   - You should see "Business Plan (Trial)"
   - Trial ends: 30 days from now

2. **Test the Empty Bottle Features**
   - Go to `/dashboard/retailer-empty-balances`
   - You should see the page load without 403 errors
   - Try creating an empty item at `/dashboard/empty-items`

3. **Console Errors Should Be Gone**
   - Open browser console (F12)
   - Refresh the page
   - No more 403 errors on `/api/empty-bottles` endpoints

---

## 🆘 Troubleshooting

### Still Getting 403 Errors?
1. **Hard refresh your browser**: `Ctrl + Shift + R`
2. **Clear browser cache**: Settings → Clear browsing data
3. **Logout and login again**
4. **Check verification query results**: Make sure `empty_lifecycle_enabled: true`

### Script Fails to Run?
- Make sure you're logged into Supabase as the project owner
- Check if you have admin permissions
- Let me know and I can help debug

---

## 📞 Need Help?

If you encounter any issues:
1. Share the error message from the SQL Editor
2. Let me know what step you're stuck on
3. I can run an alternative method for you

---

## 🎉 After Successful Upgrade

Once the script runs successfully, you'll be able to:
- See "Retailer Empty Balances" in your navigation menu
- Track which customers have empty bottles
- Process returns directly from the UI
- Access all empty bottle management features

**Trial Duration**: 30 days
**Plan**: Business Plan
**Cost During Trial**: ₦0 (Free)

---

Ready to proceed? Just run the SQL script in your Supabase Dashboard! 🚀
