from fastapi import APIRouter, HTTPException, Depends, status
from typing import Annotated, Optional
from bson import ObjectId
from datetime import datetime, time, timedelta

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

@router.get("/history/calendar")
async def get_calendar_history(
    current_user: Annotated[User, Depends(get_current_user)],
    month: Optional[int] = None,
    year: Optional[int] = None
):
    """Return aggregated plan stats grouped by scheduled_date (calendar view).
    If month & year provided, filter to that month; otherwise return all.
    Output: { days: { 'YYYY-MM-DD': { total, completed, pending, missed, completion_rate } }, summary: {...} }
    """
    plans = db.get_user_plans(current_user.id)
    days: dict[str, dict] = {}
    for p in plans:
        day = p.get('scheduled_date')
        if not day:
            continue
        if month and year:
            if not (day.startswith(f"{year:04d}-{month:02d}")):
                continue
        drec = days.setdefault(day, { 'total':0, 'completed':0, 'missed':0, 'pending':0, 'planned_minutes':0, 'completed_minutes':0 })
        drec['total'] += 1
        status = p.get('status')
        dur = int(p.get('duration_minutes') or 0)
        drec['planned_minutes'] += dur
        if status == 'completed':
            drec['completed'] += 1
            drec['completed_minutes'] += dur
        elif status == 'missed':
            drec['missed'] += 1
        else:
            drec['pending'] += 1
    # compute per-day completion rate
    for d,v in days.items():
        v['completion_rate'] = (v['completed']/v['total']*100) if v['total'] else 0
        v['minutes_completion_rate'] = (v['completed_minutes']/v['planned_minutes']*100) if v['planned_minutes'] else 0
    # overall summary
    total = sum(v['total'] for v in days.values()) or 0
    completed = sum(v['completed'] for v in days.values())
    total_planned = sum(v['planned_minutes'] for v in days.values()) or 0
    total_completed_minutes = sum(v['completed_minutes'] for v in days.values()) or 0
    summary = {
        'days_count': len(days),
        'total_tasks': total,
        'completed': completed,
        'overall_completion_rate': (completed/total*100) if total else 0,
        'total_planned_minutes': total_planned,
        'completed_minutes': total_completed_minutes,
        'overall_minutes_completion_rate': (total_completed_minutes/total_planned*100) if total_planned else 0
    }
    return { 'days': days, 'summary': summary }

def _parse_hhmm_to_minutes(value) -> int | None:
    try:
        if value is None:
            return None
        if isinstance(value, str):
            hh, mm = value.split(":")[:2]
            return int(hh) * 60 + int(mm)
        if isinstance(value, time):
            return value.hour * 60 + value.minute
    except Exception:
        return None
    return None

