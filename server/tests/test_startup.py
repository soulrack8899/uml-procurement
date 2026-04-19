import pytest
import os
from sqlalchemy import text, create_engine
from models import Session, SQLModel, select, User
from main import on_startup
import main as main_module
import models as models_module
from unittest.mock import patch

# Test Database URIs
TEST_AUTH_DB = "sqlite:///./test_auth.db"
TEST_PROC_DB = "sqlite:///./test_procurement.db"

@pytest.fixture
def setup_test_db():
    """Setup and teardown temporary test databases."""
    # Store original engines/methods to restore them later
    orig_auth_main = main_module.auth_engine
    orig_proc_main = main_module.procurement_engine
    orig_auth_models = models_module.auth_engine
    orig_proc_models = models_module.procurement_engine
    
    # Create test engines
    test_auth_engine = create_engine(TEST_AUTH_DB, connect_args={"check_same_thread": False})
    test_proc_engine = create_engine(TEST_PROC_DB, connect_args={"check_same_thread": False})
    
    # Override engines in BOTH modules
    main_module.auth_engine = test_auth_engine
    main_module.procurement_engine = test_proc_engine
    models_module.auth_engine = test_auth_engine
    models_module.procurement_engine = test_proc_engine
    
    # Ensure clean slate
    if os.path.exists("./test_auth.db"): os.remove("./test_auth.db")
    if os.path.exists("./test_procurement.db"): os.remove("./test_procurement.db")
    
    # Mock Alembic to avoid it touching real DB or failing during tests
    with patch("server.main.command.upgrade") as mock_upgrade:
        yield
    
    # Dispose engines to release file locks
    test_auth_engine.dispose()
    test_proc_engine.dispose()

    # Restore original engines
    main_module.auth_engine = orig_auth_main
    main_module.procurement_engine = orig_proc_main
    models_module.auth_engine = orig_auth_models
    models_module.procurement_engine = orig_proc_models
    
    # Cleanup after tests
    try:
        if os.path.exists("./test_auth.db"): os.remove("./test_auth.db")
        if os.path.exists("./test_procurement.db"): os.remove("./test_procurement.db")
    except Exception as e:
        print(f"Cleanup warning: {e}")

def test_startup_schema_sync(setup_test_db):
    """
    1. Create a partial schema (missing column).
    2. Run on_startup.
    3. Verify column is added.
    """
    proc_engine = main_module.procurement_engine
    auth_engine = main_module.auth_engine
    
    # Step 1: Initialize EVERYTHING first to get valid schema for other tables (user, company, etc)
    models_module.User.metadata.create_all(auth_engine)
    SQLModel.metadata.create_all(proc_engine)

    # Step 2: "Downgrade" specific tables by dropping and recreating them without the target columns
    with proc_engine.connect() as conn:
        conn.execute(text("DROP TABLE procurementrequest"))
        conn.execute(text("CREATE TABLE procurementrequest (id INTEGER PRIMARY KEY, title TEXT, vendor_name TEXT, total_amount FLOAT, company_id INTEGER, created_by INTEGER, status TEXT, created_at DATETIME, updated_at DATETIME)"))
        
        conn.execute(text("DROP TABLE pettycash"))
        conn.execute(text("CREATE TABLE pettycash (id INTEGER PRIMARY KEY, title TEXT, amount FLOAT, company_id INTEGER, requester_id INTEGER, status TEXT, created_at DATETIME)"))
        
        conn.execute(text("DROP TABLE vendor"))
        conn.execute(text("CREATE TABLE vendor (id INTEGER PRIMARY KEY, name TEXT, vendor_type TEXT, company_id INTEGER)"))
        conn.commit()

    # Step 3: Boot the app (trigger on_startup)
    try:
        on_startup()
    except Exception as e:
        pytest.fail(f"on_startup raised an unexpected Exception: {e}")

    # Step 4: Verify rejection_reason column NOW exists
    with proc_engine.connect() as conn:
        columns = [row[1] for row in conn.execute(text("PRAGMA table_info(procurementrequest)")).fetchall()]
        assert "rejection_reason" in columns, "rejection_reason column was not added to procurementrequest"
        
        columns_pc = [row[1] for row in conn.execute(text("PRAGMA table_info(pettycash)")).fetchall()]
        assert "ledger_url" in columns_pc, "ledger_url column was not added to pettycash"

def test_startup_idempotency(setup_test_db):
    """
    EDGE CASE: Running on_startup on an already up-to-date DB should not crash.
    """
    # 1. Initialize DB fully
    main_module.create_db_and_tables()
    
    # 2. First run to sync everything
    on_startup()
    
    # 3. Second run (idempotency check)
    try:
        on_startup()
    except Exception as e:
        pytest.fail(f"on_startup failed on second run (idempotency issue): {e}")
    
    # 4. Verify columns still exist
    engine = main_module.procurement_engine
    with engine.connect() as conn:
        columns = [row[1] for row in conn.execute(text("PRAGMA table_info(procurementrequest)")).fetchall()]
        assert "rejection_reason" in columns
