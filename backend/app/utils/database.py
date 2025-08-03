from pymongo import MongoClient
from dotenv import load_dotenv
import os
from datetime import datetime
from typing import List, Dict, Optional, Any

# Load environment variables
load_dotenv()

# MongoDB connection string
MONGODB_URI = os.getenv("MONGODB_URI")

class Database:
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(Database, cls).__new__(cls)
            try:
                # Connect to MongoDB
                cls._instance.client = MongoClient(MONGODB_URI)
                cls._instance.db = cls._instance.client.mannmitra
                
                # Create collections
                cls._instance.quotes = cls._instance.db.quotes
                cls._instance.moods = cls._instance.db.moods
                cls._instance.plans = cls._instance.db.plans
                
                print("Connected to MongoDB")
            except Exception as e:
                print(f"Error connecting to MongoDB: {str(e)}")
                # Fall back to in-memory storage
                cls._instance.client = None
                cls._instance.db = None
                cls._instance.quotes = {}
                cls._instance.moods = {}
                cls._instance.plans = {}
                print("Using in-memory storage")
        
        return cls._instance
    
    def is_connected(self) -> bool:
        """
        Check if connected to MongoDB
        
        Returns:
            bool: True if connected to MongoDB, False otherwise
        """
        return self.client is not None
    
    # Quotes methods
    def save_quotes(self, quotes_data: Dict[str, Any]) -> None:
        """
        Save quotes to database
        
        Args:
            quotes_data (dict): Quotes data
        """
        if self.is_connected():
            # Convert to list for MongoDB
            quotes_list = [
                {
                    "mood": mood,
                    "language": language,
                    "quotes": quotes
                }
                for mood, langs in quotes_data.items()
                for language, quotes in langs.items()
            ]
            
            # Clear existing quotes and insert new ones
            self.quotes.delete_many({})
            if quotes_list:
                self.quotes.insert_many(quotes_list)
        else:
            # Store in memory
            self.quotes = quotes_data
    
    def get_quotes(self) -> Dict[str, Any]:
        """
        Get quotes from database
        
        Returns:
            dict: Quotes data
        """
        if self.is_connected():
            # Convert from MongoDB format back to nested dict
            result = {}
            quotes_list = list(self.quotes.find({}, {"_id": 0}))
            
            for item in quotes_list:
                mood = item["mood"]
                language = item["language"]
                quotes = item["quotes"]
                
                if mood not in result:
                    result[mood] = {}
                
                result[mood][language] = quotes
            
            return result
        else:
            # Return from memory
            return self.quotes
    
    # Mood history methods
    def save_mood(self, user_id: str, mood_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Save mood entry to database
        
        Args:
            user_id (str): User ID
            mood_data (dict): Mood data
            
        Returns:
            dict: Saved mood data with ID
        """
        # Add timestamp if not present
        if "timestamp" not in mood_data:
            mood_data["timestamp"] = datetime.now()
        
        mood_data["user_id"] = user_id
        
        if self.is_connected():
            # Insert into MongoDB
            result = self.moods.insert_one(mood_data)
            mood_data["_id"] = str(result.inserted_id)
        else:
            # Store in memory
            if user_id not in self.moods:
                self.moods[user_id] = []
            
            self.moods[user_id].append(mood_data)
        
        return mood_data
    
    def get_user_moods(self, user_id: str) -> List[Dict[str, Any]]:
        """
        Get mood history for a user
        
        Args:
            user_id (str): User ID
            
        Returns:
            list: List of mood entries
        """
        if self.is_connected():
            return list(self.moods.find({"user_id": user_id}, {"_id": 0}).sort("timestamp", -1))
        else:
            # Return from memory
            return self.moods.get(user_id, [])
    
    def update_mood_task(self, user_id: str, mood_id: str, task_completed: bool) -> bool:
        """
        Update task completion status for a mood entry
        
        Args:
            user_id (str): User ID
            mood_id (str): Mood entry ID
            task_completed (bool): Task completion status
            
        Returns:
            bool: True if updated successfully, False otherwise
        """
        if self.is_connected():
            result = self.moods.update_one(
                {"_id": mood_id, "user_id": user_id},
                {"$set": {"task_completed": task_completed}}
            )
            return result.modified_count > 0
        else:
            # Update in memory
            try:
                mood_list = self.moods.get(user_id, [])
                for mood in mood_list:
                    if mood.get("_id") == mood_id:
                        mood["task_completed"] = task_completed
                        return True
                return False
            except:
                return False

# Initialize database
db = Database()
