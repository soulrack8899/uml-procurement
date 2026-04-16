import os
from sqlalchemy import create_engine, text, inspect
from models import fix_postgres_url

DB_URL = os.getenv("DATABASE_URL")
if not DB_URL:
    DB_URL = "sqlite:///./procurement.db"

engine = create_engine(fix_postgres_url(DB_URL))

def verify_schema():
    inspector = inspect(engine)
    columns = [c['name'] for c in inspector.get_columns('vendor')]
    print(f"Columns in 'vendor' table: {columns}")
    
    if 'vendor_id' in columns:
        print("✅ SUCCESS: vendor_id column exists.")
    else:
        print("❌ FAILURE: vendor_id column is missing.")

if __name__ == "__main__":
    verify_schema()
