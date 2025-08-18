from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from enum import Enum

class CategoryType(str, Enum):
    STUDY = "study"
    WORK = "work"
    PERSONAL = "personal"
    OTHER = "other"

class UserSubjectBase(BaseModel):
    category: CategoryType
    name: str
    description: Optional[str] = None
    is_favorite: bool = False

class UserSubjectCreate(UserSubjectBase):
    user_id: Optional[str] = None

class UserSubjectResponse(UserSubjectBase):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime

class UserSubjectsResponse(BaseModel):
    subjects: List[UserSubjectResponse]
    count: int
