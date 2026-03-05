# Role-Specific Notification System - Implementation Guide

## Overview
This implementation adds role-specific notification targeting to the existing notification system, allowing warehouse users to receive only dispatch-related notifications while admins and managers continue to receive all notifications.

---

## 1️⃣ DATABASE CHANGES

### Run SQL Migration

Execute the SQL script in `/app/database/add_target_roles_to_notifications.sql` in your Supabase SQL Editor.

**What it does:**
- Adds `target_roles` column (TEXT ARRAY) to `notifications` table
- Adds `category` column for notification categorization
- Migrates existing data from `target_role` to `target_roles`
- Creates GIN index on `target_roles` for better query performance
- Updates RLS policies for warehouse users

**After running, you should see:**
```
column_name   | data_type | is_nullable
--------------+-----------+-------------
category      | text      | YES
target_roles  | ARRAY     | YES
```

---

## 2️⃣ UPDATED NOTIFICATION UTILITY

### File: `/app/lib/notifications.js`

**New sendNotification Parameters:**

```javascript
await sendNotification({
  title: 'Order Ready for Dispatch',
  message: 'Order #12345 for ABC Store is ready for delivery.',
  type: 'info',                    // 'info', 'warning', or 'critical'
  category: 'dispatch',            // NEW: categorize notifications
  targetRoles: ['warehouse'],      // NEW: array of target roles
  businessId: '...',
  triggeredBy: '...',
  relatedTable: 'orders',
  relatedRecordId: '...'
})
```

**Role Targeting Logic:**
- `targetRoles: ['admin']` → Only admins
- `targetRoles: ['manager']` → Only managers
- `targetRoles: ['warehouse']` → Only warehouse users
- `targetRoles: ['admin', 'manager']` → Admins and managers
- Legacy `targetRole: 'all'` → Converts to `['admin', 'manager', 'warehouse']`

---

## 3️⃣ ORDER CONFIRMATION NOTIFICATION

### File: `/app/app/api/[[...path]]/route.js`

**When Manager Approves Order:**

```javascript
// ACTION 1: APPROVE ORDER (Manager/Admin)
if (body.action === 'approve') {
  // ... validation logic ...
  
  updateData = {
    order_status: 'confirmed',
    delivery_status: 'preparing',
    confirmed_by: userContext.userId,
    confirmed_at: new Date().toISOString(),
    status: 'confirmed'
  }
  
  shouldReserveStock = true
  notificationTitle = 'Order Ready for Dispatch'
  notificationMessage = `Order #${orderId.substring(0, 8)} for {RETAILER_NAME} is ready for delivery.`
  notificationCategory = 'dispatch'
  notificationTargetRoles = ['warehouse'] // 🎯 Only warehouse users
}
```

**Result:**
- When a manager confirms an order, warehouse users receive a notification
- Admin and manager do NOT receive this notification (unless you add them to targetRoles)
- Notification appears in warehouse user's notification bell

---

## 4️⃣ WAREHOUSE NAVBAR INTEGRATION

### File: `/app/components/notifications/NotificationBell.js`

**Key Changes:**

1. **Show notification bell for warehouse:**
   ```javascript
   if (!userProfile || !['admin', 'manager', 'warehouse'].includes(userProfile.role)) {
     return null
   }
   ```

2. **Filter notifications by role:**
   ```javascript
   let query = supabase
     .from('notifications')
     .select('*')
     .eq('business_id', userProfile.business_id)
   
   // For warehouse users, only fetch notifications targeted to them
   if (userProfile.role === 'warehouse') {
     query = query.contains('target_roles', ['warehouse'])
   }
   ```

3. **Real-time subscription filter:**
   ```javascript
   const isForThisRole = newNotification.target_roles && 
     (newNotification.target_roles.includes(userProfile.role) ||
      (userProfile.role === 'admin' || userProfile.role === 'manager'))
   ```

**Features for Warehouse:**
- ✅ Notification bell icon in navbar
- ✅ Unread count badge
- ✅ Dropdown list of notifications
- ✅ Mark as read functionality
- ✅ Real-time updates
- ❌ Only sees dispatch-related notifications (not financial, inventory, or staff notifications)

---

## 5️⃣ RLS POLICIES

### Warehouse Permissions

**CAN:**
- `SELECT` notifications where `target_roles` includes 'warehouse'
- `UPDATE` notifications to mark as read (via `read_at` and `read_by` columns)

**CANNOT:**
- `INSERT` new notifications
- `DELETE` notifications
- See notifications not targeted to warehouse

**Admin/Manager Permissions:**
- Continue to see ALL notifications
- Can perform all operations

---

## 6️⃣ NOTIFICATION CATEGORIES

### Recommended Categories

```javascript
// Dispatch/Delivery
category: 'dispatch'
targetRoles: ['warehouse']

