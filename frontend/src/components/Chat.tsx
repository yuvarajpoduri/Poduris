import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { chatAPI, familyMembersAPI } from "../utils/api";
import type { ChatMessage } from "../types";
import {
  MessageCircle,
  X,
  Send,
  Trash2,
  Reply,
  User as UserIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";

export const Chat: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageText, setMessageText] = useState("");
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && user) {
      fetchMessages(true);
      const interval = setInterval(() => {
        fetchMessages(false);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [isOpen, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      const data = await chatAPI.getMessages();
      setMessages(data || []);
    } catch (error) {
      console.error("Failed to fetch messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;

    const tempText = messageText;
    const tempReply = replyingTo;

    setMessageText("");
    setReplyingTo(null);

    try {
      await chatAPI.sendMessage(tempText, tempReply?._id);
      await fetchMessages(false);
    } catch (error: any) {
      console.error("Failed to send message:", error);
      setMessageText(tempText);
      if (error.response?.data?.message) {
        alert(error.response.data.message);
      }
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!window.confirm(t("chat.deleteConfirm"))) return;

    try {
      setMessages((prev) => prev.filter((m) => m._id !== messageId));
      await chatAPI.deleteMessage(messageId);
    } catch (error) {
      console.error("Failed to delete message:", error);
      fetchMessages(false);
    }
  };

  if (!user) {
    return null;
  }

  const canSendMessages = true; 

  const chatVariants = {
    hidden: { opacity: 0, scale: 0.8, y: 100, x: 0, originX: 1, originY: 1 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { type: "spring", stiffness: 300, damping: 25, mass: 0.8 },
    },
    exit: {
      opacity: 0,
      scale: 0.5,
      y: 100,
      transition: { duration: 0.25, ease: "easeIn" },
    },
  };

  const mobileVariants = {
    hidden: { y: "100%" },
    visible: {
      y: 0,
      transition: { type: "spring", damping: 30, stiffness: 300 },
    },
    exit: { y: "100%", transition: { duration: 0.3, ease: "easeInOut" } },
  };

  // Helper to get display name
  const getDisplayName = (sender: any) => sender?.nickname || sender?.name || "Unknown";

  return (
    <>
      <motion.button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-6 z-40 bg-gradient-to-tr from-indigo-600 to-purple-600 text-white p-4 rounded-full shadow-2xl shadow-indigo-500/40 flex items-center justify-center border-2 border-white/20"
        style={{ marginBottom: "env(safe-area-inset-bottom, 0px)" }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: isOpen ? 0 : 1, scale: isOpen ? 0 : 1 }}
        aria-label="Open chat"
      >
        <MessageCircle className="w-6 h-6" />
      </motion.button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            variants={window.innerWidth < 768 ? mobileVariants : chatVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-gray-900 md:inset-auto md:bottom-28 md:right-6 md:w-[400px] md:h-[600px] md:rounded-[32px] md:shadow-[0_40px_80px_rgba(0,0,0,0.3)] md:border md:border-gray-200 md:dark:border-gray-800 overflow-hidden backdrop-blur-xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-800 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md sticky top-0 z-10 transition-colors">
               <div className="flex items-center space-x-4">
                 <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                   <MessageCircle className="w-5 h-5 text-white" />
                 </div>
                 <div>
                   <h3 className="font-bold text-gray-900 dark:text-white text-lg tracking-tight">
                     {t("chat.title") || "Family Room"}
                   </h3>
                   <div className="flex items-center space-x-1.5">
                     <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                     </span>
                     <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                       Live
                     </span>
                   </div>
                 </div>
               </div>
               <button
                onClick={() => setIsOpen(false)}
                className="p-2.5 bg-gray-50 dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-500 rounded-full transition-all duration-300"
                aria-label="Close chat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-gray-50/50 dark:bg-gray-900 scroll-smooth overscroll-contain">
              {loading ? (
                <div className="flex justify-center items-center h-full">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs text-indigo-500 font-bold uppercase tracking-widest animate-pulse">
                      {t("chat.loading")}
                    </span>
                  </div>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full opacity-30 select-none">
                  <MessageCircle className="w-16 h-16 mb-4 text-gray-400" />
                  <p className="font-medium text-gray-500">No messages yet. Say hello!</p>
                </div>
              ) : (
                messages.map((message, index) => {
                  const senderId =
                    message.sender?._id || (message.sender as any)?._id;
                  const isOwnMessage = senderId === user?.id;
                  const displayName = getDisplayName(message.sender);

                  return (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                      key={message._id}
                      className={`flex w-full gap-3 group ${
                        isOwnMessage ? "flex-row-reverse" : "flex-row"
                      }`}
                    >
                      {/* Avatar */}
                      <button
                        onClick={async () => {
                          if (message.sender?._id) {
                            try {
                              const member = await familyMembersAPI.getById(
                                message.sender._id
                              );
                              setSelectedMember({ ...member });
                            } catch (error) {
                              // Fallback to sender data if available
                              const senderData = message.sender || {};
                              setSelectedMember({ 
                                ...senderData, 
                                name: getDisplayName(senderData) 
                              });
                            }
                          }
                        }}
                        className="flex-shrink-0 self-end mb-1 transition-transform active:scale-95"
                      >
                       {message.sender?.avatar ? (
                          <img
                            src={message.sender.avatar}
                            className="w-8 h-8 rounded-full object-cover ring-2 ring-white dark:ring-gray-800 shadow-md"
                            alt={displayName}
                          />
                        ) : (
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-md text-white
                             ${isOwnMessage ? 'bg-indigo-500' : 'bg-gray-400 dark:bg-gray-600'}
                          `}>
                            {displayName.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </button>

                      <div
                        className={`flex flex-col max-w-[75%] ${
                          isOwnMessage ? "items-end" : "items-start"
                        }`}
                      >
                        {!isOwnMessage && (
                          <span className="text-[10px] font-bold text-gray-400 mb-1 ml-1 uppercase tracking-wide">
                            {displayName}
                          </span>
                        )}
                        
                        <div
                          className={`relative px-5 py-3 shadow-sm text-[15px] leading-relaxed break-words
                            ${isOwnMessage 
                                ? "bg-gradient-to-tr from-indigo-600 to-violet-600 text-white rounded-[20px] rounded-br-none" 
                                : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border border-gray-100 dark:border-gray-700 rounded-[20px] rounded-bl-none"
                            }
                          `}
                        >
                          {message.replyTo && (
                            <div
                              className={`mb-2 p-2 rounded-lg text-xs border-l-2 bg-black/5 dark:bg-white/5 
                                ${isOwnMessage ? "border-white/50 text-white/90" : "border-indigo-500 text-gray-500 dark:text-gray-400"}
                              `}
                            >
                              <p className="font-bold flex items-center gap-1">
                                <Reply className="w-3 h-3" />
                                {getDisplayName(message.replyTo.sender)}
                              </p>
                              <p className="truncate opacity-80 mt-0.5 font-medium">
                                {message.replyTo.message}
                              </p>
                            </div>
                          )}
                          
                          {message.message}
                          
                            <div
                              className={`flex items-center gap-3 mt-1 px-1
                                ${isOwnMessage ? "flex-row-reverse" : "flex-row"}
                              `}
                            >
                              <span className={`text-[10px] font-bold opacity-60 ${isOwnMessage ? "text-indigo-100" : "text-gray-400"}`}>
                                {message.createdAt
                                  ? format(new Date(message.createdAt), "h:mm a")
                                  : ""}
                              </span>
                              
                              {/* Actions */}
                              <div className={`flex gap-3 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity items-center`}>
                                {isOwnMessage || user.role === "admin" ? (
                                  <button
                                    onClick={() => handleDeleteMessage(message._id)}
                                    className={`p-1 rounded-full transition-colors ${
                                        isOwnMessage 
                                            ? "text-red-200 hover:bg-white/20 hover:text-white" 
                                            : "text-gray-400 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                                    }`}
                                    title="Delete"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                ) : null}
                                
                                {!isOwnMessage && canSendMessages && (
                                  <button
                                    onClick={() => setReplyingTo(message)}
                                    className="p-1 text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-full transition-colors"
                                    title="Reply"
                                  >
                                    <Reply className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Selected Member Modal */} 
            <AnimatePresence>
              {selectedMember && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setSelectedMember(null)}
                  className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/70 backdrop-blur-md"
                >
                  <motion.div
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: 20 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-white dark:bg-gray-800 rounded-[32px] p-8 shadow-2xl w-full max-w-sm relative overflow-hidden"
                  >
                     <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-indigo-500 to-purple-600 opacity-10"></div>
                     <button
                      onClick={() => setSelectedMember(null)}
                      className="absolute top-6 right-6 p-2 rounded-full bg-white/50 hover:bg-white dark:bg-black/20 dark:hover:bg-black/40 transition-colors z-10"
                    >
                      <X className="w-5 h-5 text-gray-500 dark:text-gray-300" />
                    </button>

                    <div className="relative flex flex-col items-center z-10">
                        <div className="w-28 h-28 rounded-full p-1 bg-white dark:bg-gray-700 shadow-xl ring-2 ring-gray-100 dark:ring-gray-600 mb-4">
                           {selectedMember.avatar ? (
                                <img src={selectedMember.avatar} className="w-full h-full rounded-full object-cover" />
                           ) : (
                                <div className="w-full h-full rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center text-3xl font-black">
                                  {selectedMember.name?.charAt(0)}
                                </div>
                           )}
                        </div>
                        <h4 className="text-2xl font-black text-center text-gray-900 dark:text-white">{selectedMember.name}</h4>
                        {selectedMember.nickname && <p className="text-indigo-500 font-bold mb-4">"{selectedMember.nickname}"</p>}
                        
                        <div className="w-full space-y-3 mt-4">
                             <div className="flex gap-2 justify-center">
                                 {selectedMember.location && <span className="px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-xs font-bold text-gray-500">{selectedMember.location}</span>}
                                 {selectedMember.occupation && <span className="px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-xs font-bold text-gray-500">{selectedMember.occupation}</span>}
                             </div>
                        </div>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Input Area */}
            <div className="bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 p-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] backdrop-blur-md">
              <AnimatePresence>
                {replyingTo && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="mb-3 flex items-center justify-between bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-2xl border border-indigo-100 dark:border-indigo-500/30"
                  >
                     <div className="flex items-center gap-3 overflow-hidden">
                        <Reply className="w-4 h-4 text-indigo-500 shrink-0" />
                        <div className="truncate">
                           <span className="text-[10px] font-bold text-indigo-500 uppercase block">Replying to {getDisplayName(replyingTo.sender)}</span>
                           <span className="text-xs text-gray-500 dark:text-gray-400 truncate block">{replyingTo.message}</span>
                        </div>
                     </div>
                    <button
                      onClick={() => setReplyingTo(null)}
                      className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-full transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {canSendMessages ? (
                <form
                  onSubmit={handleSendMessage}
                  className="flex items-end gap-2"
                >
                  <div className="flex-1 relative">
                      <textarea
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        onKeyDown={(e) => {
                            if(e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSendMessage(e);
                            }
                        }}
                        rows={1}
                        placeholder={t("chat.placeholder") || "Type a message..."}
                        className="w-full pl-5 pr-12 py-3.5 bg-gray-100 dark:bg-gray-800 border-2 border-transparent focus:border-indigo-500/50 focus:bg-white dark:focus:bg-gray-900 rounded-3xl text-sm focus:ring-0 text-gray-900 dark:text-white placeholder:text-gray-400 font-medium transition-all resize-none scrollbar-hide"
                        style={{ minHeight: '48px', maxHeight: '100px' }} 
                      />
                      <button 
                        type="button" 
                        className="absolute right-3 bottom-3 p-1.5 text-gray-400 hover:text-indigo-500 transition-colors"
                        title="Add attachment (Coming soon)"
                      >
                         <span className="text-lg leading-none">+</span>
                      </button>
                  </div>
                  
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    type="submit"
                    disabled={!messageText.trim()}
                    className="p-3.5 bg-gradient-to-tr from-indigo-600 to-purple-600 text-white rounded-full shadow-lg shadow-indigo-500/30 disabled:opacity-40 disabled:shadow-none transition-all flex items-center justify-center shrink-0 mb-0.5"
                  >
                    <Send className="w-5 h-5 ml-0.5" />
                  </motion.button>
                </form>
              ) : (
                <div className="py-2 text-center">
                  <p className="text-[11px] font-bold text-red-500 uppercase tracking-widest bg-red-50 dark:bg-red-900/20 py-3 rounded-xl">
                    {t("chat.adminCannotSend") || "Read Only Mode"}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
