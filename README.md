# DistributionFlow - FMCG Distribution Management System

A multi-tenant SaaS platform for Nigerian FMCG distributors to manage debt, inventory, orders, and payments.

## 🚀 Features

### Core Functionality
- **Multi-Tenant Architecture** - Complete data isolation using Supabase RLS
- **Role-Based Access Control** - Admin, Manager, Sales Rep, and Warehouse roles
- **Retailer Management** - Track customers, credit limits, and debt aging
- **Inventory Control** - Real-time stock tracking with automatic deductions
- **Order Processing** - Create orders with automatic stock updates
- **Payment Recording** - Track payments and update retailer balances
- **Comprehensive Reports** - Debt aging, sales by rep, and inventory reports
- **Dashboard Analytics** - Real-time business metrics

### Business Logic
- ✅ Automatic retailer blocking when credit limit exceeded
- ✅ Stock cannot go below zero
- ✅ Automatic stock deduction on order confirmation
- ✅ Credit limit validation before order creation
- ✅ Payment recording with automatic balance updates
- ✅ Low stock alerts
- ✅ Debt aging tracking

## 📋 Prerequisites

- Node.js 18+ 
- Supabase account
- Yarn package manager

## 🛠️ Setup Instructions

### 1. Database Setup

**IMPORTANT**: You must execute the SQL schema in Supabase before the application will work.

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `ghleuwwnrerfanyfyclt`
3. Navigate to **SQL Editor** in the left sidebar
4. Click **New Query**
5. Open the file `/database/schema.sql` in this project
6. Copy the **entire contents** and paste into the SQL editor
7. Click **Run** or press `Ctrl+Enter`
8. Wait for completion (should take 2-3 seconds)

### 2. Verify Database Setup

1. Go to **Table Editor** in Supabase Dashboard
2. Verify all tables are created:
   - ✅ businesses
   - ✅ users
   - ✅ retailers
   - ✅ products
   - ✅ stock_movements
   - ✅ orders
   - ✅ order_items
   - ✅ payments
   - ✅ audit_logs

3. Verify RLS is enabled:
   - Click on any table
   - Go to **RLS** tab
   - Ensure "Enable RLS" is ON
   - Check that policies are listed

### 3. Environment Variables

Environment variables are already configured in `.env`:

```
NEXT_PUBLIC_SUPABASE_URL=https://ghleuwwnrerfanyfyclt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_DATABASE_URL=postgresql://postgres.ghleuwwnrerfanyfyclt:...
```

### 4. Install Dependencies

Dependencies are already installed. If you need to reinstall:

```bash
cd /app
yarn install
```

### 5. Start the Application

The application is already running on:
- **Local**: http://localhost:3000
- **Preview**: https://distrib-flow-2.preview.emergentagent.com

## 👥 User Roles & Permissions

### Admin
- Full access to all features
- Create/edit/delete staff
- Manage credit limits
- Delete records
- View all reports
- Manage stock

### Manager
- View all reports
- Approve orders
- Confirm stock movements
- View debts
- Cannot delete records

### Sales Rep
- Create orders
- Record payments
- View assigned retailers
- Cannot manage stock directly

### Warehouse
- Confirm deliveries
- Record stock in
- Adjust inventory
- Cannot create orders

## 🎯 Getting Started

### First-Time Setup

1. **Execute Database Schema** (Most Important!)
   - Follow the "Database Setup" section above
   - Without this, the application will not work

2. **Create Your Account**
   - Go to the signup page
   - Fill in your business details
   - Your account will be created as Admin

3. **Add Products**
   - Navigate to Products
   - Click "Add Product"
   - Enter product details and stock quantity

4. **Add Retailers**
   - Navigate to Retailers
   - Click "Add Retailer"
   - Set credit limits for each retailer

5. **Create Orders**
   - Navigate to Orders
   - Click "New Order"
   - Select retailer and products
   - Choose payment method (Paid/Credit/Partial)
   - Stock is automatically deducted

6. **Record Payments**
   - Navigate to Payments
   - Click "Record Payment"
   - Select retailer with outstanding balance
   - Enter payment amount
   - Balance is automatically updated

## 📊 Application Flow

### Order Processing
1. Sales rep creates order
2. Selects retailer (blocked retailers cannot receive credit orders)
3. Adds products to order
4. System checks:
   - Stock availability
   - Credit limit (if payment is credit)
