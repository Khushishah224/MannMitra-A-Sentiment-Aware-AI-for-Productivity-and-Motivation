from typing import Dict, List, Any
import os
import json
from datetime import datetime
from app.utils.database import db

# Default quotes are already in the quotes.json file
# We'll add a function to load them into the database

# Default suggestions data - matching user moods with task suggestions
DEFAULT_SUGGESTIONS = {
    "happy": {
        "study": [
            "Channel that positive energy into mastering a challenging concept for {duration} minutes!",
            "Your good mood is perfect for tackling that difficult {subject} chapter.",
            "Set an ambitious {duration}-minute goal to solve advanced problems.",
            "Help a classmate with their studies - teaching reinforces your own learning!"
        ],
        "work": [
            "Use this positive energy to tackle your most challenging work task.",
            "Great time to brainstorm new ideas for {duration} minutes.",
            "Your creativity is at its peak - try solving that complex problem at work.",
            "Schedule important meetings today - your positive energy will be infectious!"
        ],
        "personal": [
            "Your happy mood is perfect for planning something exciting.",
            "Connect with friends or family - share your positive energy!",
            "Try something new today while your confidence is high.",
            "Set ambitious personal goals while your motivation is strong."
        ]
    },
    "content": {
        "study": [
            "This balanced mood is perfect for steady, focused study.",
            "Organize your {subject} notes for {duration} minutes.",
            "Review what you've learned so far in {subject}.",
            "Create a study plan for the next week while you're thinking clearly."
        ],
        "work": [
            "Great time to catch up on routine tasks that need attention.",
            "Organize your workspace or digital files for {duration} minutes.",
            "Review your progress on current projects.",
            "Plan your work calendar for the upcoming week."
        ],
        "personal": [
            "Take some time to reflect on your recent achievements.",
            "Update your personal goals and check your progress.",
            "Organize something that's been needing attention.",
            "Reach out to someone you haven't connected with recently."
        ]
    },
    "neutral": {
        "study": [
            "Let's turn this ordinary day into productive study time.",
            "Try a new study technique for the next {duration} minutes.",
            "Create flashcards for {subject} key concepts.",
            "Quiz yourself on {subject} fundamentals."
        ],
        "work": [
            "A neutral mood is great for systematic work tasks.",
            "Tackle your to-do list methodically for {duration} minutes.",
            "Clear out your email inbox or organize digital files.",
            "Document your current project progress."
        ],
        "personal": [
            "How about exploring a new hobby for {duration} minutes?",
            "Take a walk outside to refresh your perspective.",
            "Listen to an interesting podcast or audiobook.",
            "Try mindfulness meditation for a few minutes."
        ]
    },
    "tired": {
        "study": [
            "Even when tired, just 10 minutes of gentle review helps.",
            "Listen to an educational podcast about {subject} instead of reading.",
            "Try standing up while studying {subject} for {duration} minutes.",
            "Review visual materials like diagrams or videos for {subject}."
        ],
        "work": [
            "Focus on simple tasks that don't require intense concentration.",
            "Take a 10-minute power nap before tackling your next task.",
            "Try the 'pomodoro technique': work for 25 minutes, then break for 5.",
            "Switch to a different type of work task to refresh your mind."
        ],
        "personal": [
            "Rest is productive too. Take a short break to recharge.",
            "Try some gentle stretching to increase your energy.",
            "Hydrate and have a healthy snack to boost your energy.",
            "Go for a short walk outside to wake up your body and mind."
        ]
    },
    "lazy": {
        "study": [
            "Start with just 5 minutes. You'll likely continue once you begin.",
            "Break down {subject} into tiny steps. Which one feels doable?",
            "Set a timer for just {duration} minutes to review {subject}.",
            "Choose the easiest topic from {subject} to start with."
        ],
        "work": [
            "Pick the smallest, easiest task on your list to build momentum.",
            "Set a timer for just 10 minutes of focused work.",
            "Reward yourself after completing one small task.",
            "Change your environment - even moving to a different seat can help."
        ],
        "personal": [
            "Sometimes 'lazy' days are your body's way of saying you need rest.",
            "Choose one tiny goal to accomplish today.",
            "Put on upbeat music to increase your energy level.",
            "Do one small thing that makes you feel accomplished."
        ]
    },
    "stressed": {
        "study": [
            "Break {subject} into the smallest possible chunks and tackle one.",
            "Focus on understanding (not memorizing) one key concept.",
            "Create a clear {duration}-minute plan for your next study session.",
            "Practice deep breathing for 2 minutes, then study {subject} for 10."
        ],
        "work": [
            "Write down all your tasks to get them out of your head.",
            "Focus on one small task you can complete in {duration} minutes.",
            "Take 5 minutes to organize your workspace before starting.",
            "Schedule worry time: set aside 10 minutes later to think about stressors."
        ],
        "personal": [
            "Try a 5-minute breathing exercise to reduce stress.",
            "Write down what's causing your stress, then one action you can take.",
            "Step outside for fresh air before tackling your next task.",
            "Connect with someone supportive for a quick chat."
        ]
    },
    "sad": {
        "study": [
            "A gentle {duration}-minute review of your favorite topic.",
            "Try studying outdoors or near a window for natural light.",
            "Listen to upbeat music while reviewing for {duration} minutes.",
            "Pair up with a friend for a short study session."
        ],
        "work": [
            "Focus on tasks that don't require high creativity today.",
            "Take regular short breaks to practice self-care.",
            "Set a small, achievable work goal for the next hour.",
            "Add something enjoyable to your workspace, like a plant or photo."
        ],
        "personal": [
            "Be kind to yourself today - sadness is a normal human emotion.",
            "Try a short activity that usually brings you joy.",
            "Connect with someone who lifts your spirits.",
            "Spend {duration} minutes in nature or sunlight if possible."
        ]
    },
    "very_sad": {
        "study": [
            "Even 5 minutes of light review is an achievement today.",
            "Choose the subject you enjoy most for a brief session.",
            "Try studying with calming background sounds.",
            "Remember that focusing on something else can help lift your mood."
        ],
        "work": [
            "Focus on simple, routine tasks that don't require much emotional energy.",
            "Take breaks when needed - your wellbeing comes first.",
            "Consider reaching out to a colleague or supervisor if you need support.",
            "Set very small goals for today and celebrate completing them."
        ],
        "personal": [
            "Consider reaching out to a supportive friend or mental health resource.",
            "Practice self-compassion - treat yourself with the kindness you'd show a friend.",
            "Try a gentle activity like walking or stretching.",
            "Remember that this feeling will pass with time."
        ]
    },
    "angry": {
        "study": [
            "Channel that energy into focused review for {duration} minutes.",
            "Try physical activity for 5 minutes before studying to release tension.",
            "Write out your thoughts before studying to clear your mind.",
            "Focus on subjects that require problem-solving rather than memorization."
        ],
        "work": [
            "Take a short break to cool down before important communications.",
            "Focus on analytical tasks that can use your heightened focus.",
            "Write emails but save as drafts to review later.",
            "Use physical activity like a brisk walk during your break."
        ],
        "personal": [
            "Try physical activity to release the tension.",
            "Write down your thoughts to process your emotions.",
            "Practice deep breathing or count to ten before responding to situations.",
            "Step away from triggering situations temporarily if possible."
        ]
    }
}

