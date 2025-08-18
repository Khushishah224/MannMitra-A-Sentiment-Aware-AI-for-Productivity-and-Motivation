// Deprecated: this file is now a thin re-export to avoid breaking imports.
// Prefer importing directly from './index'.
export { 
  apiClient,
  login as loginUser,
  register as registerUser,
  getCurrentUser,
  logout,
  createPlan,
  getUserPlans,
  getPlanById,
  updatePlan,
  deletePlan,
} from './index';
