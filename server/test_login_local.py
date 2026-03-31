import requests

URL = "http://localhost:8080/session/login"
payload = {
    "email": "pomodorotechco@gmail.com",
    "password": "password123"
}

try:
    response = requests.post(URL, json=payload)
    print(f"Status: {response.status_code}")
    print(f"JSON: {response.json()}")
except Exception as e:
    print(f"ERROR: {str(e)}")
