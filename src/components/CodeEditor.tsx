"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CodeXml, Loader2, Sparkles, CheckCircle2, AlertTriangle, Info, Lightbulb, Code2 } from "lucide-react";
import KiroSpecDisplay from "./KiroSpecDisplay";
import React from "react";

interface CodeEditorProps {
  code: string;
  onCodeChange: (code: string) => void;
  onGetFeedback: () => void;
  aiFeedback: string;
  isLoading: boolean;
}

// Enhanced AI Feedback Renderer with better formatting
const AIFeedbackRenderer = ({ content }: { content: string }) => {
  const sections = content.split(/\n\s*\n/).filter(section => section.trim());
  
  const renderSection = (section: string, index: number) => {
    const lines = section.trim().split('\n');
    const firstLine = lines[0].trim();
    
    // Detect section types based on content
    const isPositive = /good|great|excellent|well|nice|correct|proper/i.test(firstLine);
    const isIssue = /error|problem|issue|wrong|incorrect|bug|fix/i.test(firstLine);
    const isSuggestion = /suggest|recommend|consider|try|improve|better|could/i.test(firstLine);
    const isCodeBlock = firstLine.includes('```') || /function|const|let|var|class|import/i.test(firstLine);
    
    let icon, bgColor, borderColor, textColor;
    
    if (isPositive) {
      icon = <CheckCircle2 className="h-4 w-4 text-green-600" />;
      bgColor = "bg-green-50";
      borderColor = "border-green-200";
      textColor = "text-green-900";
    } else if (isIssue) {
      icon = <AlertTriangle className="h-4 w-4 text-amber-600" />;
      bgColor = "bg-amber-50";
      borderColor = "border-amber-200";
      textColor = "text-amber-900";
    } else if (isSuggestion) {
      icon = <Lightbulb className="h-4 w-4 text-blue-600" />;
      bgColor = "bg-blue-50";
      borderColor = "border-blue-200";
      textColor = "text-blue-900";
    } else if (isCodeBlock) {
      icon = <Code2 className="h-4 w-4 text-purple-600" />;
      bgColor = "bg-purple-50";
      borderColor = "border-purple-200";
      textColor = "text-purple-900";
    } else {
      icon = <Info className="h-4 w-4 text-gray-600" />;
      bgColor = "bg-gray-50";
      borderColor = "border-gray-200";
      textColor = "text-gray-900";
    }
    
    return (
      <div key={index} className={`rounded-lg border p-4 mb-4 ${bgColor} ${borderColor}`}>
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            {icon}
          </div>
          <div className="flex-1 space-y-2">
            {lines.map((line, lineIndex) => {
              const trimmedLine = line.trim();
              
              // Handle code blocks
              if (trimmedLine.startsWith('```') || trimmedLine.includes('function') || trimmedLine.includes('const ')) {
                return (
                  <div key={lineIndex} className="bg-gray-900 text-gray-100 p-3 rounded-md font-mono text-sm overflow-x-auto">
                    <code>{trimmedLine.replace(/```\w*/, '').replace(/```/, '')}</code>
                  </div>
                );
              }
              
              // Handle bullet points
              if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('• ')) {
                return (
                  <div key={lineIndex} className="flex items-start gap-2 ml-4">
                    <div className="w-1.5 h-1.5 rounded-full bg-current mt-2 flex-shrink-0"></div>
                    <span className={`text-sm leading-relaxed ${textColor}`}>
                      {renderInlineFormatting(trimmedLine.substring(2))}
                    </span>
                  </div>
                );
              }
              
              // Regular text
              if (trimmedLine) {
                return (
                  <p key={lineIndex} className={`text-sm leading-relaxed ${textColor} ${lineIndex === 0 ? 'font-medium' : ''}`}>
                    {renderInlineFormatting(trimmedLine)}
                  </p>
                );
              }
              
              return null;
            })}
          </div>
        </div>
      </div>
    );
  };
  
  const renderInlineFormatting = (text: string) => {
    // Handle inline code, bold text, and other formatting
    const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code key={index} className="bg-gray-200 text-gray-800 px-1.5 py-0.5 rounded text-xs font-mono">
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
  
  return (
    <div className="space-y-1">
      {sections.length > 0 ? (
        sections.map(renderSection)
      ) : (
        <div className="flex items-center gap-3 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <Info className="h-4 w-4 text-gray-600" />
          <p className="text-sm text-gray-700">No feedback available.</p>
        </div>
      )}
    </div>
  );
};

