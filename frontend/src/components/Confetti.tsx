import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface ConfettiProps {
  count?: number;
  size?: number;
  colors?: string[];
  trigger?: number;
}

const DEFAULT_COLORS = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#1A535C', '#FF9F1C'];

export const Confetti: React.FC<ConfettiProps> = ({ 
  count = 50, 
  size = 8,
  colors = DEFAULT_COLORS,
  trigger = 0
}) => {
  const [particles, setParticles] = useState<any[]>([]);
  const [activeBatches, setActiveBatches] = useState<number[]>([]);

  useEffect(() => {
    if (trigger === 0 || activeBatches.includes(trigger) || activeBatches.length >= 3) return;

    // Add this batch to tracking
    setActiveBatches(prev => [...prev, trigger]);

    const newParticles = Array.from({ length: count }).map((_, i) => {
      const id = `${trigger}-${i}`;
      return {
        batchId: trigger,
        id,
        x: Math.random() * 100,
        rotation: Math.random() * 360,
        scale: 0.5 + Math.random() * 0.7,
        color: colors[Math.floor(Math.random() * colors.length)],
        delay: Math.random() * 1.5,
        duration: 4 + Math.random() * 3,
        sway: Math.random() * 30 - 15
      };
    });

    setParticles(prev => [...prev, ...newParticles]);

    // Cleanup batch after animation
    const timer = setTimeout(() => {
      setParticles(prev => prev.filter(p => p.batchId !== trigger));
      setActiveBatches(prev => prev.filter(b => b !== trigger));
    }, 10000); // 10 seconds is enough for most particles

    return () => clearTimeout(timer);
  }, [trigger, count, colors, activeBatches]);

  return (
    <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ top: '-10vh', left: `${p.x}vw`, opacity: 0, rotate: p.rotation, scale: p.scale }}
          animate={{ 
            top: '110vh', 
            rotate: p.rotation + 720,
            opacity: [0, 1, 1, 0],
            x: [p.sway, -p.sway, p.sway] 
          }}
          transition={{ 
            duration: p.duration, 
            ease: "linear", 
            delay: p.delay 
          }}
          style={{
            position: 'absolute',
            width: size * p.scale,
            height: (size * 0.4) * p.scale,
            backgroundColor: p.color,
            borderRadius: '1px',
            willChange: 'transform, opacity'
          }}
        />
      ))}
    </div>
  );
};
