import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const Balloon = ({ color, delay, left }: { color: string; delay: number; left: string }) => {
  return (
    <motion.div
      initial={{ y: '100vh', opacity: 0, scale: 0.5, rotate: 0 }}
      animate={{ 
        y: '-100vh', 
        opacity: [0, 1, 1, 0],
        scale: [0.5, 1, 1.2, 1],
        rotate: [0, 10, -10, 0],
        x: [0, 20, -20, 0]
      }}
      transition={{ 
        duration: 8, 
        delay, 
        ease: "easeInOut",
        times: [0, 0.1, 0.8, 1]
      }}
      className="absolute pointer-events-none"
      style={{ left }}
    >
      <div className="relative">
        <div 
          className="w-12 h-16 rounded-full shadow-lg" 
          style={{ 
            backgroundColor: color,
            boxShadow: `inset -5px -5px 15px rgba(0,0,0,0.2), 5px 5px 15px ${color}88`
          }}
        />
        <div className="w-0.5 h-20 bg-gray-400 mx-auto -mt-1 opacity-50" />
      </div>
    </motion.div>
  );
};

export const BirthdayBalloons = ({ active }: { active: boolean }) => {
  const [balloons, setBalloons] = useState<{ id: number; color: string; delay: number; left: string }[]>([]);
  
  const colors = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#FF9F43', '#A55EEF', '#45AAF2'];

  useEffect(() => {
    if (active) {
      const newBalloons = Array.from({ length: 30 }).map((_, i) => ({
        id: i,
        color: colors[Math.floor(Math.random() * colors.length)],
        delay: Math.random() * 5,
        left: `${Math.random() * 90 + 5}%`
      }));
      setBalloons(newBalloons);
    } else {
      setBalloons([]);
    }
  }, [active]);

  return (
    <div className="fixed inset-0 pointer-events-none z-[60] overflow-hidden">
      <AnimatePresence>
        {active && balloons.map(b => (
          <Balloon key={b.id} {...b} />
        ))}
      </AnimatePresence>
    </div>
  );
};
