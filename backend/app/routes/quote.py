from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.utils.response_picker import get_quote

router = APIRouter(
    prefix="/quote",
    tags=["quote"],
    responses={404: {"description": "Not found"}},
)

class QuoteInput(BaseModel):
    mood: str
    language: str = "english"

class QuoteResponse(BaseModel):
    quote: str
    mood: str
    language: str

@router.get("/", response_model=QuoteResponse)
async def get_motivational_quote(mood: str, language: str = "english"):
    """
    Get a motivational quote based on mood and language
    
    Args:
        mood: The detected mood
        language: The language for the quote
        
    Returns:
        A motivational quote
    """
    try:
        quote = get_quote(mood, language)
        return {"quote": quote, "mood": mood, "language": language}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting quote: {str(e)}")
