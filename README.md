# 🌸 MannMitra: A Sentiment-Aware AI for Productivity and Motivation

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

## 🚀 Running the Project

### 🔧 Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate   # or venv\Scripts\activate on Windows
pip install -r requirements.txt
python -m uvicorn main:app --reload
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
“How about turning this ordinary day into something special?"   
📝 Task: Revise OS unit 2  
🕒 Start at 7:00 PM?

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

## ❤️ Built By

Made by **Khushi Shah**  
Quotes sourced from public domain literature and cultural wisdom  

---

## 🌐 Tagline

> “MannMitra — Dil ko samajhne wala productivity planner.”
