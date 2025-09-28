import axios from 'axios';

// Create axios instance with base URL
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_BASE_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include JWT token in authenticated requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Unified error handling: clear token on 401/403 to force re-auth
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    if (status === 401 || status === 403) {
      try { localStorage.removeItem('token'); } catch {}
    }
    return Promise.reject(error);
  }
);

// API functions for mood analysis
export const analyzeUserMood = async (text, language = 'english') => {
  try {
  const response = await apiClient.post('/moods/analyze', { text, language });
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

// API functions for mood-aware suggestions
export const getMoodSuggestion = async (mood, category, subject = null, duration = 20, context = null) => {
  try {
    const response = await apiClient.post('/suggestions', {
      mood,
      category,
      subject,
      duration,
      context
    });
    return response.data;
  } catch (error) {
    console.error('Error getting mood suggestion:', error);
    throw error;
  }
};

export const getPersonalizedPlan = async (mood, category, subject = null, duration = 20, context = null, startTime = null) => {
  try {
    const payload = {
      mood,
      category,
      subject,
      duration,
      context
    };
    if (startTime) {
      // Backend expects time; sending "HH:MM" string is acceptable for Pydantic parsing
      payload.start_time = startTime;
    }
  // Returns a preview of the plan suggestion; not persisted until user accepts
  const response = await apiClient.post('/suggestions/personalized-plan', payload);
    return response.data;
  } catch (error) {
    console.error('Error getting personalized plan:', error);
    throw error;
  }
};

export const getSubjectsByCategory = async (category) => {
  try {
    const response = await apiClient.get(`/suggestions/categories/${category}`);
    return response.data.suggestions;
  } catch (error) {
    console.error('Error getting subjects:', error);
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

// Plans CRUD API functions (centralized here)
export const createPlan = async (planData) => {
  try {
    const response = await apiClient.post('/plans/', planData);
    return response.data;
  } catch (error) {
    console.error('Error creating plan:', error);
    // Capture the 409 conflict error and make it available in the error object
    if (error.response && error.response.status === 409) {
      error.timeConflictError = error.response.data.detail;
    }
    throw error;
  }
};

export const getUserPlans = async (category = null, status = null) => {
  try {
    let url = '/plans';
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (status) params.append('status', status);
    if (params.toString()) url += `?${params.toString()}`;
    const response = await apiClient.get(url);
    return response.data;
  } catch (error) {
    console.error('Error getting plans:', error);
    throw error;
  }
};

export const getPlanById = async (planId) => {
  try {
    const response = await apiClient.get(`/plans/${planId}`);
    return response.data;
  } catch (error) {
    console.error('Error getting plan:', error);
    throw error;
  }
};

export const updatePlan = async (planId, updateData) => {
  try {
    const response = await apiClient.put(`/plans/${planId}`, updateData);
    return response.data;
  } catch (error) {
    console.error('Error updating plan:', error);
    throw error;
  }
};

export const snoozePlan = async (planId, minutes = 10) => {
  try {
    const response = await apiClient.post(`/plans/${planId}/snooze`, null, { params: { minutes } });
    return response.data;
  } catch (error) {
    console.error('Error snoozing plan:', error);
    throw error;
  }
};

// Calendar history analytics
export const getPlanCalendarHistory = async (month = null, year = null) => {
  try {
    const params = new URLSearchParams();
    if (month) params.append('month', month);
    if (year) params.append('year', year);
    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await apiClient.get(`/plans/history/calendar${qs}`);
    return res.data;
  } catch (e) {
    console.error('Error fetching calendar history', e);
    return { days: {}, summary: {} };
  }
};

// Peer Pulse API
export const submitPeerPulse = async (activity, mood=null) => {
  try {
    const res = await apiClient.post('/peerpulse', { activity, mood });
    return res.data;
  } catch (e) {
    return Promise.reject(e);
  }
};

export const getPeerPulse = async (windowMinutes=30) => {
  try {
    const res = await apiClient.get(`/peerpulse?window_minutes=${windowMinutes}`);
    return res.data;
  } catch (e) {
    console.error('Peer pulse fetch failed', e);
    return { distribution: {}, total: 0, mood_distribution: {} };
  }
};

export const setPlanReminder = async (planId, leadMinutes) => {
  try {
    const response = await apiClient.post(`/plans/${planId}/reminder`, null, { params: { lead_minutes: leadMinutes } });
    return response.data;
  } catch (error) {
    console.error('Error setting plan reminder:', error);
    throw error;
  }
};

export const deletePlan = async (planId) => {
  try {
    await apiClient.delete(`/plans/${planId}`);
    return true;
  } catch (error) {
    console.error('Error deleting plan:', error);
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

// New moods history endpoint
export const fetchMoodHistory = async (limit = 30, moodType = null) => {
  try {
    const params = new URLSearchParams();
    if (limit) params.append('limit', String(limit));
    if (moodType) params.append('mood_type', moodType);
    const qs = params.toString() ? `?${params.toString()}` : '';
    const response = await apiClient.get(`/moods/${qs}`);
    return response.data; // { moods: [...], count }
  } catch (error) {
    console.error('Error fetching mood history:', error);
    // Return empty data instead of throwing error
    return { moods: [], count: 0 };
  }
};

// Sprint 4: Decision Helper API
export const getDecisionHelp = async (option1, option2, context, mood = 'neutral') => {
  try {
    const response = await apiClient.post('/decision/', {
      option1,
      option2,
      context,
      mood
    });
    return response.data;
  } catch (error) {
    console.error('Error getting decision help:', error);
    throw error;
  }
};

// Authentication functions
export const login = async (email, password) => {
  try {
    // OAuth2 expects application/x-www-form-urlencoded
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);
    const response = await axios.post(`${apiClient.defaults.baseURL}/auth/token`, formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    
    // Store the token in localStorage
    localStorage.setItem('token', response.data.access_token);
    return response.data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

export const register = async (userData) => {
  try {
    const response = await apiClient.post('/auth/register', userData);
    return response.data;
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

export const getCurrentUser = async () => {
  try {
    const response = await apiClient.get('/auth/me');
    return response.data;
  } catch (error) {
    console.error('Error getting current user:', error);
    throw error;
  }
};

// Update current user profile
export const updateCurrentUser = async (updateData) => {
  try {
    const response = await apiClient.put('/auth/me', updateData);
    return response.data;
  } catch (error) {
    console.error('Error updating current user:', error);
    throw error;
  }
};

export const logout = () => {
  localStorage.removeItem('token');
};

// New mood tracking function
export const trackMood = async (moodData) => {
  try {
    const response = await apiClient.post('/moods/', moodData);
    return response.data;
  } catch (error) {
    console.error('Error tracking mood:', error);
    throw error;
  }
};

export default apiClient;
