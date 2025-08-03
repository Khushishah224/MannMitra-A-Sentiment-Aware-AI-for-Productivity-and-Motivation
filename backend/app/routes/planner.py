from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Optional, List
import random
from datetime import datetime, timedelta

router = APIRouter(
    prefix="/plan",
    tags=["planner"],
    responses={404: {"description": "Not found"}},
)

class PlanInput(BaseModel):
    mood: str
    language: str = "english"
    context: Optional[str] = None
    duration_minutes: Optional[int] = 20  # Default 20-minute plan

class PlanTask(BaseModel):
    task: str
    duration_minutes: int
    start_time: Optional[str] = None  # "HH:MM" format

class PlanResponse(BaseModel):
    plan_text: str
    tasks: List[PlanTask]
    mood: str
    language: str

# Task templates by mood
TASK_TEMPLATES = {
    "tired": {
        "english": [
            "Take a {duration}-minute power nap",
            "Do {duration} minutes of light stretching",
            "Review {subject} notes for {duration} minutes",
            "Take a {duration}-minute break, then revise one important concept from {subject}",
            "Listen to a {duration}-minute educational podcast on {subject}"
        ],
        "hindi": [
            "{duration} मिनट का पावर नैप लें",
            "{duration} मिनट हल्की स्ट्रेचिंग करें",
            "{duration} मिनट के लिए {subject} के नोट्स का अध्ययन करें",
            "{duration} मिनट का ब्रेक लें, फिर {subject} से एक महत्वपूर्ण कॉन्सेप्ट रिवाइज़ करें",
            "{subject} पर {duration} मिनट का एजुकेशनल पॉडकास्ट सुनें"
        ],
        "gujarati": [
            "{duration} મિનિટની પાવર નેપ લો",
            "{duration} મિનિટ હળવું સ્ટ્રેચિંગ કરો",
            "{duration} મિનિટ માટે {subject} નોટ્સની સમીક્ષા કરો",
            "{duration} મિનિટનો બ્રેક લો, પછી {subject} માંથી એક મહત્વપૂર્ણ કોન્સેપ્ટ રિવાઇઝ કરો",
            "{subject} પર {duration} મિનિટનો શૈક્ષણિક પોડકાસ્ટ સાંભળો"
        ]
    },
    "lazy": {
        "english": [
            "Set a timer for just {duration} minutes to revise {subject}",
            "Use the Pomodoro technique: {duration} minutes on {subject}, then a 5-minute break",
            "Complete just one small section of {subject} in {duration} minutes",
            "Pick the easiest concept from {subject} and master it in {duration} minutes",
            "Create a mind map for {subject} in {duration} minutes"
        ],
        "hindi": [
            "सिर्फ {duration} मिनट के लिए {subject} को रिवाइज़ करने के लिए टाइमर सेट करें",
            "पोमोडोरो तकनीक का उपयोग करें: {subject} पर {duration} मिनट, फिर 5 मिनट का ब्रेक",
            "{subject} का सिर्फ एक छोटा सेक्शन {duration} मिनट में पूरा करें",
            "{subject} से सबसे आसान कॉन्सेप्ट चुनें और उसे {duration} मिनट में मास्टर करें",
            "{duration} मिनट में {subject} के लिए माइंड मैप बनाएं"
        ],
        "gujarati": [
            "ફક્ત {duration} મિનિટ માટે {subject} ને રિવાઇઝ કરવા માટે ટાઇમર સેટ કરો",
            "પોમોડોરો તકનીકનો ઉપયોગ કરો: {subject} પર {duration} મિનિટ, પછી 5 મિનિટનો બ્રેક",
            "{subject} નો ફક્ત એક નાનો વિભાગ {duration} મિનિટમાં પૂર્ણ કરો",
            "{subject} માંથી સૌથી સરળ કોન્સેપ્ટ પસંદ કરો અને તેને {duration} મિનિટમાં માસ્ટર કરો",
            "{duration} મિનિટમાં {subject} માટે માઇન્ડ મેપ બનાવો"
        ]
    },
    "sad": {
        "english": [
            "A gentle {duration}-minute review of your favorite topic from {subject}",
            "Try {duration} minutes of studying {subject} outdoors or near a window",
            "Listen to upbeat music while reviewing {subject} for {duration} minutes",
            "Pair up with a friend (in person or virtually) for a {duration}-minute study session on {subject}",
            "Combine {duration} minutes of {subject} review with your favorite drink/snack"
        ],
        "hindi": [
            "{subject} से अपने पसंदीदा टॉपिक का {duration} मिनट का सौम्य अध्ययन",
            "बाहर या खिड़की के पास {duration} मिनट के लिए {subject} का अध्ययन करें",
            "अपबीट म्यूजिक सुनते हुए {duration} मिनट के लिए {subject} रिव्यू करें",
            "किसी दोस्त के साथ (व्यक्तिगत रूप से या वर्चुअली) {subject} पर {duration} मिनट का स्टडी सेशन करें",
            "{subject} के {duration} मिनट के रिव्यू को अपने पसंदीदा पेय/स्नैक के साथ जोड़ें"
        ],
        "gujarati": [
            "{subject} માંથી તમારા મનપસંદ વિષય નો {duration} મિનિટનો નરમ અભ્યાસ",
            "બહાર અથવા બારી પાસે {duration} મિનિટ માટે {subject} નો અભ્યાસ કરવાનો પ્રયાસ કરો",
            "ઉત્સાહજનક સંગીત સાંભળતા {duration} મિનિટ માટે {subject} ની સમીક્ષા કરો",
            "મિત્ર સાથે (રૂબરૂ અથવા વર્ચ્યુઅલી) {subject} પર {duration} મિનિટનું અભ્યાસ સત્ર કરો",
            "{subject} ના {duration} મિનિટના રિવ્યુને તમારા મનપસંદ પીણાં/નાસ્તા સાથે જોડો"
        ]
    },
    "stressed": {
        "english": [
            "Break down {subject} into the smallest possible chunks and tackle one for {duration} minutes",
            "Focus on understanding (not memorizing) one key concept from {subject} for {duration} minutes",
            "Create a clear {duration}-minute plan for studying {subject} before your exam",
            "Spend {duration} minutes organizing your {subject} notes to reduce exam anxiety",
            "Practice {duration} minutes of previous year questions on {subject}"
        ],
        "hindi": [
            "{subject} को छोटे-छोटे हिस्सों में बांटें और {duration} मिनट के लिए एक पर काम करें",
            "{duration} मिनट के लिए {subject} से एक प्रमुख अवधारणा को समझने (याद करने नहीं) पर ध्यान दें",
            "परीक्षा से पहले {subject} का अध्ययन करने के लिए एक स्पष्ट {duration}-मिनट की योजना बनाएं",
            "परीक्षा की चिंता कम करने के लिए अपने {subject} नोट्स को व्यवस्थित करने के लिए {duration} मिनट बिताएं",
            "{subject} पर पिछले साल के प्रश्नों का {duration} मिनट अभ्यास करें"
        ],
        "gujarati": [
            "{subject} ને શક્ય તેટલા નાના ટુકડાઓમાં વિભાજિત કરો અને {duration} મિનિટ માટે એક પર કામ કરો",
            "{duration} મિનિટ માટે {subject} માંથી એક મુખ્ય કોન્સેપ્ટને સમજવા (યાદ રાખવા નહીં) પર ધ્યાન કેન્દ્રિત કરો",
            "પરીક્ષા પહેલા {subject} નો અભ્યાસ કરવા માટે સ્પષ્ટ {duration}-મિનિટની યોજના બનાવો",
            "પરીક્ષાની ચિંતા ઘટાડવા માટે તમારી {subject} નોટ્સને વ્યવસ્થિત કરવા માટે {duration} મિનિટ ખર્ચો",
            "{subject} પર પાછલા વર્ષના પ્રશ્નોનો {duration} મિનિટનો અભ્યાસ કરો"
        ]
    },
    "happy": {
        "english": [
            "Channel that positive energy into mastering a challenging concept in {subject} for {duration} minutes",
            "Help a classmate with {subject} for {duration} minutes - teaching reinforces learning!",
            "Create a {duration}-minute video or audio explaining a complex {subject} topic",
            "Set an ambitious {duration}-minute goal to solve advanced problems in {subject}",
            "Use your good mood for {duration} minutes of creative learning approaches to {subject}"
        ],
        "hindi": [
            "उस सकारात्मक ऊर्जा को {subject} में एक चुनौतीपूर्ण अवधारणा को मास्टर करने में {duration} मिनट के लिए चैनल करें",
            "{duration} मिनट के लिए किसी क्लासमेट की {subject} में मदद करें - सिखाना सीखने को मजबूत करता है!",
            "एक जटिल {subject} टॉपिक को समझाने के लिए {duration} मिनट का वीडियो या ऑडियो बनाएं",
            "{subject} में उन्नत समस्याओं को हल करने के लिए एक महत्वाकांक्षी {duration}-मिनट का लक्ष्य सेट करें",
            "अपने अच्छे मूड का उपयोग {subject} के लिए {duration} मिनट के रचनात्मक लर्निंग अप्रोच के लिए करें"
        ],
        "gujarati": [
            "તે સકારાત્મક ઊર્જાને {subject} માં એક પડકારજનક કોન્સેપ્ટને માસ્ટર કરવા માટે {duration} મિનિટ માટે ચેનલ કરો",
            "{duration} મિનિટ માટે કોઈ વર્ગમિત્રને {subject} માં મદદ કરો - શિક્ષણ શીખવાને મજબૂત બનાવે છે!",
            "જટિલ {subject} વિષયને સમજાવવા માટે {duration} મિનિટનો વિડિયો અથવા ઓડિયો બનાવો",
            "{subject} માં અદ્યતન સમસ્યાઓ હલ કરવા માટે મહત્વાકાંક્ષી {duration}-મિનિટનું લક્ષ્ય સેટ કરો",
            "તમારા સારા મૂડનો ઉપયોગ {subject} માટે {duration} મિનિટના સર્જનાત્મક શીખવાના અભિગમ માટે કરો"
        ]
    },
    "neutral": {
        "english": [
            "Review {subject} for {duration} minutes with a clear goal in mind",
            "Create a {duration}-minute study plan for {subject} that includes breaks",
            "Try a new study technique for {subject} for the next {duration} minutes",
            "Spend {duration} minutes organizing your {subject} notes or creating flashcards",
            "Practice {duration} minutes of active recall on key {subject} concepts"
        ],
        "hindi": [
            "एक स्पष्ट लक्ष्य को ध्यान में रखते हुए {duration} मिनट के लिए {subject} की समीक्षा करें",
            "{subject} के लिए {duration} मिनट की अध्ययन योजना बनाएं जिसमें ब्रेक शामिल हों",
            "अगले {duration} मिनट के लिए {subject} के लिए एक नई अध्ययन तकनीक आजमाएं",
            "अपने {subject} नोट्स को व्यवस्थित करने या फ्लैशकार्ड बनाने में {duration} मिनट बिताएं",
            "प्रमुख {subject} अवधारणाओं पर {duration} मिनट के सक्रिय रिकॉल का अभ्यास करें"
        ],
        "gujarati": [
            "સ્પષ્ટ લક્ષ્યને ધ્યાનમાં રાખીને {duration} મિનિટ માટે {subject} ની સમીક્ષા કરો",
            "{subject} માટે {duration} મિનિટની અભ્યાસ યોજના બનાવો જેમાં બ્રેક શામેલ હોય",
            "આગામી {duration} મિનિટ માટે {subject} માટે નવી અભ્યાસ તકનીક અજમાવો",
            "તમારી {subject} નોટ્સ વ્યવસ્થિત કરવા અથવા ફ્લેશકાર્ડ્સ બનાવવા માટે {duration} મિનિટ ખર્ચો",
            "મુખ્ય {subject} કોન્સેપ્ટ્સ પર {duration} મિનિટના સક્રિય સ્મરણનો અભ્યાસ કરો"
        ]
    }
}

