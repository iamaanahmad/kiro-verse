"use client";

import { Switch } from '@/components/ui/switch';
import { Zap, Shield } from 'lucide-react';

interface CompactDemoToggleProps {
  demoMode: boolean;
  onToggle: (newMode: boolean) => void;
}

export default function CompactDemoToggle({ demoMode, onToggle }: CompactDemoToggleProps) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-full border border-white/20 dark:border-slate-700/50 shadow-sm">
      <div className="flex items-center gap-2">
        {demoMode ? (
          <Zap className="h-3 w-3 text-blue-500" />
        ) : (
          <Shield className="h-3 w-3 text-green-500" />
        )}
        <span className="text-xs font-medium text-muted-foreground">
          {demoMode ? 'Demo' : 'Live'}
        </span>
      </div>
      <Switch
        checked={demoMode}
        onCheckedChange={onToggle}
        className="scale-75"
      />
    </div>
  );
}