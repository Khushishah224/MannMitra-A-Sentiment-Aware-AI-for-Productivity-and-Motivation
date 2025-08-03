from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.utils.sentiment import analyze_sentiment

router = APIRouter(
    prefix="/analyze",
    tags=["mood"],
    responses={404: {"description": "Not found"}},
)

class MoodInput(BaseModel):
    text: str
    language: str = "english"

class MoodResponse(BaseModel):
    mood: str
    polarity: Optional[float] = None
    subjectivity: Optional[float] = None
    source: Optional[str] = None

@router.post("/", response_model=MoodResponse)
async def analyze_mood(input_data: MoodInput):
    """
    Analyze the mood from the input text.
    
    Args:
        input_data: Text input and language
        
    Returns:
        Detected mood and sentiment metrics
    """
    if not input_data.text:
        raise HTTPException(status_code=400, detail="Text cannot be empty")
    
    try:
        result = analyze_sentiment(input_data.text, input_data.language)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing mood: {str(e)}")
