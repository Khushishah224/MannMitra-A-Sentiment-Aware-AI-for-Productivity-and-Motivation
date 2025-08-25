import React, { useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { apiClient } from '../api';

const DecisionHelper = ({ language = 'english' }) => {
  const [option1, setOption1] = useState('');
  const [option2, setOption2] = useState('');
  const [context, setContext] = useState('');
  const [mood, setMood] = useState('');
  const [loading, setLoading] = useState(false);
  const [decision, setDecision] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!option1 || !option2) {
      toast.error('Please provide both options');
      return;
    }
    
    if (!context) {
      toast.error('Please provide some context for your decision');
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await apiClient.post('/decision/', {
        option1,
        option2,
        context,
        mood: mood || 'neutral'
      });
      
      setDecision(response.data);
    } catch (error) {
      console.error('Error getting decision:', error);
      toast.error('Failed to analyze your decision. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleReset = () => {
    setDecision(null);
    setOption1('');
    setOption2('');
    setContext('');
    setMood('');
  };

  const titleText = {
    english: "Decision Helper",
    hindi: "निर्णय सहायक",
    gujarati: "નિર્ણય સહાયક"
  };
  
  const subtitleText = {
    english: "Can't decide between two options? Let me help.",
    hindi: "दो विकल्पों के बीच निर्णय नहीं ले पा रहे हैं? मैं मदद करता हूं।",
    gujarati: "બે વિકલ્પો વચ્ચે નિર્ણય લઈ શકતા નથી? મને મદદ કરવા દો."
  };
  
  const placeholders = {
    english: {
      option1: "Option 1 (e.g., Study for exam)",
      option2: "Option 2 (e.g., Go to a friend's party)",
      context: "Tell me about your situation (e.g., I have an exam in 2 days but I'm feeling tired...)",
      mood: "How are you feeling? (e.g., tired, happy, stressed)"
    },
    hindi: {
      option1: "विकल्प 1 (जैसे, परीक्षा के लिए अध्ययन करें)",
      option2: "विकल्प 2 (जैसे, दोस्त की पार्टी में जाएं)",
      context: "अपनी स्थिति के बारे में बताएं (जैसे, मेरी 2 दिन में परीक्षा है लेकिन मैं थका हुआ महसूस कर रहा हूं...)",
      mood: "आप कैसा महसूस कर रहे हैं? (जैसे, थका हुआ, खुश, तनावग्रस्त)"
    },
    gujarati: {
      option1: "વિકલ્પ 1 (દા.ત., પરીક્ષા માટે અભ્યાસ કરો)",
      option2: "વિકલ્પ 2 (દા.ત., મિત્રની પાર્ટીમાં જાઓ)",
      context: "તમારી પરિસ્થિતિ વિશે મને કહો (દા.ત., મને 2 દિવસમાં પરીક્ષા છે પરંતુ હું થાકેલો અનુભવું છું...)",
      mood: "તમે કેવું અનુભવો છો? (દા.ત., થાકેલા, ખુશ, તણાવગ્રસ્ત)"
    }
  };
  
  const buttonText = {
    english: {
      submit: "Help Me Decide",
      loading: "Analyzing...",
      reset: "Start Over"
    },
    hindi: {
      submit: "मुझे निर्णय लेने में मदद करें",
      loading: "विश्लेषण हो रहा है...",
      reset: "फिर से शुरू करें"
    },
    gujarati: {
      submit: "મને નિર્ણય લેવામાં મદદ કરો",
      loading: "વિશ્લેષણ કરી રહ્યું છે...",
      reset: "ફરીથી શરૂ કરો"
    }
  };
  
  const currentLang = language || 'english';
  
  return (
    <div className="w-full max-w-2xl mx-auto">
      {!decision ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-lg border border-gray-100/50 overflow-hidden"
        >
          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Options Grid */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    <div className="flex items-center mb-2">
                      <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center mr-2">
                        <span className="text-white text-xs font-bold">A</span>
                      </div>
                      {currentLang === 'english' ? 'Option A' : currentLang === 'hindi' ? 'विकल्प A' : 'વિકલ્પ A'}
                    </div>
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 bg-white/80 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 placeholder-gray-400"
                    value={option1}
                    onChange={(e) => setOption1(e.target.value)}
                    placeholder={placeholders[currentLang]?.option1 || placeholders.english.option1}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    <div className="flex items-center mb-2">
                      <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mr-2">
                        <span className="text-white text-xs font-bold">B</span>
                      </div>
                      {currentLang === 'english' ? 'Option B' : currentLang === 'hindi' ? 'विकल्प B' : 'વિકલ્પ B'}
                    </div>
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 bg-white/80 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-200 placeholder-gray-400"
                    value={option2}
                    onChange={(e) => setOption2(e.target.value)}
                    placeholder={placeholders[currentLang]?.option2 || placeholders.english.option2}
                    required
                  />
                </div>
              </div>
              
              {/* Context */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  <div className="flex items-center mb-2">
                    <div className="w-6 h-6 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center mr-2">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                      </svg>
                    </div>
                    {currentLang === 'english' ? 'Context & Situation' : currentLang === 'hindi' ? 'संदर्भ और स्थिति' : 'સંદર્भ અને પરિસ્થિતિ'}
                  </div>
                </label>
                <textarea
                  className="w-full px-4 py-3 bg-white/80 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200 placeholder-gray-400 resize-none"
                  rows="4"
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  placeholder={placeholders[currentLang]?.context || placeholders.english.context}
                  required
                />
              </div>
              
              {/* Mood */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  <div className="flex items-center mb-2">
                    <div className="w-6 h-6 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center mr-2">
                      <span className="text-white text-xs">😊</span>
                    </div>
                    {currentLang === 'english' ? 'Current Mood (Optional)' : 
                     currentLang === 'hindi' ? 'वर्तमान मूड (वैकल्पिक)' : 
                     'વર્તમાન મૂડ (વૈકલ્પિક)'}
                  </div>
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 bg-white/80 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all duration-200 placeholder-gray-400"
                  value={mood}
                  onChange={(e) => setMood(e.target.value)}
                  placeholder={placeholders[currentLang]?.mood || placeholders.english.mood}
                />
              </div>
              
              {/* Submit Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className={`w-full py-4 px-6 rounded-xl text-white font-semibold text-lg shadow-lg transition-all duration-200 ${
                  loading 
                    ? 'bg-gradient-to-r from-gray-400 to-gray-500 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 hover:shadow-xl'
                }`}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
                    {buttonText[currentLang]?.loading || buttonText.english.loading}
                  </div>
                ) : (
                  buttonText[currentLang]?.submit || buttonText.english.submit
                )}
              </motion.button>
            </form>
          </div>
        </motion.div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} 
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-6"
        >
          {/* Result Header */}
          <div className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-lg border border-gray-100/50 p-8 text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              {currentLang === 'english' ? 'Decision Analysis Complete' : 
               currentLang === 'hindi' ? 'निर्णय विश्लेषण पूर्ण' : 
               'નિર્ણય વિશ્લેષણ પૂર્ણ'}
            </h3>
            <p className="text-gray-600">
              {currentLang === 'english' ? 'Here\'s what our analysis suggests' : 
               currentLang === 'hindi' ? 'यहाँ है जो हमारा विश्लेषण सुझाता है' : 
               'અહીં છે જે અમારું વિશ્લેષણ સૂચવે છે'}
            </p>
          </div>

          {/* Recommendation Card */}
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-3xl border border-emerald-100 p-8">
            <div className="flex justify-between items-start mb-6">
              <h4 className="text-xl font-bold text-emerald-800">
                {currentLang === 'english' ? 'Our Recommendation' : 
                 currentLang === 'hindi' ? 'हमारी अनुशंसा' : 
                 'અમારી ભલામણ'}
              </h4>
              <div className="bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full">
                <span className="text-emerald-800 font-bold text-lg">
                  {decision.confidence}%
                </span>
                <span className="text-emerald-600 text-sm ml-1">
                  {currentLang === 'english' ? 'confidence' : 
                   currentLang === 'hindi' ? 'विश्वास' : 
                   'વિશ્વાસ'}
                </span>
              </div>
            </div>
            <p className="text-emerald-900 text-lg font-semibold leading-relaxed">
              {decision.recommendation}
            </p>
          </div>

          {/* Score Comparison */}
          <div className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-lg border border-gray-100/50 p-8">
            <h4 className="text-lg font-bold text-gray-800 mb-6 text-center">
              {currentLang === 'english' ? 'Option Comparison' : 
               currentLang === 'hindi' ? 'विकल्प तुलना' : 
               'વિકલ્પ તુલના'}
            </h4>
            
            <div className="space-y-4">
              {/* Option Labels */}
              <div className="flex justify-between text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-indigo-500 rounded mr-2"></div>
                  {option1}
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded mr-2"></div>
                  {option2}
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="relative h-8 bg-gray-100 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${decision.option1_score}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="absolute left-0 top-0 h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-l-full flex items-center justify-end pr-3"
                >
                  <span className="text-white text-xs font-bold">
                    {decision.option1_score}%
                  </span>
                </motion.div>
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${decision.option2_score}%` }}
                  transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
                  className="absolute right-0 top-0 h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-r-full flex items-center justify-start pl-3"
                >
                  <span className="text-white text-xs font-bold">
                    {decision.option2_score}%
                  </span>
                </motion.div>
              </div>
            </div>
          </div>

          {/* Explanation */}
          <div className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-lg border border-gray-100/50 p-8">
            <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
              <div className="w-6 h-6 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center mr-3">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              {currentLang === 'english' ? 'Why This Decision?' : 
               currentLang === 'hindi' ? 'यह निर्णय क्यों?' : 
               'આ નિર્ણય શા માટે?'}
            </h4>
            <p className="text-gray-700 leading-relaxed">
              {decision.explanation}
            </p>
          </div>

          {/* Factors Analysis */}
          <div className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-lg border border-gray-100/50 p-8">
            <h4 className="text-lg font-bold text-gray-800 mb-6 text-center">
              {currentLang === 'english' ? 'Analysis Factors' : 
               currentLang === 'hindi' ? 'विश्लेषण कारक' : 
               'વિશ્લેષણ પરિબળો'}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Object.entries(decision.factors).map(([factor, value]) => (
                <motion.div 
                  key={factor}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-center p-4 bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-100"
                >
                  <div className="text-sm font-semibold text-gray-600 mb-3">
                    {factor === 'time_pressure' ? 
                      (currentLang === 'english' ? 'Time Pressure' : 
                       currentLang === 'hindi' ? 'समय दबाव' : 
                       'સમય દબાણ') :
                     factor === 'fatigue' ?
                      (currentLang === 'english' ? 'Fatigue Level' : 
                       currentLang === 'hindi' ? 'थकान स्तर' : 
                       'થાકનું સ્તર') :
                     factor === 'task_importance' ?
                      (currentLang === 'english' ? 'Importance' : 
                       currentLang === 'hindi' ? 'महत्व' : 
                       'મહત્વ') : factor}
                  </div>
                  <div className="relative w-20 h-20 mx-auto mb-2">
                    <svg className="transform -rotate-90 w-20 h-20">
                      <circle
                        cx="40"
                        cy="40"
                        r="30"
                        stroke="currentColor"
                        strokeWidth="6"
                        fill="transparent"
                        className="text-gray-200"
                      />
                      <motion.circle
                        cx="40"
                        cy="40"
                        r="30"
                        stroke="currentColor"
                        strokeWidth="6"
                        fill="transparent"
                        strokeDasharray={`${2 * Math.PI * 30}`}
                        initial={{ strokeDashoffset: 2 * Math.PI * 30 }}
                        animate={{ strokeDashoffset: 2 * Math.PI * 30 * (1 - value / 10) }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className={
                          factor === 'time_pressure' ? 'text-amber-500' :
                          factor === 'fatigue' ? 'text-blue-500' :
                          'text-purple-500'
                        }
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xl font-bold text-gray-800">
                        {value}/10
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Practical Advice */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl border border-blue-100 p-8">
            <h4 className="text-lg font-bold text-blue-800 mb-4 flex items-center">
              <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center mr-3">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
              {currentLang === 'english' ? 'Actionable Advice' : 
               currentLang === 'hindi' ? 'व्यावहारिक सलाह' : 
               'વ્યવહારિક સલાહ'}
            </h4>
            <div className="text-blue-900 leading-relaxed whitespace-pre-wrap">
              {decision.advice}
            </div>
          </div>

          {/* Reset Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleReset}
            className="w-full py-4 px-6 rounded-xl text-indigo-600 font-semibold text-lg bg-white/70 backdrop-blur-sm border border-indigo-200 hover:bg-indigo-50 transition-all duration-200 shadow-lg"
          >
            {buttonText[currentLang]?.reset || buttonText.english.reset}
          </motion.button>
        </motion.div>
      )}
    </div>
  );
};

export default DecisionHelper;