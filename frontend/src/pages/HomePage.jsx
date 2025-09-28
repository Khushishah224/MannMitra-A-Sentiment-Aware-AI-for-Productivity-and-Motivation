import { useState, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import AssistantChat from '../components/AssistantChat';
import PeerPulseWidget from '../components/PeerPulseWidget';
import LanguageSelector from '../components/LanguageSelector';
import { useUser } from '../context/UserContext';
import { AuthContext } from '../context/AuthContext';
// Plan creation now handled inside MoodSuggestionInput; no direct createPlan here.
import toast from 'react-hot-toast';
import { STRINGS } from '../i18n/strings';

const HomePage = () => {
  const { user: userPrefs, updateUserPreferences } = useUser();
  const { user } = useContext(AuthContext);
  const [isLoading, setIsLoading] = useState(false);
  const [planCreated, setPlanCreated] = useState(false);
  const navigate = useNavigate();
  
  const language = userPrefs?.language || 'english';

  // Handle language change
  const handleLanguageChange = (newLanguage) => {
    updateUserPreferences({ language: newLanguage });
  };

  // Handle finalizing the plan from AssistantChat (optionally with start time)
  const handlePlanFinalized = async (data) => {
    // Child already created the plan; just update UI.
    setPlanCreated(true);
    toast.success('Plan created successfully!');
  };

  // Navigate to planner page
  const goToPlannerPage = () => {
    navigate('/planner');
  };

  // Welcome text localization
  const t = {
    welcome: STRINGS.app.title[language] || STRINGS.app.title.english,
    subtitle: STRINGS.app.subtitle[language] || STRINGS.app.subtitle.english,
    description: STRINGS.app.description[language] || STRINGS.app.description.english,
    viewPlanner: STRINGS.planner.viewPlanner[language] || STRINGS.planner.viewPlanner.english,
    createAnother: STRINGS.planner.createAnother[language] || STRINGS.planner.createAnother.english,
  };

  return (
    <div className="container mx-auto px-4 pb-20 pt-4">
      <Header title={t.welcome} subtitle={t.subtitle} />
      
      <div className="mb-6">
        <LanguageSelector 
          language={language}
          onChange={handleLanguageChange}
        />
      </div>
      
      <div className="max-w-md mx-auto space-y-4">
  <PeerPulseWidget hidden={user?.show_peer_pulse === false} />
        <AnimatePresence mode="wait">
      {!planCreated ? (
            <motion.div
              key="mood-input"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <p className="text-gray-600 mb-6 text-center">
                {t.description}
              </p>
              
        <AssistantChat language={language} onPlanFinalized={handlePlanFinalized} userId={user?.id} />
            </motion.div>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="text-center"
            >
              <motion.div 
                className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20 }}
              >
                <svg className="w-12 h-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </motion.div>
              
              <h3 className="text-xl font-medium text-gray-900 mb-2">{STRINGS.planner.createdTitle[language] || STRINGS.planner.createdTitle.english}</h3>
              
              <p className="text-gray-600 mb-6">{STRINGS.planner.createdDesc[language] || STRINGS.planner.createdDesc.english}</p>
              
              <div className="space-y-3">
                <button
                  onClick={goToPlannerPage}
                  className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                >
                  {t.viewPlanner}
                </button>
                
                <button
                  onClick={() => setPlanCreated(false)}
                  className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  {t.createAnother}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default HomePage;
