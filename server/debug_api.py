import requests
import json

BASE_URL = "http://127.0.0.1:8000"

def debug_onboard():
    login_payload = {"email": "pomodorotechco@gmail.com", "password": "password123"}
    r = requests.post(f"{BASE_URL}/session/login", json=login_payload)
    token = r.json()['access_token']
    headers = {"Authorization": f"Bearer {token}"}

    co_payload = {"name": f"Debug Co {json.dumps(json.loads('{}'))}", "domain": "debug.com"}
    r = requests.post(f"{BASE_URL}/companies/onboard", json=co_payload, headers=headers)
    print(f"STATUS: {r.status_code}")
    print(f"RESPONSE JSON: {r.json()}")

if __name__ == "__main__":
    import subprocess
    import time
    server = subprocess.Popen(["python", "server/main.py"], cwd=".")
    time.sleep(5)
    try:
        debug_onboard()
    finally:
        server.terminate()
