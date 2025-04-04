
import React from 'react';
import { cn } from '../../lib/utils';

const Badge = ({ 
  children, 
  variant = 'default', 
  size = 'default',
  className, 
  ...props 
}) => {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        {
          'bg-primary text-primary-foreground hover:bg-primary/80': variant === 'default',
          'bg-secondary text-secondary-foreground': variant === 'secondary',
          'bg-destructive text-destructive-foreground hover:bg-destructive/90': variant === 'destructive',
          'bg-work-300 text-white hover:bg-work-400': variant === 'work',
          'bg-life-300 text-white hover:bg-life-400': variant === 'life',
          'bg-balance-300 text-white hover:bg-balance-400': variant === 'balance',
          'border border-border': variant === 'outline',
          'bg-transparent text-foreground hover:bg-secondary': variant === 'ghost',
          'px-2.5 py-0.5 text-xs': size === 'default',
          'px-1.5 py-0.5 text-[10px]': size === 'sm',
          'px-3 py-1 text-sm': size === 'lg',
        },
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};

export default Badge;
