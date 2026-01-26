import React, { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  hover?: boolean;
  noPadding?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className = '', onClick, hover = false, noPadding = false }) => {
  return (
    <div
      className={`card ${noPadding ? '!p-0' : ''} ${hover || onClick ? 'card-hover' : ''} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      } : undefined}
    >
      {children}
    </div>
  );
};
