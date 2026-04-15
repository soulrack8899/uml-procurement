import sqlite3
import os

db_path = "f:/Karlos/HPSB/Procurement/server/auth.db"
if not os.path.exists(db_path):
    print("DB not found")
else:
    conn = sqlite3.connect(db_path)
    c = conn.cursor()
    c.execute("SELECT id, name, email, approval_status, global_role FROM users")
    rows = c.fetchall()
    print("ID | Name | Email | Status | Role")
    for r in rows:
        print(f"{r[0]} | {r[1]} | {r[2]} | {r[3]} | {r[4]}")
    conn.close()
