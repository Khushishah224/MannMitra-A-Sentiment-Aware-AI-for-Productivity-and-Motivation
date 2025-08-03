# Running MannMitra Application

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

4. Start the FastAPI server:
```
uvicorn main:app --reload
```

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

## Testing the Application

1. Open your browser and go to http://localhost:5173
2. Select your preferred language (English, Hindi, or Gujarati)
3. Type how you're feeling in the input box and submit
4. The application will analyze your mood and provide a motivational quote or a micro-plan based on your emotional state
5. Navigate to other pages using the bottom navigation bar

## Optional MongoDB Setup

If you want to use MongoDB for data persistence:

1. Install MongoDB on your system
2. Create a `.env` file in the backend directory based on the `.env.example` template:
```
cp .env.example .env
```

3. Update the MongoDB URI if needed
4. Restart the backend server

## Troubleshooting

- If the backend fails to start, check that all dependencies are installed correctly
- If the frontend fails to connect to the backend, ensure the backend is running and CORS is properly configured
- For any issues with MongoDB, check the connection string and ensure the MongoDB service is running
