import os
from sqlmodel import Session, create_engine, select
import sys

# Add server directory to path
sys.path.append(os.path.join(os.getcwd(), 'server'))

import models
from models import User, Company

def dry_run():
    print("--- ProcuSure System Dry Run ---")
    
    # 1. Initialize Tables (Self-Healing phase in dry run)
    print("\n[Phase 0] Initializing Database Schema (Self-Healing)...")
    try:
        models.create_db_and_tables()
        print("SUCCESS: Tables initialized across both domains.")
    except Exception as e:
        print(f"INIT ERROR: {str(e)}")

    # 2. Use engines defined in models.py
    auth_engine = models.auth_engine
    proc_engine = models.procurement_engine
    
    print("\n[Phase 1] Checking Auth Domain Identity Storage...")
    try:
        with Session(auth_engine) as session:
            # Seed a dummy user for dry run if empty
            users = session.exec(select(User)).all()
            if not users:
                print("NOTE: Database is empty. Seeding System Admin for dry run.")
                admin = User(name="System Admin", email="admin@procusure.local", global_role="GLOBAL_ADMIN")
                session.add(admin)
                session.commit()
                users = [admin]
            
            print(f"SUCCESS: Identity database active. Found {len(users)} user profiles.")
            for user in users:
                print(f" - USER: {user.name} ({user.email}) | Role: {user.global_role}")
    except Exception as e:
        print(f"AUTH DB ERROR: {str(e)}")
        
    print("\n[Phase 2] Checking Procurement Domain Business Storage...")
    try:
        with Session(proc_engine) as session:
            companies = session.exec(select(Company)).all()
            if not companies:
                print("NOTE: No workplaces registered. Seeding Test Entity.")
                co = Company(name="Procusure Testing", domain="procusure.local")
                session.add(co)
                session.commit()
                companies = [co]

            print(f"SUCCESS: Business database persistent. Found {len(companies)} registries.")
            for co in companies:
                print(f" - COMPANY: {co.name} (ID: {co.id})")
    except Exception as e:
        print(f"PROC DB ERROR: {str(e)}")

    print("\n--- Dry Run Completed ---")

if __name__ == "__main__":
    dry_run()