# Common subjects for study tasks
SUBJECTS = {
    "english": ["Math", "Science", "History", "English", "Computer Science", "Physics", "Chemistry", 
                "Biology", "Geography", "Economics", "Psychology", "Statistics", "Programming", 
                "Database Design", "Operating Systems", "Networks"],
    "hindi": ["गणित", "विज्ञान", "इतिहास", "अंग्रेजी", "कंप्यूटर साइंस", "भौतिकी", "रसायन विज्ञान", 
              "जीव विज्ञान", "भूगोल", "अर्थशास्त्र", "मनोविज्ञान", "सांख्यिकी", "प्रोग्रामिंग", 
              "डेटाबेस डिजाइन", "ऑपरेटिंग सिस्टम", "नेटवर्क"],
    "gujarati": ["ગણિત", "વિજ્ઞાન", "ઇતિહાસ", "અંગ્રેજી", "કમ્પ્યુટર સાયન્સ", "ભૌતિકશાસ્ત્ર", "રસાયણશાસ્ત્ર", 
                  "જીવવિજ્ઞાન", "ભૂગોળ", "અર્થશાસ્ત્ર", "મનોવિજ્ઞાન", "આંકડાશાસ્ત્ર", "પ્રોગ્રામિંગ", 
                  "ડેટાબેઝ ડિઝાઇન", "ઓપરેટિંગ સિસ્ટમ", "નેટવર્ક્સ"]
}

