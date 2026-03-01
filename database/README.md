# Database Setup Instructions

## Step 1: Execute Schema in Supabase

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project: `ghleuwwnrerfanyfyclt`
3. Navigate to **SQL Editor** in the left sidebar
4. Click **New Query**
5. Copy the entire contents of `schema.sql` file
6. Paste into the SQL editor
7. Click **Run** or press `Ctrl+Enter`

## Step 2: Verify Tables Created

1. Go to **Table Editor** in Supabase Dashboard
2. You should see all tables:
   - businesses
   - users
   - retailers
   - products
   - stock_movements
   - orders
   - order_items
   - payments
   - audit_logs

## Step 3: Verify RLS is Enabled

1. Click on any table (e.g., `businesses`)
2. Go to the **RLS** tab
3. Verify that "Enable RLS" is toggled ON
4. Check that policies are listed

## Multi-Tenant Architecture

All tables include `business_id` for data isolation. Row Level Security (RLS) policies ensure:
- Users can only access data from their own business
- Role-based permissions are enforced at the database level
- No business can see another business's data

## Role Permissions Summary

### Admin
- Full access to all features
- Can create/edit/delete staff
- Can manage credit limits
- Can delete records

### Manager
- View all reports
- Approve orders
- Confirm stock movements
- Cannot delete records

### Sales Rep
- Create orders
- Record payments
- View assigned retailers only (enforced in app logic)
- Cannot manage stock directly

### Warehouse
- Confirm deliveries
- Record stock in
- Adjust inventory
- Cannot create orders
