import { createContext, useState, useEffect } from 'react';
import { login as loginUser, register as registerUser, getCurrentUser, updateCurrentUser, logout as apiLogout } from '../api';
import toast from 'react-hot-toast';

// Create Authentication Context
export const AuthContext = createContext();

// Authentication Provider Component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Check for token on initial load
  useEffect(() => {
    const token = localStorage.getItem('token');
    
    if (token) {
      fetchCurrentUser();
    } else {
      setIsLoading(false);
    }
  }, []);
  
  // Fetch current user data
  const fetchCurrentUser = async () => {
    try {
      setIsLoading(true);
      const userData = await getCurrentUser();
      
      if (userData) {
        setUser(userData);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      localStorage.removeItem('token');
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Login function
  const login = async (email, password) => {
    try {
      setIsLoading(true);
      const data = await loginUser(email, password);
      
      if (data && data.access_token) {
        localStorage.setItem('token', data.access_token);
        await fetchCurrentUser();
        toast.success('Login successful!');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Login failed. Please check your credentials.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Register function
  const register = async (userData) => {
    try {
      setIsLoading(true);
      const data = await registerUser(userData);
      
      if (data) {
        // Auto login after registration
        toast.success('Registration successful! Please log in.');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('Registration failed. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Logout function
  const logout = async () => {
    try {
      // Call the logout endpoint
      await apiLogout();
      
      // Clear local storage and state
      localStorage.removeItem('token');
      setUser(null);
      setIsAuthenticated(false);
      toast.success('Logged out successfully!');
    } catch (error) {
      console.error('Logout error:', error);
      
      // Even if the server call fails, clear local data
      localStorage.removeItem('token');
      setUser(null);
      setIsAuthenticated(false);
      toast.success('Logged out successfully!');
    }
  };
  
  // Prepare context value
  const contextValue = {
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    refresh: fetchCurrentUser,
    updateProfile: async (updates) => {
      const updated = await updateCurrentUser(updates);
      setUser(updated);
      return updated;
    },
  };
  
  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
