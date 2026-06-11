# How to Add a Driver User - Step by Step Guide

## Overview
This guide explains how to create a driver user account so drivers can access the "My Deliveries" dashboard.

---

## Method 1: Add Driver via Staff Management (Recommended)

### Step 1: Navigate to Staff Page
1. Log in as **Admin** or **Manager**
2. Go to **Dashboard** → **Staff** (from sidebar menu)

### Step 2: Click "Add New Staff Member"
1. Click the **"+ Add Staff Member"** button (top right)
2. A dialog will open

### Step 3: Fill in Driver Details
1. **Full Name**: Enter the driver's full name (e.g., "John Doe")
2. **Email**: Enter a unique email address (e.g., "john.driver@company.com")
3. **Role**: Select **"Driver"** from the dropdown
4. Click **"Create Staff Member"**

### Step 4: Save the Generated Password
1. A success dialog will appear with a **temporary password**
2. **IMPORTANT**: Copy this password immediately (click the copy icon)
3. Share this password with the driver securely
4. The password will only be shown once

### Step 5: Driver Account Created ✅
- The driver account is now active
- The driver will be forced to change their password on first login

---

## Method 2: Link Existing Driver from Drivers Table

If you already have driver records in the `drivers` table (created separately), you need to link them to user accounts:

### Option A: Automatic Linking (Recommended)
When you create a driver user via Staff Management, you can later update the `drivers` table:

```sql
-- Update drivers table with user_id and auth_user_id
UPDATE drivers 
SET 
  user_id = (SELECT id FROM users WHERE email = 'driver@email.com'),
  auth_user_id = (SELECT auth_user_id FROM users WHERE email = 'driver@email.com')
WHERE name = 'Driver Name';
```

### Option B: Manual Entry in Database
1. Go to Supabase Dashboard → SQL Editor
2. Run this query to link driver to user:

```sql
-- First, find the user_id and auth_user_id
SELECT id, auth_user_id FROM users WHERE email = 'driver@email.com';

-- Then update the driver record
UPDATE drivers
SET 
  user_id = 'user-uuid-from-above',
  auth_user_id = 'auth-uuid-from-above'
WHERE id = 'driver-uuid';
```

---

## Driver Login Process

### First Time Login:
1. Driver goes to: `https://distrib-flow-2.preview.emergentagent.com/login`
2. Enters email and the **temporary password** you provided
3. Redirected to `/change-password` page (forced password change)
4. Creates a new secure password
5. Redirected to **My Deliveries** dashboard

### Subsequent Logins:
1. Driver goes to login page
2. Enters email and their **new password**
3. Automatically redirected to `/dashboard/my-deliveries`

---

## What the Driver Can See

After logging in, drivers have access to:

✅ **My Deliveries Page** (`/dashboard/my-deliveries`)
- Active deliveries (out for delivery, packed)
- Completed deliveries (delivered, failed)
- Driver stats (total, success, failed deliveries)

✅ **Settings Page** (`/dashboard/settings`)
- Update profile information
- Change password

❌ **NO ACCESS TO:**
- Orders management
- Products
- Retailers
- Payments
- Reports
- Staff management
- Admin functions

---

## Assigning Orders to Drivers

### Method 1: Via Delivery Board (Recommended)
1. Go to **Dashboard** → **Delivery Board**
2. Find the order you want to assign
3. Click **Edit** or **Assign Driver**
4. Select the driver from dropdown
5. Add vehicle number (optional)
6. Click **Save**

**What Happens:**
- Driver receives **SMS notification** via Termii
- Driver receives **in-app notification**
- Order appears in driver's "My Deliveries" → "Active" tab

### Method 2: Via Orders Page
1. Go to **Dashboard** → **Orders**
2. Click on an order
3. Click **Edit**
4. Set these fields:
   - **Driver ID**: Select from dropdown (if using driver records)
   - **Driver Name**: Enter driver name (fallback method)
   - **Vehicle Number**: Enter vehicle registration
   - **Order Status**: Set to "Dispatched" or "Out for Delivery"
5. Click **Save**

**What Happens:**
- Driver receives **SMS notification**
- Driver receives **in-app notification**
- Retailer receives **SMS about dispatch**

