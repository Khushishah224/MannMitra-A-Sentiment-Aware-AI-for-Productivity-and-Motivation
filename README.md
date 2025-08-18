# 🌸 MannMitra: A Sentiment-Aware AI for Productivity and Motivation

> _"Dil ki sunta hai MannMitra. Kabhi shayari mein, kabhi plan ke saath."_ 

## 🧠 Enhanced Features

### 👤 User Authentication
- Secure login and registration using JWT
- MongoDB integration for user data storage
- Language preference storage

### 📊 Mood Detection Flow
1. Step 1: "How are you feeling today?" - Share your mood
2. Step 2: Receive a contextual motivational quote
3. Step 3: Choose what you want to focus on
4. Step 4: Get a personalized micro-plan

### 📝 CRUD Planner Features
- Create custom tasks with title, description, duration
- Categorize tasks by subject or type (study, work, personal)
- Edit, delete, and mark tasks as completed
- Filter tasks by status and category

### 📱 Improved UI/UX
- Clean, responsive design
- Animated transitions using Framer Motion
- Toast notifications for feedback
- Mobile-optimized interfaceari mein, kabhi plan ke saath."_  
> Your Desi emotional companion — now with a micro-planner.

---

## 🔍 Overview

**MannMitra** is an AI-powered, multilingual productivity assistant that listens to your thoughts, understands your **emotions**, and gives back **contextual motivation**, **quotes**, and **micro-plans** — in your language and tone.

It’s not just a chatbot. It’s a _mood-sensitive_ productivity buddy.

---

## 💡 Key Features

| Feature                            | Description                                                                 |
|------------------------------------|-----------------------------------------------------------------------------|
| 🧠 Sentiment Analysis              | Understands user mood via text input (sad, happy, stressed, lazy, etc.)    |
| 💬 Motivational Response Engine    | Sends quotes, desi lines, or shayari matched to your emotion               |
| 📆 Micro-Planner                   | Suggests quick, doable study/work tasks for low-motivation moods           |
| 🌐 Multilingual Support            | English, Hindi, and Gujarati (more soon)                                   |
| 🧠 Culture-aware Conversations     | Uses Hinglish, Indian idioms, proverbs, and cinema influence               |
| 🧾 Quote Memory                    | Avoids repeating same quote in same session                                |
| 📊 Mood History Tracking (optional)| Track your productivity/emotion graph                                      |

---

## 📦 Tech Stack

| Layer     | Technology Used             |
|-----------|-----------------------------|
| Frontend  | React.js, Tailwind CSS       |
| Backend   | FastAPI (Python)             |
| NLP       | TextBlob, custom rules       |
| DB        | MongoDB (Quotes + Mood logs) |
| Auth      | Optional - JWT or sessions   |
| Hosting   | Vercel (frontend), Render/Railway (backend) |

---

## 📁 Project Structure

```
mannmitra/
├── backend/
│   ├── app/
│   │   ├── main.py               # FastAPI app runner
│   │   ├── routes/
│   │   │   ├── mood.py           # Analyze mood
│   │   │   ├── planner.py        # Micro-planner
│   │   │   ├── quote.py          # Send quotes
│   │   └── utils/
│   │       └── sentiment.py      # Sentiment logic
│   │       └── response_picker.py# Choose quote by mood/lang
│   └── data/
│       └── sample_quotes.json
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/           # UI elements
│   │   ├── pages/                # Home, Planner, History
│   │   ├── api/                  # Axios/FETCH for backend
│   │   └── App.jsx
│
└── README.md
```

---

## 🚀 How to Run the Project

### 🔧 Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate   # or venv\Scripts\activate on Windows
pip install -r requirements.txt
uvicorn main:app --reload
```

The database will be automatically initialized with default data when the application starts.

#### Default Users for Testing

The system includes pre-configured user accounts for easy testing:

| Name | Email | Password | Language |
|------|-------|----------|----------|
| Khushi Shah | khushi@example.com | password123 | English |
| Jayesh Patel | jayesh@example.com | password123 | Gujarati |
| Sangita Sharma | sangita@example.com | password123 | Hindi |
| Amit Kumar | amit@example.com | password123 | English |

### 🌐 Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### 📦 MongoDB Setup (Optional)

For persistent data storage, you can set up MongoDB:

1. Install MongoDB Community Edition on your system
2. Create a `.env` file in the backend directory with:
```
MONGODB_URI=mongodb://localhost:27017/mannmitra
JWT_SECRET_KEY=your-secret-key-here
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

---

## 🧠 Sample Conversation

**User:** "I'm feeling useless and tired right now."  
**MannMitra:**  
“Thak gaye ho? Chalo 15 mins ke liye OS revise karein. Kal ka hero banoge.”  
📝 Task: Revise OS unit 2  
🕒 Start at 7:00 PM?

---

## 🧪 Sample API Routes

| Method | Route             | Purpose                        |
|--------|-------------------|--------------------------------|
| POST   | `/analyze`        | Detect sentiment/emotion       |
| GET    | `/quote`          | Get quote based on mood/lang   |
| POST   | `/plan`           | Micro-task suggestion          |
| GET    | `/history/{id}`   | (Optional) Mood history        |

---

## 📊 Example Moods & Outputs

| Input                                 | Detected Mood | Response Type             |
|--------------------------------------|---------------|---------------------------|
| "Bas man nahi lag raha"              | Lazy          | Planner + Motivation      |
| "Feeling anxious about exam"         | Stressed      | Encouragement + Plan      |
| "Aaj toh sab sahi jaa raha hai!"     | Happy         | Motivational quote        |
| "Nothing matters anymore..."         | Sad           | Emotional support line    |

---

## 🔮 Future Enhancements

- 🎙️ Voice input (speech-to-text)
- 🗣️ Text-to-speech motivation
- 📱 Mobile app (React Native)
- 👨‍👩‍👧 Peer emotion comparison (mock dataset)
- 🔐 Auth with user dashboard
- ⏰ WhatsApp/Email planner reminders
- 🇮🇳 More Indian languages (Marathi, Tamil, etc.)

---

## 🎓 Viva & Evaluation Ready

| Question                     | Sample Answer                                                                                     |
|-----------------------------|----------------------------------------------------------------------------------------------------|
| What problem does it solve? | Motivation dips, laziness, and emotional slumps among students and professionals                  |
| What is unique?             | Indian tone, Hinglish support, culturally rooted emotional motivation and productivity planning    |
| What AI techniques are used?| NLP, Sentiment Analysis (TextBlob), Rule-based micro-planning, multilingual context mapping       |
| Any dataset used?           | No large datasets — quotes stored in curated JSON, emotions detected via NLP                     |
| Expandability?              | Yes — modular APIs, new languages, more moods/tasks can be added easily                           |

---

## ❤️ Built By

Made by **Khushi Shah**  
Mentored & Guided by OpenAI ChatGPT  
Quotes sourced from public domain literature and cultural wisdom  

---

## 🌐 Tagline

> “MannMitra — Dil ko samajhne wala productivity planner.”