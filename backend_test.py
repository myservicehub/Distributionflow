#!/usr/bin/env python3
"""
Empty Bottle Lifecycle Management System - Backend API Testing
Tests all empty bottle endpoints according to the review request priorities.
"""

import asyncio
import json
import aiohttp
import sys
from datetime import datetime

# Configuration
BASE_URL = "https://distrib-flow-2.preview.emergentagent.com"
API_BASE = f"{BASE_URL}/api"

class EmptyBottleAPITester:
    def __init__(self):
        self.session = None
        self.created_empty_item_id = None
        self.test_results = []
        
    async def setup_session(self):
        """Setup HTTP session with proper headers"""
        connector = aiohttp.TCPConnector(ssl=False)
        timeout = aiohttp.ClientTimeout(total=30)
        self.session = aiohttp.ClientSession(
            connector=connector,
            timeout=timeout,
            headers={
                'Content-Type': 'application/json',
                'User-Agent': 'EmptyBottle-API-Tester/1.0'
            }
        )
        
    async def cleanup(self):
        """Close session"""
        if self.session:
            await self.session.close()
            
    def log_result(self, test_name, status, details):
        """Log test result"""
        result = {
            'test': test_name,
            'status': status,
            'details': details,
            'timestamp': datetime.now().isoformat()
        }
        self.test_results.append(result)
        status_emoji = "✅" if status == "PASS" else "❌" if status == "FAIL" else "⚠️"
        print(f"{status_emoji} {test_name}: {details}")
        
    async def make_request(self, method, url, data=None, params=None):
        """Make HTTP request with error handling"""
        try:
            if method.upper() == 'GET':
                async with self.session.get(url, params=params) as response:
                    response_text = await response.text()
                    try:
                        response_data = json.loads(response_text) if response_text else {}
                    except json.JSONDecodeError:
                        response_data = {"raw_response": response_text}
                    return response.status, response_data
            elif method.upper() == 'POST':
                async with self.session.post(url, json=data) as response:
                    response_text = await response.text()
                    try:
                        response_data = json.loads(response_text) if response_text else {}
                    except json.JSONDecodeError:
                        response_data = {"raw_response": response_text}
                    return response.status, response_data
        except Exception as e:
            return None, {"error": str(e)}

    # HIGH PRIORITY TESTS
    
    async def test_create_empty_item(self):
        """HIGH PRIORITY: Test POST /api/empty-bottles with route: 'create-empty-item'"""
        test_name = "POST /api/empty-bottles - Create Empty Item"
        
        payload = {
            "route": "create-empty-item",
            "name": "Coca-Cola Crate",
            "deposit_value": 500
        }
        
        status_code, response = await self.make_request(
            'POST', 
            f"{API_BASE}/empty-bottles", 
            data=payload
        )
        
        if status_code == 200:
            if 'id' in response:
                self.created_empty_item_id = response['id']
                self.log_result(test_name, "PASS", f"Created empty item with ID: {self.created_empty_item_id}")
                
                # Verify warehouse inventory was created
                warehouse_status, warehouse_response = await self.make_request(
                    'GET',
                    f"{API_BASE}/empty-bottles",
                    params={"route": "warehouse-empty-inventory"}
                )
                
                if warehouse_status == 200:
                    inventory_found = any(item.get('empty_item_id') == self.created_empty_item_id for item in warehouse_response)
                    if inventory_found:
                        self.log_result(f"{test_name} - Warehouse Inventory", "PASS", "Warehouse inventory record created automatically")
                    else:
                        self.log_result(f"{test_name} - Warehouse Inventory", "WARN", "Warehouse inventory record not found")
                else:
                    self.log_result(f"{test_name} - Warehouse Inventory", "WARN", f"Could not verify warehouse inventory: {warehouse_status}")
            else:
                self.log_result(test_name, "FAIL", f"Missing ID in response: {response}")
        elif status_code == 403:
            self.log_result(test_name, "FAIL", "Forbidden - Check user role permissions")
        elif status_code == 401:
            self.log_result(test_name, "FAIL", "Unauthorized - Authentication required")
        else:
            self.log_result(test_name, "FAIL", f"Status: {status_code}, Response: {response}")
            
    async def test_get_empty_items(self):
        """HIGH PRIORITY: Test GET /api/empty-bottles?route=empty-items"""
        test_name = "GET /api/empty-bottles - List Empty Items"
        
        status_code, response = await self.make_request(
            'GET',
            f"{API_BASE}/empty-bottles",
            params={"route": "empty-items"}
        )
        
        if status_code == 200:
            if isinstance(response, list):
                self.log_result(test_name, "PASS", f"Retrieved {len(response)} empty items")
                if self.created_empty_item_id:
                    item_found = any(item.get('id') == self.created_empty_item_id for item in response)
                    if item_found:
                        self.log_result(f"{test_name} - Created Item", "PASS", "Previously created item found in list")
                    else:
                        self.log_result(f"{test_name} - Created Item", "WARN", "Previously created item not found in list")
            else:
                self.log_result(test_name, "FAIL", f"Expected array, got: {type(response)}")
        else:
            self.log_result(test_name, "FAIL", f"Status: {status_code}, Response: {response}")
            
    async def test_manufacturer_supply(self):
        """HIGH PRIORITY: Test POST /api/empty-bottles with route: 'manufacturer-supply'"""
        test_name = "POST /api/empty-bottles - Manufacturer Supply"
        
        if not self.created_empty_item_id:
            self.log_result(test_name, "SKIP", "No empty item ID available - create empty item first")
            return
            
        payload = {
            "route": "manufacturer-supply",
            "empty_item_id": self.created_empty_item_id,
            "quantity": 100,
            "notes": "Initial stock from manufacturer - API Test"
        }
        
        status_code, response = await self.make_request(
            'POST',
            f"{API_BASE}/empty-bottles",
            data=payload
        )
        
        if status_code == 200:
            if response.get('success'):
                self.log_result(test_name, "PASS", f"Manufacturer supply recorded successfully. Movement ID: {response.get('movement', {}).get('id', 'N/A')}")
                
                # Verify warehouse inventory was updated
                warehouse_status, warehouse_response = await self.make_request(
                    'GET',
                    f"{API_BASE}/empty-bottles",
                    params={"route": "warehouse-empty-inventory"}
                )
                
                if warehouse_status == 200:
                    for item in warehouse_response:
                        if item.get('empty_item_id') == self.created_empty_item_id:
                            if item.get('quantity_available', 0) >= 100:
                                self.log_result(f"{test_name} - Inventory Update", "PASS", f"Warehouse quantity updated: {item.get('quantity_available')}")
                            else:
                                self.log_result(f"{test_name} - Inventory Update", "WARN", f"Expected quantity >= 100, got: {item.get('quantity_available')}")
                            break
                    else:
                        self.log_result(f"{test_name} - Inventory Update", "WARN", "Could not find inventory record for the item")
                else:
                    self.log_result(f"{test_name} - Inventory Update", "WARN", f"Could not verify inventory update: {warehouse_status}")
            else:
                self.log_result(test_name, "FAIL", f"Success flag false: {response}")
        elif status_code == 403:
            self.log_result(test_name, "FAIL", "Forbidden - Check user role permissions")
        elif status_code == 400:
            self.log_result(test_name, "FAIL", f"Bad request - Check data: {response}")
        else:
            self.log_result(test_name, "FAIL", f"Status: {status_code}, Response: {response}")

    # MEDIUM PRIORITY TESTS
    
    async def test_get_warehouse_inventory(self):
        """MEDIUM PRIORITY: Test GET /api/empty-bottles?route=warehouse-empty-inventory"""
        test_name = "GET /api/empty-bottles - Warehouse Empty Inventory"
        
        status_code, response = await self.make_request(
            'GET',
            f"{API_BASE}/empty-bottles",
            params={"route": "warehouse-empty-inventory"}
        )
        
        if status_code == 200:
            if isinstance(response, list):
                self.log_result(test_name, "PASS", f"Retrieved warehouse inventory: {len(response)} items")
                
                # Check if items have proper structure
                for item in response[:3]:  # Check first 3 items
                    required_fields = ['empty_item_id', 'quantity_available']
                    missing_fields = [field for field in required_fields if field not in item]
                    if not missing_fields:
                        self.log_result(f"{test_name} - Data Structure", "PASS", f"Item has required fields")
                        break
                    else:
                        self.log_result(f"{test_name} - Data Structure", "WARN", f"Missing fields: {missing_fields}")
            else:
                self.log_result(test_name, "FAIL", f"Expected array, got: {type(response)}")
        else:
            self.log_result(test_name, "FAIL", f"Status: {status_code}, Response: {response}")
            
    async def test_get_retailer_balances(self):
        """MEDIUM PRIORITY: Test GET /api/empty-bottles?route=retailer-empty-balances"""
        test_name = "GET /api/empty-bottles - Retailer Empty Balances"
        
        status_code, response = await self.make_request(
            'GET',
            f"{API_BASE}/empty-bottles",
            params={"route": "retailer-empty-balances"}
        )
        
        if status_code == 200:
            if isinstance(response, list):
                self.log_result(test_name, "PASS", f"Retrieved retailer balances: {len(response)} records")
            else:
                self.log_result(test_name, "FAIL", f"Expected array, got: {type(response)}")
        else:
            self.log_result(test_name, "FAIL", f"Status: {status_code}, Response: {response}")
            
    async def test_get_empty_dashboard(self):
        """MEDIUM PRIORITY: Test GET /api/empty-bottles?route=empty-dashboard-metrics"""
        test_name = "GET /api/empty-bottles - Empty Dashboard Metrics"
        
        status_code, response = await self.make_request(
            'GET',
            f"{API_BASE}/empty-bottles",
            params={"route": "empty-dashboard-metrics"}
        )
        
        if status_code == 200:
            if isinstance(response, dict):
                expected_keys = ['warehouse', 'retailers', 'totalDepositExposure']
                missing_keys = [key for key in expected_keys if key not in response]
                if not missing_keys:
                    self.log_result(test_name, "PASS", f"Dashboard metrics retrieved with all expected sections")
                else:
                    self.log_result(test_name, "WARN", f"Missing keys: {missing_keys}")
            else:
                self.log_result(test_name, "FAIL", f"Expected object, got: {type(response)}")
        else:
            self.log_result(test_name, "FAIL", f"Status: {status_code}, Response: {response}")
            
    async def test_get_empty_reconciliation(self):
        """MEDIUM PRIORITY: Test GET /api/empty-bottles?route=empty-reconciliation"""
        test_name = "GET /api/empty-bottles - Empty Reconciliation Report"
        
        status_code, response = await self.make_request(
            'GET',
            f"{API_BASE}/empty-bottles",
            params={"route": "empty-reconciliation"}
        )
        
        if status_code == 200:
            if isinstance(response, dict):
                self.log_result(test_name, "PASS", f"Reconciliation report generated for {len(response)} item types")
            else:
                self.log_result(test_name, "FAIL", f"Expected object, got: {type(response)}")
        else:
            self.log_result(test_name, "FAIL", f"Status: {status_code}, Response: {response}")

    # LOW PRIORITY TESTS
    
    async def test_return_to_manufacturer(self):
        """LOW PRIORITY: Test POST /api/empty-bottles with route: 'return-to-manufacturer'"""
        test_name = "POST /api/empty-bottles - Return to Manufacturer"
        
        if not self.created_empty_item_id:
            self.log_result(test_name, "SKIP", "No empty item ID available")
            return
            
        payload = {
            "route": "return-to-manufacturer",
            "empty_item_id": self.created_empty_item_id,
            "quantity": 50,
            "notes": "Damaged crates - API Test"
        }
        
        status_code, response = await self.make_request(
            'POST',
            f"{API_BASE}/empty-bottles",
            data=payload
        )
        
        if status_code == 200:
            if response.get('success'):
                self.log_result(test_name, "PASS", f"Return to manufacturer recorded successfully")
            else:
                self.log_result(test_name, "FAIL", f"Success flag false: {response}")
        elif status_code == 400:
            self.log_result(test_name, "WARN", f"Insufficient stock (expected if no supply was recorded): {response}")
        elif status_code == 403:
            self.log_result(test_name, "FAIL", "Forbidden - Check user role permissions")
        else:
            self.log_result(test_name, "FAIL", f"Status: {status_code}, Response: {response}")
            
    async def test_manual_adjustment(self):
        """LOW PRIORITY: Test POST /api/empty-bottles with route: 'manual-adjustment'"""
        test_name = "POST /api/empty-bottles - Manual Adjustment"
        
        if not self.created_empty_item_id:
            self.log_result(test_name, "SKIP", "No empty item ID available")
            return
            
        payload = {
            "route": "manual-adjustment",
            "empty_item_id": self.created_empty_item_id,
            "adjustment_type": "adjustment",
            "quantity": 5,
            "location": "warehouse",
            "notes": "Stock take adjustment - API Test"
        }
        
        status_code, response = await self.make_request(
            'POST',
            f"{API_BASE}/empty-bottles",
            data=payload
        )
        
        if status_code == 200:
            if response.get('success'):
                self.log_result(test_name, "PASS", f"Manual adjustment recorded successfully")
            else:
                self.log_result(test_name, "FAIL", f"Success flag false: {response}")
        elif status_code == 403:
            self.log_result(test_name, "FAIL", "Forbidden - Check user role permissions")
        else:
            self.log_result(test_name, "FAIL", f"Status: {status_code}, Response: {response}")

    async def run_all_tests(self):
        """Run all tests in priority order"""
        print("🚀 Starting Empty Bottle API Testing...")
        print(f"📡 Base URL: {API_BASE}")
        print("=" * 80)
        
        await self.setup_session()
        
        try:
            # HIGH PRIORITY TESTS
            print("\n🔴 HIGH PRIORITY TESTS")
            print("-" * 40)
            await self.test_create_empty_item()
            await self.test_get_empty_items()
            await self.test_manufacturer_supply()
            
            # MEDIUM PRIORITY TESTS  
            print("\n🟡 MEDIUM PRIORITY TESTS")
            print("-" * 40)
            await self.test_get_warehouse_inventory()
            await self.test_get_retailer_balances()
            await self.test_get_empty_dashboard()
            await self.test_get_empty_reconciliation()
            
            # LOW PRIORITY TESTS
            print("\n🟢 LOW PRIORITY TESTS")
            print("-" * 40)
            await self.test_return_to_manufacturer()
            await self.test_manual_adjustment()
            
        finally:
            await self.cleanup()
            
        # Summary
        print("\n" + "=" * 80)
        print("📊 TEST SUMMARY")
        print("=" * 80)
        
        total_tests = len(self.test_results)
        passed_tests = len([r for r in self.test_results if r['status'] == 'PASS'])
        failed_tests = len([r for r in self.test_results if r['status'] == 'FAIL'])
        warning_tests = len([r for r in self.test_results if r['status'] == 'WARN'])
        skipped_tests = len([r for r in self.test_results if r['status'] == 'SKIP'])
        
        print(f"Total Tests: {total_tests}")
        print(f"✅ Passed: {passed_tests}")
        print(f"❌ Failed: {failed_tests}")
        print(f"⚠️ Warnings: {warning_tests}")
        print(f"⏭️ Skipped: {skipped_tests}")
        
        # Critical Issues
        critical_failures = [r for r in self.test_results if r['status'] == 'FAIL' and 'HIGH PRIORITY' in str(r)]
        if critical_failures:
            print(f"\n🚨 CRITICAL ISSUES FOUND: {len(critical_failures)}")
            for failure in critical_failures:
                print(f"   - {failure['test']}: {failure['details']}")
        
        print("\n" + "=" * 80)
        
        return {
            'total': total_tests,
            'passed': passed_tests,
            'failed': failed_tests,
            'warnings': warning_tests,
            'skipped': skipped_tests,
            'results': self.test_results
        }

async def main():
    """Main test runner"""
    tester = EmptyBottleAPITester()
    results = await tester.run_all_tests()
    
    # Exit with error code if there are failures
    if results['failed'] > 0:
        sys.exit(1)
    else:
        sys.exit(0)

if __name__ == "__main__":
    asyncio.run(main())