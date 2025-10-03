'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Code, 
  Play, 
  Save, 
  Undo, 
  Redo, 
  Users,
  Eye,
  Edit3,
  MessageSquare
} from 'lucide-react';
import { 
  SharedCodeState, 
  CodeHistoryEntry, 
  Position, 
  CursorPosition,
  CodeSelection,
  Operation
} from '@/types/collaborative-session';
import { CollaborativeSessionService } from '@/lib/firebase/collaborative-session';

interface CollaborativeCodeEditorProps {
  sessionId: string;
  userId: string;
  username: string;
  sharedCode: SharedCodeState;
  canEdit: boolean;
  participants: Array<{
    userId: string;
    username: string;
    cursor?: CursorPosition;
    selection?: CodeSelection;
    isTyping: boolean;
  }>;
  onCodeChange: (content: string, operation: CodeHistoryEntry) => void;
  onCursorMove: (position: Position) => void;
  onSelectionChange: (selection: CodeSelection) => void;
}

export function CollaborativeCodeEditor({
  sessionId,
  userId,
  username,
  sharedCode,
  canEdit,
  participants,
  onCodeChange,
  onCursorMove,
  onSelectionChange
}: CollaborativeCodeEditorProps) {
  const [localContent, setLocalContent] = useState(sharedCode.content);
  const [cursorPosition, setCursorPosition] = useState<Position>({ line: 0, column: 0, offset: 0 });
  const [selection, setSelection] = useState<CodeSelection | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [syntaxErrors, setSyntaxErrors] = useState(sharedCode.syntaxErrors || []);
  
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  // Sync with shared code state
  useEffect(() => {
    if (sharedCode.content !== localContent && sharedCode.lastModifiedBy !== userId) {
      setLocalContent(sharedCode.content);
    }
  }, [sharedCode.content, sharedCode.lastModifiedBy, userId, localContent]);

  // Handle content changes
  const handleContentChange = useCallback((newContent: string) => {
    if (!canEdit) return;

    const operation: CodeHistoryEntry = {
      entryId: `${Date.now()}-${userId}`,
      timestamp: new Date(),
      userId,
      username,
      operation: 'replace',
      startPosition: { line: 0, column: 0, offset: 0 },
      endPosition: { line: 0, column: newContent.length, offset: newContent.length },
      oldContent: localContent,
      newContent,
      description: 'Code modification'
    };

    setLocalContent(newContent);
    onCodeChange(newContent, operation);

    // Set typing indicator
    setIsTyping(true);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 1000);
  }, [canEdit, userId, username, localContent, onCodeChange]);

  // Handle cursor position changes
  const handleCursorChange = useCallback(() => {
    if (!editorRef.current) return;

    const textarea = editorRef.current;
    const selectionStart = textarea.selectionStart;
    const selectionEnd = textarea.selectionEnd;
    
    // Calculate line and column from offset
    const lines = localContent.substring(0, selectionStart).split('\n');
    const line = lines.length - 1;
    const column = lines[lines.length - 1].length;
    
    const newPosition: Position = {
      line,
      column,
      offset: selectionStart
    };

    setCursorPosition(newPosition);
    onCursorMove(newPosition);

    // Handle selection
    if (selectionStart !== selectionEnd) {
      const endLines = localContent.substring(0, selectionEnd).split('\n');
      const endLine = endLines.length - 1;
      const endColumn = endLines[endLines.length - 1].length;

      const newSelection: CodeSelection = {
        start: newPosition,
        end: { line: endLine, column: endColumn, offset: selectionEnd },
        userId,
        color: getUserColor(userId)
      };

      setSelection(newSelection);
      onSelectionChange(newSelection);
    } else {
      setSelection(null);
    }
  }, [localContent, userId, onCursorMove, onSelectionChange]);

  // Get user color for cursor/selection
  const getUserColor = (userId: string): string => {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'];
    const hash = userId.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    return colors[Math.abs(hash) % colors.length];
  };

  // Render other participants' cursors
  const renderParticipantCursors = () => {
    return participants
      .filter(p => p.userId !== userId && p.cursor && p.cursor.visible)
      .map(participant => (
        <div
          key={participant.userId}
          className="absolute pointer-events-none z-10"
          style={{
            top: `${participant.cursor!.line * 1.5}rem`,
            left: `${participant.cursor!.column * 0.6}rem`,
            borderLeft: `2px solid ${participant.cursor!.color}`,
            height: '1.2rem'
          }}
        >
          <div
            className="absolute -top-6 left-0 px-1 py-0.5 text-xs text-white rounded"
            style={{ backgroundColor: participant.cursor!.color }}
          >
            {participant.username}
            {participant.isTyping && (
              <span className="ml-1 animate-pulse">✏️</span>
            )}
          </div>
        </div>
      ));
  };

  // Format code
  const formatCode = useCallback(() => {
    if (!canEdit) return;

    // Simple formatting for demonstration
    const formatted = localContent
      .split('\n')
      .map(line => line.trim())
      .join('\n')
      .replace(/\s*{\s*/g, ' {\n  ')
      .replace(/\s*}\s*/g, '\n}\n')
      .replace(/;\s*/g, ';\n');

    handleContentChange(formatted);
  }, [localContent, canEdit, handleContentChange]);

  // Run code (placeholder)
  const runCode = useCallback(() => {
    // This would integrate with a code execution service
    console.log('Running code:', localContent);
  }, [localContent]);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            Collaborative Editor
            {sharedCode.fileName && (
              <Badge variant="outline">{sharedCode.fileName}</Badge>
            )}
          </CardTitle>
          
          <div className="flex items-center gap-2">
            {/* Active participants indicator */}
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span className="text-sm text-muted-foreground">
                {participants.filter(p => p.isTyping).length} typing
              </span>
            </div>

            {/* Editor controls */}
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="outline"
                onClick={formatCode}
                disabled={!canEdit}
                title="Format code"
              >
                <Edit3 className="h-4 w-4" />
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                onClick={runCode}
                title="Run code"
              >
                <Play className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Language and version info */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <Badge variant="secondary">{sharedCode.language}</Badge>
          <span>Version {sharedCode.version}</span>
          <span>
            Last modified by {sharedCode.lastModifiedBy === userId ? 'you' : sharedCode.lastModifiedBy}
          </span>
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-0">
        <div className="relative h-full">
          {/* Code editor */}
          <textarea
            ref={editorRef}
            value={localContent}
            onChange={(e) => handleContentChange(e.target.value)}
            onSelect={handleCursorChange}
            onKeyUp={handleCursorChange}
            onClick={handleCursorChange}
            disabled={!canEdit}
            className="w-full h-full p-4 font-mono text-sm bg-background border-0 resize-none focus:outline-none"
            style={{
              lineHeight: '1.5rem',
              tabSize: 2
            }}
            placeholder={canEdit ? "Start coding together..." : "You have read-only access"}
          />

          {/* Participant cursors overlay */}
          <div className="absolute inset-0 pointer-events-none">
            {renderParticipantCursors()}
          </div>

          {/* Syntax errors overlay */}
          {syntaxErrors.length > 0 && (
            <div className="absolute bottom-4 right-4 bg-destructive/10 border border-destructive/20 rounded p-2 max-w-xs">
              <div className="text-sm font-medium text-destructive mb-1">
                Syntax Errors ({syntaxErrors.length})
              </div>
              {syntaxErrors.slice(0, 3).map((error, index) => (
                <div key={index} className="text-xs text-destructive/80">
                  Line {error.line}: {error.message}
                </div>
              ))}
            </div>
          )}

          {/* Read-only overlay */}
          {!canEdit && (
            <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
              <div className="bg-background border rounded-lg p-4 text-center">
                <Eye className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <div className="font-medium">Read-only Access</div>
                <div className="text-sm text-muted-foreground">
                  You can view but not edit this session
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}