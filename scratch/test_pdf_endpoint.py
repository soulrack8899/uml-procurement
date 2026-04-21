import requests

def test_pdf():
    # Login to get token
    res = requests.post("http://localhost:8000/session/login", json={
        "email": "pomodorotechco@gmail.com",
        "password": "pomodorotechco123"
    })
    token = res.json().get("access_token")
    print(f"Logged in, token: {token[:10]}...")
    
    # Get PDF
    res = requests.get("http://localhost:8000/api/procurement/3/pdf", headers={
        "Authorization": f"Bearer {token}",
        "X-Company-ID": "1"
    })
    
    if res.status_code == 200:
        print("Success! PDF generated.")
        with open("scratch/test_po_3.pdf", "wb") as f:
            f.write(res.content)
        print("Saved to scratch/test_po_3.pdf")
    else:
        print(f"Failed! Status: {res.status_code}")
        print(res.text)

if __name__ == "__main__":
    test_pdf()
