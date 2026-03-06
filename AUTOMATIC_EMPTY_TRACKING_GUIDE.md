# 🔄 Automatic Empty Bottle Tracking - How It Works

## Overview
The system now **automatically tracks empty bottles** when retailers buy drinks. You no longer need to manually issue empties - it happens automatically when you deliver orders!

---

## 🎯 How It Works

### **Step 1: Link Products to Empty Items**
Before the automatic tracking works, you need to link your products to their corresponding empty items.

**Example**:
- Product: "Coca-Cola 50cl Crate" → Link to → Empty Item: "Coca-Cola 50cl Bottle"  
- Product: "Sprite 33cl Crate" → Link to → Empty Item: "Sprite 33cl Bottle"

**How to do this**:
1. Go to `/dashboard/product-empty-links`
2. For each product, select the corresponding empty item
3. Save

**Note**: You must run the database migration first! See `/app/DATABASE_MIGRATIONS_GUIDE.md`

---

### **Step 2: Create and Deliver Orders**
Once products are linked, the magic happens automatically:

1. **Create an order** (on `/dashboard/orders`):
   - Retailer orders 10 crates of Coca-Cola
   
2. **Deliver the order** (on `/dashboard/delivery-board`):
   - Mark the order as "Delivered"
   - **The system automatically**:
     - Checks which products in the order have linked empty items
     - Calculates how many empties the retailer now owes
     - Updates the retailer's empty balance
     - Creates a record in empty movements
     - Logs it as "Automatic empty issuance for order #XXX"

3. **View balances** (on `/dashboard/retailer-empty-balances`):
   - The retailer now appears with their outstanding empty balance!

---

## 📊 Example Scenario

### Scenario: Retailer Orders Without Empties

**Order Details**:
- Retailer: "ABC Stores"
- Products ordered:
  - 10 crates of Coca-Cola 50cl (linked to "Coca-Cola 50cl Bottle")
  - 5 crates of Sprite 33cl (linked to "Sprite 33cl Bottle")

**What happens when delivered**:

1. **Before delivery**:
   - ABC Stores has no empty balance

2. **You mark as delivered**:
   - System checks the products
   - Finds:
     - 10 Coca-Cola crates → Issues 10 Coca-Cola empty bottles
     - 5 Sprite crates → Issues 5 Sprite empty bottles

3. **After delivery**:
   - Go to `/dashboard/retailer-empty-balances`
   - ABC Stores now shows:
     - Coca-Cola 50cl Bottle: 10 outstanding
     - Sprite 33cl Bottle: 5 outstanding
   - This represents what they OWE you

4. **When they return empties**:
   - Use the **Bottle Exchange** feature on the Delivery Board
   - OR manually process returns
   - The outstanding balance decreases

---

## 🔄 Complete Workflow

```
1. LINK PRODUCTS → EMPTY ITEMS
   (One-time setup on /dashboard/product-empty-links)
   ↓
2. CREATE ORDER
   (Retailer orders drinks)
   ↓
3. DELIVER ORDER
   (System automatically issues empties)
   ↓
4. RETAILER APPEARS IN EMPTY BALANCES
   (You can see who owes empties)
   ↓
5. RETAILER RETURNS EMPTIES
   (Use Bottle Exchange or manual returns)
   ↓
6. BALANCE UPDATED
   (Outstanding empties decrease)
```

---

## ✅ What Gets Tracked Automatically

✅ **Empties issued when orders are delivered**  
✅ **Retailer outstanding balances**  
✅ **Movement history** (with order reference)  
✅ **Multiple empty types** per order  
✅ **Cumulative balances** (adds to existing balances)

---

## 🎯 What You Still Control

You can still manually:
- ✅ Issue empties separately (use `/dashboard/issue-empties`)
- ✅ Process empty returns
- ✅ Record bottle exchanges
- ✅ Adjust balances manually
- ✅ View complete movement history

---

## 🚨 Important Notes

1. **Database Migration Required**: 
   - This feature requires the product-empty linking database migration
   - See `/app/DATABASE_MIGRATIONS_GUIDE.md`

2. **Product Linking is Required**:
   - Only products linked to empty items will trigger automatic tracking
   - Products without links work normally but don't issue empties

3. **Existing Orders**:
   - This only works for orders delivered AFTER this update
   - Old orders won't retroactively issue empties

4. **Manual Override**:
   - You can still manually adjust balances if needed
   - The automatic system won't interfere with manual operations

---

## 📊 Where to See Everything

| Page | What You'll See |
|------|----------------|
| **Retailer Empty Balances** | Who owes empties (automatically updated after delivery) |
| **Empty Inventory Overview** | Your warehouse stock |
| **Empty Items** | Master list of empty types |
| **Product-Empty Links** | Which products issue which empties |
| **Empty Movements** | Full audit trail with "Automatic empty issuance" entries |

---

## 🎉 Benefits

✅ **No more manual tracking** - System does it automatically  
✅ **Never forget to issue empties** - Happens on every delivery  
✅ **Accurate balances** - Automatic calculation based on products  
✅ **Full audit trail** - Every movement is logged with order reference  
✅ **Flexibility** - Still allows manual operations when needed

---

## Need Help?

If retailers aren't showing up in empty balances:
1. ✅ Check if the product-empty linking migration has been run
2. ✅ Verify products are linked on `/dashboard/product-empty-links`
3. ✅ Make sure orders are being marked as "Delivered" (not just confirmed)
4. ✅ Check the empty movements page for "Automatic empty issuance" entries
