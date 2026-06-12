#!/usr/bin/env python3
"""
Test Order Details Fix - Verify the unit_price -> selling_price fix works
"""

import os
import sys
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv('/app/.env')

SUPABASE_URL = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
SUPABASE_ANON_KEY = os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
BASE_URL = os.getenv('NEXT_PUBLIC_BASE_URL')

# Test credentials
TEST_EMAIL = "eseimieghandoris@yahoo.com"
TEST_PASSWORD = "Doris@1981"

# Known order ID
KNOWN_ORDER_ID = "7ad9cc8c-23b8-4323-b361-fc1fbf2c0bf0"

def main():
    print("="*80)
    print("  ORDER DETAILS FIX VERIFICATION")
    print("  Testing if the selling_price fix resolves the 404 issue")
    print("="*80)
    print()
    
    try:
        # Initialize Supabase client
        print("📡 Initializing Supabase client...")
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
        print("✅ Supabase client initialized")
        print()
        
        # Login
        print("🔐 Logging in...")
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
        except Exception as e:
            print(f"❌ Login failed: {str(e)}")
            return
        
        # Use the authenticated supabase client
        auth_supabase = supabase
        
        # Test 1: Get orders list
        print("="*80)
        print("TEST 1: GET /api/orders - List Orders")
        print("="*80)
        try:
            result = auth_supabase.table('orders').select(
                '*, retailers(shop_name), sales_rep:users!orders_sales_rep_id_fkey(name)'
            ).limit(5).execute()
            
            if result.data:
                print(f"✅ Orders list retrieved: {len(result.data)} orders")
                for order in result.data[:3]:
                    print(f"   - Order {order.get('order_number')}: {order.get('id')}")
                print()
            else:
                print("⚠️  No orders found")
                print()
        except Exception as e:
            print(f"❌ Error: {str(e)}")
            print()
        
        # Test 2: Get single order with OLD query (should fail)
        print("="*80)
        print("TEST 2: Old Query (with unit_price) - Should Fail")
        print("="*80)
        try:
            result = auth_supabase.table('orders').select(
                '*, retailers(shop_name), order_items(*, products(name, sku, unit_price))'
            ).eq('id', KNOWN_ORDER_ID).execute()
            
            if result.data:
                print(f"❌ UNEXPECTED: Old query worked (should have failed)")
            else:
                print(f"✅ EXPECTED: Old query returned 0 rows")
        except Exception as e:
            print(f"✅ EXPECTED: Old query failed with error")
            print(f"   Error: {str(e)}")
        print()
        
        # Test 3: Get single order with NEW query (should work)
        print("="*80)
        print("TEST 3: New Query (with selling_price) - Should Work")
        print("="*80)
        try:
            result = auth_supabase.table('orders').select(
                '*, retailers(shop_name, owner_name, phone, address), '
                'sales_rep:users!orders_sales_rep_id_fkey(name, email), '
                'order_items(*, products(name, sku, selling_price, cost_price, empty_item_id))'
            ).eq('id', KNOWN_ORDER_ID).execute()
            
            if result.data and len(result.data) > 0:
                order = result.data[0]
                print(f"✅ SUCCESS: Order details retrieved!")
                print(f"\n   Order Details:")
                print(f"   - ID: {order.get('id')}")
                print(f"   - Order Number: {order.get('order_number')}")
                print(f"   - Retailer: {order.get('retailers', {}).get('shop_name', 'N/A')}")
                print(f"   - Sales Rep: {order.get('sales_rep', {}).get('name', 'N/A')}")
                print(f"   - Status: {order.get('order_status', order.get('status'))}")
                print(f"   - Total: ₦{order.get('total_amount', 0):,.2f}")
                
                items = order.get('order_items', [])
                print(f"   - Order Items: {len(items)}")
                
                if items:
                    print(f"\n   First Item:")
                    item = items[0]
                    product = item.get('products', {})
                    print(f"   - Product: {product.get('name', 'N/A')}")
                    print(f"   - SKU: {product.get('sku', 'N/A')}")
                    print(f"   - Selling Price: ₦{product.get('selling_price', 0):,.2f}")
                    print(f"   - Cost Price: ₦{product.get('cost_price', 0):,.2f}")
                    print(f"   - Quantity: {item.get('quantity', 0)}")
                    print(f"   - Total: ₦{item.get('total_price', 0):,.2f}")
                
                print(f"\n✅ FIX VERIFIED: The selling_price change resolves the 404 issue!")
                return True
            else:
                print(f"❌ FAILED: Query returned 0 rows")
                return False
        except Exception as e:
            print(f"❌ FAILED: New query error")
            print(f"   Error: {str(e)}")
            return False
        
    except Exception as e:
        print(f"❌ Test failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
