# 🌸 MannMitra: A Sentiment-Aware AI for Productivity and Motivation (Aug 2025)

> _"Dil ki sunta hai MannMitra. Kabhi shayari mein, kabhi plan ke saath."_ 

## 🧠 Current Core Features Overview

### 👤 User Authentication
- Secure login and registration using JWT
- MongoDB integration for user data storage
- Language preference storage

### 📊 Mood → Motivation → Micro‑Plan Flow
1. Enter mood text → `/moods/analyze` (Transformer + TextBlob fallback) → normalized mood & empathetic line.
2. Receive contextual motivational quote (language + mood aware).
3. Choose category, subject (defaults + custom merge), duration, optional start time.
4. Backend returns preview plan (not stored) → Accept creates plan.

### 📝 Planner & Scheduling
- Create tasks (title, description, category, duration, optional start time)
- Inline edit / start / complete / cancel / snooze (+1m..+1h) / reschedule
- Conflict detection + offer chain shift or next free slot
- Auto‑rescheduler shifts missed tasks forward (≈1h, 75% duration) resolving conflicts
- 30s reminder loop triggers toast + system Notification (if permission)
- Filter by status & category; animated responsive task grid

### 🧭 Decision Helper (Fuzzy Logic)
- `/decision` compares two options (e.g., Study vs Rest)
- Extracts time_pressure, fatigue, importance from context + mood
- Fuzzy membership + rules → defuzzify decision score & confidence
- Heuristic fallback when scikit‑fuzzy unavailable

### 📱 UI/UX Enhancements
- Sidebar + main panel layout, Framer Motion transitions
- Tailwind glass/gradient badges, card animations
- Paginated mood history entries + gradient chart (Recharts)
- Multi‑language (EN / HI / GU)

---

## 🔍 Overview

**MannMitra** is an AI-powered, multilingual productivity assistant that listens to your thoughts, understands your **emotions**, and gives back **contextual motivation**, **quotes**, and **micro-plans** — in your language and tone.

It’s not just a chatbot. It’s a _mood-sensitive_ productivity buddy.

---

## 💡 Feature Mapping & Technologies
| # | Feature | Backend / Frontend Tech | Notes |
|---|---------|-------------------------|-------|
| 1 | Auth (JWT + cookie) | FastAPI auth, python-jose, bcrypt, React Context | Header + HttpOnly cookie; `/auth/me` reads both. |
| 2 | Multi-language UI | strings.js, UserContext | Stored preference, dynamic labels. |
| 3 | Emotion analysis | HuggingFace RoBERTa + TextBlob fallback | Normalizes to internal mood taxonomy. |
| 4 | Empathetic response | Sentiment templates | Adds supportive line to UI. |
| 5 | Motivational quotes | quotes.json + response_picker | Mood + language selection with fallback. |
| 6 | Plan preview vs create | `/suggestions/personalized-plan` | Prevents premature DB writes. |
| 7 | Custom subjects CRUD | `/user-subjects` + SubjectSelector | Merge defaults + user-defined. |
| 8 | Task planner board | PlannerPage + TaskList + Framer Motion | Animated grid, filters, inline edit. |
| 9 | Conflict detection | timeConflicts utils + backend 409 | Suggests next slot or chain shift. |
|10 | Chain shift resolution | computeChainShifts/applyChainShifts | Cascade schedule shift. |
|11 | Snooze & status updates | Snooze endpoint + TaskList actions | Unified snooze button w/ hidden select. |
|12 | Reminder & notifications | 30s interval + Notification API | Lead minutes & scheduled alerts. |
|13 | Auto-rescheduler | Async loop (5 min) in `main.py` | Moves stale tasks, reduces duration, resolves conflicts. |
|14 | Mood history & chart | History page + Recharts | Pagination + gradient line. |
|15 | Decision helper | scikit-fuzzy + heuristics | Explainable fuzzy inference. |
|16 | UI polish / accessibility | Tailwind, semantic structure | Consistent spacing & contrast. |

---

## 📦 Updated Tech Stack
| Layer | Technologies |
|-------|-------------|
| Frontend | React + Vite, Tailwind CSS, Framer Motion, Axios, Recharts, React Hot Toast, React Icons |
| Backend | FastAPI, Pydantic, Uvicorn, dotenv |
| NLP / Emotion | HuggingFace transformer (RoBERTa emotion), TextBlob fallback |
| Decision AI | scikit-fuzzy (fuzzy inference) + heuristic fallback |
| Scheduling | Async background auto-rescheduler + conflict utilities |
| Data | MongoDB (optional) + in-memory fallback, JSON seed data |
| Auth | JWT (python-jose), bcrypt, HttpOnly cookie support |
| State | React Context, localStorage |
| i18n | Manual string tables (EN/HI/GU) |
| Visualization | Recharts |
| Notifications | Web Notifications API + toast |

---

## 📁 Project Structure (Condensed)