# Intro templates for different moods
INTRO_TEMPLATES = {
    "tired": {
        "english": ["I can see you're tired. Let's start with something small but valuable.", 
                   "Energy low? No problem. Here's a gentle plan that won't drain you further.",
                   "When you're tired, small steps are still progress. Try this:"],
        "hindi": ["मैं देख सकता हूं कि आप थके हुए हैं। आइए कुछ छोटे लेकिन मूल्यवान से शुरू करें।", 
                  "एनर्जी कम है? कोई बात नहीं। यहां एक सौम्य योजना है जो आपको और अधिक थका नहीं देगी।",
                  "जब आप थके हुए हों, तो छोटे कदम भी प्रगति होते हैं। यह आज़माएँ:"],
        "gujarati": ["હું જોઈ શકું છું કે તમે થાકેલા છો. ચાલો કંઈક નાનું પણ મૂલ્યવાન શરૂ કરીએ.", 
                     "ઊર્જા ઓછી? કોઈ વાંધો નહીં. અહીં એક સૌમ્ય યોજના છે જે તમને વધુ થકવશે નહીં.",
                     "જ્યારે તમે થાકેલા હો, ત્યારે નાના પગલાં પણ પ્રગતિ છે. આ પ્રયાસ કરો:"]
    },
    "lazy": {
        "english": ["Feeling a bit lazy? No judgment here! Let's make it easy to start.", 
                    "When motivation is low, start super small. Here's how:",
                    "The hardest part is starting. So let's make that part tiny:"],
        "hindi": ["थोड़ा आलसी महसूस कर रहे हैं? यहां कोई फैसला नहीं! आइए इसे शुरू करना आसान बनाते हैं।", 
                  "जब प्रेरणा कम हो, तो बहुत छोटे से शुरू करें। यहां बताया गया है कि कैसे:",
                  "सबसे कठिन हिस्सा शुरू करना है। तो आइए उस हिस्से को छोटा बनाते हैं:"],
        "gujarati": ["થોડા આળસુ લાગી રહ્યા છો? અહીં કોઈ ચુકાદો નથી! ચાલો શરૂ કરવાનું સરળ બનાવીએ.", 
                     "જ્યારે પ્રેરણા ઓછી હોય, ત્યારે ખૂબ નાના થી શરૂઆત કરો. અહીં કેવી રીતે:",
                     "સૌથી અઘરો ભાગ શરૂઆત કરવાનો છે. તો ચાલો તે ભાગને નાનો બનાવીએ:"]
    },
    "stressed": {
        "english": ["I can feel your stress. Let's break things down to make them manageable.", 
                    "When everything feels overwhelming, we focus on one small step at a time.",
                    "Stress becomes smaller when we have a clear plan. Let's start with this:"],
        "hindi": ["मैं आपका तनाव महसूस कर सकता हूं। चलिए चीजों को प्रबंधनीय बनाने के लिए उन्हें तोड़ते हैं।", 
                  "जब सब कुछ अभिभूत लगता है, तो हम एक समय में एक छोटा कदम उठाते हैं।",
                  "जब हमारे पास एक स्पष्ट योजना होती है, तो तनाव छोटा हो जाता है। आइए इससे शुरू करें:"],
        "gujarati": ["હું તમારો તણાવ અનુભવી શકું છું. ચાલો વસ્તુઓને સંચાલિત કરવા યોગ્ય બનાવવા માટે તેમને તોડીએ.", 
                     "જ્યારે બધું જ અભિભૂત લાગે છે, ત્યારે આપણે એક સમયે એક નાના પગલાં પર ધ્યાન કેન્દ્રિત કરીએ છીએ.",
                     "જ્યારે આપણી પાસે સ્પષ્ટ યોજના હોય છે, ત્યારે તણાવ ઓછો થાય છે. ચાલો આનાથી શરૂ કરીએ:"]
    },
    "sad": {
        "english": ["It's okay to feel down. Small accomplishments can help brighten things up.", 
                    "Even when you're feeling sad, tiny steps forward can help shift your mood.",
                    "Let's be gentle with ourselves today, while still making a little progress:"],
        "hindi": ["उदास महसूस करना ठीक है। छोटी उपलब्धियां चीजों को उज्ज्वल करने में मदद कर सकती हैं।", 
                  "भले ही आप दुखी महसूस कर रहे हों, छोटे कदम आपके मूड को बदलने में मदद कर सकते हैं।",
                  "आज हम अपने साथ नरम रहें, फिर भी थोड़ी प्रगति करें:"],
        "gujarati": ["ઉદાસ લાગવું સામાન્ય છે. નાની સિદ્ધિઓ વસ્તુઓને વધુ ઉજ્જવળ બનાવવામાં મદદ કરી શકે છે.", 
                     "જ્યારે તમે ઉદાસ હો, ત્યારે પણ નાના પગલાં તમારા મૂડને બદલવામાં મદદ કરી શકે છે.",
                     "આજે આપણે આપણી જાત સાથે નરમ રહીએ, છતાં થોડી પ્રગતિ કરીએ:"]
    },
    "happy": {
        "english": ["Great energy! Let's channel it into something productive.", 
                    "Your positive mood is perfect for tackling something challenging.",
                    "Feeling good is a great time to build momentum! Here's a plan:"],
        "hindi": ["बढ़िया एनर्जी! आइए इसे कुछ उत्पादक में चैनल करें।", 
                  "आपका सकारात्मक मूड किसी चुनौतीपूर्ण चीज़ को संभालने के लिए एकदम सही है।",
                  "अच्छा महसूस करना गति बनाने का एक शानदार समय है! यहां एक योजना है:"],
        "gujarati": ["શાનદાર ઊર્જા! ચાલો તેને કંઈક ઉત્પાદક માં ચેનલ કરીએ.", 
                     "તમારો સકારાત્મક મૂડ કંઈક પડકારજનક કરવા માટે સંપૂર્ણ છે.",
                     "સારું લાગવું એ ગતિ બનાવવાનો શાનદાર સમય છે! અહીં એક યોજના છે:"]
    },
    "neutral": {
        "english": ["Here's a balanced plan that can help you make progress.", 
                    "Let's use this neutral state to build some productive habits.",
                    "Sometimes a neutral mood is perfect for focused work. Let's try:"],
        "hindi": ["यहां एक संतुलित योजना है जो आपको प्रगति करने में मदद कर सकती है।", 
                  "आइए इस तटस्थ स्थिति का उपयोग कुछ उत्पादक आदतें बनाने के लिए करें।",
                  "कभी-कभी तटस्थ मूड फोकस्ड काम के लिए एकदम सही होता है। आइए कोशिश करें:"],
        "gujarati": ["અહીં એક સંતુલિત યોજના છે જે તમને પ્રગતિ કરવામાં મદદ કરી શકે છે.", 
                     "ચાલો આ તટસ્થ સ્થિતિનો ઉપયોગ કેટલીક ઉત્પાદક ટેવો બનાવવા માટે કરીએ.",
                     "ક્યારેક તટસ્થ મૂડ કેન્દ્રિત કામ માટે સંપૂર્ણ હોય છે. ચાલો પ્રયાસ કરીએ:"]
    }
}

