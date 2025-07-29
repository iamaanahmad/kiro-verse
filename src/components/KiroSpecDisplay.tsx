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
import { FileText, DraftingCompass, ListChecks } from "lucide-react";
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

// A simple component to render text with markdown-like bolding.
const MarkdownContent = ({ content }: { content: string }) => {
    const parts = content.trim().split(/(\*\*.*?\*\*)/g);
    return (
        <div className="text-sm whitespace-pre-wrap font-sans text-muted-foreground">
            {parts.map((part, index) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                    return <strong key={index} className="font-semibold text-foreground/90">{part.slice(2, -2)}</strong>;
                }
                return <React.Fragment key={index}>{part}</React.Fragment>;
            })}
        </div>
    );
};


export default function KiroSpecDisplay({ title, spec, trigger }: KiroSpecDisplayProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[650px]">
        <DialogHeader>
          <DialogTitle className="text-xl">Behind the Scenes: {title}</DialogTitle>
          <DialogDescription>
            Here's how Kiro understands and executes the task, following the spec-driven development process.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Tabs defaultValue="requirements">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="requirements"><FileText className="mr-2"/>Requirements</TabsTrigger>
              <TabsTrigger value="design"><DraftingCompass className="mr-2"/>Design</TabsTrigger>
              <TabsTrigger value="tasks"><ListChecks className="mr-2"/>Tasks</TabsTrigger>
            </TabsList>
            <ScrollArea className="h-72 mt-4 pr-4">
                <TabsContent value="requirements">
                    <MarkdownContent content={spec.requirements} />
                </TabsContent>
                <TabsContent value="design">
                    <MarkdownContent content={spec.design} />
                </TabsContent>
                <TabsContent value="tasks">
                    <MarkdownContent content={spec.tasks} />
                </TabsContent>
            </ScrollArea>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
