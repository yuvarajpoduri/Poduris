import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Cake, Sparkles, Send, Check } from 'lucide-react';
import { Confetti } from './Confetti';
import { wishAPI } from '../utils/api';

interface BirthdayCardProps {
  memberName: string;
  avatar?: string;
  isCurrentUser: boolean;
  recipientId?: number;
}

/* =========================================================================
   MY BIRTHDAY VIEW
   ========================================================================= */
/* =========================================================================
   MY BIRTHDAY VIEW (Premium & Professional)
   ========================================================================= */
const MyBirthdayView: React.FC<{ memberName: string; avatar?: string }> = ({ memberName, avatar }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }} // smooth ease-out
      className="relative overflow-hidden rounded-2xl border border-white/50 dark:border-white/10 shadow-sm transition-colors duration-300"
    >
        {/*
            Background System:
            Using refined gradients that feel warm in light mode and deep/sophisticated in dark mode.
        */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-white to-orange-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 z-0" />
        
        {/* Ambient Glow Effects for "Special" feel */}
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[120%] bg-gradient-to-r from-orange-200/20 to-transparent dark:from-indigo-500/10 dark:to-transparent blur-3xl rounded-full mix-blend-multiply dark:mix-blend-layout" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[120%] bg-gradient-to-l from-yellow-200/20 to-transparent dark:from-purple-500/10 dark:to-transparent blur-3xl rounded-full mix-blend-multiply dark:mix-blend-layout" />

        <div className="relative z-10 px-8 py-10 md:px-12 md:py-14 text-center">
            {/* Avatar Section: Replaces Icon with User Image */}
            <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="relative inline-block mb-6"
            >
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-full p-[3px] bg-gradient-to-tr from-orange-300 via-amber-200 to-white shadow-lg mx-auto">
                    <div className="w-full h-full rounded-full overflow-hidden bg-white dark:bg-slate-800 flex items-center justify-center relative border-2 border-white dark:border-slate-900">
                        {avatar ? (
                            <img src={avatar} alt={memberName} className="w-full h-full object-cover" />
                        ) : (
                            <div className="text-3xl font-bold text-orange-400 dark:text-orange-200">
                                {memberName.charAt(0).toUpperCase()}
                            </div>
                        )}
                    </div>
                </div>
                {/* Minimalist Floating Icon Badge */}
                <div className="absolute -bottom-1 -right-1 bg-white dark:bg-slate-800 rounded-full p-2 shadow-md border border-gray-100 dark:border-gray-700">
                    <Cake className="w-4 h-4 text-orange-500" strokeWidth={2} />
                </div>
            </motion.div>

            {/* Typography Logic: Hierarchy & Balance */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
            >
                <h3 className="text-sm uppercase tracking-widest text-gray-500 dark:text-gray-400 font-medium mb-3">
                    Today is Special
                </h3>
                <h2 className="text-3xl md:text-4xl font-semibold text-gray-900 dark:text-white tracking-tight leading-tight mb-4">
                    Happy Birthday, <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-600 dark:from-orange-300 dark:to-amber-200">{memberName}</span>
                </h2>
                <p className="text-base md:text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed font-light">
                    Here’s to another year of growth, joy, and achievements. Enjoy your day!
                </p>
            </motion.div>
        </div>
        
        {/* Subtle Bottom Accent Line */}
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-orange-300/50 dark:via-indigo-400/30 to-transparent opacity-80" />
    </motion.div>
  );
};

/* =========================================================================
   FRIEND BIRTHDAY VIEW
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
            const sentIds = await wishAPI.getSentIds(); // Use API to check
            if (sentIds.includes(recipientId)) {
                setHasWished(true);
            }
        } catch (error) {
            console.error("Failed to check wish status", error);
        }
    };
    checkWishStatus();
  }, [recipientId]);

  const handleWish = async () => {
      if (!recipientId || hasWished || loading) return;
      
      try {
          setLoading(true);
          await wishAPI.send(recipientId);
          setHasWished(true);
      } catch (error) {
          console.error("Failed to send wish", error);
          alert("Failed to send wish. You might have already wished them!");
      } finally {
          setLoading(false);
      }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      className="group relative overflow-hidden rounded-2xl bg-white dark:bg-gray-800 shadow-xl border border-gray-100 dark:border-gray-700 transition-all duration-300"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-transparent to-pink-50/50 dark:from-blue-900/10 dark:to-purple-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <Confetti count={40} size={5} colors={['#60A5FA', '#F472B6', '#34D399', '#FBBF24']} />

      <div className="relative z-10 p-4 md:p-5 flex flex-row items-center gap-4">
        <div className="relative flex-shrink-0">
          <div className="relative w-14 h-14 md:w-18 md:h-18 rounded-full p-[2px] bg-gradient-to-tr from-blue-400 via-pink-400 to-yellow-400 ">
             <div className="w-full h-full rounded-full overflow-hidden bg-white dark:bg-gray-800 flex items-center justify-center relative">
                {avatar ? (
                    <img src={avatar} alt={memberName} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 text-xl md:text-2xl font-bold text-gray-500 dark:text-gray-300">
                        {memberName.charAt(0).toUpperCase()}
                    </div>
                )}
             </div>
          </div>
        </div>

        <div className="flex-1 min-w-0">
           <div className="flex flex-col items-start text-left">
             <div className="flex items-center gap-2">
                <h3 className="text-base md:text-xl font-bold text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {memberName}
                </h3>
                <Sparkles className="w-4 h-4 text-yellow-500 hidden sm:block" />
             </div>
             
             <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-0.5 font-medium">
               It's their special day! 🎉
             </p>
           </div>
        </div>
        
        <div className="flex-shrink-0">
            <button 
                onClick={handleWish}
                disabled={hasWished || loading}
                className={`px-3 py-1.5 md:px-4 md:py-2 rounded-full text-xs font-bold uppercase tracking-wide transition-all flex items-center gap-1.5 md:gap-2
                    ${hasWished 
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 cursor-default'
                        : 'bg-blue-100 text-blue-600 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50'
                    }
                `}
            >
                {loading ? (
                    <span className="animate-pulse">...</span>
                ) : hasWished ? (
                    <>
                        <Check className="w-3 h-3 md:w-4 md:h-4" />
                        <span className="hidden sm:inline">Wished</span>
                    </>
                ) : (
                    <>
                        <Send className="w-3 h-3 md:w-4 md:h-4" />
                        <span>Wish</span>
                    </>
                )}
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
