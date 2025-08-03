import React, { useState } from 'react';
import { FaCheck, FaRegClock } from 'react-icons/fa';

const TaskList = ({ tasks, onTaskComplete }) => {
  const [completedTasks, setCompletedTasks] = useState(new Set());

  const handleToggleTask = (index) => {
    const newCompletedTasks = new Set(completedTasks);
    
    if (newCompletedTasks.has(index)) {
      newCompletedTasks.delete(index);
    } else {
      newCompletedTasks.add(index);
    }
    
    setCompletedTasks(newCompletedTasks);
    
    if (onTaskComplete) {
      onTaskComplete(index, !completedTasks.has(index));
    }
  };

  if (!tasks || tasks.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3 mt-4">
      <h3 className="text-lg font-medium text-gray-800 flex items-center gap-2">
        <FaRegClock className="text-pink-500" /> Today's Tasks
      </h3>
      <ul className="space-y-2">
        {tasks.map((task, index) => (
          <li 
            key={index}
            className={`flex items-start p-3 rounded-lg border ${
              completedTasks.has(index) 
                ? 'bg-green-50 border-green-200' 
                : 'bg-white border-gray-200'
            } transition-colors`}
          >
            <button
              onClick={() => handleToggleTask(index)}
              className={`flex-shrink-0 w-5 h-5 rounded-full border mr-3 flex items-center justify-center mt-0.5 ${
                completedTasks.has(index) 
                  ? 'bg-green-500 border-green-500 text-white' 
                  : 'border-gray-300'
              }`}
            >
              {completedTasks.has(index) && <FaCheck className="text-xs" />}
            </button>
            <div className="flex-1">
              <p className={`text-sm ${completedTasks.has(index) ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                {task.task}
              </p>
              {task.start_time && (
                <p className="text-xs text-gray-500 mt-1">
                  {task.start_time} · {task.duration_minutes} mins
                </p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TaskList;
