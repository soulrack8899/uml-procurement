import os
import sys
from sqlmodel import Session, select
from datetime import datetime
from dotenv import load_dotenv
from fastapi import BackgroundTasks

# Add server directory to path
sys.path.append(os.path.join(os.getcwd(), "server"))

from main import (
    trigger_notification, procurement_engine, auth_engine, 
    User, TenantAccess, UserRole, AppNotification, 
    ProcurementRequest, StatusEnum, create_db_and_tables
)

load_dotenv()

def run_full_lifecycle_test():
    print("--- ProcuSure Full Lifecycle Live Test ---")
    create_db_and_tables()
    
    # Configuration
    REQUESTER_ID = 4 # C1 Requester (r1@test.com)
    MANAGER_ID = 3   # C1 Manager (m1@test.com)
    RECIPIENT_EMAIL = "karlos.albert.d@gmail.com" # We'll force this for the test email delivery
    
    with Session(auth_engine) as auth_session:
        # Override email for testing so a REAL email goes out to the user
        req_user = auth_session.get(User, REQUESTER_ID)
        man_user = auth_session.get(User, MANAGER_ID)
        
        if req_user: req_user.email = RECIPIENT_EMAIL
        if man_user: man_user.email = RECIPIENT_EMAIL
        auth_session.commit()
        
        print(f"Test Setup: Notifications will be sent to {RECIPIENT_EMAIL}")

    # --- Scenario 1: New Submission ---
    print("\nPhase 1: Simulating New Submission...")
    bg_tasks = BackgroundTasks()
    
    # This simulates the logic inside create_request
    trigger_notification(
        recipient_ids=[MANAGER_ID],
        company_id=1,
        message=f"Live Test: New Request 'Pro-Grade Telemetry Tool' ($1,250.00) pending approval.",
        email_subject="ProcuSure: Action Required - New Procurement Request",
        email_body=f"<p>A new request has been submitted by C1 Requester.</p><p>Amount: $1,250.00</p>",
        background_tasks=bg_tasks
    )
    
    print("In-app notification created for Manager.")
    print("Processing email dispatch...")
    for task in bg_tasks.tasks: task.func(*task.args, **task.kwargs)

    # --- Scenario 2: Manager Approves ---
    print("\nPhase 2: Simulating Manager Approval...")
    bg_tasks = BackgroundTasks()
    
    # This simulates the logic inside transition_request
    trigger_notification(
        recipient_ids=[REQUESTER_ID],
        company_id=1,
        message=f"Live Test: Your request 'Pro-Grade Telemetry Tool' has been APPROVED.",
        email_subject="ProcuSure Update: Request Approved",
        email_body=f"<p>Great news! Your request has been approved and moved to the next stage.</p>",
        background_tasks=bg_tasks
    )
    
    print("In-app notification created for Requester.")
    print("Processing email dispatch...")
    for task in bg_tasks.tasks: task.func(*task.args, **task.kwargs)

    print("\n✅ Full Lifecycle Test Complete. Check your inbox!")

if __name__ == "__main__":
    run_full_lifecycle_test()
