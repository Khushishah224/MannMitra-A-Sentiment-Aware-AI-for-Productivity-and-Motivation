from textblob import TextBlob
import re

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
