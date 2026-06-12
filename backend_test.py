#!/usr/bin/env python3
"""
Backend API Testing Script for Delivery Board Workflow
Tests action-based updates: pack, dispatch, deliver
"""

import os
import sys
import requests
from supabase import create_client, Client
from datetime import datetime

# Configuration
BASE_URL = "https://distrib-flow-2.preview.emergentagent.com"
API_URL = f"{BASE_URL}/api"

# Supabase Configuration
SUPABASE_URL = "https://ghleuwwnrerfanyfyclt.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdobGV1d3ducmVyZmFueWZ5Y2x0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzNDQ1NTksImV4cCI6MjA4NzkyMDU1OX0.5pFbmyonMfNjE7CE-FQDco3IxYiBD0lKMY75QqJTIW8"

# Test Credentials
TEST_EMAIL = "eseimieghandoris@yahoo.com"
TEST_PASSWORD = "Doris@1981"

def print_test_header(test_name):
    """Print a formatted test header"""
    print(f"\n{'='*80}")
    print(f"TEST: {test_name}")
    print(f"{'='*80}")

def print_result(success, message):
    """Print test result"""
    status = "✅ PASS" if success else "❌ FAIL"
    print(f"{status}: {message}")

def login_and_get_session():
    """Login and get session cookies"""
    print_test_header("Authentication - Login")
    
    try:
        # Create Supabase client
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        
        # Sign in
        response = supabase.auth.sign_in_with_password({
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        
        if response.user:
            print_result(True, f"Logged in as {TEST_EMAIL}")
            print(f"User ID: {response.user.id}")
            
            # Get session token
            session = supabase.auth.get_session()
            if session:
                access_token = session.access_token
                print_result(True, "Session token obtained")
                return access_token, response.user.id
            else:
                print_result(False, "Failed to get session")
                return None, None
        else:
            print_result(False, "Login failed")
            return None, None
            
    except Exception as e:
        print_result(False, f"Login error: {str(e)}")
        return None, None

def get_confirmed_order(access_token):
    """Get an existing confirmed order"""
    print_test_header("Get Confirmed Order")
    
    try:
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        supabase.auth.set_session(access_token, access_token)
        
        # Try to find an existing confirmed order
        response = supabase.table('orders').select('*').eq('order_status', 'confirmed').limit(1).execute()
        
        if response.data and len(response.data) > 0:
            order = response.data[0]
            print_result(True, f"Found existing confirmed order: {order['id']}")
            print(f"Order Number: {order.get('order_number', 'N/A')}")
            print(f"Order Status: {order.get('order_status', 'N/A')}")
            print(f"Delivery Status: {order.get('delivery_status', 'N/A')}")
            print(f"Business ID: {order.get('business_id', 'N/A')}")
            return order['id'], order.get('business_id')
        else:
            print_result(False, "No confirmed orders found. Trying to find any order...")
            
            # Try to find any order
            response = supabase.table('orders').select('*').limit(1).execute()
            if response.data and len(response.data) > 0:
                order = response.data[0]
                print_result(True, f"Found order: {order['id']}")
                print(f"Order Number: {order.get('order_number', 'N/A')}")
                print(f"Order Status: {order.get('order_status', 'N/A')}")
                print(f"Delivery Status: {order.get('delivery_status', 'N/A')}")
                return order['id'], order.get('business_id')
            else:
                print_result(False, "No orders found in database")
                return None, None
            
    except Exception as e:
        print_result(False, f"Error getting order: {str(e)}")
        return None, None

def reset_order_to_confirmed(access_token, order_id):
    """Reset order to confirmed status for testing"""
    print_test_header("Reset Order to Confirmed Status")
    
    try:
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        supabase.auth.set_session(access_token, access_token)
        
        # Reset order to confirmed status
        response = supabase.table('orders').update({
            'order_status': 'confirmed',
            'status': 'confirmed',
            'delivery_status': 'not_started',
            'packed_at': None,
            'dispatched_at': None,
            'delivered_at': None,
            'driver_name': None,
            'vehicle_number': None
        }).eq('id', order_id).execute()
        
        if response.data:
            print_result(True, "Order reset to confirmed status")
            return True
        else:
            print_result(False, "Failed to reset order")
            return False
            
    except Exception as e:
        print_result(False, f"Error resetting order: {str(e)}")
        return False

def test_pack_action(access_token, order_id):
    """Test pack action"""
    print_test_header("Test Pack Action")
    
    try:
        headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json'
        }
        
        payload = {
            'action': 'pack'
        }
        
        response = requests.put(
            f"{API_URL}/orders/{order_id}",
            json=payload,
            headers=headers
        )
        
        print(f"Response Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            order = data.get('data', {})
            
            # Verify delivery_status is 'packed'
            delivery_status = order.get('delivery_status')
            packed_at = order.get('packed_at')
            
            print(f"Delivery Status: {delivery_status}")
            print(f"Packed At: {packed_at}")
            
            success = True
            
            if delivery_status == 'packed':
                print_result(True, "Pack action successful - delivery_status updated to 'packed'")
            else:
                print_result(False, f"Pack action failed - delivery_status is '{delivery_status}' instead of 'packed'")
                success = False
                
            if packed_at:
                print_result(True, "Packed timestamp set")
            else:
                print_result(False, "Packed timestamp not set")
                success = False
                
            return success
        else:
            print_result(False, f"Pack action failed with status {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print_result(False, f"Error testing pack action: {str(e)}")
        return False

def test_dispatch_action(access_token, order_id):
    """Test dispatch action"""
    print_test_header("Test Dispatch Action")
    
    try:
        headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json'
        }
        
        payload = {
            'action': 'dispatch',
            'driver_name': 'Test Driver',
            'vehicle_number': 'ABC123'
        }
        
        response = requests.put(
            f"{API_URL}/orders/{order_id}",
            json=payload,
            headers=headers
        )
        
        print(f"Response Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            order = data.get('data', {})
            
            # Verify delivery_status is 'out_for_delivery'
            delivery_status = order.get('delivery_status')
            dispatched_at = order.get('dispatched_at')
            driver_name = order.get('driver_name')
            vehicle_number = order.get('vehicle_number')
            
            print(f"Delivery Status: {delivery_status}")
            print(f"Dispatched At: {dispatched_at}")
            print(f"Driver Name: {driver_name}")
            print(f"Vehicle Number: {vehicle_number}")
            
            success = True
            
            if delivery_status == 'out_for_delivery':
                print_result(True, "Dispatch action successful - delivery_status updated to 'out_for_delivery'")
            else:
                print_result(False, f"Dispatch action failed - delivery_status is '{delivery_status}' instead of 'out_for_delivery'")
                success = False
                
            if dispatched_at:
                print_result(True, "Dispatched timestamp set")
            else:
                print_result(False, "Dispatched timestamp not set")
                success = False
                
            if driver_name == 'Test Driver':
                print_result(True, "Driver name saved correctly")
            else:
                print_result(False, f"Driver name is '{driver_name}' instead of 'Test Driver'")
                success = False
                
            if vehicle_number == 'ABC123':
                print_result(True, "Vehicle number saved correctly")
            else:
                print_result(False, f"Vehicle number is '{vehicle_number}' instead of 'ABC123'")
                success = False
                
            return success
        else:
            print_result(False, f"Dispatch action failed with status {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print_result(False, f"Error testing dispatch action: {str(e)}")
        return False

def test_deliver_action(access_token, order_id):
    """Test deliver action"""
    print_test_header("Test Deliver Action")
    
    try:
        headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json'
        }
        
        payload = {
            'action': 'deliver'
        }
        
        response = requests.put(
            f"{API_URL}/orders/{order_id}",
            json=payload,
            headers=headers
        )
        
        print(f"Response Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            order = data.get('data', {})
            
            # Verify delivery_status is 'delivered' and order_status is 'completed'
            delivery_status = order.get('delivery_status')
            order_status = order.get('order_status')
            status = order.get('status')  # Old column
            delivered_at = order.get('delivered_at')
            
            print(f"Delivery Status: {delivery_status}")
            print(f"Order Status (new): {order_status}")
            print(f"Status (old): {status}")
            print(f"Delivered At: {delivered_at}")
            
            success = True
            
            if delivery_status == 'delivered':
                print_result(True, "Deliver action successful - delivery_status updated to 'delivered'")
            else:
                print_result(False, f"Deliver action failed - delivery_status is '{delivery_status}' instead of 'delivered'")
                success = False
                
            if order_status == 'completed':
                print_result(True, "Order status (new column) updated to 'completed'")
            else:
                print_result(False, f"Order status (new column) is '{order_status}' instead of 'completed'")
                success = False
                
            if status == 'completed':
                print_result(True, "Status (old column) updated to 'completed'")
            else:
                print_result(False, f"Status (old column) is '{status}' instead of 'completed'")
                success = False
                
            if delivered_at:
                print_result(True, "Delivered timestamp set")
            else:
                print_result(False, "Delivered timestamp not set")
                success = False
                
            return success
        else:
            print_result(False, f"Deliver action failed with status {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print_result(False, f"Error testing deliver action: {str(e)}")
        return False

def verify_database_columns(access_token, order_id):
    """Verify both old and new database columns are updated"""
    print_test_header("Verify Database Columns")
    
    try:
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        supabase.auth.set_session(access_token, access_token)
        
        response = supabase.table('orders').select('status, order_status, delivery_status').eq('id', order_id).single().execute()
        
        if response.data:
            status = response.data.get('status')
            order_status = response.data.get('order_status')
            delivery_status = response.data.get('delivery_status')
            
            print(f"Status (old column): {status}")
            print(f"Order Status (new column): {order_status}")
            print(f"Delivery Status: {delivery_status}")
            
            # Both columns should be 'completed'
            if status == 'completed' and order_status == 'completed':
                print_result(True, "Both old and new status columns updated correctly")
                return True
            else:
                print_result(False, f"Column mismatch - status: {status}, order_status: {order_status}")
                return False
        else:
            print_result(False, "Failed to verify database columns")
            return False
            
    except Exception as e:
        print_result(False, f"Error verifying database columns: {str(e)}")
        return False

def test_unauthorized_access(order_id):
    """Test with unauthorized role (no auth token)"""
    print_test_header("Test Unauthorized Access")
    
    try:
        headers = {
            'Content-Type': 'application/json'
        }
        
        payload = {
            'action': 'pack'
        }
        
        response = requests.put(
            f"{API_URL}/orders/{order_id}",
            json=payload,
            headers=headers
        )
        
        print(f"Response Status: {response.status_code}")
        
        # Should return 401 or 403 or redirect (307)
        if response.status_code in [401, 403, 307]:
            print_result(True, f"Unauthorized access correctly blocked with status {response.status_code}")
            return True
        else:
            print_result(False, f"Expected 401/403/307 but got {response.status_code}")
            return False
            
    except Exception as e:
        print_result(False, f"Error testing unauthorized access: {str(e)}")
        return False

def main():
    """Main test execution"""
    print("\n" + "="*80)
    print("DELIVERY BOARD WORKFLOW - ACTION-BASED UPDATES TESTING")
    print("="*80)
    
    # Track test results
    tests_passed = 0
    tests_failed = 0
    
    # Step 1: Login
    access_token, user_id = login_and_get_session()
    if not access_token:
        print("\n❌ CRITICAL: Authentication failed. Cannot proceed with tests.")
        sys.exit(1)
    tests_passed += 1
    
    # Step 2: Get confirmed order
    order_id, business_id = get_confirmed_order(access_token)
    if not order_id:
        print("\n❌ CRITICAL: No orders available. Cannot proceed with tests.")
        sys.exit(1)
    tests_passed += 1
    
    # Step 3: Reset order to confirmed status
    if reset_order_to_confirmed(access_token, order_id):
        tests_passed += 1
    else:
        tests_failed += 1
    
    # Step 4: Test pack action
    if test_pack_action(access_token, order_id):
        tests_passed += 1
    else:
        tests_failed += 1
    
    # Step 5: Test dispatch action
    if test_dispatch_action(access_token, order_id):
        tests_passed += 1
    else:
        tests_failed += 1
    
    # Step 6: Test deliver action
    if test_deliver_action(access_token, order_id):
        tests_passed += 1
    else:
        tests_failed += 1
    
    # Step 7: Verify database columns
    if verify_database_columns(access_token, order_id):
        tests_passed += 1
    else:
        tests_failed += 1
    
    # Step 8: Test unauthorized access
    if test_unauthorized_access(order_id):
        tests_passed += 1
    else:
        tests_failed += 1
    
    # Print summary
    print("\n" + "="*80)
    print("TEST SUMMARY")
    print("="*80)
    print(f"Total Tests: {tests_passed + tests_failed}")
    print(f"✅ Passed: {tests_passed}")
    print(f"❌ Failed: {tests_failed}")
    print(f"Pass Rate: {(tests_passed / (tests_passed + tests_failed) * 100):.1f}%")
    print("="*80)
    
    if tests_failed == 0:
        print("\n🎉 ALL TESTS PASSED! Delivery board workflow is working correctly.")
        sys.exit(0)
    else:
        print(f"\n⚠️  {tests_failed} TEST(S) FAILED. Please review the failures above.")
        sys.exit(1)

if __name__ == "__main__":
    main()
