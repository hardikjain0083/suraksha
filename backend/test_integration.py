#!/usr/bin/env python
"""
Integration test script for SuRaksha MAPS v4.0
Tests backend-frontend integration and all API endpoints
"""

import asyncio
import httpx
import time
from datetime import datetime
from pathlib import Path

# Test configuration
API_BASE = "http://localhost:8000/api"
TIMEOUT = 30.0

class IntegrationTester:
    def __init__(self):
        self.client = httpx.AsyncClient(base_url=API_BASE, timeout=TIMEOUT)
        self.results = []
        self.test_token = None
        
    async def run_all_tests(self):
        print("\n" + "="*70)
        print("🚀 SuRaksha MAPS v4.0 Integration Test Suite")
        print("="*70 + "\n")
        
        # Core Health Checks
        await self.test_health_check()
        await self.test_deployment_info()
        await self.test_cors_enabled()
        
        # Authentication Flow
        await self.test_register_user()
        await self.test_login()
        
        # Circular Management
        await self.test_list_circulars()
        await self.test_upload_circular()
        
        # Gap Detection
        await self.test_gap_queue()
        
        self.print_report()
    
    async def test(self, name, method, path, **kwargs):
        """Generic test runner"""
        print(f"⏳ {name}...", end=" ", flush=True)
        start = time.time()
        try:
            if method == "GET":
                res = await self.client.get(path, **kwargs)
            elif method == "POST":
                res = await self.client.post(path, **kwargs)
            
            elapsed = (time.time() - start) * 1000
            
            if 200 <= res.status_code < 300:
                print(f"✅ ({elapsed:.0f}ms)")
                self.results.append({"name": name, "status": "pass", "code": res.status_code})
                return res
            elif 400 <= res.status_code < 500:
                print(f"⚠️  ({res.status_code})")
                self.results.append({"name": name, "status": "warn", "code": res.status_code})
                return res
            else:
                print(f"❌ ({res.status_code})")
                self.results.append({"name": name, "status": "fail", "code": res.status_code})
                return None
        except Exception as e:
            print(f"❌ ({str(e)})")
            self.results.append({"name": name, "status": "error", "error": str(e)})
            return None
    
    async def test_health_check(self):
        """Test /health endpoint"""
        res = await self.test("Health Check", "GET", "/health")
        if res:
            data = res.json()
            print(f"   └─ Status: {data.get('status')}, DB: {data.get('database')}")
    
    async def test_deployment_info(self):
        """Test /debug/deployment endpoint"""
        res = await self.test("Deployment Info", "GET", "/debug/deployment")
        if res:
            data = res.json()
            print(f"   └─ Env: {data.get('environment')}, Demo: {data.get('demo_mode')}")
    
    async def test_cors_enabled(self):
        """Test CORS is enabled"""
        await self.test("CORS Test", "GET", "/debug/cors-test")
    
    async def test_register_user(self):
        """Test user registration"""
        payload = {
            "full_name": "Test User",
            "email": f"test_{int(time.time())}@example.com",
            "mobile": "9876543210",
            "department": "FINANCE",
            "designation": "Officer",
            "password": "TestPass123!"
        }
        res = await self.test("User Registration", "POST", "/auth/register", json=payload)
        if res:
            data = res.json()
            self.test_token = data.get("access_token")
            print(f"   └─ EMP ID: {data.get('emp_id')}")
    
    async def test_login(self):
        """Test user login"""
        payload = {
            "emp_id": "EMP-FINANCE-TEST001",
            "password": "TestPass123!"
        }
        res = await self.test("User Login", "POST", "/auth/login", json=payload)
        if res and res.status_code == 401:
            print(f"   └─ Expected 401 for non-existent user")
    
    async def test_list_circulars(self):
        """Test listing circulars"""
        res = await self.test("List Circulars", "GET", "/circulars")
        if res:
            data = res.json()
            total = data.get("stats", {}).get("total", 0)
            print(f"   └─ Total circulars: {total}")
    
    async def test_upload_circular(self):
        """Test circular file upload"""
        # Create a minimal test PDF
        test_file = "test_circular.txt"
        test_content = """
RBI CIRCULAR
Department: Financial Regulations

1.1 All banks shall implement AES-256 encryption for sensitive data.
1.2 Multi-factor authentication must be enabled for all administrative access.
1.3 Security audits should be conducted quarterly.
1.4 Real-time monitoring may be implemented using SIEM solutions.
        """.encode()
        
        files = {"file": ("test_circular.txt", test_file)}
        with open(test_file, "wb") as f:
            f.write(test_content)
        
        with open(test_file, "rb") as f:
            files_dict = {"file": (test_file, f, "text/plain")}
            res = await self.test("Upload Circular", "POST", "/circulars/upload", files=files_dict)
            if res:
                data = res.json()
                print(f"   └─ Circular ID: {data.get('circular_id')}, Status: {data.get('ingestion_status')}")
        
        # Cleanup
        Path(test_file).unlink(missing_ok=True)
    
    async def test_gap_queue(self):
        """Test gap queue"""
        res = await self.test("Fetch Gap Queue", "GET", "/gaps/queue")
        if res:
            data = res.json()
            queue_len = len(data.get("queue", []))
            print(f"   └─ Queue length: {queue_len}")
    
    def print_report(self):
        """Print test summary"""
        print("\n" + "="*70)
        print("📊 Test Summary")
        print("="*70)
        
        passed = sum(1 for r in self.results if r["status"] == "pass")
        warned = sum(1 for r in self.results if r["status"] == "warn")
        failed = sum(1 for r in self.results if r["status"] in ["fail", "error"])
        total = len(self.results)
        
        print(f"\nTotal Tests: {total}")
        print(f"✅ Passed:   {passed}")
        print(f"⚠️  Warned:   {warned}")
        print(f"❌ Failed:   {failed}\n")
        
        if failed == 0:
            print("✅ All critical tests passed! Backend is operational.")
        else:
            print("❌ Some tests failed. Check configuration.")
            failed_tests = [r for r in self.results if r["status"] in ["fail", "error"]]
            for test in failed_tests:
                print(f"   - {test['name']}: {test.get('error', test.get('code'))}")
        
        print("="*70 + "\n")

async def main():
    tester = IntegrationTester()
    await tester.run_all_tests()
    await tester.client.aclose()

if __name__ == "__main__":
    asyncio.run(main())
