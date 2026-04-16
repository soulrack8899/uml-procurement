import sqlite3
import os

def check_db():
    auth_path = "f:/Karlos/HPSB/Procurement/auth.db"
    proc_path = "f:/Karlos/HPSB/Procurement/procurement.db"
    
    if os.path.exists(auth_path):
        conn = sqlite3.connect(auth_path)
        c = conn.cursor()
        c.execute("SELECT name FROM sqlite_master WHERE type='table'")
        print(f"Auth DB Tables: {c.fetchall()}")
        
        c.execute("SELECT id, name, email, global_role FROM user LIMIT 5")
        print(f"Users: {c.fetchall()}")
        conn.close()
    else:
        print("Auth DB not found")

    if os.path.exists(proc_path):
        conn = sqlite3.connect(proc_path)
        c = conn.cursor()
        c.execute("SELECT name FROM sqlite_master WHERE type='table'")
        print(f"Procurement DB Tables: {c.fetchall()}")
        
        c.execute("SELECT id, name FROM company LIMIT 5")
        print(f"Companies: {c.fetchall()}")
        conn.close()
    else:
        print("Procurement DB not found")

if __name__ == "__main__":
    check_db()
