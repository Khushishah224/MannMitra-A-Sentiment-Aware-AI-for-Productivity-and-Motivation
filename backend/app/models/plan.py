from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, time
from enum import Enum

class PlanCategory(str, Enum):
    STUDY = "study"
    WORK = "work"
    PERSONAL = "personal"
    OTHER = "other"

class PlanStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class PlanBase(BaseModel):
    title: str
    description: Optional[str] = None
    category: PlanCategory
    duration_minutes: int = Field(default=30, ge=5, le=180)
    status: PlanStatus = PlanStatus.PENDING

class PlanCreate(PlanBase):
    user_id: Optional[str] = None
    related_mood_id: Optional[str] = None
    scheduled_time: Optional[time] = None
    
    class Config:
        # This allows the model to convert string categories to enum values
        use_enum_values = True

class PlanUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[PlanCategory] = None
    duration_minutes: Optional[int] = Field(default=None, ge=5, le=180)
    status: Optional[PlanStatus] = None
    scheduled_time: Optional[time] = None

class PlanInDB(PlanBase):
    id: str
    user_id: str
    related_mood_id: Optional[str] = None
    scheduled_time: Optional[time] = None
    created_at: datetime
    updated_at: datetime

class PlanResponse(PlanBase):
    id: str
    related_mood_id: Optional[str] = None
    scheduled_time: Optional[time] = None
    created_at: datetime
    updated_at: datetime

class PlanList(BaseModel):
    plans: List[PlanResponse]
    count: int
