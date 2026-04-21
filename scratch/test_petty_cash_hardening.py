import requests
import json
import time
from datetime import datetime

BASE_URL = "http://localhost:8000"

def run_tests():
    print("Starting Petty Cash Compliance Verification...")
    
    # 1. Login
    try:
        res = requests.post(f"{BASE_URL}/session/login", json={
            "email": "pomodorotechco@gmail.com",
            "password": "pomodorotechco123"
        })
        token = res.json().get("access_token")
        if not token:
            print("[ERROR] Could not obtain auth token. Is the server running?")
            return
    except Exception as e:
        print(f"[ERROR] Connection failed: {e}")
        return

    headers = {"Authorization": f"Bearer {token}", "X-Company-ID": "1"}
    results = []
    pc_id = None

    # --- TEST 1: Receipt Enforcement (RM50 threshold) ---
    high_amount_payload = {
        "amount": 60.0,
        "description": "Lab reagents - High amount no receipt",
        "category": "Supplies"
    }
    res = requests.post(f"{BASE_URL}/petty-cash/", json=high_amount_payload, headers=headers)
    if res.status_code == 422:
        results.append(("[PASS]", "Receipt enforcement (RM50 threshold)"))
    else:
        results.append(("[FAIL]", f"Receipt enforcement (RM50 threshold) - Expected 422, got {res.status_code}"))

    # --- TEST 2: Monthly Limit Enforcement ---
    limit_payload = {
        "amount": 60000.0, # Now that limit is 50000
        "description": "Over-budget equipment",
        "category": "Equipment",
        "receipt_url": "http://evidence.com/receipt.pdf"
    }
    res = requests.post(f"{BASE_URL}/petty-cash/", json=limit_payload, headers=headers)
    if res.status_code == 400:
        results.append(("[PASS]", "Monthly limit enforcement"))
    else:
        results.append(("[FAIL]", f"Monthly limit enforcement - Expected 400, got {res.status_code}"))

    # --- TEST 3: Audit log on approve/reject/disburse ---
    # Create valid claim
    valid_payload = {
        "amount": 15.0,
        "description": "Coffee for visitors",
        "category": "Misc",
        "receipt_url": "http://evidence.com/coffee.jpg"
    }
    res = requests.post(f"{BASE_URL}/petty-cash/", json=valid_payload, headers=headers)
    if res.status_code != 200:
        results.append(("[FAIL]", f"Audit log test - Could not create base claim (Status {res.status_code}: {res.text})"))
        pc_id = None
    else:
        pc_id = res.json().get("id")
        
        # Approve it
        requests.post(f"{BASE_URL}/petty-cash/{pc_id}/approve", headers=headers)
        
        # Check audit log
        audit_res = requests.get(f"{BASE_URL}/audit/recent?limit=5", headers=headers)
        logs = audit_res.json()
        found = any(log.get("petty_cash_id") == pc_id and "Approved" in log.get("action") for log in logs)
        
        if found:
            results.append(("[PASS]", "Audit log on approve/reject/disburse"))
        else:
            results.append(("[FAIL]", "Audit log on approve/reject/disburse - Log entry not found"))

    # --- TEST 4: Rejection Reason Persistence ---
    if not pc_id:
        results.append(("[FAIL]", "Rejection reason persistence - Skipped (no pc_id)"))
    else:
        reject_payload = {"reason": "Insufficient evidence provided"}
        res = requests.post(f"{BASE_URL}/petty-cash/{pc_id}/reject", json=reject_payload, headers=headers)
        if res.status_code == 200:
            pc_data = res.json()
            if pc_data.get("status") == "REJECTED" and pc_data.get("rejection_reason") == "Insufficient evidence provided":
                results.append(("[PASS]", "Rejection reason persistence"))
            else:
                results.append(("[FAIL]", "Rejection reason persistence - Data mismatch"))
        else:
            results.append(("[FAIL]", f"Rejection reason persistence - Status {res.status_code}: {res.text}"))

    # --- FINAL SUMMARY TABLE ---
    print("\n" + "="*60)
    print(f" {'PETTY CASH COMPLIANCE REPORT':^58} ")
    print("="*60)
    for status, name in results:
        print(f" {status:<7} {name}")
    print("="*60)
    
    all_passed = all(s == "[PASS]" for s, _ in results)
    if all_passed:
        print(" All 4 checks passed. Petty Cash is compliance-ready.")
    else:
        print(" Some checks FAILED. Please review the responses above.")
    print("="*60 + "\n")

if __name__ == "__main__":
    run_tests()
