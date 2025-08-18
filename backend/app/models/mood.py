from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime
from enum import Enum

class MoodType(str, Enum):
    HAPPY = "happy"
    SAD = "sad"
    ANGRY = "angry"
    ANXIOUS = "anxious"
    STRESSED = "stressed"
    MOTIVATED = "motivated"
    LAZY = "lazy"
    NEUTRAL = "neutral"
    TIRED = "tired"
    CONTENT = "content"
    VERY_SAD = "very_sad"
    
    @classmethod
    def _missing_(cls, value):
        # Try to match case-insensitive
        for member in cls:
            if member.value.lower() == value.lower():
                return member
        return None

class MoodBase(BaseModel):
    text: str
    mood_type: MoodType
    score: float = Field(..., ge=-1.0, le=1.0)
    language: str = "english"
    
    # Validator to handle case-insensitive mood_type
    @validator('mood_type', pre=True)
    def validate_mood_type(cls, v):
        if isinstance(v, str) and v.upper() in [m.name for m in MoodType]:
            return v.upper()
        return v

class MoodCreate(MoodBase):
    user_id: Optional[str] = None

class MoodInDB(MoodBase):
    id: str
    user_id: str
    created_at: datetime

class MoodResponse(MoodBase):
    id: str
    created_at: datetime

class MoodHistory(BaseModel):
    moods: List[MoodResponse]
    count: int
