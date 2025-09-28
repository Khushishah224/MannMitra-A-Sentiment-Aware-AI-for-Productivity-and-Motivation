from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from datetime import timedelta
from typing import Annotated
from jose import JWTError

from app.models.user import UserCreate, User, UserInDB, UserUpdate
from app.models.token import Token
from app.utils.security import (
    verify_password, 
    get_password_hash, 
    create_access_token, 
    decode_token,
    ACCESS_TOKEN_EXPIRE_MINUTES
)
from app.utils.database import db
from bson import ObjectId
from datetime import datetime

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
    responses={
        401: {"description": "Unauthorized"},
        403: {"description": "Forbidden"},
    },
)

# OAuth2 password bearer scheme for token extraction (header-only)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token")

def get_bearer_or_cookie_token(request: Request) -> str | None:
    """Extract JWT token from Authorization header (Bearer) or cookies."""
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.lower().startswith("bearer "):
        return auth_header.split(" ", 1)[1].strip()
    cookie_token = request.cookies.get("access_token")
    return cookie_token

# Dependencies
async def get_current_user(request: Request) -> User:
    """
    Dependency to get the current user from the token
    
    Args:
        token: The JWT token
        
    Returns:
        User: The current user
        
    Raises:
        HTTPException: If the token is invalid or the user is not found
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        token = get_bearer_or_cookie_token(request)
        if not token:
            raise credentials_exception
        token_data = decode_token(token)
        user = db.get_user_by_id(token_data.user_id)
        
        if user is None:
            raise credentials_exception
        
        return User(
            id=user["id"],
            email=user["email"],
            full_name=user["full_name"],
            language_preference=user["language_preference"],
            show_peer_pulse=user.get("show_peer_pulse", True),
            created_at=user["created_at"],
            updated_at=user["updated_at"]
        )
    except JWTError:
        raise credentials_exception

@router.post("/register", response_model=User)
async def register_user(user_data: UserCreate):
    """
    Register a new user
    
    Args:
        user_data: User registration data
        
    Returns:
        User: The newly created user
        
    Raises:
        HTTPException: If a user with the provided email already exists
    """
    # Check if user already exists
    existing_user = db.get_user_by_email(user_data.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create user document
    user_id = str(ObjectId())
    hashed_password = get_password_hash(user_data.password)
    user_dict = {
        "email": user_data.email,
        "full_name": user_data.full_name,
        "language_preference": user_data.language_preference,
        "hashed_password": hashed_password,
        "show_peer_pulse": True
    }
    
    created_user = db.create_user(user_dict)
    
    if not created_user:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error creating user"
        )
    
    return User(
        id=created_user["id"],
        email=created_user["email"],
        full_name=created_user["full_name"],
        language_preference=created_user["language_preference"],
        show_peer_pulse=created_user.get("show_peer_pulse", True),
        created_at=created_user["created_at"],
        updated_at=created_user["updated_at"]
    )

@router.post("/token", response_model=Token)
async def login_for_access_token(response: Response, form_data: Annotated[OAuth2PasswordRequestForm, Depends()]):
    """
    Login endpoint to get access token
    
    Args:
        form_data: OAuth2 form with username (email) and password
        
    Returns:
        Token: JWT access token
        
    Raises:
        HTTPException: If the credentials are invalid
    """
    # Find user by email
    user = db.get_user_by_email(form_data.username)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Verify password
    if not verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["email"], "user_id": user["id"]},
        expires_delta=access_token_expires,
    )
    
    # Also set HttpOnly cookie for browsers (dev-friendly; secure flag off for localhost)
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        samesite="lax",
        secure=False
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=User)
async def get_current_user_profile(current_user: Annotated[User, Depends(get_current_user)]):
    """
    Get the current user's profile
    
    Args:
        current_user: The current authenticated user
        
    Returns:
        User: The current user
    """
    return current_user

@router.put("/me", response_model=User)
async def update_current_user(
    update_data: UserUpdate,
    current_user: Annotated[User, Depends(get_current_user)]
):
    """
    Update the current user's profile
    
    Args:
        update_data: The data to update
        current_user: The current authenticated user
        
    Returns:
        User: The updated user
        
    Raises:
        HTTPException: If there was an error updating the user
    """
    # Prepare update data
    update_dict = update_data.model_dump(exclude_unset=True)
    
    if not update_dict:
        # Nothing to update
        return current_user
    
    # Update user in database
    updated_user = db.update_user(current_user.id, update_dict)
    
    if not updated_user:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error updating user"
        )
    
    return User(
        id=updated_user["id"],
        email=updated_user["email"],
        full_name=updated_user["full_name"],
        language_preference=updated_user["language_preference"],
        show_peer_pulse=updated_user.get("show_peer_pulse", True),
        created_at=updated_user["created_at"],
        updated_at=updated_user["updated_at"]
    )

@router.post("/logout", status_code=status.HTTP_200_OK)
async def logout(response: Response):
    """
    Logout endpoint
    
    Note: Since JWT tokens are stateless, there's no server-side session to invalidate.
    The client should simply remove the token from local storage.
    
    Returns:
        dict: A success message
    """
    # Clear cookie as well
    response.delete_cookie("access_token")
    return {"message": "Logout successful"}
