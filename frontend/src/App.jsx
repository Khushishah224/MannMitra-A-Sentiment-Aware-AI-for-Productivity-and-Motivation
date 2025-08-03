import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { UserProvider } from './context/UserContext';
import NavBar from './components/NavBar';
import HomePage from './pages/HomePage';
import HistoryPage from './pages/HistoryPage';
import PlannerPage from './pages/PlannerPage';
import ProfilePage from './pages/ProfilePage';

function App() {
  return (
    <UserProvider>
      <Router>
        <div className="min-h-screen bg-gray-50 pb-16">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/planner" element={<PlannerPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Routes>
          <NavBar />
        </div>
      </Router>
    </UserProvider>
  );
}

export default App;
