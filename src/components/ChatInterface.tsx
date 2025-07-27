"use client";

import { useState, useRef, useEffect } from "react";
import type { ChatMessage } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { cn } from "@/lib/utils";

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  isLoading: boolean;
}

export default function ChatInterface({ messages, onSendMessage, isLoading }: ChatInterfaceProps) {
  const [input, setInput] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendMessage(input);
    setInput("");
  };

  return (
    <Card className="h-full flex flex-col shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-headline">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-message-circle-question"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2z"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>
          Chat with Kiro
        </CardTitle>
        <CardDescription>Ask your AI mentor questions about your code.</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col gap-4 overflow-hidden">
        <ScrollArea className="flex-grow pr-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div key={index} className={cn("flex items-start gap-3", message.role === 'user' ? 'justify-end' : 'justify-start')}>
                {message.role === 'assistant' && (
                  <Avatar className="w-8 h-8">
                     <AvatarFallback className="bg-primary/20 text-primary text-sm">AI</AvatarFallback>
                  </Avatar>
                )}
                <div className={cn("rounded-lg px-4 py-2 max-w-[80%]", message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground')}>
                  <p className="text-sm">{message.content}</p>
                </div>
                 {message.role === 'user' && (
                  <Avatar className="w-8 h-8">
                     <AvatarFallback className="text-sm">You</AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                 <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-primary/20 text-primary text-sm">AI</AvatarFallback>
                  </Avatar>
                <div className="rounded-lg px-4 py-2 bg-secondary text-secondary-foreground flex items-center ml-3">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground"/>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            disabled={isLoading}
            aria-label="Chat Input"
          />
          <Button type="submit" disabled={isLoading || !input.trim()} size="icon" className="flex-shrink-0 bg-accent hover:bg-accent/90" aria-label="Send Message">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
