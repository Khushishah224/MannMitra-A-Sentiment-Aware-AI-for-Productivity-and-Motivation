from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
import random
import re
from datetime import datetime, time
from app.models.suggestion import SuggestionRequest, PersonalizedSuggestion, SuggestionWithSubject
from app.utils.database import db
from app.routes.auth import get_current_user
from app.models.user import User

router = APIRouter(
    prefix="/suggestions",
    tags=["suggestions"],
    responses={404: {"description": "Not found"}},
)

class SuggestionListResponse(BaseModel):
    suggestions: List[SuggestionWithSubject]

@router.post("/", response_model=PersonalizedSuggestion)
async def get_mood_suggestion(request: SuggestionRequest, current_user: User = Depends(get_current_user)):
    """
    Get a personalized suggestion based on mood, category, and context
    
    Args:
        request: The suggestion request containing mood, category, and context
        
    Returns:
        A personalized suggestion
    """
    try:
        print(f"Getting suggestion for mood: {request.mood}, category: {request.category}, subject: {request.subject}")
        
        # Get suggestions for the given mood and category
        suggestions = db.get_suggestions_for_mood_category(request.mood, request.category)
        
        if not suggestions:
            print(f"No suggestions found for {request.mood}/{request.category}, falling back to neutral")
            # Fall back to neutral mood if no suggestions found
            suggestions = db.get_suggestions_for_mood_category("neutral", request.category)
        
        if not suggestions:
            print(f"No suggestions found for neutral/{request.category} either, using generic")
            # If still no suggestions, return a generic one
            return PersonalizedSuggestion(
                suggestion="Let's focus on a small task for a few minutes to build momentum.",
                category=request.category,
                subject=request.subject,
                duration_minutes=request.duration,
                formatted_suggestion="Let's focus on a small task for a few minutes to build momentum."
            )
        
        # Select a random suggestion
        suggestion = random.choice(suggestions)
        print(f"Selected suggestion: {suggestion}")
        
        # Get subjects for the category if not provided
        subject = request.subject
        if not subject and request.category in ["study", "work", "personal"]:
            print(f"Looking for subjects in category {request.category} for user {current_user.id}")
            # Include user-specific subjects
            subjects = db.get_subjects_for_category(request.category, current_user.id)
            if subjects:
                subject = random.choice(subjects)
                print(f"Selected subject: {subject}")
        
        # Format the suggestion with the subject and duration
        formatted_suggestion = suggestion
        if "{subject}" in formatted_suggestion and subject:
            formatted_suggestion = formatted_suggestion.replace("{subject}", subject)
        elif "{subject}" in formatted_suggestion:
            # If subject placeholder but no subject provided
            formatted_suggestion = formatted_suggestion.replace("{subject}", "this topic")
        
        if "{duration}" in formatted_suggestion:
            formatted_suggestion = formatted_suggestion.replace("{duration}", str(request.duration))
        
        print(f"Formatted suggestion: {formatted_suggestion}")
        
        # Create response
        response = PersonalizedSuggestion(
            suggestion=suggestion,
            category=request.category,
            subject=subject,
            duration_minutes=request.duration,
            formatted_suggestion=formatted_suggestion
        )
        
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting suggestion: {str(e)}")

@router.get("/categories/{category}", response_model=SuggestionListResponse)
async def get_subjects_by_category(category: str, current_user: User = Depends(get_current_user)):
    """
    Get subjects for a specific category, including user-specific subjects
    
    Args:
        category: The category to get subjects for
        
    Returns:
        List of subjects
    """
    try:
        # Include user-specific subjects along with default subjects
        subjects = db.get_subjects_for_category(category, current_user.id)
        return SuggestionListResponse(
            suggestions=[SuggestionWithSubject(suggestion=subject) for subject in subjects]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting subjects: {str(e)}")

@router.post("/personalized-plan")
async def create_personalized_plan(request: SuggestionRequest, current_user: User = Depends(get_current_user)):
    """
    Create a personalized plan based on mood, category, and context
    
    Args:
        request: The suggestion request containing mood, category, and context
        
    Returns:
        A personalized plan with suggested tasks
    """
    try:
        # Get a personalized suggestion
        suggestion_response = await get_mood_suggestion(request, current_user)
        
        # Use provided start_time when available; otherwise, calculate a suggested one
        if request.start_time is not None:
            start_time = request.start_time
        else:
            now = datetime.now()
            minutes = now.minute
            rounded_minutes = ((minutes + 2) // 5) * 5  # Round to nearest 5
            if rounded_minutes == 60:
                rounded_minutes = 0
                now = now.replace(hour=now.hour + 1)
            start_time = time(hour=now.hour, minute=rounded_minutes)
        start_time_str = start_time.strftime("%H:%M")
        
        # Determine the title based on subject or custom task
        title = ""
        if request.subject:
            title = f"{request.category.title()} - {request.subject}"
        else:
            # If no subject specified, use context or generic title
            if request.context:
                title = f"{request.category.title()} - {request.context[:30]}"
            else:
                title = f"{request.category.title()} Task"
        
        # Create a plan based on the suggestion
        plan_data = {
            "title": title,
            "description": suggestion_response.formatted_suggestion,
            "category": request.category,
            "duration_minutes": request.duration,
            "status": "pending",
            "user_id": current_user.id,
            # Store normalized HH:MM string
            "scheduled_time": start_time_str
        }
        
        # Save the plan to the database
        created_plan = db.create_plan(plan_data)
        
        # Add the formatted response
        if suggestion_response.subject:
            response_text = f"📝 Task: {suggestion_response.subject}\n🕒 Start at {start_time_str}?"
        else:
            response_text = f"📝 Task: {title}\n🕒 Start at {start_time_str}?"
        
        # Ensure created_plan contains scheduled_time string
        created_plan["scheduled_time"] = start_time_str
        return {
            "plan": created_plan,
            "suggestion": suggestion_response.formatted_suggestion,
            "response_text": response_text
        }
    except Exception as e:
        import traceback
        error_traceback = traceback.format_exc()
        print(f"Error creating personalized plan: {str(e)}")
        print(f"Traceback: {error_traceback}")
        print(f"Request data: mood={request.mood}, category={request.category}, subject={request.subject}, duration={request.duration}")
        
        # Return a more user-friendly error response
        raise HTTPException(
            status_code=500, 
            detail=f"Error creating personalized plan: {str(e)}"
        )
