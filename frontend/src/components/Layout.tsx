import React, { ReactNode, useState, useEffect } from 'react';
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

const AvatarDisplay = ({ url, name, size = "md" }: { url?: string, name: string, size?: "sm" | "md" | "lg" | "xl" }) => {
    const [error, setError] = useState(false);
    const sizeClasses = {
        sm: "w-8 h-8 text-[10px]",
        md: "w-10 h-10 text-xs",
        lg: "w-12 h-12 text-base",
        xl: "w-16 h-16 text-lg"
    };

    if (url && !error) {
        return (
            <div className={`${sizeClasses[size]} relative rounded-full overflow-hidden border-2 border-white dark:border-white/10 shadow-sm shrink-0`}>
                <img 
                    src={url} 
                    alt={name}
                    className="w-full h-full object-cover"
                    onError={() => setError(true)}
                />
            </div>
        );
    }

    return (
        <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold border-2 border-white dark:border-white/10 shadow-sm shrink-0 uppercase`}>
            {name?.charAt(0) || "?"}
        </div>
    );
};

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout, isAdmin } = useAuth();
  const { t } = useLanguage();
  const { unreadCount } = useNotifications();
  const location = useLocation();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [hasOngoingCalls, setHasOngoingCalls] = useState(false);

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
      {/* Desktop Top Navigation - BIG & BOLD */}
      <nav className="hidden lg:block bg-white/80 dark:bg-black/95 backdrop-blur-xl border-b border-gray-200 dark:border-white/10 shadow-sm sticky top-0 z-40 h-24">
        <div className="max-w-7xl mx-auto px-4 h-full">
          <div className="flex justify-between items-center h-full">
            <Link to="/" className="font-['Great_Vibes'] text-5xl text-gray-900 dark:text-white mt-2 shrink-0">
              Poduri's
            </Link>
            
            <div className="flex items-center space-x-2 bg-gray-100 dark:bg-white/5 p-1.5 rounded-2xl">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isItemActive = isActive(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`px-6 py-3 rounded-xl text-base font-bold transition-all relative ${
                      isItemActive ? 'text-white' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    {isItemActive && (
                        <motion.div layoutId="navPill" className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl" />
                    )}
                    <div className="relative z-10 flex items-center space-x-2">
                        <Icon className="w-5 h-5" />
                        <span>{t(item.labelKey)}</span>
                    </div>
                  </Link>
                );
              })}
            </div>

            <div className="flex items-center space-x-4">
              {/* 1. Notification Bell */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="w-12 h-12 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  <Bell className="w-6 h-6" />
                  {unreadCount > 0 && <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-red-500 rounded-full shadow-sm border-2 border-white dark:border-black" />}
                </button>
                <NotificationDropdown isOpen={showNotifications} onClose={() => setShowNotifications(false)} />
              </div>

              {/* 2. Profile */}
              {!isAdmin() && (
                <Link to="/profile" className="flex items-center hover:scale-105 transition-transform">
                    <AvatarDisplay url={user?.avatar} name={user?.nickname || user?.name || ""} size="lg" />
                </Link>
              )}

              {/* 3. Language & 4. Theme */}
              <div className="flex items-center space-x-1 bg-gray-100 dark:bg-white/5 rounded-full p-1.5 border border-gray-200 dark:border-white/5">
                  <div className="scale-110"><LanguageToggle /></div>
                  <div className="scale-110"><ThemeToggle /></div>
              </div>

              {/* 5. Admin Settings (if applicable) */}
              {isAdmin() && (
                <Link to="/admin" className="w-12 h-12 flex items-center justify-center bg-gray-100 dark:bg-white/5 rounded-full text-gray-500 hover:text-indigo-600 transition-colors">
                  <Settings className="w-6 h-6" />
                </Link>
              )}
              
              {/* 6. Logout */}
              <button 
                onClick={handleLogout} 
                className="w-12 h-12 flex items-center justify-center text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-full transition-all"
              >
                <LogOut className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Top Bar - BIGGER & REORDERED */}
      <nav className="lg:hidden bg-white/80 dark:bg-black/95 backdrop-blur-xl border-b border-gray-200 dark:border-white/10 fixed top-0 left-0 right-0 z-40 safe-top transition-colors duration-300 h-20">
        <div className="px-4 h-full flex items-center justify-between">
            <Link to="/" className="font-['Great_Vibes'] text-3xl text-gray-900 dark:text-white shrink-0 mt-1">
                Poduri's
            </Link>
            
            <div className="flex items-center gap-2">
                {/* 1. Notification Bell */}
                <div className="relative">
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-500 relative"
                  >
                    <Bell className="w-6 h-6" />
                    {unreadCount > 0 && <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-black" />}
                  </button>
                  <NotificationDropdown isOpen={showNotifications} onClose={() => setShowNotifications(false)} />
                </div>

                {/* 2. Profile */}
                {!isAdmin() && (
                  <Link to="/profile" className="flex items-center active:scale-95 transition-transform">
                      <AvatarDisplay url={user?.avatar} name={user?.nickname || user?.name || ""} size="md" />
                  </Link>
                )}

                {/* 3. Language & 4. Theme */}
                <div className="flex items-center">
                    <div className="scale-90"><LanguageToggle /></div>
                    <div className="scale-90"><ThemeToggle /></div>
                </div>

                {/* 5. Admin Settings (if applicable) */}
                {isAdmin() && (
                  <Link to="/admin" className="w-10 h-10 flex items-center justify-center bg-gray-100 dark:bg-white/5 rounded-full text-gray-500">
                    <Settings className="w-6 h-6" />
                  </Link>
                )}

                {/* 6. Logout */}
                <button onClick={handleLogout} className="w-10 h-10 flex items-center justify-center text-red-500 bg-red-50 dark:bg-red-500/10 rounded-full">
                    <LogOut className="w-6 h-6" />
                </button>
            </div>
        </div>
      </nav>

      <main className="flex-1 pt-20 lg:pt-0 pb-24 lg:pb-8">
        <div className="max-w-7xl mx-auto px-4 py-6">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-black/90 backdrop-blur-xl border-t border-gray-200 dark:border-white/10 safe-bottom z-50">
        <div className="flex justify-around items-center h-20 max-w-md mx-auto">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isItemActive = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center justify-center flex-1 h-full transition-all ${
                  isItemActive ? 'text-indigo-600 dark:text-white' : 'text-gray-400'
                }`}
              >
                <div className={`p-2 rounded-2xl mb-1 ${isItemActive ? 'bg-indigo-50 dark:bg-white/10' : ''}`}>
                  <div className="relative">
                    <Icon className="w-6 h-6" /> 
                    {item.path === '/call' && hasOngoingCalls && (
                      <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 border-2 border-white dark:border-black"></span>
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-[10px] font-medium">{t(item.labelKey)}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