### Method 3: Via API (for integrations)
```bash
curl -X PUT https://distrib-flow-2.preview.emergentagent.com/api/orders/{order-id} \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "order_status": "dispatched",
    "driver_id": "driver-uuid",
    "driver_name": "John Doe",
    "driver_phone": "08012345678",
    "vehicle_number": "ABC-123"
  }'
```

---

## Testing the Driver Flow

### Create a Test Driver:
1. Go to **Staff** page
2. Add new staff with:
   - Name: "Test Driver"
   - Email: "testdriver@example.com"
   - Role: **Driver**
3. Copy the generated password

### Test Login:
1. Open incognito/private window
2. Go to login page
3. Login with test driver credentials
4. Change password when prompted
5. You should see "My Deliveries" page

### Test Delivery Flow:
1. As **Admin**, assign an order to "Test Driver"
2. As **Driver**, refresh My Deliveries page
3. Order should appear in "Active" tab
4. Click **"Capture & Deliver"**
5. Take/upload a photo
6. Add optional note
7. Click **"Confirm Delivery"**
8. Check that order moves to "Completed" tab

---

## Common Issues & Solutions

### Issue 1: Driver can't login
**Solution:** 
- Verify email is correct
- Check if account status is "Active" (not "Inactive")
- Make sure driver is using the temporary password (first login) or their new password

### Issue 2: Driver doesn't see any deliveries
**Solution:**
- Make sure orders are assigned with correct driver_id or driver_name
- Check order status is "out_for_delivery" or "packed"
- Verify driver is logged into correct business account

### Issue 3: SMS not received
**Solution:**
- Check Termii credentials in `.env` file
- Verify driver phone number is in E.164 format (+234...)
- Check Termii dashboard for send status
- Check backend logs: `tail -f /var/log/supervisor/nextjs.out.log`

### Issue 4: "Access Denied" error
**Solution:**
- Verify user role is exactly "driver" (lowercase)
- Check database: `SELECT role FROM users WHERE email = 'driver@email.com'`
- Re-assign role via Staff → Edit if needed

### Issue 5: Photo upload fails
**Solution:**
- Check image file size (must be < 5MB)
- Verify image format (PNG, JPG, JPEG, WEBP only)
- Check Supabase Storage bucket "proof-of-delivery" exists
- Verify storage policies are set correctly

---

## Database Schema Reference

### `users` table:
- `role` ENUM must include 'driver'
- `auth_user_id` links to Supabase Auth

### `drivers` table (optional):
- `user_id` UUID - links to users.id
- `auth_user_id` UUID - links to auth.users.id
- `phone` VARCHAR - driver phone number
- `vehicle_number` VARCHAR
- `total_deliveries` INTEGER
- `successful_deliveries` INTEGER
- `failed_deliveries` INTEGER

### `orders` table:
- `driver_id` UUID - links to drivers.id (preferred)
- `driver_name` VARCHAR - fallback if no driver_id
- `vehicle_number` VARCHAR
- `proof_of_delivery_url` TEXT
- `proof_of_delivery_note` TEXT
- `proof_captured_at` TIMESTAMPTZ

---

## Quick Reference

**Add Driver URL:**
https://distrib-flow-2.preview.emergentagent.com/dashboard/staff

**Driver Login URL:**
https://distrib-flow-2.preview.emergentagent.com/login

**Driver Dashboard URL:**
https://distrib-flow-2.preview.emergentagent.com/dashboard/my-deliveries

**Test Credentials:**
(Use the credentials from `/app/memory/test_credentials.md`)

---

## Summary

✅ **To Add a Driver:**
1. Go to Dashboard → Staff
2. Click "+ Add Staff Member"
3. Fill details and select "Driver" role
4. Copy temporary password
5. Share credentials with driver

✅ **To Assign Orders:**
1. Go to Orders or Delivery Board
2. Edit order
3. Select driver and vehicle
4. Set status to "Dispatched"
5. Driver gets SMS + notification

✅ **Driver Can:**
- View assigned deliveries
- Capture proof photos
- Mark as delivered/failed
- See delivery stats

That's it! Your driver is ready to start deliveries. 🚚
