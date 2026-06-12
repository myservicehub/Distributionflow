#!/usr/bin/env python3
"""
Backend API Test - Order Details 404 Investigation
Testing order details endpoint to diagnose why existing orders return 404
"""

import os
import sys
import json
from supabase import create_client, Client
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv('/app/.env')

SUPABASE_URL = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
BASE_URL = os.getenv('NEXT_PUBLIC_BASE_URL')

# Test credentials
TEST_EMAIL = "eseimieghandoris@yahoo.com"
TEST_PASSWORD = "Doris@1981"

# Known order ID that shows in list but returns 404
KNOWN_ORDER_ID = "7ad9cc8c-23b8-4323-b361-fc1fbf2c0bf0"

def print_section(title):
    """Print a formatted section header"""
    print(f"\n{'='*80}")
    print(f"  {title}")
    print(f"{'='*80}\n")

def main():
    """Main test execution"""
    print("="*80)
    print("  ORDER DETAILS 404 INVESTIGATION")
    print("  Testing why existing orders return 404 when fetching by ID")
    print("="*80)
    print()
    
    try:
        # Initialize Supabase client
        print("📡 Initializing Supabase client...")
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        print("✅ Supabase client initialized")
        print()
        
        # Step 1: Login
        print_section("STEP 1: User Authentication")
        try:
            auth_response = supabase.auth.sign_in_with_password({
                "email": TEST_EMAIL,
                "password": TEST_PASSWORD
            })
            user = auth_response.user
            session = auth_response.session
            print(f"✅ Login successful")
            print(f"   User ID: {user.id}")
            print(f"   Email: {user.email}")
            print()
            
            # Get user profile to check business_id and role
            print("Fetching user profile...")
            user_profile = supabase.table('users').select('*').eq('id', user.id).single().execute()
            if user_profile.data:
                print(f"✅ User profile retrieved")
                print(f"   Business ID: {user_profile.data.get('business_id')}")
                print(f"   Role: {user_profile.data.get('role')}")
                print(f"   Name: {user_profile.data.get('name')}")
                user_business_id = user_profile.data.get('business_id')
                user_role = user_profile.data.get('role')
            else:
                print("❌ Failed to get user profile")
                return
                
        except Exception as e:
            print(f"❌ Login failed: {str(e)}")
            return
        
        # Step 2: Check if order exists in database
        print_section("STEP 2: Check if Order Exists in Database")
        try:
            print(f"Querying order {KNOWN_ORDER_ID} directly from database...")
            order_check = supabase.table('orders').select('*').eq('id', KNOWN_ORDER_ID).execute()
            
            if order_check.data and len(order_check.data) > 0:
                order = order_check.data[0]
                print(f"✅ Order EXISTS in database")
                print(f"   Order ID: {order.get('id')}")
                print(f"   Order Number: {order.get('order_number')}")
                print(f"   Business ID: {order.get('business_id')}")
                print(f"   Sales Rep ID: {order.get('sales_rep_id')}")
                print(f"   Retailer ID: {order.get('retailer_id')}")
                print(f"   Status: {order.get('order_status', order.get('status'))}")
                print(f"   Created: {order.get('created_at')}")
                
                # Check business_id match
                print(f"\n🔍 Business ID Match Check:")
                print(f"   User's business_id: {user_business_id}")
                print(f"   Order's business_id: {order.get('business_id')}")
                if user_business_id == order.get('business_id'):
                    print(f"   ✅ Business IDs MATCH")
                else:
                    print(f"   ❌ Business IDs DO NOT MATCH - This is the issue!")
                
                # Check sales rep match
                print(f"\n🔍 Sales Rep Match Check:")
                print(f"   User's ID: {user.id}")
                print(f"   User's role: {user_role}")
                print(f"   Order's sales_rep_id: {order.get('sales_rep_id')}")
                if user.id == order.get('sales_rep_id'):
                    print(f"   ✅ User IS the sales rep for this order")
                else:
                    print(f"   ⚠️  User is NOT the sales rep for this order")
                    if user_role == 'sales_rep':
                        print(f"   ⚠️  User is a sales_rep but order belongs to different rep")
                        print(f"   ⚠️  This might cause 404 if RLS policies restrict access")
                
            else:
                print(f"❌ Order NOT FOUND in database")
                print(f"   The order {KNOWN_ORDER_ID} does not exist")
                return
                
        except Exception as e:
            print(f"❌ Error checking order: {str(e)}")
            return
        
        # Step 3: Test the join query that the API uses
        print_section("STEP 3: Test API Join Query")
        try:
            print("Testing the exact query used by GET /api/orders/[id]...")
            print("Query: orders with retailers, sales_rep, and order_items joins")
            
            # Create a user-scoped client (not service role)
            user_supabase = create_client(
                SUPABASE_URL,
                os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
                options={
                    'headers': {
                        'Authorization': f'Bearer {session.access_token}'
                    }
                }
            )
            
            # Try the exact query from the API
            result = user_supabase.table('orders').select(
                '*, retailers(shop_name, owner_name, phone, address), '
                'sales_rep:users!orders_sales_rep_id_fkey(name, email), '
                'order_items(*, products(name, sku, unit_price, empty_item_id))'
            ).eq('id', KNOWN_ORDER_ID).eq('business_id', user_business_id).execute()
            
            if result.data and len(result.data) > 0:
                print(f"✅ Join query SUCCESSFUL")
                order_data = result.data[0]
                print(f"   Order retrieved with all joins")
                print(f"   Retailer: {order_data.get('retailers', {}).get('shop_name', 'N/A')}")
                print(f"   Sales Rep: {order_data.get('sales_rep', {}).get('name', 'N/A')}")
                print(f"   Order Items: {len(order_data.get('order_items', []))}")
            else:
                print(f"❌ Join query returned 0 rows (PGRST116)")
                print(f"   This is the 404 error the API returns!")
                print(f"\n🔍 Possible causes:")
                print(f"   1. RLS policy on 'users' table blocks sales_rep join")
                print(f"   2. RLS policy on 'retailers' table blocks retailer join")
                print(f"   3. RLS policy on 'order_items' or 'products' blocks items join")
                print(f"   4. User doesn't have access to orders from other sales reps")
                
        except Exception as e:
            print(f"❌ Join query failed: {str(e)}")
            print(f"   Error type: {type(e).__name__}")
            print(f"   This is likely the root cause of the 404 error")
        
        # Step 4: Test each join individually
        print_section("STEP 4: Test Individual Joins")
        
        # Test retailers join
        print("Testing retailers join...")
        try:
            result = user_supabase.table('orders').select(
                '*, retailers(shop_name, owner_name, phone, address)'
            ).eq('id', KNOWN_ORDER_ID).eq('business_id', user_business_id).execute()
            
            if result.data and len(result.data) > 0:
                print(f"✅ Retailers join WORKS")
                print(f"   Retailer: {result.data[0].get('retailers', {}).get('shop_name', 'N/A')}")
            else:
                print(f"❌ Retailers join FAILED - returns 0 rows")
        except Exception as e:
            print(f"❌ Retailers join ERROR: {str(e)}")
        
        # Test sales_rep join
        print("\nTesting sales_rep join...")
        try:
            result = user_supabase.table('orders').select(
                '*, sales_rep:users!orders_sales_rep_id_fkey(name, email)'
            ).eq('id', KNOWN_ORDER_ID).eq('business_id', user_business_id).execute()
            
            if result.data and len(result.data) > 0:
                print(f"✅ Sales rep join WORKS")
                print(f"   Sales Rep: {result.data[0].get('sales_rep', {}).get('name', 'N/A')}")
            else:
                print(f"❌ Sales rep join FAILED - returns 0 rows")
                print(f"   🔍 This is likely the issue! RLS on 'users' table might be blocking")
        except Exception as e:
            print(f"❌ Sales rep join ERROR: {str(e)}")
            print(f"   🔍 This is likely the issue! RLS policy blocking users table access")
        
        # Test order_items join
        print("\nTesting order_items join...")
        try:
            result = user_supabase.table('orders').select(
                '*, order_items(*, products(name, sku, unit_price, empty_item_id))'
            ).eq('id', KNOWN_ORDER_ID).eq('business_id', user_business_id).execute()
            
            if result.data and len(result.data) > 0:
                print(f"✅ Order items join WORKS")
                print(f"   Items: {len(result.data[0].get('order_items', []))}")
            else:
                print(f"❌ Order items join FAILED - returns 0 rows")
        except Exception as e:
            print(f"❌ Order items join ERROR: {str(e)}")
        
        # Step 5: Test without any joins
        print_section("STEP 5: Test Without Joins")
        try:
            result = user_supabase.table('orders').select('*').eq('id', KNOWN_ORDER_ID).eq('business_id', user_business_id).execute()
            
            if result.data and len(result.data) > 0:
                print(f"✅ Query without joins WORKS")
                print(f"   Order can be retrieved without joins")
                print(f"   🔍 Issue is definitely with one of the joins")
            else:
                print(f"❌ Query without joins FAILED")
                print(f"   🔍 Issue is with base order access, not joins")
        except Exception as e:
            print(f"❌ Query without joins ERROR: {str(e)}")
        
        # Step 6: Recommendations
        print_section("DIAGNOSIS & RECOMMENDATIONS")
        print("Based on the tests above, the issue is likely:")
        print()
        print("1. RLS POLICY ISSUE:")
        print("   - The 'users' table RLS policy might be blocking the sales_rep join")
        print("   - Check RLS policies on: users, retailers, order_items, products tables")
        print("   - Ensure policies allow reading related records for orders")
        print()
        print("2. MISSING SALES REP FILTER:")
        print("   - GET /api/orders (list) has applySalesRepFilter")
        print("   - GET /api/orders/[id] (single) does NOT have this filter")
        print("   - If user is sales_rep, they might not have access to other reps' orders")
        print()
        print("3. RECOMMENDED FIXES:")
        print("   a. Update RLS policies to allow users to read other users in same business")
        print("   b. Add sales_rep filter to single order endpoint (like list endpoint)")
        print("   c. Use adminSupabase client for joins (like in PUT endpoint)")
        print()
        print("4. IMMEDIATE FIX:")
        print("   Modify GET /api/orders/[id] to use adminSupabase for the query")
        print("   This will bypass RLS and allow all joins to work")
        
    except Exception as e:
        print(f"❌ Test failed: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
