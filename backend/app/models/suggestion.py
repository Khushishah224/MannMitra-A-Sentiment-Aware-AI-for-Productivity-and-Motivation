from pydantic import BaseModel, validator
from typing import List, Optional, Dict, Any
from datetime import datetime, time
from enum import Enum

class CategoryType(str, Enum):
    STUDY = "study"
    WORK = "work"
    PERSONAL = "personal"
    OTHER = "other"

class SuggestionBase(BaseModel):
    mood: str
    category: CategoryType
    suggestions: List[str]

class SuggestionResponse(SuggestionBase):
    id: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class SuggestionRequest(BaseModel):
    mood: str
    category: str
    context: Optional[str] = None
    subject: Optional[str] = None
    duration: Optional[int] = 20
    start_time: Optional[time] = None

    # Accept both time objects and "HH:MM"/"HH:MM:SS" strings
    @validator('start_time', pre=True)
    def parse_start_time(cls, v):
        if v is None or isinstance(v, time):
            return v
        if isinstance(v, str):
            try:
                # Normalize to HH:MM[:SS]
                parts = v.split(':')
                h = int(parts[0])
                m = int(parts[1]) if len(parts) > 1 else 0
                s = int(parts[2]) if len(parts) > 2 else 0
                return time(hour=h, minute=m, second=s)
            except Exception:
                return None
        return None

class SuggestionWithSubject(BaseModel):
    suggestion: str
    subject: Optional[str] = None
    duration: Optional[int] = None

class PersonalizedSuggestion(BaseModel):
    suggestion: str
    category: str
    subject: Optional[str] = None
    duration_minutes: int = 20
    formatted_suggestion: Optional[str] = None
