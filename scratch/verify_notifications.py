import os
import sys
from sqlmodel import Session, select
from datetime import datetime
from dotenv import load_dotenv

# Add server directory to path so we can import models
sys.path.append(os.path.join(os.getcwd(), "server"))

from main import trigger_notification, procurement_engine, auth_engine, User, TenantAccess, UserRole, AppNotification, create_db_and_tables

load_dotenv()

def run_live_verification():
    print("--- ProcuSure Notification System Verification ---")
    
    # Ensure tables exist
    create_db_and_tables()
    
    # 1. Check SMTP Config
    smtp_user = os.getenv("SMTP_USERNAME")
    smtp_pass = os.getenv("SMTP_PASSWORD")
    if not smtp_user or not smtp_pass:
        print("ERROR: SMTP_USERNAME or SMTP_PASSWORD not found in .env")
        return

    print(f"Using SMTP account: {smtp_user}")

    # 2. Find a test user (we'll use the one with karlos.albert.d@gmail.com)
    with Session(auth_engine) as auth_session:
        # Looking for the user
        test_user = auth_session.exec(select(User).where(User.email == "karlos.albert.d@gmail.com")).first()
        
        if not test_user:
            # Fallback
            test_user = auth_session.exec(select(User)).first()
            
        if not test_user:
            print("ERROR: No user found in Auth DB to send test notification to.")
            return

        print(f"Targeting Test User: {test_user.name} ({test_user.email})")

        # 3. Simulate trigger_notification
        try:
            print("Triggering in-app and email notification...")
            from fastapi import BackgroundTasks
            bg_tasks = BackgroundTasks()
            
            trigger_notification(
                recipient_ids=[test_user.id],
                company_id=1, 
                message="SYSTEM TEST: Your notification engine is fully functional.",
                email_subject="ProcuSure System Verification",
                email_body=f"<h3>Hello {test_user.name},</h3><p>This is a live test from the ProcuSure notification engine.</p><p>Status: <b>Operational</b></p>",
                background_tasks=bg_tasks
            )
            
            print("SUCCESS: In-app record created.")
            print("Processing background email task...")
            
            for task in bg_tasks.tasks:
                task.func(*task.args, **task.kwargs)
                
            print("SUCCESS: Verification Complete.")
            
        except Exception as e:
            print(f"ERROR: Verification Failed: {e}")

if __name__ == "__main__":
    run_live_verification()
