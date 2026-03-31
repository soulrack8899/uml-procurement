import requests

def test_login(email, password):
    URL = "https://uml-procurement-internal-production.up.railway.app/session/login"
    payload = {"email": email, "password": password}
    try:
        response = requests.post(URL, json=payload)
        print(f"[{email}] Status: {response.status_code}")
        print(f"[{email}] JSON: {response.json()}")
    except Exception as e:
        print(f"[{email}] ERROR: {str(e)}")

print("--- TESTING GLOBAL ADMIN ---")
test_login("pomodorotechco@gmail.com", "password123")
print("\n--- TESTING WRONG PASS ---")
test_login("pomodorotechco@gmail.com", "wrong_pass")
print("\n--- TESTING MISSING USER ---")
test_login("missing_user@gmail.com", "password123")
