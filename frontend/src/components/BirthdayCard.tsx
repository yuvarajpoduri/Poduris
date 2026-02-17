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
      className="relative overflow-hidden rounded-[3rem] bg-black text-white shadow-[0_20px_50px_rgba(0,0,0,0.5)] ring-1 ring-white/10"
    >
        {/* Mesh Gradient Background */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-600/30 blur-[120px] rounded-full animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-orange-600/30 blur-[120px] rounded-full animate-pulse [animation-delay:2s]" />
          <div className="absolute top-[20%] right-[10%] w-[40%] h-[40%] bg-pink-600/20 blur-[100px] rounded-full animate-pulse [animation-delay:4s]" />
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
        </div>

        <Confetti count={60} size={12} colors={['#FFD700', '#FFA500', '#FF69B4', '#00CED1']} />
        
        <div className="relative z-10 px-8 py-16 md:py-24 flex flex-col items-center text-center">
            {/* Crowned Avatar */}
            <div className="relative mb-10">
                <motion.div
                    initial={{ y: -20, opacity: 0, rotate: -10 }}
                    animate={{ y: 0, opacity: 1, rotate: 0 }}
                    transition={{ 
                      type: "spring",
                      stiffness: 260,
                      damping: 20,
                      delay: 0.5 
                    }}
                    className="absolute -top-10 left-1/2 -translate-x-1/2 z-20"
                >
                    <Crown className="w-16 h-16 text-yellow-400 drop-shadow-[0_0_20px_rgba(250,204,21,0.8)] fill-yellow-400" />
                </motion.div>
                
                <div className="relative w-32 h-32 md:w-44 md:h-44 rounded-[2.5rem] p-1.5 bg-gradient-to-br from-yellow-300 via-orange-500 to-pink-600 rotate-3 transition-all hover:rotate-0 duration-700 shadow-[0_10px_40px_rgba(249,115,22,0.3)] hover:shadow-[0_20px_60px_rgba(249,115,22,0.5)]">
                    <div className="w-full h-full rounded-[2.1rem] overflow-hidden bg-gray-900 border-2 border-white/20">
                        {avatar ? (
                            <img src={avatar} alt={memberName} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-5xl font-black text-white/30 bg-gradient-to-br from-gray-800 to-gray-900">
                                {formatPoduriName(memberName).charAt(0)}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="space-y-6 max-w-2xl"
            >
                <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 text-[11px] font-black uppercase tracking-[0.3em] text-yellow-300 shadow-xl">
                    <Sparkles className="w-4 h-4 animate-spin-slow" />
                    The Grand Celebration
                </div>
                
                <h2 className="text-5xl md:text-8xl font-black tracking-tighter leading-[0.9] py-2">
                    Happy Birthday,<br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-orange-400 to-pink-500 drop-shadow-sm">
                        {formatPoduriName(memberName)}
                    </span>
                </h2>
                
                <p className="text-xl md:text-2xl text-gray-300 font-medium leading-relaxed max-w-lg mx-auto opacity-80">
                    A toast to your amazing journey. May this year be your most extraordinary one yet!
                </p>

                <div className="pt-8 flex justify-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                    <Cake className="w-6 h-6 text-orange-400" />
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-pink-400" />
                  </div>
                </div>
            </motion.div>
        </div>
    </motion.div>
  );
};

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
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      className="group relative h-36 md:h-44 overflow-hidden rounded-[2.5rem] bg-white dark:bg-black shadow-[0_20px_40px_rgba(0,0,0,0.05)] dark:shadow-none border border-gray-100 dark:border-white/10 transition-all duration-500"
    >
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-orange-400/10 blur-[60px] rounded-full" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-pink-400/10 blur-[60px] rounded-full" />
      </div>

      <div className="absolute inset-0 bg-gradient-to-br from-orange-50/40 via-transparent to-pink-50/40 dark:from-orange-500/5 dark:to-pink-500/5" />
      <Confetti count={25} size={6} colors={['#F59E0B', '#EC4899', '#8B5CF6']} />

      <div className="relative z-10 h-full px-8 flex items-center justify-between gap-8">
        <div className="flex items-center gap-8 flex-1 min-w-0">
            {/* Avatar with Animated Ring */}
            <div className="relative shrink-0">
                <div className="absolute inset-[-4px] rounded-[1.8rem] bg-gradient-to-br from-yellow-400 via-orange-500 to-pink-500 opacity-20 group-hover:opacity-100 group-hover:blur-md transition-all duration-500" />
                <div className="relative w-24 h-24 md:w-28 md:h-28 rounded-[1.6rem] p-1 bg-gradient-to-br from-yellow-400 via-orange-500 to-pink-500 shadow-xl group-hover:scale-105 transition-transform duration-500">
                    <div className="w-full h-full rounded-[1.4rem] overflow-hidden bg-white dark:bg-gray-900 border border-white/10">
                        {avatar ? (
                            <img src={avatar} alt={memberName} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-3xl font-black text-gray-200 dark:text-gray-700 bg-gray-50 dark:bg-gray-800">
                                {formatPoduriName(memberName).charAt(0)}
                            </div>
                        )}
                    </div>
                </div>
                <div className="absolute -top-2 -right-2 bg-white dark:bg-gray-800 p-2 rounded-2xl shadow-xl border border-gray-100 dark:border-white/20 group-hover:rotate-12 transition-transform duration-500">
                    <Cake className="w-5 h-5 text-orange-500" strokeWidth={2.5} />
                </div>
            </div>

            <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                 <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                 <p className="text-[11px] font-black uppercase tracking-[0.25em] text-orange-500/80">Birthday Today</p>
                </div>
                <h3 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white truncate tracking-tighter leading-tight group-hover:text-orange-500 transition-colors">
                    {formatPoduriName(memberName)}
                </h3>
                <p className="text-base font-medium text-gray-400 dark:text-gray-500 italic">
                    Bring a smile to their day ✨
                </p>
            </div>
        </div>
        
        <div className="shrink-0">
            <button 
                onClick={handleWish}
                disabled={hasWished || loading}
                className={`relative group/btn overflow-hidden px-8 py-4 md:px-10 md:py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] transition-all duration-300 transform active:scale-95 shadow-2xl
                    ${hasWished 
                        ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 cursor-default'
                        : 'bg-black dark:bg-white text-white dark:text-black hover:shadow-xl hover:shadow-orange-500/20 active:translate-y-1'
                    }
                `}
            >
                <div className="absolute inset-0 bg-gradient-to-r from-orange-600 to-pink-600 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300" />
                <span className="relative z-10 flex items-center gap-3">
                    {loading ? (
                        <div className="w-5 h-5 border-3 border-current border-t-transparent rounded-full animate-spin" />
                    ) : hasWished ? (
                        <>
                            <Check className="w-5 h-5 animate-bounce-short" />
                            <span>Sent</span>
                        </>
                    ) : (
                        <>
                            <Send className="w-5 h-5 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
                            <span>Send Wish</span>
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
