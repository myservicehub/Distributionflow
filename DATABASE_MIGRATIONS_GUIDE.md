# 📋 Database Migrations Guide

## ⚠️ IMPORTANT: Run These Migrations

Your database is currently missing some tables that are required for certain features to work correctly. Please run the following migrations in your Supabase dashboard.

---

## Migration 1: Product-to-Empty Linking (REQUIRED)

**File**: `/app/database/link_products_to_empties_migration.sql`

**What it does**: Adds the ability to link products to their corresponding empty items. This enables the system to automatically track which empties should be issued when you sell specific products.

**How to run**:
1. Go to your Supabase dashboard
2. Click on "SQL Editor" in the left sidebar
3. Click "New Query"
4. Copy the entire contents of `/app/database/link_products_to_empties_migration.sql`
5. Paste into the SQL editor
6. Click "Run"

**Features enabled after running this**:
- Link products to empty items on the "Product-Empty Links" page
- Automatic empty bottle tracking based on product sales

---

## Migration 2: Subscription System (REQUIRED)

**File**: `/app/database/subscription_system_migration_corrected.sql`

**What it does**: Creates the tables required for the subscription billing system and feature management.

**How to run**:
1. Go to your Supabase dashboard
2. Click on "SQL Editor" in the left sidebar
3. Click "New Query"
4. Copy the entire contents of `/app/database/subscription_system_migration_corrected.sql`
5. Paste into the SQL editor
6. Click "Run"

**Features enabled after running this**:
- Subscription plan management
- Feature-based access control
- Billing integration with Paystack
- Usage tracking

**Note**: After running this migration, you'll need to re-enable the subscription check in the empty bottle module. The check is currently disabled as a workaround.

---

## Verification

After running both migrations, verify they were successful by:

1. **Check for new tables**: In Supabase, go to "Table Editor" and look for:
   - `subscriptions`
   - `subscription_plans`
   - `feature_usage`
   - And others created by the migrations

2. **Check the products table**: Look for the new column `empty_item_id` in the `products` table

3. **Test the features**:
   - Go to `/dashboard/product-empty-links` and try linking a product to an empty
   - Go to `/settings/billing` and check if the subscription information loads

---

## Troubleshooting

**If you get an error**:
- Check if the tables already exist (the migration might have been partially run before)
- Make sure you're running the migrations on the correct database
- Check the error message for specific guidance

**If you're not sure which migrations to run**:
- Run them in the order listed above (Migration 1, then Migration 2)
- It's safe to run them multiple times - they won't duplicate data

---

## Need Help?

If you encounter any issues running these migrations, please check the migration files for comments and instructions, or contact support.
