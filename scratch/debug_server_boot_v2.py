import sys
import os
import traceback

# Add server to path
sys.path.append(os.path.join(os.getcwd(), "server"))

try:
    print("Importing engines from models...")
    from models import auth_engine, procurement_engine, create_db_and_tables, Company
    from sqlalchemy import inspect
    
    print(f"Auth Engine URL: {auth_engine.url}")
    print(f"Procurement Engine URL: {procurement_engine.url}")

    def check_cols(engine, table_name):
        inspector = inspect(engine)
        if table_name in inspector.get_table_names():
            cols = [c['name'] for c in inspector.get_columns(table_name)]
            print(f"Columns in {table_name}: {cols}")
        else:
            print(f"Table {table_name} NOT FOUND.")

    check_cols(procurement_engine, "company")

    print("\nRunning on_startup bootstrap from main...")
    from main import on_startup
    on_startup()
    print("Bootstrap success!")

except Exception:
    print("\n" + "="*50)
    print("CRASH DETECTED")
    print("="*50)
    traceback.print_exc()
    print("="*50)
