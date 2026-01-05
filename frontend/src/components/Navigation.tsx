import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navigationItems = [
  { path: '/', label: 'Dashboard', icon: '📊' },
  { path: '/family', label: 'Family', icon: '👨‍👩‍👧‍👦' },
  { path: '/calendar', label: 'Calendar', icon: '📅' },
  { path: '/gallery', label: 'Gallery', icon: '🖼️' },
  { path: '/announcements', label: 'Announcements', icon: '📢' },
];

export const Navigation: React.FC = () => {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      {/* Desktop Navigation - Top Bar */}
      <nav className="hidden md:flex bg-white border-b border-gray-200 shadow-soft sticky top-0 z-40">
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-2">
              <span className="text-2xl font-bold text-gray-900">Poduris</span>
            </Link>
            
            <div className="flex items-center space-x-1">
              {navigationItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive(item.path)
                      ? 'bg-accent-blue text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              {isAdmin() && (
                <Link
                  to="/admin"
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive('/admin')
                      ? 'bg-accent-blue text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Admin
                </Link>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">{user?.name}</span>
              <button
                onClick={logout}
                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation - Bottom Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50 safe-bottom">
        <div className="grid grid-cols-5 h-16">
          {navigationItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center space-y-1 transition-colors ${
                isActive(item.path)
                  ? 'text-accent-blue'
                  : 'text-gray-500'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>

      {/* Mobile Top Bar */}
      <div className="md:hidden bg-white border-b border-gray-200 shadow-soft sticky top-0 z-40 safe-top">
        <div className="flex items-center justify-between h-14 px-4">
          <Link to="/" className="text-xl font-bold text-gray-900">
            Poduris
          </Link>
          <div className="flex items-center space-x-3">
            {isAdmin() && (
              <Link
                to="/admin"
                className={`p-2 rounded-lg ${
                  isActive('/admin') ? 'bg-accent-blue text-white' : 'text-gray-700'
                }`}
              >
                ⚙️
              </Link>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-gray-700"
            >
              <span className="text-xl">☰</span>
            </button>
          </div>
        </div>
        
        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="border-t border-gray-200 bg-white">
            <div className="px-4 py-3 space-y-2">
              <div className="text-sm text-gray-600 mb-2">Logged in as {user?.name}</div>
              {isAdmin() && (
                <Link
                  to="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-2 rounded-lg hover:bg-gray-100 text-gray-700"
                >
                  Admin Panel
                </Link>
              )}
              <button
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                className="block w-full text-left px-4 py-2 rounded-lg hover:bg-gray-100 text-gray-700"
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Spacer for mobile bottom nav */}
      <div className="md:hidden h-16"></div>
    </>
  );
};

