import { createContext, useContext, useState, useEffect } from 'react';

// Create context
const UserContext = createContext();

// Create a provider component
export const UserProvider = ({ children }) => {
  // Initialize state from localStorage or use default values
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('mannMitraUser');
    return savedUser ? JSON.parse(savedUser) : { 
      id: `user_${Math.random().toString(36).substring(2, 9)}`,
      language: 'english',
      moodHistory: []
    };
  });

  // Update localStorage whenever user state changes
  useEffect(() => {
    localStorage.setItem('mannMitraUser', JSON.stringify(user));
  }, [user]);

  // Function to update user preferences
  const updateUserPreferences = (preferences) => {
    setUser(prevUser => ({
      ...prevUser,
      ...preferences
    }));
  };

  // Function to add mood entry to history
  const addMoodEntry = (entry) => {
    setUser(prevUser => ({
      ...prevUser,
      moodHistory: [entry, ...prevUser.moodHistory].slice(0, 50) // Keep only last 50 entries
    }));
  };

  // Value to be provided to consumers
  const value = {
    user,
    updateUserPreferences,
    addMoodEntry
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

// Custom hook for accessing user context
export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export default UserContext;
