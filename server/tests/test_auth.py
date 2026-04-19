import pytest
from fastapi.testclient import TestClient
from main import app, get_password_hash, verify_password

client = TestClient(app)

# --- Password Verification Tests ---

def test_verify_password_correct():
    """CASE 1: Correct password (hashed) -> PASS"""
    password = "SecurePassword123!"
    hashed = get_password_hash(password)
    assert verify_password(password, hashed) is True

def test_verify_password_incorrect():
    """CASE 2: Incorrect password (hashed) -> FAIL"""
    password = "SecurePassword123!"
    hashed = get_password_hash(password)
    assert verify_password("WrongPassword", hashed) is False

def test_verify_password_no_plain_bypass():
    """CASE 3: Plain-text password (NOT in hash) -> FAIL (no bypass)"""
    password = "mypassword"
    # Fallback to plain text should be disabled
    assert verify_password(password, password) is False

def test_verify_password_tampered_hash():
    """CASE 4: Tampered hash -> FAIL"""
    password = "SecurePassword123!"
    hashed = get_password_hash(password)
    tampered = hashed[:-5] + "ABCDE"
    assert verify_password(password, tampered) is False

# --- CORS Lock-down Tests ---

def test_cors_allowed_origin():
    """CASE 1: Request from allowed origin -> Should pass with CORS headers"""
    origin = "http://localhost:3000"
    response = client.get("/", headers={"Origin": origin})
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == origin

def test_cors_disallowed_origin():
    """CASE 2: Request from disallowed origin -> Should NOT have CORS headers"""
    origin = "http://attacker.com"
    response = client.get("/", headers={"Origin": origin})
    assert response.status_code == 200
    assert "access-control-allow-origin" not in response.headers

def test_cors_no_origin_header():
    """CASE 3: Request with no origin header -> Should PASS (Backend-to-Backend)"""
    response = client.get("/")
    assert response.status_code == 200
    assert "access-control-allow-origin" not in response.headers
