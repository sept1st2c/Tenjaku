
import React from 'react';
import { cn } from '../../lib/utils';

const Button = ({ 
  children, 
  variant = 'default', 
  size = 'default', 
  className,
  disabled,
  ...props 
}) => {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
        {
          'bg-primary text-primary-foreground hover:bg-primary/90': variant === 'default',
          'bg-destructive text-destructive-foreground hover:bg-destructive/90': variant === 'destructive',
          'bg-secondary text-secondary-foreground hover:bg-secondary/80': variant === 'secondary',
          'border border-input bg-background hover:bg-accent hover:text-accent-foreground': variant === 'outline',
          'bg-work-300 text-white hover:bg-work-400': variant === 'work',
          'bg-life-300 text-white hover:bg-life-400': variant === 'life',
          'bg-balance-300 text-white hover:bg-balance-400': variant === 'balance',
          'bg-transparent text-foreground underline-offset-4 hover:underline': variant === 'link',
          'h-10 px-4 py-2': size === 'default',
          'h-9 rounded-md px-3': size === 'sm',
          'h-11 rounded-md px-8': size === 'lg',
          'h-8 w-8 p-0': size === 'icon',
        },
        className
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
