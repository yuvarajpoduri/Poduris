import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

interface RevealProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  delay?: number;
  width?: "fit-content" | "100%" | "auto";
  className?: string;
}

export const Reveal: React.FC<RevealProps> = ({ 
    children, 
    delay = 0, 
    width = "100%", 
    className= "", 
    ...props 
}) => {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 30 },
        visible: { 
            opacity: 1, 
            y: 0,
            transition: {
                duration: 0.6,
                ease: [0.22, 1, 0.36, 1], // Custom easy-out curve
                delay
            }
        }
      }}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }} // Trigger slightly before full view
      style={{ width }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
};

// Stagger Container helper
export const StaggerContainer: React.FC<RevealProps> = ({ 
    children, 
    delay = 0, 
    className = "", 
    ...props 
}) => {
    return (
        <motion.div
            variants={{
                hidden: { opacity: 0 },
                visible: {
                    opacity: 1,
                    transition: {
                        staggerChildren: 0.1,
                        delayChildren: delay
                    }
                }
            }}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className={className}
            {...props}
        >
            {children}
        </motion.div>
    );
};
