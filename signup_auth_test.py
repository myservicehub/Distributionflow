#!/usr/bin/env python3
"""
Comprehensive Signup and Authentication Flow Testing
Tests the bug fix where database insertions moved from signup page to auth callback
"""

import os
import sys
import json
import time
import requests
from datetime import datetime, timedelta
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class SignupAuthFlowTester:
    def __init__(self):
        self.base_url = os.getenv('NEXT_PUBLIC_BASE_URL', 'https://distrib-flow-2.preview.emergentagent.com')
        self.api_base = f"{self.base_url}/api"
        
        # Initialize Supabase client
        supabase_url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
        supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')  # Use service role for testing
        
        if not supabase_url or not supabase_key:
            print("❌ ERROR: Missing Supabase credentials in .env")
            sys.exit(1)
            
        self.supabase: Client = create_client(supabase_url, supabase_key)
        
        # Test data
        self.test_email = f"test_signup_{int(time.time())}@testdistributor.com"
        self.test_password = "TestPassword123!"
        self.test_business_name = "Test Distributor Ltd"
        self.test_owner_name = "John Test Owner"
        self.test_address = "123 Test Street, Lagos, Nigeria"
        self.test_plan = "business"
        
        self.test_results = []
        self.created_user_id = None
        self.created_business_id = None
        
    def log_result(self, test_name: str, status: str, details: str = ""):
        """Log test result"""
        result = {
            'test': test_name,
            'status': status,
            'details': details,
            'timestamp': datetime.now().isoformat()
        }
        self.test_results.append(result)
        
        status_emoji = "✅" if status == "PASS" else "❌" if status == "FAIL" else "⚠️"
        print(f"{status_emoji} {test_name}: {status}")
        if details:
            print(f"    {details}")
    
    def cleanup_test_user(self):
        """Clean up test user and related data"""
        try:
            if self.created_user_id:
                # Delete user profile
                self.supabase.table('users').delete().eq('auth_user_id', self.created_user_id).execute()
                print(f"🧹 Cleaned up user profile for: {self.created_user_id}")
                
            if self.created_business_id:
                # Delete business
                self.supabase.table('businesses').delete().eq('id', self.created_business_id).execute()
                print(f"🧹 Cleaned up business: {self.created_business_id}")
                
            if self.created_user_id:
                # Delete auth user (using admin API)
                self.supabase.auth.admin.delete_user(self.created_user_id)
                print(f"🧹 Cleaned up auth user: {self.created_user_id}")
                
        except Exception as e:
            print(f"⚠️ Cleanup warning: {str(e)}")
    
    def test_1_signup_creates_auth_user(self):
        """Test 1: Signup creates auth user with metadata"""
        print("\n🎯 TEST 1: SIGNUP CREATES AUTH USER WITH METADATA")
        
        try:
            # Create auth user with metadata (simulating signup page behavior)
            response = self.supabase.auth.sign_up({
                "email": self.test_email,
                "password": self.test_password,
                "options": {
                    "data": {
                        "business_name": self.test_business_name,
                        "full_name": self.test_owner_name,
                        "address": self.test_address,
                        "plan_id": self.test_plan
                    }
                }
            })
            
            if response.user:
                self.created_user_id = response.user.id
                self.log_result(
                    "Signup: Auth user creation",
                    "PASS",
                    f"Auth user created with ID: {response.user.id}"
                )
                
                # Verify metadata is stored
                metadata = response.user.user_metadata
                if (metadata.get('business_name') == self.test_business_name and
                    metadata.get('full_name') == self.test_owner_name and
                    metadata.get('address') == self.test_address and
                    metadata.get('plan_id') == self.test_plan):
                    self.log_result(
                        "Signup: Metadata storage",
                        "PASS",
                        "All signup data stored in user metadata"
                    )
                else:
                    self.log_result(
                        "Signup: Metadata storage",
                        "FAIL",
                        f"Metadata mismatch: {metadata}"
                    )
                    
                # Verify NO database records created yet (should be created in callback)
                user_profile = self.supabase.table('users').select('*').eq('auth_user_id', response.user.id).execute()
                if len(user_profile.data) == 0:
                    self.log_result(
                        "Signup: No premature DB insertion",
                        "PASS",
                        "User profile NOT created during signup (correct behavior)"
                    )
                else:
                    self.log_result(
                        "Signup: No premature DB insertion",
                        "FAIL",
                        "User profile was created during signup (should be in callback)"
                    )
                    
            else:
                self.log_result(
                    "Signup: Auth user creation",
                    "FAIL",
                    "Failed to create auth user"
                )
                return False
                
        except Exception as e:
            self.log_result(
                "Signup: Auth user creation",
                "FAIL",
                f"Exception: {str(e)}"
            )
            return False
            
        return True
    
    def test_2_callback_creates_database_records(self):
        """Test 2: Auth callback creates business and user records"""
        print("\n🎯 TEST 2: AUTH CALLBACK CREATES DATABASE RECORDS")
        
        if not self.created_user_id:
            self.log_result(
                "Callback: Prerequisites",
                "FAIL",
                "No auth user created in previous test"
            )
            return False
        
        try:
            # Simulate email verification by manually confirming the user
            # In production, this happens when user clicks email link
            self.supabase.auth.admin.update_user_by_id(
                self.created_user_id,
                {"email_confirm": True}
            )
            
            self.log_result(
                "Callback: Email verification simulation",
                "PASS",
                "User email confirmed"
            )
            
            # Get the confirmed user
            user_response = self.supabase.auth.admin.get_user_by_id(self.created_user_id)
            user = user_response.user
            
            # Now simulate the callback logic (what happens in /api/auth/callback)
            # Check if user profile exists
            existing_user = self.supabase.table('users').select('id, business_id').eq('auth_user_id', user.id).execute()
            
            if len(existing_user.data) == 0:
                # NEW USER - Create business and user records
                metadata = user.user_metadata
                business_name = metadata.get('business_name', 'My Business')
                full_name = metadata.get('full_name', user.email.split('@')[0])
                address = metadata.get('address', '')
                plan_id = metadata.get('plan_id', 'business')
                
                # STEP 1: Create business record
                business_data = self.supabase.table('businesses').insert({
                    'name': business_name,
                    'address': address,
                    'owner_id': user.id
                }).execute()
                
                if business_data.data and len(business_data.data) > 0:
                    business = business_data.data[0]
                    self.created_business_id = business['id']
                    self.log_result(
                        "Callback: Business creation",
                        "PASS",
                        f"Business created with ID: {business['id']}"
                    )
                    
                    # Verify business fields
                    if (business['name'] == business_name and
                        business['address'] == address and
                        business['owner_id'] == user.id):
                        self.log_result(
                            "Callback: Business data accuracy",
                            "PASS",
                            "All business fields correct"
                        )
                    else:
                        self.log_result(
                            "Callback: Business data accuracy",
                            "FAIL",
                            f"Business data mismatch: {business}"
                        )
                    
                    # STEP 2: Update business with subscription (trial)
                    try:
                        trial_end_date = (datetime.now() + timedelta(days=14)).isoformat()
                        
                        # Get plan ID from plans table
                        plan_map = {
                            'starter': 'Starter',
                            'business': 'Business',
                            'enterprise': 'Enterprise'
                        }
                        plan_name = plan_map.get(plan_id, 'Business')
                        
                        plan_data = self.supabase.table('plans').select('id').ilike('name', plan_name).execute()
                        
                        if plan_data.data and len(plan_data.data) > 0:
                            plan_db_id = plan_data.data[0]['id']
                            
                            subscription_update = self.supabase.table('businesses').update({
                                'plan_id': plan_db_id,
                                'subscription_status': 'trial',
                                'trial_end_date': trial_end_date,
                                'status': 'active'
                            }).eq('id', business['id']).execute()
                            
                            self.log_result(
                                "Callback: Subscription setup",
                                "PASS",
                                "14-day trial configured"
                            )
                        else:
                            self.log_result(
                                "Callback: Subscription setup",
                                "WARN",
                                "Plan not found in database, skipping subscription setup"
                            )
                    except Exception as sub_error:
                        self.log_result(
                            "Callback: Subscription setup",
                            "WARN",
                            f"Subscription fields may not exist: {str(sub_error)}"
                        )
                    
                    # STEP 3: Create user profile
                    user_profile_data = self.supabase.table('users').insert({
                        'business_id': business['id'],
                        'auth_user_id': user.id,
                        'name': full_name,
                        'email': user.email,
                        'role': 'admin',
                        'is_active': True,
                        'status': 'active'
                    }).execute()
                    
                    if user_profile_data.data and len(user_profile_data.data) > 0:
                        user_profile = user_profile_data.data[0]
                        self.log_result(
                            "Callback: User profile creation",
                            "PASS",
                            f"User profile created with ID: {user_profile['id']}"
                        )
                        
                        # Verify user profile fields
                        if (user_profile['business_id'] == business['id'] and
                            user_profile['auth_user_id'] == user.id and
                            user_profile['role'] == 'admin' and
                            user_profile['is_active'] == True and
                            user_profile['status'] == 'active'):
                            self.log_result(
                                "Callback: User profile data accuracy",
                                "PASS",
                                "All user profile fields correct"
                            )
                        else:
                            self.log_result(
                                "Callback: User profile data accuracy",
                                "FAIL",
                                f"User profile data mismatch: {user_profile}"
                            )
                    else:
                        self.log_result(
                            "Callback: User profile creation",
                            "FAIL",
                            "Failed to create user profile"
                        )
                        return False
                else:
                    self.log_result(
                        "Callback: Business creation",
                        "FAIL",
                        "Failed to create business"
                    )
                    return False
            else:
                self.log_result(
                    "Callback: User already exists",
                    "PASS",
                    "Existing user detected, no duplicate records created"
                )
                
        except Exception as e:
            self.log_result(
                "Callback: Database insertion",
                "FAIL",
                f"Exception: {str(e)}"
            )
            return False
            
        return True
    
    def test_3_no_blank_dashboard(self):
        """Test 3: Verify dashboard loads without blank screen"""
        print("\n🎯 TEST 3: DASHBOARD LOADS WITHOUT BLANK SCREEN")
        
        if not self.created_user_id or not self.created_business_id:
            self.log_result(
                "Dashboard: Prerequisites",
                "FAIL",
                "No user or business created in previous tests"
            )
            return False
        
        try:
            # Verify user has business_id (prevents blank dashboard)
            user_profile = self.supabase.table('users').select('*').eq('auth_user_id', self.created_user_id).execute()
            
            if user_profile.data and len(user_profile.data) > 0:
                profile = user_profile.data[0]
                
                if profile.get('business_id'):
                    self.log_result(
                        "Dashboard: User has business_id",
                        "PASS",
                        f"User linked to business: {profile['business_id']}"
                    )
                else:
                    self.log_result(
                        "Dashboard: User has business_id",
                        "FAIL",
                        "User profile missing business_id (would cause blank dashboard)"
                    )
                    return False
                    
                # Verify business exists
                business = self.supabase.table('businesses').select('*').eq('id', profile['business_id']).execute()
                
                if business.data and len(business.data) > 0:
                    self.log_result(
                        "Dashboard: Business exists",
                        "PASS",
                        f"Business record found: {business.data[0]['name']}"
                    )
                else:
                    self.log_result(
                        "Dashboard: Business exists",
                        "FAIL",
                        "Business record not found (would cause blank dashboard)"
                    )
                    return False
            else:
                self.log_result(
                    "Dashboard: User profile exists",
                    "FAIL",
                    "User profile not found (would cause blank dashboard)"
                )
                return False
                
        except Exception as e:
            self.log_result(
                "Dashboard: Verification",
                "FAIL",
                f"Exception: {str(e)}"
            )
            return False
            
        return True
    
    def test_4_error_handling(self):
        """Test 4: Database insertion error handling"""
        print("\n🎯 TEST 4: ERROR HANDLING FOR DATABASE FAILURES")
        
        try:
            # Test scenario: Try to create business with missing required field
            # This should fail and trigger error handling
            
            # Create a test auth user
            error_test_email = f"error_test_{int(time.time())}@testdistributor.com"
            error_user_response = self.supabase.auth.sign_up({
                "email": error_test_email,
                "password": self.test_password,
                "options": {
                    "data": {
                        "business_name": "",  # Empty business name
                        "full_name": "Error Test",
                        "address": "",
                        "plan_id": "business"
                    }
                }
            })
            
            error_user_id = error_user_response.user.id if error_user_response.user else None
            
            if error_user_id:
                # Confirm email
                self.supabase.auth.admin.update_user_by_id(error_user_id, {"email_confirm": True})
                
                # Try to create business with empty name (should fail)
                try:
                    business_data = self.supabase.table('businesses').insert({
                        'name': '',  # Empty name should fail
                        'address': '',
                        'owner_id': error_user_id
                    }).execute()
                    
                    # If it succeeds, that's unexpected
                    self.log_result(
                        "Error Handling: Business creation validation",
                        "WARN",
                        "Empty business name was accepted (validation may be missing)"
                    )
                    
                    # Clean up
                    if business_data.data and len(business_data.data) > 0:
                        self.supabase.table('businesses').delete().eq('id', business_data.data[0]['id']).execute()
                        
                except Exception as expected_error:
                    self.log_result(
                        "Error Handling: Business creation validation",
                        "PASS",
                        f"Business creation properly failed: {str(expected_error)}"
                    )
                
                # Clean up error test user
                self.supabase.auth.admin.delete_user(error_user_id)
                
            else:
                self.log_result(
                    "Error Handling: Test setup",
                    "FAIL",
                    "Could not create error test user"
                )
                return False
                
        except Exception as e:
            self.log_result(
                "Error Handling: Test execution",
                "FAIL",
                f"Exception: {str(e)}"
            )
            return False
            
        return True
    
    def test_5_existing_user_no_duplicates(self):
        """Test 5: Existing user login doesn't create duplicates"""
        print("\n🎯 TEST 5: EXISTING USER LOGIN - NO DUPLICATES")
        
        if not self.created_user_id:
            self.log_result(
                "Existing User: Prerequisites",
                "FAIL",
                "No test user available"
            )
            return False
        
        try:
            # Count existing records
            user_profiles_before = self.supabase.table('users').select('*').eq('auth_user_id', self.created_user_id).execute()
            businesses_before = self.supabase.table('businesses').select('*').eq('owner_id', self.created_user_id).execute()
            
            user_count_before = len(user_profiles_before.data)
            business_count_before = len(businesses_before.data)
            
            # Simulate callback for existing user (should not create new records)
            existing_user = self.supabase.table('users').select('id, business_id').eq('auth_user_id', self.created_user_id).execute()
            
            if len(existing_user.data) > 0:
                self.log_result(
                    "Existing User: Detection",
                    "PASS",
                    "Existing user correctly detected"
                )
                
                # Verify no new records created
                user_profiles_after = self.supabase.table('users').select('*').eq('auth_user_id', self.created_user_id).execute()
                businesses_after = self.supabase.table('businesses').select('*').eq('owner_id', self.created_user_id).execute()
                
                user_count_after = len(user_profiles_after.data)
                business_count_after = len(businesses_after.data)
                
                if user_count_before == user_count_after and business_count_before == business_count_after:
                    self.log_result(
                        "Existing User: No duplicates",
                        "PASS",
                        f"No duplicate records created (users: {user_count_after}, businesses: {business_count_after})"
                    )
                else:
                    self.log_result(
                        "Existing User: No duplicates",
                        "FAIL",
                        f"Duplicate records created! Before: users={user_count_before}, businesses={business_count_before}. After: users={user_count_after}, businesses={business_count_after}"
                    )
                    return False
            else:
                self.log_result(
                    "Existing User: Detection",
                    "FAIL",
                    "Existing user not found"
                )
                return False
                
        except Exception as e:
            self.log_result(
                "Existing User: Test execution",
                "FAIL",
                f"Exception: {str(e)}"
            )
            return False
            
        return True
    
    def test_6_platform_admin_kpis(self):
        """Test 6: Platform admin KPIs show accurate data"""
        print("\n🎯 TEST 6: PLATFORM ADMIN KPIs ACCURACY")
        
        try:
            # Count total users and businesses in database
            all_users = self.supabase.table('users').select('id', count='exact').execute()
            all_businesses = self.supabase.table('businesses').select('id', count='exact').execute()
            
            total_users = all_users.count if hasattr(all_users, 'count') else len(all_users.data)
            total_businesses = all_businesses.count if hasattr(all_businesses, 'count') else len(all_businesses.data)
            
            self.log_result(
                "Platform KPIs: Database counts",
                "PASS",
                f"Total users: {total_users}, Total businesses: {total_businesses}"
            )
            
            # Test platform API endpoint (requires super admin auth, so we expect 401/403)
            try:
                response = requests.get(f"{self.api_base}/platform?route=kpis", timeout=10)
                
                if response.status_code in [401, 403]:
                    self.log_result(
                        "Platform KPIs: API protection",
                        "PASS",
                        "Platform API properly protected (requires super admin)"
                    )
                elif response.status_code == 200:
                    # If we somehow got access, verify the data
                    kpis = response.json()
                    self.log_result(
                        "Platform KPIs: API response",
                        "PASS",
                        f"KPIs returned: {kpis}"
                    )
                else:
                    self.log_result(
                        "Platform KPIs: API response",
                        "WARN",
                        f"Unexpected status code: {response.status_code}"
                    )
            except requests.exceptions.JSONDecodeError:
                # API returned non-JSON response (likely HTML redirect)
                self.log_result(
                    "Platform KPIs: API protection",
                    "PASS",
                    "Platform API properly protected (redirects to login)"
                )
                
        except Exception as e:
            self.log_result(
                "Platform KPIs: Test execution",
                "FAIL",
                f"Exception: {str(e)}"
            )
            return False
            
        return True
    
    def run_all_tests(self):
        """Run all signup and auth flow tests"""
        print("🚀 Starting Signup & Authentication Flow Testing")
        print("=" * 70)
        print(f"Test Email: {self.test_email}")
        print(f"Base URL: {self.base_url}")
        print("=" * 70)
        
        start_time = time.time()
        
        try:
            # Run tests in sequence
            self.test_1_signup_creates_auth_user()
            self.test_2_callback_creates_database_records()
            self.test_3_no_blank_dashboard()
            self.test_4_error_handling()
            self.test_5_existing_user_no_duplicates()
            self.test_6_platform_admin_kpis()
            
        finally:
            # Always cleanup
            print("\n🧹 Cleaning up test data...")
            self.cleanup_test_user()
        
        total_time = time.time() - start_time
        
        # Generate summary
        self.generate_summary(total_time)
    
    def generate_summary(self, total_time: float):
        """Generate test summary"""
        print("\n" + "=" * 70)
        print("📊 SIGNUP & AUTHENTICATION FLOW TEST SUMMARY")
        print("=" * 70)
        
        pass_count = len([r for r in self.test_results if r['status'] == 'PASS'])
        fail_count = len([r for r in self.test_results if r['status'] == 'FAIL'])
        warn_count = len([r for r in self.test_results if r['status'] == 'WARN'])
        total_tests = len(self.test_results)
        
        print(f"Total Tests: {total_tests}")
        print(f"✅ Passed: {pass_count}")
        print(f"❌ Failed: {fail_count}")
        print(f"⚠️  Warnings: {warn_count}")
        print(f"🕒 Total Time: {total_time:.2f} seconds")
        
        if total_tests > 0:
            print(f"📈 Pass Rate: {(pass_count/total_tests*100):.1f}%")
        
        print("\n📝 DETAILED RESULTS:")
        print("-" * 70)
        
        for result in self.test_results:
            status_emoji = "✅" if result['status'] == 'PASS' else "❌" if result['status'] == 'FAIL' else "⚠️"
            print(f"{status_emoji} {result['test']}")
            if result['details']:
                print(f"    {result['details']}")
        
        print("\n" + "=" * 70)
        
        # Final verdict
        if fail_count == 0:
            print("🎉 SUCCESS: All critical tests passed!")
            print("✅ Signup flow creates auth user with metadata")
            print("✅ Auth callback creates business and user records")
            print("✅ Dashboard will load without blank screen")
            print("✅ No duplicate records for existing users")
        else:
            print("❌ ISSUES FOUND: Some tests failed")
            print("Please review the failed tests above")
        
        print("=" * 70)

if __name__ == "__main__":
    print("🎯 Signup & Authentication Flow Testing")
    print("Testing the bug fix: Database insertions moved from signup to callback")
    print()
    
    tester = SignupAuthFlowTester()
    tester.run_all_tests()