def generate_micro_plan(mood, language="english", context=None, duration_minutes=20):
    """
    Generate a micro-plan based on the user's mood
    
    Args:
        mood: The user's current mood
        language: The language to use
        context: Additional context (e.g., subject of study)
        duration_minutes: Duration of the plan in minutes
        
    Returns:
        A dictionary with the plan text and task details
    """
    # Default to neutral if mood not found
    if mood not in TASK_TEMPLATES:
        mood = "neutral"
    
    # Default to English if language not found
    if language not in ["english", "hindi", "gujarati"]:
        language = "english"
    
    # Select a subject (from context or random)
    if context and any(subj.lower() in context.lower() for subj in SUBJECTS[language]):
        for subj in SUBJECTS[language]:
            if subj.lower() in context.lower():
                subject = subj
                break
    else:
        subject = random.choice(SUBJECTS[language])
    
    # Generate task duration based on input duration
    # For micro-planning, we'll divide the total duration into 1-3 tasks
    task_count = min(3, max(1, duration_minutes // 10))
    durations = []
    
    remaining = duration_minutes
    for i in range(task_count - 1):
        task_duration = random.randint(max(5, remaining // 3), min(remaining - 5, remaining // 2))
        durations.append(task_duration)
        remaining -= task_duration
    
    durations.append(remaining)  # Add the last task with remaining time
    
    # Create tasks
    tasks = []
    used_templates = set()
    
    for duration in durations:
        # Select a template that hasn't been used yet if possible
        available_templates = [t for t in TASK_TEMPLATES[mood][language] 
                               if t not in used_templates]
        
        if not available_templates:
            available_templates = TASK_TEMPLATES[mood][language]
        
        template = random.choice(available_templates)
        used_templates.add(template)
        
        # Format the task
        task_text = template.format(duration=duration, subject=subject)
        
        # Calculate start time based on current time
        now = datetime.now()
        start_time = now + timedelta(minutes=sum(t.duration_minutes for t in tasks))
        
        tasks.append(PlanTask(
            task=task_text,
            duration_minutes=duration,
            start_time=start_time.strftime("%H:%M")
        ))
    
    # Select an introduction template
    intro = random.choice(INTRO_TEMPLATES.get(mood, INTRO_TEMPLATES["neutral"]).get(language, INTRO_TEMPLATES["neutral"]["english"]))
    
    # Format the full plan text
    plan_text = f"{intro}\n\n"
    
    for i, task in enumerate(tasks):
        plan_text += f"{i+1}. {task.task} ({task.start_time})\n"
    
    return {
        "plan_text": plan_text,
        "tasks": tasks,
        "mood": mood,
        "language": language
    }

@router.post("/", response_model=PlanResponse)
async def create_micro_plan(input_data: PlanInput):
    """
    Create a micro-plan based on mood and language
    
    Args:
        input_data: Mood, language, and optional context
        
    Returns:
        A micro-plan with tasks
    """
    try:
        plan_data = generate_micro_plan(
            input_data.mood,
            input_data.language,
            input_data.context,
            input_data.duration_minutes
        )
        
        return plan_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating plan: {str(e)}")
