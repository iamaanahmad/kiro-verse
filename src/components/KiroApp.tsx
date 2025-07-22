"use client";

import { useState, useEffect } from 'react';
import type { User } from 'firebase/auth';
import type { ChatMessage, Badge } from '@/types';
import CodeEditor from './CodeEditor';
import ChatInterface from './ChatInterface';
import BadgesDisplay from './BadgesDisplay';
import {
  getCodeFeedbackAction,
  sendChatMessageAction,
  getUserBadges,
  awardSkillBadgeAction,
} from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Button } from './ui/button';
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
  const [isLoading, setIsLoading] = useState({ feedback: false, chat: false, badges: false });

  const { toast } = useToast();

  useEffect(() => {
    const fetchBadges = async () => {
      setIsLoading(prev => ({ ...prev, badges: true }));
      const badges = await getUserBadges(user.uid);
      setUserBadges(badges);
      setIsLoading(prev => ({ ...prev, badges: false }));
    };
    fetchBadges();
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
    const result = await awardSkillBadgeAction(user.uid, codeContent);
    if (result.success && result.badge) {
      setUserBadges(prev => [...prev, result.badge!]);
      toast({
        title: 'Badge Awarded!',
        description: `Your "${result.badge.name}" badge has been minted.`,
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
  
  const handleSignOut = async () => {
    await signOut(auth);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
       <header className="sticky top-0 z-10 flex items-center justify-between p-4 border-b bg-background/80 backdrop-blur-sm">
         <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-bot text-primary"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>
            <h1 className="text-xl font-headline font-semibold text-foreground">KiroVerse</h1>
         </div>
        <Button variant="outline" size="sm" onClick={handleSignOut}>Sign Out</Button>
      </header>
      <main className="flex-grow p-4 md:p-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-full">
          <div className="md:col-span-12 lg:col-span-5 xl:col-span-4">
            <CodeEditor
              code={codeContent}
              onCodeChange={setCodeContent}
              onGetFeedback={handleGetCodeFeedback}
              aiFeedback={aiFeedback}
              isLoading={isLoading.feedback}
            />
          </div>
          <div className="md:col-span-6 lg:col-span-7 xl:col-span-5">
            <ChatInterface
              messages={chatMessages}
              onSendMessage={handleSendChatMessage}
              isLoading={isLoading.chat}
            />
          </div>
          <div className="md:col-span-6 lg:col-span-12 xl:col-span-3">
             <BadgesDisplay
              badges={userBadges}
              onAwardBadge={handleAwardBadge}
              isLoading={isLoading.badges}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
