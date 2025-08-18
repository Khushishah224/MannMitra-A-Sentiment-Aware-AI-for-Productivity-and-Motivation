import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MoodBadge from './MoodBadge';
import SubjectSelector from './SubjectSelector';
import { analyzeUserMood, trackMood, getMotivationalQuote, getPersonalizedPlan, getSubjectsByCategory } from '../api';
import { createUserSubject } from '../api/userSubjects';
import toast from 'react-hot-toast';
import { STRINGS } from '../i18n/strings';

const MoodSuggestionInput = ({ onComplete, language = 'english', userId }) => {
  const [step, setStep] = useState(1);
  const [moodText, setMoodText] = useState('');
  const [detectedMood, setDetectedMood] = useState(null);
  const [quote, setQuote] = useState('');
  const [category, setCategory] = useState('study');
  const [subject, setSubject] = useState('');
  const [subjects, setSubjects] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [taskDuration, setTaskDuration] = useState(20);
  const [startTime, setStartTime] = useState('');
  const [suggestion, setSuggestion] = useState(null);
  
  const placeholderText = STRINGS.flow.moodPlaceholder;

  const categoryLabels = {
    english: {
      study: "Study",
      work: "Work",
      personal: "Personal"
    },
    hindi: {
      study: "अध्ययन",
      work: "कार्य",
      personal: "व्यक्तिगत"
    },
    gujarati: {
      study: "અભ્યાસ",
      work: "કાર્ય",
      personal: "વ્યક્તિગત"
    }
  };

  const buttonText = STRINGS.flow.continue;

  const durationLabels = STRINGS.flow.minutes;

  // Load subjects when entering Step 3 or when category changes in Step 3
  useEffect(() => {
    if (step >= 3) {
      loadSubjects();
    }
  }, [category, step]);

  const loadSubjects = async () => {
    try {
      const subjectData = await getSubjectsByCategory(category);
      setSubjects(subjectData.map(item => item.suggestion));
      
      // Default to first subject if available
      if (subjectData.length > 0 && !subject) {
        setSubject(subjectData[0].suggestion);
      }
    } catch (error) {
      console.error('Error loading subjects:', error);
    }
  };

  // Step 1: Submit mood text for analysis
  const handleMoodSubmit = async (e) => {
    e.preventDefault();
    if (!moodText.trim()) return;
    
    setIsSubmitting(true);
    
    try {
      // Analyze mood
      const moodResult = await analyzeUserMood(moodText, language);
      // Normalize mood field across API shapes
      const normalized = {
        ...moodResult,
        mood: moodResult.mood || moodResult.mood_type,
      };
      setDetectedMood(normalized);
      
      // Track mood in database
      try {
        const moodKey = normalized.mood || 'neutral';
        await trackMood({
          text: moodText,
          mood_type: (moodKey || 'neutral').toUpperCase(),  // Convert to uppercase to match enum
          score: moodResult.polarity || 0,
          language
        });
      } catch (trackError) {
        console.error('Error tracking mood:', trackError);
        // Continue with flow even if tracking fails
      }
      
      // Get a motivational quote
      try {
  const quoteResult = await getMotivationalQuote(normalized.mood || 'neutral', language);
  setQuote(quoteResult?.quote || "Let's make today productive!");
      } catch (quoteError) {
        console.error('Error getting quote:', quoteError);
        // Use a default quote
        setQuote("Let's make today productive!");
      }
      
      // Move to next step
      setStep(2);
      
    } catch (error) {
      console.error('Error analyzing mood:', error);
      toast.error('Failed to analyze your mood. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 2: Continue to category selection
  const handleContinueToCategory = () => {
    setStep(3);
  };
  
  // Step 3: Submit category and get personalized plan
  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    if (!category) return;
    
    setIsSubmitting(true);
    
    try {
      // Get personalized plan based on mood and category
      const planResult = await getPersonalizedPlan(
        (detectedMood?.mood || detectedMood?.mood_type || 'neutral'),
        category,
        subject,
        taskDuration,
        moodText,
        startTime || null
      );
      
      setSuggestion(planResult);
      
      // Move to final step
      setStep(4);
      
    } catch (error) {
      console.error('Error getting personalized plan:', error);
      toast.error('Failed to create a plan. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 4: Accept the suggestion and complete
  const handleAcceptSuggestion = () => {
    if (onComplete && suggestion) {
      // Backend has already created the plan in /suggestions/personalized-plan
      // Pass the created plan upwards to avoid duplicate creation
      onComplete({
        createdPlan: suggestion.plan,
        suggestionText: suggestion.suggestion,
        responseText: suggestion.response_text,
        mood: detectedMood,
      });
    }

    toast.success('Your personalized plan has been created!');

    // Reset form for another input if needed
    // resetForm();
  };
  
  // Reset the form to initial state
  const resetForm = () => {
    setStep(1);
    setMoodText('');
    setDetectedMood(null);
    setQuote('');
    setCategory('study');
    setSubject('');
    setTaskDuration(20);
    setSuggestion(null);
  };
  
  return (
    <div className="w-full max-w-md mx-auto">
      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h2 className="text-lg font-semibold text-gray-800 mb-3 text-center">
              {placeholderText[language] || placeholderText.english}
            </h2>
            
            <form onSubmit={handleMoodSubmit} className="space-y-4">
              <textarea
                value={moodText}
                onChange={(e) => setMoodText(e.target.value)}
                placeholder={placeholderText[language] || placeholderText.english}
                className="w-full p-4 border rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 resize-none h-24"
                disabled={isSubmitting}
              />
              
              <button
                type="submit"
                disabled={!moodText.trim() || isSubmitting}
                className={`w-full px-6 py-3 rounded-lg font-medium text-white shadow-md transition-colors
                  ${!moodText.trim() || isSubmitting ? 
                    'bg-indigo-300 cursor-not-allowed' : 
                    'bg-indigo-600 hover:bg-indigo-700'}`}
              >
                {isSubmitting ? '...' : buttonText[language] || buttonText.english}
              </button>
            </form>
          </motion.div>
        )}
        
  {step === 2 && detectedMood && (
          <motion.div
            key="step2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="text-center"
          >
            <div className="mb-4">
              <MoodBadge mood={detectedMood.mood} language={language} size="lg" />
            </div>
            
            <motion.div
              className="bg-white p-6 rounded-lg shadow-md mb-6"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <h3 className="text-base font-medium text-gray-800 mb-2">{STRINGS.flow.yourMotivation[language] || STRINGS.flow.yourMotivation.english}</h3>
              {isSubmitting ? (
                <div className="animate-pulse space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-2/3" />
                </div>
              ) : (
                <p className="text-gray-600 italic">{quote}</p>
              )}
            </motion.div>
            
            <button
              onClick={handleContinueToCategory}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium shadow-md hover:bg-indigo-700 transition-colors"
            >
              {buttonText[language] || buttonText.english}
            </button>
          </motion.div>
        )}
        
        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h2 className="text-lg font-semibold text-gray-800 mb-3 text-center">{STRINGS.flow.whatFocus[language] || STRINGS.flow.whatFocus.english}</h2>
            
            <form onSubmit={handleCategorySubmit} className="space-y-4">
              <div className="grid grid-cols-3 gap-3 mb-4">
                {['study', 'work', 'personal'].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`py-2 px-4 rounded-md transition-all ${
                      category === cat 
                        ? 'bg-indigo-600 text-white font-medium shadow-md' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {categoryLabels[language]?.[cat] || categoryLabels.english[cat]}
                  </button>
                ))}
              </div>
              
              {category !== 'personal' && subjects.length > 0 && (
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-medium mb-2">{STRINGS.flow.chooseSubject[language] || STRINGS.flow.chooseSubject.english}</label>
                  <SubjectSelector 
                    category={category}
                    value={subject}
                    onChange={(value) => setSubject(value)}
                    onAddNew={async (newSubject) => {
                      try {
                        await createUserSubject({
                          name: newSubject,
                          category: category,
                          is_favorite: false
                        });
                        toast.success(`Added new ${category} subject: ${newSubject}`);
                      } catch (error) {
                        console.error('Error adding subject:', error);
                        toast.error('Failed to add custom subject');
                      }
                    }}
                  />
                </div>
              )}
              
              <div className="flex items-center space-x-4">
                <label className="text-gray-700 font-medium">{STRINGS.flow.duration[language] || STRINGS.flow.duration.english}</label>
                <select
                  value={taskDuration}
                  onChange={(e) => setTaskDuration(Number(e.target.value))}
                  className="flex-1 p-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300"
                >
                  <option value="10">10 {durationLabels[language] || durationLabels.english}</option>
                  <option value="15">15 {durationLabels[language] || durationLabels.english}</option>
                  <option value="20">20 {durationLabels[language] || durationLabels.english}</option>
                  <option value="30">30 {durationLabels[language] || durationLabels.english}</option>
                  <option value="45">45 {durationLabels[language] || durationLabels.english}</option>
                  <option value="60">60 {durationLabels[language] || durationLabels.english}</option>
                </select>
              </div>

              {/* Optional start time selection to schedule at creation */}
              <div className="flex items-center space-x-4">
                <label className="text-gray-700 font-medium">{STRINGS.assistant.pickTime[language] || STRINGS.assistant.pickTime.english}</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="flex-1 p-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300"
                />
              </div>
              
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full px-6 py-3 rounded-lg font-medium text-white shadow-md transition-colors
                  ${isSubmitting ? 
                    'bg-indigo-300 cursor-not-allowed' : 
                    'bg-indigo-600 hover:bg-indigo-700'}`}
              >
                {isSubmitting ? '...' : (STRINGS.flow.getSuggestion[language] || STRINGS.flow.getSuggestion.english)}
              </button>
            </form>
          </motion.div>
        )}
        
  {step === 4 && suggestion && (
          <motion.div
            key="step4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="text-center"
          >
            <div className="mb-4">
              <MoodBadge mood={detectedMood.mood} language={language} size="lg" />
            </div>
            
            <motion.div
              className="bg-white p-6 rounded-lg shadow-md mb-6"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <h3 className="text-base font-medium text-gray-800 mb-2">{STRINGS.flow.personalizedSuggestion[language] || STRINGS.flow.personalizedSuggestion.english}</h3>
              {isSubmitting ? (
                <div className="animate-pulse space-y-2 mb-4">
                  <div className="h-3 bg-gray-200 rounded w-5/6" />
                  <div className="h-3 bg-gray-200 rounded w-2/3" />
                </div>
              ) : (
                <p className="text-gray-600 mb-4">{suggestion.suggestion}</p>
              )}
              
              {suggestion.response_text && (
                <div className="mt-4 p-3 bg-gray-50 rounded-md">
                  <p className="whitespace-pre-line text-sm">{suggestion.response_text}</p>
                </div>
              )}
            </motion.div>
            
            <div className="flex space-x-3">
              <button
                onClick={handleAcceptSuggestion}
                className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-medium shadow-md hover:bg-green-700 transition-colors"
              >
                {STRINGS.flow.accept[language] || STRINGS.flow.accept.english}
              </button>
              
              <button
                onClick={() => setStep(3)}
                className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium shadow-md hover:bg-gray-300 transition-colors"
              >
                {STRINGS.flow.change[language] || STRINGS.flow.change.english}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MoodSuggestionInput;
