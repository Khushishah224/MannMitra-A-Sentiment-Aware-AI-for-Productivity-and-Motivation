from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

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
from app.routes import mood, quote, planner, history

# Include routers
app.include_router(mood.router)
app.include_router(quote.router)
app.include_router(planner.router)
app.include_router(history.router)

@app.get("/")
async def root():
    return {"message": "Welcome to MannMitra API! The emotional support and productivity companion."}