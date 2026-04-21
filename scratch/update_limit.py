from sqlalchemy import create_engine, text
import os

db_path = os.path.join(os.getcwd(), "server", "procurement.db")
engine = create_engine(f"sqlite:///{db_path}")

with engine.begin() as conn:
    conn.execute(text("UPDATE company SET petty_cash_limit = 50000.0"))
    print("Updated all petty_cash_limit to 50000.0")
