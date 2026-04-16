import traceback
from fastapi.testclient import TestClient
from server.main import app

client = TestClient(app)

def run_test():
    try:
        # First login to get a token
        response = client.post("/session/login", json={"email": "admin@procusure.local", "password": "password123"})
        if response.status_code != 200:
            print(f"Login failed: {response.json()}")
            return
        
        token = response.json()["access_token"]
        headers = {
            "Authorization": f"Bearer {token}",
            "X-Company-ID": "999"
        }
        
        # Now try creating a request with a quotation url
        payload = {
            "title": "Untitled Procurement",
            "vendor_name": "Test Vendor",
            "vendor_id": "V-TEST",
            "total_amount": 1200.0,
            "quotation_url": "/uploads/test.pdf",
            "items": [
                {
                    "description": "Test Item",
                    "quantity": 1,
                    "uom": "PCS",
                    "unit_price": 1200.0,
                    "total_price": 1200.0
                }
            ]
        }
        
        resp2 = client.post("/requests/", json=payload, headers=headers)
        print("Status", resp2.status_code)
        print("Body", resp2.text)
        
    except Exception as e:
        print("Crashed completely!")
        traceback.print_exc()

if __name__ == "__main__":
    run_test()
