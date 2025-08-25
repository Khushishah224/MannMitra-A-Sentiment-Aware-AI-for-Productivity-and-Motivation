import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { updatePlan, deletePlan, snoozePlan, setPlanReminder, getUserPlans } from '../api';
import { hasOverlap as utilHasOverlap, computeNextFree as utilComputeNextFree, computeChainShifts, applyChainShifts } from '../utils/timeConflicts';
import toast from 'react-hot-toast';
import { FaCheck, FaRegClock, FaPencilAlt, FaTrash, FaPlay, FaClock, FaSave, FaTimes, FaExclamationTriangle, FaCalendarAlt, FaLayerGroup } from 'react-icons/fa';

const TaskList = ({ tasks, refreshTasks, language = 'english' }) => {
  const [editingTask, setEditingTask] = useState(null);
  const [editConflict, setEditConflict] = useState(false);
  const [editSuggested, setEditSuggested] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Status text localization
  const statusText = {
    english: {
      pending: "Pending",
      in_progress: "In Progress",
      completed: "Completed",
      cancelled: "Cancelled",
      missed: "Missed",
      snoozed: "Snoozed"
    },
    hindi: {
      pending: "लंबित",
      in_progress: "प्रगति पर",
      completed: "पूर्ण",
      cancelled: "रद्द",
      missed: "मिस्ड",
      snoozed: "स्थगित"
    },
    gujarati: {
      pending: "બાકી",
      in_progress: "પ્રગતિમાં",
      completed: "પૂર્ણ",
      cancelled: "રદ થયેલ",
      missed: "ચૂકડાયું",
      snoozed: "મોકૂફ રાખ્યું"
    }
  };
  
  // Category text localization
  const categoryText = {
    english: {
      study: "Study",
      work: "Work",
      personal: "Personal",
      other: "Other"
    },
    hindi: {
      study: "अध्ययन",
      work: "काम",
      personal: "व्यक्तिगत",
      other: "अन्य"
    },
    gujarati: {
      study: "અભ્યાસ",
      work: "કામ",
      personal: "વ્યક્તિગત",
      other: "અન્ય"
    }
  };
  
  // Button text localization
  const buttonText = {
    english: {
      edit: "Edit",
      delete: "Delete",
      save: "Save",
      cancel: "Cancel",
      start: "Start",
      complete: "Complete",
      snooze10m: "Snooze 10m",
      reschedule: "Reschedule"
    },
    hindi: {
      edit: "संपादित करें",
      delete: "हटाएं",
      save: "सहेजें",
      cancel: "रद्द करें",
      start: "शुरू करें",
      complete: "पूर्ण करें",
      snooze10m: "10 मिनट के लिए स्थगित",
      reschedule: "फिर से निर्धारित करें"
    },
    gujarati: {
      edit: "સંપાદિત કરો",
      delete: "કાઢી નાખો",
      save: "સાચવો",
      cancel: "રદ કરો",
      start: "શરૂ કરો",
      complete: "પૂર્ણ કરો",
      snooze10m: "10 મિનિટ મોકૂફ",
      reschedule: "ફરીથી શેડ્યૂલ કરો"
    }
  };

  // Form labels localization
  const formLabels = {
    english: {
      duration: 'Duration (minutes):',
      startTime: 'Start time:',
      status: 'Status:',
      reminder: 'Reminder (min before):'
    },
    hindi: {
      duration: 'अवधि (मिनट):',
      startTime: 'प्रारंभ समय:',
      status: 'स्थिति:',
      reminder: 'रिमाइंडर (मिनट पहले):'
    },
    gujarati: {
      duration: 'સમયગાળો (મિનિટ):',
      startTime: 'શરુઆત સમય:',
      status: 'સ્થિતિ:',
      reminder: 'રિમાઇન્ડર (મિનિટ પૂર્વે):'
    }
  };
  
  // Status badge color mapping
  const statusColors = {
    pending: "bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-800 border-amber-200",
    in_progress: "bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border-blue-200",
    completed: "bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-200",
    cancelled: "bg-gradient-to-r from-red-100 to-rose-100 text-red-800 border-red-200",
    missed: "bg-gradient-to-r from-orange-100 to-red-100 text-orange-800 border-orange-200",
    snoozed: "bg-gradient-to-r from-purple-100 to-violet-100 text-purple-800 border-purple-200"
  };
  
  // Category badge color mapping
  const categoryColors = {
    study: "bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-800 border-purple-200",
    work: "bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800 border-blue-200",
    personal: "bg-gradient-to-r from-pink-100 to-rose-100 text-pink-800 border-pink-200",
    other: "bg-gradient-to-r from-slate-100 to-gray-100 text-slate-800 border-slate-200"
  };
  
  // Start editing a task
  const handleEditClick = (task) => {
    setEditingTask({
      ...task,
      originalStatus: task.status // Save original status for cancel
    });
  };
  
  // Cancel editing
  const handleCancelEdit = () => {
    setEditingTask(null);
    setEditConflict(false);
    setEditSuggested('');
  };
  
  // Save task changes
  const hasLocalConflict = async (candidateTime, duration, taskId) => {
    if (!candidateTime) return false;
    try {
      const res = await getUserPlans();
      const filtered = (res?.plans||[]).filter(p => p.id !== taskId);
      return utilHasOverlap(filtered, candidateTime, duration);
    } catch { return false; }
  };

  const computeNextFree = async (candidateTime, duration, taskId) => {
    if (!candidateTime) return '';
    try {
      const res = await getUserPlans();
      const filtered = (res?.plans||[]).filter(p => p.id !== taskId);
      return utilComputeNextFree(filtered, candidateTime, duration);
    } catch { return ''; }
  };

  const handleSaveTask = async () => {
    if (!editingTask) return;

    if (editConflict) {
      toast.error('Resolve time conflict before saving.');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Prepare update data
      const updateData = {
        title: editingTask.title,
        description: editingTask.description,
        status: editingTask.status,
        duration_minutes: editingTask.duration_minutes,
        // Pass scheduled_time if present (HH:MM string)
        ...(editingTask.scheduled_time ? { scheduled_time: editingTask.scheduled_time } : {})
      };
      if (typeof editingTask.reminder_lead_minutes === 'number') {
        updateData.reminder_lead_minutes = editingTask.reminder_lead_minutes;
      }
      
      await updatePlan(editingTask.id, updateData);
      
      toast.success('Task updated successfully!');
      setEditingTask(null);
      setEditConflict(false);
      setEditSuggested('');
      
      // Refresh task list
      if (refreshTasks) refreshTasks();
      
    } catch (error) {
      console.error('Error updating task:', error);
      const status = error?.response?.status;
      const detail = error?.response?.data?.detail;
      if (status === 409 && detail?.code === 'TIME_CONFLICT') {
        const ep = detail.existing_plan || {};
        toast.error(`Time conflict with: ${ep.title || 'another task'} at ${ep.scheduled_time || ''}`);
      } else {
        toast.error('Failed to update task. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  // Delete a task
  const handleDeleteTask = async (taskId) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      setIsLoading(true);
      
      try {
        await deletePlan(taskId);
        
        toast.success('Task deleted successfully!');
        
        // Refresh task list
        if (refreshTasks) refreshTasks();
        
      } catch (error) {
        console.error('Error deleting task:', error);
        toast.error('Failed to delete task. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Snooze task by 10 minutes
  const handleSnooze = async (task, minutes = 10) => {
    setIsLoading(true);
    try {
      const updated = await snoozePlan(task.id, minutes);
      const newTime = typeof updated?.scheduled_time === 'string' ? updated.scheduled_time : (task.scheduled_time || '');
      toast.success(`Snoozed to ${newTime}`);
      if (refreshTasks) refreshTasks();
    } catch (error) {
      console.error('Error snoozing task:', error);
      toast.error('Failed to snooze task.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Update task status
  const handleStatusUpdate = async (task, newStatus) => {
    setIsLoading(true);
    
    try {
      await updatePlan(task.id, { status: newStatus });
      
      let message = '';
      switch (newStatus) {
        case 'in_progress':
          message = 'Task started!';
          break;
        case 'completed':
          message = 'Task completed! Great job!';
          break;
        default:
          message = 'Task updated!';
      }
      
      toast.success(message);
      
      // Refresh task list
      if (refreshTasks) refreshTasks();
      
    } catch (error) {
      console.error('Error updating task status:', error);
      toast.error('Failed to update task status. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

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
  
  // No tasks message
  if (!tasks || tasks.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <FaCalendarAlt className="text-slate-400 text-2xl" />
        </div>
        <h3 className="text-lg font-semibold text-slate-800 mb-2">
          {language === 'english' ? 'No Tasks Today' : 
           language === 'hindi' ? 'आज कोई कार्य नहीं' : 
           'આજે કોઈ કાર્ય નથી'}
        </h3>
        <p className="text-slate-600">
          {language === 'english' ? 'Create your first task to get started!' : 
           language === 'hindi' ? 'शुरुआत करने के लिए अपना पहला कार्य बनाएं!' : 
           'શરૂઆત કરવા માટે તમારું પહેલું કાર્ય બનાવો!'}
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
            <FaLayerGroup className="text-white text-lg" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-slate-800">
              {language === 'english' ? "Today's Tasks" : language === 'hindi' ? "आज के कार्य" : "આજના કાર્યો"}
            </h3>
            <p className="text-slate-600 text-sm">
              {tasks.length} {language==='hindi'?'कुल कार्य':(language==='gujarati'?'કુલ કાર્યો':'tasks total')}
            </p>
          </div>
        </div>
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-4 py-2 rounded-xl border border-indigo-200">
          <span className="text-sm font-semibold text-indigo-700">
            {tasks.filter(t => t.status === 'completed').length}/{tasks.length} 
            {language === 'english' ? ' completed' : language === 'hindi' ? ' पूर्ण' : ' પૂર્ણ'}
          </span>
        </div>
      </div>

      <AnimatePresence mode="popLayout">
        <div className="grid gap-6">
          {sortTasksByTimeAndStatus(tasks).map((task) => (
            <motion.div
              key={task.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className={`bg-white rounded-2xl shadow-sm border-2 transition-all duration-200 hover:shadow-lg overflow-hidden ${
                task.status === 'completed' ? 'border-green-200 bg-gradient-to-r from-green-50 to-emerald-50' : 
                task.status === 'in_progress' ? 'border-indigo-200 bg-gradient-to-r from-indigo-50 to-blue-50' : 
                task.status === 'missed' ? 'border-red-200 bg-gradient-to-r from-red-50 to-orange-50' :
                'border-slate-200'
              }`}
            >
              {editingTask && editingTask.id === task.id ? (
                // Edit Mode
                <div className="p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center">
                      <FaPencilAlt className="text-white text-sm" />
                    </div>
                    <h4 className="text-lg font-bold text-slate-800">Edit Task</h4>
                  </div>

                  <div className="space-y-6">
                    {/* Title Input */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Task Title</label>
                      <input
                        type="text"
                        value={editingTask.title}
                        onChange={(e) => setEditingTask({...editingTask, title: e.target.value})}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 bg-slate-50 focus:bg-white"
                        placeholder="Enter task title"
                      />
                    </div>
                    
                    {/* Description Input */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Description</label>
                      <textarea
                        value={editingTask.description || ''}
                        onChange={(e) => setEditingTask({...editingTask, description: e.target.value})}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 bg-slate-50 focus:bg-white resize-none"
                        rows="3"
                        placeholder="Task description (optional)"
                      />
                    </div>
                    
                    {/* Form Grid */}
                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Duration */}
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          {formLabels[language]?.duration || formLabels.english.duration}
                        </label>
                        <input
                          type="number"
                          value={editingTask.duration_minutes}
                          onChange={(e) => setEditingTask({...editingTask, duration_minutes: parseInt(e.target.value) || 10})}
                          min="5"
                          max="180"
                          className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 bg-slate-50 focus:bg-white"
                        />
                      </div>

                      {/* Status */}
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          {formLabels[language]?.status || formLabels.english.status}
                        </label>
                        <select
                          value={editingTask.status}
                          onChange={(e) => setEditingTask({...editingTask, status: e.target.value})}
                          className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 bg-slate-50 focus:bg-white"
                        >
                          <option value="pending">{statusText[language]?.pending || statusText.english.pending}</option>
                          <option value="in_progress">{statusText[language]?.in_progress || statusText.english.in_progress}</option>
                          <option value="completed">{statusText[language]?.completed || statusText.english.completed}</option>
                          <option value="cancelled">{statusText[language]?.cancelled || statusText.english.cancelled}</option>
                          <option value="snoozed">{statusText[language]?.snoozed || statusText.english.snoozed}</option>
                          <option value="missed">{statusText[language]?.missed || statusText.english.missed}</option>
                        </select>
                      </div>
                    </div>

                    {/* Time Input */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        {formLabels[language]?.startTime || formLabels.english.startTime}
                      </label>
                      <input
                        type="time"
                        value={editingTask.scheduled_time ? (typeof editingTask.scheduled_time === 'string' ? editingTask.scheduled_time.slice(0,5) : '') : ''}
                        onChange={async (e) => {
                          const v = e.target.value;
                          const updated = { ...editingTask, scheduled_time: v };
                          setEditingTask(updated);
                          if (v) {
                            const conflict = await hasLocalConflict(v, updated.duration_minutes || 30, updated.id);
                            setEditConflict(conflict);
                            if (conflict) {
                              const nextFree = await computeNextFree(v, updated.duration_minutes || 30, updated.id);
                              setEditSuggested(nextFree);
                            } else {
                              setEditSuggested('');
                            }
                          } else {
                            setEditConflict(false);
                            setEditSuggested('');
                          }
                        }}
                        className={`w-full px-4 py-3 border rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 bg-slate-50 focus:bg-white ${
                          editConflict ? 'border-red-500 bg-red-50' : 'border-slate-200'
                        }`}
                      />
                      
                      {editConflict && (
                        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                          <div className="flex items-start gap-3">
                            <FaExclamationTriangle className="text-red-500 text-sm mt-0.5" />
                            <div className="flex-1">
                              <p className="text-sm text-red-800 font-medium">Time Conflict Detected</p>
                              <p className="text-xs text-red-700 mt-1">
                                {language==='hindi'?'समय किसी अन्य कार्य से टकरा रहा है।':language==='gujarati'?'સમય અન્ય કાર્ય સાથે અથડાઈ રહ્યો છે.':'Time overlaps with another task.'}
                              </p>
                              {editSuggested && (
                                <div className="flex items-center gap-2 mt-3">
                                  <span className="text-xs text-red-700">Suggested: {editSuggested}</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingTask({ ...editingTask, scheduled_time: editSuggested });
                                      setEditConflict(false);
                                      setEditSuggested('');
                                    }}
                                    className="px-3 py-1 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700 transition-colors"
                                  >
                                    {language==='hindi'?'लागू करें':language==='gujarati'?'વપરાવો':'Use'}
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Reminder */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        {formLabels[language]?.reminder || formLabels.english.reminder}
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="120"
                        value={typeof editingTask.reminder_lead_minutes === 'number' ? editingTask.reminder_lead_minutes : ''}
                        onChange={(e) => setEditingTask({ ...editingTask, reminder_lead_minutes: e.target.value === '' ? null : parseInt(e.target.value) })}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 bg-slate-50 focus:bg-white"
                        placeholder="e.g. 5"
                      />
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex gap-4 pt-4">
                      <button
                        onClick={handleCancelEdit}
                        className="flex-1 px-6 py-3 bg-gradient-to-r from-slate-200 to-slate-300 text-slate-800 rounded-xl font-semibold hover:from-slate-300 hover:to-slate-400 transition-all duration-200 transform hover:-translate-y-0.5 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                        disabled={isLoading}
                      >
                        <FaTimes className="text-sm" />
                        {buttonText[language]?.cancel || buttonText.english.cancel}
                      </button>
                      <button
                        onClick={handleSaveTask}
                        className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl font-semibold hover:from-green-700 hover:to-green-800 transition-all duration-200 transform hover:-translate-y-0.5 shadow-md hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={isLoading || editConflict}
                      >
                        <FaSave className="text-sm" />
                        {isLoading ? 'Saving...' : (buttonText[language]?.save || buttonText.english.save)}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                // View Mode
                <div className="p-8">
                  {/* Task Header */}
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className={`text-xl font-bold ${
                          task.status === 'completed' ? 'line-through text-slate-500' : 'text-slate-800'
                        }`}>
                          {task.title}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusColors[task.status]}`}>
                          {statusText[language]?.[task.status] || statusText.english[task.status]}
                        </span>
                      </div>
                      
                      {task.description && (
                        <p className="text-slate-600 text-sm leading-relaxed">{task.description}</p>
                      )}
                    </div>
                    
                    {/* Action Icons */}
                    <div className="flex items-center gap-2 ml-4">
                      {task.status !== 'completed' && task.status !== 'cancelled' && (
                        <button
                          onClick={() => handleEditClick(task)}
                          className="w-10 h-10 bg-gradient-to-r from-indigo-100 to-indigo-200 rounded-xl flex items-center justify-center text-indigo-600 hover:from-indigo-200 hover:to-indigo-300 transition-all duration-200 transform hover:-translate-y-0.5"
                          disabled={isLoading}
                          aria-label="Edit task"
                        >
                          <FaPencilAlt className="text-sm" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="w-10 h-10 bg-gradient-to-r from-red-100 to-red-200 rounded-xl flex items-center justify-center text-red-600 hover:from-red-200 hover:to-red-300 transition-all duration-200 transform hover:-translate-y-0.5"
                        disabled={isLoading}
                        aria-label="Delete task"
                      >
                        <FaTrash className="text-sm" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Task Meta Information */}
                  <div className="flex flex-wrap gap-3 mb-6">
                    {task.scheduled_time && (
                      <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-slate-100 to-slate-200 rounded-lg border border-slate-200">
                        <FaRegClock className="text-slate-600 text-sm" />
                        <span className="text-sm font-medium text-slate-700">
                          {typeof task.scheduled_time === 'string' ? task.scheduled_time : ''}
                        </span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-slate-100 to-slate-200 rounded-lg border border-slate-200">
                      <FaClock className="text-slate-600 text-sm" />
                      <span className="text-sm font-medium text-slate-700">
                        {task.duration_minutes} {language === 'english' ? 'mins' : language === 'hindi' ? 'मिनट' : 'મિનિટ'}
                      </span>
                    </div>
                    
                    <div className={`px-3 py-2 rounded-lg border ${categoryColors[task.category]}`}>
                      <span className="text-sm font-medium">
                        {categoryText[language]?.[task.category] || categoryText.english[task.category]}
                      </span>
                    </div>
                    
                    {task.auto_rescheduled && (
                      <div className="px-3 py-2 bg-gradient-to-r from-emerald-100 to-green-100 rounded-lg border border-emerald-200">
                        <span className="text-sm font-medium text-emerald-800">Auto-rescheduled</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Action Buttons */}
                  {task.status !== 'completed' && task.status !== 'cancelled' && (
                    <div className="flex flex-wrap gap-3">
                      {/* Snooze Button with Dropdown */}
                      <div className="relative">
                        <button
                          onClick={() => handleSnooze(task, 10)}
                          className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl text-sm font-semibold hover:from-amber-600 hover:to-orange-600 transition-all duration-200 transform hover:-translate-y-0.5 shadow-md hover:shadow-lg flex items-center gap-2"
                          disabled={isLoading}
                          title={language === 'hindi' ? '10 मिनट के लिए स्थगित' : language === 'gujarati' ? '10 મિનિટ મોકૂફ' : 'Snooze 10 minutes'}
                        >
                          <FaClock className="text-sm" /> 
                          {buttonText[language]?.snooze10m || buttonText.english.snooze10m}
                        </button>
                        <select
                          onChange={(e) => {
                            const val = e.target.value;
                            if (!val) return;
                            if (val === '1') handleSnooze(task, 1);
                            if (val === '5') handleSnooze(task, 5);
                            if (val === '30') handleSnooze(task, 30);
                            if (val === '60') handleSnooze(task, 60);
                            e.target.value = '';
                          }}
                          className="absolute top-0 right-0 w-0 h-0 opacity-0"
                          disabled={isLoading}
                          aria-label="Snooze options"
                        >
                          <option value=""></option>
                          <option value="1">+1m</option>
                          <option value="5">+5m</option>
                          <option value="30">+30m</option>
                          <option value="60">+1h</option>
                        </select>
                      </div>

                      {/* Status Action Buttons */}
                      {task.status === 'pending' && (
                        <button
                          onClick={() => handleStatusUpdate(task, 'in_progress')}
                          className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 transform hover:-translate-y-0.5 shadow-md hover:shadow-lg flex items-center gap-2"
                          disabled={isLoading}
                        >
                          <FaPlay className="text-sm" />
                          {buttonText[language]?.start || buttonText.english.start}
                        </button>
                      )}
                      
                      {task.status === 'in_progress' && (
                        <button
                          onClick={() => handleStatusUpdate(task, 'completed')}
                          className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl text-sm font-semibold hover:from-green-700 hover:to-emerald-700 transition-all duration-200 transform hover:-translate-y-0.5 shadow-md hover:shadow-lg flex items-center gap-2"
                          disabled={isLoading}
                        >
                          <FaCheck className="text-sm" />
                          {buttonText[language]?.complete || buttonText.english.complete}
                        </button>
                      )}

                      {/* Reschedule Button */}
                      <button
                        onClick={() => handleEditClick(task)}
                        className="px-4 py-2 bg-gradient-to-r from-slate-200 to-slate-300 text-slate-800 rounded-xl text-sm font-semibold hover:from-slate-300 hover:to-slate-400 transition-all duration-200 transform hover:-translate-y-0.5 shadow-md hover:shadow-lg flex items-center gap-2"
                        disabled={isLoading}
                      >
                        <FaPencilAlt className="text-sm" />
                        {buttonText[language]?.reschedule || buttonText.english.reschedule}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </AnimatePresence>
    </div>
  );
};

export default TaskList;