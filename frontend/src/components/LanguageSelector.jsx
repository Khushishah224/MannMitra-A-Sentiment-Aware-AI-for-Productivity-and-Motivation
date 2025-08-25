import React from 'react';

const LanguageSelector = ({ currentLanguage, onLanguageChange, language, onChange }) => {
  // Support both naming conventions
  const selectedLanguage = language || currentLanguage;
  const handleChange = onChange || onLanguageChange;
  
  const languages = [
    { code: 'english', name: 'English' },
    { code: 'hindi', name: 'हिंदी' },
    { code: 'gujarati', name: 'ગુજરાતી' }
  ];

  return (
    <div className="flex items-center space-x-3">
      <span className="text-sm font-medium text-gray-600">Language:</span>
      <div className="relative">
        <select
          value={selectedLanguage}
          onChange={(e) => handleChange(e.target.value)}
          className="appearance-none bg-white border border-gray-200 rounded-lg px-4 py-2 pr-8 text-sm font-medium text-gray-700 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition-colors"
        >
          {languages.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.name}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default LanguageSelector;