// Financial (Payments, Credit)
category: 'financial'
targetRoles: ['admin', 'manager']

// Inventory Management
category: 'inventory'
targetRoles: ['admin', 'manager']

// Staff Management
category: 'staff'
targetRoles: ['admin']

// General/Operational
category: 'general'
targetRoles: ['admin', 'manager']
```

---

## 7️⃣ TESTING CHECKLIST

### As Manager:
1. ✅ Log in as Manager
2. ✅ Go to /dashboard/orders
3. ✅ Approve a pending order
4. ✅ Verify you do NOT see the "Order Ready for Dispatch" notification

### As Warehouse:
1. ✅ Log in as Warehouse user
2. ✅ Verify notification bell appears in navbar
3. ✅ Wait for manager to approve an order
4. ✅ Verify "Order Ready for Dispatch" notification appears
5. ✅ Click notification to mark as read
6. ✅ Verify unread count decreases
7. ✅ Verify warehouse does NOT see financial/inventory notifications

### As Admin:
1. ✅ Verify admins continue to see all notifications (if needed)
2. ✅ Approve an order and verify warehouse receives notification

---

## 8️⃣ EXAMPLE USAGE

### Creating a Warehouse-Only Notification

```javascript
await sendNotification({
  title: 'Order Ready for Dispatch',
  message: `Order #${orderId} for ${retailerName} is ready for delivery.`,
  type: 'info',
  category: 'dispatch',
  targetRoles: ['warehouse'],
  businessId: userContext.businessId,
  triggeredBy: userContext.userId,
  relatedTable: 'orders',
  relatedRecordId: orderId
})
```

### Creating a Manager-Only Notification

```javascript
await sendNotification({
  title: 'Large Payment Recorded',
  message: `Payment of ₦${amount} recorded for ${retailerName}.`,
  type: 'info',
  category: 'financial',
  targetRoles: ['manager'],
  businessId: userContext.businessId,
  triggeredBy: userContext.userId,
  relatedTable: 'payments',
  relatedRecordId: paymentId
})
```

### Creating an Admin-Only Notification

```javascript
await sendNotification({
  title: 'Staff Role Changed',
  message: `${staffName}'s role changed from ${oldRole} to ${newRole}.`,
  type: 'warning',
  category: 'staff',
  targetRoles: ['admin'],
  businessId: userContext.businessId,
  triggeredBy: userContext.userId,
  relatedTable: 'users',
  relatedRecordId: staffId
})
```

---

## 9️⃣ BACKWARD COMPATIBILITY

- Existing notifications with `target_role = 'all'` will continue to work
- The migration script converts old `target_role` data to `target_roles` array
- Code supports both `targetRole` (legacy) and `targetRoles` (new) parameters
- Admin and manager notification behavior remains unchanged

---

## 🔟 TROUBLESHOOTING

**Issue: Warehouse not seeing notifications**
- ✅ Check if migration was run successfully
- ✅ Verify `target_roles` column exists with GIN index
- ✅ Check RLS policies are applied
- ✅ Verify notification was created with `targetRoles: ['warehouse']`

**Issue: Notifications not filtered correctly**
- ✅ Check `contains('target_roles', ['warehouse'])` query syntax
- ✅ Verify array format in database (should be PostgreSQL array type)
- ✅ Check real-time subscription filter logic

**Issue: Permission errors**
- ✅ Verify RLS policies are correctly configured
- ✅ Check user role in `users` table matches expected role
- ✅ Verify `business_id` matches for all queries

---

## ✅ SUMMARY

**What Was Implemented:**
1. ✅ Added `target_roles` array column to notifications table
2. ✅ Updated `sendNotification()` function to support role arrays
3. ✅ Modified order approval to send warehouse-only notifications
4. ✅ Updated NotificationBell component to support warehouse users
5. ✅ Implemented RLS policies for warehouse permissions
6. ✅ Added real-time subscription filtering by role
7. ✅ Maintained backward compatibility with existing system

**Impact:**
- Warehouse users now have notification visibility
- Warehouse only sees relevant dispatch notifications
- Admin/Manager notification behavior unchanged
- Clean separation of concerns by notification category
- Scalable system for future role-specific notifications

---

## 📚 NEXT STEPS

1. **Run the SQL migration** in Supabase
2. **Test with warehouse user** account
3. **Approve an order** as manager
4. **Verify warehouse receives notification**
5. **Extend to other notification types** as needed

---

**Implementation Complete! 🎉**
