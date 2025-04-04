
import React from 'react';
import { cn } from '../../lib/utils';

const Card = ({ 
  children, 
  className,
  glassEffect = false,
  hoverable = false,
  ...props 
}) => {
  return (
    <div 
      className={cn(
        'rounded-xl border border-border bg-card text-card-foreground shadow-sm p-6',
        glassEffect && 'glass-card',
        hoverable && 'transition-all duration-300 hover:shadow-md hover:-translate-y-1',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

const CardHeader = ({ children, className, ...props }) => {
  return (
    <div 
      className={cn('flex flex-col space-y-1.5 pb-4', className)} 
      {...props}
    >
      {children}
    </div>
  );
};

const CardTitle = ({ children, className, ...props }) => {
  return (
    <h3 
      className={cn('font-semibold text-lg leading-none tracking-tight', className)} 
      {...props}
    >
      {children}
    </h3>
  );
};

const CardDescription = ({ children, className, ...props }) => {
  return (
    <p 
      className={cn('text-sm text-muted-foreground', className)} 
      {...props}
    >
      {children}
    </p>
  );
};

const CardContent = ({ children, className, ...props }) => {
  return (
    <div 
      className={cn('py-2', className)} 
      {...props}
    >
      {children}
    </div>
  );
};

const CardFooter = ({ children, className, ...props }) => {
  return (
    <div 
      className={cn('flex items-center pt-4', className)} 
      {...props}
    >
      {children}
    </div>
  );
};

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
