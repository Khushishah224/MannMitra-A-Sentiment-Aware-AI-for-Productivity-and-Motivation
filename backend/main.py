from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os
from dotenv import load_dotenv

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
from app.routes import mood, quote, planner, history, auth, plans, moods, suggestions, user_subjects

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