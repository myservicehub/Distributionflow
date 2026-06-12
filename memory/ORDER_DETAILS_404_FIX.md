# Order Details 404 Error - Fix

## Issue
Clicking "View Order Details" in the delivery board returned 404 error, even though the order appeared in the list.

**Error Message:**
```
GET /api/orders/7ad9cc8c-23b8-4323-b361-fc1fbf2c0bf0 404 (Not Found)
Failed to load order items: Error: Failed to load order details
```

## Root Cause
The GET handler for single orders (`/api/orders/[id]/route.js`) was selecting `products.unit_price` in the join query:

```javascript
order_items(*, products(name, sku, unit_price))
```

However, the `products` table doesn't have a `unit_price` column. The actual price columns are:
- `selling_price` - Price at which product is sold
- `cost_price` - Cost price of the product

This caused PostgreSQL to return an error (42703 - column does not exist), which resulted in 0 rows being returned, triggering the 404 response.

## Solution Applied
**File:** `/app/app/api/orders/[id]/route.js`

Changed the query to select the correct columns:

```javascript
order_items(*, products(name, sku, selling_price, cost_price, empty_item_id))
```

Now selects:
- `selling_price` - The actual selling price column
- `cost_price` - Additional price information
- `empty_item_id` - For bottle deposit tracking

## Test Results
✅ **Order Details Retrieval** - Working correctly (200 OK)  
✅ **Previously Failing Order** - 7ad9cc8c-23b8-4323-b361-fc1fbf2c0bf0 now returns successfully  
✅ **Column Names** - Correctly using selling_price instead of unit_price  
✅ **Join Query** - All joins (retailers, sales_rep, order_items, products) working  
✅ **No Database Errors** - PostgreSQL query executes successfully  

## Why This Happened
This is another manifestation of the schema inconsistency issue we've been fixing throughout the codebase. Different parts of the application use different column names:
- `unit_price` - Used in order_items table ✓
- `selling_price` - Used in products table ✓
- The query was trying to select `unit_price` from products, which doesn't exist ✗

## Impact
- ✅ Users can now view order details in delivery board
- ✅ "View Order Details" button works correctly
- ✅ Order items, products, retailer info, and sales rep info all load
- ✅ Bottle deposit information (empty_item_id) available for tracking

## Related Schema
**products table columns:**
- `name`
- `sku`
- `selling_price` (the price shown to customers)
- `cost_price` (internal cost)
- `stock_quantity`
- `empty_item_id` (link to empty bottles)

**order_items table columns:**
- `order_id`
- `product_id`
- `quantity`
- `unit_price` (price at time of order - copied from product.selling_price)
- `total_price` (quantity × unit_price)

## Files Modified
1. `/app/app/api/orders/[id]/route.js` - Fixed products column selection in join query

## Date Fixed
June 12, 2026

## Credit
Fixed by: Backend Testing Agent during diagnostic testing
