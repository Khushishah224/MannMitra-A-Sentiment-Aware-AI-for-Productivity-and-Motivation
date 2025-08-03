# MannMitra Setup Instructions

## Setting up the Backend

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a Python virtual environment:
```bash
python -m venv venv
```

3. Activate the virtual environment:
- On Windows:
```bash
venv\Scripts\activate
```
- On macOS/Linux:
```bash
source venv/bin/activate
```

4. Install the required packages:
```bash
pip install -r requirements.txt
```

5. Run the FastAPI application:
```bash
uvicorn main:app --reload
```

The backend should now be running at http://localhost:8000. You can access the API documentation at http://localhost:8000/docs.

## Setting up the Frontend

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install the dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

The frontend should now be running at http://localhost:5173.

## Features

1. Mood Analysis - Share how you feel in English, Hindi, or Gujarati
2. Motivational Quotes - Get contextual motivation based on your mood
3. Micro-Planner - Get personalized productivity plans when feeling unmotivated
4. History Tracking - Review your past moods and received advice

## Optional MongoDB Setup

By default, the application uses in-memory storage for simplicity. To set up MongoDB:

1. Install MongoDB Community Edition on your system
2. Create a `.env` file in the backend directory with the following content:
```
MONGODB_URI=mongodb://localhost:27017/mannmitra
```
3. Update the database connection code in the backend files to use MongoDB instead of in-memory storage.
