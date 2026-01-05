import React, { ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ThemeToggle } from './ThemeToggle';
import { 
  LayoutDashboard, 
  Users, 
  Calendar as CalendarIcon, 
  Image as Images, 
  Megaphone, 
  Settings,
  Menu,
  X,
  LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface LayoutProps {
  children: ReactNode;
}

const navigationItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/family', label: 'Family', icon: Users },
  { path: '/calendar', label: 'Calendar', icon: CalendarIcon },
  { path: '/gallery', label: 'Gallery', icon: Images },
  { path: '/announcements', label: 'Announcements', icon: Megaphone },
];

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col transition-colors duration-300">
      {/* Desktop Top Navigation */}
      <nav className="hidden lg:block bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-soft sticky top-0 z-40 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-2 group">
              <motion.span 
                className="text-2xl font-bold text-black dark:text-white group-hover:text-accent-blue transition-colors"
                whileHover={{ scale: 1.05 }}
              >
                Poduris
              </motion.span>
            </Link>
            
            <div className="flex items-center space-x-2">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 flex items-center space-x-2 ${
                      isActive(item.path)
                        ? 'bg-accent-blue text-white shadow-soft'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-black dark:hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
              {isAdmin() && (
                <Link
                  to="/admin"
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 flex items-center space-x-2 ${
                    isActive('/admin')
                      ? 'bg-accent-blue text-white shadow-soft'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-black dark:hover:text-white'
                  }`}
                >
                  <Settings className="w-4 h-4" />
                  <span>Admin</span>
                </Link>
              )}
            </div>

            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 dark:text-gray-400 hidden xl:block">{user?.name}</span>
              <ThemeToggle />
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all duration-200 flex items-center space-x-2"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden xl:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Top Bar */}
      <nav className="lg:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-soft sticky top-0 z-40 safe-top transition-colors duration-300">
        <div className="px-4 py-3 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold text-black dark:text-white">
            Poduris
          </Link>
          <div className="flex items-center space-x-3">
            <ThemeToggle />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="tap-target p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Menu"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6 text-black dark:text-white" />
              ) : (
                <Menu className="w-6 h-6 text-black dark:text-white" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden"
            >
              <div className="px-4 py-2 space-y-1">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-base font-medium transition-all duration-200 tap-target ${
                        isActive(item.path)
                          ? 'bg-accent-blue text-white'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
                {isAdmin() && (
                  <Link
                    to="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-base font-medium transition-all duration-200 tap-target ${
                      isActive('/admin')
                        ? 'bg-accent-blue text-white'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Settings className="w-5 h-5" />
                    <span>Admin</span>
                  </Link>
                )}
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 tap-target"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Logout</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Main Content */}
      <main className="flex-1 pb-20 lg:pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-large safe-bottom z-40 transition-colors duration-300">
        <div className="flex justify-around items-center h-16">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center justify-center flex-1 h-full tap-target transition-all duration-200 relative ${
                  isActive(item.path)
                    ? 'text-accent-blue'
                    : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Icon className="w-5 h-5 mb-1" />
                </motion.div>
                <span className="text-xs font-medium">{item.label}</span>
                {isActive(item.path) && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1/2 h-1 bg-accent-blue rounded-t-full"
                    initial={false}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
