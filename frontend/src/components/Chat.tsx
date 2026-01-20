import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { chatAPI, familyMembersAPI } from "../utils/api";
import type { ChatMessage } from "../types"; // Removed unused FamilyMember
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

  // Allow all authenticated users to chat, including admins
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

  return (
    <>
      <motion.button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-6 z-40 bg-accent-blue text-white p-4 rounded-full shadow-2xl flex items-center justify-center"
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
            className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-gray-800 md:inset-auto md:bottom-28 md:right-6 md:w-[400px] md:h-[600px] md:rounded-3xl md:shadow-[0_20px_50px_rgba(0,0,0,0.2)] md:border md:border-gray-200 md:dark:border-gray-700 overflow-hidden"
          >
            {/* Header ... */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 sticky top-0 z-10">
               {/* ... header content ... */}
               <div className="flex items-center space-x-3">
                 {/* ... */}
                 <div className="w-10 h-10 rounded-full bg-accent-blue/10 flex items-center justify-center">
                   <MessageCircle className="w-5 h-5 text-accent-blue" />
                 </div>
                 <div>
                   <h3 className="font-bold text-gray-900 dark:text-white text-base">
                     {t("chat.title") || "Family Chat"}
                   </h3>
                   <div className="flex items-center space-x-1">
                     <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                     <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">
                       Online
                     </span>
                   </div>
                 </div>
               </div>
               <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                aria-label="Close chat"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50 dark:bg-gray-900/50 scroll-smooth">
               {/* ... messages list ... */}
            {/* Same loading logic */}
              {loading ? (
                <div className="flex justify-center items-center h-full">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-8 h-8 border-4 border-accent-blue border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs text-gray-400 font-medium uppercase tracking-widest">
                      {t("chat.loading")}
                    </span>
                  </div>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full opacity-40">
                  <MessageCircle className="w-12 h-12 mb-2" />
                  <p className="text-sm font-medium">{t("chat.empty")}</p>
                </div>
              ) : (
                messages.map((message, index) => {
                  const senderId =
                    message.sender?._id || (message.sender as any)?._id;
                  const isOwnMessage = senderId === user?.id;

                  return (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ delay: index * 0.02 }}
                      key={message._id}
                      className={`flex w-full gap-3 ${
                        isOwnMessage ? "flex-row-reverse" : "flex-row"
                      }`}
                    >
                      {/* Avatar Button */}
                      <button
                        onClick={async () => {
                          if (message.sender?._id) {
                            try {
                              const member = await familyMembersAPI.getById(
                                message.sender._id
                              );
                              setSelectedMember({ ...member });
                            } catch (error) {
                              setSelectedMember(message.sender);
                            }
                          }
                        }}
                        className="flex-shrink-0 active:scale-90 transition-transform"
                      >
                       {message.sender?.avatar ? (
                          <img
                            src={message.sender.avatar}
                            className="w-9 h-9 rounded-2xl object-cover ring-2 ring-white dark:ring-gray-800 shadow-sm"
                            alt=""
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-2xl bg-accent-blue text-white flex items-center justify-center text-xs font-bold shadow-sm">
                            {message.sender?.name?.charAt(0).toUpperCase() ||
                              "?"}
                          </div>
                        )}
                      </button>

                      <div
                        className={`flex flex-col max-w-[80%] ${
                          isOwnMessage ? "items-end" : "items-start"
                        }`}
                      >
                        {!isOwnMessage && (
                          <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-1 ml-1">
                            {message.sender?.name}
                          </span>
                        )}
                        <div
                          className={`relative group px-4 py-2.5 rounded-2xl shadow-sm text-sm ${
                            isOwnMessage
                              ? "bg-accent-blue text-white rounded-tr-none"
                              : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-tl-none border border-gray-100 dark:border-gray-700"
                          }`}
                        >
                           {/* ... reply content ... */}
                          {message.replyTo && (
                            <div
                              className={`mb-2 p-2 rounded-lg border-l-2 text-[11px] opacity-80 ${
                                isOwnMessage
                                  ? "bg-black/10 border-white"
                                  : "bg-gray-100 dark:bg-gray-700 border-accent-blue"
                              }`}
                            >
                              <p className="font-bold truncate">
                                {message.replyTo.sender?.name}
                              </p>
                              <p className="truncate italic">
                                {message.replyTo.message}
                              </p>
                            </div>
                          )}
                          <p className="leading-relaxed whitespace-pre-wrap break-words">
                            {message.message}
                          </p>
                          <div
                            className={`flex items-center gap-2 mt-1 opacity-50 text-[10px] ${
                              isOwnMessage ? "justify-end" : "justify-start"
                            }`}
                          >
                            <span>
                              {message.createdAt
                                ? format(new Date(message.createdAt), "HH:mm")
                                : ""}
                            </span>
                             {/* CHANGED: Removed opacity-0 group-hover:opacity-100 */}
                            <div className="flex gap-1 transition-opacity">
                              {isOwnMessage || user.role === "admin" ? (
                                <button
                                  onClick={() =>
                                    handleDeleteMessage(message._id)
                                  }
                                  className="hover:text-red-500"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              ) : null}
                              {!isOwnMessage && canSendMessages && (
                                <button
                                  onClick={() => setReplyingTo(message)}
                                  className="hover:text-accent-blue"
                                >
                                  <Reply className="w-3 h-3" />
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

            <AnimatePresence>
              {selectedMember && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setSelectedMember(null)}
                  className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm"
                >
                  <motion.div
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: 20 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-white dark:bg-gray-800 rounded-[32px] p-8 shadow-2xl w-full max-w-sm relative"
                  >
                    <button
                      onClick={() => setSelectedMember(null)}
                      className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <X className="w-5 h-5 text-gray-400" />
                    </button>
                    <div className="flex flex-col items-center">
                      <div className="relative mb-6">
                        {selectedMember.avatar ? (
                          <img
                            src={selectedMember.avatar}
                            className="w-28 h-28 rounded-[32px] object-cover shadow-xl ring-4 ring-accent-blue/10"
                            alt=""
                          />
                        ) : (
                          <div className="w-28 h-28 rounded-[32px] bg-accent-blue/10 flex items-center justify-center shadow-xl">
                            <UserIcon className="w-12 h-12 text-accent-blue" />
                          </div>
                        )}
                        <div className="absolute -bottom-2 -right-2 bg-green-500 w-6 h-6 rounded-full border-4 border-white dark:border-gray-800" />
                      </div>
                      <h4 className="text-2xl font-black text-gray-900 dark:text-white mb-1">
                        {selectedMember.name}
                      </h4>
                      <p className="text-accent-blue text-sm font-bold uppercase tracking-widest mb-6">
                        Family Member
                      </p>

                      <div className="w-full space-y-3">
                        {selectedMember.location && (
                          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-2xl">
                            <span className="text-xs font-bold text-gray-400 uppercase">
                              Location
                            </span>
                            <span className="text-sm font-bold text-gray-900 dark:text-white">
                              {selectedMember.location}
                            </span>
                          </div>
                        )}
                        {selectedMember.birthDate && (
                          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-2xl">
                            <span className="text-xs font-bold text-gray-400 uppercase">
                              Birthday
                            </span>
                            <span className="text-sm font-bold text-gray-900 dark:text-white">
                              {format(
                                new Date(selectedMember.birthDate),
                                "MMM dd, yyyy"
                              )}
                            </span>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => setSelectedMember(null)}
                        className="w-full mt-8 py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-2xl font-black text-sm uppercase tracking-widest hover:opacity-90 transition-opacity active:scale-95"
                      >
                        {t("common.close")}
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 p-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))]">
              <AnimatePresence>
                {replyingTo && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="mb-3 flex items-center justify-between bg-accent-blue/5 dark:bg-accent-blue/10 p-3 rounded-xl border-l-4 border-accent-blue"
                  >
                    <div className="overflow-hidden">
                      <p className="text-[10px] font-bold text-accent-blue uppercase tracking-tight">
                        Replying to {replyingTo.sender?.name}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {replyingTo.message}
                      </p>
                    </div>
                    <button
                      onClick={() => setReplyingTo(null)}
                      className="p-1.5 hover:bg-accent-blue/10 rounded-full transition-colors"
                    >
                      <X className="w-4 h-4 text-accent-blue" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {canSendMessages ? (
                <form
                  onSubmit={handleSendMessage}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder={t("chat.placeholder") || "Message..."}
                    className="flex-1 px-5 py-3 bg-gray-100 dark:bg-gray-900 border-none rounded-2xl text-sm focus:ring-2 focus:ring-accent-blue/20 dark:text-white placeholder:text-gray-400 font-medium transition-all"
                  />
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    type="submit"
                    disabled={!messageText.trim()}
                    className="p-3.5 bg-accent-blue text-white rounded-2xl shadow-lg shadow-accent-blue/30 disabled:opacity-40 disabled:shadow-none transition-all flex items-center justify-center"
                  >
                    <Send className="w-5 h-5" />
                  </motion.button>
                </form>
              ) : (
                <div className="py-2 text-center">
                  <p className="text-[11px] font-bold text-yellow-600 dark:text-yellow-500 uppercase tracking-widest bg-yellow-50 dark:bg-yellow-900/20 py-2 rounded-xl border border-yellow-100 dark:border-yellow-900/30">
                    {t("chat.adminCannotSend") || "ADMINS CANNOT SEND MESSAGES"}
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
