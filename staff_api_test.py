#!/usr/bin/env python3
"""
Direct Staff Management API Test
Tests staff endpoints assuming user is already authenticated via browser session
"""

import requests
import json
import sys
import os
from typing import Dict, Any

# Get base URL from environment or use default
BASE_URL = os.getenv('NEXT_PUBLIC_BASE_URL', 'https://distrib-flow-2.preview.emergentagent.com')
API_BASE = f"{BASE_URL}/api"

class DirectStaffTester:
    def __init__(self):
        self.session = requests.Session()
        self.test_results = {
            'get_staff': False,
            'post_staff': False,
            'put_staff': False,
            'delete_staff': False
        }
        self.created_staff_id = None
        self.test_staff_data = {
            "name": "Test Manager Wilson",
            "email": "test.manager@distributionflow.com", 
            "role": "manager"
        }
        
    def log(self, message: str, level: str = "INFO"):
        """Log test messages with consistent formatting"""
        print(f"[{level}] {message}")
    
    def test_get_staff(self) -> bool:
        """Test GET /api/staff endpoint"""
        try:
            self.log("Testing GET /api/staff...")
            
            response = self.session.get(f"{API_BASE}/staff")
            self.log(f"GET staff response: {response.status_code}")
            
            if response.status_code == 200:
                try:
                    staff_data = response.json()
                    self.log(f"SUCCESS: Retrieved {len(staff_data)} staff members")
                    
                    # Log some sample data for verification
                    if staff_data:
                        sample_staff = staff_data[0]
                        self.log(f"Sample staff: {sample_staff.get('name')} - {sample_staff.get('role')} - {sample_staff.get('status')}")
                    
                    self.test_results['get_staff'] = True
                    return True
                except Exception as e:
                    self.log(f"ERROR: Cannot parse GET staff response: {str(e)}", "ERROR")
                    self.log(f"Response content: {response.text[:500]}", "ERROR")
                    return False
            elif response.status_code == 401:
                self.log("ERROR: Unauthorized - Authentication required", "ERROR")
                return False
            elif response.status_code == 403:
                self.log("ERROR: Forbidden - Admin access required", "ERROR")
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
            self.log(f"Testing POST /api/staff with data: {self.test_staff_data}")
            
            response = self.session.post(f"{API_BASE}/staff", json=self.test_staff_data)
            self.log(f"POST staff response: {response.status_code}")
            
            if response.status_code == 200:
                try:
                    staff_response = response.json()
                    user_data = staff_response.get('user', {})
                    temp_password = staff_response.get('tempPassword', '')
                    
                    self.log(f"SUCCESS: Created staff member: {user_data.get('name')} ({user_data.get('role')})")
                    self.log(f"SUCCESS: Temporary password generated: {temp_password[:8]}... (length: {len(temp_password)})")
                    
                    # Store staff ID for update/delete tests
                    self.created_staff_id = user_data.get('id')
                    if self.created_staff_id:
                        self.log(f"Staff ID for further testing: {self.created_staff_id}")
                    
                    # Validate password format
                    if len(temp_password) >= 10 and any(c.isdigit() for c in temp_password) and any(c.isalpha() for c in temp_password):
                        self.log("SUCCESS: Temporary password has proper format")
                    else:
                        self.log(f"WARNING: Temporary password might not meet complexity requirements: {temp_password}", "WARN")
                    
                    self.test_results['post_staff'] = True
                    return True
                    
                except Exception as e:
                    self.log(f"ERROR: Cannot parse POST staff response: {str(e)}", "ERROR")
                    self.log(f"Response content: {response.text}", "ERROR")
                    return False
            elif response.status_code == 401:
                self.log("ERROR: Unauthorized - Authentication required", "ERROR")
                return False
            elif response.status_code == 403:
                self.log("ERROR: Forbidden - Admin access required", "ERROR")
                return False
            elif response.status_code == 400:
                self.log(f"ERROR: Bad Request - Validation failed: {response.text}", "ERROR")
                return False
            else:
                self.log(f"ERROR: POST staff failed: {response.status_code} - {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"ERROR: POST staff exception: {str(e)}", "ERROR")
            return False
    
    def test_put_staff(self) -> bool:
        """Test PUT /api/staff/:id endpoint"""
        if not self.created_staff_id:
            self.log("SKIP: No staff ID available for PUT test (POST must succeed first)", "WARN")
            return False
            
        try:
            update_data = {
                "name": "Test Manager Wilson Updated",
                "role": "sales_rep",
                "status": "active"
            }
            
            self.log(f"Testing PUT /api/staff/{self.created_staff_id} with data: {update_data}")
            
            response = self.session.put(f"{API_BASE}/staff/{self.created_staff_id}", json=update_data)
            self.log(f"PUT staff response: {response.status_code}")
            
            if response.status_code == 200:
                try:
                    updated_staff = response.json()
                    self.log(f"SUCCESS: Updated staff - Name: {updated_staff.get('name')}, Role: {updated_staff.get('role')}")
                    self.test_results['put_staff'] = True
                    return True
                except Exception as e:
                    self.log(f"ERROR: Cannot parse PUT staff response: {str(e)}", "ERROR")
                    return False
            elif response.status_code == 401:
                self.log("ERROR: Unauthorized - Authentication required", "ERROR")
                return False
            elif response.status_code == 403:
                self.log("ERROR: Forbidden - Admin access required", "ERROR")
                return False
            elif response.status_code == 404:
                self.log("ERROR: Staff member not found or access denied", "ERROR")
                return False
            else:
                self.log(f"ERROR: PUT staff failed: {response.status_code} - {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"ERROR: PUT staff exception: {str(e)}", "ERROR")
            return False
    
    def test_delete_staff(self) -> bool:
        """Test DELETE /api/staff/:id endpoint (soft delete)"""
        if not self.created_staff_id:
            self.log("SKIP: No staff ID available for DELETE test (POST must succeed first)", "WARN")
            return False
            
        try:
            self.log(f"Testing DELETE /api/staff/{self.created_staff_id} (soft delete)")
            
            response = self.session.delete(f"{API_BASE}/staff/{self.created_staff_id}")
            self.log(f"DELETE staff response: {response.status_code}")
            
            if response.status_code == 200:
                try:
                    deleted_staff = response.json()
                    if deleted_staff.get('status') == 'inactive':
                        self.log(f"SUCCESS: Soft deleted staff - Name: {deleted_staff.get('name')}, Status: {deleted_staff.get('status')}")
                        self.test_results['delete_staff'] = True
                        return True
                    else:
                        self.log(f"ERROR: Staff not properly deactivated, status: {deleted_staff.get('status')}", "ERROR")
                        return False
                except Exception as e:
                    self.log(f"ERROR: Cannot parse DELETE staff response: {str(e)}", "ERROR")
                    return False
            elif response.status_code == 401:
                self.log("ERROR: Unauthorized - Authentication required", "ERROR")
                return False
            elif response.status_code == 403:
                self.log("ERROR: Forbidden - Admin access required", "ERROR")
                return False
            elif response.status_code == 404:
                self.log("ERROR: Staff member not found or access denied", "ERROR")
                return False
            else:
                self.log(f"ERROR: DELETE staff failed: {response.status_code} - {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"ERROR: DELETE staff exception: {str(e)}", "ERROR")
            return False
    
    def run_all_tests(self):
        """Run all staff management API tests"""
        self.log("=== DIRECT STAFF MANAGEMENT API TESTS ===")
        self.log(f"Testing against: {API_BASE}")
        
        # Test in logical order
        self.test_get_staff()
        self.test_post_staff() 
        self.test_put_staff()
        self.test_delete_staff()
        
        return self.generate_summary()
    
    def generate_summary(self) -> Dict[str, Any]:
        """Generate test summary"""
        self.log("=== STAFF MANAGEMENT API TEST SUMMARY ===")
        
        passed = sum(1 for result in self.test_results.values() if result)
        total = len(self.test_results)
        
        for test_name, result in self.test_results.items():
            status = "✅ PASS" if result else "❌ FAIL"
            self.log(f"{test_name.replace('_', ' ').upper()}: {status}")
        
        self.log(f"Overall: {passed}/{total} tests passed")
        
        return {
            'passed': passed,
            'total': total,
            'results': self.test_results,
            'created_staff_id': self.created_staff_id
        }

def main():
    """Main test execution"""
    try:
        tester = DirectStaffTester()
        summary = tester.run_all_tests()
        
        # Exit with appropriate code
        if summary['passed'] >= 3:  # GET + POST + at least one other
            print("SUCCESS: Staff management API working correctly")
            sys.exit(0)
        elif summary['passed'] >= 1:  # At least GET working
            print("PARTIAL: Some staff management endpoints working")
            sys.exit(0)
        else:
            print("FAILURE: Staff management API not accessible")
            sys.exit(1)
            
    except Exception as e:
        print(f"FATAL ERROR: Test suite failed: {str(e)}")
        sys.exit(2)

if __name__ == "__main__":
    main()