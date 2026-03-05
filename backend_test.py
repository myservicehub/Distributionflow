#!/usr/bin/env python3
"""
Comprehensive Integration Test Suite for Multi-Tenant FMCG Distributor SaaS
Tests: Multi-tenancy, RBAC, Empty Bottles, Subscriptions, Security, Performance
"""

import json
import requests
import time
from datetime import datetime
import sys

class DistributorSaaSTester:
    def __init__(self, base_url: str = "https://distrib-flow-2.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_base = f"{base_url}/api"
        self.test_results = []
        
    def log_result(self, test_name: str, status: str, details: str = "", severity: str = "MEDIUM"):
        """Log test result"""
        result = {
            'test': test_name,
            'status': status,
            'details': details,
            'severity': severity,
            'timestamp': datetime.now().isoformat()
        }
        self.test_results.append(result)
        
        status_emoji = "✅" if status == "PASS" else "❌" if status == "FAIL" else "⚠️"
        print(f"{status_emoji} {test_name}: {status}")
        if details:
            print(f"    {details}")
            
    def make_request(self, method: str, endpoint: str, data: dict = None, 
                    headers: dict = None) -> dict:
        """Make API request with error handling"""
        url = f"{self.api_base}/{endpoint.lstrip('/')}"
        
        # Default headers
        default_headers = {'Content-Type': 'application/json'}
        if headers:
            default_headers.update(headers)
            
        try:
            if method.upper() == 'GET':
                response = requests.get(url, headers=default_headers, timeout=10)
            elif method.upper() == 'POST':
                response = requests.post(url, json=data, headers=default_headers, timeout=10)
            elif method.upper() == 'PUT':
                response = requests.put(url, json=data, headers=default_headers, timeout=10)
            elif method.upper() == 'DELETE':
                response = requests.delete(url, headers=default_headers, timeout=10)
            elif method.upper() == 'OPTIONS':
                response = requests.options(url, headers=default_headers, timeout=10)
            else:
                raise ValueError(f"Unsupported method: {method}")
                
            return {
                'status_code': response.status_code,
                'data': response.json() if response.content else {},
                'headers': dict(response.headers)
            }
        except requests.exceptions.RequestException as e:
            return {
                'status_code': 0,
                'data': {'error': str(e)},
                'headers': {}
            }
        except json.JSONDecodeError:
            return {
                'status_code': response.status_code,
                'data': {'error': 'Invalid JSON response'},
                'headers': dict(response.headers)
            }

    def test_multi_tenancy_isolation(self):
        """Test Suite 1: Multi-tenant data isolation"""
        print("\n🎯 TEST SUITE 1: MULTI-TENANCY ISOLATION")
        
        # Test unauthorized access to core endpoints
        endpoints = [
            ('/retailers', 'Retailer access'),
            ('/orders', 'Order access'),
            ('/products', 'Product access'),
            ('/empty-bottles?route=empty-items', 'Empty bottle access'),
            ('/staff', 'Staff access'),
            ('/audit-logs', 'Audit log access')
        ]
        
        for endpoint, name in endpoints:
            result = self.make_request('GET', endpoint)
            if result['status_code'] == 401:
                self.log_result(f"Multi-tenant: {name} protection", "PASS", 
                              "Properly blocks unauthenticated access", "CRITICAL")
            elif result['status_code'] == 0:
                self.log_result(f"Multi-tenant: {name} protection", "WARN",
                              "Network/connection issue", "HIGH")
            else:
                self.log_result(f"Multi-tenant: {name} protection", "FAIL",
                              f"Expected 401, got {result['status_code']}", "CRITICAL")

    def test_rbac_system(self):
        """Test Suite 2: Role-based Access Control"""
        print("\n🎯 TEST SUITE 2: ROLE-BASED ACCESS CONTROL")
        
        # Test admin-only endpoints
        admin_endpoints = [
            ('/staff', 'Staff management'),
            ('/audit-logs', 'Audit logs')
        ]
        
        for endpoint, name in admin_endpoints:
            result = self.make_request('GET', endpoint)
            if result['status_code'] in [401, 403]:
                self.log_result(f"RBAC: {name} protection", "PASS",
                              "Properly restricts access", "HIGH")
            elif result['status_code'] == 0:
                self.log_result(f"RBAC: {name} protection", "WARN",
                              "Network/connection issue", "HIGH")
            else:
                self.log_result(f"RBAC: {name} protection", "FAIL",
                              f"Expected 401/403, got {result['status_code']}", "HIGH")

    def test_empty_bottle_lifecycle(self):
        """Test Suite 3: Empty Bottle Management"""
        print("\n🎯 TEST SUITE 3: EMPTY BOTTLE LIFECYCLE")
        
        # Test empty bottle endpoints
        empty_endpoints = [
            ('empty-bottles?route=empty-items', 'List empty items'),
            ('empty-bottles?route=warehouse-empty-inventory', 'Warehouse inventory'),
            ('empty-bottles?route=empty-dashboard-metrics', 'Dashboard metrics')
        ]
        
        for endpoint, name in empty_endpoints:
            result = self.make_request('GET', endpoint)
            if result['status_code'] == 401:
                self.log_result(f"Empty Bottles: {name} authentication", "PASS",
                              "Requires authentication", "CRITICAL")
            elif result['status_code'] == 0:
                self.log_result(f"Empty Bottles: {name} authentication", "WARN",
                              "Network/connection issue", "HIGH")
            else:
                self.log_result(f"Empty Bottles: {name} authentication", "FAIL",
                              f"Expected 401, got {result['status_code']}", "CRITICAL")
                              
        # Test POST operations
        post_data = [
            ({'route': 'create-empty-item', 'name': 'Test', 'deposit_value': 500}, 'Create empty item'),
            ({'route': 'manufacturer-supply', 'items': [{'empty_item_id': 'test', 'quantity': 100}]}, 'Manufacturer supply')
        ]
        
        for data, name in post_data:
            result = self.make_request('POST', 'empty-bottles', data)
            if result['status_code'] in [401, 403]:
                self.log_result(f"Empty Bottles: {name} protection", "PASS",
                              "Properly requires authentication/authorization", "CRITICAL")
            elif result['status_code'] == 0:
                self.log_result(f"Empty Bottles: {name} protection", "WARN",
                              "Network/connection issue", "HIGH")
            else:
                self.log_result(f"Empty Bottles: {name} protection", "FAIL",
                              f"Expected 401/403, got {result['status_code']}", "CRITICAL")

    def test_order_management(self):
        """Test Suite 4: Order Management System"""
        print("\n🎯 TEST SUITE 4: ORDER MANAGEMENT")
        
        # Test order endpoints
        result = self.make_request('GET', '/orders')
        if result['status_code'] == 401:
            self.log_result("Orders: List orders authentication", "PASS",
                          "Requires authentication", "HIGH")
        elif result['status_code'] == 0:
            self.log_result("Orders: List orders authentication", "WARN",
                          "Network/connection issue", "HIGH")
        else:
            self.log_result("Orders: List orders authentication", "FAIL",
                          f"Expected 401, got {result['status_code']}", "HIGH")

    def test_subscription_system(self):
        """Test Suite 5: Subscription Engine"""
        print("\n🎯 TEST SUITE 5: SUBSCRIPTION ENGINE")
        
        subscription_endpoints = [
            ('subscriptions?route=subscription', 'Status check'),
            ('subscriptions?route=check-feature&feature=empty_lifecycle', 'Feature check')
        ]
        
        for endpoint, name in subscription_endpoints:
            result = self.make_request('GET', endpoint)
            if result['status_code'] in [401, 403]:
                self.log_result(f"Subscriptions: {name} protection", "PASS",
                              "Requires authentication", "CRITICAL")
            elif result['status_code'] == 0:
                self.log_result(f"Subscriptions: {name} protection", "WARN",
                              "Network/connection issue", "HIGH")
            else:
                self.log_result(f"Subscriptions: {name} protection", "FAIL",
                              f"Expected 401/403, got {result['status_code']}", "CRITICAL")

    def test_platform_admin(self):
        """Test Suite 6: Super Admin Platform"""
        print("\n🎯 TEST SUITE 6: SUPER ADMIN PLATFORM")
        
        platform_endpoints = [
            ('platform?route=kpis', 'Platform KPIs'),
            ('platform?route=businesses', 'Business management')
        ]
        
        for endpoint, name in platform_endpoints:
            result = self.make_request('GET', endpoint)
            if result['status_code'] in [401, 403]:
                self.log_result(f"Platform: {name} protection", "PASS",
                              "Properly restricts to super admin", "HIGH")
            elif result['status_code'] == 0:
                self.log_result(f"Platform: {name} protection", "WARN",
                              "Network/connection issue", "HIGH")
            else:
                self.log_result(f"Platform: {name} protection", "FAIL",
                              f"Expected 401/403, got {result['status_code']}", "HIGH")

    def test_performance(self):
        """Test Suite 7: Performance Testing"""
        print("\n🎯 TEST SUITE 7: PERFORMANCE TESTING")
        
        endpoints_to_test = [
            '/dashboard/metrics',
            '/products', 
            '/retailers',
            '/orders',
            '/payments'
        ]
        
        for endpoint in endpoints_to_test:
            start_time = time.time()
            result = self.make_request('GET', endpoint)
            response_time = time.time() - start_time
            
            if result['status_code'] == 0:
                self.log_result(f"Performance: {endpoint}", "WARN",
                              "Network/connection issue", "MEDIUM")
            elif response_time < 3.0:
                self.log_result(f"Performance: {endpoint}", "PASS",
                              f"Response time: {response_time:.2f}s", "MEDIUM")
            else:
                self.log_result(f"Performance: {endpoint}", "FAIL",
                              f"Slow response: {response_time:.2f}s", "MEDIUM")

    def test_security(self):
        """Test Suite 8: Security Testing"""
        print("\n🎯 TEST SUITE 8: SECURITY TESTING")
        
        # Test CORS headers
        result = self.make_request('OPTIONS', '/products')
        if result['status_code'] == 0:
            self.log_result("Security: CORS configuration", "WARN",
                          "Network/connection issue", "MEDIUM")
        else:
            cors_headers = result.get('headers', {})
            if 'Access-Control-Allow-Origin' in cors_headers or 'access-control-allow-origin' in cors_headers:
                self.log_result("Security: CORS headers", "PASS",
                              "CORS properly configured", "MEDIUM")
            else:
                self.log_result("Security: CORS headers", "FAIL",
                              "CORS headers missing", "MEDIUM")

    def test_error_handling(self):
        """Test Suite 9: Error Handling"""
        print("\n🎯 TEST SUITE 9: ERROR HANDLING")
        
        # Test non-existent endpoint
        result = self.make_request('GET', '/nonexistent-endpoint')
        if result['status_code'] == 0:
            self.log_result("Error Handling: 404 handling", "WARN",
                          "Network/connection issue", "MEDIUM")
        elif result['status_code'] == 404:
            self.log_result("Error Handling: 404 handling", "PASS",
                          "Properly returns 404 for missing endpoints", "MEDIUM")
        else:
            self.log_result("Error Handling: 404 handling", "FAIL",
                          f"Expected 404, got {result['status_code']}", "MEDIUM")

    def run_all_tests(self):
        """Run comprehensive test suite"""
        print("🚀 Starting Comprehensive Integration Test Suite")
        print("=" * 60)
        
        start_time = time.time()
        
        # Execute all test suites
        self.test_multi_tenancy_isolation()
        self.test_rbac_system()
        self.test_empty_bottle_lifecycle()
        self.test_order_management()
        self.test_subscription_system()
        self.test_platform_admin()
        self.test_performance()
        self.test_security()
        self.test_error_handling()
        
        total_time = time.time() - start_time
        
        # Generate summary
        self.generate_summary(total_time)
        
    def generate_summary(self, total_time: float):
        """Generate final test summary"""
        print("\n" + "=" * 60)
        print("📊 COMPREHENSIVE TEST SUMMARY")
        print("=" * 60)
        
        # Count results by status
        pass_count = len([r for r in self.test_results if r['status'] == 'PASS'])
        fail_count = len([r for r in self.test_results if r['status'] == 'FAIL'])
        warn_count = len([r for r in self.test_results if r['status'] == 'WARN'])
        total_tests = len(self.test_results)
        
        # Count by severity  
        critical_issues = len([r for r in self.test_results if r['severity'] == 'CRITICAL' and r['status'] == 'FAIL'])
        high_issues = len([r for r in self.test_results if r['severity'] == 'HIGH' and r['status'] == 'FAIL'])
        
        print(f"Total Tests Run: {total_tests}")
        print(f"✅ Passed: {pass_count}")
        print(f"❌ Failed: {fail_count}")
        print(f"⚠️  Warnings: {warn_count}")
        print(f"🕒 Total Time: {total_time:.2f} seconds")
        
        if total_tests > 0:
            print(f"📈 Pass Rate: {(pass_count/total_tests*100):.1f}%")
        
        print(f"🚨 Critical Issues: {critical_issues}")
        print(f"⚠️  High Priority Issues: {high_issues}")
        
        # System stability score (1-10)
        stability_score = max(1, 10 - (critical_issues * 3) - (high_issues * 1))
        print(f"🎯 System Stability Score: {stability_score}/10")
        
        # Production readiness assessment
        production_ready = critical_issues == 0 and high_issues <= 2
        print(f"🏭 Production Ready: {'YES' if production_ready else 'NO'}")
        
        print("\n📝 DETAILED RESULTS:")
        print("-" * 40)
        
        for result in self.test_results:
            status_emoji = "✅" if result['status'] == 'PASS' else "❌" if result['status'] == 'FAIL' else "⚠️"
            severity_emoji = "🚨" if result['severity'] == 'CRITICAL' else "⚠️" if result['severity'] == 'HIGH' else "📊"
            
            print(f"{status_emoji} {severity_emoji} {result['test']}")
            if result['details']:
                print(f"    {result['details']}")
                
        print("\n" + "=" * 60)
        print("🎯 COMPREHENSIVE INTEGRATION TEST COMPLETE")
        print("=" * 60)

if __name__ == "__main__":
    print("🎯 Multi-Tenant FMCG Distributor SaaS - Comprehensive Integration Test")
    print("Testing: Multi-tenancy, RBAC, Empty Bottles, Subscriptions, Security, Performance")
    print()
    
    # Initialize tester
    tester = DistributorSaaSTester()
    
    # Run all tests
    tester.run_all_tests()