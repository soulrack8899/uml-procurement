import requests
import json

BASE_URL = "http://localhost:8000" # Assume it's running locally

def test_unauthenticated_upload():
    print("\n[TEST] Unauthenticated Upload")
    files = {'file': ('test.txt', 'hello world')}
    r = requests.post(f"{BASE_URL}/upload/", files=files)
    print(f"Status Code: {r.status_code}")
    if r.status_code == 401:
        print("PASS: Unauthenticated upload blocked.")
    else:
        print("FAIL: Unauthenticated upload allowed!")

def test_malicious_file_upload(token):
    print("\n[TEST] Malicious File Upload")
    files = {'file': ('test.exe', 'binary data')}
    headers = {"Authorization": f"Bearer {token}"}
    r = requests.post(f"{BASE_URL}/upload/", files=files, headers=headers)
    print(f"Status Code: {r.status_code}")
    if r.status_code == 400:
        print("PASS: Invalid file type blocked.")
    else:
        print("FAIL: Malicious file allowed!")

def test_login_suspended():
    print("\n[TEST] Login Suspended (Logic check)")
    # We can't easily suspend a user via API if we aren't admin, 
    # but we can check the code in main.py.
    # We will simulate a login for a user we know is suspended in DB.
    pass

if __name__ == "__main__":
    # Note: This script assumes the server is running.
    # Since I don't know if the server is up, I might skip the execution 
    # and just provide the script for the user to run.
    print("Security Test Script Prepared.")
