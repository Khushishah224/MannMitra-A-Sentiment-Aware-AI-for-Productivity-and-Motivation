import React, { useState, useEffect } from 'react';
import { getUserSubjectsByCategory, createUserSubject, deleteUserSubject } from '../api/userSubjects';

const CustomSubjectForm = ({ category, onSubjectAdded }) => {
  const [subjectName, setSubjectName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userSubjects, setUserSubjects] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Load user's custom subjects when category changes
    if (category) {
      loadUserSubjects();
    }
  }, [category]);

  const loadUserSubjects = async () => {
    try {
      setIsLoading(true);
      const response = await getUserSubjectsByCategory(category);
      setUserSubjects(response.subjects || []);
      setError(null);
    } catch (err) {
      console.error('Error loading custom subjects:', err);
      setError('Failed to load your custom subjects');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subjectName.trim()) return;

    try {
      setIsLoading(true);
      const newSubject = await createUserSubject({
        name: subjectName,
        category,
        is_favorite: false,
      });

      setSubjectName('');
      setUserSubjects([...userSubjects, newSubject]);
      if (onSubjectAdded) {
        onSubjectAdded(newSubject.name);
      }
    } catch (err) {
      console.error('Error creating custom subject:', err);
      setError('Failed to create custom subject');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (subjectId) => {
    try {
      await deleteUserSubject(subjectId);
      setUserSubjects(userSubjects.filter(subject => subject.id !== subjectId));
    } catch (err) {
      console.error('Error deleting custom subject:', err);
      setError('Failed to delete custom subject');
    }
  };

  return (
    <div className="mt-4 p-4 bg-white rounded-lg shadow">
      <h3 className="text-lg font-medium mb-2">Your Custom {category.charAt(0).toUpperCase() + category.slice(1)} Tasks</h3>
      
      {error && (
        <div className="p-2 mb-3 text-sm text-red-700 bg-red-100 rounded-lg">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="mb-4">
        <div className="flex">
          <input
            type="text"
            value={subjectName}
            onChange={(e) => setSubjectName(e.target.value)}
            placeholder={`Add a custom ${category} task...`}
            className="flex-grow px-4 py-2 border rounded-l focus:outline-none"
          />
          <button 
            type="submit" 
            disabled={isLoading || !subjectName.trim()} 
            className="px-4 py-2 bg-blue-600 text-white rounded-r hover:bg-blue-700 disabled:bg-blue-300"
          >
            {isLoading ? 'Adding...' : 'Add'}
          </button>
        </div>
      </form>
      
      {userSubjects.length > 0 ? (
        <ul className="space-y-2">
          {userSubjects.map(subject => (
            <li key={subject.id} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded">
              <span>{subject.name}</span>
              <button 
                onClick={() => handleDelete(subject.id)} 
                className="text-red-500 hover:text-red-700"
                aria-label="Delete custom subject"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-500 text-sm italic">
          No custom {category} tasks yet. Add some above!
        </p>
      )}
    </div>
  );
};

export default CustomSubjectForm;
