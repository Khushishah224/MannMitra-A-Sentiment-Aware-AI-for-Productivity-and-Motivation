import React, { useState, useEffect, useCallback } from 'react';
import { getUserSubjectsByCategory } from '../api/userSubjects';
import { getSubjectsByCategory } from '../api';
import toast from 'react-hot-toast';

const SubjectSelector = ({ category, value, onChange, onAddNew }) => {
  const [subjects, setSubjects] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddNew, setShowAddNew] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [error, setError] = useState(null);

  const loadSubjects = useCallback(async () => {
    if (!category) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Get default subjects
      try {
        const defaultSubjectsArray = await getSubjectsByCategory(category);
        const defaultSubjects = defaultSubjectsArray.map(item => item.suggestion);
        setSubjects(defaultSubjects);
      } catch (err) {
        console.error('Error loading default subjects:', err);
        // Continue with empty default subjects
      }
      
      // Try to get user-specific subjects
      try {
        const userSubjectsResponse = await getUserSubjectsByCategory(category);
        if (userSubjectsResponse && userSubjectsResponse.subjects) {
          const userSubjects = userSubjectsResponse.subjects.map(sub => sub.name);
          // Combine with default subjects, removing duplicates
          setSubjects(prev => [...new Set([...prev, ...userSubjects])]);
        }
      } catch (err) {
        console.error('Error loading user subjects:', err);
        // We already have default subjects, so continue
      }
    } catch (err) {
      console.error('Error in loadSubjects:', err);
      setError('Failed to load subjects');
      toast.error('Failed to load subjects');
    } finally {
      setIsLoading(false);
    }
  }, [category]);

  useEffect(() => {
    loadSubjects();
  }, [category, loadSubjects]);

  // This block is intentionally removed as it was replaced by the useCallback version above

  const handleAddNewSubject = async () => {
    if (!newSubject.trim()) return;
    try {
      if (onAddNew) {
        // Allow parent to persist, then reload to include in list
        await onAddNew(newSubject.trim());
      }
      const added = newSubject.trim();
      setNewSubject('');
      setShowAddNew(false);
      onChange(added);
      // Reload combined subjects to reflect the new custom entry
      await loadSubjects();
    } catch (e) {
      // If not authenticated, keep it locally so user sees it immediately
      const status = e?.response?.status;
      const added = newSubject.trim();
      if (status === 401 || status === 403) {
        setSubjects((prev) => [...new Set([...(prev || []), added])]);
        onChange(added);
        setNewSubject('');
        setShowAddNew(false);
        toast((t) => (
          <span>
            Saved locally. <b>Sign in</b> to save your custom subjects.
            <button onClick={() => toast.dismiss(t.id)} className="ml-2 text-indigo-600">Dismiss</button>
          </span>
        ));
      } else {
        toast.error('Failed to add custom subject');
      }
    }
  };

  return (
    <div>
      {showAddNew ? (
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={newSubject}
            onChange={(e) => setNewSubject(e.target.value)}
            placeholder="Add custom subject..."
            className="flex-grow px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
          <button
            onClick={handleAddNewSubject}
            className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            disabled={!newSubject.trim()}
          >
            Add
          </button>
          <button
            onClick={() => {
              setShowAddNew(false);
              setNewSubject('');
            }}
            className="px-3 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
          >
            Cancel
          </button>
        </div>
      ) : (
        <div>
          <div className="flex flex-wrap gap-2">
            {isLoading ? (
              <div className="animate-pulse flex gap-2">
                <span className="h-8 w-20 bg-gray-200 rounded-full" />
                <span className="h-8 w-24 bg-gray-200 rounded-full" />
                <span className="h-8 w-28 bg-gray-200 rounded-full" />
              </div>
            ) : (
              subjects.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => onChange(s)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                    value === s
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {s}
                </button>
              ))
            )}
            <button
              type="button"
              onClick={() => setShowAddNew(true)}
              className="px-3 py-1.5 rounded-full text-sm border border-dashed border-indigo-400 text-indigo-600 hover:bg-indigo-50"
            >
              + Add custom
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubjectSelector;