def _detect_time_conflict(user_id: str, new_start: int, new_duration: int, ignore_plan_id: str | None = None):
    """Return existing conflicting plan dict or None.
    Excludes completed / cancelled plans and optionally a specific plan id (for updates)."""
    if new_start is None or new_duration <= 0:
        return None
    new_end = new_start + new_duration
    existing_plans = db.get_user_plans(user_id)
    for ep in existing_plans:
        if ignore_plan_id and ep.get("id") == ignore_plan_id:
            continue
        status_ep = ep.get("status")
        if status_ep in ("completed", "cancelled"):
            continue
        ep_start = _parse_hhmm_to_minutes(ep.get("scheduled_time"))
        ep_dur = int(ep.get("duration_minutes") or 0)
        ep_end = (ep_start + ep_dur) if ep_start is not None and ep_dur > 0 else None
        if ep_start is None or ep_end is None:
            continue
        if new_start < ep_end and ep_start < new_end:  # overlap
            return ep
    return None

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

        # Conflict detection: exclude completed/cancelled
        new_start = _parse_hhmm_to_minutes(plan_dict.get("scheduled_time"))
        new_dur = int(plan_dict.get("duration_minutes") or 0)
        if new_start is not None and new_dur > 0:
            ep = _detect_time_conflict(current_user.id, new_start, new_dur)
            if ep:
                message = (
                    "Time conflict: an existing task overlaps this time window. "
                    "Please reschedule either the existing task or the new one."
                )
                scheduled_time = ep.get("scheduled_time")
                time_str = scheduled_time
                if hasattr(scheduled_time, "strftime"):
                    time_str = scheduled_time.strftime("%H:%M")
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail={
                        "code": "TIME_CONFLICT",
                        "message": message,
                        "existing_plan": {
                            "id": ep.get("id"),
                            "title": ep.get("title"),
                            "scheduled_time": time_str,
                            "duration_minutes": ep.get("duration_minutes"),
                            "status": ep.get("status"),
                        }
                    }
                )
        # Create plan in database
        created_plan = db.create_plan(plan_dict)
        return PlanResponse(**created_plan)
    except HTTPException:
        # Re-raise HTTPExceptions as-is (these are our own validation errors)
        raise
    except Exception as e:
        import traceback
        error_traceback = traceback.format_exc()
        print(f"Error creating plan: {str(e)}")
        print(f"Traceback: {error_traceback}")
        print(f"Request data: {plan_dict}")
        
        # Check if this is a time conflict error that wasn't properly caught
        if 'TIME_CONFLICT' in str(e):
            # Extract the conflict information if possible
            try:
                import re
                conflict_info = re.search(r'\{.*\}', str(e))
                if conflict_info:
                    detail = eval(conflict_info.group(0))
                    # Raise a proper HTTPException with the conflict information
                    raise HTTPException(
                        status_code=status.HTTP_409_CONFLICT,
                        detail=detail
                    )
            except:
                # If extraction fails, provide a generic time conflict error
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail={
                        "code": "TIME_CONFLICT",
                        "message": "Time conflict detected. Please choose a different time."
                    }
                )
        # For other errors, raise a generic 500 error
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while creating the plan: {str(e)}"
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

    # Coerce enums to primitive values for comparison
    cat_val = category.value if category is not None and hasattr(category, "value") else category
    stat_val = status.value if status is not None and hasattr(status, "value") else status

    # Filter by category if provided
    if cat_val:
        plans = [p for p in plans if p.get("category") == cat_val]

    # Filter by status if provided
    if stat_val:
        plans = [p for p in plans if p.get("status") == stat_val]
    
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
        return PlanResponse(**plan)

    # Conflict detection only if scheduled_time or duration changes AND resulting plan has scheduled_time
    prospective_scheduled = update_dict.get("scheduled_time", plan.get("scheduled_time"))
    prospective_duration = int(update_dict.get("duration_minutes", plan.get("duration_minutes") or 0) or 0)
    prospective_status = update_dict.get("status", plan.get("status"))
    # If status is moving to completed, conflicts no longer matter – but still block if scheduling change collides while not completed
    if prospective_scheduled and prospective_duration > 0 and prospective_status not in ("completed", "cancelled"):
        st_mins = _parse_hhmm_to_minutes(prospective_scheduled)
        if st_mins is not None:
            ep = _detect_time_conflict(current_user.id, st_mins, prospective_duration, ignore_plan_id=plan_id)
            if ep:
                scheduled_time = ep.get("scheduled_time")
                time_str = scheduled_time
                if hasattr(scheduled_time, "strftime"):
                    time_str = scheduled_time.strftime("%H:%M")
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail={
                        "code": "TIME_CONFLICT",
                        "message": "Time conflict: overlapping task exists.",
                        "existing_plan": {
                            "id": ep.get("id"),
                            "title": ep.get("title"),
                            "scheduled_time": time_str,
                            "duration_minutes": ep.get("duration_minutes"),
                            "status": ep.get("status"),
                        }
                    }
                )

    # Update plan in database
    updated_plan = db.update_plan(plan_id, update_dict)
    
    if not updated_plan:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error updating plan"
        )
    
    return PlanResponse(**updated_plan)

@router.post("/{plan_id}/snooze", response_model=PlanResponse)
async def snooze_plan(
    plan_id: str,
    current_user: Annotated[User, Depends(get_current_user)],
    minutes: int = 10,
):
    """
    Snooze a plan by adding minutes to its scheduled_time. Creates or updates scheduled_time.
    Also sets status to 'snoozed'.
    """
    if minutes <= 0 or minutes > 240:
        raise HTTPException(status_code=400, detail="Invalid snooze minutes")

    plan = db.get_plan_by_id(plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    if plan["user_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this plan")

    # Determine base time
    now = datetime.now()
    if plan.get("scheduled_time") and isinstance(plan["scheduled_time"], time):
        base_dt = now.replace(hour=plan["scheduled_time"].hour, minute=plan["scheduled_time"].minute, second=0, microsecond=0)
    elif plan.get("scheduled_time") and isinstance(plan["scheduled_time"], str):
        try:
            hh, mm = map(int, plan["scheduled_time"].split(":"))
            base_dt = now.replace(hour=hh, minute=mm, second=0, microsecond=0)
        except Exception:
            base_dt = now
    else:
        base_dt = now

    new_dt = base_dt + timedelta(minutes=minutes)
    new_st = f"{new_dt.hour:02d}:{new_dt.minute:02d}"

    updated = db.update_plan(plan_id, {"scheduled_time": new_st, "status": "snoozed"})
    if not updated:
        raise HTTPException(status_code=500, detail="Error snoozing plan")
    return PlanResponse(**updated)

@router.post("/{plan_id}/reminder", response_model=PlanResponse)
async def set_plan_reminder(
    plan_id: str,
    current_user: Annotated[User, Depends(get_current_user)],
    lead_minutes: int,
):
    """
    Set reminder lead time in minutes before scheduled_time.
    """
    if lead_minutes < 0 or lead_minutes > 120:
        raise HTTPException(status_code=400, detail="lead_minutes must be between 0 and 120")

    plan = db.get_plan_by_id(plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    if plan["user_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this plan")

    updated = db.update_plan(plan_id, {"reminder_lead_minutes": lead_minutes})
    if not updated:
        raise HTTPException(status_code=500, detail="Error updating reminder settings")
    return PlanResponse(**updated)

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
