"use client";

import React from 'react';
import { CheckCircle2, AlertTriangle, Info, X, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EnhancedToastProps {
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  description?: string;
  onClose?: () => void;
  className?: string;
}

const EnhancedToast: React.FC<EnhancedToastProps> = ({
  type,
  title,
  description,
  onClose,
  className
}) => {
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'error':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-amber-600" />;
      case 'info':
        return <Info className="h-5 w-5 text-blue-600" />;
    }
  };

  const getStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-900';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-900';
      case 'warning':
        return 'bg-amber-50 border-amber-200 text-amber-900';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-900';
    }
  };

  return (
    <div className={cn(
      "relative flex items-start gap-3 p-4 rounded-lg border shadow-lg animate-slide-in-right",
      getStyles(),
      className
    )}>
      <div className="flex-shrink-0 mt-0.5">
        {getIcon()}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-semibold text-sm">{title}</p>
            {description && (
              <p className="text-sm opacity-90 mt-1">{description}</p>
            )}
          </div>
          
          {onClose && (
            <button
              onClick={onClose}
              className="flex-shrink-0 p-1 rounded-md hover:bg-black/10 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
      
      {/* Animated progress bar for auto-dismiss */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/10 rounded-b-lg overflow-hidden">
        <div className="h-full bg-current animate-shimmer opacity-30"></div>
      </div>
    </div>
  );
};

export default EnhancedToast;
export { EnhancedToast };