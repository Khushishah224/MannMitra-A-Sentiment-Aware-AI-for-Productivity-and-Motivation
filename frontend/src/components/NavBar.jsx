import React from 'react';
import { Link } from 'react-router-dom';
import { FaHome, FaHistory, FaRegLightbulb, FaUser, FaBalanceScale } from 'react-icons/fa';

const NavBar = () => {
  return (
    <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 shadow-lg">
      <div className="max-w-md mx-auto px-4">
        <div className="flex justify-around">
          <NavLink to="/" icon={<FaHome />} label="Home" />
          <NavLink to="/history" icon={<FaHistory />} label="History" />
          <NavLink to="/planner" icon={<FaRegLightbulb />} label="Planner" />
          <NavLink to="/decision" icon={<FaBalanceScale />} label="Decision" />
          <NavLink to="/profile" icon={<FaUser />} label="Profile" />
        </div>
      </div>
    </nav>
  );
};

const NavLink = ({ to, icon, label }) => {
  return (
    <Link 
      to={to} 
      className="flex flex-col items-center justify-center py-3 px-4 text-xs font-medium text-gray-600 hover:text-pink-600"
    >
      <span className="text-lg mb-1">{icon}</span>
      <span>{label}</span>
    </Link>
  );
};

export default NavBar;
