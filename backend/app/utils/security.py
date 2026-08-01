from passlib.context import CryptContext
from jose import jwt, JWTError
from jose.exceptions import ExpiredSignatureError
from datetime import datetime, timedelta
from typing import Optional
from pydantic import EmailStr

from app.models.token import TokenData
from app.models.user import User
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# JWT Configuration
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "dev-secret-key-change-me")
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")

def _resolve_access_token_expiry_minutes(default_minutes: int = 30, min_minutes: int = 10) -> int:
    """Resolve JWT expiry from env with safe fallback and lower bound."""
    raw_value = os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", str(default_minutes)).strip()
    try:
        parsed = int(raw_value)
    except ValueError:
        return default_minutes
    return parsed if parsed >= min_minutes else default_minutes

ACCESS_TOKEN_EXPIRE_MINUTES = _resolve_access_token_expiry_minutes()

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify that the plain password matches the hashed password
    
    Args:
        plain_password: The password in plain text
        hashed_password: The hashed password to compare against
    
    Returns:
        bool: True if the password matches, False otherwise
    """
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """
    Hash a password for storing
    
    Args:
        password: The password to hash
    
    Returns:
        str: The hashed password
    """
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a JWT access token
    
    Args:
        data: The data to encode in the JWT
        expires_delta: Optional expiration time
    
    Returns:
        str: The encoded JWT token
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def decode_token(token: str) -> TokenData:
    """
    Decode a JWT token
    
    Args:
        token: The token to decode
    
    Returns:
        TokenData: The decoded token data
    
    Raises:
        JWTError: If the token is invalid
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        user_id: str = payload.get("user_id")
        if email is None or user_id is None:
            raise JWTError("Invalid token payload")
        token_data = TokenData(email=email, user_id=user_id)
        return token_data
    except ExpiredSignatureError:
        raise JWTError("Token expired")
    except JWTError:
        raise JWTError("Could not validate credentials")
