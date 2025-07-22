"use client";

import type { Badge } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Award, Loader2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";

interface BadgesDisplayProps {
  badges: Badge[];
  onAwardBadge: () => void;
  isLoading: boolean;
}

export default function BadgesDisplay({ badges, onAwardBadge, isLoading }: BadgesDisplayProps) {
  return (
    <Card className="h-full flex flex-col shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-headline">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-award"><path d="M12 20h.01"/><path d="M11.5 3.5a8.5 8.5 0 0 0-5.4 14.5"/><path d="M12.5 3.5a8.5 8.5 0 0 1 5.4 14.5"/><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>
            Your Skill Badges
        </CardTitle>
        <CardDescription>Showcase your verified Web3 achievements.</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow overflow-hidden">
        <ScrollArea className="h-full pr-4">
          {isLoading && badges.length === 0 ? (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground"/>
            </div>
          ) : badges.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-4">
              {badges.map((badge) => (
                <TooltipProvider key={badge.id}>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="flex flex-col items-center space-y-2 p-2 rounded-lg border bg-secondary/50 hover:bg-secondary transition-colors">
                                <div className="p-1 bg-primary/20 rounded-full">
                                    <img src={badge.icon} alt={`${badge.name} icon`} className="w-10 h-10 rounded-full" />
                                </div>
                                <p className="text-xs font-medium text-center truncate w-full">{badge.name}</p>
                            </div>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                            <p className="font-semibold">{badge.name}</p>
                            <p className="text-xs text-muted-foreground">{badge.description}</p>
                            <p className="text-xs text-muted-foreground mt-1 font-mono">Minted: {new Date(badge.date).toLocaleDateString()}</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground text-sm">No badges earned yet.</p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
      <CardFooter>
         <Button onClick={onAwardBadge} disabled={isLoading} className="w-full">
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Award className="mr-2 h-4 w-4" />}
            Award AI-Powered Badge
          </Button>
      </CardFooter>
    </Card>
  );
}
