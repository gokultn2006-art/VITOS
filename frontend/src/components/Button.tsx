import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  icon,
  children,
  className = '',
  ...props
}) => {
  const baseStyle = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-xs';
  
  const variants = {
    primary: 'bg-[#9D0208] hover:bg-[#6A040F] text-white focus:ring-[#9D0208]',
    secondary: 'bg-[#DC2F02] hover:bg-[#D00000] text-white focus:ring-[#DC2F02]',
    outline: 'border border-[#9D0208] text-[#9D0208] hover:bg-amber-50 focus:ring-[#9D0208]',
    ghost: 'text-[#9D0208] hover:bg-amber-50/80 focus:ring-amber-200 shadow-none',
    danger: 'bg-[#6A040F] hover:bg-[#370617] text-white focus:ring-[#6A040F]',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs font-semibold gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-5 py-2.5 text-base gap-2.5',
  };

  return (
    <button
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </button>
  );
};
