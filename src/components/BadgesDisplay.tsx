
"use client";

import type { Badge } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Award, Loader2 } from "lucide-react";
import KiroSpecDisplay from "./KiroSpecDisplay";

interface BadgesDisplayProps {
  badges: Badge[];
  onAwardBadge: () => void;
  isLoading: boolean;
}

const awardBadgeSpec = {
  requirements: `
- The user's code must be analyzed by an AI to identify a specific, verifiable skill.
- Based on the analysis, a unique skill badge must be generated, including a name, description, and a custom icon.
- The generated icon must be a unique image created by a multimodal AI model.
- The badge must be "minted" and saved to the user's profile, including a simulated transaction hash for authenticity.
- The user should be able to see the process (spec) that the AI follows to complete this task.
  `,
  design: `
- An overarching 'awardSkillBadgeAction' server action will orchestrate the entire process.
- This action first calls the 'awardSkillBadgeFlow' to get the badge name and description from the user's code.
- It then calls a separate 'generateBadgeIconFlow', which uses a multimodal image generation model to create a unique icon based on the badge name. This serves as an agent hook.
- The final badge data, including the AI-generated details and a simulated transaction hash, is saved to the user's Firestore document.
- The frontend 'BadgesDisplay' component will trigger this action and display the spec in a dialog, showing the user the 'Requirements -> Design -> Tasks' flow.
- The UI will display the minted badges in a detailed list, including the icon, name, description, and transaction hash.
  `,
  tasks: `
1.  **Backend:** Create 'awardSkillBadgeFlow' to analyze code and determine badge details.
2.  **Backend:** Create 'generateBadgeIconFlow' to generate a unique image icon (multimodal AI).
3.  **Backend:** Create 'awardSkillBadgeAction' to orchestrate the two flows and save the final badge to Firestore.
4.  **Frontend:** Create 'KiroSpecDisplay' component to visualize the spec.
5.  **Frontend:** Integrate 'KiroSpecDisplay' into 'BadgesDisplay' component.
6.  **Frontend:** Update the UI to show a detailed list of badges with their transaction hashes.
7.  **Frontend:** Trigger the end-to-end process from a single button click.
  `,
};

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
            <div className="flex flex-col items-center justify-center h-full text-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mb-2"/>
                <p className="text-sm text-muted-foreground">Analyzing code and minting your first badge...</p>
            </div>
          ) : badges.length > 0 ? (
            <div className="space-y-4">
              {badges.map((badge) => (
                <div key={badge.id} className="flex items-start gap-4 p-3 rounded-lg border bg-secondary/50">
                    <img src={badge.icon} alt={`${badge.name} icon`} className="w-12 h-12 rounded-md border" />
                    <div className="flex-1">
                        <p className="font-semibold text-foreground">{badge.name}</p>
                        <p className="text-xs text-muted-foreground">{badge.description}</p>
                        <p className="text-xs text-muted-foreground mt-1 font-mono break-all">
                            TX: {badge.txHash}
                        </p>
                    </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-center">
              <p className="text-muted-foreground text-sm">No badges earned yet. <br />Click below to mint your first one!</p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
      <CardFooter>
         <KiroSpecDisplay
            title="AI-Powered Badge Award"
            spec={awardBadgeSpec}
            trigger={
                <Button onClick={onAwardBadge} disabled={isLoading} className="w-full">
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Award className="mr-2 h-4 w-4" />}
                    Award AI-Powered Badge
                </Button>
            }
        />
      </CardFooter>
    </Card>
  );
}
