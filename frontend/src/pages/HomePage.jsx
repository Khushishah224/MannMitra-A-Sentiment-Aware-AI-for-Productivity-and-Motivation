import React, { useState } from 'react';
import Header from '../components/Header';
import MoodInput from '../components/MoodInput';
import ResponseCard from '../components/ResponseCard';
import TaskList from '../components/TaskList';
import LanguageSelector from '../components/LanguageSelector';
import { useUser } from '../context/UserContext';
import { analyzeUserMood, getMotivationalQuote, getMicroPlan } from '../api';

const HomePage = () => {
  const { user, updateUserPreferences, addMoodEntry } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);

  const handleLanguageChange = (language) => {
    updateUserPreferences({ language });
  };

  const handleMoodSubmission = async (text) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Step 1: Analyze mood
      const moodData = await analyzeUserMood(text, user.language);
      
      // Determine if we should show a quote or a plan based on the mood
      // For lazy, tired, stressed, or sad moods, show a plan
      const needsPlan = ['lazy', 'tired', 'stressed', 'sad', 'very_sad'].includes(moodData.mood);
      
      let responseData;
      
      if (needsPlan) {
        // Step 2A: Get a micro-plan
        responseData = await getMicroPlan(moodData.mood, user.language, text);
        
        // Add tasks to the response
        responseData = {
          type: 'plan',
          content: responseData.plan_text,
          mood: moodData.mood,
          tasks: responseData.tasks
        };
      } else {
        // Step 2B: Get a motivational quote
        const quoteData = await getMotivationalQuote(moodData.mood, user.language);
        
        responseData = {
          type: 'quote',
          content: quoteData.quote,
          mood: moodData.mood
        };
      }
      
      // Update state with the response
      setResponse(responseData);
      
      // Save to mood history
      addMoodEntry({
        text,
        mood: moodData.mood,
        timestamp: new Date().toISOString(),
        response: responseData
      });
      
    } catch (err) {
      console.error('Error processing mood:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const subtitleText = {
    english: "Your emotional support companion",
    hindi: "आपका भावनात्मक सहायक साथी",
    gujarati: "તમારો ભાવનાત્મક સહાય સાથી"
  };

  return (
    <div className="max-w-md mx-auto px-4 py-8 pb-20">
      <div className="flex justify-end mb-4">
        <LanguageSelector 
          currentLanguage={user.language} 
          onLanguageChange={handleLanguageChange} 
        />
      </div>
      
      <Header title="MannMitra" subtitle={subtitleText[user.language] || subtitleText.english} />
      
      <MoodInput 
        onSubmit={handleMoodSubmission}
        language={user.language}
      />
      
      {isLoading && (
        <div className="mt-6 text-center">
          <div className="inline-block animate-pulse">
            <div className="w-8 h-8 mx-auto rounded-full bg-pink-200"></div>
            <p className="text-sm text-gray-500 mt-2">Analyzing your mood...</p>
          </div>
        </div>
      )}
      
      {error && (
        <div className="mt-6 p-4 bg-red-50 text-red-700 rounded-md text-center">
          {error}
        </div>
      )}
      
      {response && !isLoading && (
        <div className="mt-6 space-y-4">
          <ResponseCard 
            type={response.type} 
            content={response.content}
            mood={response.mood}
          />
          
          {response.type === 'plan' && response.tasks && (
            <TaskList tasks={response.tasks} />
          )}
        </div>
      )}
    </div>
  );
};

export default HomePage;
