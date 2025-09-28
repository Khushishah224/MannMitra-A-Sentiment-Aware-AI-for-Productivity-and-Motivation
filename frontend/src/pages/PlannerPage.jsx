import { useState, useEffect, useContext, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '../components/Header';
import LanguageSelector from '../components/LanguageSelector';
import TaskList from '../components/TaskList';
import CalendarAnalytics from '../components/CalendarAnalytics';
import MoodBadge from '../components/MoodBadge';
import CustomSubjectForm from '../components/CustomSubjectForm';
import TaskForm from '../components/TaskForm';
import { useUser } from '../context/UserContext';
import { AuthContext } from '../context/AuthContext';
import { createPlan, getUserPlans, updatePlan } from '../api';
import { hasOverlap as utilHasOverlap, computeNextFree as utilComputeNextFree, computeChainShifts, applyChainShifts } from '../utils/timeConflicts';
import { FaPlus, FaRegLightbulb, FaFilter, FaTags, FaTimes } from 'react-icons/fa';
import toast from 'react-hot-toast';

const PlannerPage = () => {
  const { user: userPrefs, updateUserPreferences } = useUser();
  const { user } = useContext(AuthContext);
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    category: 'study',
    duration_minutes: 30,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null); // YYYY-MM-DD

  // Helper to get local (not UTC) YYYY-MM-DD string
  const getLocalYMD = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  };

  const todayLocalYMD = getLocalYMD();
  const todayDisplay = (() => { const d=new Date(); return `${d.getDate()}-${d.getMonth()+1}-${d.getFullYear()}`; })();
  const [showCustomSubjectForm, setShowCustomSubjectForm] = useState(false);
  const [selectedCustomCategory, setSelectedCustomCategory] = useState('study');
  const [createStartTime, setCreateStartTime] = useState('');
  const [createTimeConflict, setCreateTimeConflict] = useState(false);
  const [createSuggestedFree, setCreateSuggestedFree] = useState('');
  const remindedRef = useRef({}); // planId -> true
  const autoReschedNotified = useRef(new Set()); // planIds already notified for auto-reschedule

  const language = userPrefs?.language || 'english';

  // Fetch user plans when component mounts
  useEffect(() => {
    if (user) {
      fetchUserPlans();
    }
  }, [user]);

  // Poll plans periodically to catch background auto-reschedules
  useEffect(() => {
    if (!user) return;
    const timer = setInterval(async () => {
      try {
        const response = await getUserPlans();
        const plans = response.plans || [];
        let changed = false;
        
        // Comment out toast notifications for auto-rescheduled tasks
        /* 
        plans.forEach((p) => {
          // Only show notification for newly detected auto-rescheduled tasks
          if (p?.auto_rescheduled && !autoReschedNotified.current.has(p.id)) {
            autoReschedNotified.current.add(p.id);
            // Show a more descriptive message if conflict was resolved
            if (p.conflict_resolved) {
              toast?.(`Auto-rescheduled (conflict resolved): ${p.title} to ${p.scheduled_time}`, { icon: '🔄' });
            } else {
              toast?.(`Auto-rescheduled: ${p.title} to ${p.scheduled_time}`, { icon: '📅' });
            }
          }
        });
        */
        
        // Update tasks if there is any delta in length or scheduled_time fields differ
        if (JSON.stringify(plans) !== JSON.stringify(tasks)) {
          changed = true;
        }
        if (changed) setTasks(plans);
      } catch (_) {}
    }, 120000); // 2 minutes
    return () => clearInterval(timer);
  }, [user, tasks]);

  // Ask for Notification permission once
  useEffect(() => {
    try {
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().catch(() => {});
      }
    } catch (_) {}
  }, []);

  // Lightweight reminder: toast when scheduled_time is reached (or reminder lead minutes before)
  useEffect(() => {
    if (!tasks || tasks.length === 0) return;
    const timer = setInterval(() => {
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      const current = `${hh}:${mm}`;
      tasks.forEach((t) => {
        if (!t || !t.scheduled_time || remindedRef.current[t.id]) return;
        const st = typeof t.scheduled_time === 'string' ? t.scheduled_time : '';
        if (!st) return;
        // Trigger when exact minute matches or reminder lead window, and task is actionable
        let shouldNotify = st === current;
        try {
          if (!shouldNotify && typeof t.reminder_lead_minutes === 'number') {
            const [th, tm] = st.split(':').map(Number);
            const scheduled = new Date();
            scheduled.setHours(th || 0, tm || 0, 0, 0);
            const leadMs = (t.reminder_lead_minutes || 0) * 60 * 1000;
            const diff = scheduled.getTime() - now.getTime();
            // If we're within this minute window of lead time
            if (diff <= leadMs && diff > leadMs - 60000) shouldNotify = true;
          }
        } catch (_) {}

        if ((t.status === 'pending' || t.status === 'in_progress') && shouldNotify) {
          remindedRef.current[t.id] = true;
          try {
            // Toast reminder (non-blocking)
            // eslint-disable-next-line no-undef
            toast?.(`It's time: ${t.title}`, { icon: '⏰' });
            if ('Notification' in window && Notification.permission === 'granted') {
              const cat = (t.category || 'Task').toString();
              const body = `${cat.toUpperCase()} • ${t.duration_minutes} min`;
              new Notification('Time to start', { body });
            }
          } catch (_) {}
        }
      });
    }, 30000); // check every 30s
    return () => clearInterval(timer);
  }, [tasks]);

  const fetchUserPlans = async () => {
    setIsLoading(true);
    try {
      const response = await getUserPlans();
      const plans = response.plans || [];
      // Notify user for any newly auto-rescheduled tasks - disabled
      try {
        plans.forEach((p) => {
          if (p?.auto_rescheduled && !autoReschedNotified.current.has(p.id)) {
            autoReschedNotified.current.add(p.id);
            // Disabled toast messages
            /*
            if (p.conflict_resolved) {
              toast?.(`Auto-rescheduled (conflict resolved): ${p.title} to ${p.scheduled_time}`, { icon: '🔄' });
            } else {
              toast?.(`Auto-rescheduled: ${p.title} to ${p.scheduled_time}`, { icon: '📅' });
            }
            */
          }
        });
      } catch (_) {}
      setTasks(plans);
    } catch (error) {
      console.error('Error fetching plans:', error);
      toast.error('Failed to load your tasks. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle language change
  const handleLanguageChange = (newLanguage) => {
    updateUserPreferences({ language: newLanguage });
  };

  // Toggle task creation form
  const toggleCreateTask = () => {
    setIsCreating(!isCreating);
    // Reset form if closing
    if (isCreating) {
      setNewTask({
        title: '',
        description: '',
        category: 'study',
        duration_minutes: 30,
      });
      setShowCustomSubjectForm(false);
    }
  };
  
  // Toggle custom subject form
  const toggleCustomSubjectForm = () => {
    setShowCustomSubjectForm(!showCustomSubjectForm);
    if (!showCustomSubjectForm) {
      // Set the selected category to the current task category
      setSelectedCustomCategory(newTask.category);
    }
  };

  // Handle input changes for new task
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewTask({
      ...newTask,
      [name]: name === 'duration_minutes' ? parseInt(value) : value
    });
    
    // If category changes, update the selected custom category
    if (name === 'category') {
      setSelectedCustomCategory(value);
    }
  };

  // Local helper: compute conflict for proposed start time
  const hasLocalTimeConflict = async (proposedStartTime, duration) => {
    if (!proposedStartTime) return false;
    try { const res = await getUserPlans(); return utilHasOverlap(res?.plans||[], proposedStartTime, duration); } catch { return false; }
  };

  const computeNextFreeStart = async (desiredStart, duration) => {
    if (!desiredStart) return '';
    try { const res = await getUserPlans(); return utilComputeNextFree(res?.plans||[], desiredStart, duration); } catch { return ''; }
  };

  useEffect(() => {
    let active = true;
    (async () => {
      if (!createStartTime) { setCreateTimeConflict(false); setCreateSuggestedFree(''); return; }
      const conflict = await hasLocalTimeConflict(createStartTime, newTask.duration_minutes || 30);
      if (!active) return;
      setCreateTimeConflict(conflict);
      if (conflict) {
        const nextFree = await computeNextFreeStart(createStartTime, newTask.duration_minutes || 30);
        if (active) setCreateSuggestedFree(nextFree);
      } else setCreateSuggestedFree('');
    })();
    return () => { active = false; };
  }, [createStartTime, newTask.duration_minutes]);

  // Submit new task
  const handleSubmitTask = async (e) => {
    e.preventDefault();
    
    if (!newTask.title.trim()) {
      toast.error('Please enter a task title.');
      return;
    }
    if (createTimeConflict) {
      toast.error(language==='hindi' ? 'समय संघर्ष को हल करें।' : language==='gujarati' ? 'સમય સંઘર્ષ ઉકેલો.' : 'Resolve time conflict before creating.');
      return;
    }

    setIsLoading(true);
    try {
      await createPlan({
        ...newTask,
        status: 'pending',
        ...(createStartTime ? { scheduled_time: createStartTime } : {})
      });
  // Fire and forget peer pulse representing current activity
  try { fetch(`${import.meta.env.VITE_BACKEND_BASE_URL || 'http://localhost:8000'}/peerpulse`, { method:'POST', headers:{'Content-Type':'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')||''}`}, body: JSON.stringify({ activity: newTask.category, mood: 'focused' }) }); } catch(_) {}
      toast.success('Task created successfully!');
      setIsCreating(false);
      setNewTask({ title: '', description: '', category: 'study', duration_minutes: 30 });
      setCreateStartTime('');
      fetchUserPlans();
    } catch (error) {
      // First check for 409 time conflict
      const status = error?.response?.status;
      const detail = error?.response?.data?.detail;
      
      // Handle time conflict (409)
      if (status === 409 && detail?.code === 'TIME_CONFLICT') {
        const ep = detail.existing_plan || {};
        const existingTitle = ep.title || 'Existing task';
        const existingTime = ep.scheduled_time || '';
        // Offer quick choices: reschedule existing by +newTask.duration OR reschedule new by +newTask.duration
        const choice = window.confirm(`${existingTitle} at ${existingTime} overlaps.
Click OK to reschedule existing by +${newTask.duration_minutes} min, or Cancel to reschedule the new task by +${newTask.duration_minutes} min.`);
        try {
          if (choice && ep.id) {
            // Reschedule existing: push by duration
            // Apply chain shift starting from existing overlapping task
            const plansRes = await getUserPlans();
            const shifts = computeChainShifts(plansRes?.plans||[], existingTime, ep.duration_minutes || newTask.duration_minutes || 0);
            if (shifts.length>0) {
              await applyChainShifts(shifts, updatePlan);
              toast.success('Chain shifted. Try creating again.');
            } else {
              toast.success('Existing task moved. Retry.');
            }
          } else {
            // Reschedule new: push by duration and retry
            const nextFree = await computeNextFreeStart(createStartTime || existingTime, newTask.duration_minutes || 30) || '';
            const payload = { ...newTask, status: 'pending', ...(nextFree? { scheduled_time: nextFree } : {}) };
            await createPlan(payload);
            toast.success(nextFree? `Created at next free ${nextFree}` : 'New task created.');
            setIsCreating(false);
            setNewTask({ title: '', description: '', category: 'study', duration_minutes: 30 });
            fetchUserPlans();
          }
        } catch (e2) {
          console.error('Conflict resolution failed:', e2);
          toast.error('Could not resolve schedule conflict. Please adjust times manually.');
        }
      } 
      // Handle 500 errors that contain time conflict information 
      else if (status === 500 && error?.response?.data?.detail) {
        // Try to extract conflict information from 500 error
        try {
          const errorDetail = error.response.data.detail;
          let conflictInfo;
          
          // Check if this is a string that contains JSON
          if (typeof errorDetail === 'string' && errorDetail.includes('TIME_CONFLICT')) {
            // Try to parse the string
            const match = errorDetail.match(/{.*}/s);
            if (match) {
              conflictInfo = JSON.parse(match[0]);
            }
          }
          
          if (conflictInfo && conflictInfo.code === 'TIME_CONFLICT') {
            const ep = conflictInfo.existing_plan || {};
            const existingTitle = ep.title || 'Existing task';
            const existingTime = ep.scheduled_time || '';
            
            toast.error(`Time conflict: ${existingTitle} at ${existingTime} overlaps with your new task.`);
            toast.error('Please choose a different time or adjust duration.');
          } else {
            toast.error('Time conflict detected. Please choose a different time.');
          }
        } catch (e) {
          console.error('Error parsing conflict info:', e);
          toast.error('Time conflict detected. Please choose a different time.');
        }
      } else {
        console.error('Error creating task:', error);
        toast.error('Failed to create task. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Filter tasks
  const sortTasksByTimeAndStatus = (tasks) => {
  return [...tasks].sort((a, b) => {
    // Priority order: in_progress > pending > snoozed > completed > cancelled > missed
    const statusPriority = {
      'in_progress': 1,
      'pending': 2,  
      'snoozed': 3,
      'completed': 4,
      'cancelled': 5,
      'missed': 6
    };

    const aStatusPriority = statusPriority[a.status] || 7;
    const bStatusPriority = statusPriority[b.status] || 7;

    // First sort by status priority
    if (aStatusPriority !== bStatusPriority) {
      return aStatusPriority - bStatusPriority;
    }

    // For tasks with same status, sort by time
    const aTime = a.scheduled_time ? a.scheduled_time : '99:99'; // No time goes to end
    const bTime = b.scheduled_time ? b.scheduled_time : '99:99';
    
    // Convert time strings to comparable format (HH:MM)
    const timeToMinutes = (timeStr) => {
      if (!timeStr || timeStr === '99:99') return 9999;
      const [hours, minutes] = timeStr.split(':').map(Number);
      return hours * 60 + minutes;
    };

    const aMinutes = timeToMinutes(aTime);
    const bMinutes = timeToMinutes(bTime);

    if (aMinutes !== bMinutes) {
      return aMinutes - bMinutes;
    }

    // If same time and status, sort by title alphabetically
    return a.title.localeCompare(b.title);
  });
};

// Update your getFilteredTasks function to include sorting:
const getFilteredTasks = () => {
  let filtered = [...tasks];

  // Date filter: if selectedDate set show only tasks whose scheduled_date matches; otherwise default to today only for "Today's Tasks" concept
  const activeDate = selectedDate || todayLocalYMD;
  filtered = filtered.filter(task => (task.scheduled_date || todayLocalYMD) === activeDate);
  
  if (filterStatus !== 'all') {
    filtered = filtered.filter(task => task.status === filterStatus);
  }
  
  if (filterCategory !== 'all') {
    filtered = filtered.filter(task => task.category === filterCategory);
  }
  
  // Apply sorting
  return sortTasksByTimeAndStatus(filtered);
};


  // Localized strings
  const strings = {
    english: {
      title: "Task Planner",
      createTask: "Create Task",
      taskTitle: "Task Title",
      description: "Description",
      category: "Category",
      duration: "Duration (minutes)",
      create: "Create",
      cancel: "Cancel",
      filterBy: "Filter by",
      allTasks: "All Tasks",
      allCategories: "All Categories",
      loading: "Loading tasks...",
      study: "Study",
      work: "Work",
      personal: "Personal",
      other: "Other",
      pending: "Pending",
      inProgress: "In Progress",
      completed: "Completed",
      cancelled: "Cancelled",
      customTasks: "Manage Custom Tasks",
      hideCustomTasks: "Hide Custom Tasks"
    },
    hindi: {
      title: "कार्य योजनाकार",
      createTask: "कार्य बनाएं",
      taskTitle: "कार्य शीर्षक",
      description: "विवरण",
      category: "श्रेणी",
      duration: "अवधि (मिनट)",
      create: "बनाएं",
      cancel: "रद्द करें",
      filterBy: "फ़िल्टर करें",
      allTasks: "सभी कार्य",
      allCategories: "सभी श्रेणियां",
      loading: "कार्य लोड हो रहे हैं...",
      study: "अध्ययन",
      work: "काम",
      personal: "व्यक्तिगत",
      other: "अन्य",
      pending: "लंबित",
      inProgress: "प्रगति पर",
      completed: "पूर्ण",
      cancelled: "रद्द",
      customTasks: "अनुकूलित कार्य प्रबंधित करें",
      hideCustomTasks: "अनुकूलित कार्य छिपाएं"
    },
    gujarati: {
      title: "કાર્ય યોજનાકાર",
      createTask: "કાર્ય બનાવો",
      taskTitle: "કાર્ય શીર્ષક",
      description: "વર્ણન",
      category: "શ્રેણી",
      duration: "સમયગાળો (મિનિટ)",
      create: "બનાવો",
      cancel: "રદ કરો",
      filterBy: "ફિલ્ટર કરો",
      allTasks: "બધા કાર્યો",
      allCategories: "બધી શ્રેણીઓ",
      loading: "કાર્યો લોડ થઈ રહ્યા છે...",
      study: "અભ્યાસ",
      work: "કામ",
      personal: "વ્યક્તિગત",
      other: "અન્ય",
      pending: "બાકી",
      inProgress: "પ્રગતિમાં",
      completed: "પૂર્ણ",
      cancelled: "રદ થયેલ",
      customTasks: "કસ્ટમ કાર્યો મેનેજ કરો",
      hideCustomTasks: "કસ્ટમ કાર્યો છુપાવો"
    }
  };

  const t = strings[language] || strings.english;

  return (
    <div className="max-w-5xl mx-auto px-4 lg:px-8 py-6 pb-24">
      {/* Top Section */}
      <div className="flex justify-between items-start mb-6">
        <Header title={t.title} />
        <LanguageSelector 
          language={language}
          onChange={handleLanguageChange}
        />
      </div>

      {/* Action Buttons */}
  <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <button
          onClick={toggleCreateTask}
          className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
            isCreating 
              ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' 
              : 'bg-indigo-600 text-white hover:bg-indigo-700'
          }`}
        >
          {isCreating ? <FaTimes className="text-sm" /> : <FaPlus className="text-sm" />}
          <span>{isCreating ? t.cancel : t.createTask}</span>
        </button>
        <button
          onClick={toggleCustomSubjectForm}
          className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
            showCustomSubjectForm 
              ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' 
              : 'bg-green-600 text-white hover:bg-green-700'
          }`}
        >
          {showCustomSubjectForm ? <FaTimes className="text-sm" /> : <FaTags className="text-sm" />}
          <span>{showCustomSubjectForm ? t.hideCustomTasks : t.customTasks}</span>
        </button>
        <button
          onClick={()=> setShowCalendar(s => !s)}
          className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
            showCalendar ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-purple-600 text-white hover:bg-purple-700'
          }`}
        >
          {showCalendar ? <FaTimes className="text-sm" /> : <FaFilter className="text-sm" />}
          <span>{showCalendar ? 'Hide Calendar' : 'Show Calendar'}</span>
        </button>
      </div>

      {/* Create Task Form */}
      <AnimatePresence>
        {isCreating && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-6"
          >
            <TaskForm
              task={newTask}
              onTaskChange={setNewTask}
              onSubmit={handleSubmitTask}
              onCancel={toggleCreateTask}
              isLoading={isLoading}
              language={language}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters */}
      {showCalendar && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex items-center gap-2">
              <FaFilter className="text-gray-400 text-sm" />
              <span className="text-sm font-medium text-gray-700">{t.filterBy}:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
              >
                <option value="all">{t.allTasks}</option>
                <option value="pending">{t.pending}</option>
                <option value="in_progress">{t.inProgress}</option>
                <option value="completed">{t.completed}</option>
                <option value="cancelled">{t.cancelled}</option>
                <option value="snoozed">Snoozed</option>
                <option value="missed">Missed</option>
              </select>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
              >
                <option value="all">{t.allCategories}</option>
                <option value="study">{t.study}</option>
                <option value="work">{t.work}</option>
                <option value="personal">{t.personal}</option>
                <option value="other">{t.other}</option>
              </select>
            </div>
          </div>
          <div className="mt-4">
            <CalendarAnalytics
              selectedDate={selectedDate}
              onSelectDate={(d)=> setSelectedDate(d===selectedDate? null : d)}
            />
            <div className="mt-3 text-xs text-gray-600 flex items-center gap-2">
              <span className="font-medium">Viewing:</span>
              <span className="px-2 py-1 rounded bg-indigo-50 border border-indigo-100">{selectedDate || new Date().toISOString().slice(0,10)}</span>
              {selectedDate && (
                <button onClick={()=> setSelectedDate(null)} className="text-indigo-600 hover:underline">Reset to Today</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Custom Subject Form */}
      <AnimatePresence>
        {showCustomSubjectForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-6"
          >
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select category to manage:
                </label>
                <div className="flex flex-wrap gap-2">
                  <button 
                    onClick={() => setSelectedCustomCategory('study')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      selectedCustomCategory === 'study' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {t.study}
                  </button>
                  <button 
                    onClick={() => setSelectedCustomCategory('work')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      selectedCustomCategory === 'work' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {t.work}
                  </button>
                  <button 
                    onClick={() => setSelectedCustomCategory('personal')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      selectedCustomCategory === 'personal' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {t.personal}
                  </button>
                </div>
              </div>
              <CustomSubjectForm 
                category={selectedCustomCategory} 
                onSubjectAdded={(subject) => {
                  toast.success(`Added new ${selectedCustomCategory} task: ${subject}`);
                }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Task List */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-700">
            {selectedDate ? `Tasks on ${selectedDate}` : `Today's Tasks (${todayDisplay})`}
          </h2>
          {selectedDate && <button onClick={()=> setSelectedDate(null)} className="text-[11px] text-indigo-600 hover:underline">Back to Today</button>}
        </div>
        {isLoading && !isCreating ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-indigo-600 border-t-transparent mb-4"></div>
            <p className="text-sm text-gray-600">{t.loading}</p>
          </div>
        ) : (
          <TaskList
            tasks={getFilteredTasks()}
            refreshTasks={fetchUserPlans}
            language={language}
          />
        )}
      </div>
    </div>
  );
};

export default PlannerPage;