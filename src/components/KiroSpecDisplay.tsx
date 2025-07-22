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

interface KiroSpecDisplayProps {
  title: string;
  spec: {
    requirements: string;
    design: string;
    tasks: string;
  };
  trigger: React.ReactNode;
}

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
                    <pre className="text-sm whitespace-pre-wrap font-sans text-muted-foreground">{spec.requirements.trim()}</pre>
                </TabsContent>
                <TabsContent value="design">
                    <pre className="text-sm whitespace-pre-wrap font-sans text-muted-foreground">{spec.design.trim()}</pre>
                </TabsContent>
                <TabsContent value="tasks">
                    <pre className="text-sm whitespace-pre-wrap font-sans text-muted-foreground">{spec.tasks.trim()}</pre>
                </TabsContent>
            </ScrollArea>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
