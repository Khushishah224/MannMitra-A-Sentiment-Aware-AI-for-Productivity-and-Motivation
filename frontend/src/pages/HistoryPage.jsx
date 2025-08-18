import React, { useEffect, useState } from 'react';
import Header from '../components/Header';
import LanguageSelector from '../components/LanguageSelector';
import MoodBadge from '../components/MoodBadge';
import { useUser } from '../context/UserContext';
import { format } from 'date-fns';
import MoodHistoryChart from '../components/MoodHistoryChart';
import { fetchMoodHistory } from '../api';

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
  const signInHint = {
    english: 'Sign in to unlock your mood history chart.',
    hindi: 'अपने मूड इतिहास चार्ट को देखने के लिए साइन इन करें।',
    gujarati: 'તમારો મૂડ ઇતિહાસ ચાર્ટ જોવા માટે સાઇન ઇન કરો.'
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return format(date, 'MMM d, h:mm a');
    } catch (error) {
      return dateString;
    }
  };

  const [serverHistory, setServerHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetchMoodHistory(30);
        if (mounted && res?.moods) {
          setServerHistory(res.moods);
        }
      } catch (e) {
        // Silently ignore (could be unauthenticated)
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  const hasLocal = user.moodHistory && user.moodHistory.length > 0;
  const hasServer = serverHistory && serverHistory.length > 0;

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
      
      {/* Chart section (server data preferred) */}
      {(hasServer) && (
        <div className="mb-6 bg-white rounded-lg shadow-md p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">
            {user.language === 'english' ? 'Last 30 moods' : user.language === 'hindi' ? 'पिछले 30 मूड' : 'છેલ્લા 30 મૂડ'}
          </h3>
          <MoodHistoryChart data={serverHistory} />
        </div>
      )}

      {(!hasLocal && !hasServer && !loading) ? (
        <div className="text-center p-6 bg-gray-50 rounded-lg">
          <p className="text-gray-500">
            {noHistoryText[user.language] || noHistoryText.english}
          </p>
          {!localStorage.getItem('token') && (
            <p className="text-gray-400 text-xs mt-2">{signInHint[user.language] || signInHint.english}</p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {(hasServer ? serverHistory : user.moodHistory).map((entry, index) => (
            <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-4 border-b border-gray-100">
                <div className="flex justify-between items-start mb-2">
                  <MoodBadge mood={entry.mood || entry.mood_type} />
                  <span className="text-xs text-gray-500">
                    {formatDate(entry.timestamp || entry.created_at)}
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
