import { apiClient } from './index';

/**
 * Get user-specific subjects for a category
 * @param {string} category - The category (study, work, personal, other)
 * @returns {Promise} - Promise with the subjects
 */
export const getUserSubjectsByCategory = async (category) => {
  const response = await apiClient.get(`/user-subjects/category/${category}`);
  return response.data;
};

/**
 * Create a new user subject
 * @param {Object} subjectData - The subject data
 * @returns {Promise} - Promise with the created subject
 */
export const createUserSubject = async (subjectData) => {
  const response = await apiClient.post('/user-subjects/', subjectData);
  return response.data;
};

/**
 * Delete a user subject
 * @param {string} subjectId - The subject ID to delete
 * @returns {Promise} - Promise with the result
 */
export const deleteUserSubject = async (subjectId) => {
  const response = await apiClient.delete(`/user-subjects/${subjectId}`);
  return response.data;
};

/**
 * Update a user subject
 * @param {string} subjectId - The subject ID to update
 * @param {Object} subjectData - The updated subject data
 * @returns {Promise} - Promise with the updated subject
 */
export const updateUserSubject = async (subjectId, subjectData) => {
  const response = await apiClient.put(`/user-subjects/${subjectId}`, subjectData);
  return response.data;
};
