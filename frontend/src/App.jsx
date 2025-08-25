import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { UserProvider } from './context/UserContext';
import { AuthProvider } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';
import NavBar from './components/NavBar';
import HomePage from './pages/HomePage';
import HistoryPage from './pages/HistoryPage';
import PlannerPage from './pages/PlannerPage';
import ProfilePage from './pages/ProfilePage';
import DecisionPage from './pages/DecisionPage';
import LoginPage from './pages/Auth/LoginPage';
import RegisterPage from './pages/Auth/RegisterPage';
import PrivateRoute from './components/Auth/PrivateRoute';

function App() {
  return (
    <AuthProvider>
      <UserProvider>
        <Router>
          <div className="min-h-screen bg-gray-50 pb-16">
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              
              {/* Protected Routes */}
              <Route element={<PrivateRoute />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/history" element={<HistoryPage />} />
                <Route path="/planner" element={<PlannerPage />} />
                <Route path="/decision" element={<DecisionPage />} />
                <Route path="/profile" element={<ProfilePage />} />
              </Route>
            </Routes>
            <NavBar />
          </div>
          
          {/* Toast notifications */}
          <Toaster
            position="top-right"
            reverseOrder={false}
            gutter={8}
            toastOptions={{
              duration: 3000,
              style: {
                background: '#363636',
                color: '#fff',
              },
            }}
          />
        </Router>
      </UserProvider>
    </AuthProvider>
  );
}

export default App;