# Default users for easy testing and login
DEFAULT_USERS = [
    {
        "full_name": "Khushi Shah",
        "email": "khushi@example.com",
        "password": "password123",
        "language_preference": "english"
    },
    {
        "full_name": "Jayesh Patel",
        "email": "jayesh@example.com",
        "password": "password123",
        "language_preference": "gujarati"
    },
    {
        "full_name": "Sangita Sharma",
        "email": "sangita@example.com",
        "password": "password123", 
        "language_preference": "hindi"
    },
    {
        "full_name": "Amit Kumar",
        "email": "amit@example.com",
        "password": "password123",
        "language_preference": "english"
    }
]

# Default categories and subjects
DEFAULT_CATEGORIES = ["study", "work", "personal"]

DEFAULT_SUBJECTS = {
    "study": [
        "Mathematics", "Science", "History", "Literature", "Computer Science", 
        "Physics", "Chemistry", "Biology", "Economics", "Psychology",
        "Geography", "Languages", "Art", "Music", "Engineering"
    ],
    "work": [
        "Emails", "Reports", "Presentations", "Meetings", "Planning",
        "Analysis", "Research", "Design", "Documentation", "Collaboration",
        "Communication", "Project Management", "Customer Service"
    ],
    "personal": [
        "Health", "Fitness", "Relationships", "Hobbies", "Finances",
        "Home Organization", "Self-care", "Learning", "Reading", "Travel Planning"
    ]
}

