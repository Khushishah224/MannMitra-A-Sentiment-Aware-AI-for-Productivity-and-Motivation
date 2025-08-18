import { useState } from 'react';
import { motion } from 'framer-motion';
import MoodSuggestionInput from './MoodSuggestionInput';
import { STRINGS } from '../i18n/strings';
import { updatePlan } from '../api';

// Simple time picker (HH:MM) 24-hour
function TimePicker({ value, onChange }) {
  return (
    <input
      type="time"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300"
    />
  );
}

export default function AssistantChat({ language = 'english', onPlanFinalized, userId }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', text: STRINGS.assistant.assistantIntro[language] || STRINGS.assistant.assistantIntro.english }
  ]);
  const [pendingPlan, setPendingPlan] = useState(null); // holds suggestion + createdPlan
  const [startTime, setStartTime] = useState('');

  const handleComplete = ({ createdPlan, suggestionText, responseText, mood }) => {
    // Show assistant summary and time picker
    setPendingPlan({ createdPlan, suggestionText, responseText, mood });

    setMessages((prev) => [
      ...prev,
      { role: 'assistant', text: (suggestionText || '') + (responseText ? `\n\n${responseText}` : '') }
    ]);
  };

  const finalizePlan = async () => {
    // If time selected and we have a created plan, persist scheduled_time
    try {
      if (pendingPlan?.createdPlan?.id && startTime) {
        await updatePlan(pendingPlan.createdPlan.id, { scheduled_time: startTime });
      }
    } catch (e) {
      // Non-fatal: still proceed
      console.error('Failed to set start time on plan:', e);
    }

    if (onPlanFinalized) {
      onPlanFinalized({ plan: pendingPlan?.createdPlan, startTime });
    }
    setMessages((prev) => [
      ...prev,
      { role: 'assistant', text: STRINGS.assistant.scheduledMsg[language] || STRINGS.assistant.scheduledMsg.english }
    ]);
    setPendingPlan(null);
    setStartTime('');
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

      {!pendingPlan && (
        <MoodSuggestionInput language={language} onComplete={handleComplete} userId={userId} />
      )}

  {pendingPlan && !pendingPlan?.createdPlan?.scheduled_time && (
        <div className="mt-4 p-4 border rounded-md bg-white shadow-sm">
          <div className="mb-3 text-sm font-medium text-gray-700">{STRINGS.assistant.pickTime[language] || STRINGS.assistant.pickTime.english}</div>
          <div className="flex items-center gap-3">
            <TimePicker value={startTime} onChange={setStartTime} />
            <button onClick={finalizePlan} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
              {STRINGS.assistant.schedule[language] || STRINGS.assistant.schedule.english}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
