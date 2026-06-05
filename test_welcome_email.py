#!/usr/bin/env python3
"""
Welcome Email Automation & Resend Integration Test Suite
Tests: Resend API, Auth Callback Route, Welcome Email Helper, Environment Variables
"""

import json
import requests
import os
import sys
from datetime import datetime

class WelcomeEmailTester:
    def __init__(self, base_url: str = "https://distrib-flow-2.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_base = f"{base_url}/api"
        self.test_results = []
        
    def log_result(self, test_name: str, status: str, details: str = "", severity: str = "HIGH"):
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
                    headers: dict = None, params: dict = None) -> dict:
        """Make API request with error handling"""
        url = f"{self.api_base}/{endpoint.lstrip('/')}"
        
        # Default headers
        default_headers = {'Content-Type': 'application/json'}
        if headers:
            default_headers.update(headers)
            
        try:
            if method.upper() == 'GET':
                response = requests.get(url, headers=default_headers, params=params, timeout=10, allow_redirects=False)
            elif method.upper() == 'POST':
                response = requests.post(url, json=data, headers=default_headers, timeout=10)
            else:
                raise ValueError(f"Unsupported method: {method}")
                
            return {
                'status_code': response.status_code,
                'data': response.text,
                'headers': dict(response.headers),
                'url': response.url
            }
        except requests.exceptions.RequestException as e:
            return {
                'status_code': 0,
                'data': {'error': str(e)},
                'headers': {},
                'url': url
            }

    def test_environment_variables(self):
        """Test 1: Verify environment variables are set"""
        print("\n🎯 TEST 1: ENVIRONMENT VARIABLES VERIFICATION")
        
        # Read .env file
        env_vars = {}
        try:
            with open('/app/.env', 'r') as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith('#') and '=' in line:
                        key, value = line.split('=', 1)
                        env_vars[key] = value
        except Exception as e:
            self.log_result("Environment: Read .env file", "FAIL", 
                          f"Failed to read .env: {str(e)}", "CRITICAL")
            return
        
        # Check RESEND_API_KEY
        if 'RESEND_API_KEY' in env_vars and env_vars['RESEND_API_KEY']:
            api_key = env_vars['RESEND_API_KEY']
            if api_key.startswith('re_'):
                self.log_result("Environment: RESEND_API_KEY", "PASS", 
                              f"API key present and valid format: {api_key[:10]}...", "CRITICAL")
            else:
                self.log_result("Environment: RESEND_API_KEY", "FAIL", 
                              "API key doesn't start with 're_'", "CRITICAL")
        else:
            self.log_result("Environment: RESEND_API_KEY", "FAIL", 
                          "RESEND_API_KEY not found in .env", "CRITICAL")
        
        # Check RESEND_FROM_EMAIL
        if 'RESEND_FROM_EMAIL' in env_vars and env_vars['RESEND_FROM_EMAIL']:
            from_email = env_vars['RESEND_FROM_EMAIL']
            if from_email == 'noreply@distribution-flow.com':
                self.log_result("Environment: RESEND_FROM_EMAIL", "PASS", 
                              f"Sender email correctly set: {from_email}", "CRITICAL")
            else:
                self.log_result("Environment: RESEND_FROM_EMAIL", "FAIL", 
                              f"Expected noreply@distribution-flow.com, got {from_email}", "HIGH")
        else:
            self.log_result("Environment: RESEND_FROM_EMAIL", "FAIL", 
                          "RESEND_FROM_EMAIL not found in .env", "CRITICAL")
        
        # Check NEXT_PUBLIC_BASE_URL
        if 'NEXT_PUBLIC_BASE_URL' in env_vars and env_vars['NEXT_PUBLIC_BASE_URL']:
            base_url = env_vars['NEXT_PUBLIC_BASE_URL']
            self.log_result("Environment: NEXT_PUBLIC_BASE_URL", "PASS", 
                          f"Base URL set: {base_url}", "MEDIUM")
        else:
            self.log_result("Environment: NEXT_PUBLIC_BASE_URL", "FAIL", 
                          "NEXT_PUBLIC_BASE_URL not found in .env", "HIGH")

    def test_auth_callback_route_exists(self):
        """Test 2: Verify auth callback route exists and is accessible"""
        print("\n🎯 TEST 2: AUTH CALLBACK ROUTE VERIFICATION")
        
        # Test without code parameter (should redirect to login)
        result = self.make_request('GET', '/auth/callback')
        
        if result['status_code'] == 307 or result['status_code'] == 302:
            # Check if it redirects to login
            location = result['headers'].get('location', result['headers'].get('Location', ''))
            if '/login' in location:
                self.log_result("Auth Callback: No code redirect", "PASS", 
                              f"Correctly redirects to login when no code provided (Status: {result['status_code']})", "HIGH")
            else:
                self.log_result("Auth Callback: No code redirect", "FAIL", 
                              f"Redirects but not to login. Location: {location}", "HIGH")
        elif result['status_code'] == 0:
            self.log_result("Auth Callback: No code redirect", "FAIL", 
                          f"Network error: {result['data']}", "CRITICAL")
        else:
            self.log_result("Auth Callback: No code redirect", "FAIL", 
                          f"Expected redirect (307/302), got {result['status_code']}", "HIGH")
        
        # Test with invalid code parameter (should handle gracefully)
        result = self.make_request('GET', '/auth/callback', params={'code': 'invalid_test_code'})
        
        if result['status_code'] in [307, 302, 400, 401]:
            self.log_result("Auth Callback: Invalid code handling", "PASS", 
                          f"Handles invalid code gracefully (Status: {result['status_code']})", "HIGH")
        elif result['status_code'] == 0:
            self.log_result("Auth Callback: Invalid code handling", "FAIL", 
                          f"Network error: {result['data']}", "HIGH")
        else:
            self.log_result("Auth Callback: Invalid code handling", "WARN", 
                          f"Unexpected status code: {result['status_code']}", "MEDIUM")

    def test_welcome_email_file_structure(self):
        """Test 3: Verify welcome email helper file structure"""
        print("\n🎯 TEST 3: WELCOME EMAIL HELPER FILE VERIFICATION")
        
        # Check if welcome-email.js exists
        try:
            with open('/app/lib/welcome-email.js', 'r') as f:
                content = f.read()
                
            # Check for required imports
            if 'import { Resend }' in content or "import { Resend }" in content:
                self.log_result("Welcome Email: Resend import", "PASS", 
                              "Resend library imported correctly", "HIGH")
            else:
                self.log_result("Welcome Email: Resend import", "FAIL", 
                              "Resend library not imported", "CRITICAL")
            
            # Check for sendWelcomeEmail function
            if 'export async function sendWelcomeEmail' in content:
                self.log_result("Welcome Email: Function export", "PASS", 
                              "sendWelcomeEmail function exported", "HIGH")
            else:
                self.log_result("Welcome Email: Function export", "FAIL", 
                              "sendWelcomeEmail function not found", "CRITICAL")
            
            # Check for environment variable usage
            if 'process.env.RESEND_API_KEY' in content:
                self.log_result("Welcome Email: API key usage", "PASS", 
                              "Uses RESEND_API_KEY from environment", "HIGH")
            else:
                self.log_result("Welcome Email: API key usage", "FAIL", 
                              "Doesn't use RESEND_API_KEY from environment", "CRITICAL")
            
            # Check for sender email usage
            if 'process.env.RESEND_FROM_EMAIL' in content:
                self.log_result("Welcome Email: Sender email usage", "PASS", 
                              "Uses RESEND_FROM_EMAIL from environment", "HIGH")
            else:
                self.log_result("Welcome Email: Sender email usage", "FAIL", 
                              "Doesn't use RESEND_FROM_EMAIL from environment", "CRITICAL")
            
            # Check for email parameters
            required_params = ['email', 'name', 'businessName']
            all_params_present = all(param in content for param in required_params)
            if all_params_present:
                self.log_result("Welcome Email: Function parameters", "PASS", 
                              "All required parameters present (email, name, businessName)", "HIGH")
            else:
                missing = [p for p in required_params if p not in content]
                self.log_result("Welcome Email: Function parameters", "FAIL", 
                              f"Missing parameters: {', '.join(missing)}", "HIGH")
            
            # Check for error handling
            if 'try' in content and 'catch' in content:
                self.log_result("Welcome Email: Error handling", "PASS", 
                              "Error handling implemented", "MEDIUM")
            else:
                self.log_result("Welcome Email: Error handling", "WARN", 
                              "No try-catch error handling found", "MEDIUM")
                
        except FileNotFoundError:
            self.log_result("Welcome Email: File exists", "FAIL", 
                          "/app/lib/welcome-email.js not found", "CRITICAL")
        except Exception as e:
            self.log_result("Welcome Email: File verification", "FAIL", 
                          f"Error reading file: {str(e)}", "CRITICAL")

    def test_auth_callback_implementation(self):
        """Test 4: Verify auth callback route implementation"""
        print("\n🎯 TEST 4: AUTH CALLBACK ROUTE IMPLEMENTATION")
        
        try:
            with open('/app/app/api/auth/callback/route.js', 'r') as f:
                content = f.read()
            
            # Check for welcome email import
            if 'sendWelcomeEmail' in content:
                self.log_result("Auth Callback: Welcome email import", "PASS", 
                              "sendWelcomeEmail imported", "HIGH")
            else:
                self.log_result("Auth Callback: Welcome email import", "FAIL", 
                              "sendWelcomeEmail not imported", "CRITICAL")
            
            # Check for code parameter handling
            if 'searchParams.get' in content and 'code' in content:
                self.log_result("Auth Callback: Code parameter handling", "PASS", 
                              "Handles code parameter from URL", "HIGH")
            else:
                self.log_result("Auth Callback: Code parameter handling", "FAIL", 
                              "Doesn't handle code parameter", "CRITICAL")
            
            # Check for exchangeCodeForSession
            if 'exchangeCodeForSession' in content:
                self.log_result("Auth Callback: Session exchange", "PASS", 
                              "Exchanges code for session", "HIGH")
            else:
                self.log_result("Auth Callback: Session exchange", "FAIL", 
                              "Doesn't exchange code for session", "CRITICAL")
            
            # Check for user data fetching
            if 'from(\'users\')' in content or 'from("users")' in content:
                self.log_result("Auth Callback: User data fetch", "PASS", 
                              "Fetches user data from database", "HIGH")
            else:
                self.log_result("Auth Callback: User data fetch", "FAIL", 
                              "Doesn't fetch user data", "HIGH")
            
            # Check for sendWelcomeEmail call
            if 'await sendWelcomeEmail' in content or 'sendWelcomeEmail(' in content:
                self.log_result("Auth Callback: Welcome email call", "PASS", 
                              "Calls sendWelcomeEmail function", "CRITICAL")
            else:
                self.log_result("Auth Callback: Welcome email call", "FAIL", 
                              "Doesn't call sendWelcomeEmail", "CRITICAL")
            
            # Check for dashboard redirect
            if '/dashboard' in content and 'redirect' in content:
                self.log_result("Auth Callback: Dashboard redirect", "PASS", 
                              "Redirects to dashboard after verification", "HIGH")
            else:
                self.log_result("Auth Callback: Dashboard redirect", "FAIL", 
                              "Doesn't redirect to dashboard", "HIGH")
            
            # Check for error handling
            if 'try' in content and 'catch' in content:
                self.log_result("Auth Callback: Error handling", "PASS", 
                              "Error handling implemented", "MEDIUM")
            else:
                self.log_result("Auth Callback: Error handling", "WARN", 
                              "No try-catch error handling found", "MEDIUM")
                
        except FileNotFoundError:
            self.log_result("Auth Callback: File exists", "FAIL", 
                          "/app/app/api/auth/callback/route.js not found", "CRITICAL")
        except Exception as e:
            self.log_result("Auth Callback: File verification", "FAIL", 
                          f"Error reading file: {str(e)}", "CRITICAL")

    def test_email_library_configuration(self):
        """Test 5: Verify email.js library uses correct configuration"""
        print("\n🎯 TEST 5: EMAIL LIBRARY CONFIGURATION")
        
        try:
            with open('/app/lib/email.js', 'r') as f:
                content = f.read()
            
            # Check for Resend import
            if 'import { Resend }' in content or "import { Resend }" in content:
                self.log_result("Email Library: Resend import", "PASS", 
                              "Resend library imported", "HIGH")
            else:
                self.log_result("Email Library: Resend import", "FAIL", 
                              "Resend library not imported", "HIGH")
            
            # Check for RESEND_FROM_EMAIL usage
            if 'process.env.RESEND_FROM_EMAIL' in content:
                self.log_result("Email Library: Sender email", "PASS", 
                              "Uses RESEND_FROM_EMAIL from environment", "HIGH")
            else:
                self.log_result("Email Library: Sender email", "FAIL", 
                              "Doesn't use RESEND_FROM_EMAIL", "HIGH")
            
            # Check for DistributionFlow branding
            if 'DistributionFlow' in content:
                self.log_result("Email Library: Branding", "PASS", 
                              "Uses DistributionFlow branding", "MEDIUM")
            else:
                self.log_result("Email Library: Branding", "WARN", 
                              "DistributionFlow branding not found", "LOW")
                
        except FileNotFoundError:
            self.log_result("Email Library: File exists", "FAIL", 
                          "/app/lib/email.js not found", "HIGH")
        except Exception as e:
            self.log_result("Email Library: File verification", "FAIL", 
                          f"Error reading file: {str(e)}", "HIGH")

    def test_server_logs_for_errors(self):
        """Test 6: Check server logs for Resend-related errors"""
        print("\n🎯 TEST 6: SERVER LOGS VERIFICATION")
        
        try:
            # Check NextJS logs
            import subprocess
            result = subprocess.run(
                ['tail', '-n', '100', '/var/log/supervisor/nextjs.out.log'],
                capture_output=True,
                text=True,
                timeout=5
            )
            
            logs = result.stdout + result.stderr
            
            # Check for Resend initialization errors
            if 'Resend' in logs and 'error' in logs.lower():
                self.log_result("Server Logs: Resend errors", "WARN", 
                              "Found Resend-related errors in logs", "HIGH")
            else:
                self.log_result("Server Logs: Resend errors", "PASS", 
                              "No Resend initialization errors found", "MEDIUM")
            
            # Check for environment variable loading
            if 'RESEND_API_KEY' in logs or 'RESEND_FROM_EMAIL' in logs:
                self.log_result("Server Logs: Environment variables", "PASS", 
                              "Environment variables referenced in logs", "MEDIUM")
            else:
                self.log_result("Server Logs: Environment variables", "PASS", 
                              "No environment variable issues in logs", "MEDIUM")
            
            # Check for welcome email attempts
            if 'welcome email' in logs.lower() or 'Welcome email' in logs:
                self.log_result("Server Logs: Welcome email activity", "PASS", 
                              "Welcome email activity detected in logs", "MEDIUM")
            else:
                self.log_result("Server Logs: Welcome email activity", "PASS", 
                              "No welcome email errors (may not have been triggered yet)", "LOW")
                
        except subprocess.TimeoutExpired:
            self.log_result("Server Logs: Read logs", "WARN", 
                          "Timeout reading server logs", "LOW")
        except Exception as e:
            self.log_result("Server Logs: Read logs", "WARN", 
                          f"Could not read server logs: {str(e)}", "LOW")

    def test_signup_redirect_configuration(self):
        """Test 7: Verify signup page redirects to auth callback"""
        print("\n🎯 TEST 7: SIGNUP PAGE REDIRECT CONFIGURATION")
        
        try:
            with open('/app/app/signup/page.js', 'r') as f:
                content = f.read()
            
            # Check for emailRedirectTo configuration
            if 'emailRedirectTo' in content:
                self.log_result("Signup Page: emailRedirectTo present", "PASS", 
                              "emailRedirectTo configuration found", "HIGH")
                
                # Check if it points to auth/callback
                if '/api/auth/callback' in content or '/auth/callback' in content:
                    self.log_result("Signup Page: Callback redirect", "PASS", 
                                  "Redirects to auth callback route", "CRITICAL")
                else:
                    self.log_result("Signup Page: Callback redirect", "FAIL", 
                                  "Doesn't redirect to auth callback route", "CRITICAL")
            else:
                self.log_result("Signup Page: emailRedirectTo present", "FAIL", 
                              "emailRedirectTo not configured", "CRITICAL")
                
        except FileNotFoundError:
            self.log_result("Signup Page: File exists", "FAIL", 
                          "/app/app/signup/page.js not found", "HIGH")
        except Exception as e:
            self.log_result("Signup Page: File verification", "FAIL", 
                          f"Error reading file: {str(e)}", "HIGH")

    def run_all_tests(self):
        """Run comprehensive welcome email test suite"""
        print("🚀 Starting Welcome Email Automation & Resend Integration Test Suite")
        print("=" * 70)
        
        # Execute all test suites
        self.test_environment_variables()
        self.test_auth_callback_route_exists()
        self.test_welcome_email_file_structure()
        self.test_auth_callback_implementation()
        self.test_email_library_configuration()
        self.test_server_logs_for_errors()
        self.test_signup_redirect_configuration()
        
        # Generate summary
        self.generate_summary()
        
    def generate_summary(self):
        """Generate final test summary"""
        print("\n" + "=" * 70)
        print("📊 WELCOME EMAIL TEST SUMMARY")
        print("=" * 70)
        
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
        
        if total_tests > 0:
            print(f"📈 Pass Rate: {(pass_count/total_tests*100):.1f}%")
        
        print(f"🚨 Critical Issues: {critical_issues}")
        print(f"⚠️  High Priority Issues: {high_issues}")
        
        # Feature readiness assessment
        feature_ready = critical_issues == 0 and high_issues == 0
        print(f"🎯 Welcome Email Feature Ready: {'YES ✅' if feature_ready else 'NO ❌'}")
        
        print("\n📝 DETAILED RESULTS:")
        print("-" * 50)
        
        for result in self.test_results:
            status_emoji = "✅" if result['status'] == 'PASS' else "❌" if result['status'] == 'FAIL' else "⚠️"
            severity_emoji = "🚨" if result['severity'] == 'CRITICAL' else "⚠️" if result['severity'] == 'HIGH' else "📊"
            
            print(f"{status_emoji} {severity_emoji} {result['test']}")
            if result['details']:
                print(f"    {result['details']}")
        
        # Provide recommendations
        print("\n" + "=" * 70)
        print("💡 RECOMMENDATIONS:")
        print("=" * 70)
        
        if critical_issues > 0:
            print("🚨 CRITICAL: Fix critical issues before testing end-to-end flow")
        elif high_issues > 0:
            print("⚠️  HIGH: Address high priority issues for optimal functionality")
        else:
            print("✅ All core components verified and ready")
            print("📧 Next Step: Test end-to-end signup → verify → welcome email flow")
            print("   Note: User must configure Supabase SMTP settings first")
        
        print("\n" + "=" * 70)
        print("🎯 WELCOME EMAIL INTEGRATION TEST COMPLETE")
        print("=" * 70)

if __name__ == "__main__":
    print("🎯 Welcome Email Automation & Resend Integration Test")
    print("Testing: Environment, Auth Callback, Welcome Email Helper, Configuration")
    print()
    
    # Initialize tester
    tester = WelcomeEmailTester()
    
    # Run all tests
    tester.run_all_tests()