const codeFeedbackSpec = {
  requirements: `
- The user needs to receive constructive feedback on a piece of code they provide.
- The feedback should be generated by an AI mentor (Kiro).
- The feedback should analyze code quality, identify potential errors, and suggest improvements.
- The entire process should be triggered by a single button click.
  `,
  design: `
- A Genkit flow named 'getCodeFeedbackFlow' will be created.
- This flow will take the user's code as a string input.
- It will use the Gemini 2.0 Flash model with a prompt that instructs it to act as an AI code mentor named Kiro.
- The flow will output a single string containing the formatted feedback.
- A server action 'getCodeFeedbackAction' will wrap this flow to be securely called from the client.
- The frontend 'CodeEditor' component will have a state to hold the AI-generated feedback and a loading state.
- When the "Get AI Code Feedback" button is clicked, it will call the server action, display a loading indicator, and then show the returned feedback in a designated area.
  `,
  tasks: `
  1. **Backend:** Create 'src/ai/flows/get-code-feedback.ts' with the 'getCodeFeedbackFlow'.
  2. **Backend:** Define input (z.object({ code: z.string() })) and output (z.object({ feedback: z.string() })) schemas.
  3. **Backend:** Write the prompt for Kiro's persona and instructions.
  4. **Backend:** Create 'getCodeFeedbackAction' in 'src/app/actions.ts' to invoke the flow.
  5. **Frontend:** Add 'aiFeedback' and 'isLoading' state to the 'KiroApp' component.
  6. **Frontend:** Pass state and the handler function to the 'CodeEditor' component.
  7. **Frontend:** In 'CodeEditor', add a ScrollArea to display the feedback text.
  8. **Frontend:** Implement the 'onGetFeedback' handler to call the server action and update state.
  9. **Frontend:** Display a loader while the feedback is being generated.
  `,
};

export default function CodeEditor({ code, onCodeChange, onGetFeedback, aiFeedback, isLoading }: CodeEditorProps) {
  return (
    <Card className="h-full flex flex-col shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-headline">
          <CodeXml className="h-6 w-6" />
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
        {aiFeedback && (
           <div className="mt-4">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-foreground">Kiro's AI Feedback</h3>
            </div>
            <ScrollArea className="h-48 rounded-lg border bg-gradient-to-br from-secondary/30 to-secondary/50 p-4">
              <div className="prose prose-sm max-w-none">
                <AIFeedbackRenderer content={aiFeedback} />
              </div>
            </ScrollArea>
           </div>
        )}
         {isLoading && !aiFeedback && (
          <div className="mt-4 animate-fade-in">
            <div className="flex items-center gap-2 mb-3">
              <div className="relative">
                <Sparkles className="h-5 w-5 text-primary animate-pulse" />
                <div className="absolute inset-0 h-5 w-5 bg-primary/20 rounded-full animate-ping"></div>
              </div>
              <h3 className="font-semibold text-foreground">Kiro is Analyzing Your Code...</h3>
            </div>
            <div className="h-48 rounded-lg border bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 p-6 flex flex-col items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent animate-pulse"></div>
              <div className="relative mb-4">
                <div className="relative">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                  <div className="absolute inset-0 h-10 w-10 rounded-full border-2 border-primary/20 animate-pulse"></div>
                  <div className="absolute inset-2 h-6 w-6 rounded-full bg-primary/10 animate-pulse"></div>
                </div>
              </div>
              <div className="text-center space-y-3 relative z-10">
                <p className="text-base font-semibold text-foreground">AI Code Analysis in Progress</p>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground max-w-sm">
                    🔍 Examining code structure and patterns
                  </p>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    🧠 Identifying improvement opportunities
                  </p>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    ✨ Generating personalized feedback
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-6">
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
       <CardFooter className="flex-col items-stretch gap-4">
        <KiroSpecDisplay
          title="Code Feedback"
          spec={codeFeedbackSpec}
          trigger={
            <Button onClick={onGetFeedback} disabled={isLoading} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              Get AI Code Feedback
            </Button>
          }
        />
      </CardFooter>
    </Card>
  );
}
