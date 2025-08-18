# Running MannMitra Application - Enhanced Version

## Starting the Backend

1. Open a terminal and navigate to the backend directory:
```
cd backend
```

2. Create and activate a Python virtual environment:
```
# Create virtual environment
python -m venv venv

# Activate on Windows
venv\Scripts\activate

# Activate on macOS/Linux
source venv/bin/activate
```

3. Install required packages:
```
pip install -r requirements.txt
```

4. Create a .env file in the backend directory with the following content:
```
MONGODB_URI=mongodb://localhost:27017/mannmitra
JWT_SECRET_KEY=a48684a94b3e9973285121d812cd51c7e657c1e95e97b6a4f835adb4999aa7a7
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

5. Start the FastAPI server:
```
uvicorn main:app --reload
```

The backend server will run on http://localhost:8000 by default. You can access the API documentation at http://localhost:8000/docs.

The backend will be available at http://localhost:8000

You can explore the API documentation at http://localhost:8000/docs

## Starting the Frontend

1. Open another terminal and navigate to the frontend directory:
```
cd frontend
```

2. Install dependencies:
```
npm install
```

3. Start the development server:
```
npm run dev
```

The frontend will be available at http://localhost:5173

## Using the Enhanced Features

### User Authentication

1. First-time users should register an account:
   - Navigate to http://localhost:5173/register
   - Fill in your details and preferred language
   - Submit the registration form

2. Returning users should log in:
   - Go to http://localhost:5173/login
   - Enter your email and password
   - After successful login, you'll be redirected to the home page

### Enhanced Mood Detection Flow

1. On the home page, you'll be greeted with a mood input prompt
2. The enhanced flow includes three steps:
   - **Step 1**: Share how you're feeling
   - **Step 2**: View a contextual motivational quote based on your mood
   - **Step 3**: Choose what to focus on and create a plan

3. After completing these steps, you can:
   - View your plan in the planner page
   - Create another plan

### Using the Planner

1. Navigate to the Planner page using the bottom navigation bar
2. Create new tasks by clicking the "Create Task" button
3. For each task, you can:
   - Set a title, description, category, and duration
   - Edit existing tasks
   - Mark tasks as "In Progress" or "Completed"
   - Delete tasks you no longer need
   - Filter tasks by status (pending, in progress, completed) and category

4. All changes are saved to MongoDB for persistence

### Viewing History

1. Navigate to the History page to see a record of your moods
2. View past motivational quotes and plans

## MongoDB Integration

The application now uses MongoDB for data persistence:

1. Install MongoDB on your system if not already installed
2. Make sure your MongoDB server is running on the default port (27017)
3. The application will automatically create the following collections:
   - `users`: Stores user authentication and profile data
   - `moods`: Records mood history entries
   - `plans`: Stores tasks and planning data
```

3. Update the MongoDB URI if needed
4. Restart the backend server

## Troubleshooting

- If the backend fails to start, check that all dependencies are installed correctly
- If the frontend fails to connect to the backend, ensure the backend is running and CORS is properly configured
- For any issues with MongoDB, check the connection string and ensure the MongoDB service is running
