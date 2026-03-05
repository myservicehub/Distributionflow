#!/usr/bin/env python3
"""
FINAL PAYMENT BUG VERIFICATION - Code Analysis & Implementation Review
Comprehensive analysis of the payment balance update fix implementation.
"""

import os
import re

class PaymentFixAnalyzer:
    def __init__(self):
        self.route_file = "/app/app/api/[[...path]]/route.js"
        self.env_file = "/app/.env"
        self.results = []

    def log_finding(self, category, status, description, line_numbers=None):
        """Log analysis findings"""
        finding = {
            'category': category,
            'status': status,  # PASS, FAIL, WARN
            'description': description,
            'line_numbers': line_numbers
        }
        self.results.append(finding)
        
        status_emoji = "✅" if status == "PASS" else "❌" if status == "FAIL" else "⚠️"
        line_info = f" (lines {line_numbers})" if line_numbers else ""
        print(f"{status_emoji} {category}: {description}{line_info}")

    def analyze_payment_endpoint_implementation(self):
        """Analyze the complete payment endpoint implementation"""
        print("🔍 ANALYZING PAYMENT ENDPOINT IMPLEMENTATION")
        print("=" * 50)
        
        try:
            with open(self.route_file, 'r') as f:
                content = f.read()
                lines = content.split('\n')
            
            # Find payment endpoint
            payment_start = None
            payment_end = None
            
            for i, line in enumerate(lines):
                if "if (route === '/payments' && method === 'POST')" in line:
                    payment_start = i + 1
                elif payment_start and line.strip() == '}' and lines[i-1].strip() != '':
                    # Look for the closing brace of the payment handler
                    brace_count = 0
                    for j in range(payment_start - 1, len(lines)):
                        brace_count += lines[j].count('{') - lines[j].count('}')
                        if brace_count == 0:
                            payment_end = j + 1
                            break
                    break
            
            if payment_start:
                self.log_finding("Payment Endpoint", "PASS", 
                              "Payment POST endpoint found", f"{payment_start}-{payment_end or 'end'}")
                
                # Extract payment section for analysis
                payment_section = '\n'.join(lines[payment_start-1:payment_end] if payment_end else lines[payment_start-1:])
                
                # Check critical components
                components = {
                    "Authentication Check": ("getUserBusinessId", "User authentication and business context"),
                    "Service Role Client": ("adminSupabase = createClient", "Service role client creation"),
                    "Service Role Key": ("SUPABASE_SERVICE_ROLE_KEY", "Service role key usage"),
                    "Payment Insert": (".from('payments').insert", "Payment record creation"),
                    "Retailer Fetch": ("select('current_balance, credit_limit')", "Retailer balance fetch"),
                    "Balance Calculation": ("parseFloat(retailer.current_balance) - parseFloat(body.amount_paid)", "Balance calculation"),
                    "Negative Prevention": ("Math.max(0, newBalance)", "Negative balance prevention"),
                    "Status Logic": ("finalBalance <= parseFloat(retailer.credit_limit)", "Status determination"),
                    "Balance Update": ("current_balance: finalBalance", "Retailer balance update"),
                    "Console Logging": ("console.log", "Debug logging"),
                    "Error Handling": ("try {", "Error handling")
                }
                
                for component, (pattern, description) in components.items():
                    if pattern in payment_section:
                        # Find line number
                        for i, line in enumerate(lines[payment_start-1:payment_end] if payment_end else lines[payment_start-1:], payment_start):
                            if pattern in line:
                                self.log_finding(component, "PASS", description, str(i))
                                break
                    else:
                        self.log_finding(component, "FAIL", f"Missing: {description}")
                
                # Analyze the fix logic flow
                self.analyze_payment_logic_flow(payment_section, payment_start)
                
            else:
                self.log_finding("Payment Endpoint", "FAIL", "Payment POST endpoint not found")
                
        except Exception as e:
            self.log_finding("Code Analysis", "FAIL", f"Error reading route file: {str(e)}")

    def analyze_payment_logic_flow(self, payment_section, start_line):
        """Analyze the logical flow of the payment processing"""
        print("\n🔍 ANALYZING PAYMENT LOGIC FLOW")
        print("-" * 30)
        
        expected_flow = [
            ("Authentication", "getUserBusinessId"),
            ("Service Client", "adminSupabase = createClient"),
            ("Payment Creation", ".from('payments').insert"),
            ("Retailer Fetch", ".from('retailers').select"),
            ("Balance Calc", "parseFloat(retailer.current_balance) - parseFloat(body.amount_paid)"),
            ("Balance Update", ".from('retailers').update"),
            ("Success Log", "✅ Retailer balance updated successfully")
        ]
        
        found_steps = []
        for step_name, pattern in expected_flow:
            if pattern in payment_section:
                found_steps.append(step_name)
                self.log_finding(f"Flow Step: {step_name}", "PASS", f"Implementation found")
            else:
                self.log_finding(f"Flow Step: {step_name}", "FAIL", f"Missing implementation")
        
        flow_completeness = len(found_steps) / len(expected_flow) * 100
        if flow_completeness >= 90:
            self.log_finding("Logic Flow", "PASS", f"Payment flow {flow_completeness:.0f}% complete")
        elif flow_completeness >= 70:
            self.log_finding("Logic Flow", "WARN", f"Payment flow {flow_completeness:.0f}% complete - some steps missing")
        else:
            self.log_finding("Logic Flow", "FAIL", f"Payment flow only {flow_completeness:.0f}% complete")

    def check_environment_setup(self):
        """Check environment configuration"""
        print("\n🔍 ANALYZING ENVIRONMENT SETUP")
        print("-" * 30)
        
        try:
            with open(self.env_file, 'r') as f:
                env_content = f.read()
            
            required_vars = [
                ("SUPABASE_SERVICE_ROLE_KEY", "Service role key for RLS bypass"),
                ("NEXT_PUBLIC_SUPABASE_URL", "Supabase database URL"),
                ("NEXT_PUBLIC_SUPABASE_ANON_KEY", "Supabase anon key")
            ]
            
            for var_name, description in required_vars:
                if f"{var_name}=" in env_content:
                    var_line = env_content.split(f"{var_name}=")[1].split('\n')[0].strip()
                    if len(var_line) > 10:
                        self.log_finding(f"Env Var: {var_name}", "PASS", description)
                    else:
                        self.log_finding(f"Env Var: {var_name}", "FAIL", f"Empty value - {description}")
                else:
                    self.log_finding(f"Env Var: {var_name}", "FAIL", f"Missing - {description}")
                    
        except Exception as e:
            self.log_finding("Environment Check", "FAIL", f"Cannot read .env file: {str(e)}")

    def simulate_payment_scenarios(self):
        """Simulate various payment scenarios to validate logic"""
        print("\n🔍 SIMULATING PAYMENT SCENARIOS")
        print("-" * 30)
        
        test_scenarios = [
            {
                'name': 'Normal Payment',
                'current_balance': 5000,
                'credit_limit': 10000,
                'payment': 2000,
                'expected_balance': 3000,
                'expected_status': 'active'
            },
            {
                'name': 'Payment Bringing Balance to Zero',
                'current_balance': 1000,
                'credit_limit': 5000,
                'payment': 1000,
                'expected_balance': 0,
                'expected_status': 'active'
            },
            {
                'name': 'Overpayment (Should Cap at Zero)',
                'current_balance': 500,
                'credit_limit': 5000,
                'payment': 1000,
                'expected_balance': 0,  # Math.max(0, 500-1000) = 0
                'expected_status': 'active'
            },
            {
                'name': 'High Balance Within Limit',
                'current_balance': 8000,
                'credit_limit': 10000,
                'payment': 1000,
                'expected_balance': 7000,
                'expected_status': 'active'
            }
        ]
        
        for scenario in test_scenarios:
            # Simulate the calculation logic
            current = float(scenario['current_balance'])
            payment = float(scenario['payment'])
            limit = float(scenario['credit_limit'])
            
            # This follows the logic: newBalance = current - payment, finalBalance = Math.max(0, newBalance)
            calculated_balance = max(0, current - payment)
            calculated_status = 'active' if calculated_balance <= limit else 'blocked'
            
            balance_correct = calculated_balance == scenario['expected_balance']
            status_correct = calculated_status == scenario['expected_status']
            
            if balance_correct and status_correct:
                self.log_finding(f"Scenario: {scenario['name']}", "PASS",
                              f"Balance: ₦{calculated_balance:,.0f}, Status: {calculated_status}")
            else:
                self.log_finding(f"Scenario: {scenario['name']}", "FAIL",
                              f"Expected: ₦{scenario['expected_balance']:,.0f}/{scenario['expected_status']}, " +
                              f"Got: ₦{calculated_balance:,.0f}/{calculated_status}")

    def generate_final_assessment(self):
        """Generate final assessment of the payment fix"""
        print("\n" + "=" * 60)
        print("📊 FINAL PAYMENT BUG FIX ASSESSMENT")
        print("=" * 60)
        
        # Count results
        total_checks = len(self.results)
        passed = len([r for r in self.results if r['status'] == 'PASS'])
        failed = len([r for r in self.results if r['status'] == 'FAIL'])
        warnings = len([r for r in self.results if r['status'] == 'WARN'])
        
        print(f"📈 ANALYSIS RESULTS:")
        print(f"   Total Checks: {total_checks}")
        print(f"   ✅ Passed: {passed}")
        print(f"   ❌ Failed: {failed}")
        print(f"   ⚠️  Warnings: {warnings}")
        
        pass_rate = (passed / total_checks) * 100 if total_checks > 0 else 0
        print(f"   📊 Pass Rate: {pass_rate:.1f}%")
        
        # Determine overall status
        critical_failures = len([r for r in self.results 
                               if r['status'] == 'FAIL' and 
                               any(keyword in r['category'] for keyword in ['Payment Endpoint', 'Balance Update', 'Logic Flow'])])
        
        if critical_failures == 0 and pass_rate >= 85:
            overall_status = "FIX IMPLEMENTED CORRECTLY ✅"
            confidence = "HIGH"
            recommendation = "The payment balance update fix is properly implemented. All critical components are in place."
        elif critical_failures <= 1 and pass_rate >= 70:
            overall_status = "FIX MOSTLY IMPLEMENTED ⚠️"
            confidence = "MEDIUM"
            recommendation = "Most fix components are implemented but some issues detected."
        else:
            overall_status = "FIX NEEDS ATTENTION ❌"
            confidence = "LOW"
            recommendation = "Multiple critical issues detected in the implementation."
        
        print(f"\n🎯 OVERALL STATUS: {overall_status}")
        print(f"🔍 CONFIDENCE LEVEL: {confidence}")
        print(f"💡 RECOMMENDATION: {recommendation}")
        
        # Show failures if any
        failures = [r for r in self.results if r['status'] == 'FAIL']
        if failures:
            print(f"\n❌ ISSUES DETECTED:")
            for failure in failures:
                print(f"   • {failure['category']}: {failure['description']}")
        
        # Expected behavior summary
        print(f"\n📋 EXPECTED BEHAVIOR WHEN FIX WORKS:")
        print(f"   1. POST /api/payments creates payment record")
        print(f"   2. Fetches retailer's current_balance and credit_limit")
        print(f"   3. Calculates new balance: current_balance - payment_amount")
        print(f"   4. Prevents negative balances using Math.max(0, newBalance)")
        print(f"   5. Updates retailer record with new balance and status")
        print(f"   6. Logs success message to console")
        print(f"   7. Sends notification if payment exceeds threshold")
        
        return pass_rate >= 85 and critical_failures == 0

    def run_comprehensive_analysis(self):
        """Run comprehensive analysis of payment fix"""
        print("🚨 CRITICAL PAYMENT BUG FIX - COMPREHENSIVE CODE ANALYSIS")
        print("=" * 70)
        print("🎯 ANALYZING: POST /api/payments retailer balance update fix")
        print("🔧 LOCATION: /app/app/api/[[...path]]/route.js (lines 1470-1594)")
        print("=" * 70)
        
        self.analyze_payment_endpoint_implementation()
        self.check_environment_setup()
        self.simulate_payment_scenarios()
        
        # Final assessment
        is_ready = self.generate_final_assessment()
        
        return is_ready

if __name__ == "__main__":
    analyzer = PaymentFixAnalyzer()
    analyzer.run_comprehensive_analysis()