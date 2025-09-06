"use client";

import React from 'react';
import { Loader2, Bot, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'kiro' | 'sparkles';
  message?: string;
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  variant = 'default', 
  message,
  className 
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  const renderSpinner = () => {
    switch (variant) {
      case 'kiro':
        return (
          <div className="relative">
            <Bot className={cn(sizeClasses[size], "text-primary animate-pulse")} />
            <div className="absolute inset-0 animate-ping">
              <Bot className={cn(sizeClasses[size], "text-primary/30")} />
            </div>
          </div>
        );
      
      case 'sparkles':
        return (
          <div className="relative">
            <Sparkles className={cn(sizeClasses[size], "text-primary animate-spin")} />
            <div className="absolute -inset-1 bg-primary/20 rounded-full animate-pulse"></div>
          </div>
        );
      
      default:
        return <Loader2 className={cn(sizeClasses[size], "animate-spin text-primary")} />;
    }
  };

  return (
    <div className={cn("flex flex-col items-center justify-center gap-2", className)}>
      {renderSpinner()}
      {message && (
        <p className="text-sm text-muted-foreground animate-pulse">{message}</p>
      )}
    </div>
  );
};

export default LoadingSpinner;