"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';
import { 
  Lightbulb, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Eye, 
  EyeOff,
  Star,
  Target,
  BookOpen,
  ArrowRight
} from 'lucide-react';
import { LearningInsight } from '@/types/analytics';
import { cn } from '@/lib/utils';
import { LearningInsightsService } from '@/lib/firebase/analytics';

interface LearningInsightsProps {
  insights: LearningInsight[];
  onInsightRead?: (insightId: string) => void;
  detailed?: boolean;
  className?: string;
  maxItems?: number;
}

const LearningInsights: React.FC<LearningInsightsProps> = ({
  insights,
  onInsightRead,
  detailed = false,
  className,
  maxItems = detailed ? undefined : 5
}) => {
  const [filter, setFilter] = useState<'all' | 'unread' | 'high' | 'strength' | 'improvement_area' | 'recommendation'>('all');
  const [expandedInsights, setExpandedInsights] = useState<Set<string>>(new Set());

  // Filter insights based on current filter
  const filteredInsights = insights.filter(insight => {
    switch (filter) {
      case 'unread': return !insight.isRead;
      case 'high': return insight.priority === 'high';
      case 'strength': return insight.type === 'strength';
      case 'improvement_area': return insight.type === 'improvement_area';
      case 'recommendation': return insight.type === 'recommendation';
      default: return true;
    }
  }).slice(0, maxItems);

  const handleInsightClick = async (insight: LearningInsight) => {
    if (!insight.isRead && onInsightRead) {
      try {
        await LearningInsightsService.markInsightAsRead(insight.id);
        onInsightRead(insight.id);
      } catch (error) {
        console.error('Error marking insight as read:', error);
      }
    }
  };

  const toggleExpanded = (insightId: string) => {
    setExpandedInsights(prev => {
      const newSet = new Set(prev);
      if (newSet.has(insightId)) {
        newSet.delete(insightId);
      } else {
        newSet.add(insightId);
      }
      return newSet;
    });
  };

  const getInsightIcon = (type: LearningInsight['type']) => {
    switch (type) {
      case 'strength':
        return <Star className="h-4 w-4 text-green-500" />;
      case 'improvement_area':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'recommendation':
        return <Lightbulb className="h-4 w-4 text-blue-500" />;
      default:
        return <BookOpen className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: LearningInsight['priority']) => {
    switch (priority) {
      case 'high': return 'text-red-500 border-red-200 bg-red-50';
      case 'medium': return 'text-yellow-500 border-yellow-200 bg-yellow-50';
      case 'low': return 'text-green-500 border-green-200 bg-green-50';
      default: return 'text-gray-500 border-gray-200 bg-gray-50';
    }
  };

  const getInsightTypeLabel = (type: LearningInsight['type']) => {
    switch (type) {
      case 'strength': return 'Strength';
      case 'improvement_area': return 'Improvement';
      case 'recommendation': return 'Recommendation';
      default: return 'Insight';
    }
  };

  const unreadCount = insights.filter(insight => !insight.isRead).length;
  const highPriorityCount = insights.filter(insight => insight.priority === 'high').length;

  if (insights.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Learning Insights
          </CardTitle>
          <CardDescription>
            Personalized recommendations based on your coding activity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-medium mb-2">No insights yet</h3>
            <p className="text-sm text-muted-foreground">
              Keep coding to receive personalized learning insights!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              Learning Insights
              {unreadCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {unreadCount} new
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              {detailed 
                ? "All your personalized learning recommendations and insights"
                : "Recent insights to help you improve"
              }
            </CardDescription>
          </div>
          {highPriorityCount > 0 && (
            <Badge variant="destructive" className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              {highPriorityCount} high priority
            </Badge>
          )}
        </div>

        {detailed && (
          <Tabs value={filter} onValueChange={(value: any) => setFilter(value)}>
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="unread">Unread</TabsTrigger>
              <TabsTrigger value="high">High Priority</TabsTrigger>
              <TabsTrigger value="strength">Strengths</TabsTrigger>
              <TabsTrigger value="improvement_area">Improvements</TabsTrigger>
              <TabsTrigger value="recommendation">Recommendations</TabsTrigger>
            </TabsList>
          </Tabs>
        )}
      </CardHeader>

      <CardContent>
        <ScrollArea className={detailed ? "h-96" : "h-auto"}>
          <div className="space-y-4">
            {filteredInsights.map((insight, index) => (
              <div key={insight.id}>
                <InsightCard
                  insight={insight}
                  onClick={() => handleInsightClick(insight)}
                  onToggleExpanded={() => toggleExpanded(insight.id)}
                  isExpanded={expandedInsights.has(insight.id)}
                  detailed={detailed}
                />
                {index < filteredInsights.length - 1 && <Separator className="my-4" />}
              </div>
            ))}
          </div>
        </ScrollArea>

        {!detailed && insights.length > (maxItems || 5) && (
          <div className="mt-4 text-center">
            <Button variant="outline" size="sm">
              View All Insights ({insights.length})
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

interface InsightCardProps {
  insight: LearningInsight;
  onClick: () => void;
  onToggleExpanded: () => void;
  isExpanded: boolean;
  detailed: boolean;
}

const InsightCard: React.FC<InsightCardProps> = ({
  insight,
  onClick,
  onToggleExpanded,
  isExpanded,
  detailed
}) => {
  const getInsightIcon = (type: LearningInsight['type']) => {
    switch (type) {
      case 'strength':
        return <Star className="h-4 w-4 text-green-500" />;
      case 'improvement_area':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'recommendation':
        return <Lightbulb className="h-4 w-4 text-blue-500" />;
      default:
        return <BookOpen className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: LearningInsight['priority']) => {
    switch (priority) {
      case 'high': return 'border-red-200 bg-red-50';
      case 'medium': return 'border-yellow-200 bg-yellow-50';
      case 'low': return 'border-green-200 bg-green-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const getInsightTypeLabel = (type: LearningInsight['type']) => {
    switch (type) {
      case 'strength': return 'Strength';
      case 'improvement_area': return 'Improvement';
      case 'recommendation': return 'Recommendation';
      default: return 'Insight';
    }
  };

  return (
    <div
      className={cn(
        "p-4 rounded-lg border transition-all cursor-pointer",
        insight.isRead ? "bg-background" : getPriorityColor(insight.priority),
        "hover:shadow-md"
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          {getInsightIcon(insight.type)}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className={cn(
                "font-medium text-sm",
                !insight.isRead && "font-semibold"
              )}>
                {insight.title}
              </h4>
              <Badge variant="outline" className="text-xs">
                {getInsightTypeLabel(insight.type)}
              </Badge>
              {insight.priority === 'high' && (
                <Badge variant="destructive" className="text-xs">
                  High Priority
                </Badge>
              )}
            </div>
            
            <p className="text-sm text-muted-foreground mb-2">
              {insight.description}
            </p>

            {(isExpanded || detailed) && insight.actionableSteps.length > 0 && (
              <div className="mt-3">
                <h5 className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                  Action Steps
                </h5>
                <ul className="space-y-1">
                  {insight.actionableSteps.map((step, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <ArrowRight className="h-3 w-3 mt-0.5 text-muted-foreground flex-shrink-0" />
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{insight.category}</span>
                <span>•</span>
                <span>{new Date(insight.createdAt).toLocaleDateString()}</span>
                {insight.confidenceScore && (
                  <>
                    <span>•</span>
                    <span>{Math.round(insight.confidenceScore * 100)}% confidence</span>
                  </>
                )}
              </div>
              
              {insight.actionableSteps.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleExpanded();
                  }}
                  className="text-xs h-6 px-2"
                >
                  {isExpanded ? 'Show Less' : 'Show Steps'}
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 ml-2">
          {!insight.isRead ? (
            <Eye className="h-4 w-4 text-muted-foreground" />
          ) : (
            <CheckCircle className="h-4 w-4 text-green-500" />
          )}
        </div>
      </div>
    </div>
  );
};

export default LearningInsights;
export { LearningInsights };