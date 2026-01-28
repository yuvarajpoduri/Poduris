import React, { ReactNode, useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useNotifications } from '../context/NotificationContext';
import { ThemeToggle } from './ThemeToggle';
import { LanguageToggle } from './LanguageToggle';
import { NotificationDropdown } from './NotificationDropdown';
import { 
  LayoutDashboard, 
  Users, 
  Calendar as CalendarIcon, 
  Image as Images, 
  Video,
  Settings,
  Bell,
  LogOut
} from 'lucide-react';
import { motion } from 'framer-motion';
import { socket } from '../utils/socket';

interface LayoutProps {
  children: ReactNode;
}

const navigationItems = [
  { path: '/', labelKey: 'nav.dashboard', icon: LayoutDashboard },
  { path: '/family', labelKey: 'nav.family', icon: Users },
  { path: '/calendar', labelKey: 'nav.calendar', icon: CalendarIcon },
  { path: '/gallery', labelKey: 'nav.gallery', icon: Images },
  { path: '/call', labelKey: 'nav.call', icon: Video },
];

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout, isAdmin } = useAuth();
  const { t } = useLanguage();
  const { unreadCount } = useNotifications();
  const location = useLocation();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [hasOngoingCalls, setHasOngoingCalls] = useState(false);
  const bellRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    socket.on("call-status-update", ({ hasOngoingCalls }) => {
      setHasOngoingCalls(hasOngoingCalls);
    });

    socket.emit("get-call-status");

    return () => {
      socket.off("call-status-update");
    };
  }, []);

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black flex flex-col transition-colors duration-300">
      {/* Desktop Top Navigation - Premium Adaptive Theme */}
      <nav className="hidden lg:block bg-white/80 dark:bg-black/95 backdrop-blur-xl border-b border-gray-200 dark:border-white/10 shadow-sm dark:shadow-2xl sticky top-0 z-40 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center group relative h-full">
              <div className="relative z-10 flex items-center">
                <span className="font-['Great_Vibes'] text-4xl leading-none text-gray-900 dark:text-white drop-shadow-sm transition-all duration-300 group-hover:scale-105 cursor-pointer mt-2 block">
                  Poduri's
                </span>
              </div>
              <div className="absolute inset-x-0 bottom-2 h-3 bg-indigo-100/50 dark:bg-white/10 blur-lg rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            </Link>
            
            {/* Nav Items */}
            <div className="flex items-center space-x-1 bg-gray-100 dark:bg-white/5 p-1 rounded-2xl border border-gray-200 dark:border-white/5">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isItemActive = isActive(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 flex items-center space-x-2 relative group overflow-hidden ${
                      isItemActive
                        ? 'text-white shadow-lg'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white dark:hover:bg-white/5'
                    }`}
                  >
                    {isItemActive && (
                        <motion.div 
                            layoutId="navPill"
                            className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl"
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />
                    )}
                    <div className="relative z-10 flex items-center space-x-2">
                        <Icon className={`w-4 h-4 ${isItemActive ? 'text-white' : ''}`} />
                        <span>{t(item.labelKey)}</span>
                        {item.path === '/call' && hasOngoingCalls && (
                          <span className="absolute -top-1 -right-1 flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                          </span>
                        )}
                    </div>
                  </Link>
                );
              })}
              {isAdmin() && (
                 <Link
                    to="/admin"
                    className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 flex items-center space-x-2 relative ${
                      isActive('/admin')
                        ? 'text-white bg-gray-900 dark:bg-white/10 shadow-lg'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white dark:hover:bg-white/5'
                    }`}
                  >
                    <Settings className="w-4 h-4" />
                    <span>{t('nav.admin')}</span>
                 </Link>
              )}
            </div>

            {/* Right Action Area */}
            <div className="flex items-center space-x-5">
              <div className="relative">
                <button
                  ref={bellRef}
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2.5 rounded-full bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-500 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors border border-gray-200 dark:border-white/5"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-black" />
                  )}
                </button>
                <NotificationDropdown 
                    isOpen={showNotifications} 
                    onClose={() => setShowNotifications(false)} 
                />
              </div>

              <div className="h-8 w-px bg-gray-200 dark:bg-white/10"></div>
              
              {!isAdmin() && (
              <Link
                to="/profile"
                className="flex items-center space-x-3 group"
              >
                <div className="text-right hidden xl:block">
                    <p className="text-sm font-bold text-gray-900 dark:text-white leading-none mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {user?.nickname || user?.name}
                    </p>
                    <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">Member</p>
                </div>
                
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.nickname || user.name}
                    className="w-10 h-10 rounded-full object-cover border-2 border-gray-200 dark:border-white/10 group-hover:border-indigo-500 transition-colors"
                  />
                ) : user?.name ? (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-sm font-bold text-white border-2 border-gray-200 dark:border-white/10 shadow-lg">
                    {(user.nickname || user.name).charAt(0).toUpperCase()}
                  </div>
                ) : null}
              </Link>
              )}
              
              <div className="flex items-center gap-2">
                  {!isAdmin() && <LanguageToggle />}
                  <ThemeToggle />
                  <button
                    onClick={handleLogout}
                    className="p-2.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all"
                    title={t('nav.logout')}
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Top Bar - Adaptive */}
      <nav className="lg:hidden bg-white/80 dark:bg-black/95 backdrop-blur-xl border-b border-gray-200 dark:border-white/10 fixed top-0 left-0 right-0 z-40 safe-top transition-colors duration-300">
        <div className="px-4 py-3 flex items-center justify-between">
           <Link to="/" className="flex items-center">
              <span className="font-['Great_Vibes'] text-3xl leading-none text-gray-900 dark:text-white drop-shadow-sm mt-1 block">
                  Poduri's
              </span>
           </Link>
           
          <div className="flex items-center space-x-3">
            <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 rounded-full text-gray-500 dark:text-gray-300 hover:text-black dark:hover:text-white transition-colors relative"
                >
                  <Bell className="w-6 h-6" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-black" />
                  )}
                </button>
                <NotificationDropdown 
                    isOpen={showNotifications} 
                    onClose={() => setShowNotifications(false)} 
                />
            </div>
            
            {!isAdmin() && (
            <Link to="/profile">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.nickname || user.name}
                  className="w-8 h-8 rounded-full object-cover border-2 border-gray-200 dark:border-white/10"
                />
              ) : user?.name ? (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white border-2 border-white/10">
                  {(user.nickname || user.name).charAt(0).toUpperCase()}
                </div>
              ) : null}
            </Link>
            )}
            
            {!isAdmin() && <LanguageToggle />}
            <ThemeToggle />
            <button
              onClick={handleLogout}
              className="p-2 text-red-500"
            >
                <LogOut className="w-6 h-6" />
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content - Improved Background - padded for fixed navs */}
      <main className="flex-1 pt-16 lg:pt-0 pb-24 lg:pb-8 bg-gray-50 dark:bg-black transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation - Adaptive */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-black/90 backdrop-blur-xl border-t border-gray-200 dark:border-white/10 safe-bottom z-50 transition-all duration-300">
        <div className="flex justify-around items-center h-20 max-w-md mx-auto w-full px-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isItemActive = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center justify-center flex-1 h-full tap-target transition-all duration-300 relative group ${
                  isItemActive
                    ? 'text-indigo-600 dark:text-white'
                    : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
                }`}
              >
                <div className={`relative p-2 rounded-2xl transition-all duration-300 mb-1 ${isItemActive ? 'bg-indigo-50 dark:bg-white/10 shadow-inner' : ''}`}>
                  <motion.div
                    animate={{ 
                        scale: isItemActive ? 1.1 : 1,
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="relative"
                  >
                    <Icon className={`w-6 h-6`} /> 
                    
                    {item.path === '/call' && hasOngoingCalls && (
                        <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 border-2 border-white dark:border-black"></span>
                        </span>
                    )}
                  </motion.div>
                </div>
                <span className={`text-[10px] font-medium transition-all duration-200 ${isItemActive ? 'scale-105 font-bold' : ''}`}>
                    {t(item.labelKey)}
                </span>
                
                {/* Active Indicator Dot (removed for cleaner pill look) */}
              </Link>
            );
          })}
          {isAdmin() && (
            <Link
              to="/admin"
              className={`flex flex-col items-center justify-center flex-1 h-full tap-target transition-colors duration-200 relative group ${
                isActive('/admin')
                  ? 'text-indigo-600 dark:text-white'
                  : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
              }`}
            >
               <div className={`relative p-2 rounded-2xl transition-all duration-300 mb-1 ${isActive('/admin') ? 'bg-indigo-50 dark:bg-white/10' : ''}`}>
                  <Settings className="w-6 h-6" />
               </div>
              <span className="text-[10px] font-medium">
                  {t('nav.admin')}
              </span>
            </Link>
          )}
        </div>
      </nav>
    </div>
  );
};
