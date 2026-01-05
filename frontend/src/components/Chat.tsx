import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { chatAPI } from "../utils/api";
import type { ChatMessage } from "../types";
import { MessageCircle, X, Send, Trash2, Reply } from "lucide-react";
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && user?.status === "approved") {
      fetchMessages();
    }
  }, [isOpen, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
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

    try {
      await chatAPI.sendMessage(messageText, undefined, replyingTo?._id, true);
      setMessageText("");
      setReplyingTo(null);
      fetchMessages();
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!window.confirm(t("chat.deleteConfirm"))) {
      return;
    }

    try {
      await chatAPI.deleteMessage(messageId);
      fetchMessages();
    } catch (error) {
      console.error("Failed to delete message:", error);
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
            className="fixed bottom-24 right-2 sm:right-4 md:bottom-24 lg:bottom-8 z-50 w-[calc(100%-1rem)] sm:w-full sm:max-w-md h-[70vh] sm:h-[65vh] lg:h-[600px] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl flex flex-col border-2 border-gray-200 dark:border-gray-700"
          >
            {/* Header */}
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

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900/50">
              {loading ? (
                <div className="flex justify-center items-center h-full text-gray-500 text-sm sm:text-base">
                  <span className="animate-pulse">{t("chat.loading")}</span>
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center text-gray-500 mt-10 text-sm sm:text-base">
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
                      className={`flex w-full gap-2 ${
                        isOwnMessage ? "justify-end" : "justify-start"
                      }`}
                    >
                      {!isOwnMessage && (
                        <div className="flex-shrink-0">
                          {message.sender?.avatar ? (
                            <img
                              src={message.sender.avatar}
                              alt={message.sender.name}
                              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover border-2 border-accent-blue/60 bg-gray-200"
                            />
                          ) : (
                            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-accent-blue/20 flex items-center justify-center text-xs sm:text-sm font-semibold text-accent-blue">
                              {message.sender?.name
                                ? message.sender.name.charAt(0).toUpperCase()
                                : "?"}
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex max-w-[80%] flex-col items-stretch">
                        {!isOwnMessage && (
                          <span className="text-[11px] sm:text-xs text-gray-500 ml-1 mb-1">
                            {message.sender?.name || "Unknown Member"}
                          </span>
                        )}

                        <div
                          className={`rounded-2xl px-3 sm:px-4 py-2 shadow-sm ${
                            isOwnMessage
                              ? "bg-accent-blue text-white rounded-tr-none self-end"
                              : "bg-white dark:bg-gray-700 text-black dark:text-white rounded-tl-none border border-gray-200 dark:border-gray-600 self-start"
                          }`}
                        >
                          {message.replyTo && (
                            <div
                              className={`mb-2 p-2 rounded-lg border-l-4 text-xs ${
                                isOwnMessage
                                  ? "bg-white/20 border-white"
                                  : "bg-gray-200 dark:bg-gray-600 border-accent-blue"
                              }`}
                            >
                              <p className="font-bold">
                                {message.replyTo.sender?.name || "User"}
                              </p>
                              <p className="italic truncate">
                                {message.replyTo.message}
                              </p>
                            </div>
                          )}

                          <p className="text-xs sm:text-sm leading-relaxed break-words">
                            {message.message}
                          </p>

                          <div className="flex items-center justify-end mt-1 space-x-2 opacity-70">
                            <span className="text-[10px] sm:text-[11px]">
                              {message.createdAt
                                ? format(new Date(message.createdAt), "HH:mm")
                                : ""}
                            </span>

                            {isOwnMessage ? (
                              <button
                                onClick={() => handleDeleteMessage(message._id)}
                                className="hover:text-red-300 transition-colors"
                              >
                                <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                              </button>
                            ) : (
                              <button
                                onClick={() => setReplyingTo(message)}
                                className="hover:text-accent-blue transition-colors"
                              >
                                <Reply className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
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
            </div>

            {/* Reply Input Preview */}
            {replyingTo && (
              <div className="px-4 py-2 bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <div className="flex-1 border-l-4 border-accent-blue pl-3">
                  <p className="text-xs sm:text-sm font-bold text-accent-blue">
                    {t("chat.replyingTo")} {replyingTo.sender?.name}
                  </p>
                  <p className="text-[11px] sm:text-xs text-gray-500 truncate">
                    {replyingTo.message}
                  </p>
                </div>
                <button onClick={() => setReplyingTo(null)}>
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            )}

            {/* Message Input Form */}
            <form
              onSubmit={handleSendMessage}
              className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 rounded-b-2xl"
            >
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder={t("chat.placeholder")}
                  className="flex-1 px-3 sm:px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-full bg-gray-50 dark:bg-gray-700 text-black dark:text-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-accent-blue"
                />
                <button
                  type="submit"
                  disabled={!messageText.trim()}
                  className="p-3 bg-accent-blue text-white rounded-full hover:bg-accent-blue/90 disabled:opacity-50 transition-all shadow-md"
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
