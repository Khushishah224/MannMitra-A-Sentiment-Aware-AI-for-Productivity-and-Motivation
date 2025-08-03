import React, { useState } from 'react';

const MoodInput = ({ onSubmit, language }) => {
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const placeholderText = {
    english: "How are you feeling today?",
    hindi: "आज आप कैसा महसूस कर रहे हैं?",
    gujarati: "આજે તમે કેવું અનુભવી રહ્યા છો?"
  };

  const buttonText = {
    english: "Share",
    hindi: "शेयर करें",
    gujarati: "શેર કરો"
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    
    setIsSubmitting(true);
    
    try {
      await onSubmit(text);
      setText(''); // Clear input after successful submit
    } catch (error) {
      console.error('Error in mood submission:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="relative">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={placeholderText[language] || placeholderText.english}
          className="w-full p-4 border rounded-lg shadow-sm focus:ring-2 focus:ring-pink-200 focus:border-pink-300 resize-none h-24"
          disabled={isSubmitting}
        />
        
        <button
          type="submit"
          disabled={!text.trim() || isSubmitting}
          className={`mt-3 px-6 py-2 rounded-full font-medium text-white shadow-md 
            ${!text.trim() || isSubmitting ? 'bg-pink-300' : 'bg-pink-500 hover:bg-pink-600'} 
            transition-colors`}
        >
          {isSubmitting ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </span>
          ) : (
            buttonText[language] || buttonText.english
          )}
        </button>
      </div>
    </form>
  );
};

export default MoodInput;
