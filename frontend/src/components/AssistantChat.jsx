import { useState } from 'react';
import { motion } from 'framer-motion';
import MoodSuggestionInput from './MoodSuggestionInput';
import { STRINGS } from '../i18n/strings';

export default function AssistantChat({ language = 'english', onPlanFinalized, userId }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', text: STRINGS.assistant.assistantIntro[language] || STRINGS.assistant.assistantIntro.english }
  ]);

  const handleComplete = ({ planData, suggestionText, responseText, mood }) => {
    // Build assistant summary
    let responseMessage = '';
    if (mood?.empathetic_response) {
      responseMessage += mood.empathetic_response + '\n\n';
    }
    responseMessage += (suggestionText || '') + (responseText ? `\n\n${responseText}` : '');

    setMessages((prev) => [...prev, { role: 'assistant', text: responseMessage }]);

    // Do NOT create plan here; child already persisted it. Just bubble up.
    if (onPlanFinalized) onPlanFinalized({ planData });
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="space-y-3 mb-4">
        {messages.map((m, idx) => (
          <motion.div key={idx} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`p-3 rounded-md ${m.role === 'assistant' ? 'bg-gray-50' : 'bg-indigo-50'}`}>
            <div className="whitespace-pre-wrap text-sm text-gray-800">{m.text}</div>
          </motion.div>
        ))}
      </div>

      <MoodSuggestionInput language={language} onComplete={handleComplete} userId={userId} />
    </div>
  );
}