```
MannMitra/
├── backend/
│   ├── app/
│   │   ├── models/               # Pydantic models for API schemas
│   │   │   ├── mood.py           # Mood data models
│   │   │   ├── plan.py           # Planner models
│   │   │   ├── suggestion.py     # Suggestion models
│   │   │   ├── token.py          # Authentication token models
│   │   │   ├── user.py           # User models
│   │   │   └── user_subject.py   # Custom subject models
│   │   ├── routes/
│   │   │   ├── auth.py           # Authentication routes
│   │   │   ├── history.py        # Mood history tracking
│   │   │   ├── mood.py           # Mood analysis
│   │   │   ├── moods.py          # Mood tracking routes
│   │   │   ├── planner.py        # Planner routes
│   │   │   ├── plans.py          # CRUD for plans
│   │   │   ├── quote.py          # Motivational quotes
│   │   │   ├── suggestions.py    # Mood-based suggestions
│   │   │   └── user_subjects.py  # Custom subject management
│   │   └── utils/
│   │       ├── database.py       # MongoDB integration
│   │       ├── defaultdata.py    # Default data seeding
│   │       ├── response_picker.py # Choose quote by mood/lang
│   │       ├── security.py       # JWT authentication
│   │       └── sentiment.py      # Sentiment analysis logic
│   ├── data/
│   │   └── quotes.json           # Multilingual quotes database
│   └── main.py                   # FastAPI app runner
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── api/                  # API client integration
│   │   │   ├── auth.js           # Authentication APIs
│   │   │   ├── index.js          # Unified API client with interceptors
│   │   │   └── userSubjects.js   # User subjects API
│   │   ├── assets/               # Static assets
│   │   ├── components/           # UI components
│   │   │   ├── Auth/             # Authentication components
│   │   │   ├── AssistantChat.jsx # Chat-like assistant wrapper
│   │   │   ├── MoodBadge.jsx     # Mood visualization
│   │   │   ├── MoodHistoryChart.jsx # Mood trends visualization
│   │   │   ├── MoodInput.jsx     # Mood input component
│   │   │   ├── TaskList.jsx      # Task list with actions
│   │   │   └── SubjectSelector.jsx # Subject selection chips
│   │   ├── context/              # React context providers
│   │   │   ├── AuthContext.jsx   # Authentication state
│   │   │   └── UserContext.jsx   # User preferences
│   │   ├── i18n/                 # Internationalization
│   │   │   └── strings.js        # Multilingual strings
│   │   ├── pages/                # Application pages
│   │   │   ├── Auth/             # Login/Register pages
│   │   │   ├── HistoryPage.jsx   # Mood history/insights
│   │   │   ├── HomePage.jsx      # Main assistant page
│   │   │   ├── PlannerPage.jsx   # Task planner
│   │   │   └── ProfilePage.jsx   # User profile
│   │   ├── utils/                # Utility functions
│   │   ├── App.jsx               # Main component
│   │   └── main.jsx              # Entry point
│   ├── index.html
│   └── vite.config.js
│
├── ENHANCEMENTS.md               # Enhancement roadmap
├── IMPLEMENTATION_SUMMARY.md     # Implementation details
├── README.md                     # Project documentation
└── RUNNING.md                    # Setup instructions
```

---

## 🚀 Running the Project

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

## 🧠 Sample Motivation Conversation

**User:** "I'm feeling useless and tired right now."  
**MannMitra:**  
“Thak gaye ho? Chalo 15 mins ke liye OS revise karein. Kal ka hero banoge.”  
📝 Task: Revise OS unit 2  
🕒 Start at 7:00 PM?

---

## 🧪 Key API Endpoints (Abbreviated)
| Method | Route | Purpose |
|--------|-------|---------|
| POST | /moods/analyze | Emotion detection + empathetic response |
| GET | /quote | Quote by mood + language |
| POST | /suggestions/personalized-plan | Non-persisted plan preview |
| POST | /plans | Create plan after accept |
| POST | /plans/{id}/snooze | Shift scheduled time forward |
| POST | /plans/{id}/reminder | Set lead minutes |
| POST | /decision | Fuzzy decision helper |
| GET | /history | Mood history (authed) |

---

## 📊 Example Moods & Outputs

| Input                                 | Detected Mood | Response Type             |
|--------------------------------------|---------------|---------------------------|
| "Bas man nahi lag raha"              | Lazy          | Planner + Motivation      |
| "Feeling anxious about exam"         | Stressed      | Encouragement + Plan      |
| "Aaj toh sab sahi jaa raha hai!"     | Happy         | Motivational quote        |
| "Nothing matters anymore..."         | Sad           | Emotional support line    |

---

## 🔮 Future Enhancements (Shortlist)

- 🎙️ Voice input (speech-to-text)
- 🗣️ Text-to-speech motivation
- 📱 Mobile app (React Native)
- 👨‍👩‍👧 Peer emotion comparison (mock dataset)
- 🔐 Auth with user dashboard
- ⏰ WhatsApp/Email planner reminders
- 🇮🇳 More Indian languages (Marathi, Tamil, etc.)

---

## 🤔 ANN vs Fuzzy Logic
We integrate a **pre‑trained Transformer (ANN)** only for emotion classification; **no custom ANN training** occurs here. Decision support intentionally uses **fuzzy logic** for interpretability.

### Fuzzy Logic Flow
1. Parse context → derive numeric factors (time_pressure, fatigue, importance).
2. Map factors to membership sets (low / medium / high) via triangular functions.
3. Apply rule base (e.g., high time_pressure & high importance ⇒ favor work option).
4. Aggregate & defuzzify (0–10 score). <5 leans Option 1, >5 Option 2, ≈5 balanced.
5. Compute confidence = distance from midpoint; generate factor breakdown & advice.
6. Fallback heuristics when scikit-fuzzy unavailable (weighted scoring + templates).

## 🎓 Viva & Evaluation Quick Answers

| Question                     | Sample Answer                                                                                     |
|-----------------------------|----------------------------------------------------------------------------------------------------|
| What problem does it solve? | Motivation dips, laziness, and emotional slumps among students and professionals                  |
| What is unique?             | Indian tone, Hinglish support, culturally rooted emotional motivation and productivity planning    |
| What AI techniques are used?| Transformer-based emotion classification, fuzzy logic decision inference, heuristic fallback rules, rule-assisted micro-planning |
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