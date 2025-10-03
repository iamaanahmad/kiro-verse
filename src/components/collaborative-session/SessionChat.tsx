'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  MessageSquare, 
  Send, 
  Bot, 
  User, 
  Code, 
  Lightbulb,
  ThumbsUp,
  ThumbsDown,
  Reply,
  MoreVertical
} from 'lucide-react';
import { 
  SessionComment, 
  AISuggestion, 
  RealTimeInsight 
} from '@/types/collaborative-session';
import { formatDistanceToNow } from 'date-fns';

interface SessionChatProps {
  sessionId: string;
  userId: string;
  username: string;
  comments: SessionComment[];
  aiSuggestions: AISuggestion[];
  realTimeInsights: RealTimeInsight[];
  onSendMessage: (content: string, codePosition?: any) => void;
  onReactToMessage: (commentId: string, emoji: string) => void;
  onReplyToMessage: (commentId: string, content: string) => void;
}

interface ChatMessage {
  id: string;
  type: 'comment' | 'ai_suggestion' | 'insight' | 'system';
  content: string;
  author: string;
  timestamp: Date;
  reactions?: Array<{ emoji: string; count: number; users: string[] }>;
  replies?: ChatMessage[];
  codeSnippet?: string;
  priority?: 'info' | 'warning' | 'error' | 'success';
}

export function SessionChat({
  sessionId,
  userId,
  username,
  comments,
  aiSuggestions,
  realTimeInsights,
  onSendMessage,
  onReactToMessage,
  onReplyToMessage
}: SessionChatProps) {
  const [message, setMessage] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Combine all message types into unified chat
  useEffect(() => {
    const allMessages: ChatMessage[] = [];

    // Add comments
    comments.forEach(comment => {
      allMessages.push({
        id: comment.commentId,
        type: 'comment',
        content: comment.content,
        author: comment.username,
        timestamp: comment.createdAt,
        reactions: comment.reactions.reduce((acc, reaction) => {
          const existing = acc.find(r => r.emoji === reaction.emoji);
          if (existing) {
            existing.count++;
            existing.users.push(reaction.userId);
          } else {
            acc.push({
              emoji: reaction.emoji,
              count: 1,
              users: [reaction.userId]
            });
          }
          return acc;
        }, [] as Array<{ emoji: string; count: number; users: string[] }>),
        codeSnippet: comment.codeSnippet
      });
    });

    // Add AI suggestions as messages
    aiSuggestions.forEach(suggestion => {
      allMessages.push({
        id: suggestion.suggestionId,
        type: 'ai_suggestion',
        content: `💡 **${suggestion.title}**\n\n${suggestion.description}\n\n\`\`\`${suggestion.suggestedCode}\`\`\``,
        author: 'AI Mentor',
        timestamp: suggestion.createdAt,
        priority: suggestion.priority === 'high' ? 'warning' : 'info'
      });
    });

    // Add real-time insights
    realTimeInsights.forEach(insight => {
      if (!insight.isRead[userId]) {
        allMessages.push({
          id: insight.insightId,
          type: 'insight',
          content: `${getInsightIcon(insight.type)} **${insight.title}**\n\n${insight.message}`,
          author: 'AI Assistant',
          timestamp: insight.createdAt,
          priority: insight.priority
        });
      }
    });

    // Sort by timestamp
    allMessages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    setMessages(allMessages);
  }, [comments, aiSuggestions, realTimeInsights, userId]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const getInsightIcon = (type: string): string => {
    switch (type) {
      case 'code_quality': return '🔍';
      case 'performance': return '⚡';
      case 'security': return '🔒';
      case 'best_practice': return '✨';
      case 'learning_opportunity': return '📚';
      default: return '💡';
    }
  };

  const handleSendMessage = () => {
    if (!message.trim()) return;

    if (replyingTo) {
      onReplyToMessage(replyingTo, message);
      setReplyingTo(null);
    } else {
      onSendMessage(message);
    }
    
    setMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleReaction = (messageId: string, emoji: string) => {
    onReactToMessage(messageId, emoji);
  };

  const renderMessage = (msg: ChatMessage) => {
    const isAI = msg.type === 'ai_suggestion' || msg.type === 'insight';
    const isSystem = msg.type === 'system';

    return (
      <div key={msg.id} className={`flex gap-3 p-3 rounded-lg ${
        isAI ? 'bg-blue-50 dark:bg-blue-950/20' : 
        isSystem ? 'bg-muted/50' : 'bg-background'
      }`}>
        <Avatar className="h-8 w-8 flex-shrink-0">
          {isAI ? (
            <div className="w-full h-full bg-blue-500 rounded-full flex items-center justify-center">
              <Bot className="h-4 w-4 text-white" />
            </div>
          ) : (
            <>
              <AvatarImage src={`/avatars/${msg.author}.png`} />
              <AvatarFallback>
                <User className="h-4 w-4" />
              </AvatarFallback>
            </>
          )}
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm">{msg.author}</span>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(msg.timestamp, { addSuffix: true })}
            </span>
            {msg.priority && msg.priority !== 'info' && (
              <Badge 
                variant={msg.priority === 'error' ? 'destructive' : 
                        msg.priority === 'warning' ? 'secondary' : 'default'}
                className="text-xs"
              >
                {msg.priority}
              </Badge>
            )}
          </div>

          <div className="text-sm whitespace-pre-wrap break-words">
            {msg.content}
          </div>

          {msg.codeSnippet && (
            <div className="mt-2 p-2 bg-muted rounded border-l-2 border-blue-500">
              <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                <Code className="h-3 w-3" />
                Code reference
              </div>
              <code className="text-xs font-mono">{msg.codeSnippet}</code>
            </div>
          )}

          {/* Reactions */}
          {msg.reactions && msg.reactions.length > 0 && (
            <div className="flex gap-1 mt-2">
              {msg.reactions.map((reaction, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={() => handleReaction(msg.id, reaction.emoji)}
                >
                  {reaction.emoji} {reaction.count}
                </Button>
              ))}
            </div>
          )}

          {/* Message actions */}
          <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2"
              onClick={() => handleReaction(msg.id, '👍')}
            >
              <ThumbsUp className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2"
              onClick={() => setReplyingTo(msg.id)}
            >
              <Reply className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Session Chat
          <Badge variant="outline" className="ml-auto">
            {messages.length} messages
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        {/* Messages area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <div>No messages yet</div>
              <div className="text-sm">Start the conversation!</div>
            </div>
          ) : (
            messages.map(renderMessage)
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Reply indicator */}
        {replyingTo && (
          <div className="px-4 py-2 bg-muted/50 border-t">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                <Reply className="h-3 w-3 inline mr-1" />
                Replying to message
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setReplyingTo(null)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Message input */}
        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="flex-1"
            />
            <Button 
              onClick={handleSendMessage}
              disabled={!message.trim()}
              size="sm"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex gap-1 mt-2">
            {['👍', '👎', '❤️', '😄', '🤔', '🎉'].map(emoji => (
              <Button
                key={emoji}
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => setMessage(message + emoji)}
              >
                {emoji}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}