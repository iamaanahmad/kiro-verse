"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Skeleton } from './ui/skeleton';
import { Alert, AlertDescription } from './ui/alert';
import { TrendingUp, TrendingDown, Minus, Trophy, Target, BookOpen, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import ErrorBoundary from './ErrorBoundary';
import LoadingSpinner from './LoadingSpinner';
import SkillProgressChart from './analytics/SkillProgressChart';
import LearningInsights from './analytics/LearningInsights';
import { UserProgress, LearningInsight, SkillLevel } from '@/types/analytics';
import { UserProgressService, LearningInsightsService } from '@/lib/firebase/analytics';
import { AnalyticsErrorHandler, withAnalyticsErrorBoundary } from '@/lib/analytics/error-handling';
import { OptimizedAnalyticsService, PerformanceMonitor } from '@/lib/analytics/performance-optimization';

interface AnalyticsDashboardProps {
  userId: string;
  className?: string;
}

interface DashboardData {
  userProgress: UserProgress | null;
  learningInsights: LearningInsight[];
  isLoading: boolean;
  error: string | null;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ userId, className }) => {
  const [data, setData] = useState<DashboardData>({
    userProgress: null,
    learningInsights: [],
    isLoading: true,
    error: null
  });

  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadDashboardData();
  }, [userId]);

  const loadDashboardData = async () => {
    const startTime = PerformanceMonitor.startOperation('loadDashboardData', userId);
    
    try {
      setData(prev => ({ ...prev, isLoading: true, error: null }));

      // Use optimized service with caching and error handling
      const [userProgressResult, learningInsightsResult] = await Promise.allSettled([
        AnalyticsErrorHandler.withTimeout(
          () => OptimizedAnalyticsService.getUserProgress(userId),
          10000, // 10 second timeout
          {
            operation: 'loadUserProgress',
            userId,
            timestamp: new Date()
          }
        ),
        AnalyticsErrorHandler.withTimeout(
          () => OptimizedAnalyticsService.getLearningInsights(userId, false, 10),
          8000, // 8 second timeout
          {
            operation: 'loadLearningInsights',
            userId,
            timestamp: new Date()
          }
        )
      ]);

      // Handle partial failures gracefully
      const userProgress = userProgressResult.status === 'fulfilled' 
        ? userProgressResult.value 
        : null;
      
      const learningInsights = learningInsightsResult.status === 'fulfilled' 
        ? learningInsightsResult.value 
        : [];

      // Show warning if some data failed to load
      let errorMessage = null;
      if (userProgressResult.status === 'rejected' && learningInsightsResult.status === 'rejected') {
        errorMessage = 'Failed to load analytics data. Please check your connection and try again.';
      } else if (userProgressResult.status === 'rejected') {
        errorMessage = 'Some analytics data is temporarily unavailable. Showing partial information.';
      } else if (learningInsightsResult.status === 'rejected') {
        errorMessage = 'Learning insights are temporarily unavailable. Other data is current.';
      }

      setData({
        userProgress,
        learningInsights,
        isLoading: false,
        error: errorMessage
      });

      PerformanceMonitor.endOperation('loadDashboardData', startTime, false, 0, userId);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      
      // Try to get fallback data
      try {
        const fallbackData = await AnalyticsErrorHandler.getFallbackAnalyticsData(userId);
        setData({
          userProgress: fallbackData.userProgress,
          learningInsights: fallbackData.learningInsights,
          isLoading: false,
          error: 'Using cached data. Some information may be outdated.'
        });
      } catch (fallbackError) {
        setData(prev => ({
          ...prev,
          isLoading: false,
          error: 'Analytics service is temporarily unavailable. Please try again later.'
        }));
      }

      PerformanceMonitor.endOperation('loadDashboardData', startTime, false, 0, userId);
    }
  };

  const handleRetry = () => {
    loadDashboardData();
  };

  if (data.isLoading) {
    return <DashboardSkeleton className={className} />;
  }

  if (data.error && !data.userProgress) {
    return (
      <div className={cn("space-y-6", className)}>
        <Alert variant="destructive">
          <AlertDescription>
            {data.error}
            <button 
              onClick={handleRetry}
              className="ml-2 underline hover:no-underline"
            >
              Try again
            </button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!data.userProgress) {
    return <EmptyState className={className} />;
  }

  return (
    <ErrorBoundary>
      <div className={cn("space-y-6", className)}>
        {data.error && (
          <Alert variant="default" className="mb-4">
            <AlertDescription>
              {data.error}
              <button 
                onClick={handleRetry}
                className="ml-2 underline hover:no-underline"
              >
                Refresh
              </button>
            </AlertDescription>
          </Alert>
        )}
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Learning Analytics</h1>
            <p className="text-muted-foreground">
              Track your coding progress and skill development
            </p>
          </div>
          <Badge variant="secondary" className="text-sm">
            Last updated: {new Date(data.userProgress.lastAnalysisDate).toLocaleDateString()}
          </Badge>
        </div>

        <OverviewCards userProgress={data.userProgress} />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="skills">Skills</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <SkillProgressChart 
                skillLevels={Array.from(data.userProgress.skillLevels.values())}
                title="Skill Progression Over Time"
              />
              <LearningInsights 
                insights={data.learningInsights}
                onInsightRead={(insightId: string) => {
                  // Handle insight read status update
                  setData(prev => ({
                    ...prev,
                    learningInsights: prev.learningInsights.map(insight =>
                      insight.id === insightId ? { ...insight, isRead: true } : insight
                    )
                  }));
                }}
              />
            </div>
          </TabsContent>

          <TabsContent value="skills" className="space-y-6">
            <SkillsDetailView skillLevels={Array.from(data.userProgress.skillLevels.values())} />
          </TabsContent>

          <TabsContent value="insights" className="space-y-6">
            <LearningInsights 
              insights={data.learningInsights}
              detailed={true}
              onInsightRead={(insightId: string) => {
                setData(prev => ({
                  ...prev,
                  learningInsights: prev.learningInsights.map(insight =>
                    insight.id === insightId ? { ...insight, isRead: true } : insight
                  )
                }));
              }}
            />
          </TabsContent>

          <TabsContent value="achievements" className="space-y-6">
            <AchievementsView userProgress={data.userProgress} />
          </TabsContent>
        </Tabs>
      </div>
    </ErrorBoundary>
  );
};

