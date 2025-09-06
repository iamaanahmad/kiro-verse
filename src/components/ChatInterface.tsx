"use client";

import { useState, useRef, useEffect } from "react";
import type { ChatMessage } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Send, Loader2, MessageCircleQuestion, Bot, User, Sparkles, Code2 } from "lucide-react";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { cn } from "@/lib/utils";
import React from "react";

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  isLoading: boolean;
}

// Enhanced message content renderer
const MessageContent = ({ content, role }: { content: string; role: 'user' | 'assistant' }) => {
  if (role === 'user') {
    return <p className="text-sm leading-relaxed">{content}</p>;
  }
  
  // Enhanced AI message rendering
  const renderAIContent = (text: string) => {
    const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code key={index} className="bg-primary/10 text-primary px-1.5 py-0.5 rounded text-xs font-mono">
            {part.slice(1, -1)}
          </code>
        );
      }
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index} className="font-semibold">{part.slice(2, -2)}</strong>;
      }
      return <React.Fragment key={index}>{part}</React.Fragment>;
    });
  };
  
  // Split into paragraphs and handle special formatting
  const paragraphs = content.split('\n\n').filter(p => p.trim());
  
  return (
    <div className="space-y-2">
      {paragraphs.map((paragraph, index) => {
        const trimmed = paragraph.trim();
        
        // Handle bullet points
        if (trimmed.includes('\n- ') || trimmed.startsWith('- ')) {
          const items = trimmed.split('\n- ').map(item => item.replace(/^- /, ''));
          return (
            <ul key={index} className="space-y-1 ml-2">
              {items.map((item, itemIndex) => (
                <li key={itemIndex} className="flex items-start gap-2 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-current mt-2 flex-shrink-0"></div>
                  <span className="leading-relaxed">{renderAIContent(item)}</span>
                </li>
              ))}
            </ul>
          );
        }
        
        // Handle code blocks
        if (trimmed.includes('```') || /function|const|let|var|class/.test(trimmed)) {
          return (
            <div key={index} className="bg-gray-900 text-gray-100 p-3 rounded-md font-mono text-xs overflow-x-auto">
              <code>{trimmed.replace(/```\w*\n?/, '').replace(/\n?```/, '')}</code>
            </div>
          );
        }
        
        // Regular paragraphs
        return (
          <p key={index} className="text-sm leading-relaxed">
            {renderAIContent(trimmed)}
          </p>
        );
      })}
    </div>
  );
};

export default function ChatInterface({ messages, onSendMessage, isLoading }: ChatInterfaceProps) {
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  useEffect(() => {
    if (isLoading) {
      setIsTyping(true);
      const timer = setTimeout(() => setIsTyping(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

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
          <MessageCircleQuestion className="h-6 w-6" />
          Chat with Kiro
        </CardTitle>
        <CardDescription>Ask your AI mentor questions about your code.</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col gap-4 overflow-hidden">
        <ScrollArea className="flex-grow pr-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div key={index} className={cn("flex items-start gap-3 animate-fade-in", message.role === 'user' ? 'justify-end' : 'justify-start')}>
                {message.role === 'assistant' && (
                  <Avatar className="w-8 h-8 ring-2 ring-primary/20">
                     <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary text-sm">
                       <Bot className="h-4 w-4" />
                     </AvatarFallback>
                  </Avatar>
                )}
                <div className={cn(
                  "rounded-lg px-4 py-3 max-w-[85%] shadow-sm transition-all duration-200 hover:shadow-md", 
                  message.role === 'user' 
                    ? 'bg-gradient-to-r from-primary to-primary/90 text-primary-foreground' 
                    : 'bg-gradient-to-br from-secondary to-secondary/80 text-secondary-foreground border border-border/50'
                )}>
                  <MessageContent content={message.content} role={message.role} />
                </div>
                 {message.role === 'user' && (
                  <Avatar className="w-8 h-8 ring-2 ring-primary/30">
                     <AvatarFallback className="bg-gradient-to-br from-accent/20 to-accent/10 text-sm">
                       <User className="h-4 w-4" />
                     </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start animate-fade-in">
                 <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-primary/20 text-primary text-sm">
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                <div className="rounded-lg px-4 py-3 bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 flex items-center ml-3 min-w-[120px]">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-primary"/>
                    <div className="flex gap-1">
                      <div className="w-1 h-1 bg-primary rounded-full animate-bounce"></div>
                      <div className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                  {isTyping && (
                    <span className="text-xs text-primary/70 ml-2 animate-pulse">Kiro is thinking...</span>
                  )}
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
