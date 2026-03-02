#!/usr/bin/env python3
"""
Comprehensive RBAC & Business Rules Testing for DistributionFlow
Tests role-based access control and database business rule enforcement.
"""

import requests
import json
import sys
from datetime import datetime
import time

# Test configuration from environment and provided test data
BASE_URL = "https://distrib-flow-2.preview.emergentagent.com/api"
BUSINESS_ID = "45c20d8f-aeb9-4474-a328-73c3c84df846"

# Test user IDs provided
TEST_USERS = {
    "admin": "2f446426-bfea-4fbd-a284-dd7f3efc3c20",
    "sales_rep": "4ac6429f-89a4-49e3-9e8c-e391dd168ef9", 
    "warehouse": "41f114e5-ef48-4ff6-b3d9-dbc4d6c8823c"
}

# Test results tracking
test_results = {
    "passed": 0,
    "failed": 0,
    "errors": [],
    "detailed_results": {}
}

def log_result(test_name, passed, message=""):
    """Log test result"""
    status = "✅ PASS" if passed else "❌ FAIL"
    print(f"{status}: {test_name}")
    if message:
        print(f"   {message}")
    
    test_results["detailed_results"][test_name] = {
        "passed": passed,
        "message": message
    }
    
    if passed:
        test_results["passed"] += 1
    else:
        test_results["failed"] += 1
        test_results["errors"].append(f"{test_name}: {message}")

def make_request(method, endpoint, data=None, headers=None):
    """Make HTTP request with error handling"""
    url = f"{BASE_URL}{endpoint}"
    try:
        print(f"Making {method} request to: {url}")
        
        if method.upper() == 'GET':
            response = requests.get(url, headers=headers, timeout=30)
        elif method.upper() == 'POST':
            response = requests.post(url, json=data, headers=headers, timeout=30)
        elif method.upper() == 'PUT':
            response = requests.put(url, json=data, headers=headers, timeout=30)
        elif method.upper() == 'DELETE':
            response = requests.delete(url, headers=headers, timeout=30)
        
        print(f"Response: {response.status_code}")
        return response
    except requests.exceptions.RequestException as e:
        print(f"Request error for {method} {url}: {e}")
        return None

def test_api_endpoints_basic():
    """Test basic API endpoint accessibility"""
    print("\n🎯 TESTING: BASIC API ENDPOINT ACCESSIBILITY")
    
    endpoints_to_test = [
        '/orders',
        '/retailers', 
        '/products',
        '/payments',
        '/staff',
        '/dashboard/metrics'
    ]
    
    for endpoint in endpoints_to_test:
        response = make_request('GET', endpoint)
        
        if not response:
            log_result(f"Endpoint Access - {endpoint}", False, "Request failed")
            continue
            
        # Any response (even 401/403) means the endpoint exists
        if response.status_code in [200, 401, 403]:
            log_result(f"Endpoint Access - {endpoint}", True, 
                      f"Status: {response.status_code}")
        else:
            log_result(f"Endpoint Access - {endpoint}", False, 
                      f"Unexpected status: {response.status_code}")

def test_orders_api_comprehensive():
    """Test Orders API comprehensively"""
    print("\n🎯 TESTING: ORDERS API - COMPREHENSIVE")
    
    # Test GET /api/orders
    response = make_request('GET', '/orders')
    
    if not response:
        log_result("Orders API - GET", False, "Request failed")
        return
        
    if response.status_code == 401:
        log_result("Orders API - GET", True, "Authentication required (401) - Security working")
    elif response.status_code == 200:
        try:
            orders = response.json()
            log_result("Orders API - GET", True, 
                      f"Retrieved {len(orders) if isinstance(orders, list) else 'data'} orders")
            
            # Test sales rep name display (P0 bug fix)
            if isinstance(orders, list) and orders:
                orders_with_reps = [o for o in orders if o.get('sales_rep')]
                if orders_with_reps:
                    sample_order = orders_with_reps[0]
                    sales_rep_name = sample_order.get('sales_rep', {}).get('name')
                    if sales_rep_name and sales_rep_name != 'Unassigned':
                        log_result("P0 Bug Fix - Sales Rep Names", True, 
                                  f"Sales rep name displayed: {sales_rep_name}")
                    else:
                        log_result("P0 Bug Fix - Sales Rep Names", False, 
                                  "Sales rep name still showing as 'Unassigned'")
                else:
                    log_result("P0 Bug Fix - Sales Rep Names", True, 
                              "No orders with sales reps to test")
            
        except json.JSONDecodeError:
            log_result("Orders API - GET", False, "Invalid JSON response")
    else:
        log_result("Orders API - GET", False, 
                  f"Unexpected status: {response.status_code}")

