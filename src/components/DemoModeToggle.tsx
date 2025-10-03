"use client";

import { useState, useEffect } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Zap, Shield, AlertTriangle, CheckCircle } from 'lucide-react';
// Removed server action imports - using API routes instead
import { useToast } from '@/hooks/use-toast';

interface DemoModeToggleProps {
  demoMode: boolean;
  onToggle: (demoMode: boolean) => void;
}

export default function DemoModeToggle({ demoMode, onToggle }: DemoModeToggleProps) {
  const [loading, setLoading] = useState(false);

  const handleToggle = async (newMode: boolean) => {
    setLoading(true);
    try {
      onToggle(newMode);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {demoMode ? (
            <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg">
              <Zap className="h-4 w-4 text-white" />
            </div>
          ) : (
            <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg">
              <Shield className="h-4 w-4 text-white" />
            </div>
          )}
          <div>
            <h4 className="font-semibold">
              {demoMode ? "Demo Mode" : "Production Mode"}
            </h4>
            <p className="text-sm text-muted-foreground">
              {demoMode 
                ? "Fast badge creation with mock blockchain"
                : "Real NFT minting on Sepolia testnet"
              }
            </p>
          </div>
        </div>
        <Badge variant={demoMode ? "secondary" : "default"} className="ml-4">
          {demoMode ? "Mock" : "Live"}
        </Badge>
      </div>

      <div className="flex items-center space-x-3">
        <Switch
          id="demo-mode"
          checked={demoMode}
          onCheckedChange={handleToggle}
          disabled={loading}
        />
        <Label htmlFor="demo-mode" className="text-sm font-medium">
          {demoMode ? "Switch to Production Mode" : "Switch to Demo Mode"}
        </Label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div className={`p-4 rounded-xl border transition-all ${
          demoMode 
            ? 'bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/50 dark:to-cyan-950/50 border-blue-200 dark:border-blue-800' 
            : 'bg-muted/50 border-muted'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            <Zap className="h-4 w-4 text-blue-500" />
            <span className="font-medium text-blue-900 dark:text-blue-100">Demo Mode</span>
          </div>
          <ul className="space-y-1 text-blue-700 dark:text-blue-300 text-xs">
            <li>• Instant badge creation</li>
            <li>• Mock transaction hashes</li>
            <li>• Perfect for demonstrations</li>
            <li>• No blockchain fees</li>
          </ul>
        </div>

        <div className={`p-4 rounded-xl border transition-all ${
          !demoMode 
            ? 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50 border-green-200 dark:border-green-800' 
            : 'bg-muted/50 border-muted'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-4 w-4 text-green-500" />
            <span className="font-medium text-green-900 dark:text-green-100">Production Mode</span>
          </div>
          <ul className="space-y-1 text-green-700 dark:text-green-300 text-xs">
            <li>• Real NFT minting on Sepolia</li>
            <li>• Verifiable on Etherscan</li>
            <li>• Permanent blockchain records</li>
            <li>• Requires gas fees (~$0.01)</li>
          </ul>
        </div>
      </div>

      {!demoMode && (
        <div className="flex items-start gap-2 p-3 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/50 dark:to-orange-950/50 rounded-lg border border-amber-200 dark:border-amber-800">
          <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium text-amber-900 dark:text-amber-100 text-sm">Production Requirements</p>
            <p className="text-amber-700 dark:text-amber-300 text-xs mt-1">
              Requires valid Sepolia RPC URL, wallet private key, and NFT contract address in environment variables.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}