"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Sparkles } from "lucide-react";

interface CodeEditorProps {
  code: string;
  onCodeChange: (code: string) => void;
  onGetFeedback: () => void;
  aiFeedback: string;
  isLoading: boolean;
}

export default function CodeEditor({ code, onCodeChange, onGetFeedback, aiFeedback, isLoading }: CodeEditorProps) {
  return (
    <Card className="h-full flex flex-col shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-headline">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-code-xml"><path d="m18 16 4-4-4-4"/><path d="m6 8-4 4 4 4"/><path d="m14.5 4-5 16"/></svg>
          Code Editor
        </CardTitle>
        <CardDescription>Write or paste your code here to get AI-powered feedback.</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col gap-4">
        <div className="relative flex-grow">
          <Textarea
            value={code}
            onChange={(e) => onCodeChange(e.target.value)}
            placeholder="Enter your code here..."
            className="h-full w-full font-code text-sm resize-none rounded-md"
            aria-label="Code Input"
          />
        </div>
        <Button onClick={onGetFeedback} disabled={isLoading} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
          Get AI Code Feedback
        </Button>
        {aiFeedback && (
           <div className="mt-4">
            <h3 className="font-semibold mb-2 text-foreground">AI Feedback:</h3>
            <ScrollArea className="h-48 rounded-md border bg-secondary/50 p-4">
              <pre className="text-sm whitespace-pre-wrap font-code text-secondary-foreground">{aiFeedback}</pre>
            </ScrollArea>
           </div>
        )}
         {isLoading && !aiFeedback && (
          <div className="mt-4 flex items-center justify-center h-48 rounded-md border bg-secondary/50 p-4">
            <p className="text-muted-foreground">Kiro is analyzing your code...</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