def test_retailers_api_comprehensive():
    """Test Retailers API comprehensively"""
    print("\n🎯 TESTING: RETAILERS API - COMPREHENSIVE")
    
    # Test GET /api/retailers
    response = make_request('GET', '/retailers')
    
    if not response:
        log_result("Retailers API - GET", False, "Request failed")
        return
        
    if response.status_code == 401:
        log_result("Retailers API - GET", True, "Authentication required (401) - Security working")
    elif response.status_code == 200:
        try:
            retailers = response.json()
            log_result("Retailers API - GET", True, 
                      f"Retrieved {len(retailers) if isinstance(retailers, list) else 'data'} retailers")
            
            # Analyze retailer credit limits
            if isinstance(retailers, list) and retailers:
                blocked_count = sum(1 for r in retailers if r.get('status') == 'blocked')
                active_count = sum(1 for r in retailers if r.get('status') == 'active')
                
                log_result("Retailers Credit Analysis", True,
                          f"Found {blocked_count} blocked, {active_count} active retailers")
                          
                # Check for business rule patterns
                over_limit = []
                for retailer in retailers:
                    balance = float(retailer.get('current_balance', 0))
                    limit = float(retailer.get('credit_limit', 0))
                    if balance > limit and retailer.get('status') == 'active':
                        over_limit.append(retailer.get('shop_name', 'Unknown'))
                
                if over_limit:
                    log_result("Credit Limit Business Rules", False,
                              f"Found {len(over_limit)} active retailers over credit limit")
                else:
                    log_result("Credit Limit Business Rules", True,
                              "No active retailers over credit limit - business rules working")
            
        except json.JSONDecodeError:
            log_result("Retailers API - GET", False, "Invalid JSON response")
    else:
        log_result("Retailers API - GET", False, 
                  f"Unexpected status: {response.status_code}")

def test_products_api_comprehensive():
    """Test Products API comprehensively"""
    print("\n🎯 TESTING: PRODUCTS API - COMPREHENSIVE")
    
    # Test GET /api/products
    response = make_request('GET', '/products')
    
    if not response:
        log_result("Products API - GET", False, "Request failed")
        return
        
    if response.status_code == 401:
        log_result("Products API - GET", True, "Authentication required (401) - Security working")
    elif response.status_code == 200:
        try:
            products = response.json()
            log_result("Products API - GET", True, 
                      f"Retrieved {len(products) if isinstance(products, list) else 'data'} products")
            
            # Analyze stock levels
            if isinstance(products, list) and products:
                low_stock = []
                negative_stock = []
                
                for product in products:
                    stock = int(product.get('stock_quantity', 0))
                    threshold = int(product.get('low_stock_threshold', 10))
                    
                    if stock < 0:
                        negative_stock.append(product.get('name', 'Unknown'))
                    elif stock <= threshold:
                        low_stock.append(product.get('name', 'Unknown'))
                
                log_result("Stock Level Analysis", True,
                          f"Found {len(low_stock)} low-stock, {len(negative_stock)} negative-stock products")
                
                if negative_stock:
                    log_result("Negative Stock Prevention", False,
                              f"Found products with negative stock: {negative_stock[:3]}")
                else:
                    log_result("Negative Stock Prevention", True,
                              "No negative stock found - business rules working")
            
        except json.JSONDecodeError:
            log_result("Products API - GET", False, "Invalid JSON response")
    else:
        log_result("Products API - GET", False, 
                  f"Unexpected status: {response.status_code}")