def insert_default_quotes():
    """
    Load quotes from the quotes.json file and insert them into the database
    """
    quotes_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'data', 'quotes.json')
    
    try:
        with open(quotes_path, 'r', encoding='utf-8') as file:
            quotes_data = json.load(file)
        
        # Save quotes to database
        db.save_quotes(quotes_data)
        print("Default quotes inserted successfully")
        return True
    except Exception as e:
        print(f"Error inserting default quotes: {str(e)}")
        return False

def insert_default_suggestions():
    """
    Insert default suggestions into the database
    """
    try:
        # Format for database insertion
        suggestion_entries = []
        
        for mood, categories in DEFAULT_SUGGESTIONS.items():
            for category, suggestions in categories.items():
                suggestion_entries.append({
                    "mood": mood,
                    "category": category,
                    "suggestions": suggestions,
                    "created_at": datetime.now(),
                    "updated_at": datetime.now()
                })
        
        # Save to database
        if db.is_connected():
            # Clear existing suggestions first
            db.db.suggestions.delete_many({})
            if suggestion_entries:
                db.db.suggestions.insert_many(suggestion_entries)
            print("Default suggestions inserted successfully")
        else:
            # Store in memory
            db.suggestions = {}
            for entry in suggestion_entries:
                mood = entry["mood"]
                category = entry["category"]
                if mood not in db.suggestions:
                    db.suggestions[mood] = {}
                db.suggestions[mood][category] = entry["suggestions"]
            print("Default suggestions stored in memory")
        
        return True
    except Exception as e:
        print(f"Error inserting default suggestions: {str(e)}")
        return False

def insert_default_subjects():
    """
    Insert default subjects into the database
    """
    try:
        # Format for database insertion
        subject_entries = []
        
        for category, subjects in DEFAULT_SUBJECTS.items():
            subject_entries.append({
                "category": category,
                "subjects": subjects,
                "created_at": datetime.now(),
                "updated_at": datetime.now()
            })
        
        # Save to database
        if db.is_connected():
            # Clear existing subjects first
            db.db.subjects.delete_many({})
            if subject_entries:
                db.db.subjects.insert_many(subject_entries)
            print("Default subjects inserted successfully")
        else:
            # Store in memory
            db.subjects = DEFAULT_SUBJECTS
            print("Default subjects stored in memory")
        
        return True
    except Exception as e:
        print(f"Error inserting default subjects: {str(e)}")
        return False

def insert_default_users():
    """
    Insert default users into the database
    """
    try:
        from app.utils.security import get_password_hash
        
        # Format for database insertion with hashed passwords
        user_entries = []
        
        for user_data in DEFAULT_USERS:
            # Hash the password
            hashed_password = get_password_hash(user_data["password"])
            
            # Create user entry
            user_entries.append({
                "full_name": user_data["full_name"],
                "email": user_data["email"],
                "hashed_password": hashed_password,
                "language_preference": user_data.get("language_preference", "english"),
                "created_at": datetime.now(),
                "updated_at": datetime.now()
            })
        
        # Save to database
        if db.is_connected():
            # Check if users already exist
            for user in user_entries:
                existing_user = db.users.find_one({"email": user["email"]})
                if not existing_user:
                    db.users.insert_one(user)
            
            print("Default users inserted successfully")
        else:
            # Store in memory
            for user in user_entries:
                email = user["email"]
                # Check if user already exists
                user_exists = False
                for existing_user in db.users.values():
                    if isinstance(existing_user, dict) and existing_user.get("email") == email:
                        user_exists = True
                        break
                
                if not user_exists:
                    user_id = str(datetime.now().timestamp())
                    user["id"] = user_id
                    db.users[user_id] = user
            
            print("Default users stored in memory")
        
        return True
    except Exception as e:
        print(f"Error inserting default users: {str(e)}")
        return False

def insert_all_defaults():
    """
    Insert all default data into the database
    """
    success = True
    
    print("Inserting default data...")
    if not insert_default_quotes():
        success = False
    
    if not insert_default_suggestions():
        success = False
    
    if not insert_default_subjects():
        success = False
    
    if not insert_default_users():
        success = False
    
    return success
