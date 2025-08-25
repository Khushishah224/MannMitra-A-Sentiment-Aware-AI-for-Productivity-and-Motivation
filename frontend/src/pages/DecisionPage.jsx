import React from 'react';
import Header from '../components/Header';
import LanguageSelector from '../components/LanguageSelector';
import DecisionHelper from '../components/DecisionHelper';
import { useUser } from '../context/UserContext';

const DecisionPage = () => {
  const { user, updateUserPreferences } = useUser();
  const language = user?.language || 'english';
  
  const handleLanguageChange = (newLanguage) => {
    updateUserPreferences({ language: newLanguage });
  };
  
  const titleText = {
    english: "Decision Helper",
    hindi: "निर्णय सहायक",
    gujarati: "નિર્ણય સહાયક"
  };
  
  const subtitleText = {
    english: "Get help with difficult choices using smart analysis",
    hindi: "स्मार्ट विश्लेषण का उपयोग करके कठिन विकल्पों में सहायता प्राप्त करें",
    gujarati: "સ્માર્ટ વિશ્લેષણનો ઉપયોગ કરીને મુશ્કેલ પસંદગીઓમાં મદદ મેળવો"
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
        {/* Top Bar */}
        <div className="flex justify-end mb-8">
          <LanguageSelector
            currentLanguage={language}
            onLanguageChange={handleLanguageChange}
          />
        </div>
        
        {/* Header */}
        <Header 
          title={titleText[language] || titleText.english} 
          subtitle={subtitleText[language] || subtitleText.english}
        />
        
        {/* Decision Helper */}
        <div className="mt-8">
          <DecisionHelper language={language} />
        </div>
      </div>
    </div>
  );
};

export default DecisionPage;