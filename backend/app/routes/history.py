from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

router = APIRouter(
    prefix="/history",
    tags=["history"],
    responses={404: {"description": "Not found"}},
)

# This is a simple in-memory storage for demonstration
# In a production app, you would use a database like MongoDB
mood_history = {}

class MoodEntry(BaseModel):
    user_id: str
    timestamp: datetime = None
    mood: str
    text: str
    language: str
    task_completed: Optional[bool] = None
    
class MoodHistoryResponse(BaseModel):
    entries: List[MoodEntry]

@router.post("/", response_model=MoodEntry)
async def add_mood_entry(entry: MoodEntry):
    """
    Add a mood entry to the user's history
    
    Args:
        entry: The mood entry to add
        
    Returns:
        The added entry with timestamp
    """
    if entry.timestamp is None:
        entry.timestamp = datetime.now()
    
    if entry.user_id not in mood_history:
        mood_history[entry.user_id] = []
    
    mood_history[entry.user_id].append(entry)
    return entry

@router.get("/{user_id}", response_model=MoodHistoryResponse)
async def get_mood_history(user_id: str):
    """
    Get the mood history for a user
    
    Args:
        user_id: The user ID
        
    Returns:
        List of mood entries for the user
    """
    if user_id not in mood_history:
        return {"entries": []}
    
    return {"entries": mood_history[user_id]}

@router.put("/{user_id}/{entry_index}")
async def update_task_completion(user_id: str, entry_index: int, completed: bool):
    """
    Update the task completion status for a mood entry
    
    Args:
        user_id: The user ID
        entry_index: The index of the entry to update
        completed: The task completion status
        
    Returns:
        The updated entry
    """
    if user_id not in mood_history:
        raise HTTPException(status_code=404, detail="User not found")
    
    if entry_index >= len(mood_history[user_id]):
        raise HTTPException(status_code=404, detail="Entry not found")
    
    mood_history[user_id][entry_index].task_completed = completed
    return mood_history[user_id][entry_index]