5. Order confirmed automatically
6. Stock deducted
7. Retailer balance updated (if credit)
8. Stock movements recorded

### Payment Recording
1. Sales rep/manager records payment
2. Selects retailer
3. Enters payment amount
4. Retailer balance reduced
5. If balance falls below credit limit, retailer unblocked

### Credit Control
- Retailer with balance > credit limit = BLOCKED
- Blocked retailers cannot place new credit orders
- Only cash/paid orders allowed for blocked retailers
- Automatic unblocking when payment reduces balance

## 🔒 Security Features

### Multi-Tenant Isolation
- All tables include `business_id`
- Row Level Security (RLS) enforced at database level
- Users can only access their own business data
- No cross-tenant data leakage

### Authentication
- Supabase Auth with email/password
- Automatic business creation on signup
- Session management with secure cookies
- Protected routes with middleware

## 📱 Pages Overview

| Page | Route | Description |
|------|-------|-------------|
| Landing | `/` | Public homepage |
| Signup | `/signup` | Create business account |
| Login | `/login` | User authentication |
| Dashboard | `/dashboard` | Business metrics overview |
| Retailers | `/dashboard/retailers` | Manage customers |
| Products | `/dashboard/products` | Manage inventory |
| Orders | `/dashboard/orders` | Process orders |
| Payments | `/dashboard/payments` | Record payments |
| Reports | `/dashboard/reports` | Business analytics |
| Settings | `/dashboard/settings` | Account info |

## 🧪 Testing

To test the application:

1. **Sign Up**
   ```
   - Go to /signup
   - Create a test business
   - Login automatically after signup
   ```

2. **Add Test Data**
   ```
   - Add 2-3 products with stock
   - Add 2-3 retailers with credit limits
   ```

3. **Test Order Flow**
   ```
   - Create a paid order (stock should deduct)
   - Create a credit order (balance should increase)
   - Try to exceed credit limit (should fail)
   ```

4. **Test Payment Flow**
   ```
   - Record payment for retailer with balance
   - Verify balance is reduced
   - Check if retailer is unblocked
   ```

5. **Check Reports**
   ```
   - View debt aging report
   - Check sales by rep
   - Review inventory report
   ```

## 📈 Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TailwindCSS
- **UI Components**: shadcn/ui, Radix UI
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Security**: Row Level Security (RLS)
- **Deployment**: Vercel-ready

## 🚨 Important Notes

1. **Database Schema is Required**
   - The application will NOT work without executing the SQL schema
   - This is the FIRST step after setup

2. **Credit Limit Logic**
   - Retailers are automatically blocked when balance > credit limit
   - This happens via database trigger
   - Blocking is instant

3. **Stock Management**
   - Stock is deducted immediately when order is confirmed
   - Stock cannot go negative
   - Low stock alerts trigger automatically

4. **Multi-Tenant Security**
   - All queries are filtered by business_id
   - RLS policies enforce this at database level
   - No business can see another's data

## 📝 Database Schema

See `/database/schema.sql` for complete schema including:
- All table definitions
- Indexes for performance
- RLS policies for security
- Triggers for automation
- Foreign key relationships

## 🆘 Troubleshooting

### "Failed to load data"
- Check if database schema is executed
- Verify Supabase credentials in .env
- Check browser console for errors

### "Retailer is blocked"
- Check retailer's current balance vs credit limit
- Record payment to reduce balance
- Manual unblock in Retailers page

### "Insufficient stock"
- Check product stock quantity
- Update stock in Products page
- Record stock-in movement

## 📞 Support

For issues or questions:
1. Check database schema is executed
2. Verify RLS policies are active
3. Check browser console for errors
4. Review Supabase logs

## 🎉 Success Criteria

Application is working correctly when you can:
- ✅ Sign up and create business
- ✅ Add products with stock
- ✅ Add retailers with credit limits
- ✅ Create orders (stock deducts)
- ✅ See retailer balance increase (credit orders)
- ✅ Record payments (balance reduces)
- ✅ View dashboard metrics
- ✅ See reports with data

---

**Built for Nigerian FMCG Distributors** 🇳🇬

Built with ❤️ using Next.js, Supabase, and shadcn/ui
