import sys
import os
import traceback

# Add server to path
sys.path.append(os.path.join(os.getcwd(), "server"))

try:
    print("Pre-importing models...")
    from models import procurement_engine, create_db_and_tables
    print("Models imported.")
    
    print("Testing create_db_and_tables...")
    create_db_and_tables()
    print("Tables created.")

    print("Importing main for on_startup...")
    from main import on_startup
    print("Running on_startup bootstrap...")
    on_startup()
    print("Bootstrap success!")

except Exception:
    print("\n" + "="*50)
    print("CRASH DETECTED")
    print("="*50)
    traceback.print_exc()
    print("="*50)
