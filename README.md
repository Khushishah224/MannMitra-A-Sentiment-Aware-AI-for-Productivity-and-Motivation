# 🌸 MannMitra: A Sentiment-Aware AI for Productivity and Motivation

> _"Dil ki sunta hai MannMitra. Kabhi shayari mein, kabhi plan ke saath."_  
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
cd mannmitra/backend
python -m venv venv
source venv/bin/activate   # or venv\Scripts\activate on Windows
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### 🌐 Frontend Setup

```bash
cd mannmitra/frontend
npm install
npm run dev  # or npm start
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