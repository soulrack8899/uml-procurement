import requests
import json
import concurrent.futures
import time

BASE_URL = "http://localhost:8000"

def get_auth(email, password="password123"):
    r = requests.post(f"{BASE_URL}/session/login", json={"email": email, "password": password})
    if r.status_code == 200:
        data = r.json()
        return {
            "token": data["access_token"],
            "company_id": data["active_company_id"]
        }
    else:
        print(f"Login failed for {email}: {r.text}")
        return None

def test_unauthorized_tenant_probing():
    print("\n--- TEST 1: Unauthorized Tenant Probing ---")
    # User 3 (Manager Co 1) tries to see User 6's request (Co 2)
    auth_m1 = get_auth("m1@test.com")
    if not auth_m1: return

    # Let's verify we have a request for Co 2 (seeded as ID 1)
    target_id = 1 
    
    headers = {
        "Authorization": f"Bearer {auth_m1['token']}",
        "X-Company-ID": str(auth_m1['company_id'])
    }
    r = requests.get(f"{BASE_URL}/requests/{target_id}", headers=headers)
    print(f"Requesting ID {target_id} (Co 2) as Manager 1 (Co 1): Status {r.status_code}")
    if r.status_code == 403:
        print("RESULT: PASS - Cross-tenant access blocked.")
    else:
        print(f"RESULT: FAIL - Access allowed! {r.text}")

def test_malicious_file_upload_set():
    print("\n--- TEST 2: Malicious File Injection ---")
    auth_r1 = get_auth("r1@test.com")
    if not auth_r1: return
    headers = {
        "Authorization": f"Bearer {auth_r1['token']}",
        "X-Company-ID": str(auth_r1['company_id'])
    }

    # 1. Try .exe
    files_exe = {'file': ('malware.exe', 'MZ...', 'application/x-msdownload')}
    r1 = requests.post(f"{BASE_URL}/upload/", files=files_exe, headers=headers)
    print(f"Uploading .exe: Status {r1.status_code} - {r1.text}")

    # 2. Try .html
    files_html = {'file': ('xss.html', '<script>alert(1)</script>', 'text/html')}
    r2 = requests.post(f"{BASE_URL}/upload/", files=files_html, headers=headers)
    print(f"Uploading .html: Status {r2.status_code} - {r2.text}")

    # 3. Try Large File (11MB)
    large_data = b"0" * (11 * 1024 * 1024)
    files_big = {'file': ('big.png', large_data, 'image/png')}
    r3 = requests.post(f"{BASE_URL}/upload/", files=files_big, headers=headers)
    print(f"Uploading 11MB file: Status {r3.status_code}")

    if r1.status_code >= 400 and r2.status_code >= 400 and (r3.status_code == 413 or r3.status_code == 400):
        print("RESULT: PASS - Malicious/Large files blocked.")
    else:
        print("RESULT: FAIL - Weak filtering detected.")

def test_role_escalation():
    print("\n--- TEST 3: Role Escalation ---")
    auth_r1 = get_auth("r1@test.com")
    if not auth_r1: return
    headers = {
        "Authorization": f"Bearer {auth_r1['token']}",
        "X-Company-ID": str(auth_r1['company_id'])
    }

    # Create a request first
    payload = {
        "title": "Escalation Test",
        "vendor_name": "Test Vendor",
        "vendor_id": "V100",
        "total_amount": 100.0,
        "items": [{"description": "test", "quantity": 1, "uom": "PCS", "unit_price": 100.0, "total_price": 100.0}]
    }
    r_create = requests.post(f"{BASE_URL}/requests/", json=payload, headers=headers)
    print(f"Create Status: {r_create.status_code}")
    print(f"Create Response: {r_create.text}")
    data = r_create.json()
    req_id = data.get("id")
    if not req_id:
        print("FAIL: No ID in response")
        return
    print(f"Created Request ID {req_id} as REQUESTER")

    # Try to approve it
    r_approve = requests.post(f"{BASE_URL}/requests/{req_id}/transition", json={"action": "Approve"}, headers=headers)
    print(f"Attempting self-approval as REQUESTER: Status {r_approve.status_code}")
    if r_approve.status_code == 403:
        print("RESULT: PASS - Role escalation blocked.")
    else:
        print(f"RESULT: FAIL - Escalation successful! {r_approve.text}")

def test_concurrency():
    print("\n--- TEST 4: Concurrency Checks ---")
    auth_m1 = get_auth("m1@test.com")
    if not auth_m1: return
    headers = {
        "Authorization": f"Bearer {auth_m1['token']}",
        "X-Company-ID": str(auth_m1['company_id'])
    }

    # Create a request to transition
    payload = {
        "title": "Concurrency Test",
        "vendor_name": "Test Vendor",
        "vendor_id": "V101",
        "total_amount": 100.0,
            "items": [{"description": "test", "quantity": 1, "uom": "PCS", "unit_price": 100.0, "total_price": 100.0}]
    }
    r_create = requests.post(f"{BASE_URL}/requests/", json=payload, headers=headers)
    req_id = r_create.json()["id"]
    
    # Move it to SUBMITTED so manager can act
    requests.post(f"{BASE_URL}/requests/{req_id}/transition", headers=headers) # First transition to SUBMITTED
    
    print(f"Starting rapid-fire transitions for Request ID {req_id}...")
    
    def fire_transition():
        return requests.post(f"{BASE_URL}/requests/{req_id}/transition", headers=headers)

    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
        futures = [executor.submit(fire_transition) for _ in range(10)]
        results = [f.result().status_code for f in futures]
    
    print(f"Results: {results}")
    # We expect some 200s and maybe some errors depending on how fast they hit, 
    # but the DB should not be corrupted. 
    # Check current status
    final_req = requests.get(f"{BASE_URL}/requests/{req_id}", headers=headers).json()
    print(f"Final Status: {final_req['status']}")

if __name__ == "__main__":
    print("Starting ProcuSure Stress Test battery...")
    try:
        test_unauthorized_tenant_probing()
        test_malicious_file_upload_set()
        test_role_escalation()
        test_concurrency()
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"Test Battery Interrupted: {e}")
