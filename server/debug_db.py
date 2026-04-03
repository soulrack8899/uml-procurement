from sqlmodel import Session, select
from models import auth_engine, User

def check_users():
    with Session(auth_engine) as session:
        users = session.exec(select(User)).all()
        for u in users:
            print(f"ID: {u.id}, Name: {u.name}, Email: {u.email}, Password_Start: {u.password[:10]}..., Status: {u.approval_status}, Is_Temp: {u.is_temporary_password}")

if __name__ == "__main__":
    check_users()
