import React from 'react';
import Header from '../components/Header';
import LanguageSelector from '../components/LanguageSelector';
import { useUser } from '../context/UserContext';
import { FaUser, FaLanguage, FaInfoCircle, FaGithub, FaCode } from 'react-icons/fa';

const ProfilePage = () => {
  const { user, updateUserPreferences } = useUser();

  const handleLanguageChange = (language) => {
    updateUserPreferences({ language });
  };

  const handleClearData = () => {
    if (window.confirm('Are you sure you want to clear all your data? This cannot be undone.')) {
      updateUserPreferences({ 
        moodHistory: [] 
      });
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
        title={user.language === 'english' ? 'Profile' : 
               user.language === 'hindi' ? 'प्रोफ़ाइल' : 'પ્રોફાઇલ'} 
      />
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-4 flex items-center space-x-4 border-b border-gray-100">
          <div className="bg-pink-100 rounded-full p-3">
            <FaUser className="text-pink-600 text-xl" />
          </div>
          <div>
            <h3 className="font-medium text-gray-800">
              {user.language === 'english' ? 'User ID' : 
               user.language === 'hindi' ? 'यूजर आईडी' : 'યુઝર ID'}
            </h3>
            <p className="text-sm text-gray-500">{user.id}</p>
          </div>
        </div>
        
        <div className="p-4 flex items-center space-x-4 border-b border-gray-100">
          <div className="bg-blue-100 rounded-full p-3">
            <FaLanguage className="text-blue-600 text-xl" />
          </div>
          <div>
            <h3 className="font-medium text-gray-800">
              {user.language === 'english' ? 'Language' : 
               user.language === 'hindi' ? 'भाषा' : 'ભાષા'}
            </h3>
            <p className="text-sm text-gray-500">
              {user.language === 'english' ? 'English' : 
               user.language === 'hindi' ? 'हिंदी' : 'ગુજરાતી'}
            </p>
          </div>
        </div>
        
        <div className="p-4 flex items-center space-x-4 border-b border-gray-100">
          <div className="bg-green-100 rounded-full p-3">
            <FaInfoCircle className="text-green-600 text-xl" />
          </div>
          <div>
            <h3 className="font-medium text-gray-800">
              {user.language === 'english' ? 'Mood Entries' : 
               user.language === 'hindi' ? 'मूड एंट्रीज' : 'મૂડ એન્ટ્રીઝ'}
            </h3>
            <p className="text-sm text-gray-500">
              {user.moodHistory ? user.moodHistory.length : 0}
            </p>
          </div>
        </div>
        
        <div className="p-4">
          <button
            onClick={handleClearData}
            className="w-full px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-300"
          >
            {user.language === 'english' ? 'Clear All Data' : 
             user.language === 'hindi' ? 'सभी डेटा साफ करें' : 'બધો ડેટા સાફ કરો'}
          </button>
        </div>
      </div>
      
      <div className="mt-6 bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-medium text-gray-800 flex items-center space-x-2">
            <FaCode className="text-pink-600" />
            <span>
              {user.language === 'english' ? 'About MannMitra' : 
               user.language === 'hindi' ? 'मनमित्र के बारे में' : 'મનમિત્ર વિશે'}
            </span>
          </h3>
        </div>
        <div className="p-4">
          <p className="text-sm text-gray-700 mb-4">
            {user.language === 'english' ? 
              'MannMitra is an AI-powered, multilingual productivity assistant that listens to your thoughts, understands your emotions, and gives back contextual motivation, quotes, and micro-plans — in your language and tone.' : 
             user.language === 'hindi' ? 
              'मनमित्र एक AI संचालित, बहुभाषी उत्पादकता सहायक है जो आपके विचारों को सुनता है, आपकी भावनाओं को समझता है, और प्रासंगिक प्रेरणा, उद्धरण, और माइक्रो-प्लान देता है — आपकी भाषा और टोन में।' : 
              'મનમિત્ર એક AI-સંચાલિત, બહુભાષી ઉત્પાદકતા સહાયક છે જે તમારા વિચારોને સાંભળે છે, તમારી લાગણીઓને સમજે છે, અને પ્રાસંગિક પ્રેરણા, અવતરણો અને માઇક્રો-પ્લાન આપે છે - તમારી ભાષા અને ટોનમાં.'}
          </p>
          
          <div className="flex justify-center">
            <a
              href="https://github.com/yourusername/mannmitra"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 text-pink-600 hover:text-pink-700"
            >
              <FaGithub />
              <span>GitHub</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
