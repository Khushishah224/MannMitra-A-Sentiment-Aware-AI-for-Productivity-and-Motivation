from fastapi import APIRouter, Depends, HTTPException
from typing import List

from app.models.user_subject import (
    UserSubjectBase, 
    UserSubjectCreate, 
    UserSubjectResponse, 
    UserSubjectsResponse,
    CategoryType
)
from app.models.user import User
from app.routes.auth import get_current_user
from app.utils.database import db

router = APIRouter(
    prefix="/user-subjects",
    tags=["User Subjects"],
    responses={404: {"description": "Not found"}},
)

@router.post("/", response_model=UserSubjectResponse)
async def create_user_subject(subject: UserSubjectCreate, current_user: User = Depends(get_current_user)):
    """
    Create a new user-specific subject
    """
    # Override user_id with the current user's ID for security
    subject_dict = subject.model_dump()
    subject_dict["user_id"] = current_user.id
    
    try:
        created_subject = db.create_user_subject(subject_dict)
        return created_subject
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating subject: {str(e)}")

@router.get("/category/{category}", response_model=UserSubjectsResponse)
async def get_user_subjects_by_category(category: str, current_user: User = Depends(get_current_user)):
    """
    Get user-specific subjects for a category
    """
    try:
        # Validate category
        CategoryType(category)  # This will raise a ValueError if invalid
        subjects = db.get_user_subjects_by_category(current_user.id, category)
        return UserSubjectsResponse(subjects=subjects, count=len(subjects))
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid category: {category}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving subjects: {str(e)}")

@router.get("/{subject_id}", response_model=UserSubjectResponse)
async def get_user_subject(subject_id: str, current_user: User = Depends(get_current_user)):
    """
    Get a specific user subject by ID
    """
    try:
        subject = db.get_user_subject_by_id(subject_id)
        if not subject:
            raise HTTPException(status_code=404, detail="Subject not found")
        
        # Security: Ensure the subject belongs to the current user
        if subject["user_id"] != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to access this subject")
            
        return subject
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving subject: {str(e)}")

@router.put("/{subject_id}", response_model=UserSubjectResponse)
async def update_user_subject(subject_id: str, update_data: UserSubjectCreate, current_user: User = Depends(get_current_user)):
    """
    Update a user subject
    """
    try:
        # Check if subject exists and belongs to the user
        existing_subject = db.get_user_subject_by_id(subject_id)
        if not existing_subject:
            raise HTTPException(status_code=404, detail="Subject not found")
        
        if existing_subject["user_id"] != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to update this subject")
        
        # Update the subject
        update_dict = update_data.model_dump(exclude_unset=True)
        update_dict["user_id"] = current_user.id  # Ensure user_id remains the same
        
        updated_subject = db.update_user_subject(subject_id, update_dict)
        if not updated_subject:
            raise HTTPException(status_code=500, detail="Failed to update subject")
            
        return updated_subject
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating subject: {str(e)}")

@router.delete("/{subject_id}")
async def delete_user_subject(subject_id: str, current_user: User = Depends(get_current_user)):
    """
    Delete a user subject
    """
    try:
        # Check if subject exists and belongs to the user
        existing_subject = db.get_user_subject_by_id(subject_id)
        if not existing_subject:
            raise HTTPException(status_code=404, detail="Subject not found")
        
        if existing_subject["user_id"] != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to delete this subject")
        
        # Delete the subject
        success = db.delete_user_subject(subject_id)
        if not success:
            raise HTTPException(status_code=500, detail="Failed to delete subject")
            
        return {"message": "Subject deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting subject: {str(e)}")
