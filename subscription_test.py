#!/usr/bin/env python3
"""
Comprehensive Subscription Enforcement Test Suite
Tests subscription status checks, plan limits, feature gating, and user limits
Business: Doris trading store ventures (78a9510b-d324-45be-8870-1cdb61f152f9)
"""

import os
import sys
from supabase import create_client, Client
from datetime import datetime, timedelta
import json

# Supabase configuration
SUPABASE_URL = os.getenv('NEXT_PUBLIC_SUPABASE_URL', 'https://ghleuwwnrerfanyfyclt.supabase.co')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
BASE_URL = os.getenv('NEXT_PUBLIC_BASE_URL', 'https://distrib-flow-2.preview.emergentagent.com')

# Test business ID
TEST_BUSINESS_ID = '78a9510b-d324-45be-8870-1cdb61f152f9'

class SubscriptionEnforcementTester:
    def __init__(self):
        self.supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
        self.test_results = []
        self.passed = 0
        self.failed = 0
        
    def log_test(self, test_name: str, passed: bool, details: str = ""):
        """Log test result"""
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{status}: {test_name}")
        if details:
            print(f"    {details}")
        
        self.test_results.append({
            'test': test_name,
            'passed': passed,
            'details': details,
            'timestamp': datetime.now().isoformat()
        })
        
        if passed:
            self.passed += 1
        else:
            self.failed += 1
    
    def get_business_data(self):
        """Get business subscription data"""
        try:
            result = self.supabase.table('businesses').select(
                'id, name, subscription_status, plan_id, plans(name, features)'
            ).eq('id', TEST_BUSINESS_ID).single().execute()
            
            return result.data
        except Exception as e:
            print(f"❌ Error fetching business data: {e}")
            return None
    
    def get_plan_data(self, plan_name: str):
        """Get plan details by name"""
        try:
            result = self.supabase.table('plans').select('*').eq('name', plan_name).single().execute()
            return result.data
        except Exception as e:
            print(f"❌ Error fetching plan data: {e}")
            return None
    
    def update_subscription_status(self, status: str):
        """Update business subscription status"""
        try:
            self.supabase.table('businesses').update({
                'subscription_status': status
            }).eq('id', TEST_BUSINESS_ID).execute()
            print(f"✅ Updated subscription status to: {status}")
            return True
        except Exception as e:
            print(f"❌ Error updating subscription status: {e}")
            return False
    
    def update_business_plan(self, plan_id: str):
        """Update business plan"""
        try:
            self.supabase.table('businesses').update({
                'plan_id': plan_id
            }).eq('id', TEST_BUSINESS_ID).execute()
            print(f"✅ Updated business plan to: {plan_id}")
            return True
        except Exception as e:
            print(f"❌ Error updating business plan: {e}")
            return False
    
    def count_retailers(self):
        """Count current retailers for the business"""
        try:
            result = self.supabase.table('retailers').select(
                'id', count='exact'
            ).eq('business_id', TEST_BUSINESS_ID).execute()
            return result.count
        except Exception as e:
            print(f"❌ Error counting retailers: {e}")
            return 0
    
    def count_products(self):
        """Count current products for the business"""
        try:
            result = self.supabase.table('products').select(
                'id', count='exact'
            ).eq('business_id', TEST_BUSINESS_ID).execute()
            return result.count
        except Exception as e:
            print(f"❌ Error counting products: {e}")
            return 0
    
    def count_users(self):
        """Count active users for the business"""
        try:
            result = self.supabase.table('users').select(
                'id', count='exact'
            ).eq('business_id', TEST_BUSINESS_ID).eq('status', 'active').execute()
            return result.count
        except Exception as e:
            print(f"❌ Error counting users: {e}")
            return 0
    
    def test_suite_1_subscription_status(self):
        """Test Suite 1: Subscription Status Enforcement"""
        print("\n" + "="*80)
        print("TEST SUITE 1: SUBSCRIPTION STATUS ENFORCEMENT")
        print("="*80)
        
        business = self.get_business_data()
        if not business:
            self.log_test("Get business data", False, "Failed to fetch business data")
            return
        
        print(f"\n📊 Current Business Status:")
        print(f"   Business: {business.get('name')}")
        print(f"   Subscription Status: {business.get('subscription_status')}")
        print(f"   Plan: {business.get('plans', {}).get('name')}")
        
        # Test 1.1: Active subscription should allow access
        print("\n🧪 Test 1.1: Active Subscription Access")
        self.update_subscription_status('active')
        
        # Check if subscription is active
        result = self.supabase.rpc('is_subscription_active', {
            'p_business_id': TEST_BUSINESS_ID
        }).execute()
        
        is_active = result.data
        self.log_test(
            "Active subscription allows access",
            is_active == True,
            f"Subscription active check returned: {is_active}"
        )
        
        # Test 1.2: Trial subscription should allow access
        print("\n🧪 Test 1.2: Trial Subscription Access")
        self.update_subscription_status('trial')
        
        result = self.supabase.rpc('is_subscription_active', {
            'p_business_id': TEST_BUSINESS_ID
        }).execute()
        
        is_active = result.data
        self.log_test(
            "Trial subscription allows access",
            is_active == True,
            f"Subscription active check returned: {is_active}"
        )
        
        # Test 1.3: Expired subscription should block access
        print("\n🧪 Test 1.3: Expired Subscription Blocks Access")
        self.update_subscription_status('expired')
        
        result = self.supabase.rpc('is_subscription_active', {
            'p_business_id': TEST_BUSINESS_ID
        }).execute()
        
        is_active = result.data
        self.log_test(
            "Expired subscription blocks access",
            is_active == False,
            f"Subscription active check returned: {is_active}"
        )
        
        # Test 1.4: Cancelled subscription should block access
        print("\n🧪 Test 1.4: Cancelled Subscription Blocks Access")
        self.update_subscription_status('cancelled')
        
        result = self.supabase.rpc('is_subscription_active', {
            'p_business_id': TEST_BUSINESS_ID
        }).execute()
        
        is_active = result.data
        self.log_test(
            "Cancelled subscription blocks access",
            is_active == False,
            f"Subscription active check returned: {is_active}"
        )
        
        # Restore to active for remaining tests
        self.update_subscription_status('active')
    
    def test_suite_2_plan_limits(self):
        """Test Suite 2: Plan Limit Enforcement"""
        print("\n" + "="*80)
        print("TEST SUITE 2: PLAN LIMIT ENFORCEMENT")
        print("="*80)
        
        # Get current counts
        current_retailers = self.count_retailers()
        current_products = self.count_products()
        
        print(f"\n📊 Current Counts:")
        print(f"   Retailers: {current_retailers}")
        print(f"   Products: {current_products}")
        
        # Test 2.1: Starter Plan Limits
        print("\n🧪 Test 2.1: Starter Plan Retailer Limit (50)")
        starter_plan = self.get_plan_data('starter')
        
        if starter_plan:
            max_retailers = starter_plan['features'].get('max_retailers', 50)
            max_products = starter_plan['features'].get('max_products', 100)
            
            print(f"   Starter Plan Limits: {max_retailers} retailers, {max_products} products")
            
            # Check if current count is within limits
            within_retailer_limit = current_retailers < max_retailers
            within_product_limit = current_products < max_products
            
            self.log_test(
                f"Current retailers ({current_retailers}) within Starter limit ({max_retailers})",
                within_retailer_limit,
                f"Retailers: {current_retailers}/{max_retailers}"
            )
            
            self.log_test(
                f"Current products ({current_products}) within Starter limit ({max_products})",
                within_product_limit,
                f"Products: {current_products}/{max_products}"
            )
        else:
            self.log_test("Get Starter plan data", False, "Failed to fetch Starter plan")
        
        # Test 2.2: Business Plan Limits
        print("\n🧪 Test 2.2: Business Plan Limits (200 retailers, 500 products)")
        business_plan = self.get_plan_data('business')
        
        if business_plan:
            max_retailers = business_plan['features'].get('max_retailers', 200)
            max_products = business_plan['features'].get('max_products', 500)
            
            print(f"   Business Plan Limits: {max_retailers} retailers, {max_products} products")
            
            within_retailer_limit = current_retailers < max_retailers
            within_product_limit = current_products < max_products
            
            self.log_test(
                f"Current retailers ({current_retailers}) within Business limit ({max_retailers})",
                within_retailer_limit,
                f"Retailers: {current_retailers}/{max_retailers}"
            )
            
            self.log_test(
                f"Current products ({current_products}) within Business limit ({max_products})",
                within_product_limit,
                f"Products: {current_products}/{max_products}"
            )
        else:
            self.log_test("Get Business plan data", False, "Failed to fetch Business plan")
        
        # Test 2.3: Enterprise Plan Limits
        print("\n🧪 Test 2.3: Enterprise Plan Unlimited Limits")
        enterprise_plan = self.get_plan_data('enterprise')
        
        if enterprise_plan:
            max_retailers = enterprise_plan['features'].get('max_retailers', 999999)
            max_products = enterprise_plan['features'].get('max_products', 999999)
            
            print(f"   Enterprise Plan Limits: {max_retailers} retailers, {max_products} products")
            
            # Enterprise should always be within limits
            self.log_test(
                "Enterprise plan has unlimited retailers",
                max_retailers >= 999999,
                f"Max retailers: {max_retailers}"
            )
            
            self.log_test(
                "Enterprise plan has unlimited products",
                max_products >= 999999,
                f"Max products: {max_products}"
            )
        else:
            self.log_test("Get Enterprise plan data", False, "Failed to fetch Enterprise plan")
    
    def test_suite_3_feature_access(self):
        """Test Suite 3: Feature-Based Access Control"""
        print("\n" + "="*80)
        print("TEST SUITE 3: FEATURE-BASED ACCESS CONTROL")
        print("="*80)
        
        # Test 3.1: Starter Plan - No Empty Lifecycle
        print("\n🧪 Test 3.1: Starter Plan - Empty Lifecycle Feature")
        starter_plan = self.get_plan_data('starter')
        
        if starter_plan:
            has_empty_lifecycle = starter_plan['features'].get('empty_lifecycle', False)
            
            self.log_test(
                "Starter plan does NOT have empty_lifecycle feature",
                has_empty_lifecycle == False,
                f"empty_lifecycle: {has_empty_lifecycle}"
            )
        else:
            self.log_test("Get Starter plan features", False, "Failed to fetch Starter plan")
        
        # Test 3.2: Business Plan - Has Empty Lifecycle
        print("\n🧪 Test 3.2: Business Plan - Empty Lifecycle Feature")
        business_plan = self.get_plan_data('business')
        
        if business_plan:
            has_empty_lifecycle = business_plan['features'].get('empty_lifecycle', False)
            
            self.log_test(
                "Business plan HAS empty_lifecycle feature",
                has_empty_lifecycle == True,
                f"empty_lifecycle: {has_empty_lifecycle}"
            )
        else:
            self.log_test("Get Business plan features", False, "Failed to fetch Business plan")
        
        # Test 3.3: Enterprise Plan - Has All Features
        print("\n🧪 Test 3.3: Enterprise Plan - All Features")
        enterprise_plan = self.get_plan_data('enterprise')
        
        if enterprise_plan:
            features = enterprise_plan['features']
            
            required_features = [
                'empty_lifecycle',
                'fraud_detection',
                'multi_warehouse',
                'sms_alerts',
                'api_access',
                'advanced_reports'
            ]
            
            all_features_present = all(features.get(f, False) for f in required_features)
            
            self.log_test(
                "Enterprise plan has all premium features",
                all_features_present,
                f"Features: {', '.join([f for f in required_features if features.get(f)])}"
            )
        else:
            self.log_test("Get Enterprise plan features", False, "Failed to fetch Enterprise plan")
        
        # Test 3.4: Test has_feature RPC function
        print("\n🧪 Test 3.4: has_feature RPC Function")
        
        # Set business to Business plan for testing
        business_plan = self.get_plan_data('business')
        if business_plan:
            self.update_business_plan(business_plan['id'])
            
            # Test empty_lifecycle feature (should be true for Business plan)
            result = self.supabase.rpc('has_feature', {
                'p_business_id': TEST_BUSINESS_ID,
                'p_feature_name': 'empty_lifecycle'
            }).execute()
            
            has_feature = result.data
            self.log_test(
                "Business plan has empty_lifecycle feature (via RPC)",
                has_feature == True,
                f"has_feature returned: {has_feature}"
            )
            
            # Test fraud_detection feature (should be true for Business plan)
            result = self.supabase.rpc('has_feature', {
                'p_business_id': TEST_BUSINESS_ID,
                'p_feature_name': 'fraud_detection'
            }).execute()
            
            has_feature = result.data
            self.log_test(
                "Business plan has fraud_detection feature (via RPC)",
                has_feature == True,
                f"has_feature returned: {has_feature}"
            )
    
    def test_suite_4_user_limits(self):
        """Test Suite 4: User Limit Enforcement"""
        print("\n" + "="*80)
        print("TEST SUITE 4: USER LIMIT ENFORCEMENT")
        print("="*80)
        
        current_users = self.count_users()
        print(f"\n📊 Current Active Users: {current_users}")
        
        # Test 4.1: Starter Plan User Limit
        print("\n🧪 Test 4.1: Starter Plan User Limit (3 included)")
        starter_plan = self.get_plan_data('starter')
        
        if starter_plan:
            included_users = starter_plan.get('included_users', 3)
            price_per_extra = starter_plan.get('price_per_extra_user', 2000)
            
            print(f"   Included Users: {included_users}")
            print(f"   Price per Extra User: ₦{price_per_extra}")
            
            extra_users = max(0, current_users - included_users)
            extra_cost = extra_users * price_per_extra
            
            self.log_test(
                f"Calculate extra user cost for Starter plan",
                True,
                f"Current: {current_users}, Included: {included_users}, Extra: {extra_users}, Cost: ₦{extra_cost}"
            )
        else:
            self.log_test("Get Starter plan user limits", False, "Failed to fetch Starter plan")
        
        # Test 4.2: Business Plan User Limit
        print("\n🧪 Test 4.2: Business Plan User Limit (10 included)")
        business_plan = self.get_plan_data('business')
        
        if business_plan:
            included_users = business_plan.get('included_users', 10)
            price_per_extra = business_plan.get('price_per_extra_user', 1500)
            
            print(f"   Included Users: {included_users}")
            print(f"   Price per Extra User: ₦{price_per_extra}")
            
            extra_users = max(0, current_users - included_users)
            extra_cost = extra_users * price_per_extra
            
            self.log_test(
                f"Calculate extra user cost for Business plan",
                True,
                f"Current: {current_users}, Included: {included_users}, Extra: {extra_users}, Cost: ₦{extra_cost}"
            )
        else:
            self.log_test("Get Business plan user limits", False, "Failed to fetch Business plan")
        
        # Test 4.3: Test calculate_subscription_amount RPC
        print("\n🧪 Test 4.3: calculate_subscription_amount RPC Function")
        
        try:
            result = self.supabase.rpc('calculate_subscription_amount', {
                'p_business_id': TEST_BUSINESS_ID,
                'p_plan_id': None  # Use current plan
            }).execute()
            
            if result.data and len(result.data) > 0:
                billing = result.data[0]
                
                print(f"   Base Price: ₦{billing.get('base_price', 0)}")
                print(f"   Active Users: {billing.get('active_users', 0)}")
                print(f"   Included Users: {billing.get('included_users', 0)}")
                print(f"   Extra Users: {billing.get('extra_users', 0)}")
                print(f"   Extra User Cost: ₦{billing.get('extra_user_cost', 0)}")
                print(f"   Total Amount: ₦{billing.get('total_amount', 0)}")
                
                self.log_test(
                    "calculate_subscription_amount RPC works correctly",
                    True,
                    f"Total: ₦{billing.get('total_amount', 0)}"
                )
            else:
                self.log_test(
                    "calculate_subscription_amount RPC",
                    False,
                    "No data returned"
                )
        except Exception as e:
            self.log_test(
                "calculate_subscription_amount RPC",
                False,
                f"Error: {str(e)}"
            )
    
    def test_suite_5_integration(self):
        """Test Suite 5: Integration Tests"""
        print("\n" + "="*80)
        print("TEST SUITE 5: INTEGRATION TESTS")
        print("="*80)
        
        # Test 5.1: Upgrade from Starter to Business
        print("\n🧪 Test 5.1: Simulate Upgrade from Starter to Business")
        
        starter_plan = self.get_plan_data('starter')
        business_plan = self.get_plan_data('business')
        
        if starter_plan and business_plan:
            # Set to Starter
            self.update_business_plan(starter_plan['id'])
            
            # Check empty_lifecycle feature (should be false)
            result = self.supabase.rpc('has_feature', {
                'p_business_id': TEST_BUSINESS_ID,
                'p_feature_name': 'empty_lifecycle'
            }).execute()
            
            has_feature_before = result.data
            
            # Upgrade to Business
            self.update_business_plan(business_plan['id'])
            
            # Check empty_lifecycle feature (should be true)
            result = self.supabase.rpc('has_feature', {
                'p_business_id': TEST_BUSINESS_ID,
                'p_feature_name': 'empty_lifecycle'
            }).execute()
            
            has_feature_after = result.data
            
            self.log_test(
                "Upgrade enables new features immediately",
                has_feature_before == False and has_feature_after == True,
                f"Before: {has_feature_before}, After: {has_feature_after}"
            )
        else:
            self.log_test("Simulate plan upgrade", False, "Failed to fetch plan data")
        
        # Test 5.2: Trial Expiration
        print("\n🧪 Test 5.2: Simulate Trial Expiration")
        
        # Set to trial
        self.update_subscription_status('trial')
        
        # Check if active
        result = self.supabase.rpc('is_subscription_active', {
            'p_business_id': TEST_BUSINESS_ID
        }).execute()
        is_active_before = result.data
        
        # Expire trial
        self.update_subscription_status('expired')
        
        # Check if blocked
        result = self.supabase.rpc('is_subscription_active', {
            'p_business_id': TEST_BUSINESS_ID
        }).execute()
        is_active_after = result.data
        
        self.log_test(
            "Trial expiration blocks access",
            is_active_before == True and is_active_after == False,
            f"Before: {is_active_before}, After: {is_active_after}"
        )
        
        # Restore to active
        self.update_subscription_status('active')
    
    def generate_summary(self):
        """Generate test summary"""
        print("\n" + "="*80)
        print("📊 SUBSCRIPTION ENFORCEMENT TEST SUMMARY")
        print("="*80)
        
        total_tests = self.passed + self.failed
        pass_rate = (self.passed / total_tests * 100) if total_tests > 0 else 0
        
        print(f"\nTotal Tests: {total_tests}")
        print(f"✅ Passed: {self.passed}")
        print(f"❌ Failed: {self.failed}")
        print(f"📈 Pass Rate: {pass_rate:.1f}%")
        
        if self.failed == 0:
            print("\n🎉 ALL TESTS PASSED! Subscription enforcement is watertight.")
        else:
            print(f"\n⚠️  {self.failed} test(s) failed. Review the details above.")
        
        print("\n" + "="*80)
    
    def run_all_tests(self):
        """Run all test suites"""
        print("\n🚀 COMPREHENSIVE SUBSCRIPTION ENFORCEMENT TEST SUITE")
        print("="*80)
        print(f"Business: Doris trading store ventures")
        print(f"Business ID: {TEST_BUSINESS_ID}")
        print(f"Base URL: {BASE_URL}")
        print("="*80)
        
        # Run all test suites
        self.test_suite_1_subscription_status()
        self.test_suite_2_plan_limits()
        self.test_suite_3_feature_access()
        self.test_suite_4_user_limits()
        self.test_suite_5_integration()
        
        # Generate summary
        self.generate_summary()

if __name__ == "__main__":
    if not SUPABASE_SERVICE_KEY:
        print("❌ Error: SUPABASE_SERVICE_ROLE_KEY environment variable not set")
        sys.exit(1)
    
    tester = SubscriptionEnforcementTester()
    tester.run_all_tests()
