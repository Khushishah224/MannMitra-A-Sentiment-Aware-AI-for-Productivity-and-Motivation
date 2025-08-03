import random
import json
import os
from typing import Dict, List

# Path to the quotes file
QUOTES_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'data', 'quotes.json')

# Memory to prevent repeating quotes in the same session
quote_memory = set()

def load_quotes():
    """
    Load quotes from JSON file
    
    Returns:
        dict: Dictionary of quotes by mood and language
    """
    try:
        if os.path.exists(QUOTES_FILE):
            with open(QUOTES_FILE, 'r', encoding='utf-8') as file:
                return json.load(file)
        else:
            # Return default quotes if file doesn't exist
            return get_default_quotes()
    except Exception as e:
        print(f"Error loading quotes: {e}")
        return get_default_quotes()

def get_default_quotes():
    """
    Get default quotes in case the file is not available
    
    Returns:
        dict: Dictionary of default quotes by mood and language
    """
    return {
        "happy": {
            "english": [
                "Keep that smile going! It's your superpower!",
                "Happiness looks gorgeous on you!",
                "Your positive energy is contagious!",
                "Today is your day, make it count!",
                "When you're happy, you make the world happier!"
            ],
            "hindi": [
                "मुस्कुराते रहो! आपकी हंसी आपकी सबसे बड़ी ताकत है!",
                "खुशी आप पर बहुत अच्छी लगती है!",
                "आपकी सकारात्मक ऊर्जा छूत की तरह फैलती है!",
                "आज आपका दिन है, इसे यादगार बनाएं!",
                "जब आप खुश होते हैं, तो पूरी दुनिया को खुश कर देते हैं!"
            ],
            "gujarati": [
                "તમારું સ્મિત ચાલુ રાખો! તે તમારી સુપરપાવર છે!",
                "ખુશી તમને ખૂબ સુંદર લાગે છે!",
                "તમારી સકારાત્મક ઊર્જા ચેપી છે!",
                "આજે તમારો દિવસ છે, તેને મહત્વપૂર્ણ બનાવો!",
                "જ્યારે તમે ખુશ હોવ, ત્યારે તમે વિશ્વને વધુ ખુશ બનાવો છો!"
            ]
        },
        "content": {
            "english": [
                "Contentment is a state of peaceful happiness. You've got it!",
                "Being satisfied with what you have is a beautiful state of mind.",
                "Appreciate this moment of balance and peace.",
                "You're in a good place. Build on this feeling!",
                "This calm contentment is perfect for deep work."
            ],
            "hindi": [
                "संतोष एक शांतिपूर्ण खुशी की स्थिति है। आप इसे महसूस कर रहे हैं!",
                "जो आपके पास है उससे संतुष्ट होना एक सुंदर मानसिकता है।",
                "इस संतुलन और शांति के क्षण की सराहना करें।",
                "आप एक अच्छी स्थिति में हैं। इस भावना पर निर्माण करें!",
                "यह शांत संतोष गहरे काम के लिए एकदम सही है।"
            ],
            "gujarati": [
                "સંતોષ એ શાંતિપૂર્ણ ખુશીની સ્થિતિ છે. તમે તે મેળવી લીધું છે!",
                "તમારી પાસે જે છે તેનાથી સંતુષ્ટ થવું એ એક સુંદર માનસિક સ્થિતિ છે.",
                "સંતુલન અને શાંતિની આ ક્ષણની કદર કરો.",
                "તમે સારી જગ્યાએ છો. આ લાગણી પર નિર્માણ કરો!",
                "આ શાંત સંતોષ ઊંડા કામ માટે સંપૂર્ણ છે."
            ]
        },
        "neutral": {
            "english": [
                "Let's make today a bit brighter, shall we?",
                "How about turning this ordinary day into something special?",
                "Every moment is an opportunity. What would you like to do with this one?",
                "Sometimes neutral is the perfect place to start something amazing.",
                "A blank canvas - what colors would you like to add today?"
            ],
            "hindi": [
                "आइए आज को थोड़ा उज्जवल बनाएं, क्या कहते हैं?",
                "क्यों न इस साधारण दिन को कुछ खास में बदल दें?",
                "हर क्षण एक अवसर है। आप इसके साथ क्या करना चाहेंगे?",
                "कभी-कभी तटस्थ होना ही किसी अद्भुत चीज़ की शुरुआत के लिए सही जगह होती है।",
                "एक खाली कैनवास - आज आप किन रंगों को जोड़ना चाहेंगे?"
            ],
            "gujarati": [
                "ચાલો આજે થોડું વધુ ઉજ્જવળ બનાવીએ, બરાબર?",
                "આ સામાન્ય દિવસને કંઈક ખાસ બનાવવા વિશે શું?",
                "દરેક ક્ષણ એક તક છે. તમે આની સાથે શું કરવા માંગો છો?",
                "ક્યારેક તટસ્થ એ કંઈક અદ્ભુત શરૂ કરવાની સંપૂર્ણ જગ્યા છે.",
                "એક ખાલી કેનવાસ - આજે તમે કયા રંગો ઉમેરવા માંગો છો?"
            ]
        },
        "tired": {
            "english": [
                "Rest is not laziness; it's essential maintenance.",
                "A short break now can mean better productivity later.",
                "Your body is telling you something. Listen to it.",
                "Even machines need downtime. Take that break you deserve.",
                "Sometimes the most productive thing you can do is rest."
            ],
            "hindi": [
                "आराम आलस्य नहीं है; यह आवश्यक मरम्मत है।",
                "अभी थोड़ा ब्रेक लेना बाद में बेहतर उत्पादकता का मतलब हो सकता है।",
                "आपका शरीर आपसे कुछ कह रहा है। इसे सुनें।",
                "यहां तक कि मशीनों को भी डाउनटाइम की आवश्यकता होती है। वह ब्रेक लें जिसके आप हकदार हैं।",
                "कभी-कभी आप जो सबसे उत्पादक काम कर सकते हैं वह है आराम करना।"
            ],
            "gujarati": [
                "આરામ આળસ નથી; તે આવશ્યક જાળવણી છે.",
                "હવે થોડો બ્રેક લેવાનો અર્થ પછીથી વધુ સારી ઉત્પાદકતા થઈ શકે છે.",
                "તમારું શરીર તમને કંઈક કહી રહ્યું છે. તેને સાંભળો.",
                "મશીનોને પણ ડાઉનટાઇમની જરૂર હોય છે. તમે જે બ્રેક માટે લાયક છો તે લો.",
                "ક્યારેક તમે કરી શકો છો તે સૌથી વધુ ઉત્પાદક વસ્તુ આરામ છે."
            ]
        },
        "lazy": {
            "english": [
                "Start with just 5 minutes. You'll be surprised where it leads.",
                "Break down your task into tiny steps. Which one feels doable?",
                "Sometimes motivation follows action, not the other way around.",
                "What's the smallest possible step you could take right now?",
                "Don't think about the whole mountain, just take the first step."
            ],
            "hindi": [
                "बस 5 मिनट से शुरू करें। आप हैरान होंगे कि यह कहां तक ले जाएगा।",
                "अपने काम को छोटे-छोटे चरणों में बांटें। कौन सा करने लायक लगता है?",
                "कभी-कभी प्रेरणा क्रिया का अनुसरण करती है, इसके विपरीत नहीं।",
                "सबसे छोटा संभव कदम क्या है जो आप अभी उठा सकते हैं?",
                "पूरे पहाड़ के बारे में मत सोचो, बस पहला कदम उठाओ।"
            ],
            "gujarati": [
                "ફક્ત 5 મિનિટથી શરૂ કરો. તમને નવાઈ લાગશે કે તે ક્યાં દોરી જાય છે.",
                "તમારા કાર્યને નાના પગલાંમાં વિભાજિત કરો. કયું એક શક્ય લાગે છે?",
                "ક્યારેક પ્રેરણા ક્રિયાને અનુસરે છે, તેનાથી વિપરીત નહીં.",
                "સૌથી નાનું શક્ય પગલું શું છે જે તમે અત્યારે લઈ શકો છો?",
                "સમગ્ર પર્વત વિશે વિચારશો નહીં, ફક્ત પહેલું પગલું લો."
            ]
        },
        "stressed": {
            "english": [
                "Breathe in for 4, hold for 4, out for 4. Repeat.",
                "This moment of stress will pass. You've overcome challenges before.",
                "One thing at a time. What's the most important thing right now?",
                "You're stronger than you think. This pressure is temporary.",
                "When everything feels overwhelming, focus on just the next small step."
            ],
            "hindi": [
                "4 के लिए सांस लें, 4 के लिए रोकें, 4 के लिए बाहर निकालें। दोहराएं।",
                "तनाव का यह क्षण बीत जाएगा। आपने पहले भी चुनौतियों पर काबू पाया है।",
                "एक समय में एक चीज़। अभी सबसे महत्वपूर्ण क्या है?",
                "आप जितना सोचते हैं उससे अधिक मजबूत हैं। यह दबाव अस्थायी है।",
                "जब सब कुछ अभिभूत महसूस होता है, तो बस अगले छोटे कदम पर ध्यान दें।"
            ],
            "gujarati": [
                "4 માટે શ્વાસ લો, 4 માટે પકડો, 4 માટે બહાર. પુનરાવર્તન કરો.",
                "તણાવનો આ ક્ષણ પસાર થઈ જશે. તમે પહેલા પણ પડકારો પર કાબૂ મેળવ્યો છે.",
                "એક સમયે એક વસ્તુ. અત્યારે સૌથી મહત્વપૂર્ણ શું છે?",
                "તમે વિચારો છો તેના કરતાં તમે વધુ મજબૂત છો. આ દબાણ કામચલાઉ છે.",
                "જ્યારે બધું જ ભારે લાગે છે, ત્યારે ફક્ત આગલા નાના પગલા પર ધ્યાન કેન્દ્રિત કરો."
            ]
        },
        "sad": {
            "english": [
                "It's okay to feel sad. Your feelings are valid.",
                "This cloud will pass. There's always light waiting.",
                "Small steps. Be gentle with yourself today.",
                "Sometimes the bravest thing is just to make it through the day.",
                "You're not alone in this feeling. We all have these moments."
            ],
            "hindi": [
                "उदास महसूस करना ठीक है। आपकी भावनाएँ वैध हैं।",
                "यह बादल गुज़र जाएगा। हमेशा रौशनी इंतजार कर रही है।",
                "छोटे कदम। आज अपने साथ कोमल रहें।",
                "कभी-कभी सबसे बहादुर बात बस दिन के माध्यम से यह बनाना है।",
                "आप इस भावना में अकेले नहीं हैं। हम सभी के पास ये क्षण हैं।"
            ],
            "gujarati": [
                "ઉદાસ લાગવું સામાન્ય છે. તમારી લાગણીઓ માન્ય છે.",
                "આ વાદળ પસાર થશે. હંમેશા પ્રકાશ રાહ જોઈ રહ્યો છે.",
                "નાના પગલાં. આજે તમારી જાત સાથે નરમાશથી વર્તો.",
                "ક્યારેક સૌથી બહાદુર વસ્તુ ફક્ત દિવસ પસાર કરવાની હોય છે.",
                "તમે આ લાગણીમાં એકલા નથી. આપણે બધા પાસે આવા ક્ષણો છે."
            ]
        },
        "very_sad": {
            "english": [
                "In the deepest darkness, even a small light makes a difference.",
                "This pain is real, but it won't last forever.",
                "One breath at a time. That's all you need to focus on right now.",
                "Some days we just need to be kind to ourselves and wait for tomorrow.",
                "Reaching out for help is not weakness; it's courage."
            ],
            "hindi": [
                "सबसे गहरे अंधकार में, एक छोटी रोशनी भी फर्क करती है।",
                "यह दर्द वास्तविक है, लेकिन यह हमेशा के लिए नहीं रहेगा।",
                "एक समय में एक सांस। अभी आपको बस इतने पर ध्यान देने की जरूरत है।",
                "कुछ दिन हमें बस अपने आप पर दयालु होने और कल का इंतजार करने की जरूरत होती है।",
                "मदद मांगना कमजोरी नहीं है; यह साहस है।"
            ],
            "gujarati": [
                "સૌથી ઊંડા અંધકારમાં, નાનો પ્રકાશ પણ ફરક પાડે છે.",
                "આ પીડા વાસ્તવિક છે, પરંતુ તે કાયમ માટે ટકશે નહીં.",
                "એક સમયે એક શ્વાસ. એ જ તમારે અત્યારે ધ્યાન કેન્દ્રિત કરવાની જરૂર છે.",
                "કેટલાક દિવસો આપણે ફક્ત આપણી જાત પ્રત્યે દયાળુ બનવાની અને આવતીકાલની રાહ જોવાની જરૂર છે.",
                "મદદ માંગવી એ નબળાઈ નથી; તે હિંમત છે."
            ]
        },
        "angry": {
            "english": [
                "Anger is just energy. How can you channel it constructively?",
                "Take a moment before responding. Your future self will thank you.",
                "It's okay to feel angry. It's what you do with it that matters.",
                "Count to ten and take deep breaths. Give your thinking brain time to catch up.",
                "Sometimes anger shows us what matters to us. What's this telling you?"
            ],
            "hindi": [
                "क्रोध सिर्फ ऊर्जा है। आप इसे रचनात्मक रूप से कैसे चैनल कर सकते हैं?",
                "प्रतिक्रिया देने से पहले एक पल लें। आपका भविष्य का स्वयं आपको धन्यवाद देगा।",
                "क्रोध महसूस करना ठीक है। मायने रखता है कि आप इसके साथ क्या करते हैं।",
                "दस तक गिनें और गहरी सांसें लें। अपने सोचने वाले दिमाग को पकड़ने का समय दें।",
                "कभी-कभी क्रोध हमें दिखाता है कि हमारे लिए क्या मायने रखता है। यह आपको क्या बता रहा है?"
            ],
            "gujarati": [
                "ગુસ્સો ફક્ત ઊર્જા છે. તમે તેને રચનાત્મક રીતે કેવી રીતે ચેનલ કરી શકો છો?",
                "જવાબ આપતા પહેલા એક ક્ષણ લો. તમારું ભવિષ્યનું સ્વ તમારો આભાર માનશે.",
                "ગુસ્સે થવું સામાન્ય છે. તમે તેની સાથે શું કરો છો તે મહત્વનું છે.",
                "દસ સુધી ગણો અને ઊંડા શ્વાસ લો. તમારા વિચારશીલ મગજને પકડવા માટે સમય આપો.",
                "ક્યારેક ગુસ્સો આપણને બતાવે છે કે આપણને શું મહત્ત્વનું છે. આ તમને શું કહી રહ્યું છે?"
            ]
        }
    }

def get_quote(mood, language='english'):
    """
    Get a quote based on mood and language
    
    Args:
        mood (str): The mood to get a quote for
        language (str): The language to get a quote in
        
    Returns:
        str: A motivational quote
    """
    quotes = load_quotes()
    
    # If mood not found, default to neutral
    if mood not in quotes:
        mood = 'neutral'
    
    # If language not found, default to English
    if language not in quotes[mood]:
        language = 'english'
    
    # Get quotes for the specified mood and language
    mood_quotes = quotes[mood][language]
    
    # If all quotes have been seen, reset memory
    if len(quote_memory) >= len(mood_quotes):
        quote_memory.clear()
    
    # Find quotes that haven't been seen
    available_quotes = [q for q in mood_quotes if q not in quote_memory]
    
    # If no available quotes, use any quote
    if not available_quotes:
        available_quotes = mood_quotes
    
    # Select a random quote
    quote = random.choice(available_quotes)
    
    # Add to memory
    quote_memory.add(quote)
    
    return quote
