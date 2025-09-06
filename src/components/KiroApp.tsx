"use client";

import { useState, useEffect } from 'react';
import type { User } from 'firebase/auth';
import type { ChatMessage, Badge } from '@/types';
import CodeEditor from './CodeEditor';
import ChatInterface from './ChatInterface';
import BadgesDisplay from './BadgesDisplay';
import DemoModeToggle from './DemoModeToggle';
import {
  getCodeFeedbackAction,
  sendChatMessageAction,
  getUserBadges,
  awardSkillBadgeAction,
  getDemoMode,
} from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { Bot, Loader2, Settings } from 'lucide-react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';

interface KiroAppProps {
  user: User;
}

const initialCode = `function promisify(fn) {
  return function(...args) {
    return new Promise((resolve, reject) => {
      fn(...args, (err, result) => {
        if (err) {
          return reject(err);
        }
        resolve(result);
      });
    });
  };
}

// Example usage:
function callbackStyleFunction(value, callback) {
  setTimeout(() => {
    if (value > 0) {
      callback(null, 'Success');
    } else {
      callback('Error: Value must be positive');
    }
  }, 1000);
}

const promisedFunction = promisify(callbackStyleFunction);

promisedFunction(1)
  .then(console.log)
  .catch(console.error);
`;

const initialMessages: ChatMessage[] = [
  { role: 'assistant', content: "Hello! I'm Kiro, your AI code mentor. The editor has some sample code demonstrating JavaScript Promises." },
  { role: 'assistant', content: 'You can ask for feedback, or award an AI-powered skill badge based on the code.' }
];

export default function KiroApp({ user }: KiroAppProps) {
  const [codeContent, setCodeContent] = useState(initialCode);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(initialMessages);
  const [aiFeedback, setAiFeedback] = useState('');
  const [userBadges, setUserBadges] = useState<Badge[]>([]);
  const [demoMode, setDemoMode] = useState(true);
  const [isLoading, setIsLoading] = useState({ feedback: false, chat: false, badges: false });

  const { toast } = useToast();

  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(prev => ({ ...prev, badges: true }));
      const [badges, currentDemoMode] = await Promise.all([
        getUserBadges(user.uid),
        getDemoMode(user.uid)
      ]);
      setUserBadges(badges);
      setDemoMode(currentDemoMode);
      setIsLoading(prev => ({ ...prev, badges: false }));
    };
    fetchInitialData();
  }, [user.uid]);

  const handleGetCodeFeedback = async () => {
    setIsLoading(prev => ({ ...prev, feedback: true }));
    setAiFeedback('');
    const feedback = await getCodeFeedbackAction(codeContent);
    setAiFeedback(feedback);
    setIsLoading(prev => ({ ...prev, feedback: false }));
  };

  const handleSendChatMessage = async (query: string) => {
    setIsLoading(prev => ({ ...prev, chat: true }));
    const newMessages: ChatMessage[] = [...chatMessages, { role: 'user', content: query }];
    setChatMessages(newMessages);

    const aiResponse = await sendChatMessageAction(codeContent, query);
    setChatMessages([...newMessages, { role: 'assistant', content: aiResponse }]);
    setIsLoading(prev => ({ ...prev, chat: false }));
  };

  const handleAwardBadge = async () => {
    setIsLoading(prev => ({ ...prev, badges: true }));
    const result = await awardSkillBadgeAction(user.uid, codeContent, demoMode);
    if (result.success && result.badge) {
      setUserBadges(prev => [result.badge!, ...prev]); // Add new badge to the top
      toast({
        title: 'Badge Awarded!',
        description: demoMode 
          ? `Your "${result.badge.name}" badge has been created (Demo Mode)`
          : `Your "${result.badge.name}" badge has been minted on Sepolia blockchain!`,
      });
    } else {
      toast({
        variant: 'destructive',
        title: 'Awarding Failed',
        description: result.error || 'An unexpected error occurred.',
      });
    }
    setIsLoading(prev => ({ ...prev, badges: false }));
  };

  const handleDemoModeChange = (newDemoMode: boolean) => {
    setDemoMode(newDemoMode);
  };
  
  const handleSignOut = async () => {
    await signOut(auth);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
       <header className="sticky top-0 z-10 flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur-md shadow-sm">
         <div className="flex items-center gap-3 animate-slide-in-left">
            <div className="relative">
              <Bot className="h-7 w-7 text-primary animate-pulse" />
              <div className="absolute -inset-1 bg-primary/20 rounded-full animate-ping opacity-75"></div>
            </div>
            <div>
              <h1 className="text-xl font-headline font-bold gradient-text">KiroVerse</h1>
              <p className="text-xs text-muted-foreground">AI Code Mentor & Web3 Skills</p>
            </div>
         </div>
         <div className="flex items-center gap-3 animate-slide-in-right">
           <Dialog>
             <DialogTrigger asChild>
               <Button variant="outline" size="sm" className="hover-lift transition-all duration-200">
                 <Settings className="h-4 w-4 mr-2" />
                 <span className="hidden sm:inline">{demoMode ? "Demo Mode" : "Production"}</span>
                 <span className="sm:hidden">{demoMode ? "Demo" : "Prod"}</span>
               </Button>
             </DialogTrigger>
             <DialogContent className="sm:max-w-md">
               <DialogHeader>
                 <DialogTitle>Badge Minting Mode</DialogTitle>
                 <DialogDescription>
                   Choose between demo mode (instant mock badges) or production mode (real blockchain NFTs).
                 </DialogDescription>
               </DialogHeader>
               <DemoModeToggle 
                 userId={user.uid} 
                 onModeChange={handleDemoModeChange}
               />
             </DialogContent>
           </Dialog>
           <Button variant="outline" size="sm" onClick={handleSignOut} className="hover-lift transition-all duration-200">
             <span className="hidden sm:inline">Sign Out</span>
             <span className="sm:hidden">Exit</span>
           </Button>
         </div>
      </header>
      <main className="flex-grow p-4 md:p-6 animate-fade-in">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 h-full max-w-7xl mx-auto">
          <div className="xl:col-span-7 animate-slide-in-left">
            <CodeEditor
              code={codeContent}
              onCodeChange={setCodeContent}
              onGetFeedback={handleGetCodeFeedback}
              aiFeedback={aiFeedback}
              isLoading={isLoading.feedback}
            />
          </div>
          <div className="xl:col-span-5 animate-slide-in-right">
             <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-1 gap-6 h-full">
                <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
                  <ChatInterface
                  messages={chatMessages}
                  onSendMessage={handleSendChatMessage}
                  isLoading={isLoading.chat}
                  />
                </div>
                <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
                  <BadgesDisplay
                  badges={userBadges}
                  onAwardBadge={handleAwardBadge}
                  isLoading={isLoading.badges}
                  />
                </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
