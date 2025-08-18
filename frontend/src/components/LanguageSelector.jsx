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
    <div className="flex items-center space-x-2">
      <label className="text-sm text-gray-600">Language:</label>
      <select
        value={selectedLanguage}
        onChange={(e) => handleChange(e.target.value)}
        className="border rounded-md px-3 py-1 text-sm bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-pink-200"
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default LanguageSelector;
