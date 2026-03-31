import requests

BASE_URL = "http://127.0.0.1:8000"

def test_full_flow():
    print("--- 1. LOGIN AS GLOBAL ADMIN ---")
    login_payload = {"email": "pomodorotechco@gmail.com", "password": "password123"}
    r = requests.post(f"{BASE_URL}/session/login", json=login_payload)
    if r.status_code != 200:
        print(f"FAILED LOGIN: {r.text}")
        return
    token = r.json()['access_token']
    headers = {"Authorization": f"Bearer {token}"}
    print("LOGIN SUCCESS")

    print("\n--- 2. ONBOARD NEW COMPANY ---")
    co_payload = {"name": "Titan Industries", "domain": "titan.com"}
    r = requests.post(f"{BASE_URL}/companies/onboard", json=co_payload, headers=headers)
    if r.status_code != 200:
        print(f"FAILED ONBOARD CO: {r.text}")
        return
    co_id = r.json()['id']
    print(f"ONBOARDED CO {co_id}: Titan Industries")

    print("\n--- 3. ONBOARD NEW USER FOR TITAN ---")
    user_payload = {
        "name": "Tony Stark",
        "email": "tony@titan.com",
        "password": "ironman_pass",
        "company_id": co_id,
        "role": "ADMIN"
    }
    r = requests.post(f"{BASE_URL}/users/onboard", json=user_payload, headers=headers)
    if r.status_code != 200:
        print(f"FAILED ONBOARD USER: {r.text}")
        return
    print("ONBOARDED USER: tony@titan.com")

    print("\n--- 4. LOGIN AS NEW USER ---")
    login_payload = {"email": "tony@titan.com", "password": "ironman_pass"}
    r = requests.post(f"{BASE_URL}/session/login", json=login_payload)
    if r.status_code != 200:
        print(f"FAILED LOGIN NEW USER: {r.text}")
        return
    print("LOGIN SUCCESS FOR NEW USER")
    print(f"USER CONTEXT: {r.json()}")

if __name__ == "__main__":
    # Start server in background first
    import subprocess
    import time
    server = subprocess.Popen(["python", "server/main.py"], cwd=".")
    time.sleep(5) # Wait for startup
    try:
        test_full_flow()
    finally:
        server.terminate()
