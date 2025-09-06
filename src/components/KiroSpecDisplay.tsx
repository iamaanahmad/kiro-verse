"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { ScrollArea } from "./ui/scroll-area";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { FileText, DraftingCompass, ListChecks, Sparkles, Target, Cog, CheckCircle2, Circle, ArrowRight } from "lucide-react";
import React from "react";

interface KiroSpecDisplayProps {
  title: string;
  spec: {
    requirements: string;
    design: string;
    tasks: string;
  };
  trigger: React.ReactNode;
}

// Enhanced markdown renderer with better formatting
const MarkdownContent = ({ content, type }: { content: string; type: 'requirements' | 'design' | 'tasks' }) => {
  const lines = content.trim().split('\n').filter(line => line.trim());
  
  const renderLine = (line: string, index: number) => {
    const trimmedLine = line.trim();
    
    // Handle bullet points
    if (trimmedLine.startsWith('- ')) {
      const bulletContent = trimmedLine.substring(2);
      return (
        <div key={index} className="flex items-start gap-3 mb-3 pl-2">
          <div className="flex-shrink-0 mt-1">
            {type === 'requirements' ? (
              <Target className="h-4 w-4 text-blue-500" />
            ) : type === 'design' ? (
              <Cog className="h-4 w-4 text-purple-500" />
            ) : (
              <Circle className="h-4 w-4 text-green-500" />
            )}
          </div>
          <div className="text-sm text-foreground leading-relaxed">
            {renderInlineFormatting(bulletContent)}
          </div>
        </div>
      );
    }
    
    // Handle numbered lists
    const numberedMatch = trimmedLine.match(/^(\d+)\.\s*(.+)/);
    if (numberedMatch) {
      const [, number, content] = numberedMatch;
      return (
        <div key={index} className="flex items-start gap-3 mb-3 pl-2">
          <Badge variant="outline" className="flex-shrink-0 h-6 w-6 rounded-full p-0 flex items-center justify-center text-xs font-medium">
            {number}
          </Badge>
          <div className="text-sm text-foreground leading-relaxed">
            {renderInlineFormatting(content)}
          </div>
        </div>
      );
    }
    
    // Handle headers (lines that end with colon or are all caps)
    if (trimmedLine.endsWith(':') || (trimmedLine === trimmedLine.toUpperCase() && trimmedLine.length > 3)) {
      return (
        <div key={index} className="mb-4">
          <h4 className="text-base font-semibold text-foreground mb-2 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            {trimmedLine.replace(':', '')}
          </h4>
          <Separator className="mb-3" />
        </div>
      );
    }
    
    // Regular paragraphs
    if (trimmedLine.length > 0) {
      return (
        <p key={index} className="text-sm text-muted-foreground leading-relaxed mb-3">
          {renderInlineFormatting(trimmedLine)}
        </p>
      );
    }
    
    return null;
  };
  
  const renderInlineFormatting = (text: string) => {
    // Handle bold text
    const parts = text.split(/(\*\*.*?\*\*|`.*?`|'.*?')/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return <code key={index} className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono text-foreground">{part.slice(1, -1)}</code>;
      }
      if (part.startsWith("'") && part.endsWith("'")) {
        return <code key={index} className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono text-foreground">{part.slice(1, -1)}</code>;
      }
      return <React.Fragment key={index}>{part}</React.Fragment>;
    });
  };
  
  return (
    <div className="space-y-2">
      {lines.map(renderLine)}
    </div>
  );
};

const TabIcon = ({ type, isActive }: { type: 'requirements' | 'design' | 'tasks'; isActive: boolean }) => {
  const iconClass = `h-4 w-4 mr-2 ${isActive ? 'text-primary' : 'text-muted-foreground'}`;
  
  switch (type) {
    case 'requirements':
      return <FileText className={iconClass} />;
    case 'design':
      return <DraftingCompass className={iconClass} />;
    case 'tasks':
      return <ListChecks className={iconClass} />;
  }
};

export default function KiroSpecDisplay({ title, spec, trigger }: KiroSpecDisplayProps) {
  const [activeTab, setActiveTab] = React.useState('requirements');
  
  const tabData = [
    {
      value: 'requirements',
      label: 'Requirements',
      description: 'User stories and acceptance criteria',
      content: spec.requirements,
      color: 'blue'
    },
    {
      value: 'design',
      label: 'Design',
      description: 'Architecture and technical approach',
      content: spec.design,
      color: 'purple'
    },
    {
      value: 'tasks',
      label: 'Tasks',
      description: 'Implementation roadmap',
      content: spec.tasks,
      color: 'green'
    }
  ];

  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-6xl max-h-[95vh] animate-scale-in">
        <DialogHeader className="pb-6">
          <div className="flex items-center gap-4 animate-fade-in">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/20 animate-pulse-glow">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-2xl font-bold gradient-text mb-2">
                Behind the Scenes: {title}
              </DialogTitle>
              <DialogDescription className="text-lg text-muted-foreground">
                Discover how Kiro's spec-driven development process brings this feature to life
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-3 mb-6 h-auto p-2 bg-muted/50">
              {tabData.map((tab) => (
                <TabsTrigger 
                  key={tab.value} 
                  value={tab.value}
                  className="flex flex-col items-center gap-2 p-4 h-auto data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg transition-all duration-200"
                >
                  <div className="flex items-center gap-2">
                    <TabIcon type={tab.value as any} isActive={activeTab === tab.value} />
                    <div className="font-semibold text-base">{tab.label}</div>
                  </div>
                  <div className="text-xs opacity-80 text-center leading-tight">
                    {tab.description}
                  </div>
                </TabsTrigger>
              ))}
            </TabsList>
            
            <div className="flex-1 overflow-hidden">
              <ScrollArea className="h-[600px] pr-4 custom-scrollbar">
                {tabData.map((tab) => (
                  <TabsContent key={tab.value} value={tab.value} className="mt-0 animate-fade-in">
                    <div className="space-y-6">
                      <div className="flex flex-wrap items-center gap-3 mb-6 p-4 bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl border border-primary/20 animate-slide-in-right">
                        <Badge variant="secondary" className="text-sm px-3 py-1 bg-gradient-to-r from-primary/15 to-primary/10 border-primary/30 font-medium">
                          🚀 Kiro Spec-Driven Development
                        </Badge>
                        <ArrowRight className="h-5 w-5 text-muted-foreground animate-pulse" />
                        <Badge variant="outline" className="text-sm px-3 py-1 border-primary/40 text-primary font-medium">
                          📋 {tab.label} Phase
                        </Badge>
                      </div>
                      
                      <div className="bg-gradient-to-br from-background via-muted/10 to-background rounded-2xl p-8 border-2 border-border/30 shadow-lg hover-lift transition-all duration-300">
                        <MarkdownContent content={tab.content} type={tab.value as any} />
                      </div>
                    </div>
                  </TabsContent>
                ))}
              </ScrollArea>
            </div>
          </Tabs>
        </div>
        
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span>Spec-driven development ensures quality and transparency</span>
            </div>
            <Badge variant="outline" className="text-xs">
              Educational Transparency
            </Badge>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
