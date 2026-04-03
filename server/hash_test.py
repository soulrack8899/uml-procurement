import hashlib
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

def get_password_hash(password):
    pre_hash = hashlib.sha256(password.strip().encode()).hexdigest()
    return pwd_context.hash(pre_hash)

def verify_password(plain_password, hashed_password):
    clean_pass = plain_password.strip()
    pre_hash = hashlib.sha256(clean_pass.encode()).hexdigest()
    try:
        if pwd_context.verify(pre_hash, hashed_password): return True
    except Exception as e:
        print(f"Verify pre_hash error: {e}")
    try:
        if pwd_context.verify(clean_pass, hashed_password): return True
    except Exception as e:
        print(f"Verify clean_pass error: {e}")
    return clean_pass == hashed_password

if __name__ == "__main__":
    password = "password123"
    hashed = get_password_hash(password)
    print(f"Hashed: {hashed}")
    
    # Test normal logic
    result = verify_password(password, hashed)
    print(f"Result for '{password}': {result}")
    
    # Test with space
    result_space = verify_password("password 123", hashed)
    print(f"Result for 'password 123': {result_space}")
