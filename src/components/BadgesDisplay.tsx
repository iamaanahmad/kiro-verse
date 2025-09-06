
"use client";

import type { Badge } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Award, Loader2, ExternalLink, Sparkles } from "lucide-react";
import KiroSpecDisplay from "./KiroSpecDisplay";
import { Badge as BadgeCount } from "@/components/ui/badge";


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
  1. **Backend:** Create 'awardSkillBadgeFlow' to analyze code.
  2. **Backend:** Create 'generateBadgeIconFlow' for image generation.
  3. **Backend:** Implement 'mintSkillBadgeAction' with 'ethers' to mint an NFT on Sepolia.
  4. **Backend:** Use environment variables for RPC URL, private key, and contract address.
  5. **Frontend:** Update 'BadgesDisplay' to link the transaction hash to Etherscan.
  6. **Frontend:** Ensure the UI clearly shows the verification link.
  `,
};

export default function BadgesDisplay({ badges, onAwardBadge, isLoading }: BadgesDisplayProps) {
  return (
    <Card className="h-full flex flex-col shadow-md">
      <CardHeader>
        <div className="flex justify-between items-start">
            <div className="flex-1">
                <CardTitle className="flex items-center gap-2 font-headline">
                    <Award className="h-6 w-6"/>
                    Your Skill Badges
                </CardTitle>
                <CardDescription>Showcase your verified Web3 achievements.</CardDescription>
            </div>
             <div className="text-right">
                <div className="text-sm font-medium text-muted-foreground">Total Badges</div>
                <BadgeCount variant="secondary" className="text-lg font-bold">{badges.length}</BadgeCount>
            </div>
        </div>
      </CardHeader>
      <CardContent className="flex-grow overflow-hidden">
        <ScrollArea className="h-full pr-4">
          {isLoading && badges.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-6 animate-fade-in">
                <div className="relative mb-4">
                  <div className="relative">
                    <Award className="h-12 w-12 text-primary/30 animate-pulse" />
                    <Loader2 className="absolute inset-0 h-12 w-12 animate-spin text-primary"/>
                  </div>
                  <div className="absolute -inset-2 bg-primary/10 rounded-full animate-ping"></div>
                </div>
                <div className="space-y-2">
                  <p className="text-base font-semibold text-foreground">Creating Your First Badge</p>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p>🤖 AI is analyzing your code...</p>
                    <p>🎨 Generating unique badge design...</p>
                    <p>⛓️ Minting on blockchain...</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 mt-4">
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
            </div>
          ) : badges.length > 0 ? (
            <div className="space-y-4">
              {badges.map((badge, index) => (
                <div 
                  key={badge.id} 
                  className="group flex items-start gap-4 p-4 rounded-lg border bg-gradient-to-r from-secondary/50 to-secondary/30 hover:from-secondary/70 hover:to-secondary/50 transition-all duration-300 hover:shadow-md hover:scale-[1.02] animate-fade-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                    <div className="relative">
                      <img 
                        src={badge.icon} 
                        alt={`${badge.name} icon`} 
                        className="w-14 h-14 rounded-lg border-2 border-primary/20 shadow-sm group-hover:border-primary/40 transition-all duration-300" 
                      />
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center shadow-sm">
                        <Award className="h-3 w-3 text-primary-foreground" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p className="font-semibold text-foreground group-hover:text-primary transition-colors duration-200 truncate">
                            {badge.name}
                          </p>
                          <BadgeCount variant="secondary" className="text-xs flex-shrink-0">
                            #{index + 1}
                          </BadgeCount>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed mb-2 line-clamp-2">
                          {badge.description}
                        </p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <a 
                              href={`https://sepolia.etherscan.io/tx/${badge.txHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-primary/80 hover:text-primary hover:underline inline-flex items-center gap-1 font-mono bg-primary/10 px-2 py-1 rounded transition-all duration-200 hover:bg-primary/20"
                          >
                              <span>TX: {badge.txHash.substring(0,8)}...{badge.txHash.substring(badge.txHash.length - 6)}</span>
                              <ExternalLink className="h-3 w-3" />
                          </a>
                          <BadgeCount 
                            variant={badge.txHash.match(/^0x[a-f0-9]{64}$/i) ? "outline" : "default"} 
                            className="text-xs"
                          >
                            {badge.txHash.match(/^0x[a-f0-9]{64}$/i) ? "Real NFT" : "Demo"}
                          </BadgeCount>
                        </div>
                    </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-6">
              <div className="relative mb-4">
                <Award className="h-16 w-16 text-muted-foreground/30" />
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center">
                  <Sparkles className="h-3 w-3 text-primary" />
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-lg font-semibold text-foreground">Ready to Earn Your First Badge?</p>
                <p className="text-sm text-muted-foreground max-w-xs">
                  Write some code above and let Kiro's AI analyze it to award you a verifiable skill badge on the blockchain!
                </p>
              </div>
              <div className="mt-4 p-3 bg-primary/5 rounded-lg border border-primary/20">
                <p className="text-xs text-primary font-medium">💡 Tip: Try the sample code or write your own!</p>
              </div>
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
