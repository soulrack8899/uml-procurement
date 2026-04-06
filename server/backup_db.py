import shutil
import os
from datetime import datetime

def backup_databases():
    backup_dir = "backups"
    if not os.path.exists(backup_dir):
        os.makedirs(backup_dir)
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    dbs = ["auth.db", "procurement.db"]
    
    print(f"--- DATABASE SHIELD ACTIVATED [{timestamp}] ---")
    for db in dbs:
        if os.path.exists(db):
            backup_path = os.path.join(backup_dir, f"{db}_{timestamp}.bak")
            shutil.copy2(db, backup_path)
            print(f"SUCCESS: {db} backed up to {backup_path}")
        else:
            print(f"SKIPPED: {db} not found (local SQLite only)")
    print("--- SHIELDING COMPLETE ---")

if __name__ == "__main__":
    backup_databases()
