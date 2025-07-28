
"use client";

import type { Badge } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Award, Loader2 } from "lucide-react";
import KiroSpecDisplay from "./KiroSpecDisplay";
import { ExternalLink } from "lucide-react";

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
- The badge must be minted as a real NFT on a public testnet (Sepolia) and saved to the user's profile.
- The user should be able to verify the transaction on a blockchain explorer.
  `,
  design: `
- An 'awardSkillBadgeAction' server action orchestrates the entire process.
- It first calls 'awardSkillBadgeFlow' to get the badge name and description.
- It then calls a separate 'generateBadgeIconFlow' to create a unique icon.
- Finally, it calls the 'mintSkillBadgeAction', which uses the 'ethers' library to connect to the Sepolia testnet.
- This action crafts a JSON metadata file for the NFT, mints it to a server-controlled wallet, and returns the real transaction hash.
- The UI will display the minted badges and provide a direct link to the transaction on Etherscan for verification.
  `,
  tasks: `
1.  **Backend:** Create 'awardSkillBadgeFlow' to analyze code.
2.  **Backend:** Create 'generateBadgeIconFlow' for image generation.
3.  **Backend:** Implement 'mintSkillBadgeAction' with 'ethers' to mint an NFT on Sepolia.
4.  **Backend:** Use environment variables for RPC URL, private key, and contract address.
5.  **Frontend:** Update 'BadgesDisplay' to link the transaction hash to Etherscan.
6.  **Frontend:** Ensure the UI clearly shows the verification link.
  `,
};

export default function BadgesDisplay({ badges, onAwardBadge, isLoading }: BadgesDisplayProps) {
  return (
    <Card className="h-full flex flex-col shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-headline">
            <Award className="h-6 w-6"/>
            Your Skill Badges
        </CardTitle>
        <CardDescription>Showcase your verified Web3 achievements.</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow overflow-hidden">
        <ScrollArea className="h-full pr-4">
          {isLoading && badges.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mb-2"/>
                <p className="text-sm text-muted-foreground">Analyzing code and minting your first badge on the blockchain...</p>
            </div>
          ) : badges.length > 0 ? (
            <div className="space-y-4">
              {badges.map((badge) => (
                <div key={badge.id} className="flex items-start gap-4 p-3 rounded-lg border bg-secondary/50">
                    <img src={badge.icon} alt={`${badge.name} icon`} className="w-12 h-12 rounded-md border" />
                    <div className="flex-1">
                        <p className="font-semibold text-foreground">{badge.name}</p>
                        <p className="text-xs text-muted-foreground">{badge.description}</p>
                        <a 
                            href={`https://sepolia.etherscan.io/tx/${badge.txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-accent-foreground/80 hover:text-accent-foreground hover:underline inline-flex items-center gap-1 mt-1 font-mono break-all"
                        >
                            <span>TX: {badge.txHash.substring(0,10)}...{badge.txHash.substring(badge.txHash.length - 8)}</span>
                            <ExternalLink className="h-3 w-3" />
                        </a>
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
