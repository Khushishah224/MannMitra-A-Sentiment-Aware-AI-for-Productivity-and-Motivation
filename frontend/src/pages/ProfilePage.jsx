import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import LanguageSelector from '../components/LanguageSelector';
import { useUser } from '../context/UserContext';
import { AuthContext } from '../context/AuthContext';
import { FaUser, FaLanguage, FaInfoCircle, FaGithub, FaCode, FaSignOutAlt } from 'react-icons/fa';

const ProfilePage = () => {
  const { user: localUser, updateUserPreferences } = useUser();
  const { user, logout, updateProfile, refresh } = useContext(AuthContext);
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [language, setLanguage] = useState('english');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || '');
      setLanguage(user.language_preference || 'english');
    }
  }, [user]);

  const handleLanguageChange = (lng) => {
    setLanguage(lng);
    // Keep local preference in sync for UI strings
    updateUserPreferences({ language: lng });
  };

  const handleClearData = () => {
    if (window.confirm('Are you sure you want to clear all your data? This cannot be undone.')) {
      updateUserPreferences({ 
        moodHistory: [] 
      });
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await updateProfile({ full_name: fullName, language_preference: language });
      await refresh();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 lg:px-8 py-8 pb-24">
      <div className="flex justify-end mb-6">
        <LanguageSelector 
          currentLanguage={localUser.language} 
          onLanguageChange={handleLanguageChange} 
        />
      </div>
      <Header 
        title={localUser.language === 'english' ? 'Profile' : localUser.language === 'hindi' ? 'प्रोफ़ाइल' : 'પ્રોફાઇલ'} 
      />
      <div className="grid md:grid-cols-3 gap-8 mt-4">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 flex items-start gap-4 border-b border-gray-50">
              <div className="bg-pink-100 rounded-full p-4 shrink-0">
                <FaUser className="text-pink-600 text-xl" />
              </div>
              <div className="flex-1">
                <p className="text-xs uppercase tracking-wide font-semibold text-gray-500 mb-1">
                  {localUser.language === 'english' ? 'User ID' : localUser.language === 'hindi' ? 'यूजर आईडी' : 'યુઝર ID'}
                </p>
                <p className="text-sm font-mono text-gray-700 break-all">{user?.id}</p>
                </div>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Full name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Email</label>
                <input type="email" value={user?.email || ''} readOnly className="w-full px-3 py-2 border border-gray-100 rounded-md text-sm bg-gray-50" />
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 rounded-full p-3">
                  <FaLanguage className="text-blue-600" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-800">
                    {localUser.language === 'english' ? 'Language' : localUser.language === 'hindi' ? 'भाषा' : 'ભાષા'}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {language === 'english' ? 'English' : language === 'hindi' ? 'हिंदी' : 'ગુજરાતી'}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 px-5 py-3 bg-green-600 text-white rounded-xl text-sm font-medium shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-300 disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save profile'}
            </button>
            <button
              onClick={handleClearData}
              className="flex-1 px-5 py-3 bg-red-500 text-white rounded-xl text-sm font-medium shadow-sm hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-300"
            >
              {localUser.language === 'english' ? 'Clear All Data' : localUser.language === 'hindi' ? 'सभी डेटा साफ करें' : 'બધો ડેટા સાફ કરો'}
            </button>
            <button
              onClick={handleLogout}
              className="flex-1 px-5 py-3 bg-indigo-600 text-white rounded-xl text-sm font-medium shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 flex items-center justify-center gap-2"
            >
              <FaSignOutAlt className="text-xs" />
              <span>{localUser.language === 'english' ? 'Logout' : localUser.language === 'hindi' ? 'लॉगआउट' : 'લોગઆઉટ'}</span>
            </button>
          </div>
        </div>
        {/* About */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-50 flex items-center gap-2">
              <FaCode className="text-pink-600" />
              <h3 className="text-sm font-semibold text-gray-800">
                {localUser.language === 'english' ? 'About MannMitra' : localUser.language === 'hindi' ? 'मनमित्र के बारे में' : 'મનમિત્ર વિશે'}
              </h3>
            </div>
            <div className="p-5">
              <p className="text-xs leading-relaxed text-gray-700 mb-4">
                {localUser.language === 'english' ? 'MannMitra is an AI-powered, multilingual productivity assistant that listens to your thoughts, understands your emotions, and gives back contextual motivation, quotes, and micro-plans — in your language and tone.' : localUser.language === 'hindi' ? 'मनमित्र एक AI संचालित, बहुभाषी उत्पादकता सहायक है जो आपके विचारों को सुनता है, आपकी भावनाओं को समझता है, और प्रासंगिक प्रेरणा, उद्धरण, और माइक्रो-प्लान देता है — आपकी भाषा और टोन में।' : 'મનમિત્ર એક AI-સંચાલિત, બહુભાષી ઉત્પાદકતા સહાયક છે જે તમારા વિચારોને સાંભળે છે, તમારી લાગણીઓને સમજે છે, અને પ્રાસંગિક પ્રેરણા, અવતરણો અને માઇક્રો-પ્લાન આપે છે - તમારી ભાષા અને ટોનમાં.'}
              </p>
              <div className="flex justify-center">
                <a
                  href="https://github.com/Khushishah224/MannMitra-A-Sentiment-Aware-AI-for-Productivity-and-Motivation"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-pink-600 hover:text-pink-700 text-sm font-medium"
                >
                  <FaGithub className="text-base" />
                  <span>GitHub</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
