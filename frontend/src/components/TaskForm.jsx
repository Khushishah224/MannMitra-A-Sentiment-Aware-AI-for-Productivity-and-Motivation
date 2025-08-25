import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import SubjectSelector from './SubjectSelector';
import { createUserSubject } from '../api/userSubjects';
import toast from 'react-hot-toast';
import { getUserPlans } from '../api';
import { hasOverlap as utilHasOverlap, computeNextFree as utilComputeNextFree, parseTimeToMinutes, minutesToHHMM } from '../utils/timeConflicts';
import { STRINGS } from '../i18n/strings';

const TaskForm = ({ 
  task, 
  onTaskChange, 
  onSubmit, 
  onCancel,
  isLoading,
  language = 'english'
}) => {
  const [showSubjectSelector, setShowSubjectSelector] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [timeConflict, setTimeConflict] = useState(false);
  const [suggestedTime, setSuggestedTime] = useState('');
  const [pastTime, setPastTime] = useState(false);

  // Update the task title when a subject is selected
  useEffect(() => {
    if (selectedSubject && task.category) {
      const prefix = task.category.charAt(0).toUpperCase() + task.category.slice(1);
      onTaskChange({ 
        ...task, 
        title: `${prefix} - ${selectedSubject}`,
        subject: selectedSubject  // Store the subject separately for reference
      });
    }
  }, [selectedSubject, task.category]);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    onTaskChange({
      ...task,
      [name]: name === 'duration_minutes' ? parseInt(value) : value
    });
  };

  // Live conflict + past time detection when scheduled_time or duration changes
  useEffect(() => {
    let active = true;
    (async () => {
      const start = task.scheduled_time;
      if (!start) { if(active){setTimeConflict(false);setSuggestedTime('');setPastTime(false);} return; }
      // Past time check (today basis)
      const now = new Date();
      const nowMinutes = now.getHours()*60 + now.getMinutes();
      const startMinutes = parseTimeToMinutes(start);
      if (active) setPastTime(startMinutes != null && startMinutes < nowMinutes);
      try {
        const res = await getUserPlans();
        const plans = res?.plans || [];
        const conflict = utilHasOverlap(plans, start, task.duration_minutes || 0);
        if (!active) return;
        setTimeConflict(conflict);
        if (conflict) {
          const next = utilComputeNextFree(plans, start, task.duration_minutes || 0);
          setSuggestedTime(next || '');
        } else {
          setSuggestedTime('');
        }
      } catch {
        if (active) { setTimeConflict(false); setSuggestedTime(''); }
      }
    })();
    return () => { active = false; };
  }, [task.scheduled_time, task.duration_minutes]);

  // Handle subject selection
  const handleSubjectSelect = (subject) => {
    setSelectedSubject(subject);
    // Keep selector open so user can adjust other fields after selecting
    // setShowSubjectSelector(false);
  };

  // Handle custom subject creation
  const handleAddCustomSubject = async (name) => {
    try {
      const result = await createUserSubject({
        name,
        category: task.category,
        is_favorite: false
      });
      // Immediately select the newly created subject
      if (result && result.name) {
        setSelectedSubject(result.name);
      }
      return true;
    } catch (err) {
      console.error('Error creating custom subject:', err);
      toast.error('Failed to save custom subject');
      return false;
    }
  };

  // Localized strings (now using STRINGS plus local fallback for form items not in STRINGS)
  const lf = {
    taskTitle: { english:'Task Title', hindi:'कार्य शीर्षक', gujarati:'કાર્ય શીર્ષક' },
    description: { english:'Description', hindi:'विवरण', gujarati:'વર્ણન' },
    category: { english:'Category', hindi:'श्रेणी', gujarati:'શ્રેણી' },
    duration: { english:'Duration (minutes)', hindi:'अवधि (मिनट)', gujarati:'સમયગાળો (મિનિટ)' },
    create: { english:'Create', hindi:'बनाएं', gujarati:'બનાવો' },
    cancel: { english:'Cancel', hindi:'रद्द करें', gujarati:'રદ કરો' },
    chooseSubject: { english:'Choose Subject', hindi:'विषय चुनें', gujarati:'વિષય પસંદ કરો' },
    selectSubject: { english:'Select a subject', hindi:'एक विषय चुनें', gujarati:'વિષય પસંદ કરો' },
    study: { english:'Study', hindi:'अध्ययन', gujarati:'અભ્યાસ' },
    work: { english:'Work', hindi:'काम', gujarati:'કામ' },
    personal: { english:'Personal', hindi:'व्यक्तिगत', gujarati:'વ્યક્તિગત' },
    other: { english:'Other', hindi:'अन्य', gujarati:'અન્ય' },
    past: { english:'Selected time is in the past.', hindi:'चयनित समय अतीत में है।', gujarati:'પસંદ કરેલો સમય ભૂતકાળમાં છે.' },
  };
  const t = Object.fromEntries(Object.entries(lf).map(([k,v]) => [k, v[language] || v.english]));
  const cStr = STRINGS?.planner?.conflict;
  const conflictMsg = cStr?.overlap?.[language] || cStr?.overlap?.english || 'Time overlaps with another task.';
  const nextFreeLabel = cStr?.nextFree?.[language] || cStr?.nextFree?.english || 'Next free time:';
  const useLabel = cStr?.use?.[language] || cStr?.use?.english || 'Use';

  // Allow parent to pass scheduled_time by binding to task.scheduled_time if present

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
          {t.taskTitle}
        </label>
        <div className="mt-1 relative">
          <input
            type="text"
            id="title"
            name="title"
            value={task.title}
            onChange={handleInputChange}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            required
          />
          <button
            type="button"
            onClick={() => setShowSubjectSelector(!showSubjectSelector)}
            className="absolute right-2 top-2 text-sm text-indigo-600 hover:text-indigo-800"
          >
            {t.chooseSubject}
          </button>
        </div>
        
        {showSubjectSelector && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-2 p-3 bg-gray-50 border rounded-md"
          >
            <h4 className="text-sm font-medium mb-2">{t.selectSubject}</h4>
            <SubjectSelector
              category={task.category}
              value={selectedSubject}
              onChange={handleSubjectSelect}
              onAddNew={handleAddCustomSubject}
            />
          </motion.div>
        )}
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          {t.description}
        </label>
        <textarea
          id="description"
          name="description"
          value={task.description}
          onChange={handleInputChange}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 resize-none h-24"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700">
            {t.category}
          </label>
          <select
            id="category"
            name="category"
            value={task.category}
            onChange={(e) => {
              handleInputChange(e);
              // Reset selected subject when category changes
              setSelectedSubject('');
            }}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          >
            <option value="study">{t.study}</option>
            <option value="work">{t.work}</option>
            <option value="personal">{t.personal}</option>
            <option value="other">{t.other}</option>
          </select>
        </div>

        <div>
          <label htmlFor="duration_minutes" className="block text-sm font-medium text-gray-700">
            {t.duration}
          </label>
          <input
            type="number"
            id="duration_minutes"
            name="duration_minutes"
            min="5"
            max="180"
            value={task.duration_minutes}
            onChange={handleInputChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      </div>

      <div>
        <label htmlFor="scheduled_time" className="block text-sm font-medium text-gray-700">
          {language==='hindi' ? 'प्रारंभ समय (वैकल्पिक)' : language==='gujarati' ? 'પ્રારંભ સમય (વૈકલ્પિક)' : 'Start Time (optional)'}
        </label>
        <input
          type="time"
          id="scheduled_time"
          name="scheduled_time"
          value={task.scheduled_time || ''}
          min={minutesToHHMM(new Date().getHours()*60 + new Date().getMinutes())}
          onChange={handleInputChange}
          className={`mt-1 block w-full px-3 py-2 border ${timeConflict? 'border-red-500':'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`}
        />
        {(timeConflict || pastTime) && (
          <div className="mt-1 space-y-1">
            {timeConflict && <p className="text-xs text-red-600">{conflictMsg}</p>}
            {timeConflict && suggestedTime && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-gray-600">{nextFreeLabel} <span className="font-semibold">{suggestedTime}</span></span>
                <button type="button" onClick={() => onTaskChange({ ...task, scheduled_time: suggestedTime })} className="px-2 py-0.5 bg-indigo-600 text-white rounded hover:bg-indigo-700">{useLabel}</button>
              </div>
            )}
            {pastTime && <p className="text-xs text-amber-600">{t.past}</p>}
          </div>
        )}
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          {t.cancel}
        </button>
        <button
          type="submit"
          disabled={isLoading || !task.title.trim() || timeConflict || pastTime}
          className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
            (isLoading || !task.title.trim() || timeConflict || pastTime) ? 'opacity-70 cursor-not-allowed' : ''
          }`}
        >
          {isLoading ? '...' : t.create}
        </button>
      </div>
    </form>
  );
};

export default TaskForm;
