import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, Trash2 } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import { format } from 'date-fns';

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ isOpen, onClose }) => {
  const { notifications, markAsRead, markAllAsRead, unreadCount, deleteNotification } = useNotifications();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={dropdownRef}
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          className="fixed inset-x-4 top-24 md:absolute md:inset-auto md:right-0 md:top-full md:mt-4 md:w-96 bg-white/90 dark:bg-black/90 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/20 dark:border-white/10 overflow-hidden z-50 origin-top-right ring-1 ring-black/5"
        >
          <div className="p-5 border-b border-gray-100 dark:border-white/10 flex justify-between items-center bg-gray-50/50 dark:bg-white/5">
            <h3 className="font-bold text-lg text-gray-900 dark:text-white tracking-tight">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-500/30 transition-colors"
              >
                Mark read
              </button>
            )}
          </div>

          <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
            {notifications.length === 0 ? (
              <div className="py-12 px-6 text-center">
                <div className="w-16 h-16 bg-gray-50 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Bell className="w-6 h-6 text-gray-400 dark:text-gray-500" />
                </div>
                <p className="text-gray-900 dark:text-white font-medium mb-1">All caught up!</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">No new notifications for now.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-white/5">
                {notifications.map((notification) => (
                  <div
                    key={notification._id}
                    onClick={() => {
                        if (notification.type === 'event' && notification.metadata?.eventId) {
                             onClose();
                             window.location.href = `/calendar?eventId=${notification.metadata.eventId}`;
                        } else if (notification.metadata?.redirectTo) {
                             onClose();
                             window.location.href = notification.metadata.redirectTo;
                        }
                        if (!notification.isRead) markAsRead(notification._id);
                    }}
                    className={`p-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-all cursor-pointer relative group ${
                      !notification.isRead ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : ''
                    }`}
                  >
                    {!notification.isRead && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500"></div>
                    )}
                    
                    <div className="flex gap-4">
                      {/* Avatar or Icon Placeholder */}
                      <div className="flex-shrink-0 pt-1">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm ${
                              !notification.isRead 
                                  ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300' 
                                  : 'bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400'
                          }`}>
                              <Bell className="w-5 h-5" />
                          </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight mb-1">
                            {notification.senderName || 'System Message'}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300 leading-snug line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-[10px] uppercase font-bold text-gray-400 mt-2 tracking-wide">
                          {format(new Date(notification.createdAt), 'MMM d, h:mm a')}
                        </p>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex flex-col gap-1 transition-opacity">
                        {!notification.isRead && (
                          <button
                            onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(notification._id);
                            }}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors"
                            title="Mark as read"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                deleteNotification(notification._id);
                            }}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                            title="Delete"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