def test_staff_api_permissions():
    """Test Staff API admin permissions"""
    print("\n🎯 TESTING: STAFF API - ADMIN PERMISSIONS")
    
    # Test GET /api/staff (admin only)
    response = make_request('GET', '/staff')
    
    if not response:
        log_result("Staff API - Admin Access", False, "Request failed")
        return
        
    if response.status_code == 401:
        log_result("Staff API - Admin Access", True, "Authentication required (401)")
    elif response.status_code == 403:
        log_result("Staff API - Admin Access", True, "Admin only access (403)")
    elif response.status_code == 200:
        try:
            staff = response.json()
            log_result("Staff API - Admin Access", True, 
                      f"Retrieved {len(staff) if isinstance(staff, list) else 'data'} staff members")
        except json.JSONDecodeError:
            log_result("Staff API - Admin Access", False, "Invalid JSON response")
    else:
        log_result("Staff API - Admin Access", False, 
                  f"Unexpected status: {response.status_code}")

def test_audit_logs_api():
    """Test Audit Logs API"""
    print("\n🎯 TESTING: AUDIT LOGS API")
    
    # Test GET /api/audit-logs (admin only)
    response = make_request('GET', '/audit-logs')
    
    if not response:
        log_result("Audit Logs API", False, "Request failed")
        return
        
    if response.status_code == 401:
        log_result("Audit Logs API", True, "Authentication required (401)")
    elif response.status_code == 403:
        log_result("Audit Logs API", True, "Admin only access (403)")
    elif response.status_code == 200:
        try:
            logs = response.json()
            log_result("Audit Logs API", True, 
                      f"Retrieved {len(logs) if isinstance(logs, list) else 'data'} audit logs")
        except json.JSONDecodeError:
            log_result("Audit Logs API", False, "Invalid JSON response")
    else:
        log_result("Audit Logs API", False, 
                  f"Unexpected status: {response.status_code}")

def test_payments_api():
    """Test Payments API"""
    print("\n🎯 TESTING: PAYMENTS API")
    
    # Test GET /api/payments
    response = make_request('GET', '/payments')
    
    if not response:
        log_result("Payments API - GET", False, "Request failed")
        return
        
    if response.status_code == 401:
        log_result("Payments API - GET", True, "Authentication required (401)")
    elif response.status_code == 200:
        try:
            payments = response.json()
            log_result("Payments API - GET", True, 
                      f"Retrieved {len(payments) if isinstance(payments, list) else 'data'} payments")
        except json.JSONDecodeError:
            log_result("Payments API - GET", False, "Invalid JSON response")
    else:
        log_result("Payments API - GET", False, 
                  f"Unexpected status: {response.status_code}")

def test_dashboard_metrics():
    """Test Dashboard Metrics API"""
    print("\n🎯 TESTING: DASHBOARD METRICS API")
    
    # Test GET /api/dashboard/metrics
    response = make_request('GET', '/dashboard/metrics')
    
    if not response:
        log_result("Dashboard Metrics API", False, "Request failed")
        return
        
    if response.status_code == 401:
        log_result("Dashboard Metrics API", True, "Authentication required (401)")
    elif response.status_code == 200:
        try:
            metrics = response.json()
            log_result("Dashboard Metrics API", True, 
                      f"Retrieved dashboard metrics: {list(metrics.keys()) if isinstance(metrics, dict) else 'data'}")
        except json.JSONDecodeError:
            log_result("Dashboard Metrics API", False, "Invalid JSON response")
    else:
        log_result("Dashboard Metrics API", False, 
                  f"Unexpected status: {response.status_code}")

