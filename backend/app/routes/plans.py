from fastapi import APIRouter, HTTPException, Depends, status
from typing import Annotated, List, Optional
from bson import ObjectId
from datetime import datetime, time

from app.models.user import User
from app.models.plan import (
    PlanCreate, 
    PlanUpdate, 
    PlanResponse, 
    PlanList,
    PlanCategory,
    PlanStatus
)
from app.routes.auth import get_current_user
from app.utils.database import db

router = APIRouter(
    prefix="/plans",
    tags=["plans"],
    responses={
        401: {"description": "Unauthorized"},
        403: {"description": "Forbidden"},
        404: {"description": "Not found"}
    },
)

@router.post("/", response_model=PlanResponse, status_code=status.HTTP_201_CREATED)
async def create_plan(
    plan_data: PlanCreate,
    current_user: Annotated[User, Depends(get_current_user)]
):
    """
    Create a new plan
    
    Args:
        plan_data: The plan data to create
        current_user: The current authenticated user
        
    Returns:
        PlanResponse: The created plan
    """
    try:
        # Override user_id with authenticated user's ID
        plan_dict = plan_data.model_dump()
        plan_dict["user_id"] = current_user.id
        
        # Create plan in database
        created_plan = db.create_plan(plan_dict)
        
        return PlanResponse(**created_plan)
    except Exception as e:
        import traceback
        error_traceback = traceback.format_exc()
        print(f"Error creating plan: {str(e)}")
        print(f"Traceback: {error_traceback}")
        print(f"Request data: {plan_dict}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating plan: {str(e)}"
        )

@router.get("/", response_model=PlanList)
async def get_plans(
    current_user: Annotated[User, Depends(get_current_user)],
    category: Optional[PlanCategory] = None,
    status: Optional[PlanStatus] = None
):
    """
    Get all plans for the current user
    
    Args:
        current_user: The current authenticated user
        category: Optional filter by category
        status: Optional filter by status
        
    Returns:
        PlanList: The list of plans
    """
    plans = db.get_user_plans(current_user.id)
    
    # Filter by category if provided
    if category:
        plans = [p for p in plans if p.get("category") == category]
    
    # Filter by status if provided
    if status:
        plans = [p for p in plans if p.get("status") == status]
    
    return PlanList(plans=plans, count=len(plans))

@router.get("/{plan_id}", response_model=PlanResponse)
async def get_plan(
    plan_id: str,
    current_user: Annotated[User, Depends(get_current_user)]
):
    """
    Get a specific plan by ID
    
    Args:
        plan_id: The ID of the plan to retrieve
        current_user: The current authenticated user
        
    Returns:
        PlanResponse: The plan
        
    Raises:
        HTTPException: If the plan is not found or doesn't belong to the user
    """
    plan = db.get_plan_by_id(plan_id)
    
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Plan not found"
        )
    
    # Check if the plan belongs to the user
    if plan["user_id"] != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this plan"
        )
    
    return PlanResponse(**plan)

@router.put("/{plan_id}", response_model=PlanResponse)
async def update_plan(
    plan_id: str,
    update_data: PlanUpdate,
    current_user: Annotated[User, Depends(get_current_user)]
):
    """
    Update a plan
    
    Args:
        plan_id: The ID of the plan to update
        update_data: The data to update
        current_user: The current authenticated user
        
    Returns:
        PlanResponse: The updated plan
        
    Raises:
        HTTPException: If the plan is not found, doesn't belong to the user, or there was an error updating
    """
    # Get the plan to verify ownership
    plan = db.get_plan_by_id(plan_id)
    
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Plan not found"
        )
    
    # Check if the plan belongs to the user
    if plan["user_id"] != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this plan"
        )
    
    # Prepare update data
    update_dict = update_data.model_dump(exclude_unset=True)
    
    if not update_dict:
        # Nothing to update
        return PlanResponse(**plan)
    
    # Update plan in database
    updated_plan = db.update_plan(plan_id, update_dict)
    
    if not updated_plan:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error updating plan"
        )
    
    return PlanResponse(**updated_plan)

@router.delete("/{plan_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_plan(
    plan_id: str,
    current_user: Annotated[User, Depends(get_current_user)]
):
    """
    Delete a plan
    
    Args:
        plan_id: The ID of the plan to delete
        current_user: The current authenticated user
        
    Raises:
        HTTPException: If the plan is not found, doesn't belong to the user, or there was an error deleting
    """
    # Get the plan to verify ownership
    plan = db.get_plan_by_id(plan_id)
    
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Plan not found"
        )
    
    # Check if the plan belongs to the user
    if plan["user_id"] != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this plan"
        )
    
    # Delete the plan
    success = db.delete_plan(plan_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error deleting plan"
        )
