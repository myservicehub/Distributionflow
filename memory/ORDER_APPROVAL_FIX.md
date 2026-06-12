# Order Approval Fix

## Issue
User reported they couldn't approve orders. The problem was a database column name mismatch.

## Root Cause
**Database Schema:** The `orders` table has a column named `status`
**API Code:** The API route was trying to update a column named `order_status`

This mismatch meant that when the frontend sent `{ order_status: 'confirmed' }`, the API would try to update `order_status` in the database, but since that column doesn't exist, the update would fail silently or not update the correct field.

## Solution Applied

### 1. Fixed Column Name Mapping
**File:** `/app/app/api/orders/[id]/route.js`

Changed line 70 from:
```javascript
if (order_status !== undefined) updatePayload.order_status = order_status
```

To:
```javascript
// Map order_status to the database column 'status'
if (order_status !== undefined) updatePayload.status = order_status
```

### 2. Improved Error Handling
Added proper 404 error handling for orders not found:

```javascript
if (updateError) {
  // Check if order not found
  if (updateError.code === 'PGRST116') {
    return errorResponse('Order not found', 404)
  }
  throw updateError
}

if (!order) return errorResponse('Order not found', 404)
```

### 3. Fixed Audit Log Issues
Added null check before audit logging to prevent database constraint violations:

```javascript
// Only log audit if we have valid context
if (userContext.businessId && userContext.userId) {
  await logAudit(supabase, userContext.userId, userContext.businessId,
    AUDIT_ACTIONS.UPDATE, RESOURCE_TYPES.ORDER, order.id,
    { order_number: order.order_number, new_status: order_status || payment_status })
}
```

## Test Results

### Backend Testing (via deep_testing_backend_nextjs)
✅ **Order Approval** - Working (pending → confirmed)  
✅ **Order Rejection** - Working (pending → cancelled)  
✅ **Database Column Fix** - Correct mapping verified  
✅ **404 Error Handling** - Returns proper error codes  
✅ **Permission Checks** - Admin/manager access enforced  
✅ **Audit Logging** - No more constraint violations  

**Pass Rate:** 100% (6/6 tests passed)

## Impact
- ✅ Admins and managers can now successfully approve orders
- ✅ Admins and managers can now successfully reject orders
- ✅ Order status updates correctly in the database
- ✅ Proper permission checks prevent unauthorized access
- ✅ Better error handling with appropriate HTTP status codes
- ✅ Audit logs work without database errors

## Database Schema Reference
From `/app/database/01_tables.sql`:
```sql
CREATE TABLE IF NOT EXISTS orders (
  ...
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'delivered', 'cancelled')),
  ...
);
```

## Files Modified
1. `/app/app/api/orders/[id]/route.js` - Fixed column mapping, error handling, and audit logging

## Usage
1. Navigate to `/dashboard/orders`
2. Find an order with status "pending"
3. Click "Approve" to change status to "confirmed"
4. Or click "Reject" to change status to "cancelled"

## Date Fixed
June 12, 2026
