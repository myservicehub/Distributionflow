# 📦 Empty Bottle Lifecycle Management - User Guide

## Overview
The Empty Bottle Lifecycle Management System helps you track empty bottles throughout their entire lifecycle - from receiving them from manufacturers to issuing them to retailers and tracking returns.

---

## 🔄 How the System Works

### **The Empty Bottle Workflow**

```
┌─────────────────────────────────────────────────────────────────┐
│                    EMPTY BOTTLE LIFECYCLE                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. RECEIVE FROM MANUFACTURER                                    │
│     └─> Warehouse inventory increases                           │
│                                                                  │
│  2. ISSUE TO RETAILER (with product delivery)                   │
│     └─> Warehouse inventory decreases                           │
│     └─> Retailer balance increases (they owe you empties)       │
│                                                                  │
│  3. RETAILER RETURNS EMPTIES                                     │
│     └─> Warehouse inventory increases                           │
│     └─> Retailer balance decreases                              │
│                                                                  │
│  4. RETURN TO MANUFACTURER                                       │
│     └─> Warehouse inventory decreases                           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📱 Available Pages & Features

### **1. Empty Items** (`/dashboard/empty-items`)
**Purpose:** Define the types of empty bottles you handle

**Who can access:** Admin, Manager

**What you can do:**
- ✅ Create new empty item types (e.g., "Coca-Cola 500ml Bottle", "Sprite 1L Bottle")
- ✅ Set deposit value for each empty type
- ✅ Set initial warehouse quantity (optional)
- ✅ View all empty item types

**Example:**
- Name: "Coca-Cola 500ml Bottle"
- Deposit Value: ₦50
- Initial Quantity: 100

---

### **2. Manufacturer Supply** (`/dashboard/manufacturer-supply`)
**Purpose:** Record when you receive empty bottles from the manufacturer

**Who can access:** Admin, Manager, Warehouse

**What you can do:**
- ✅ Select empty item type
- ✅ Enter quantity received
- ✅ Add notes about the shipment

**Example:**
- Empty Item: "Coca-Cola 500ml Bottle"
- Quantity: 500
- Notes: "Shipment #12345 from warehouse"

**Result:** Your warehouse inventory increases by 500 units

---

### **3. Retailer Empty Balances** (`/dashboard/retailer-empty-balances`) ⭐ NEW!
**Purpose:** See which retailers currently have empty bottles and process returns

**Who can access:** Admin, Manager, Warehouse

**What you can see:**
- ✅ **Summary Cards:**
  - Total number of retailers with outstanding empties
  - Total quantity of empties owed
  - Total deposit value tied up in empties

- ✅ **Detailed Table:**
  - Retailer name
  - Empty item type
  - Quantity owed
  - Deposit value per unit
  - Total value
  
- ✅ **Quick Actions:**
  - Search by retailer or empty item
  - Record returns directly from this page
  - Filter balances

**Example Table:**
| Retailer | Empty Item | Qty Owed | Deposit/Unit | Total Value | Actions |
|----------|-----------|----------|--------------|-------------|---------|
| ABC Store | Coca-Cola 500ml | 25 | ₦50 | ₦1,250 | Record Return |
| XYZ Shop | Sprite 1L | 15 | ₦80 | ₦1,200 | Record Return |

---

## 🎯 Common Use Cases

### **Use Case 1: Setting Up the System**

**Step 1:** Create empty item types
- Go to `/dashboard/empty-items`
- Click "Add Empty Item"
- Enter: Name = "Coca-Cola 500ml", Deposit = ₦50
- Save

**Step 2:** Record initial inventory (if you have empties in warehouse)
- Go to `/dashboard/manufacturer-supply`
- Select "Coca-Cola 500ml"
- Enter quantity: 100
- Add note: "Initial inventory count"
- Submit

---

### **Use Case 2: Daily Operations - Finding Retailers with Empties**

**Scenario:** You want to see which customers need to return empties

**Steps:**
1. Go to `/dashboard/retailer-empty-balances` ⭐
2. View the summary cards to see totals
3. Browse the table to see each retailer's balance
4. Use the search bar to find specific retailers
5. Note which retailers have high quantities (highlighted in red badge)

**What you'll see:**
- **Summary:** "5 retailers have outstanding empties"
- **Total Quantity:** 250 units
- **Total Value:** ₦12,500

---

### **Use Case 3: Processing Returns**

**Scenario:** A retailer (ABC Store) returns 20 Coca-Cola 500ml empties

**Steps:**
1. Go to `/dashboard/retailer-empty-balances`
2. Find "ABC Store" in the table
3. Click "Record Return" button
4. Enter quantity: 20
5. Add notes (optional): "Returned in good condition"
6. Click "Record Return"

**System Updates:**
- ✅ Warehouse inventory increases by 20
- ✅ ABC Store's balance decreases by 20
- ✅ If balance reaches 0, retailer removed from the list

---

### **Use Case 4: Monitoring Deposit Values**

**Scenario:** You want to know how much money is tied up in empty bottles

**Steps:**
1. Go to `/dashboard/retailer-empty-balances`
2. Check the "Total Deposit Value" summary card
3. This shows the total value of all empties currently with retailers

**Example:**
- Total Deposit Value: ₦45,000
- This means ₦45,000 worth of empties are with retailers

---

## 🔍 Understanding the Data

### **Retailer Balance**
- **What it means:** Number of empties the retailer currently has and needs to return
- **When it increases:** When you issue empties to them (with deliveries)
- **When it decreases:** When they return empties to you

### **Warehouse Inventory**
- **What it means:** Number of empties currently in your warehouse
- **When it increases:** Manufacturer supply + Retailer returns
- **When it decreases:** Issue to retailers + Return to manufacturer

### **Deposit Value**
- **What it means:** The value assigned to each empty bottle
- **Purpose:** Track the monetary value tied up in empties
- **Note:** This is NOT a payment - it's a tracking value

---

## 📊 Reports & Analytics

### **Available API Endpoints** (for developers/integrations)
- `GET /api/empty-bottles?route=retailer-empty-balances` - Get all balances
- `GET /api/empty-bottles?route=empty-movements` - Get transaction history
- `GET /api/empty-bottles?route=empty-dashboard-metrics` - Get analytics
- `GET /api/empty-bottles?route=warehouse-empty-inventory` - Get warehouse stock

---

## ⚠️ Important Notes

### **Role-Based Access**
- **Admin & Manager:** Full access to all features
- **Warehouse Staff:** Can record supply and returns
- **Sales Reps:** No access to empty bottle features

### **Feature Availability**
- Empty Bottle Lifecycle Management is available on **Business** and **Enterprise** plans
- If you see "Feature not available" message, please upgrade your subscription

### **Best Practices**
1. ✅ Create empty items before recording any transactions
2. ✅ Regularly check retailer balances to ensure returns
3. ✅ Set realistic deposit values to track value accurately
4. ✅ Use the search feature when you have many retailers
5. ✅ Add notes to returns for better record-keeping

---

## 🆘 Troubleshooting

### **"No retailers have outstanding empties"**
- This means all retailers have returned their empties (good!)
- Or you haven't issued any empties yet

### **Can't see the "Retailer Empty Balances" menu item**
- Check if you're logged in as Admin, Manager, or Warehouse role
- Sales reps don't have access to this feature

### **"Feature not available" error**
- Your subscription plan doesn't include Empty Lifecycle Management
- Contact your admin to upgrade to Business or Enterprise plan

---

## 📞 Need Help?

If you need assistance with the Empty Bottle Lifecycle Management System:
1. Contact your system administrator
2. Check your role permissions
3. Verify your subscription plan includes this feature

---

**Last Updated:** March 2025
**Version:** 1.0