const OverviewCards: React.FC<{ userProgress: UserProgress }> = ({ userProgress }) => {
  const totalSkills = userProgress.skillLevels.size;
  const averageLevel = totalSkills > 0 
    ? Array.from(userProgress.skillLevels.values())
        .reduce((sum, skill) => sum + skill.currentLevel, 0) / totalSkills
    : 0;
  
  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'improving': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'declining': return <TrendingDown className="h-4 w-4 text-red-500" />;
      default: return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Skills</CardTitle>
          <BookOpen className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalSkills}</div>
          <p className="text-xs text-muted-foreground">
            Skills being tracked
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Average Level</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{averageLevel.toFixed(1)}</div>
          <p className="text-xs text-muted-foreground">
            Across all skills
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Learning Velocity</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{userProgress.learningVelocity.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">
            Levels per day
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Code Quality Trend</CardTitle>
          {getTrendIcon(userProgress.codeQualityTrend.direction)}
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {userProgress.codeQualityTrend.changePercentage > 0 ? '+' : ''}
            {userProgress.codeQualityTrend.changePercentage.toFixed(1)}%
          </div>
          <p className="text-xs text-muted-foreground">
            {userProgress.codeQualityTrend.timeframe} trend
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

const SkillsDetailView: React.FC<{ skillLevels: SkillLevel[] }> = ({ skillLevels }) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Skill Breakdown</h3>
      <div className="grid gap-4">
        {skillLevels.map((skill) => (
          <Card key={skill.skillId}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{skill.skillName}</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Level {skill.currentLevel}</Badge>
                  {skill.trendDirection === 'improving' && (
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  )}
                  {skill.trendDirection === 'declining' && (
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Experience Points</span>
                  <span>{skill.experiencePoints}</span>
                </div>
                <Progress 
                  value={(skill.experiencePoints % 100)} 
                  className="h-2" 
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Industry Benchmark: {skill.industryBenchmark.percentile}th percentile</span>
                  <span>Verification: {skill.verificationStatus}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

const AchievementsView: React.FC<{ userProgress: UserProgress }> = ({ userProgress }) => {
  const completedChallenges = userProgress.challengesCompleted.length;
  const peerInteractions = userProgress.peerInteractions.length;

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Achievements & Milestones</h3>
      
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Challenges Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{completedChallenges}</div>
            <p className="text-sm text-muted-foreground">
              Keep challenging yourself to grow!
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              Peer Interactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{peerInteractions}</div>
            <p className="text-sm text-muted-foreground">
              Learning together makes us stronger
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Milestones</CardTitle>
          <CardDescription>
            Your latest achievements and progress markers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from(userProgress.skillLevels.values())
              .filter(skill => skill.progressHistory.length > 0)
              .slice(0, 5)
              .map((skill) => {
                const latestProgress = skill.progressHistory[skill.progressHistory.length - 1];
                return (
                  <div key={skill.skillId} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{skill.skillName}</p>
                      <p className="text-sm text-muted-foreground">
                        {latestProgress.milestone || `Reached level ${latestProgress.level}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant="secondary">Level {latestProgress.level}</Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(latestProgress.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const DashboardSkeleton: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-6 w-32" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="space-y-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-36" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

const EmptyState: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={cn("flex flex-col items-center justify-center py-12", className)}>
      <div className="text-center space-y-4">
        <BookOpen className="h-12 w-12 text-muted-foreground mx-auto" />
        <h3 className="text-lg font-semibold">No Analytics Data Yet</h3>
        <p className="text-muted-foreground max-w-md">
          Start coding and submitting your work to see your learning analytics and skill progression!
        </p>
      </div>
    </div>
  );
};

export default withAnalyticsErrorBoundary(AnalyticsDashboard);