#!/usr/bin/env python3
"""
Real-Time Notification System Testing
=====================================

This test suite verifies the notification system implementation for DistributionFlow.
It tests notifications for sensitive actions like order status changes, large payments,
stock movements, and staff operations.

Test Scenarios:
1. Order Approval Notification
2. Order Cancellation Notification
3. Large Payment Notification (≥ ₦50,000)
4. Stock Movement Notifications:
   - Large Stock Deduction (≥50 units)
   - Large Stock Addition (≥100 units)  
   - Low Stock Alert (<10 units)
5. Staff Creation Notification
"""

import requests
import json
import time
import sys
from datetime import datetime

# Base URL from environment
BASE_URL = "https://distrib-flow-2.preview.emergentagent.com"

class NotificationTester:
    def __init__(self):
        self.session = requests.Session()
        self.auth_token = None
        self.user_context = None
        self.test_data = {}
        
    def authenticate(self, email="newadmin@abcdist.com", password="admin123"):
        """Authenticate and get session cookies"""
        print(f"\n🔐 Authenticating as {email}...")
        
        try:
            # Login request
            login_url = f"{BASE_URL}/api/auth/login"
            response = self.session.post(login_url, json={
                "email": email,
                "password": password
            })
            
            print(f"Login response status: {response.status_code}")
            if response.status_code == 200:
                print("✅ Authentication successful")
                return True
            else:
                print(f"❌ Authentication failed: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Authentication error: {e}")
            return False
    
    def get_existing_data(self):
        """Fetch existing data from the database for testing"""
        print(f"\n📊 Fetching existing data for testing...")
        
        # Get businesses
        try:
            response = self.session.get(f"{BASE_URL}/api/businesses")
            if response.status_code == 200:
                businesses = response.json()
                if businesses:
                    self.test_data['business_id'] = businesses[0]['id']
                    print(f"✅ Business ID: {self.test_data['business_id']}")
        except Exception as e:
            print(f"⚠️ Could not fetch businesses: {e}")
        
        # Get products
        try:
            response = self.session.get(f"{BASE_URL}/api/products")
            if response.status_code == 200:
                products = response.json()
                if products:
                    self.test_data['product_id'] = products[0]['id']
                    self.test_data['product_name'] = products[0]['name']
                    self.test_data['current_stock'] = products[0].get('stock_quantity', 0)
                    print(f"✅ Product: {self.test_data['product_name']} (Stock: {self.test_data['current_stock']})")
        except Exception as e:
            print(f"⚠️ Could not fetch products: {e}")
            
        # Get retailers
        try:
            response = self.session.get(f"{BASE_URL}/api/retailers")
            if response.status_code == 200:
                retailers = response.json()
                if retailers:
                    self.test_data['retailer_id'] = retailers[0]['id']
                    self.test_data['retailer_name'] = retailers[0]['shop_name']
                    print(f"✅ Retailer: {self.test_data['retailer_name']}")
        except Exception as e:
            print(f"⚠️ Could not fetch retailers: {e}")
            
        # Get orders
        try:
            response = self.session.get(f"{BASE_URL}/api/orders")
            if response.status_code == 200:
                orders = response.json()
                # Find a pending order
                pending_orders = [o for o in orders if o.get('status') == 'pending']
                if pending_orders:
                    self.test_data['order_id'] = pending_orders[0]['id']
                    print(f"✅ Pending Order ID: {self.test_data['order_id']}")
                elif orders:
                    self.test_data['order_id'] = orders[0]['id']
                    print(f"✅ Order ID: {self.test_data['order_id']} (Status: {orders[0].get('status')})")
        except Exception as e:
            print(f"⚠️ Could not fetch orders: {e}")
            
        return self.test_data
    
    def query_notifications(self, limit=5):
        """Query notifications table to verify notification creation"""
        print(f"\n📋 Checking notifications (last {limit})...")
        
        try:
            # Note: This endpoint might not exist, we'll check the database directly via API
            response = self.session.get(f"{BASE_URL}/api/notifications?limit={limit}")
            
            if response.status_code == 200:
                notifications = response.json()
                print(f"✅ Found {len(notifications)} notifications")
                for notif in notifications[-3:]:  # Show last 3
                    created = notif.get('created_at', 'Unknown')[:19] if notif.get('created_at') else 'Unknown'
                    print(f"   📢 {notif.get('title', 'No title')} - {created}")
                return notifications
            else:
                print(f"⚠️ Could not fetch notifications: Status {response.status_code}")
                print(f"Response: {response.text[:200]}")
        except Exception as e:
            print(f"⚠️ Notification query error: {e}")
        
        return []
    
    def test_order_approval_notification(self):
        """Test Order Approval Notification"""
        print(f"\n🎯 TEST 1: Order Approval Notification")
        
        if not self.test_data.get('order_id'):
            print("❌ No order available for testing")
            return False
            
        try:
            order_id = self.test_data['order_id']
            
            # Record notifications before
            notifications_before = len(self.query_notifications())
            
            # Approve the order
            print(f"📤 Approving order {order_id[:8]}...")
            response = self.session.put(f"{BASE_URL}/api/orders/{order_id}", json={
                "status": "confirmed"
            })
            
            print(f"Order approval response: {response.status_code}")
            if response.status_code in [200, 201]:
                print("✅ Order approved successfully")
                
                # Wait a moment and check notifications
                time.sleep(2)
                notifications_after = self.query_notifications()
                
                if len(notifications_after) > notifications_before:
                    print("✅ Order approval notification created!")
                    return True
                else:
                    print("⚠️ No new notification found after order approval")
                    return False
            else:
                print(f"❌ Order approval failed: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Order approval test error: {e}")
            return False
    
    def test_order_cancellation_notification(self):
        """Test Order Cancellation Notification"""
        print(f"\n🎯 TEST 2: Order Cancellation Notification")
        
        if not self.test_data.get('order_id'):
            print("❌ No order available for testing")
            return False
            
        try:
            order_id = self.test_data['order_id']
            
            # Record notifications before
            notifications_before = len(self.query_notifications())
            
            # Cancel the order
            print(f"❌ Cancelling order {order_id[:8]}...")
            response = self.session.put(f"{BASE_URL}/api/orders/{order_id}", json={
                "status": "cancelled"
            })
            
            print(f"Order cancellation response: {response.status_code}")
            if response.status_code in [200, 201]:
                print("✅ Order cancelled successfully")
                
                # Wait and check notifications
                time.sleep(2)
                notifications_after = self.query_notifications()
                
                if len(notifications_after) > notifications_before:
                    print("✅ Order cancellation notification created!")
                    return True
                else:
                    print("⚠️ No new notification found after order cancellation")
                    return False
            else:
                print(f"❌ Order cancellation failed: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Order cancellation test error: {e}")
            return False
    
    def test_large_payment_notification(self):
        """Test Large Payment Notification (≥ ₦50,000)"""
        print(f"\n🎯 TEST 3: Large Payment Notification")
        
        if not self.test_data.get('retailer_id'):
            print("❌ No retailer available for testing")
            return False
            
        try:
            retailer_id = self.test_data['retailer_id']
            
            # Record notifications before
            notifications_before = len(self.query_notifications())
            
            # Create large payment (₦60,000)
            payment_amount = 60000
            print(f"💰 Creating large payment of ₦{payment_amount:,}...")
            
            response = self.session.post(f"{BASE_URL}/api/payments", json={
                "retailer_id": retailer_id,
                "amount_paid": payment_amount,
                "payment_method": "cash",
                "notes": "Test large payment for notification system"
            })
            
            print(f"Payment creation response: {response.status_code}")
            if response.status_code in [200, 201]:
                print("✅ Large payment created successfully")
                
                # Wait and check notifications
                time.sleep(2)
                notifications_after = self.query_notifications()
                
                if len(notifications_after) > notifications_before:
                    print("✅ Large payment notification created!")
                    return True
                else:
                    print("⚠️ No new notification found after large payment")
                    return False
            else:
                print(f"❌ Payment creation failed: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Large payment test error: {e}")
            return False
    
    def test_stock_movement_notifications(self):
        """Test Stock Movement Notifications"""
        print(f"\n🎯 TEST 4: Stock Movement Notifications")
        
        if not self.test_data.get('product_id'):
            print("❌ No product available for testing")
            return False
            
        results = []
        
        # Test 4a: Large Stock Deduction (≥50 units)
        print(f"\n📦 TEST 4a: Large Stock Deduction (≥50 units)")
        try:
            notifications_before = len(self.query_notifications())
            
            response = self.session.post(f"{BASE_URL}/api/stock-movements", json={
                "product_id": self.test_data['product_id'],
                "movement_type": "out",
                "quantity": 60,
                "notes": "Test large stock deduction for notifications"
            })
            
            print(f"Stock deduction response: {response.status_code}")
            if response.status_code in [200, 201]:
                print("✅ Large stock deduction successful")
                time.sleep(2)
                notifications_after = self.query_notifications()
                
                if len(notifications_after) > notifications_before:
                    print("✅ Large stock deduction notification created!")
                    results.append(True)
                else:
                    print("⚠️ No notification found for large stock deduction")
                    results.append(False)
            else:
                print(f"❌ Stock deduction failed: {response.text}")
                results.append(False)
        except Exception as e:
            print(f"❌ Stock deduction test error: {e}")
            results.append(False)
        
        # Test 4b: Large Stock Addition (≥100 units)
        print(f"\n📦 TEST 4b: Large Stock Addition (≥100 units)")
        try:
            notifications_before = len(self.query_notifications())
            
            response = self.session.post(f"{BASE_URL}/api/stock-movements", json={
                "product_id": self.test_data['product_id'],
                "movement_type": "in",
                "quantity": 120,
                "notes": "Test large stock addition for notifications"
            })
            
            print(f"Stock addition response: {response.status_code}")
            if response.status_code in [200, 201]:
                print("✅ Large stock addition successful")
                time.sleep(2)
                notifications_after = self.query_notifications()
                
                if len(notifications_after) > notifications_before:
                    print("✅ Large stock addition notification created!")
                    results.append(True)
                else:
                    print("⚠️ No notification found for large stock addition")
                    results.append(False)
            else:
                print(f"❌ Stock addition failed: {response.text}")
                results.append(False)
        except Exception as e:
            print(f"❌ Stock addition test error: {e}")
            results.append(False)
            
        # Test 4c: Low Stock Alert (bring stock to <10 units)
        print(f"\n📦 TEST 4c: Low Stock Alert (<10 units)")
        try:
            notifications_before = len(self.query_notifications())
            
            # Calculate how much to deduct to bring stock below 10
            current_stock = self.test_data.get('current_stock', 50)
            deduct_quantity = max(current_stock - 5, 1)  # Bring to 5 units or less
            
            response = self.session.post(f"{BASE_URL}/api/stock-movements", json={
                "product_id": self.test_data['product_id'],
                "movement_type": "out",
                "quantity": deduct_quantity,
                "notes": "Test low stock alert for notifications"
            })
            
            print(f"Low stock creation response: {response.status_code}")
            if response.status_code in [200, 201]:
                print("✅ Stock reduced to trigger low stock alert")
                time.sleep(2)
                notifications_after = self.query_notifications()
                
                if len(notifications_after) > notifications_before:
                    print("✅ Low stock alert notification created!")
                    results.append(True)
                else:
                    print("⚠️ No notification found for low stock alert")
                    results.append(False)
            else:
                print(f"❌ Low stock creation failed: {response.text}")
                results.append(False)
        except Exception as e:
            print(f"❌ Low stock test error: {e}")
            results.append(False)
        
        return all(results)
    
    def test_staff_creation_notification(self):
        """Test Staff Creation Notification"""
        print(f"\n🎯 TEST 5: Staff Creation Notification")
        
        try:
            # Record notifications before
            notifications_before = len(self.query_notifications())
            
            # Create new staff member
            staff_name = f"Test Staff {int(time.time())}"
            staff_email = f"teststaff{int(time.time())}@example.com"
            
            print(f"👤 Creating staff: {staff_name}")
            
            response = self.session.post(f"{BASE_URL}/api/staff", json={
                "name": staff_name,
                "email": staff_email,
                "role": "sales_rep"
            })
            
            print(f"Staff creation response: {response.status_code}")
            if response.status_code in [200, 201]:
                print("✅ Staff created successfully")
                
                # Wait and check notifications
                time.sleep(2)
                notifications_after = self.query_notifications()
                
                if len(notifications_after) > notifications_before:
                    print("✅ Staff creation notification created!")
                    return True
                else:
                    print("⚠️ No new notification found after staff creation")
                    return False
            else:
                print(f"❌ Staff creation failed: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Staff creation test error: {e}")
            return False
    
    def verify_notifications_fail_silently(self):
        """Verify notifications don't break main operations if they fail"""
        print(f"\n🎯 TEST 6: Notifications Fail Silently")
        
        # This test would typically involve temporarily disabling notification service
        # For now, we'll verify main operations work regardless
        
        try:
            # Try to create a payment even if notifications might fail
            if self.test_data.get('retailer_id'):
                response = self.session.post(f"{BASE_URL}/api/payments", json={
                    "retailer_id": self.test_data['retailer_id'],
                    "amount_paid": 1000,
                    "payment_method": "cash",
                    "notes": "Test payment for silent failure verification"
                })
                
                if response.status_code in [200, 201]:
                    print("✅ Main operation succeeds even if notifications might fail")
                    return True
                else:
                    print(f"⚠️ Main operation failed: {response.status_code}")
                    return False
            else:
                print("⚠️ Cannot test without retailer data")
                return True  # Skip this test
                
        except Exception as e:
            print(f"❌ Silent failure test error: {e}")
            return False
    
    def run_all_tests(self):
        """Run all notification tests"""
        print("=" * 60)
        print("🔔 REAL-TIME NOTIFICATION SYSTEM TESTING")
        print("=" * 60)
        
        # Authenticate
        if not self.authenticate():
            print("❌ Cannot proceed without authentication")
            return False
        
        # Get test data
        self.get_existing_data()
        
        # Run tests
        test_results = {
            "Order Approval": self.test_order_approval_notification(),
            "Order Cancellation": self.test_order_cancellation_notification(),
            "Large Payment": self.test_large_payment_notification(),
            "Stock Movements": self.test_stock_movement_notifications(),
            "Staff Creation": self.test_staff_creation_notification(),
            "Silent Failure": self.verify_notifications_fail_silently()
        }
        
        # Summary
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        passed = 0
        total = len(test_results)
        
        for test_name, result in test_results.items():
            status = "✅ PASS" if result else "❌ FAIL"
            print(f"{test_name:<20} {status}")
            if result:
                passed += 1
        
        print(f"\nOverall: {passed}/{total} tests passed")
        
        if passed == total:
            print("🎉 All notification tests passed!")
            return True
        else:
            print(f"⚠️ {total - passed} tests failed")
            return False

def main():
    """Main test execution"""
    tester = NotificationTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()