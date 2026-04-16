import requests
import json

BASE_URL = "https://uml-procurement-internal-production.up.railway.app"

def run_prod_live_test():
    print(f"--- ProcuSure Production Live Test ---")
    print(f"Target URL: {BASE_URL}")

    # 1. Login
    login_url = f"{BASE_URL}/session/login"
    login_data = {
        "email": "pomodorotechco@gmail.com",
        "password": "pomodorotechco123"
    }
    
    print(f"Attempting login as pomodorotechco@gmail.com...")
    try:
        r = requests.post(login_url, json=login_data)
        if r.status_code != 200:
            print(f"ERROR: Login Failed ({r.status_code}): {r.text}")
            return
            
        token = r.json().get("access_token")
        print("SUCCESS: Login successful. Token obtained.")
        
        # 2. Submit Request
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "X-Company-ID": "1" # Assuming company 1 exists
        }
        
        request_data = {
            "title": "PRODUCTION LIVE TEST: Stakeholder Notification",
            "vendor_name": "ProcuSure Verification Bot",
            "vendor_id": "V-TEST-99",
            "total_amount": 99.99,
            "items": [
                {
                    "description": "Live System Verification Item",
                    "quantity": 1,
                    "uom": "EA",
                    "unit_price": 99.99,
                    "total_price": 99.99
                }
            ],
            "comments": "This is a real automated test hitting the production environment to verify the SMTP notification engine."
        }
        
        print("\nSubmitting procurement request to production...")
        r = requests.post(f"{BASE_URL}/requests/", json=request_data, headers=headers)
        
        if r.status_code == 200:
            print("SUCCESS: Request submitted to production.")
            print(f"Server Response: {json.dumps(r.json(), indent=2)}")
        else:
            print(f"ERROR: Submission Failed ({r.status_code}): {r.text}")
            
    except Exception as e:
        print(f"ERROR during production test: {e}")

if __name__ == "__main__":
    run_prod_live_test()
