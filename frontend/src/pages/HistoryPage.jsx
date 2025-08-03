import React from 'react';
import Header from '../components/Header';
import LanguageSelector from '../components/LanguageSelector';
import MoodBadge from '../components/MoodBadge';
import { useUser } from '../context/UserContext';
import { format } from 'date-fns';

const HistoryPage = () => {
  const { user, updateUserPreferences } = useUser();

  const handleLanguageChange = (language) => {
    updateUserPreferences({ language });
  };

  const titleText = {
    english: "Mood History",
    hindi: "मूड इतिहास",
    gujarati: "મૂડ ઇતિહાસ"
  };

  const subtitleText = {
    english: "Track your emotional journey",
    hindi: "अपनी भावनात्मक यात्रा को ट्रैक करें",
    gujarati: "તમારી ભાવનાત્મક યાત્રાને ટ્રૅક કરો"
  };

  const noHistoryText = {
    english: "No mood history yet. Share how you're feeling on the home page.",
    hindi: "अभी तक कोई मूड इतिहास नहीं। होम पेज पर साझा करें कि आप कैसा महसूस कर रहे हैं।",
    gujarati: "હજી સુધી કોઈ મૂડ ઇતિહાસ નથી. હોમ પેજ પર શેર કરો કે તમે કેવું અનુભવી રહ્યા છો."
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return format(date, 'MMM d, h:mm a');
    } catch (error) {
      return dateString;
    }
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
      
      {(!user.moodHistory || user.moodHistory.length === 0) ? (
        <div className="text-center p-6 bg-gray-50 rounded-lg">
          <p className="text-gray-500">
            {noHistoryText[user.language] || noHistoryText.english}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {user.moodHistory.map((entry, index) => (
            <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-4 border-b border-gray-100">
                <div className="flex justify-between items-start mb-2">
                  <MoodBadge mood={entry.mood} />
                  <span className="text-xs text-gray-500">
                    {formatDate(entry.timestamp)}
                  </span>
                </div>
                <p className="text-gray-800">{entry.text}</p>
              </div>
              {entry.response && (
                <div className="p-4 bg-gray-50">
                  <p className="text-sm text-gray-600 font-medium mb-1">
                    {entry.response.type === 'quote' ? 
                      (user.language === 'english' ? 'Motivation:' : 
                       user.language === 'hindi' ? 'प्रेरणा:' : 'પ્રેરણા:') : 
                      (user.language === 'english' ? 'Plan:' : 
                       user.language === 'hindi' ? 'योजना:' : 'યોજના:')}
                  </p>
                  <p className="text-gray-700 text-sm whitespace-pre-wrap">
                    {entry.response.content}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HistoryPage;
