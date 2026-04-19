import pytest
import os
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlmodel import Session, SQLModel, select, func
from models import User, UserRole
from main import app, create_access_token
import main as main_module
import models as models_module

# Test Database URIs
TEST_AUTH_DB = "sqlite:///./test_auth_pagination.db"
TEST_PROC_DB = "sqlite:///./test_procurement_pagination.db"

@pytest.fixture
def client_with_admin():
    """Setup test databases, create a Global Admin, and return a TestClient."""
    # 1. Setup Engines
    test_auth_engine = create_engine(TEST_AUTH_DB, connect_args={"check_same_thread": False})
    test_proc_engine = create_engine(TEST_PROC_DB, connect_args={"check_same_thread": False})
    
    # Store originals
    orig_auth_main = main_module.auth_engine
    orig_proc_main = main_module.procurement_engine
    orig_auth_models = models_module.auth_engine
    orig_proc_models = models_module.procurement_engine

    # Override globals
    main_module.auth_engine = test_auth_engine
    main_module.procurement_engine = test_proc_engine
    models_module.auth_engine = test_auth_engine
    models_module.procurement_engine = test_proc_engine
    
    # 2. Initialize Schema
    if os.path.exists("./test_auth_pagination.db"): os.remove("./test_auth_pagination.db")
    if os.path.exists("./test_procurement_pagination.db"): os.remove("./test_procurement_pagination.db")
    
    models_module.User.metadata.create_all(test_auth_engine)
    SQLModel.metadata.create_all(test_proc_engine)
    
    # 3. Create Global Admin
    with Session(test_auth_engine) as session:
        admin = User(
            id=9999,
            name="Test Admin",
            email="admin@test.com",
            password="hashed",
            global_role=UserRole.GLOBAL_ADMIN,
            approval_status="APPROVED"
        )
        session.add(admin)
        session.commit()
        session.refresh(admin)
        token = create_access_token(data={"sub": str(admin.id)})

    client = TestClient(app)
    client.headers = {"Authorization": f"Bearer {token}"}
    
    yield client
    
    # 4. Cleanup
    test_auth_engine.dispose()
    test_proc_engine.dispose()
    
    # Restore originals
    main_module.auth_engine = orig_auth_main
    main_module.procurement_engine = orig_proc_main
    models_module.auth_engine = orig_auth_models
    models_module.procurement_engine = orig_proc_models

    if os.path.exists("./test_auth_pagination.db"): os.remove("./test_auth_pagination.db")
    if os.path.exists("./test_procurement_pagination.db"): os.remove("./test_procurement_pagination.db")

def test_list_users_pagination(client_with_admin):
    """
    1. Create 150 test users
    2. Verify pagination (skip/limit) and total count
    """
    auth_engine = main_module.auth_engine
    
    # Step 1: Create 150 test users
    with Session(auth_engine) as session:
        for i in range(150):
            u = User(
                name=f"User {i}",
                email=f"user{i}@example.com",
                password="hashed",
                global_role=UserRole.REQUESTER,
                approval_status="APPROVED"
            )
            session.add(u)
        session.commit()

    # Step 2: GET /users?skip=0&limit=50
    response = client_with_admin.get("/users/?skip=0&limit=50")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 151 # 150 + admin
    assert len(data["items"]) == 50
    assert data["skip"] == 0
    assert data["limit"] == 50

    # Step 3: GET /users?skip=50&limit=50
    response = client_with_admin.get("/users/?skip=50&limit=50")
    assert response.status_code == 200
    data = response.json()
    assert len(data["items"]) == 50
    assert data["skip"] == 50

    # Step 4: GET /users?skip=100&limit=50
    response = client_with_admin.get("/users/?skip=100&limit=50")
    assert response.status_code == 200
    data = response.json()
    assert len(data["items"]) == 50
    assert data["skip"] == 100

    # Step 5: GET /users?skip=150&limit=50
    response = client_with_admin.get("/users/?skip=150&limit=50")
    assert response.status_code == 200
    data = response.json()
    assert len(data["items"]) == 1 # The admin
    assert data["total"] == 151
