from pymongo import MongoClient
from bson import ObjectId
from dotenv import load_dotenv
import os
from datetime import datetime, time
from typing import List, Dict, Optional, Any, Union

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
                cls._instance.users = cls._instance.db.users
                cls._instance.suggestions = cls._instance.db.suggestions
                cls._instance.subjects = cls._instance.db.subjects
                cls._instance.user_subjects = cls._instance.db.user_subjects
                
                # Create indexes
                if not list(cls._instance.db.users.list_indexes()):
                    cls._instance.users.create_index("email", unique=True)
                
                print("Connected to MongoDB")
            except Exception as e:
                print(f"Error connecting to MongoDB: {str(e)}")
                # Fall back to in-memory storage
                cls._instance.client = None
                cls._instance.db = None
                cls._instance.quotes = {}
                cls._instance.moods = {}
                cls._instance.plans = {}
                cls._instance.users = {}
                cls._instance.suggestions = {}
                cls._instance.subjects = {}
                cls._instance.user_subjects = {}
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
            mood_data["_id"] = result.inserted_id
            mood_data["id"] = str(result.inserted_id)
        else:
            # Store in memory
            if user_id not in self.moods:
                self.moods[user_id] = []
            
            # For in-memory storage, we need to add an ID
            if "id" not in mood_data:
                mood_data["id"] = str(ObjectId())
            
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
            moods = list(self.moods.find({"user_id": user_id}).sort("created_at", -1))
            
            # Convert ObjectId to string and ensure ID field exists
            for mood in moods:
                if "_id" in mood:
                    mood["id"] = str(mood["_id"])
                    # Keep _id but as string for backward compatibility
                    mood["_id"] = str(mood["_id"])
            
            return moods
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

