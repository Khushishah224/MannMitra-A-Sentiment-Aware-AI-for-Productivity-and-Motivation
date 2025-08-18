import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MoodBadge from './MoodBadge';
import { analyzeUserMood, trackMood } from '../api';
import toast from 'react-hot-toast';

const MoodInput = ({ onComplete, language = 'english', userId }) => {
  const [step, setStep] = useState(1);
  const [moodText, setMoodText] = useState('');
  const [detectedMood, setDetectedMood] = useState(null);
  const [quote, setQuote] = useState('');
  const [focusTask, setFocusTask] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [taskDuration, setTaskDuration] = useState(20);
  
  const placeholderText = {
    english: "How are you feeling today?",
    hindi: "आज आप कैसा महसूस कर रहे हैं?",
    gujarati: "આજે તમે કેવું અનુભવી રહ્યા છો?"
  };

  const focusPlaceholder = {
    english: "What would you like to focus on today?",
    hindi: "आज आप किस पर ध्यान केंद्रित करना चाहते हैं?",
    gujarati: "આજે તમે શું ધ્યાન કેન્દ્રિત કરવા માંગો છો?"
  };

  const buttonText = {
    english: "Continue",
    hindi: "जारी रखें",
    gujarati: "ચાલુ રાખો"
  };

  const durationLabels = {
    english: "minutes",
    hindi: "मिनट",
    gujarati: "મિનિટ"
  };

  // Step 1: Submit mood text for analysis
  const handleMoodSubmit = async (e) => {
    e.preventDefault();
    if (!moodText.trim()) return;
    
    setIsSubmitting(true);
    
    try {
      // Analyze mood
      const moodResult = await analyzeUserMood(moodText, language);
      setDetectedMood(moodResult);
      
      // Track mood in database
      try {
        await trackMood({
          text: moodText,
          mood_type: moodResult.mood.toUpperCase(),  // Convert to uppercase to match enum
          score: moodResult.polarity || 0,
          language
        });
      } catch (trackError) {
        console.error('Error tracking mood:', trackError);
        // Continue with flow even if tracking fails
      }
      
      // Move to next step
      setStep(2);
      
      // Get a motivational quote (you would implement this API)
      // For now, we'll use placeholder quotes
      const quotes = {
        happy: "Great mood! Let's make the most of it!",
        sad: "It's okay to feel down. Small steps lead to big progress.",
        anxious: "Take a deep breath. One task at a time.",
        stressed: "Remember to breathe. Let's break it down into small steps.",
        motivated: "That's the spirit! Let's channel this energy.",
        lazy: "Even small progress is still progress. Let's start small.",
        neutral: "Today is a canvas. Let's create something meaningful."
      };
      
      setQuote(quotes[moodResult.mood] || quotes.neutral);
      
    } catch (error) {
      console.error('Error analyzing mood:', error);
      toast.error('Failed to analyze your mood. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 2: Continue to focus task input
  const handleContinueToTask = () => {
    setStep(3);
  };
  
  // Step 3: Submit focus task
  const handleTaskSubmit = async (e) => {
    e.preventDefault();
    if (!focusTask.trim()) return;
    
    setIsSubmitting(true);
    
    try {
      // Submit plan/task
      const planData = {
        title: focusTask,
        description: `Based on mood: ${detectedMood?.mood}`,
        category: "study", // Default category, could be made selectable
        duration_minutes: taskDuration,
        status: "pending",
        related_mood_id: detectedMood?.id
      };
      
      // Call the complete handler with all collected data
      if (onComplete) {
        onComplete({
          mood: detectedMood,
          task: focusTask,
          duration: taskDuration,
          planData
        });
      }
      
      toast.success('Your plan has been created!');
      
      // Reset form for another input if needed
      // resetForm();
      
    } catch (error) {
      console.error('Error creating plan:', error);
      toast.error('Failed to create your plan. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Reset the form to initial state
  const resetForm = () => {
    setStep(1);
    setMoodText('');
    setDetectedMood(null);
    setQuote('');
    setFocusTask('');
    setTaskDuration(20);
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
            <h2 className="text-xl font-semibold text-gray-800 mb-4 text-center">
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
              <h3 className="text-lg font-medium text-gray-800 mb-2">
                {language === 'english' ? 'Your Motivation:' : 
                 language === 'hindi' ? 'आपकी प्रेरणा:' : 'તમારી પ્રેરણા:'}
              </h3>
              <p className="text-gray-600 italic">{quote}</p>
            </motion.div>
            
            <button
              onClick={handleContinueToTask}
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
            <h2 className="text-xl font-semibold text-gray-800 mb-4 text-center">
              {focusPlaceholder[language] || focusPlaceholder.english}
            </h2>
            
            <form onSubmit={handleTaskSubmit} className="space-y-4">
              <input
                type="text"
                value={focusTask}
                onChange={(e) => setFocusTask(e.target.value)}
                placeholder={
                  language === 'english' ? 'e.g., Study Mathematics' : 
                  language === 'hindi' ? 'जैसे, गणित का अध्ययन' : 
                  'દા.ત., ગણિત અભ્યાસ'
                }
                className="w-full p-4 border rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300"
                disabled={isSubmitting}
              />
              
              <div className="flex items-center space-x-4">
                <label className="text-gray-700 font-medium">
                  {language === 'english' ? 'Duration:' : 
                   language === 'hindi' ? 'अवधि:' : 'અવધિ:'}
                </label>
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
              
              <button
                type="submit"
                disabled={!focusTask.trim() || isSubmitting}
                className={`w-full px-6 py-3 rounded-lg font-medium text-white shadow-md transition-colors
                  ${!focusTask.trim() || isSubmitting ? 
                    'bg-indigo-300 cursor-not-allowed' : 
                    'bg-indigo-600 hover:bg-indigo-700'}`}
              >
                {isSubmitting ? '...' : 
                  language === 'english' ? 'Create Plan' : 
                  language === 'hindi' ? 'योजना बनाएं' : 
                  'યોજના બનાવો'}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MoodInput;
