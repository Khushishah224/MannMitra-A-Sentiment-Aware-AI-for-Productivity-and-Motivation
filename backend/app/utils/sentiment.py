from textblob import TextBlob
import re
from typing import Dict, Any, Optional, List, Tuple
import json
import os
import time
from functools import lru_cache
import requests

# ---------------------------------------------------------------------------
# Remote Hugging Face Inference API configuration (to avoid local heavy model)
# ---------------------------------------------------------------------------
# If you set HUGGINGFACE_API_TOKEN in your environment (.env), the code will
# prefer using the hosted Inference API instead of loading the local model.
# You can also force disable local loading with DISABLE_LOCAL_HF=1.

HF_API_TOKEN = os.getenv("HUGGINGFACE_API_TOKEN")
HF_MODEL_NAME = os.getenv("HF_EMOTION_MODEL", "cardiffnlp/twitter-roberta-base-emotion")
USE_REMOTE_HF = bool(HF_API_TOKEN)
DISABLE_LOCAL_HF = os.getenv("DISABLE_LOCAL_HF", "0").lower() in {"1", "true", "yes"}

# Import Hugging Face dependencies
try:
    from transformers import pipeline, AutoTokenizer, AutoModelForSequenceClassification
    HUGGINGFACE_AVAILABLE = True
except ImportError:
    print("Warning: Hugging Face transformers not available. Using fallback sentiment analysis.")
    HUGGINGFACE_AVAILABLE = False

# Define mood categories and their thresholds
MOOD_CATEGORIES = {
    # Polarity ranges from -1 (negative) to 1 (positive)
    # Subjectivity ranges from 0 (objective) to 1 (subjective)
    'happy': {'min_polarity': 0.5, 'max_polarity': 1.0},
    'content': {'min_polarity': 0.2, 'max_polarity': 0.5},
    'neutral': {'min_polarity': -0.2, 'max_polarity': 0.2},
    'sad': {'min_polarity': -0.5, 'max_polarity': -0.2},
    'very_sad': {'min_polarity': -1.0, 'max_polarity': -0.5},
}

# Keywords for different moods in multiple languages
MOOD_KEYWORDS = {
    'happy': {
        'english': ['happy', 'great', 'excellent', 'amazing', 'wonderful', 'excited', 'joy', 'delighted'],
        'hindi': ['खुश', 'प्रसन्न', 'आनंदित', 'खुशी', 'मज़ा'],
        'gujarati': ['ખુશ', 'આનંદ', 'સુખી', 'ખુશી']
    },
    'content': {
        'english': ['good', 'nice', 'fine', 'okay', 'satisfied', 'content'],
        'hindi': ['अच्छा', 'ठीक', 'संतुष्ट', 'संतोष'],
        'gujarati': ['સારું', 'ઠીક', 'સંતોષ']
    },
    'neutral': {
        'english': ['neutral', 'average', 'ok', 'alright'],
        'hindi': ['सामान्य', 'औसत'],
        'gujarati': ['સામાન્ય']
    },
    'tired': {
        'english': ['tired', 'exhausted', 'sleepy', 'fatigued'],
        'hindi': ['थका हुआ', 'थकान', 'नींद'],
        'gujarati': ['થાક', 'થાકેલા']
    },
    'lazy': {
        'english': ['lazy', 'unmotivated', 'procrastinating', 'bored'],
        'hindi': ['आलसी', 'सुस्त', 'बोर', 'मन नहीं'],
        'gujarati': ['આળસુ', 'કંટાળો']
    },
    'stressed': {
        'english': ['stressed', 'anxious', 'worried', 'tension', 'pressure'],
        'hindi': ['तनाव', 'चिंता', 'परेशान', 'टेंशन'],
        'gujarati': ['તણાવ', 'ચિંતા']
    },
    'sad': {
        'english': ['sad', 'unhappy', 'down', 'depressed', 'upset', 'miserable'],
        'hindi': ['दुखी', 'उदास', 'निराश', 'दुख'],
        'gujarati': ['દુઃખી', 'ઉદાસ', 'નિરાશ']
    },
    'very_sad': {
        'english': ['devastated', 'heartbroken', 'hopeless', 'despair'],
        'hindi': ['बहुत दुखी', 'टूटा हुआ', 'निराशा'],
        'gujarati': ['હતાશ', 'દુઃખી']
    },
    'angry': {
        'english': ['angry', 'annoyed', 'frustrated', 'mad', 'furious'],
        'hindi': ['गुस्सा', 'नाराज', 'क्रोधित'],
        'gujarati': ['ગુસ્સે', 'નારાજ']
    }
}

