#!/usr/bin/env python3
"""
FOTIVA Backend API Testing Suite
Tests all endpoints for the photography SaaS platform
"""

import requests
import sys
import json
from datetime import datetime, timedelta
from typing import Dict, Any, Optional

class FotivaAPITester:
    def __init__(self, base_url="https://tailwind-fix-3.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        
        # Test data storage
        self.test_user_email = f"test_user_{datetime.now().strftime('%H%M%S')}@fotiva.com"
        self.test_client_id = None
        self.test_event_id = None
        self.test_payment_id = None
        self.test_gallery_id = None

    def log_test(self, name: str, success: bool, details: str = "", response_data: Any = None):
        """Log test results"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            
        result = {
            "test_name": name,
            "success": success,
            "details": details,
            "response_data": response_data
        }
        self.test_results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} - {name}")
        if details:
            print(f"    {details}")

    def make_request(self, method: str, endpoint: str, data: Dict = None, expected_status: int = 200) -> tuple[bool, Dict]:
        """Make HTTP request with proper headers"""
        url = f"{self.base_url}/{endpoint.lstrip('/')}"
        headers = {'Content-Type': 'application/json'}
        
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)
            elif method == 'PATCH':
                response = requests.patch(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)
            else:
                return False, {"error": f"Unsupported method: {method}"}

            success = response.status_code == expected_status
            
            try:
                response_data = response.json()
            except:
                response_data = {"raw_response": response.text}
                
            if not success:
                response_data["status_code"] = response.status_code
                response_data["expected_status"] = expected_status
                
            return success, response_data

        except requests.exceptions.RequestException as e:
            return False, {"error": str(e)}

    def test_api_health(self):
        """Test basic API connectivity"""
        print("\n🔍 Testing API Health...")
        success, response = self.make_request('GET', '/')
        
        if success and response.get('message'):
            self.log_test("API Health Check", True, f"Message: {response['message']}")
        else:
            self.log_test("API Health Check", False, f"Failed to connect: {response}")
        
        return success

    def test_user_registration(self):
        """Test user registration"""
        print("\n🔍 Testing User Registration...")
        
        user_data = {
            "email": self.test_user_email,
            "password": "TestPass123!",
            "name": "Test Photographer",
            "brand_name": "Test Photography Studio"
        }
        
        success, response = self.make_request('POST', '/auth/register', user_data, 200)
        
        if success and response.get('access_token') and response.get('user'):
            self.token = response['access_token']
            self.user_id = response['user']['id']
            self.log_test("User Registration", True, f"User created: {response['user']['name']}")
        else:
            self.log_test("User Registration", False, f"Registration failed: {response}")
        
        return success

    def test_user_login(self):
        """Test user login with existing credentials"""
        print("\n🔍 Testing User Login...")
        
        login_data = {
            "email": self.test_user_email,
            "password": "TestPass123!"
        }
        
        success, response = self.make_request('POST', '/auth/login', login_data, 200)
        
        if success and response.get('access_token'):
            self.token = response['access_token']
            self.log_test("User Login", True, f"Login successful for: {response['user']['email']}")
        else:
            self.log_test("User Login", False, f"Login failed: {response}")
        
        return success

    def test_get_current_user(self):
        """Test getting current user info"""
        print("\n🔍 Testing Get Current User...")
        
        success, response = self.make_request('GET', '/auth/me', expected_status=200)
        
        if success and response.get('email') == self.test_user_email:
            self.log_test("Get Current User", True, f"User info retrieved: {response['name']}")
        else:
            self.log_test("Get Current User", False, f"Failed to get user info: {response}")
        
        return success

    def test_create_client(self):
        """Test creating a client"""
        print("\n🔍 Testing Create Client...")
        
        client_data = {
            "name": "João Silva",
            "phone": "(11) 99999-9999",
            "email": "joao@email.com"
        }
        
        success, response = self.make_request('POST', '/clients', client_data, 200)
        
        if success and response.get('id'):
            self.test_client_id = response['id']
            self.log_test("Create Client", True, f"Client created: {response['name']}")
        else:
            self.log_test("Create Client", False, f"Failed to create client: {response}")
        
        return success

    def test_get_clients(self):
        """Test getting all clients"""
        print("\n🔍 Testing Get Clients...")
        
        success, response = self.make_request('GET', '/clients', expected_status=200)
        
        if success and isinstance(response, list):
            client_count = len(response)
            self.log_test("Get Clients", True, f"Retrieved {client_count} clients")
        else:
            self.log_test("Get Clients", False, f"Failed to get clients: {response}")
        
        return success

    def test_create_event(self):
        """Test creating an event"""
        print("\n🔍 Testing Create Event...")
        
        if not self.test_client_id:
            self.log_test("Create Event", False, "No client ID available for event creation")
            return False
        
        event_data = {
            "client_id": self.test_client_id,
            "client_name": "João Silva",
            "name": "Casamento João & Maria",
            "date": "2024-12-25",
            "time": "15:00",
            "location": "Igreja São José, São Paulo",
            "total_value": 5000.0,
            "status": "confirmado"
        }
        
        success, response = self.make_request('POST', '/events', event_data, 200)
        
        if success and response.get('id'):
            self.test_event_id = response['id']
            self.log_test("Create Event", True, f"Event created: {response['name']}")
        else:
            self.log_test("Create Event", False, f"Failed to create event: {response}")
        
        return success

    def test_get_events(self):
        """Test getting all events"""
        print("\n🔍 Testing Get Events...")
        
        success, response = self.make_request('GET', '/events', expected_status=200)
        
        if success and isinstance(response, list):
            event_count = len(response)
            self.log_test("Get Events", True, f"Retrieved {event_count} events")
        else:
            self.log_test("Get Events", False, f"Failed to get events: {response}")
        
        return success

    def test_get_single_event(self):
        """Test getting a single event by ID"""
        print("\n🔍 Testing Get Single Event...")
        
        if not self.test_event_id:
            self.log_test("Get Single Event", False, "No event ID available")
            return False
        
        success, response = self.make_request('GET', f'/events/{self.test_event_id}', expected_status=200)
        
        if success and response.get('id') == self.test_event_id:
            self.log_test("Get Single Event", True, f"Event retrieved: {response['name']}")
        else:
            self.log_test("Get Single Event", False, f"Failed to get event: {response}")
        
        return success

    def test_create_payment(self):
        """Test creating a payment installment"""
        print("\n🔍 Testing Create Payment...")
        
        if not self.test_event_id or not self.test_client_id:
            self.log_test("Create Payment", False, "Missing event or client ID")
            return False
        
        payment_data = {
            "event_id": self.test_event_id,
            "client_id": self.test_client_id,
            "client_name": "João Silva",
            "event_name": "Casamento João & Maria",
            "installment_number": 1,
            "total_installments": 3,
            "amount": 1666.67,
            "due_date": "2024-11-15"
        }
        
        success, response = self.make_request('POST', '/payments', payment_data, 200)
        
        if success and response.get('id'):
            self.test_payment_id = response['id']
            self.log_test("Create Payment", True, f"Payment created: R$ {response['amount']}")
        else:
            self.log_test("Create Payment", False, f"Failed to create payment: {response}")
        
        return success

    def test_get_payments(self):
        """Test getting all payments"""
        print("\n🔍 Testing Get Payments...")
        
        success, response = self.make_request('GET', '/payments', expected_status=200)
        
        if success and isinstance(response, list):
            payment_count = len(response)
            self.log_test("Get Payments", True, f"Retrieved {payment_count} payments")
        else:
            self.log_test("Get Payments", False, f"Failed to get payments: {response}")
        
        return success

    def test_mark_payment_paid(self):
        """Test marking a payment as paid"""
        print("\n🔍 Testing Mark Payment as Paid...")
        
        if not self.test_payment_id:
            self.log_test("Mark Payment Paid", False, "No payment ID available")
            return False
        
        success, response = self.make_request('PATCH', f'/payments/{self.test_payment_id}/mark-paid', expected_status=200)
        
        if success and response.get('message'):
            self.log_test("Mark Payment Paid", True, response['message'])
        else:
            self.log_test("Mark Payment Paid", False, f"Failed to mark payment as paid: {response}")
        
        return success

    def test_create_gallery(self):
        """Test creating a gallery"""
        print("\n🔍 Testing Create Gallery...")
        
        gallery_data = {
            "event_id": self.test_event_id,
            "name": "Fotos do Casamento João & Maria",
            "date": "2024-12-25",
            "thumbnail": "https://example.com/thumbnail.jpg"
        }
        
        success, response = self.make_request('POST', '/galleries', gallery_data, 200)
        
        if success and response.get('id'):
            self.test_gallery_id = response['id']
            self.log_test("Create Gallery", True, f"Gallery created: {response['name']}")
        else:
            self.log_test("Create Gallery", False, f"Failed to create gallery: {response}")
        
        return success

    def test_get_galleries(self):
        """Test getting all galleries"""
        print("\n🔍 Testing Get Galleries...")
        
        success, response = self.make_request('GET', '/galleries', expected_status=200)
        
        if success and isinstance(response, list):
            gallery_count = len(response)
            self.log_test("Get Galleries", True, f"Retrieved {gallery_count} galleries")
        else:
            self.log_test("Get Galleries", False, f"Failed to get galleries: {response}")
        
        return success

    def test_dashboard_metrics(self):
        """Test getting dashboard metrics"""
        print("\n🔍 Testing Dashboard Metrics...")
        
        success, response = self.make_request('GET', '/dashboard/metrics', expected_status=200)
        
        if success and 'monthly_revenue' in response:
            metrics = {
                'monthly_revenue': response.get('monthly_revenue', 0),
                'confirmed_events': response.get('confirmed_events', 0),
                'photos_delivered': response.get('photos_delivered', 0),
                'pending_payments': response.get('pending_payments', 0)
            }
            self.log_test("Dashboard Metrics", True, f"Metrics retrieved: {metrics}")
        else:
            self.log_test("Dashboard Metrics", False, f"Failed to get dashboard metrics: {response}")
        
        return success

    def run_all_tests(self):
        """Run all API tests in sequence"""
        print("🚀 Starting FOTIVA Backend API Tests...")
        print(f"Testing against: {self.base_url}")
        
        # Basic connectivity
        if not self.test_api_health():
            print("❌ API is not accessible. Stopping tests.")
            return False
        
        # Authentication flow
        if not self.test_user_registration():
            print("❌ User registration failed. Stopping tests.")
            return False
        
        if not self.test_get_current_user():
            print("❌ Cannot get current user. Stopping tests.")
            return False
        
        # Test login with existing user (optional - we already have token from registration)
        # self.test_user_login()
        
        # Client management
        self.test_create_client()
        self.test_get_clients()
        
        # Event management
        self.test_create_event()
        self.test_get_events()
        self.test_get_single_event()
        
        # Payment management
        self.test_create_payment()
        self.test_get_payments()
        self.test_mark_payment_paid()
        
        # Gallery management
        self.test_create_gallery()
        self.test_get_galleries()
        
        # Dashboard
        self.test_dashboard_metrics()
        
        return True

    def print_summary(self):
        """Print test summary"""
        print(f"\n📊 Test Summary:")
        print(f"Tests Run: {self.tests_run}")
        print(f"Tests Passed: {self.tests_passed}")
        print(f"Tests Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        # Print failed tests
        failed_tests = [t for t in self.test_results if not t['success']]
        if failed_tests:
            print(f"\n❌ Failed Tests:")
            for test in failed_tests:
                print(f"  - {test['test_name']}: {test['details']}")
        
        return self.tests_passed == self.tests_run

def main():
    """Main test execution"""
    tester = FotivaAPITester()
    
    try:
        success = tester.run_all_tests()
        tester.print_summary()
        
        # Save detailed results to file
        with open('/app/test_reports/backend_test_results.json', 'w') as f:
            json.dump({
                'timestamp': datetime.now().isoformat(),
                'summary': {
                    'tests_run': tester.tests_run,
                    'tests_passed': tester.tests_passed,
                    'success_rate': tester.tests_passed/tester.tests_run*100 if tester.tests_run > 0 else 0
                },
                'results': tester.test_results
            }, f, indent=2)
        
        return 0 if success else 1
        
    except Exception as e:
        print(f"❌ Test execution failed: {str(e)}")
        return 1

if __name__ == "__main__":
    sys.exit(main())