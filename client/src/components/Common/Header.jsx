// src/components/Common/Header.jsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LogOut, Settings, LayoutDashboard, FileText } from 'lucide-react';

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Title */}
          <Link to="/dashboard" className="flex items-center gap-3">
            <img
              src="/assets/tvc.png"
              alt="The Voice Church"
              className="h-10 w-10 object-contain"
            />
            <div>
              <h1 className="text-lg font-bold text-gray-900">
                The Voice Church
              </h1>
              <p className="text-xs text-gray-600">
                Ministry Budget System
              </p>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              to="/dashboard"
              className="flex items-center gap-2 text-gray-700 hover:text-church-green transition-colors"
            >
              <LayoutDashboard size={18} />
              <span>Dashboard</span>
            </Link>
            
            <Link
              to="/forms"
              className="flex items-center gap-2 text-gray-700 hover:text-church-green transition-colors"
            >
              <FileText size={18} />
              <span>Forms</span>
            </Link>

            {user?.role === 'admin' && (
              <Link
                to="/admin"
                className="flex items-center gap-2 text-gray-700 hover:text-church-green transition-colors"
              >
                <Settings size={18} />
                <span>Admin</span>
              </Link>
            )}
          </nav>

          {/* User Menu */}
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-900">{user?.name}</p>
              <p className="text-xs text-gray-600 capitalize">
                {user?.role?.replace('_', ' ')}
              </p>
            </div>
            
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            >
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
