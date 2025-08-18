from fastapi import APIRouter, HTTPException, Depends, status
from typing import Annotated, List, Optional
from datetime import datetime
from bson import ObjectId
from pydantic import BaseModel

from app.models.user import User
from app.models.mood import MoodCreate, MoodResponse, MoodHistory, MoodType
from app.utils.sentiment import analyze_sentiment
from app.routes.auth import get_current_user
from app.utils.database import db

router = APIRouter(
    prefix="/moods",
    tags=["moods"],
    responses={
        401: {"description": "Unauthorized"},
        404: {"description": "Not found"}
    },
)

@router.post("/", response_model=MoodResponse, status_code=status.HTTP_201_CREATED)
async def track_mood(
    mood_data: MoodCreate,
    current_user: Annotated[User, Depends(get_current_user)]
):
    """
    Track a new mood entry
    
    Args:
        mood_data: The mood data to track
        current_user: The current authenticated user
        
    Returns:
        MoodResponse: The tracked mood
    """
    try:
        print(f"Received mood data: {mood_data}")
        print(f"Current user: {current_user}")
        
        # Override user_id with authenticated user's ID (or set it if not provided)
        mood_dict = mood_data.model_dump()
        mood_dict["user_id"] = current_user.id
    except Exception as e:
        print(f"Error in track_mood: {e}")
        raise HTTPException(status_code=422, detail=f"Invalid data format: {str(e)}")
    
    # Add timestamp
    now = datetime.now()
    mood_dict["created_at"] = now
    
    # Save mood to database
    created_mood = db.save_mood(current_user.id, mood_dict)
    
    # Ensure we have an ID field
    if "id" not in created_mood and "_id" in created_mood:
        created_mood["id"] = str(created_mood["_id"])
    
    print(f"Created mood: {created_mood}")
    
    return MoodResponse(
        id=created_mood["id"],
        text=created_mood["text"],
        mood_type=created_mood["mood_type"],
        score=created_mood["score"],
        language=created_mood["language"],
        created_at=created_mood["created_at"]
    )

class AnalyzeRequest(BaseModel):
    text: str
    language: str = "english"

@router.post("/analyze", response_model=MoodResponse)
async def analyze_mood(
    request: AnalyzeRequest,
    current_user: Annotated[User, Depends(get_current_user)],
):
    """
    Analyze mood from text without saving to history
    
    Args:
        text: The text to analyze
        language: The language of the text
        current_user: The current authenticated user
        
    Returns:
        MoodResponse: The analyzed mood
    """
    if not request.text:
        raise HTTPException(status_code=400, detail="Text cannot be empty")
    
    try:
        result = analyze_sentiment(request.text, request.language)
        
        # Convert to MoodResponse
        return MoodResponse(
            id="temp",  # Not saved, so no real ID
            text=request.text,
            mood_type=result["mood"],
            score=result.get("polarity", 0),
            language=request.language,
            created_at=datetime.now()
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing mood: {str(e)}")

@router.get("/", response_model=MoodHistory)
async def get_mood_history(
    current_user: Annotated[User, Depends(get_current_user)],
    limit: int = 10,
    mood_type: Optional[MoodType] = None
):
    """
    Get mood history for the current user
    
    Args:
        current_user: The current authenticated user
        limit: Maximum number of entries to return
        mood_type: Optional filter by mood type
        
    Returns:
        MoodHistory: The mood history
    """
    moods = db.get_user_moods(current_user.id)
    
    # Filter by mood_type if provided
    if mood_type:
        moods = [m for m in moods if m.get("mood_type") == mood_type]
    
    # Limit the number of results
    moods = moods[:limit]
    
    # Convert to MoodResponse objects
    mood_responses = [
        MoodResponse(
            id=mood.get("id", str(mood.get("_id", ""))),
            text=mood["text"],
            mood_type=mood["mood_type"],
            score=mood["score"],
            language=mood["language"],
            created_at=mood["created_at"]
        )
        for mood in moods
    ]
    
    return MoodHistory(moods=mood_responses, count=len(mood_responses))
