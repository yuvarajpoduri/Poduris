import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface ConfettiProps {
  count?: number;
  size?: number;
  colors?: string[];
}

const DEFAULT_COLORS = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#1A535C', '#FF9F1C'];

export const Confetti: React.FC<ConfettiProps> = ({ 
  count = 50, 
  size = 10,
  colors = DEFAULT_COLORS 
}) => {
  const [particles, setParticles] = useState<any[]>([]);

  useEffect(() => {
    const newParticles = Array.from({ length: count }).map((_, i) => ({
      id: i,
      x: Math.random() * 100, // percentage
      y: -20 - Math.random() * 100, // start above
      rotation: Math.random() * 360,
      scale: 0.5 + Math.random(),
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: Math.random() * 2,
      duration: 3 + Math.random() * 4,
    }));
    setParticles(newParticles);
  }, [count, colors]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ 
            top: `${p.y}%`, 
            left: `${p.x}%`, 
            opacity: 1, 
            rotate: p.rotation,
            scale: p.scale
          }}
          animate={{ 
            top: '120%', 
            rotate: p.rotation + 360,
            opacity: 0
          }}
          transition={{ 
            duration: p.duration, 
            repeat: Infinity, 
            ease: "linear", 
            delay: p.delay 
          }}
          style={{
            position: 'absolute',
            width: size,
            height: size,
            backgroundColor: p.color,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px', // Mix of circles and squares
          }}
        />
      ))}
    </div>
  );
};