def analyze_sentiment(text, language='english'):
    """
    Analyze the sentiment of the given text and return the mood.
    
    Args:
        text (str): The text to analyze
        language (str): The language of the text (default: 'english')
        
    Returns:
        dict: Mood information with mood type, polarity, and subjectivity
    """
    # Convert to lowercase
    text = text.lower()
    
    # Check for direct keyword matches first
    for mood, lang_keywords in MOOD_KEYWORDS.items():
        if language in lang_keywords:
            for keyword in lang_keywords[language]:
                if keyword in text:
                    # Provide default values for polarity and subjectivity based on mood
                    if mood in ['happy', 'content']:
                        default_polarity = 0.7
                    elif mood in ['sad', 'very_sad']:
                        default_polarity = -0.7
                    elif mood in ['angry', 'stressed']:
                        default_polarity = -0.5
                    elif mood in ['tired', 'lazy']:
                        default_polarity = -0.3
                    else:
                        default_polarity = 0.0
                        
                    return {
                        'mood': mood,
                        'polarity': default_polarity,
                        'subjectivity': 0.5,  # Default middle value
                        'source': 'keyword'
                    }
    
    # If no keyword match, use TextBlob for sentiment analysis (works best for English)
    blob = TextBlob(text)
    polarity = blob.sentiment.polarity
    subjectivity = blob.sentiment.subjectivity
    
    # Determine mood based on polarity
    detected_mood = 'neutral'  # Default mood
    for mood, thresholds in MOOD_CATEGORIES.items():
        if thresholds['min_polarity'] <= polarity <= thresholds['max_polarity']:
            detected_mood = mood
            break
    
    # Additional rules for specific moods that aren't well-captured by polarity
    
    # Check for tired indicators
    tired_patterns = [r'tired', r'exhausted', r'no energy', r'sleepy', r'थका', r'थकान', r'नींद']
    if any(re.search(pattern, text) for pattern in tired_patterns):
        detected_mood = 'tired'
    
    # Check for lazy indicators
    lazy_patterns = [r'lazy', r'procrastinating', r'can\'t focus', r'distracted', r'आलसी', r'सुस्त', r'मन नहीं']
    if any(re.search(pattern, text) for pattern in lazy_patterns):
        detected_mood = 'lazy'
    
    # Check for stressed indicators
    stressed_patterns = [r'stress', r'anxious', r'worried', r'tension', r'pressure', r'exam', r'deadline', 
                        r'तनाव', r'चिंता', r'परेशान']
    if any(re.search(pattern, text) for pattern in stressed_patterns):
        detected_mood = 'stressed'
    
    return {
        'mood': detected_mood,
        'polarity': polarity,
        'subjectivity': subjectivity,
        'source': 'textblob'
    }

# ------------------- Sprint 3: Empathy Layer ------------------------ #

# Define mapping from HuggingFace emotion labels to our mood categories
EMOTION_TO_MOOD_MAPPING = {
    'joy': 'happy',
    'optimism': 'happy',
    'love': 'happy',
    'sadness': 'sad',
    'anger': 'angry',
    'fear': 'anxious',
    'surprise': 'neutral',
    'disgust': 'sad',
    'pessimism': 'sad',
    'anxiety': 'anxious',
    'neutral': 'neutral'
}

