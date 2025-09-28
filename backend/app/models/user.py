from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
from enum import Enum

class LanguagePreference(str, Enum):
    ENGLISH = "english"
    HINDI = "hindi"
    GUJARATI = "gujarati"

class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    language_preference: LanguagePreference = LanguagePreference.ENGLISH
    show_peer_pulse: bool = True
    
class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    language_preference: Optional[LanguagePreference] = None
    show_peer_pulse: Optional[bool] = None
    
class UserInDB(UserBase):
    id: str
    hashed_password: str
    created_at: datetime
    updated_at: datetime

class User(UserBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
