import requests
import json
import os

BASE_URL = "http://localhost:8000"

def run():
    print("Petty Cash v0.2.2 Compliance Audit")
    
    # Login
    login_res = requests.post(f"{BASE_URL}/session/login", json={
        "email": "pomodorotechco@gmail.com",
        "password": "pomodorotechco123"
    })
    token = login_res.json().get("access_token")
    headers = {"Authorization": f"Bearer {token}", "X-Company-ID": "1"}
    
    results = []

    # 1. Receipt Check (>RM50)
    res = requests.post(f"{BASE_URL}/petty-cash/", json={"amount": 60.0, "description": "Test"}, headers=headers)
    results.append(("[PASS]" if res.status_code == 422 else "[FAIL]", "Receipt enforcement (RM50 threshold)"))

    # 2. Limit Check (Over 50k now)
    res = requests.post(f"{BASE_URL}/petty-cash/", json={"amount": 60000.0, "description": "Test", "receipt_url": "t.pdf"}, headers=headers)
    results.append(("[PASS]" if res.status_code == 400 else "[FAIL]", "Monthly limit enforcement"))

    # 3. Create Valid Claim
    res = requests.post(f"{BASE_URL}/petty-cash/", json={"amount": 10.0, "description": "Audit Test", "receipt_url": "t.pdf"}, headers=headers)
    if res.status_code == 200:
        print(f"DEBUG: Create res: {res.json()}")
        pc_id = res.json().get("id")
        
        # 4. Reject Flow & Reason
        rej_res = requests.post(f"{BASE_URL}/petty-cash/{pc_id}/reject", json={"reason": "Audit rejection"}, headers=headers)
        if rej_res.status_code == 200 and rej_res.json().get("rejection_reason") == "Audit rejection":
            results.append(("[PASS]", "Rejection reason persistence"))
        else:
            results.append(("[FAIL]", f"Rejection reason persistence (Got {rej_res.status_code}: {rej_res.text})"))

        # 5. Audit Log check
        audit_res = requests.get(f"{BASE_URL}/audit/recent?limit=5", headers=headers)
        found = any(log.get("petty_cash_id") == pc_id and "Rejected" in log.get("action") for log in audit_res.json())
        results.append(("[PASS]" if found else "[FAIL]", "Audit log on reject"))
    else:
        results.append(("[FAIL]", f"Base claim creation failed: {res.text}"))

    print("\n" + "="*50)
    for s, n in results:
        print(f"{s:<7} {n}")
    print("="*50)

if __name__ == "__main__":
    run()
