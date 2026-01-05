import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { chatAPI } from "../utils/api";
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
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && user?.status === "approved") {
      fetchMessages(true);
    }
  }, [isOpen, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      const data = await chatAPI.getMessages(undefined, true);
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
      await chatAPI.sendMessage(tempText, undefined, tempReply?._id, true);
      await fetchMessages(false);
    } catch (error) {
      console.error("Failed to send message:", error);
      setMessageText(tempText);
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

  if (user?.status !== "approved") {
    return null;
  }

  return (
    <>
      <motion.button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-4 md:bottom-24 lg:bottom-8 z-50 bg-accent-blue text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-shadow"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: isOpen ? 0 : 1, scale: isOpen ? 0 : 1 }}
        transition={{ duration: 0.2 }}
      >
        <MessageCircle className="w-6 h-6" />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: 400 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 400 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed bottom-24 right-2 sm:right-4 md:bottom-24 lg:bottom-8 z-50 w-[calc(100%-1rem)] sm:w-full sm:max-w-md h-[70vh] sm:h-[65vh] lg:h-[600px] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl flex flex-col border-2 border-gray-200 dark:border-gray-700 overflow-hidden"
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-accent-blue rounded-t-2xl">
              <div className="flex items-center space-x-2">
                <MessageCircle className="w-5 h-5 text-white" />
                <h3 className="font-semibold text-white text-sm sm:text-base">
                  {t("chat.title")}
                </h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900/50 relative scrollbar-hide">
              {loading ? (
                <div className="flex justify-center items-center h-full text-gray-500 text-sm">
                  <span className="animate-pulse">{t("chat.loading")}</span>
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center text-gray-500 mt-10 text-sm">
                  {t("chat.empty")}
                </div>
              ) : (
                messages.map((message) => {
                  const senderId =
                    message.sender?._id || (message.sender as any)?.id;
                  const isOwnMessage = senderId === user?.id;

                  return (
                    <div
                      key={message._id}
                      className={`flex w-full gap-2 items-end ${
                        isOwnMessage ? "flex-row-reverse" : "flex-row"
                      }`}
                    >
                      <button
                        onClick={() => setSelectedUser(message.sender)}
                        className="flex-shrink-0 focus:outline-none transition-transform active:scale-95"
                      >
                        {message.sender?.avatar ? (
                          <img
                            src={message.sender.avatar}
                            alt=""
                            className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover border-2 border-accent-blue/50 bg-white"
                          />
                        ) : (
                          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-accent-blue/10 flex items-center justify-center text-xs sm:text-sm font-bold text-accent-blue border-2 border-accent-blue/50">
                            {message.sender?.name
                              ? message.sender.name.charAt(0).toUpperCase()
                              : "?"}
                          </div>
                        )}
                      </button>

                      <div
                        className={`flex flex-col max-w-[75%] ${
                          isOwnMessage ? "items-end" : "items-start"
                        }`}
                      >
                        {!isOwnMessage && (
                          <span className="text-[10px] text-gray-500 mb-1 ml-1">
                            {message.sender?.name}
                          </span>
                        )}
                        <div
                          className={`rounded-2xl px-3 py-2 shadow-sm ${
                            isOwnMessage
                              ? "bg-accent-blue text-white rounded-br-none"
                              : "bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-none border border-gray-100 dark:border-gray-600"
                          }`}
                        >
                          {message.replyTo && (
                            <div
                              className={`mb-2 p-2 rounded-lg border-l-4 text-[11px] ${
                                isOwnMessage
                                  ? "bg-white/20 border-white"
                                  : "bg-gray-100 dark:bg-gray-600 border-accent-blue"
                              }`}
                            >
                              <p className="font-bold truncate">
                                {message.replyTo.sender?.name}
                              </p>
                              <p className="italic truncate">
                                {message.replyTo.message}
                              </p>
                            </div>
                          )}
                          <p className="text-xs sm:text-sm leading-relaxed break-words">
                            {message.message}
                          </p>
                          <div className="flex items-center justify-end mt-1 gap-2 opacity-60 text-[9px] sm:text-[10px]">
                            <span>
                              {message.createdAt
                                ? format(new Date(message.createdAt), "HH:mm")
                                : ""}
                            </span>
                            {isOwnMessage ? (
                              <button
                                onClick={() => handleDeleteMessage(message._id)}
                                className="hover:text-red-300"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            ) : (
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
                  );
                })
              )}
              <div ref={messagesEndRef} />

              <AnimatePresence>
                {selectedUser && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px]"
                  >
                    <motion.div
                      initial={{ scale: 0.9, y: 10 }}
                      animate={{ scale: 1, y: 0 }}
                      className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-2xl w-full max-w-[260px] relative border border-gray-200 dark:border-gray-700"
                    >
                      <button
                        onClick={() => setSelectedUser(null)}
                        className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <X className="w-4 h-4 text-gray-400" />
                      </button>
                      <div className="flex flex-col items-center">
                        {selectedUser.avatar ? (
                          <img
                            src={selectedUser.avatar}
                            className="w-20 h-20 rounded-full object-cover border-4 border-accent-blue/20 mb-3"
                            alt=""
                          />
                        ) : (
                          <div className="w-20 h-20 rounded-full bg-accent-blue/5 flex items-center justify-center mb-3 border-2 border-accent-blue/10">
                            <UserIcon className="w-10 h-10 text-accent-blue/40" />
                          </div>
                        )}
                        <h4 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
                          {selectedUser.name}
                        </h4>
                        <p className="text-xs text-gray-500 mb-5 uppercase tracking-wider font-semibold">
                          {selectedUser.role || "Member"}
                        </p>
                        <button
                          onClick={() => setSelectedUser(null)}
                          className="w-full py-2.5 bg-accent-blue text-white rounded-xl text-sm font-bold shadow-lg shadow-accent-blue/30 active:scale-95 transition-transform"
                        >
                          {t("common.close")}
                        </button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {replyingTo && (
              <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                <div className="flex-1 border-l-4 border-accent-blue pl-3 overflow-hidden">
                  <p className="text-[10px] font-bold text-accent-blue truncate">
                    {t("chat.replyingTo")} {replyingTo.sender?.name}
                  </p>
                  <p className="text-[11px] text-gray-400 truncate">
                    {replyingTo.message}
                  </p>
                </div>
                <button
                  onClick={() => setReplyingTo(null)}
                  className="ml-2 text-gray-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <form
              onSubmit={handleSendMessage}
              className="p-4 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700"
            >
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder={t("chat.placeholder")}
                  className="flex-1 px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-accent-blue dark:text-white"
                />
                <button
                  type="submit"
                  disabled={!messageText.trim()}
                  className="p-3 bg-accent-blue text-white rounded-full hover:shadow-lg disabled:opacity-50 transition-all active:scale-90"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
