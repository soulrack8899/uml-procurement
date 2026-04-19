import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_cors_allowed_localhost():
    """CASE 1: Request from allowed origin (localhost:3000) -> Should pass"""
    origin = "http://localhost:3000"
    response = client.get("/", headers={"Origin": origin})
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == origin

def test_cors_allowed_vercel():
    """CASE 2: Request from allowed origin (Vercel) -> Should pass"""
    origin = "https://procure-sure.vercel.app"
    response = client.get("/", headers={"Origin": origin})
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == origin

def test_cors_disallowed_origin():
    """CASE 3: Request from disallowed origin (attacker.com) -> Should FAIL (no header)"""
    origin = "http://attacker.com"
    response = client.get("/", headers={"Origin": origin})
    assert response.status_code == 200
    # Header should be absent for unauthorized origins
    assert "access-control-allow-origin" not in response.headers

def test_cors_no_origin_header():
    """CASE 4: Request with no origin header -> Should PASS (Backend request)"""
    response = client.get("/")
    assert response.status_code == 200
    assert "access-control-allow-origin" not in response.headers

def test_cors_preflight_allowed():
    """Verify preflight for allowed origin"""
    origin = "http://localhost:3000"
    headers = {
        "Origin": origin,
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "Content-Type",
    }
    response = client.options("/", headers=headers)
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == origin