# Use LRU cache to avoid loading the model repeatedly
@lru_cache(maxsize=1)
def get_emotion_classifier():
    """Return a local transformers pipeline unless remote API is configured.

    If a Hugging Face API token is provided (or local loading disabled), we skip
    creating the heavy local model to avoid freezing low-resource machines.
    """
    # Prefer remote inference if configured
    if USE_REMOTE_HF or DISABLE_LOCAL_HF:
        if USE_REMOTE_HF:
            print("Using remote Hugging Face Inference API for emotion classification (no local model load).")
        else:
            print("Local Hugging Face model loading disabled via DISABLE_LOCAL_HF.")
        return None

    if not HUGGINGFACE_AVAILABLE:
        return None

    try:
        print("Loading local Hugging Face emotion classification model (this may take a while)...")
        start_time = time.time()
        classifier = pipeline(
            "text-classification",
            model=HF_MODEL_NAME,
            top_k=None  # returns all class scores
        )
        load_time = time.time() - start_time
        print(f"Local model loaded in {load_time:.2f} seconds")
        return classifier
    except Exception as e:
        print(f"Error loading local Hugging Face model: {str(e)}")
        return None


def _remote_emotion_inference(text: str) -> Optional[Dict[str, Any]]:
    """Call Hugging Face Inference API for emotion classification.

    Returns a list of label/score dicts matching local pipeline shape if successful.
    """
    if not USE_REMOTE_HF:
        return None
    try:
        url = f"https://api-inference.huggingface.co/models/{HF_MODEL_NAME}"
        headers = {"Authorization": f"Bearer {HF_API_TOKEN}"}
        payload = {"inputs": text, "options": {"wait_for_model": True}}
        resp = requests.post(url, headers=headers, json=payload, timeout=30)
        if resp.status_code == 503:
            # Model is loading on HF side; client can choose to retry later
            info = resp.json()
            print(f"Remote model loading (503). Estimated time: {info.get('estimated_time')}s")
            return None
        if resp.status_code != 200:
            print(f"Remote HF API error {resp.status_code}: {resp.text[:200]}")
            return None
        data = resp.json()
        # The API may return: [{"label":..., "score":...}, ...] or [[...]]
        if isinstance(data, list) and data and isinstance(data[0], list):
            data = data[0]
        if not isinstance(data, list):
            return None
        # Normalize structure to match local output shape
        return data
    except Exception as e:
        print(f"Remote HF inference failed: {e}")
        return None

# HuggingFace model emotion analyzer
def analyze_with_huggingface(text: str, use_huggingface: bool = True) -> Dict[str, Any]:
    """
    Analyze text with HuggingFace emotion detection model
    
    Args:
        text (str): Text to analyze
        use_huggingface (bool): Whether to use HuggingFace model (if False, falls back to TextBlob)
        
    Returns:
        dict: Analysis results with mood, emotion scores, etc.
    """
    # Attempt remote first if configured
    if use_huggingface and USE_REMOTE_HF:
        remote_scores = _remote_emotion_inference(text)
        if remote_scores:
            # remote_scores is list of {label, score}
            emotion_scores = remote_scores
            top_emotion = max(emotion_scores, key=lambda x: x['score'])
            emotion_label = top_emotion['label']
            mapped_mood, polarity = _map_emotion_to_mood_and_polarity(emotion_label)
            return {
                'mood': mapped_mood,
                'polarity': polarity,
                'emotion': emotion_label,
                'emotion_score': top_emotion['score'],
                'all_emotions': {item['label']: item['score'] for item in emotion_scores},
                'source': 'huggingface_remote'
            }
        # If remote failed, continue to possible local fallback

    # If HuggingFace not enabled OR disabled OR missing dependencies -> fallback
    if not use_huggingface or (not HUGGINGFACE_AVAILABLE and not USE_REMOTE_HF):
        return analyze_sentiment(text)

    try:
        classifier = get_emotion_classifier()
        if classifier is None:
            # Could be intentionally disabled; fallback
            return analyze_sentiment(text)

        emotion_scores = classifier(text)[0]
        top_emotion = max(emotion_scores, key=lambda x: x['score'])
        emotion_label = top_emotion['label']
        mapped_mood, polarity = _map_emotion_to_mood_and_polarity(emotion_label)
        return {
            'mood': mapped_mood,
            'polarity': polarity,
            'emotion': emotion_label,
            'emotion_score': top_emotion['score'],
            'all_emotions': {item['label']: item['score'] for item in emotion_scores},
            'source': 'huggingface_local'
        }
    except Exception as e:
        print(f"HuggingFace processing error: {e}")
        return analyze_sentiment(text)


