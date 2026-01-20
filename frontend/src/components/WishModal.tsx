import React, { useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Send, Sparkles } from 'lucide-react';
import { wishAPI } from '../utils/api';
import { useToast } from '../context/ToastContext';

interface WishModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipientId: string | number; // Support both, will parse
  recipientName: string;
  onSuccess?: () => void;
}

const PREDEFINED_WISHES = [
  "Happy Birthday! 🎉 Wishing you a fantastic day!",
  "Have a wonderful birthday filled with joy! 🎂",
  "Wishing you health, happiness, and success! 🌟",
  "Happy Birthday! Hope all your birthday wishes come true! 🎁",
  "Another adventure-filled year awaits you. Welcome it with a bang! 🚀",
  "May your day be as special as you are! ✨"
];

export const WishModal: React.FC<WishModalProps> = ({ isOpen, onClose, recipientId, recipientName, onSuccess }) => {
  const { showToast } = useToast();
  const [customMessage, setCustomMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async (message: string) => {
    setSending(true);
    try {
      const id = typeof recipientId === 'string' ? parseInt(recipientId) : recipientId;
      if (isNaN(id)) throw new Error("Invalid recipient ID");

      await wishAPI.send(id, message);
      
      showToast('Wish sent successfully!', 'success');
      if (onSuccess) {
        onSuccess();
      }
      onClose();
      setCustomMessage('');
    } catch (error: any) {
      console.error("Failed to send wish", error);
      showToast(error.response?.data?.message || 'Failed to send wish', 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Wish ${recipientName}`}>
      <div className="space-y-5">
        <div className="bg-orange-50 dark:bg-orange-900/10 p-4 rounded-xl border border-orange-100 dark:border-orange-800/30">
            <h4 className="text-sm font-bold text-orange-800 dark:text-orange-300 flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4" />
                Select a message
            </h4>
            <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
            {PREDEFINED_WISHES.map((wish, index) => (
                <button
                key={index}
                onClick={() => handleSend(wish)}
                disabled={sending}
                className="text-left p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-orange-300 dark:hover:border-orange-500 hover:shadow-sm transition-all text-sm text-gray-700 dark:text-gray-300 active:scale-98"
                >
                {wish}
                </button>
            ))}
            </div>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
          </div>
          <div className="relative flex justify-center">
            <span className="px-2 bg-white dark:bg-gray-800 text-sm text-gray-500">Or write your own</span>
          </div>
        </div>

        <div>
          <textarea
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            placeholder={`Type a personal message for ${recipientName}...`}
            className="w-full p-4 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-orange-500 outline-none resize-none transition-all placeholder:text-gray-400"
            rows={3}
            maxLength={300}
          />
          <div className="flex justify-between items-center mt-2">
            <span className="text-xs text-gray-400">{customMessage.length}/300</span>
            <Button
              onClick={() => handleSend(customMessage)}
              disabled={!customMessage.trim() || sending}
              variant="primary"
              className="flex items-center gap-2 px-6"
            >
              {sending ? (
                  <>Sending...</>
              ) : (
                  <>
                    <Send className="w-4 h-4" /> Send Wish
                  </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
