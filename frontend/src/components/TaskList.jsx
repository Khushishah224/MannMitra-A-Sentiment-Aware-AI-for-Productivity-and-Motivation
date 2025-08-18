import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { updatePlan, deletePlan } from '../api';
import toast from 'react-hot-toast';
import { FaCheck, FaRegClock, FaPencilAlt, FaTrash, FaPlay, FaClock } from 'react-icons/fa';

const TaskList = ({ tasks, refreshTasks, language = 'english' }) => {
  const [editingTask, setEditingTask] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Status text localization
  const statusText = {
    english: {
      pending: "Pending",
      in_progress: "In Progress",
      completed: "Completed",
      cancelled: "Cancelled"
    },
    hindi: {
      pending: "लंबित",
      in_progress: "प्रगति पर",
      completed: "पूर्ण",
      cancelled: "रद्द"
    },
    gujarati: {
      pending: "બાકી",
      in_progress: "પ્રગતિમાં",
      completed: "પૂર્ણ",
      cancelled: "રદ થયેલ"
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
      delete: "हटाएँ",
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
      status: 'Status:'
    },
    hindi: {
      duration: 'अवधि (मिनट):',
      startTime: 'प्रारंभ समय:',
      status: 'स्थिति:'
    },
    gujarati: {
      duration: 'સમયગાળો (મિનિટ):',
      startTime: 'શરૂઆત સમય:',
      status: 'સ્થિતિ:'
    }
  };
  
  // Status badge color mapping
  const statusColors = {
    pending: "bg-yellow-100 text-yellow-800",
    in_progress: "bg-blue-100 text-blue-800",
    completed: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800"
  };
  
  // Category badge color mapping
  const categoryColors = {
    study: "bg-purple-100 text-purple-800",
    work: "bg-blue-100 text-blue-800",
    personal: "bg-pink-100 text-pink-800",
    other: "bg-gray-100 text-gray-800"
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
  };
  
  // Save task changes
  const handleSaveTask = async () => {
    if (!editingTask) return;
    
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
      
      await updatePlan(editingTask.id, updateData);
      
      toast.success('Task updated successfully!');
      setEditingTask(null);
      
      // Refresh task list
      if (refreshTasks) refreshTasks();
      
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Failed to update task. Please try again.');
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
      // Compute new time based on existing scheduled_time or current time
      const base = task.scheduled_time && typeof task.scheduled_time === 'string' ? task.scheduled_time : null;
      let date = new Date();
      if (base) {
        const [h, m] = base.split(':').map(Number);
        date.setHours(h, m, 0, 0);
      }
      date = new Date(date.getTime() + minutes * 60 * 1000);
      const hh = String(date.getHours()).padStart(2, '0');
      const mm = String(date.getMinutes()).padStart(2, '0');
      const newTime = `${hh}:${mm}`;

      await updatePlan(task.id, { scheduled_time: newTime });
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
  
  // No tasks message
  if (!tasks || tasks.length === 0) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-500">
          {language === 'english' ? 'No tasks found. Create one!' : 
           language === 'hindi' ? 'कोई कार्य नहीं मिला। एक बनाएं!' : 
           'કોઈ કાર્ય મળ્યું નથી. એક બનાવો!'}
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-3 mt-4">
      <h3 className="text-lg font-medium text-gray-800 flex items-center gap-2">
        <FaRegClock className="text-indigo-500" /> 
        {language === 'english' ? "Today's Tasks" : 
         language === 'hindi' ? "आज के कार्य" : 
         "આજનાં કાર્યો"}
      </h3>
      
      <AnimatePresence>
        <div className="space-y-4">
          {tasks.map((task) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className={`bg-white rounded-lg shadow-md p-4 border-l-4 ${
                task.status === 'completed' ? 'border-green-500' :
                task.status === 'in_progress' ? 'border-blue-500' : 'border-yellow-500'
              }`}
            >
              {editingTask && editingTask.id === task.id ? (
                // Edit mode
                <div className="space-y-3">
                  <input
                    type="text"
                    value={editingTask.title}
                    onChange={(e) => setEditingTask({...editingTask, title: e.target.value})}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300"
                  />
                  
                  <textarea
                    value={editingTask.description || ''}
                    onChange={(e) => setEditingTask({...editingTask, description: e.target.value})}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 resize-none h-20"
                    placeholder="Task description"
                  />
                  
                  <div className="flex items-center space-x-2">
                    <label className="text-sm text-gray-600">{formLabels[language]?.duration || formLabels.english.duration}</label>
                    <input
                      type="number"
                      value={editingTask.duration_minutes}
                      onChange={(e) => setEditingTask({...editingTask, duration_minutes: parseInt(e.target.value) || 10})}
                      min="5"
                      max="180"
                      className="w-20 p-1 border rounded text-center"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <label className="text-sm text-gray-600">{formLabels[language]?.startTime || formLabels.english.startTime}</label>
                    <input
                      type="time"
                      value={editingTask.scheduled_time ? (typeof editingTask.scheduled_time === 'string' ? editingTask.scheduled_time : '') : ''}
                      onChange={(e) => setEditingTask({ ...editingTask, scheduled_time: e.target.value })}
                      className="p-1 border rounded"
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <label className="text-sm text-gray-600">{formLabels[language]?.status || formLabels.english.status}</label>
                    <select
                      value={editingTask.status}
                      onChange={(e) => setEditingTask({...editingTask, status: e.target.value})}
                      className="p-1 border rounded"
                    >
                      <option value="pending">{statusText[language]?.pending || statusText.english.pending}</option>
                      <option value="in_progress">{statusText[language]?.in_progress || statusText.english.in_progress}</option>
                      <option value="completed">{statusText[language]?.completed || statusText.english.completed}</option>
                      <option value="cancelled">{statusText[language]?.cancelled || statusText.english.cancelled}</option>
                    </select>
                  </div>
                  
                  <div className="flex justify-end space-x-2 pt-2">
                    <button
                      onClick={handleCancelEdit}
                      className="px-3 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                      disabled={isLoading}
                    >
                      {buttonText[language]?.cancel || buttonText.english.cancel}
                    </button>
                    <button
                      onClick={handleSaveTask}
                      className="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                      disabled={isLoading}
                    >
                      {isLoading ? '...' : buttonText[language]?.save || buttonText.english.save}
                    </button>
                  </div>
                </div>
              ) : (
                // View mode
                <div>
                  <div className="flex justify-between items-start">
                    <h3 className={`font-semibold text-lg ${task.status === 'completed' ? 'line-through text-gray-500' : ''}`}>
                      {task.title}
                    </h3>
                    <div className="flex space-x-2">
                      {task.status !== 'completed' && task.status !== 'cancelled' && (
                        <button
                          onClick={() => handleEditClick(task)}
                          className="text-indigo-600 hover:text-indigo-800"
                          disabled={isLoading}
                          aria-label="Edit task"
                        >
                          <FaPencilAlt />
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="text-red-600 hover:text-red-800"
                        disabled={isLoading}
                        aria-label="Delete task"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                  
                  {task.description && (
                    <p className="text-gray-600 mt-1">{task.description}</p>
                  )}
                  
                  <div className="flex flex-wrap gap-2 mt-3">
                      {task.scheduled_time && (
                        <span className="text-xs px-2 py-1 rounded bg-indigo-100 text-indigo-800 flex items-center gap-1">
                          <FaRegClock /> {typeof task.scheduled_time === 'string' ? task.scheduled_time : ''}
                        </span>
                      )}
                    <span className={`text-xs px-2 py-1 rounded ${statusColors[task.status]}`}>
                      {statusText[language]?.[task.status] || statusText.english[task.status]}
                    </span>
                    
                    <span className={`text-xs px-2 py-1 rounded ${categoryColors[task.category]}`}>
                      {categoryText[language]?.[task.category] || categoryText.english[task.category]}
                    </span>
                    
                    <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-800">
                      {task.duration_minutes} {language === 'english' ? 'mins' : language === 'hindi' ? 'मिनट' : 'મિનિટ'}
                    </span>
                  </div>
                  
                  {task.status !== 'completed' && task.status !== 'cancelled' && (
                    <div className="mt-3 flex justify-end space-x-2">
                      <div className="relative inline-block text-left">
                        <button
                          onClick={() => handleSnooze(task, 10)}
                          className="px-3 py-1 bg-amber-500 text-white rounded text-sm hover:bg-amber-600 flex items-center gap-1"
                          disabled={isLoading}
                          title={language === 'hindi' ? '10 मिनट के लिए स्थगित' : language === 'gujarati' ? '10 મિનિટ મોકૂફ' : 'Snooze 10 minutes'}
                        >
                          <FaClock className="text-xs" /> {buttonText[language]?.snooze10m || buttonText.english.snooze10m}
                        </button>
                        <div className="absolute right-0 mt-1 w-32 bg-white border rounded shadow-lg z-10 hidden group-hover:block">
                          {/* placeholder for hover menus if needed later */}
                        </div>
                        <div className="inline-flex ml-1">
                          <select
                            onChange={(e) => {
                              const val = e.target.value;
                              if (!val) return;
                              if (val === '30') handleSnooze(task, 30);
                              if (val === '60') handleSnooze(task, 60);
                              e.target.value = '';
                            }}
                            className="px-2 py-1 text-sm border rounded bg-white"
                            disabled={isLoading}
                            aria-label="Snooze options"
                          >
                            <option value="">⋯</option>
                            <option value="30">+30m</option>
                            <option value="60">+1h</option>
                          </select>
                        </div>
                      </div>
                      {task.status === 'pending' && (
                        <button
                          onClick={() => handleStatusUpdate(task, 'in_progress')}
                          className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 flex items-center gap-1"
                          disabled={isLoading}
                        >
                          <FaPlay className="text-xs" />
                          {buttonText[language]?.start || buttonText.english.start}
                        </button>
                      )}
                      
                      {task.status === 'in_progress' && (
                        <button
                          onClick={() => handleStatusUpdate(task, 'completed')}
                          className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 flex items-center gap-1"
                          disabled={isLoading}
                        >
                          <FaCheck className="text-xs" />
                          {buttonText[language]?.complete || buttonText.english.complete}
                        </button>
                      )}
                      <button
                        onClick={() => handleEditClick(task)}
                        className="px-3 py-1 bg-gray-200 text-gray-800 rounded text-sm hover:bg-gray-300"
                        disabled={isLoading}
                      >
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
