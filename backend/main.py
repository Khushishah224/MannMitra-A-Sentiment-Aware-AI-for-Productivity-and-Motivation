from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os
from dotenv import load_dotenv
from datetime import datetime, timedelta
import asyncio

# Load environment variables
load_dotenv()

# Import utility for loading default data
from app.utils.defaultdata import insert_all_defaults

app = FastAPI(
    title="MannMitra API",
    description="A Sentiment-Aware AI for Productivity and Motivation",
    version="1.0.0"
)

# CORS configuration - allow all origins in development
origins = ["*"]  # Allowing all origins for development

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
)

# Import routes
from app.routes import mood, quote, planner, history, auth, plans, moods, suggestions, user_subjects, decision
from app.utils.database import db

# Include routers
app.include_router(auth.router)
app.include_router(mood.router)
app.include_router(moods.router)  # Mood tracking router
app.include_router(quote.router)
app.include_router(planner.router)
app.include_router(plans.router)  # Plans CRUD router
app.include_router(suggestions.router)  # Suggestions router
app.include_router(user_subjects.router)  # User-specific subjects router
app.include_router(history.router)
app.include_router(decision.router)  # Decision helper router (Sprint 4)

# Automatically initialize default data during startup
@app.on_event("startup")
async def initialize_default_data():
    """
    Initialize default data (quotes, suggestions, subjects, users) during application startup
    """
    print("Initializing default data during startup...")
    success = insert_all_defaults()
    if success:
        print("Default data initialized successfully.")
        print("Default users available: khushi@example.com, jayesh@example.com, sangita@example.com, amit@example.com (password: password123)")
    else:
        print("Warning: Some default data could not be initialized.")

    # Start background auto-rescheduler
    async def auto_rescheduler_loop():
        while True:
            try:
                now = datetime.now()
                # Determine current HH:MM to compare with scheduled_time
                current_hm = f"{now.hour:02d}:{now.minute:02d}"
                # Fetch all plans for all users (Mongo path); for in-memory, iterate values
                plans_to_check = []
                if db.is_connected():
                    # Pull pending/in_progress/snoozed plans scheduled before now; conservative: get all and filter
                    plans_raw = list(db.plans.find({}))
                    for p in plans_raw:
                        p['id'] = str(p.get('_id')) if p.get('_id') else p.get('id')
                        plans_to_check.append(p)
                else:
                    for _uid, plist in db.plans.items():
                        plans_to_check.extend(plist)

                for p in plans_to_check:
                    status = p.get('status')
                    st = p.get('scheduled_time')
                    if not st or status in ('completed', 'cancelled'):
                        continue
                    st_str = st if isinstance(st, str) else None
                    if not st_str:
                        continue
                    # If scheduled time is earlier than current minute and still not completed, mark missed
                    try:
                        # Compare HH:MM lexicographically since both 24h strings
                        if st_str < current_hm and status in ('pending', 'snoozed'):
                            # Auto-reschedule this task to a future time today and make it lighter
                            new_duration = max(10, int((p.get('duration_minutes') or 20) * 0.75))
                            # Move to 60 minutes from now (rounded to next 5 minutes)
                            new_dt = now + timedelta(minutes=60)
                            # Round up to the next 5-minute boundary
                            rounded_minute = ((new_dt.minute + 4) // 5) * 5
                            if rounded_minute == 60:
                                new_dt = new_dt.replace(hour=(new_dt.hour + 1) % 24, minute=0)
                            else:
                                new_dt = new_dt.replace(minute=rounded_minute)
                            new_st = f"{new_dt.hour:02d}:{new_dt.minute:02d}"
                            
                            # Check for time conflicts
                            user_id = p.get('user_id')
                            conflict_found = False
                            
                            if user_id:
                                # Parse new start and end times for comparison
                                def parse_hhmm_to_minutes(value) -> int | None:
                                    try:
                                        if value is None:
                                            return None
                                        if isinstance(value, str):
                                            hh, mm = value.split(":")[:2]
                                            return int(hh) * 60 + int(mm)
                                    except Exception:
                                        return None
                                    return None
                                
                                new_start = parse_hhmm_to_minutes(new_st)
                                new_end = (new_start + new_duration) if new_start is not None and new_duration > 0 else None
                                
                                # Get other plans for this user
                                other_plans = []
                                if db.is_connected():
                                    other_plans = list(db.plans.find({"user_id": user_id}))
                                else:
                                    other_plans = db.get_user_plans(user_id)
                                
                                # Check for conflicts
                                for op in other_plans:
                                    # Skip the current plan being rescheduled
                                    if str(op.get('_id', '')) == str(p.get('_id', '')) or op.get('id') == p.get('id'):
                                        continue
                                        
                                    # Skip completed or cancelled plans
                                    if op.get('status') in ('completed', 'cancelled'):
                                        continue
                                        
                                    op_start = parse_hhmm_to_minutes(op.get("scheduled_time"))
                                    op_dur = int(op.get("duration_minutes") or 0)
                                    op_end = (op_start + op_dur) if op_start is not None and op_dur > 0 else None
                                    
                                    if op_start is None or op_end is None or new_start is None or new_end is None:
                                        continue
                                        
                                    # Check for overlap
                                    if new_start < op_end and op_start < new_end:
                                        # Found conflict - push forward by op_dur minutes
                                        conflict_found = True
                                        # Add the conflicting task's duration + 5 min buffer
                                        new_dt = new_dt + timedelta(minutes=op_dur + 5)
                                        # Recalculate scheduled time
                                        new_st = f"{new_dt.hour:02d}:{new_dt.minute:02d}"
                                        # Update new_start and new_end for next iteration
                                        new_start = parse_hhmm_to_minutes(new_st)
                                        new_end = (new_start + new_duration) if new_start is not None and new_duration > 0 else None
                                
                            # Update existing plan instead of creating a new one (avoids duplicates)
                            update = {
                                'status': 'pending',
                                'scheduled_time': new_st,
                                'duration_minutes': new_duration,
                                'auto_rescheduled': True,
                                'conflict_resolved': conflict_found,  # Mark if we had to resolve conflicts
                            }
                            plan_id = p.get('id') or (str(p.get('_id')) if p.get('_id') else None)
                            if plan_id:
                                db.update_plan(plan_id, update)
                    except Exception:
                        continue
            except Exception:
                pass
            # Run roughly every 5 minutes
            await asyncio.sleep(300)

    # Fire-and-forget background task
    try:
        asyncio.create_task(auto_rescheduler_loop())
    except Exception as _:
        print('Failed to start auto-rescheduler loop')

@app.get("/")
async def root():
    return {"message": "Welcome to MannMitra API! The emotional support and productivity companion."}

@app.post("/_admin/reinitialize-data")
async def reinitialize_data():
    """
    Manually reinitialize the database with default data (quotes, suggestions, subjects, users)
    This endpoint is for administrative use only and not meant to be public.
    """
    success = insert_all_defaults()
    if success:
        return {
            "message": "Default data reinitialized successfully",
            "note": "Default users available: khushi@example.com, jayesh@example.com, sangita@example.com, amit@example.com (password: password123)"
        }
    else:
        return {"message": "Error reinitializing some default data", "success": False}