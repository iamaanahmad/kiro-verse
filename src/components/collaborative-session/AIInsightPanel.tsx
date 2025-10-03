'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Lightbulb, 
  Bot, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  ThumbsUp,
  ThumbsDown,
  Eye,
  EyeOff,
  Zap,
  Shield,
  Code,
  BookOpen
} from 'lucide-react';
import { 
  AISuggestion, 
  RealTimeInsight, 
  SuggestionVote 
} from '@/types/collaborative-session';
import { formatDistanceToNow } from 'date-fns';

interface AIInsightPanelProps {
  sessionId: string;
  userId: string;
  aiSuggestions: AISuggestion[];
  realTimeInsights: RealTimeInsight[];
  onApplySuggestion: (suggestionId: string) => void;
  onVoteSuggestion: (suggestionId: string, vote: 'up' | 'down', comment?: string) => void;
  onDismissInsight: (insightId: string) => void;
  onMarkInsightRead: (insightId: string) => void;
}

export function AIInsightPanel({
  sessionId,
  userId,
  aiSuggestions,
  realTimeInsights,
  onApplySuggestion,
  onVoteSuggestion,
  onDismissInsight,
  onMarkInsightRead
}: AIInsightPanelProps) {
  const [activeTab, setActiveTab] = useState('suggestions');
  const [hiddenInsights, setHiddenInsights] = useState<Set<string>>(new Set());

  // Filter suggestions by status
  const pendingSuggestions = aiSuggestions.filter(s => s.status === 'pending');
  const appliedSuggestions = aiSuggestions.filter(s => s.status === 'accepted');
  
  // Filter insights by read status and visibility
  const unreadInsights = realTimeInsights.filter(
    insight => !insight.isRead[userId] && !hiddenInsights.has(insight.insightId)
  );
  const allInsights = realTimeInsights.filter(
    insight => !hiddenInsights.has(insight.insightId)
  );

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'code_quality': return <Code className="h-4 w-4" />;
      case 'performance': return <Zap className="h-4 w-4" />;
      case 'security': return <Shield className="h-4 w-4" />;
      case 'best_practice': return <CheckCircle className="h-4 w-4" />;
      case 'learning_opportunity': return <BookOpen className="h-4 w-4" />;
      default: return <Lightbulb className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-500 border-red-200 bg-red-50 dark:bg-red-950/20';
      case 'medium': return 'text-yellow-500 border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20';
      case 'low': return 'text-blue-500 border-blue-200 bg-blue-50 dark:bg-blue-950/20';
      default: return 'text-muted-foreground border-border bg-muted/50';
    }
  };

  const getInsightPriorityColor = (priority: string) => {
    switch (priority) {
      case 'error': return 'border-red-500 bg-red-50 dark:bg-red-950/20';
      case 'warning': return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20';
      case 'success': return 'border-green-500 bg-green-50 dark:bg-green-950/20';
      default: return 'border-blue-500 bg-blue-50 dark:bg-blue-950/20';
    }
  };

  const handleHideInsight = (insightId: string) => {
    setHiddenInsights(prev => new Set([...prev, insightId]));
    onDismissInsight(insightId);
  };

  const renderSuggestion = (suggestion: AISuggestion) => {
    const userVote = suggestion.votes.find(v => v.userId === userId);
    const upvotes = suggestion.votes.filter(v => v.vote === 'up').length;
    const downvotes = suggestion.votes.filter(v => v.vote === 'down').length;

    return (
      <Card key={suggestion.suggestionId} className={`mb-3 ${getPriorityColor(suggestion.priority)}`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Bot className="h-4 w-4" />
                <span className="font-medium text-sm">{suggestion.title}</span>
                <Badge variant="outline" className="text-xs">
                  {suggestion.type.replace('_', ' ')}
                </Badge>
                <Badge 
                  variant={suggestion.priority === 'high' ? 'destructive' : 'secondary'}
                  className="text-xs"
                >
                  {suggestion.priority}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                Confidence: {Math.round(suggestion.confidence * 100)}% • 
                {formatDistanceToNow(suggestion.createdAt, { addSuffix: true })}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="text-sm mb-3">{suggestion.description}</div>
          
          {suggestion.reasoning && (
            <div className="text-xs text-muted-foreground mb-3 p-2 bg-muted/50 rounded">
              <strong>Reasoning:</strong> {suggestion.reasoning}
            </div>
          )}

          {/* Code diff */}
          <div className="space-y-2 mb-3">
            <div className="text-xs font-medium">Suggested change:</div>
            <div className="bg-muted rounded p-2">
              <div className="text-xs text-red-600 mb-1">- {suggestion.targetCode}</div>
              <div className="text-xs text-green-600">+ {suggestion.suggestedCode}</div>
            </div>
          </div>

          {/* Skills targeted */}
          {suggestion.skillsTargeted.length > 0 && (
            <div className="mb-3">
              <div className="text-xs font-medium mb-1">Skills improved:</div>
              <div className="flex flex-wrap gap-1">
                {suggestion.skillsTargeted.map(skill => (
                  <Badge key={skill} variant="outline" className="text-xs">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between">
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onVoteSuggestion(suggestion.suggestionId, 'up')}
                className={`h-7 px-2 ${userVote?.vote === 'up' ? 'bg-green-100 dark:bg-green-950/20' : ''}`}
              >
                <ThumbsUp className="h-3 w-3 mr-1" />
                {upvotes}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onVoteSuggestion(suggestion.suggestionId, 'down')}
                className={`h-7 px-2 ${userVote?.vote === 'down' ? 'bg-red-100 dark:bg-red-950/20' : ''}`}
              >
                <ThumbsDown className="h-3 w-3 mr-1" />
                {downvotes}
              </Button>
            </div>

            {suggestion.status === 'pending' && (
              <Button
                size="sm"
                onClick={() => onApplySuggestion(suggestion.suggestionId)}
                className="h-7"
              >
                Apply
              </Button>
            )}

            {suggestion.status === 'accepted' && (
              <Badge variant="default" className="text-xs">
                Applied by {suggestion.appliedBy}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderInsight = (insight: RealTimeInsight) => {
    const isUnread = !insight.isRead[userId];

    return (
      <Card 
        key={insight.insightId} 
        className={`mb-3 border-l-4 ${getInsightPriorityColor(insight.priority)} ${
          isUnread ? 'ring-2 ring-blue-200 dark:ring-blue-800' : ''
        }`}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              {getInsightIcon(insight.type)}
              <span className="font-medium text-sm">{insight.title}</span>
              {isUnread && (
                <Badge variant="default" className="text-xs">New</Badge>
              )}
            </div>
            
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onMarkInsightRead(insight.insightId)}
                className="h-6 w-6 p-0"
                title={isUnread ? "Mark as read" : "Mark as unread"}
              >
                {isUnread ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleHideInsight(insight.insightId)}
                className="h-6 w-6 p-0"
                title="Dismiss"
              >
                ×
              </Button>
            </div>
          </div>
          
          <div className="text-xs text-muted-foreground">
            {formatDistanceToNow(insight.createdAt, { addSuffix: true })} • 
            Triggered by {insight.triggeredBy.replace('_', ' ')}
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="text-sm mb-3">{insight.message}</div>
          
          {insight.relatedCode && (
            <div className="bg-muted rounded p-2 mb-3">
              <div className="text-xs font-medium mb-1">Related code:</div>
              <code className="text-xs font-mono">{insight.relatedCode}</code>
            </div>
          )}

          {/* Responses */}
          {insight.responses.length > 0 && (
            <div className="text-xs text-muted-foreground">
              {insight.responses.filter(r => r.response === 'helpful').length} found this helpful
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5" />
          AI Insights
          {(unreadInsights.length > 0 || pendingSuggestions.length > 0) && (
            <Badge variant="destructive" className="ml-auto">
              {unreadInsights.length + pendingSuggestions.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 p-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-2 mx-4">
            <TabsTrigger value="suggestions" className="relative">
              Suggestions
              {pendingSuggestions.length > 0 && (
                <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs">
                  {pendingSuggestions.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="insights" className="relative">
              Insights
              {unreadInsights.length > 0 && (
                <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs">
                  {unreadInsights.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="suggestions" className="flex-1 overflow-y-auto p-4 mt-0">
            {pendingSuggestions.length === 0 && appliedSuggestions.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <Lightbulb className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <div>No AI suggestions yet</div>
                <div className="text-sm">Keep coding to get personalized suggestions!</div>
              </div>
            ) : (
              <div>
                {pendingSuggestions.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Pending Suggestions ({pendingSuggestions.length})
                    </h4>
                    {pendingSuggestions.map(renderSuggestion)}
                  </div>
                )}

                {appliedSuggestions.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Applied Suggestions ({appliedSuggestions.length})
                    </h4>
                    {appliedSuggestions.slice(0, 3).map(renderSuggestion)}
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="insights" className="flex-1 overflow-y-auto p-4 mt-0">
            {allInsights.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <div>No insights available</div>
                <div className="text-sm">AI will provide insights as you code together</div>
              </div>
            ) : (
              <div>
                {unreadInsights.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      New Insights ({unreadInsights.length})
                    </h4>
                    {unreadInsights.map(renderInsight)}
                  </div>
                )}

                <div>
                  <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    All Insights
                  </h4>
                  {allInsights.slice(0, 10).map(renderInsight)}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}