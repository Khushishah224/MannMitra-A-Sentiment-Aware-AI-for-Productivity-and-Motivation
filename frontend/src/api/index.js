import axios from 'axios';


// Create axios instance with base URL
const apiClient = axios.create({
  baseURL: process.env.BACKEND_BASE_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// API functions for mood analysis
export const analyzeUserMood = async (text, language = 'english') => {
  try {
    const response = await apiClient.post('/analyze', { text, language });
    return response.data;
  } catch (error) {
    console.error('Error analyzing mood:', error);
    throw error;
  }
};

// API functions for quotes
export const getMotivationalQuote = async (mood, language = 'english') => {
  try {
    const response = await apiClient.get(`/quote?mood=${mood}&language=${language}`);
    return response.data;
  } catch (error) {
    console.error('Error getting quote:', error);
    throw error;
  }
};

// API functions for micro-planner
export const getMicroPlan = async (mood, language = 'english', context = null, durationMinutes = 20) => {
  try {
    const response = await apiClient.post('/plan', { 
      mood, 
      language, 
      context,
      duration_minutes: durationMinutes
    });
    return response.data;
  } catch (error) {
    console.error('Error getting micro-plan:', error);
    throw error;
  }
};

// API functions for history
export const addMoodEntry = async (userId, mood, text, language, taskCompleted = null) => {
  try {
    const response = await apiClient.post('/history', {
      user_id: userId,
      mood,
      text,
      language,
      task_completed: taskCompleted
    });
    return response.data;
  } catch (error) {
    console.error('Error adding mood entry:', error);
    throw error;
  }
};

export const getMoodHistory = async (userId) => {
  try {
    const response = await apiClient.get(`/history/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error getting mood history:', error);
    throw error;
  }
};

export const updateTaskCompletion = async (userId, entryIndex, completed) => {
  try {
    const response = await apiClient.put(`/history/${userId}/${entryIndex}?completed=${completed}`);
    return response.data;
  } catch (error) {
    console.error('Error updating task completion:', error);
    throw error;
  }
};

export default apiClient;
