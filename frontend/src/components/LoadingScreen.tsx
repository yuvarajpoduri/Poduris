import React from 'react';
import { motion } from 'framer-motion';

interface LoadingScreenProps {
  inline?: boolean;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ inline }) => {
  return (
    <div className={`${inline ? 'relative py-20 w-full' : 'fixed inset-0 z-[9999] bg-black'} flex flex-col items-center justify-center`}>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative"
      >
        <span className="font-['Great_Vibes'] text-6xl text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
          Poduri's
        </span>
      </motion.div>
      
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-8"
      >
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{
                opacity: [0.3, 1, 0.3],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.2
              }}
              className="w-1.5 h-1.5 bg-white rounded-full"
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
};
