from fastapi import APIRouter, HTTPException, Depends, status
from typing import Annotated, Optional
from pydantic import BaseModel

from app.models.user import User
from app.routes.auth import get_current_user
from app.utils.decision import evaluate_decision

router = APIRouter(
    prefix="/decision",
    tags=["decision"],
    responses={
        401: {"description": "Unauthorized"},
        400: {"description": "Bad request"},
    },
)

class DecisionRequest(BaseModel):
    option1: str
    option2: str
    context: str
    mood: str = "neutral"
    
class DecisionResponse(BaseModel):
    recommendation: str
    confidence: int
    option1_score: int
    option2_score: int
    factors: dict
    explanation: str
    advice: str

@router.post("/", response_model=DecisionResponse)
async def make_decision(
    request: DecisionRequest,
    current_user: Annotated[User, Depends(get_current_user)]
):
    """
    Evaluate a decision between two options using fuzzy logic
    
    Args:
        request: Decision request with options and context
        current_user: The current authenticated user
        
    Returns:
        DecisionResponse: The decision recommendation and explanation
    """
    if not request.option1 or not request.option2:
        raise HTTPException(status_code=400, detail="Both options must be provided")
    
    if not request.context:
        raise HTTPException(status_code=400, detail="Context must be provided")
    
    try:
        # Process the decision
        result = evaluate_decision(
            request.option1,
            request.option2,
            request.context,
            request.mood.lower() if request.mood else "neutral"
        )
        
        return DecisionResponse(
            recommendation=result["recommendation"],
            confidence=result["confidence"],
            option1_score=result["option1_score"],
            option2_score=result["option2_score"],
            factors=result["factors"],
            explanation=result["explanation"],
            advice=result["advice"]
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing decision: {str(e)}"
        )
