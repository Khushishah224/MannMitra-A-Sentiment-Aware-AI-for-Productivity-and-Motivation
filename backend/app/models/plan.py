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
    MISSED = "missed"
    SNOOZED = "snoozed"

class PlanBase(BaseModel):
    title: str
    description: Optional[str] = None
    category: PlanCategory
    subject: Optional[str] = None  # Added subject field to store the selected subject
    duration_minutes: int = Field(default=30, ge=5, le=180)
    status: PlanStatus = PlanStatus.PENDING
    # Optional reminder lead time in minutes (fire reminder lead minutes before scheduled_time)
    reminder_lead_minutes: Optional[int] = Field(default=None, ge=0, le=120)
    auto_rescheduled: Optional[bool] = False

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
    reminder_lead_minutes: Optional[int] = Field(default=None, ge=0, le=120)
    auto_rescheduled: Optional[bool] = None

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
