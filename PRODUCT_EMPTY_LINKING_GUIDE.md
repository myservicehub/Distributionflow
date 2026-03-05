# 🔗 Product-Empty Linking System - User Guide

## Overview
The Product-Empty Linking System connects your products (filled items) to their corresponding empty bottles, making empty bottle tracking automatic and effortless.

---

## 🎯 Why Link Products to Empties?

### **Before (Manual Tracking):**
- ❌ Track products and empties separately
- ❌ Manually issue empties when delivering products
- ❌ Remember which empty goes with which product
- ❌ Risk of errors and forgotten empties

### **After (Automatic Tracking):**
- ✅ System knows which empty goes with each product
- ✅ Can auto-issue empties when orders are fulfilled (future feature)
- ✅ Clear visual overview of all product-empty relationships
- ✅ Reduced manual work and errors

---

## 📦 How It Works

```
┌──────────────────────────────────────────────────────────┐
│                   PRODUCT TABLE                           │
├──────────────────────────────────────────────────────────┤
│ Product: Coca-Cola 500ml                                 │
│ SKU: COKE-500                                            │
│ Price: ₦200                                              │
│ empty_item_id: [LINK] ────────────┐                     │
└──────────────────────────────────┼──────────────────────┘
                                    │
                                    │ LINKED
                                    │
┌───────────────────────────────────▼──────────────────────┐
│                 EMPTY_ITEMS TABLE                         │
├──────────────────────────────────────────────────────────┤
│ Empty Item: Coca-Cola 500ml Empty Bottle                │
│ Deposit Value: ₦50                                       │
└──────────────────────────────────────────────────────────┘
```

---

## 🚀 Setup Instructions

### **Step 1: Run Database Migration**

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of `/app/database/link_products_to_empties_migration.sql`
4. Paste and **Run** the query
5. ✅ You should see: "Product-Empty linking system installed!"

---

### **Step 2: Access the Product-Empty Links Page**

1. Login to your dashboard
2. Look for **"Product-Empty Links"** in the sidebar
   - Located between "Inventory" and "Empty Items"
3. Click to open the page

---

### **Step 3: Link Products to Empties**

You have **3 options**:

#### **Option A: Link to Existing Empty (Recommended)**
1. Find your product in the table
2. Click the dropdown in "Linked Empty Item" column
3. Select the matching empty item from the list
4. ✅ Done! Link is saved automatically

#### **Option B: Create New Empty & Link**
1. Find a product without a linked empty
2. Click **"Create Empty"** button
3. Review the auto-generated name (e.g., "Coca-Cola 500ml Empty Bottle")
4. Set the deposit value (e.g., ₦50)
5. Click **"Create & Link"**
6. ✅ New empty is created and automatically linked!

#### **Option C: Unlink Product**
1. Click the dropdown for a linked product
2. Select "No empty linked"
3. ✅ Link is removed

---

## 📊 Understanding the Dashboard

### **Summary Cards:**

1. **Total Products**
   - Shows all products in your inventory
   
2. **Linked Products** (Green)
   - Products that have empties assigned
   - Shows percentage of products linked
   
3. **Unlinked Products** (Orange)
   - Products without empty assignments
   - These need your attention

### **Table Columns:**

| Column | Description |
|--------|-------------|
| **Product** | Your product name (e.g., Coca-Cola 500ml) |
| **SKU** | Product SKU/code |
| **Linked Empty Item** | Dropdown to select/change empty |
| **Deposit Value** | Value of the empty bottle |
| **Status** | Badge showing linked/not linked |
| **Actions** | Quick button to create matching empty |

---

## 💡 Best Practices

### **1. Naming Convention**
Use consistent naming to make linking easier:

**Products:**
- ✅ `Coca-Cola 500ml`
- ✅ `Sprite 1L`
- ✅ `Fanta 350ml`

**Empty Items:**
- ✅ `Coca-Cola 500ml Empty Bottle`
- ✅ `Sprite 1L Empty Bottle`
- ✅ `Fanta 350ml Empty Bottle`

### **2. Set Realistic Deposit Values**
- Small bottles (350-500ml): ₦30-₦50
- Medium bottles (750ml-1L): ₦50-₦80
- Large bottles (1.5L+): ₦80-₦150

### **3. Link All Products**
Aim for **100% linked products** for maximum automation benefits.

---

## 🎯 Common Workflows

### **Workflow 1: New Product with Empty**

**Scenario:** You're adding a new product that comes in a returnable bottle

**Steps:**
1. Add the product in `/dashboard/products`
2. Go to `/dashboard/product-empty-links`
3. Find your new product
4. Click "Create Empty"
5. Review name and set deposit value
6. Click "Create & Link"
7. ✅ Done! Product and empty are now connected

---

### **Workflow 2: Bulk Linking Existing Products**

**Scenario:** You have 20 products and 15 empties already created

**Steps:**
1. Go to `/dashboard/product-empty-links`
2. Check the "Unlinked Products" card
3. For each unlinked product:
   - Use dropdown to select matching empty
   - Or click "Create Empty" if no match exists
4. Monitor progress in the summary cards
5. ✅ Goal: Get to 100% linked!

---

### **Workflow 3: Changing a Link**

**Scenario:** You linked the wrong empty to a product

**Steps:**
1. Go to `/dashboard/product-empty-links`
2. Find the product
3. Click the dropdown
4. Select the correct empty
5. ✅ Link is updated immediately!

---

## 🔮 Future Features (Coming Soon)

### **Auto-Issue Empties on Order Fulfillment**
When you mark an order as "Delivered":
- ✅ System checks which products were delivered
- ✅ Finds their linked empties
- ✅ Automatically issues empties to retailer
- ✅ Updates warehouse inventory
- ✅ Updates retailer balance

**Example:**
- Order: 50× Coca-Cola 500ml delivered
- System auto-issues: 50× Coca-Cola 500ml Empty Bottles
- No manual work needed! 🎉

---

## ⚠️ Troubleshooting

### **Can't see "Product-Empty Links" menu item?**
- Check your role: Only **Admin** and **Manager** can access this page
- Try hard refresh: `Ctrl + Shift + R`

### **Dropdown shows no empty items?**
- Go to `/dashboard/empty-items` and create empty items first
- Refresh the product-empty links page

### **Can't link product to empty?**
- Check if you're logged in as Admin or Manager
- Check browser console for errors
- Verify database migration was run successfully

---

## 📞 Need Help?

If you need assistance:
1. Check this guide first
2. Verify the database migration was run
3. Check your role permissions
4. Contact your system administrator

---

## 🎉 Benefits Recap

By linking products to empties, you get:
- ✅ Clear overview of all product-empty relationships
- ✅ Quick creation of matching empties
- ✅ Foundation for future automation
- ✅ Reduced manual tracking errors
- ✅ Better empty bottle management

**Start linking your products today!** 🚀

---

**Last Updated:** March 2025  
**Version:** 1.0
