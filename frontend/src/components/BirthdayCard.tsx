import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Cake, Sparkles, Send, Check, Crown } from 'lucide-react';
import { Confetti } from './Confetti';
import { wishAPI } from '../utils/api';
import { formatPoduriName } from '../utils/formatUtils';

interface BirthdayCardProps {
  memberName: string;
  avatar?: string;
  isCurrentUser: boolean;
  recipientId?: number;
}

/* =========================================================================
   MY BIRTHDAY VIEW (Ultra Premium)
   ========================================================================= */
const MyBirthdayView: React.FC<{ memberName: string; avatar?: string }> = ({ memberName, avatar }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative overflow-hidden rounded-[2.5rem] bg-black text-white shadow-2xl ring-1 ring-white/10"
    >
        {/* Deep Animated Background */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/40 via-gray-900 to-black z-0" />
        <motion.div 
            animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.5, 0.3]
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            className="absolute -top-24 -right-24 w-96 h-96 bg-orange-600/20 rounded-full blur-[100px] pointer-events-none" 
        />
        
        <div className="relative z-10 px-8 py-12 md:py-16 flex flex-col items-center text-center">
            {/* Crowned Avatar */}
            <div className="relative mb-8">
                <motion.div
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="absolute -top-6 left-1/2 -translate-x-1/2 z-20"
                >
                    <Crown className="w-12 h-12 text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)] fill-yellow-400" />
                </motion.div>
                
                <div className="w-28 h-28 md:w-36 md:h-36 rounded-3xl p-1 bg-gradient-to-br from-yellow-400 via-orange-500 to-pink-500 rotate-3 transition-transform hover:rotate-0 duration-500 shadow-2xl">
                    <div className="w-full h-full rounded-[1.4rem] overflow-hidden bg-gray-900 border-2 border-white/10">
                        {avatar ? (
                            <img src={avatar} alt={memberName} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-4xl font-black text-white/20">
                                {formatPoduriName(memberName).charAt(0)}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-4 max-w-xl"
            >
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 backdrop-blur-md border border-white/10 text-[10px] font-black uppercase tracking-[0.2em] text-yellow-400">
                    <Sparkles className="w-3 h-3" />
                    Today is Your Day
                </div>
                
                <h2 className="text-4xl md:text-6xl font-black tracking-tighter leading-none">
                    Happy Birthday,<br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-orange-400 to-pink-500">
                        {formatPoduriName(memberName)}
                    </span>
                </h2>
                
                <p className="text-lg text-gray-400 font-medium leading-relaxed">
                    Celebrating another brilliant chapter in your story. May your day be as remarkable as you are!
                </p>
            </motion.div>
        </div>
    </motion.div>
  );
};

/* =========================================================================
   FRIEND BIRTHDAY VIEW (Sleek & Visual)
   ========================================================================= */
const FriendBirthdayView: React.FC<BirthdayCardProps> = ({ 
  memberName, 
  avatar,
  recipientId
}) => {
  const [hasWished, setHasWished] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkWishStatus = async () => {
        if (!recipientId) return;
        try {
            const sentIds = await wishAPI.getSentIds();
            if (sentIds.includes(recipientId)) {
                setHasWished(true);
            }
        } catch (error) {
            console.error("Failed to check wish status", error);
        }
    };
    checkWishStatus();
  }, [recipientId]);

  const handleWish = async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!recipientId || hasWished || loading) return;
      
      try {
          setLoading(true);
          await wishAPI.send(recipientId);
          setHasWished(true);
      } catch (error) {
          console.error("Failed to send wish", error);
      } finally {
          setLoading(false);
      }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative h-32 md:h-40 overflow-hidden rounded-[2rem] bg-white dark:bg-gray-900 shadow-xl border border-gray-100 dark:border-white/10 transition-all duration-500"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-orange-50/50 via-transparent to-pink-50/50 dark:from-orange-500/5 dark:to-pink-500/5" />
      <Confetti count={20} size={4} colors={['#F59E0B', '#EC4899', '#8B5CF6']} />

      <div className="relative z-10 h-full p-6 flex items-center justify-between gap-6">
        <div className="flex items-center gap-6 flex-1 min-w-0">
            {/* Avatar with Ring */}
            <div className="relative shrink-0">
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl p-1 bg-gradient-to-br from-yellow-400 via-orange-500 to-pink-500 shadow-lg group-hover:scale-105 transition-transform duration-500">
                    <div className="w-full h-full rounded-[0.9rem] overflow-hidden bg-white dark:bg-gray-800">
                        {avatar ? (
                            <img src={avatar} alt={memberName} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-2xl font-black text-gray-200 dark:text-gray-700">
                                {formatPoduriName(memberName).charAt(0)}
                            </div>
                        )}
                    </div>
                </div>
                <div className="absolute -top-2 -right-2 bg-white dark:bg-gray-800 p-1.5 rounded-full shadow-lg border border-gray-100 dark:border-white/10">
                    <Cake className="w-4 h-4 text-orange-500" strokeWidth={2.5} />
                </div>
            </div>

            <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-500 mb-1">Birthday Today</p>
                <h3 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white truncate tracking-tight">
                    {formatPoduriName(memberName)}
                </h3>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">
                    Send your best wishes! ✨
                </p>
            </div>
        </div>
        
        <div className="shrink-0">
            <button 
                onClick={handleWish}
                disabled={hasWished || loading}
                className={`relative overflow-hidden px-6 py-3 md:px-8 md:py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all duration-300 transform active:scale-95 shadow-xl
                    ${hasWished 
                        ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 cursor-default'
                        : 'bg-orange-600 text-white hover:bg-orange-700 hover:shadow-orange-600/30'
                    }
                `}
            >
                <span className="relative z-10 flex items-center gap-3">
                    {loading ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : hasWished ? (
                        <>
                            <Check className="w-5 h-5" />
                            <span>Sent</span>
                        </>
                    ) : (
                        <>
                            <Send className="w-5 h-5" />
                            <span>Wish</span>
                        </>
                    )}
                </span>
            </button>
        </div>
      </div>
    </motion.div>
  );
};

export const BirthdayCard: React.FC<BirthdayCardProps> = (props) => {
  if (props.isCurrentUser) {
    return <MyBirthdayView memberName={props.memberName} avatar={props.avatar} />;
  }
  return <FriendBirthdayView {...props} />;
};
