import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MoodBadge from './MoodBadge';
import SubjectSelector from './SubjectSelector';
import { analyzeUserMood, trackMood, getMotivationalQuote, getPersonalizedPlan, getSubjectsByCategory, getUserPlans, createPlan, updatePlan } from '../api';
import { hasOverlap as utilHasOverlap, computeNextFree as utilComputeNextFree, computeChainShifts, applyChainShifts } from '../utils/timeConflicts';
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
  const [reminderLead, setReminderLead] = useState('');
  const [timeConflict, setTimeConflict] = useState(false);
  const [suggestedFreeTime, setSuggestedFreeTime] = useState('');
  
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
        empathetic_response: moodResult.empathetic_response || null, // Sprint 3: Store empathetic response
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
  
  // Local helper: check start time conflict with existing plans (client side) before calling backend
  const hasLocalTimeConflict = async (proposedStartTime, duration) => {
    if (!proposedStartTime) return false;
    try {
      const res = await getUserPlans();
      return utilHasOverlap(res?.plans || [], proposedStartTime, duration);
    } catch { return false; }
  };

  // Compute next free start time after desiredStart for given duration
  const computeNextFreeStart = async (desiredStart, duration) => {
    if (!desiredStart) return '';
    try {
      const res = await getUserPlans();
      return utilComputeNextFree(res?.plans || [], desiredStart, duration);
    } catch { return ''; }
  };

  // Localized conflict messages
  const conflictStrings = {
    english: {
      conflict: 'This time overlaps with an existing task.',
      suggestion: 'Next free time:',
      apply: 'Use this time'
    },
    hindi: {
      conflict: 'यह समय किसी मौजूदा कार्य से टकरा रहा है।',
      suggestion: 'अगला खाली समय:',
      apply: 'यह समय चुनें'
    },
    gujarati: {
      conflict: 'આ સમય વર્તમાન કાર્ય સાથે અથડાય છે.',
      suggestion: 'આગલો ખાલી સમય:',
      apply: 'આ સમય લો'
    }
  };

  // React to start time change to provide live conflict feedback
  useEffect(() => {
    let active = true;
    (async () => {
      if (!startTime) { setTimeConflict(false); return; }
      const conflict = await hasLocalTimeConflict(startTime, taskDuration);
      if (active) setTimeConflict(conflict);
      if (conflict) {
        const nextFree = await computeNextFreeStart(startTime, taskDuration);
        if (active) setSuggestedFreeTime(nextFree);
      } else if (active) {
        setSuggestedFreeTime('');
      }
    })();
    return () => { active = false; };
  }, [startTime, taskDuration]);

  // Step 3: Submit category and get personalized plan (with start-time conflict pre-check)
  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    if (!category) return;

    // Pre-check start time conflict (client side) for quicker UX
    if (startTime) {
      const conflict = await hasLocalTimeConflict(startTime, taskDuration);
      if (conflict) {
        toast.error('Selected start time overlaps with an existing task. Choose a different time.');
        return; // Do not proceed
      }
    }

    setIsSubmitting(true);

    try {
      const planResult = await getPersonalizedPlan(
        (detectedMood?.mood || detectedMood?.mood_type || 'neutral'),
        category,
        subject,
        taskDuration,
        moodText,
        startTime || null
      );
      setSuggestion(planResult);
      setStep(4);
    } catch (error) {
      console.error('Error getting personalized plan:', error);
      // Custom time conflict surfacing if backend returned 409 inside generic error (future-proof)
      const status = error?.response?.status;
      const detail = error?.response?.data?.detail;
      if (status === 409 && detail?.code === 'TIME_CONFLICT') {
        const ep = detail.existing_plan || {};
        toast.error(`Time conflict with: ${ep.title || 'another task'} at ${ep.scheduled_time || ''}`);
      } else {
        toast.error('Failed to get suggestion. Please adjust inputs.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 4: Accept the suggestion and complete
  const handleAcceptSuggestion = async () => {
    if (!suggestion) return;
    // Format title
    const categoryLabel = category.charAt(0).toUpperCase() + category.slice(1);
    const formattedTitle = subject ? `${categoryLabel} - ${subject}` : `${categoryLabel} Task`;
    const planData = {
      title: formattedTitle,
      description: suggestion?.suggestion,
      category,
      subject: subject || null,
      duration_minutes: suggestion?.plan?.duration_minutes || taskDuration,
      status: 'pending',
      scheduled_time: suggestion?.plan?.scheduled_time || (startTime || undefined),
      ...(reminderLead !== '' ? { reminder_lead_minutes: Number(reminderLead) } : {}),
    };

    // Client-side conflict re-check if scheduled_time present
    if (planData.scheduled_time) {
      const conflict = await hasLocalTimeConflict(planData.scheduled_time, planData.duration_minutes);
      if (conflict) {
        // Offer auto-chain shift
        try {
          const res = await getUserPlans();
          const shifts = computeChainShifts(res?.plans || [], planData.scheduled_time, planData.duration_minutes);
          if (shifts.length > 0) {
            const confirmChain = window.confirm(`Time conflict. Auto-shift ${shifts.length} subsequent task(s)?`);
            if (confirmChain) {
              await applyChainShifts(shifts, updatePlan);
            } else {
              const nextFree = await computeNextFreeStart(planData.scheduled_time, planData.duration_minutes);
              if (nextFree) {
                toast(`Try next free time ${nextFree}`, { icon: '⏱️' });
              }
              return;
            }
          } else {
            toast.error('Time conflict detected. Pick another time before saving.');
            return;
          }
        } catch { return; }
      }
    }

    try {
      // Create plan directly here to surface conflict errors properly
      const created = await createPlan(planData);
      toast.success('Your personalized plan has been created!');
      if (onComplete) {
        onComplete({ planData: created, suggestionText: suggestion.suggestion, responseText: suggestion.response_text, mood: detectedMood });
      }
    } catch (error) {
      const status = error?.response?.status;
      const detail = error?.response?.data?.detail;
      if (status === 409 && detail?.code === 'TIME_CONFLICT') {
        const ep = detail.existing_plan || {};
        toast.error(`Time conflict with: ${ep.title || 'another task'} at ${ep.scheduled_time || ''}`);
      } else {
        toast.error('Failed to save plan. Please try again.');
      }
    }
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
    setReminderLead('');
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
                        const result = await createUserSubject({
                          name: newSubject,
                          category: category,
                          is_favorite: false
                        });
                        
                        // Immediately select the new subject without proceeding to next step
                        if (result && result.name) {
                          setSubject(result.name);
                        }
                        
                        toast.success(`Added new ${category} subject: ${newSubject}`);
                        return true;  // Success
                      } catch (error) {
                        console.error('Error adding subject:', error);
                        toast.error('Failed to add custom subject');
                        return false;  // Failure
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
                <div className="flex-1">
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className={`w-full p-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 ${timeConflict ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : ''}`}
                  />
                  {timeConflict && (
                    <div className="mt-1 space-y-1">
                      <p className="text-xs text-red-600">{conflictStrings[language]?.conflict || conflictStrings.english.conflict}</p>
                      {suggestedFreeTime && (
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-gray-600">{conflictStrings[language]?.suggestion || conflictStrings.english.suggestion} <span className="font-semibold">{suggestedFreeTime}</span></span>
                          <button
                            type="button"
                            onClick={() => setStartTime(suggestedFreeTime)}
                            className="px-2 py-0.5 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                          >{conflictStrings[language]?.apply || conflictStrings.english.apply}</button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <label className="text-gray-700 font-medium">{STRINGS?.planner?.reminderLead?.[language] || 'Reminder (min before, optional)'}</label>
                <input
                  type="number"
                  min="0"
                  max="120"
                  value={reminderLead}
                  onChange={(e) => setReminderLead(e.target.value)}
                  className="w-28 p-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300"
                  placeholder="e.g. 5"
                />
              </div>
              
              <button
                type="submit"
                disabled={isSubmitting || timeConflict}
                className={`w-full px-6 py-3 rounded-lg font-medium text-white shadow-md transition-colors
                  ${(isSubmitting || timeConflict) ? 
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
