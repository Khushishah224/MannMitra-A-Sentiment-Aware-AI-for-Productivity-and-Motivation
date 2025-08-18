import { useState, useEffect, useContext, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '../components/Header';
import LanguageSelector from '../components/LanguageSelector';
import TaskList from '../components/TaskList';
import MoodBadge from '../components/MoodBadge';
import CustomSubjectForm from '../components/CustomSubjectForm';
import { useUser } from '../context/UserContext';
import { AuthContext } from '../context/AuthContext';
import { createPlan, getUserPlans } from '../api';
import { FaPlus, FaRegLightbulb, FaFilter, FaTags } from 'react-icons/fa';
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
  const [showCustomSubjectForm, setShowCustomSubjectForm] = useState(false);
  const [selectedCustomCategory, setSelectedCustomCategory] = useState('study');
  const remindedRef = useRef({}); // planId -> true

  const language = userPrefs?.language || 'english';

  // Fetch user plans when component mounts
  useEffect(() => {
    if (user) {
      fetchUserPlans();
    }
  }, [user]);

  // Ask for Notification permission once
  useEffect(() => {
    try {
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().catch(() => {});
      }
    } catch (_) {}
  }, []);

  // Lightweight reminder: toast when scheduled_time is reached
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
        // Trigger when exact minute matches and task is actionable
        if ((t.status === 'pending' || t.status === 'in_progress') && st === current) {
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
      setTasks(response.plans || []);
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

  // Submit new task
  const handleSubmitTask = async (e) => {
    e.preventDefault();
    
    if (!newTask.title.trim()) {
      toast.error('Please enter a task title.');
      return;
    }

    setIsLoading(true);
    try {
      await createPlan({
        ...newTask,
        status: 'pending'
      });
      
      toast.success('Task created successfully!');
      setIsCreating(false);
      
      // Reset form
      setNewTask({
        title: '',
        description: '',
        category: 'study',
        duration_minutes: 30,
      });
      
      // Refresh tasks
      fetchUserPlans();
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error('Failed to create task. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter tasks
  const getFilteredTasks = () => {
    let filtered = [...tasks];
    
    if (filterStatus !== 'all') {
      filtered = filtered.filter(task => task.status === filterStatus);
    }
    
    if (filterCategory !== 'all') {
      filtered = filtered.filter(task => task.category === filterCategory);
    }
    
    return filtered;
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
    <div className="container mx-auto px-4 pb-20 pt-4">
      <Header title={t.title} />

      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
        <div className="mb-4 md:mb-0">
          <LanguageSelector 
            language={language}
            onChange={handleLanguageChange}
          />
        </div>

        <div className="flex space-x-2">
          <button
            onClick={toggleCreateTask}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-indigo-700 transition-colors"
          >
            <FaPlus />
            <span>{isCreating ? t.cancel : t.createTask}</span>
          </button>
          <button
            onClick={toggleCustomSubjectForm}
            className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-green-700 transition-colors"
          >
            <FaTags />
            <span>{showCustomSubjectForm ? t.hideCustomTasks : t.customTasks}</span>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isCreating && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-lg shadow-md p-6 mb-6"
          >
            <form onSubmit={handleSubmitTask} className="space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                  {t.taskTitle}
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={newTask.title}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  {t.description}
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={newTask.description}
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
                    value={newTask.category}
                    onChange={handleInputChange}
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
                    value={newTask.duration_minutes}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={toggleCreateTask}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !newTask.title.trim()}
                  className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                    (isLoading || !newTask.title.trim()) ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                >
                  {isLoading ? '...' : t.create}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex flex-col md:flex-row items-start md:items-center space-y-3 md:space-y-0 md:space-x-4">
          <div className="flex items-center">
            <FaFilter className="text-gray-500 mr-2" />
            <span className="text-gray-700">{t.filterBy}:</span>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm"
            >
              <option value="all">{t.allTasks}</option>
              <option value="pending">{t.pending}</option>
              <option value="in_progress">{t.inProgress}</option>
              <option value="completed">{t.completed}</option>
              <option value="cancelled">{t.cancelled}</option>
            </select>
            
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm"
            >
              <option value="all">{t.allCategories}</option>
              <option value="study">{t.study}</option>
              <option value="work">{t.work}</option>
              <option value="personal">{t.personal}</option>
              <option value="other">{t.other}</option>
            </select>
          </div>
        </div>
      </div>

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
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select category to manage:
                </label>
                <div className="flex space-x-2">
                  <button 
                    onClick={() => setSelectedCustomCategory('study')}
                    className={`px-3 py-2 rounded ${selectedCustomCategory === 'study' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
                  >
                    {t.study}
                  </button>
                  <button 
                    onClick={() => setSelectedCustomCategory('work')}
                    className={`px-3 py-2 rounded ${selectedCustomCategory === 'work' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
                  >
                    {t.work}
                  </button>
                  <button 
                    onClick={() => setSelectedCustomCategory('personal')}
                    className={`px-3 py-2 rounded ${selectedCustomCategory === 'personal' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
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
      <div className="bg-white rounded-lg shadow-md p-6">
        {isLoading && !isCreating ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600 mb-2"></div>
            <p className="text-gray-600">{t.loading}</p>
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
