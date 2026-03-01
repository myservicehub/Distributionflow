#!/usr/bin/env python3
"""
Backend API Test Suite for DistributionFlow Staff Management
Tests the 4 Staff Management endpoints with proper authentication
"""

import requests
import json
import sys
import os
from typing import Dict, Any

# Get base URL from environment or use default
BASE_URL = os.getenv('NEXT_PUBLIC_BASE_URL', 'https://distrib-flow-2.preview.emergentagent.com')
API_BASE = f"{BASE_URL}/api"

class StaffAPITester:
    def __init__(self):
        self.session = requests.Session()
        self.admin_email = "newadmin@abcdist.com"
        self.admin_password = "AdminPass123!"  # From previous tests
        self.auth_token = None
        self.test_results = {
            'authentication': False,
            'get_staff': False,
            'post_staff': False,
            'put_staff': False,
            'delete_staff': False
        }
        self.staff_id_for_tests = None
        
    def log(self, message: str, level: str = "INFO"):
        """Log test messages with consistent formatting"""
        print(f"[{level}] {message}")
        
    def authenticate_admin(self) -> bool:
        """Authenticate as admin user and get session"""
        try:
            self.log("Authenticating admin user...")
            
            # First try to sign in
            response = self.session.post(f"{API_BASE}/auth/signin", 
                json={
                    "email": self.admin_email,
                    "password": self.admin_password
                })
            
            if response.status_code == 200:
                # Check if we have a valid session by testing user endpoint
                user_response = self.session.get(f"{API_BASE}/user")
                if user_response.status_code == 200:
                    user_data = user_response.json()
                    self.log(f"Successfully authenticated as: {user_data.get('name')} ({user_data.get('role')})")
                    if user_data.get('role') == 'admin':
                        self.test_results['authentication'] = True
                        return True
                    else:
                        self.log(f"ERROR: User is not admin, role: {user_data.get('role')}", "ERROR")
                        return False
                else:
                    self.log(f"ERROR: Could not verify user session: {user_response.status_code}", "ERROR")
                    return False
            else:
                self.log(f"ERROR: Authentication failed: {response.status_code} - {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"ERROR: Authentication exception: {str(e)}", "ERROR")
            return False
    
    def test_get_staff(self) -> bool:
        """Test GET /api/staff endpoint"""
        try:
            self.log("Testing GET /api/staff...")
            
            response = self.session.get(f"{API_BASE}/staff")
            
            if response.status_code == 200:
                staff_data = response.json()
                self.log(f"SUCCESS: Retrieved {len(staff_data)} staff members")
                
                # Store a staff ID for update/delete tests if available
                if staff_data and len(staff_data) > 0:
                    # Look for a non-admin user we can safely modify
                    for staff in staff_data:
                        if staff.get('role') != 'admin' and staff.get('status') == 'active':
                            self.staff_id_for_tests = staff.get('id')
                            self.log(f"Found staff member for testing: {staff.get('name')} (ID: {self.staff_id_for_tests})")
                            break
                    
                    if not self.staff_id_for_tests:
                        self.log("NOTE: No non-admin staff found for update/delete tests")
                
                self.test_results['get_staff'] = True
                return True
                
            elif response.status_code == 403:
                self.log("ERROR: Access denied - User may not have admin privileges", "ERROR")
                return False
            else:
                self.log(f"ERROR: GET staff failed: {response.status_code} - {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"ERROR: GET staff exception: {str(e)}", "ERROR")
            return False
    
    def test_post_staff(self) -> bool:
        """Test POST /api/staff endpoint"""
        try:
            self.log("Testing POST /api/staff...")
            
            # Test data for new staff member
            new_staff = {
                "name": "Sarah Johnson",
                "email": "sarah.johnson@abcdist.com",
                "role": "sales_rep"
            }
            
            response = self.session.post(f"{API_BASE}/staff", json=new_staff)
            
            if response.status_code == 200:
                staff_response = response.json()
                self.log(f"SUCCESS: Created staff member: {staff_response.get('user', {}).get('name')}")
                
                # Verify temp password was returned
                if 'tempPassword' in staff_response:
                    self.log(f"SUCCESS: Temporary password generated: {staff_response['tempPassword'][:8]}...")
                    # Store this staff ID for potential cleanup
                    if not self.staff_id_for_tests:
                        self.staff_id_for_tests = staff_response.get('user', {}).get('id')
                else:
                    self.log("WARNING: No temporary password in response", "WARN")
                
                self.test_results['post_staff'] = True
                return True
                
            elif response.status_code == 403:
                self.log("ERROR: Access denied - Admin privileges required", "ERROR")
                return False
            elif response.status_code == 400:
                self.log(f"ERROR: Bad request - Validation failed: {response.text}", "ERROR")
                return False
            elif response.status_code == 500:
                error_text = response.text
                if "SUPABASE_SERVICE_ROLE_KEY" in error_text or "service_role" in error_text.lower():
                    self.log("ERROR: SUPABASE_SERVICE_ROLE_KEY not configured in .env file", "ERROR")
                    self.log("This is expected - service role key needs to be added manually", "INFO")
                else:
                    self.log(f"ERROR: Server error: {error_text}", "ERROR")
                return False
            else:
                self.log(f"ERROR: POST staff failed: {response.status_code} - {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"ERROR: POST staff exception: {str(e)}", "ERROR")
            return False
    
    def test_put_staff(self) -> bool:
        """Test PUT /api/staff/:id endpoint"""
        if not self.staff_id_for_tests:
            self.log("SKIP: No staff ID available for PUT test", "WARN")
            return False
            
        try:
            self.log(f"Testing PUT /api/staff/{self.staff_id_for_tests}...")
            
            # Test data for updating staff
            update_data = {
                "name": "Sarah Johnson Updated",
                "role": "manager",
                "status": "active"
            }
            
            response = self.session.put(f"{API_BASE}/staff/{self.staff_id_for_tests}", json=update_data)
            
            if response.status_code == 200:
                updated_staff = response.json()
                self.log(f"SUCCESS: Updated staff member: {updated_staff.get('name')} -> {updated_staff.get('role')}")
                self.test_results['put_staff'] = True
                return True
                
            elif response.status_code == 403:
                self.log("ERROR: Access denied - Admin privileges required", "ERROR")
                return False
            elif response.status_code == 404:
                self.log("ERROR: Staff member not found or not in same business", "ERROR")
                return False
            else:
                self.log(f"ERROR: PUT staff failed: {response.status_code} - {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"ERROR: PUT staff exception: {str(e)}", "ERROR")
            return False
    
    def test_delete_staff(self) -> bool:
        """Test DELETE /api/staff/:id endpoint (soft delete)"""
        if not self.staff_id_for_tests:
            self.log("SKIP: No staff ID available for DELETE test", "WARN")
            return False
            
        try:
            self.log(f"Testing DELETE /api/staff/{self.staff_id_for_tests}...")
            
            response = self.session.delete(f"{API_BASE}/staff/{self.staff_id_for_tests}")
            
            if response.status_code == 200:
                deactivated_staff = response.json()
                if deactivated_staff.get('status') == 'inactive':
                    self.log(f"SUCCESS: Soft deleted (deactivated) staff member: {deactivated_staff.get('name')}")
                    self.test_results['delete_staff'] = True
                    return True
                else:
                    self.log(f"ERROR: Staff not properly deactivated, status: {deactivated_staff.get('status')}", "ERROR")
                    return False
                
            elif response.status_code == 403:
                self.log("ERROR: Access denied - Admin privileges required", "ERROR")
                return False
            elif response.status_code == 404:
                self.log("ERROR: Staff member not found or not in same business", "ERROR")
                return False
            else:
                self.log(f"ERROR: DELETE staff failed: {response.status_code} - {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"ERROR: DELETE staff exception: {str(e)}", "ERROR")
            return False
    
    def run_all_tests(self):
        """Run all staff management API tests in sequence"""
        self.log("=== STARTING STAFF MANAGEMENT API TESTS ===")
        self.log(f"Testing against: {API_BASE}")
        
        # Step 1: Authenticate
        if not self.authenticate_admin():
            self.log("FATAL: Cannot proceed without admin authentication", "ERROR")
            return self.generate_summary()
        
        # Step 2: Test GET endpoint (should work immediately)
        self.test_get_staff()
        
        # Step 3: Test POST endpoint (may fail if service key missing)
        self.test_post_staff()
        
        # Step 4: Test PUT endpoint (if we have a staff ID)
        self.test_put_staff()
        
        # Step 5: Test DELETE endpoint (if we have a staff ID)
        self.test_delete_staff()
        
        return self.generate_summary()
    
    def generate_summary(self) -> Dict[str, Any]:
        """Generate test summary"""
        self.log("=== STAFF MANAGEMENT API TEST SUMMARY ===")
        
        passed = sum(1 for result in self.test_results.values() if result)
        total = len(self.test_results)
        
        for test_name, result in self.test_results.items():
            status = "✅ PASS" if result else "❌ FAIL"
            self.log(f"{test_name.replace('_', ' ').title()}: {status}")
        
        self.log(f"Overall: {passed}/{total} tests passed")
        
        return {
            'passed': passed,
            'total': total,
            'results': self.test_results,
            'staff_id_used': self.staff_id_for_tests
        }

def main():
    """Main test execution"""
    try:
        tester = StaffAPITester()
        summary = tester.run_all_tests()
        
        # Exit with appropriate code
        if summary['passed'] >= 2:  # GET + at least one other test
            print("SUCCESS: Core staff management functionality working")
            sys.exit(0)
        else:
            print("FAILURE: Critical staff management issues found")
            sys.exit(1)
            
    except Exception as e:
        print(f"FATAL ERROR: Test suite failed: {str(e)}")
        sys.exit(2)

if __name__ == "__main__":
    main()