def _map_emotion_to_mood_and_polarity(emotion_label: str) -> Tuple[str, float]:
    """Helper to map an emotion label to (mood, polarity)."""
    mapped_mood = EMOTION_TO_MOOD_MAPPING.get(emotion_label, 'neutral')
    polarity_map = {
        'joy': 0.8,
        'optimism': 0.6,
        'love': 0.7,
        'sadness': -0.7,
        'anger': -0.6,
        'fear': -0.5,
        'surprise': 0.1,
        'disgust': -0.7,
        'pessimism': -0.6,
        'anxiety': -0.5,
        'neutral': 0
    }
    return mapped_mood, polarity_map.get(emotion_label, 0)

# Sprint 3: Empathetic response templates based on mood
def get_empathetic_response(mood: str) -> str:
    """
    Get an empathetic response template based on the detected mood
    
    Args:
        mood: Detected mood type
        
    Returns:
        Empathetic response template
    """
    templates = {
        "happy": [
            "That's wonderful! Your positive energy is inspiring.",
            "I'm so glad you're feeling good! Let's channel that energy into something productive.",
            "It's great to hear you're in high spirits! Here's a plan to make the most of it:"
        ],
        "content": [
            "You seem to be in a good place right now. Let's maintain that balance.",
            "Feeling content is a great state to be in. Let's build on that.",
            "A content mind is fertile ground for productivity. Here's what I suggest:"
        ],
        "sad": [
            "I understand you're feeling down. Remember that it's okay to not be okay sometimes.",
            "I'm here for you. Small steps can help when you're feeling low.",
            "When we're feeling sad, sometimes a gentle activity can help. Maybe try:"
        ],
        "very_sad": [
            "I'm sorry you're feeling so down. Let's focus on some small, manageable steps.",
            "When things feel really difficult, even tiny progress matters. Let's start with something simple:",
            "It's okay to just focus on self-care when you're feeling this way. Perhaps consider:"
        ],
        "angry": [
            "I can see you're frustrated. Let's find a constructive way to channel that energy.",
            "It sounds like you're dealing with some intense emotions. Here's a plan that might help:",
            "When feeling angry, it can help to focus on something productive. Consider:"
        ],
        "anxious": [
            "I understand anxiety can be challenging. Let's break things down into smaller steps.",
            "When feeling anxious, it often helps to focus on what you can control. Here's a thought:",
            "Taking a few moments for yourself can help manage stress. Maybe try:"
        ],
        "stressed": [
            "I notice you're feeling stressed. Let's reset and find some balance.",
            "Stress can be overwhelming. Taking a pause might help. Consider:",
            "When you're feeling pressured, remember to breathe. Here's a simple plan:"
        ],
        "tired": [
            "It sounds like you need some rest. Let's focus on energy conservation.",
            "When you're tired, it's important to be gentle with yourself. Consider:",
            "Even when tired, small achievements can feel rewarding. Maybe try:"
        ],
        "lazy": [
            "Sometimes we all need a little extra motivation. Let's start with something small.",
            "Even a small step forward can build momentum. How about:",
            "Let's find something engaging that might spark your interest:"
        ],
        "neutral": [
            "Here's what I suggest for your day:",
            "I've put together a plan that might work well for you:",
            "Consider this approach for your tasks today:"
        ]
    }
    
    # Default to neutral if mood not found
    mood_templates = templates.get(mood, templates["neutral"])
    
    # Return a random template from the mood's list
    import random
    return random.choice(mood_templates)
