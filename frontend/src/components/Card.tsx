import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverEffect?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  onClick,
  hoverEffect = false,
}) => {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 transition-all duration-200 ${
        hoverEffect ? 'hover:shadow-md hover:border-[#9D0208]/40 cursor-pointer transform hover:-translate-y-0.5' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
};