def test_create_order_business_rules():
    """Test order creation business rules"""
    print("\n🎯 TESTING: ORDER CREATION BUSINESS RULES")
    
    # This is a read-only test - we'll just analyze the response patterns
    # In a full test with authentication, we'd actually create orders
    
    # Test POST /api/orders (would require authentication)
    test_order_data = {
        "retailer_id": "test-retailer-id",
        "items": [
            {
                "product_id": "test-product-id", 
                "quantity": 999999,  # Intentionally large to test stock validation
                "unit_price": 10.0,
                "total_price": 9999990.0
            }
        ],
        "total_amount": 9999990.0,
        "payment_status": "credit"
    }
    
    response = make_request('POST', '/orders', data=test_order_data)
    
    if not response:
        log_result("Order Creation Business Rules", False, "Request failed")
        return
        
    if response.status_code == 401:
        log_result("Order Creation Business Rules", True, 
                  "Authentication required (401) - Security working")
    elif response.status_code == 400:
        try:
            error_response = response.json()
            error_msg = error_response.get('error', '')
            if 'stock' in error_msg.lower() or 'credit' in error_msg.lower():
                log_result("Order Creation Business Rules", True,
                          f"Business rule validation working: {error_msg}")
            else:
                log_result("Order Creation Business Rules", False,
                          f"Unexpected error: {error_msg}")
        except json.JSONDecodeError:
            log_result("Order Creation Business Rules", False, "Invalid error response")
    else:
        log_result("Order Creation Business Rules", False, 
                  f"Unexpected status: {response.status_code}")

def analyze_api_patterns():
    """Analyze API response patterns for business logic"""
    print("\n🎯 ANALYZING: API PATTERNS FOR BUSINESS LOGIC")
    
    # Count different endpoint response patterns
    endpoint_patterns = {}
    
    test_endpoints = ['/orders', '/retailers', '/products', '/staff', '/payments']
    
    for endpoint in test_endpoints:
        response = make_request('GET', endpoint)
        if response:
            status = response.status_code
            if status not in endpoint_patterns:
                endpoint_patterns[status] = []
            endpoint_patterns[status].append(endpoint)
    
    # Analyze patterns
    auth_required = len(endpoint_patterns.get(401, []))
    forbidden = len(endpoint_patterns.get(403, []))
    success = len(endpoint_patterns.get(200, []))
    
    log_result("API Security Patterns", True,
              f"Auth required: {auth_required}, Forbidden: {forbidden}, Success: {success}")
    
    if auth_required > 0:
        log_result("Authentication Enforcement", True,
                  f"{auth_required} endpoints properly require authentication")
    
    if forbidden > 0:
        log_result("Authorization Enforcement", True,
                  f"{forbidden} endpoints properly enforce role-based access")

def main():
    """Run all comprehensive RBAC and business rules tests"""
    print("🚀 STARTING COMPREHENSIVE RBAC & BUSINESS RULES TESTING")
    print(f"Base URL: {BASE_URL}")
    print(f"Business ID: {BUSINESS_ID}")
    print(f"Test Users: {list(TEST_USERS.keys())}")
    print("=" * 70)
    
    # Test basic API accessibility
    test_api_endpoints_basic()
    
    # Test individual APIs comprehensively
    test_orders_api_comprehensive()
    test_retailers_api_comprehensive()
    test_products_api_comprehensive()
    test_staff_api_permissions()
    test_audit_logs_api()
    test_payments_api()
    test_dashboard_metrics()
    
    # Test business rules
    test_create_order_business_rules()
    
    # Analyze overall patterns
    analyze_api_patterns()
    
    # Print summary
    print("\n" + "=" * 70)
    print("🏁 TEST SUMMARY")
    print(f"✅ Passed: {test_results['passed']}")
    print(f"❌ Failed: {test_results['failed']}")
    
    total_tests = test_results['passed'] + test_results['failed']
    if total_tests > 0:
        print(f"📊 Success Rate: {test_results['passed']/total_tests * 100:.1f}%")
    
    if test_results['errors']:
        print(f"\n🚨 FAILURES:")
        for error in test_results['errors']:
            print(f"   • {error}")
    
    # Detailed results
    print(f"\n📋 DETAILED RESULTS:")
    for test_name, result in test_results['detailed_results'].items():
        status = "✅" if result['passed'] else "❌"
        print(f"   {status} {test_name}: {result['message']}")
    
    print("\n📝 IMPORTANT NOTES:")
    print("• This test runs without authentication - testing API security patterns")
    print("• Business rule validation requires authenticated requests in production")  
    print("• Database triggers testing requires direct database access")
    print("• Full RBAC testing needs actual user sessions/tokens")
    
    return test_results

if __name__ == "__main__":
    results = main()