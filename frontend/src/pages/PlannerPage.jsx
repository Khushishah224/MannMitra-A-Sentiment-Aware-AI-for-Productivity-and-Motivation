import React, { useState } from 'react';
import Header from '../components/Header';
import LanguageSelector from '../components/LanguageSelector';
import TaskList from '../components/TaskList';
import MoodBadge from '../components/MoodBadge';
import { useUser } from '../context/UserContext';
import { getMicroPlan } from '../api';
import { FaPlus, FaRegLightbulb } from 'react-icons/fa';

const PlannerPage = () => {
  const { user, updateUserPreferences } = useUser();
  const [duration, setDuration] = useState(30);
  const [context, setContext] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [plan, setPlan] = useState(null);
  const [error, setError] = useState(null);

  const handleLanguageChange = (language) => {
    updateUserPreferences({ language });
  };

  const handleCreatePlan = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Use neutral mood if just planning, or use the last mood from history if available
      const mood = user.moodHistory && user.moodHistory.length > 0 
        ? user.moodHistory[0].mood 
        : 'neutral';
      
      const planData = await getMicroPlan(mood, user.language, context, duration);
      
      setPlan({
        type: 'plan',
        content: planData.plan_text,
        mood: planData.mood,
        tasks: planData.tasks
      });
      
    } catch (err) {
      console.error('Error creating plan:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const titleText = {
    english: "Micro Planner",
    hindi: "माइक्रो प्लानर",
    gujarati: "માઇક્રો પ્લાનર"
  };

  const subtitleText = {
    english: "Small steps to keep you going",
    hindi: "आपको चलते रहने के लिए छोटे कदम",
    gujarati: "તમને આગળ વધતા રાખવા માટે નાના પગલાં"
  };

  const contextPlaceholder = {
    english: "What subject are you working on? (e.g., Math, Programming)",
    hindi: "आप किस विषय पर काम कर रहे हैं? (जैसे, गणित, प्रोग्रामिंग)",
    gujarati: "તમે કયા વિષય પર કામ કરી રહ્યા છો? (દા.ત., ગણિત, પ્રોગ્રામિંગ)"
  };

  const buttonText = {
    english: "Create Plan",
    hindi: "योजना बनाएं",
    gujarati: "યોજના બનાવો"
  };

  return (
    <div className="max-w-md mx-auto px-4 py-8 pb-20">
      <div className="flex justify-end mb-4">
        <LanguageSelector 
          currentLanguage={user.language} 
          onLanguageChange={handleLanguageChange} 
        />
      </div>
      
      <Header 
        title={titleText[user.language] || titleText.english} 
        subtitle={subtitleText[user.language] || subtitleText.english} 
      />
      
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="mb-4">
          <label htmlFor="context" className="block text-sm font-medium text-gray-700 mb-1">
            {contextPlaceholder[user.language] || contextPlaceholder.english}
          </label>
          <input
            type="text"
            id="context"
            value={context}
            onChange={(e) => setContext(e.target.value)}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-pink-200 focus:border-pink-300"
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-1">
            {user.language === 'english' && 'Duration (minutes)'}
            {user.language === 'hindi' && 'अवधि (मिनट)'}
            {user.language === 'gujarati' && 'સમયગાળો (મિનિટ)'}
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="range"
              id="duration"
              min="10"
              max="60"
              step="5"
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value))}
              className="flex-1"
            />
            <span className="text-sm font-medium text-gray-700">{duration}</span>
          </div>
        </div>
        
        {user.moodHistory && user.moodHistory.length > 0 && (
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-1">
              {user.language === 'english' && 'Current Mood:'}
              {user.language === 'hindi' && 'वर्तमान मूड:'}
              {user.language === 'gujarati' && 'વર્તમાન મૂડ:'}
            </p>
            <MoodBadge mood={user.moodHistory[0].mood} />
          </div>
        )}
        
        <button
          onClick={handleCreatePlan}
          disabled={isLoading}
          className="w-full mt-2 px-4 py-2 bg-pink-500 text-white rounded-md hover:bg-pink-600 focus:outline-none focus:ring-2 focus:ring-pink-300 flex items-center justify-center space-x-2"
        >
          {isLoading ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {user.language === 'english' && 'Creating...'}
              {user.language === 'hindi' && 'बना रहा है...'}
              {user.language === 'gujarati' && 'બનાવી રહ્યું છે...'}
            </span>
          ) : (
            <>
              <FaPlus className="text-sm" />
              <span>{buttonText[user.language] || buttonText.english}</span>
            </>
          )}
        </button>
      </div>
      
      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-md text-center">
          {error}
        </div>
      )}
      
      {plan && (
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow-md overflow-hidden border-l-4 border-pink-300">
            <div className="px-4 py-2 flex items-center gap-2 bg-pink-50">
              <FaRegLightbulb className="text-pink-500" />
              <span className="font-medium text-gray-800">
                {user.language === 'english' && 'Your Plan'}
                {user.language === 'hindi' && 'आपकी योजना'}
                {user.language === 'gujarati' && 'તમારી યોજના'}
              </span>
            </div>
            <div className="p-4">
              <div className="whitespace-pre-wrap text-gray-700">{plan.content}</div>
            </div>
          </div>
          
          {plan.tasks && <TaskList tasks={plan.tasks} />}
        </div>
      )}
    </div>
  );
};

export default PlannerPage;
