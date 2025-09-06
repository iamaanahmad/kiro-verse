"use client";

import { useState, useEffect } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Zap, Shield, AlertTriangle, CheckCircle } from 'lucide-react';
import { getDemoMode, setDemoMode } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';

interface DemoModeToggleProps {
  userId: string;
  onModeChange?: (demoMode: boolean) => void;
}

export default function DemoModeToggle({ userId, onModeChange }: DemoModeToggleProps) {
  const [demoMode, setDemoModeState] = useState(true);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const loadDemoMode = async () => {
      try {
        const currentMode = await getDemoMode(userId);
        setDemoModeState(currentMode);
      } catch (error) {
        console.error('Failed to load demo mode:', error);
      }
    };

    if (userId) {
      loadDemoMode();
    }
  }, [userId]);

  const handleToggle = async (newMode: boolean) => {
    setLoading(true);
    try {
      const result = await setDemoMode(userId, newMode);
      if (result.success) {
        setDemoModeState(newMode);
        onModeChange?.(newMode);
        
        toast({
          title: newMode ? "Demo Mode Enabled" : "Production Mode Enabled",
          description: newMode 
            ? "Badges will be created instantly with mock blockchain transactions"
            : "Badges will be minted as real NFTs on Sepolia testnet",
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update demo mode",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Failed to toggle demo mode:', error);
      toast({
        title: "Error",
        description: "Failed to update demo mode setting",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            {demoMode ? (
              <>
                <Zap className="h-5 w-5 text-blue-500" />
                Demo Mode
              </>
            ) : (
              <>
                <Shield className="h-5 w-5 text-green-500" />
                Production Mode
              </>
            )}
          </CardTitle>
          <Badge variant={demoMode ? "secondary" : "default"}>
            {demoMode ? "Mock" : "Real"}
          </Badge>
        </div>
        <CardDescription>
          {demoMode 
            ? "Fast badge creation with mock blockchain transactions"
            : "Real NFT minting on Sepolia testnet"
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-2">
          <Switch
            id="demo-mode"
            checked={demoMode}
            onCheckedChange={handleToggle}
            disabled={loading}
          />
          <Label htmlFor="demo-mode" className="text-sm font-medium">
            {demoMode ? "Enable Production Mode" : "Enable Demo Mode"}
          </Label>
        </div>

        <div className="space-y-2 text-sm">
          {demoMode ? (
            <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <CheckCircle className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-blue-900">Demo Mode Active</p>
                <p className="text-blue-700">
                  • Instant badge creation<br/>
                  • Mock transaction hashes<br/>
                  • Perfect for demonstrations<br/>
                  • No blockchain fees required
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
              <Shield className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-green-900">Production Mode Active</p>
                <p className="text-green-700">
                  • Real NFT minting on Sepolia<br/>
                  • Verifiable on Etherscan<br/>
                  • Permanent blockchain records<br/>
                  • Requires gas fees (~$0.01)
                </p>
              </div>
            </div>
          )}
        </div>

        {!demoMode && (
          <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
            <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-amber-900">Production Requirements</p>
              <p className="text-amber-700 text-xs">
                Requires valid Sepolia RPC URL, wallet private key, and NFT contract address in environment variables.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}