# User-related methods
    def create_user(self, user_data: Dict[str, Any]) -> Union[Dict[str, Any], None]:
        """
        Create a new user in the database
        
        Args:
            user_data (dict): User data
            
        Returns:
            dict: Created user data with ID or None if user already exists
        """
        # Add timestamps
        now = datetime.now()
        user_data["created_at"] = now
        user_data["updated_at"] = now
        
        if self.is_connected():
            try:
                # Insert into MongoDB
                result = self.users.insert_one(user_data)
                user_data["id"] = str(result.inserted_id)
                del user_data["_id"]
                return user_data
            except Exception as e:
                # User may already exist
                print(f"Error creating user: {str(e)}")
                return None
        else:
            # Store in memory
            email = user_data.get("email")
            # Check if user exists
            for user in self.users.values():
                if user.get("email") == email:
                    return None
            
            user_id = str(ObjectId())
            user_data["id"] = user_id
            self.users[user_id] = user_data
            return user_data
    
    def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        """
        Get a user by email
        
        Args:
            email (str): User email
            
        Returns:
            dict: User data or None if not found
        """
        if self.is_connected():
            user = self.users.find_one({"email": email})
            if user:
                user["id"] = str(user["_id"])
                del user["_id"]
                return user
            return None
        else:
            # Search in memory
            for user in self.users.values():
                if user.get("email") == email:
                    return user
            return None
    
    def get_user_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        """
        Get a user by ID
        
        Args:
            user_id (str): User ID
            
        Returns:
            dict: User data or None if not found
        """
        if self.is_connected():
            try:
                user = self.users.find_one({"_id": ObjectId(user_id)})
                if user:
                    user["id"] = str(user["_id"])
                    del user["_id"]
                    return user
                return None
            except:
                return None
        else:
            # Get from memory
            return self.users.get(user_id)
    
    def update_user(self, user_id: str, update_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Update a user in the database
        
        Args:
            user_id (str): User ID
            update_data (dict): Data to update
            
        Returns:
            dict: Updated user data or None if user not found
        """
        # Add updated timestamp
        update_data["updated_at"] = datetime.now()
        
        if self.is_connected():
            try:
                # Update in MongoDB
                result = self.users.update_one(
                    {"_id": ObjectId(user_id)},
                    {"$set": update_data}
                )
                
                if result.modified_count > 0:
                    # Get updated user
                    return self.get_user_by_id(user_id)
                return None
            except:
                return None
        else:
            # Update in memory
            if user_id in self.users:
                self.users[user_id].update(update_data)
                return self.users[user_id]
            return None
    
    # Plan-related methods
    def create_plan(self, plan_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create a new plan in the database
        
        Args:
            plan_data (dict): Plan data
            
        Returns:
            dict: Created plan data with ID
        """
        # Add timestamps
        now = datetime.now()
        plan_data["created_at"] = now
        plan_data["updated_at"] = now
        
        # Convert time object to string if present
        if "scheduled_time" in plan_data and isinstance(plan_data["scheduled_time"], time):
            # Store as a string in HH:MM format
            plan_data["scheduled_time"] = plan_data["scheduled_time"].strftime("%H:%M")
        
        if self.is_connected():
            # Insert into MongoDB
            result = self.plans.insert_one(plan_data)
            plan_data["id"] = str(result.inserted_id)
            if "_id" in plan_data:
                del plan_data["_id"]
        else:
            # Store in memory
            plan_id = str(ObjectId())
            plan_data["id"] = plan_id
            
            user_id = plan_data.get("user_id")
            if user_id not in self.plans:
                self.plans[user_id] = []
            
            self.plans[user_id].append(plan_data)
        
        return plan_data
    
    def get_user_plans(self, user_id: str) -> List[Dict[str, Any]]:
        """
        Get plans for a user
        
        Args:
            user_id (str): User ID
            
        Returns:
            list: List of plan entries
        """
        if self.is_connected():
            plans = list(self.plans.find({"user_id": user_id}))
            # Convert ObjectId to string
            for plan in plans:
                plan["id"] = str(plan["_id"])
                del plan["_id"]
                
                # Convert scheduled_time string back to time object if it exists
                if "scheduled_time" in plan and isinstance(plan["scheduled_time"], str):
                    try:
                        hour, minute = map(int, plan["scheduled_time"].split(":"))
                        plan["scheduled_time"] = time(hour=hour, minute=minute)
                    except (ValueError, TypeError):
                        # If conversion fails, keep as string
                        pass
                        
            return plans
        else:
            # Return from memory
            return self.plans.get(user_id, [])
    
    def get_plan_by_id(self, plan_id: str) -> Optional[Dict[str, Any]]:
        """
        Get a plan by ID
        
        Args:
            plan_id (str): Plan ID
            
        Returns:
            dict: Plan data or None if not found
        """
        if self.is_connected():
            try:
                plan = self.plans.find_one({"_id": ObjectId(plan_id)})
                if plan:
                    plan["id"] = str(plan["_id"])
                    del plan["_id"]
                    
                    # Convert scheduled_time string back to time object if it exists
                    if "scheduled_time" in plan and isinstance(plan["scheduled_time"], str):
                        try:
                            hour, minute = map(int, plan["scheduled_time"].split(":"))
                            plan["scheduled_time"] = time(hour=hour, minute=minute)
                        except (ValueError, TypeError):
                            # If conversion fails, keep as string
                            pass
                            
                    return plan
                return None
            except:
                return None
        else:
            # Search in memory
            for user_plans in self.plans.values():
                for plan in user_plans:
                    if plan.get("id") == plan_id:
                        return plan
            return None
    
    def update_plan(self, plan_id: str, update_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Update a plan in the database
        
        Args:
            plan_id (str): Plan ID
            update_data (dict): Data to update
            
        Returns:
            dict: Updated plan data or None if plan not found
        """
        # Add updated timestamp
        update_data["updated_at"] = datetime.now()
        
        # Normalize scheduled_time to HH:MM string for storage if provided
        try:
            if "scheduled_time" in update_data and update_data["scheduled_time"] is not None:
                st = update_data["scheduled_time"]
                if isinstance(st, time):
                    update_data["scheduled_time"] = st.strftime("%H:%M")
                elif isinstance(st, str):
                    # Basic validation and normalization (HH:MM)
                    parts = st.split(":")
                    if len(parts) >= 2:
                        hour = int(parts[0])
                        minute = int(parts[1])
                        update_data["scheduled_time"] = f"{hour:02d}:{minute:02d}"
            # Ensure enums or other non-serializable types are converted to primitives
            if "status" in update_data and hasattr(update_data["status"], "value"):
                update_data["status"] = update_data["status"].value
        except Exception as _:
            # If normalization fails, drop scheduled_time to avoid corrupt data
            update_data.pop("scheduled_time", None)
        
        if self.is_connected():
            try:
                # Update in MongoDB
                result = self.plans.update_one(
                    {"_id": ObjectId(plan_id)},
                    {"$set": update_data}
                )
                
                if result.modified_count > 0:
                    # Get updated plan
                    return self.get_plan_by_id(plan_id)
                return None
            except:
                return None
        else:
            # Update in memory
            for user_plans in self.plans.values():
                for plan in user_plans:
                    if plan.get("id") == plan_id:
                        plan.update(update_data)
                        return plan
            return None
    
    def delete_plan(self, plan_id: str) -> bool:
        """
        Delete a plan from the database
        
        Args:
            plan_id (str): Plan ID
            
        Returns:
            bool: True if deleted, False otherwise
        """
        if self.is_connected():
            try:
                result = self.plans.delete_one({"_id": ObjectId(plan_id)})
                return result.deleted_count > 0
            except:
                return False
        else:
            # Delete from memory
            for user_id, user_plans in self.plans.items():
                for i, plan in enumerate(user_plans):
                    if plan.get("id") == plan_id:
                        user_plans.pop(i)
                        return True
            return False

# Initialize database
db = Database()

# Suggestion-related methods
def get_suggestions_for_mood_category(self, mood: str, category: str) -> List[str]:
    """
    Get suggestions for a specific mood and category
    
    Args:
        mood (str): The mood to get suggestions for
        category (str): The category to get suggestions for
        
    Returns:
        list: List of suggestions
    """
    try:
        # Try to find an exact match first
        if self.is_connected():
            suggestion = self.suggestions.find_one({"mood": mood, "category": category})
            if suggestion and suggestion.get("suggestions"):
                return suggestion.get("suggestions", [])
            
            # If no exact match, try similar moods
            similar_moods = {
                "happy": ["content", "neutral"],
                "content": ["happy", "neutral"],
                "neutral": ["content", "happy"],
                "sad": ["very_sad", "tired"],
                "very_sad": ["sad", "tired"],
                "tired": ["lazy", "neutral"],
                "lazy": ["tired", "neutral"],
                "stressed": ["tired", "angry"],
                "angry": ["stressed", "neutral"]
            }
            
            # Try similar moods if available
            similar = similar_moods.get(mood, ["neutral"])
            for similar_mood in similar:
                suggestion = self.suggestions.find_one({"mood": similar_mood, "category": category})
                if suggestion and suggestion.get("suggestions"):
                    return suggestion.get("suggestions", [])
            
            # If still not found, return default neutral suggestions for the category
            suggestion = self.suggestions.find_one({"mood": "neutral", "category": category})
            if suggestion:
                return suggestion.get("suggestions", [])
            
            # As a last resort, return generic suggestions
            return ["Let's take a small step forward today.",
                    "Break tasks into smaller, manageable parts.",
                    "Try focusing for just 10 minutes to start.",
                    "Remember your why - what motivates you?"]
        else:
            # Return from memory
            suggestions = self.suggestions.get(mood, {}).get(category, [])
            if suggestions:
                return suggestions
                
            # Try similar moods or neutral as fallback
            return self.suggestions.get("neutral", {}).get(category, [
                "Let's take a small step forward today.",
                "Break tasks into smaller, manageable parts.",
                "Try focusing for just 10 minutes to start.",
                "Remember your why - what motivates you?"
            ])
    except Exception as e:
        print(f"Error getting suggestions: {str(e)}")
        # Return default fallback suggestions
        return [
            "Let's take a small step forward today.",
            "Break tasks into smaller, manageable parts.",
            "Try focusing for just 10 minutes to start.",
            "Remember your why - what motivates you?"
        ]

def get_all_suggestions(self) -> Dict[str, Dict[str, List[str]]]:
    """
    Get all suggestions
    
    Returns:
        dict: Dictionary of suggestions by mood and category
    """
    if self.is_connected():
        suggestions = list(self.suggestions.find({}, {"_id": 0}))
        result = {}
        
        for suggestion in suggestions:
            mood = suggestion.get("mood")
            category = suggestion.get("category")
            suggestion_texts = suggestion.get("suggestions", [])
            
            if mood not in result:
                result[mood] = {}
                
            result[mood][category] = suggestion_texts
        
        return result
    else:
        # Return from memory
        return self.suggestions

def update_suggestions(self, mood: str, category: str, suggestions: List[str]) -> bool:
    """
    Update suggestions for a specific mood and category
    
    Args:
        mood (str): The mood to update suggestions for
        category (str): The category to update suggestions for
        suggestions (list): The new suggestions
        
    Returns:
        bool: True if updated successfully, False otherwise
    """
    if self.is_connected():
        result = self.suggestions.update_one(
            {"mood": mood, "category": category},
            {"$set": {
                "suggestions": suggestions,
                "updated_at": datetime.now()
            }},
            upsert=True
        )
        return result.modified_count > 0 or result.upserted_id is not None
    else:
        # Update in memory
        if mood not in self.suggestions:
            self.suggestions[mood] = {}
        
        self.suggestions[mood][category] = suggestions
        return True

# Subject-related methods
def get_subjects_for_category(self, category: str, user_id: Optional[str] = None) -> List[str]:
    """
    Get subjects for a specific category, including user-specific subjects if user_id is provided
    
    Args:
        category (str): The category to get subjects for
        user_id (str, optional): User ID to include user-specific subjects
        
    Returns:
        list: List of subjects
    """
    # Get default subjects
    default_subjects = []
    if self.is_connected():
        subject_entry = self.subjects.find_one({"category": category})
        if subject_entry:
            default_subjects = subject_entry.get("subjects", [])
    else:
        # Return from memory
        default_subjects = self.subjects.get(category, [])
    
    # If no user_id, return only default subjects
    if not user_id:
        return default_subjects
    
    # Get user-specific subjects
    user_subjects = []
    try:
        if self.is_connected():
            user_subject_entries = self.user_subjects.find({"user_id": user_id, "category": category})
            user_subjects = [entry.get("name") for entry in user_subject_entries]
        else:
            # From memory
            if user_id in self.user_subjects:
                user_subjects = [s.get("name") for s in self.user_subjects.get(user_id, []) 
                              if s.get("category") == category]
    except Exception as e:
        print(f"Error getting user subjects: {str(e)}")
    
    # Combine default and user-specific subjects
    all_subjects = list(set(default_subjects + user_subjects))
    return all_subjects

def get_all_subjects(self) -> Dict[str, List[str]]:
    """
    Get all subjects
    
    Returns:
        dict: Dictionary of subjects by category
    """
    if self.is_connected():
        subjects = list(self.subjects.find({}, {"_id": 0}))
        result = {}
        
        for subject_entry in subjects:
            category = subject_entry.get("category")
            subject_list = subject_entry.get("subjects", [])
            result[category] = subject_list
        
        return result
    else:
        # Return from memory
        return self.subjects

def update_subjects(self, category: str, subjects: List[str]) -> bool:
    """
    Update subjects for a specific category
    
    Args:
        category (str): The category to update subjects for
        subjects (list): The new subjects
        
    Returns:
        bool: True if updated successfully, False otherwise
    """
    if self.is_connected():
        result = self.subjects.update_one(
            {"category": category},
            {"$set": {
                "subjects": subjects,
                "updated_at": datetime.now()
            }},
            upsert=True
        )
        return result.modified_count > 0 or result.upserted_id is not None
    else:
        # Update in memory
        self.subjects[category] = subjects
        return True

# Add these methods to the Database class
Database.get_suggestions_for_mood_category = get_suggestions_for_mood_category
Database.get_all_suggestions = get_all_suggestions
Database.update_suggestions = update_suggestions
Database.get_subjects_for_category = get_subjects_for_category
Database.get_all_subjects = get_all_subjects
Database.update_subjects = update_subjects

# User Subjects CRUD operations
def create_user_subject(self, user_subject_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Create a new user subject in the database
    
    Args:
        user_subject_data (dict): User subject data
        
    Returns:
        dict: Created user subject data with ID
    """
    # Add timestamps
    now = datetime.now()
    user_subject_data["created_at"] = now
    user_subject_data["updated_at"] = now
    
    if self.is_connected():
        # Insert into MongoDB
        result = self.user_subjects.insert_one(user_subject_data)
        user_subject_data["id"] = str(result.inserted_id)
        if "_id" in user_subject_data:
            del user_subject_data["_id"]
    else:
        # Store in memory
        subject_id = str(ObjectId())
        user_subject_data["id"] = subject_id
        
        user_id = user_subject_data.get("user_id")
        if user_id not in self.user_subjects:
            self.user_subjects[user_id] = []
        
        self.user_subjects[user_id].append(user_subject_data)
    
    return user_subject_data

def get_user_subjects_by_category(self, user_id: str, category: str) -> List[Dict[str, Any]]:
    """
    Get user-specific subjects for a category
    
    Args:
        user_id (str): User ID
        category (str): Category name
        
    Returns:
        List[dict]: List of subject data
    """
    if self.is_connected():
        subjects = list(self.user_subjects.find({"user_id": user_id, "category": category}))
        for subject in subjects:
            subject["id"] = str(subject["_id"])
            del subject["_id"]
        return subjects
    else:
        # Get from memory
        if user_id not in self.user_subjects:
            return []
        
        return [s for s in self.user_subjects.get(user_id, []) if s.get("category") == category]

def get_user_subject_by_id(self, subject_id: str) -> Optional[Dict[str, Any]]:
    """
    Get a user subject by ID
    
    Args:
        subject_id (str): Subject ID
        
    Returns:
        dict: Subject data or None if not found
    """
    if self.is_connected():
        try:
            subject = self.user_subjects.find_one({"_id": ObjectId(subject_id)})
            if subject:
                subject["id"] = str(subject["_id"])
                del subject["_id"]
            return subject
        except:
            return None
    else:
        # Search in memory
        for user_id, subjects in self.user_subjects.items():
            for subject in subjects:
                if subject.get("id") == subject_id:
                    return subject
        return None

def update_user_subject(self, subject_id: str, update_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """
    Update a user subject
    
    Args:
        subject_id (str): Subject ID
        update_data (dict): Update data
        
    Returns:
        dict: Updated subject data or None if not found
    """
    update_data["updated_at"] = datetime.now()
    
    if self.is_connected():
        try:
            self.user_subjects.update_one(
                {"_id": ObjectId(subject_id)},
                {"$set": update_data}
            )
            return self.get_user_subject_by_id(subject_id)
        except:
            return None
    else:
        # Update in memory
        subject = self.get_user_subject_by_id(subject_id)
        if subject:
            for key, value in update_data.items():
                subject[key] = value
            return subject
        return None

def delete_user_subject(self, subject_id: str) -> bool:
    """
    Delete a user subject
    
    Args:
        subject_id (str): Subject ID
        
    Returns:
        bool: True if deleted, False otherwise
    """
    if self.is_connected():
        try:
            result = self.user_subjects.delete_one({"_id": ObjectId(subject_id)})
            return result.deleted_count > 0
        except:
            return False
    else:
        # Delete from memory
        for user_id, subjects in self.user_subjects.items():
            for i, subject in enumerate(subjects):
                if subject.get("id") == subject_id:
                    del self.user_subjects[user_id][i]
                    return True
        return False

# Register methods
Database.create_user_subject = create_user_subject
Database.get_user_subjects_by_category = get_user_subjects_by_category
Database.get_user_subject_by_id = get_user_subject_by_id
Database.update_user_subject = update_user_subject
Database.delete_user_subject = delete_user_subject

# Initialize database
db = Database()
