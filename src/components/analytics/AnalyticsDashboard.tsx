"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, TrendingUp, Award, Target, Brain, Zap } from 'lucide-react';
import { SkillProgressChart } from './SkillProgressChart';
import { LearningInsights } from './LearningInsights';
import { PerformanceDashboard } from './PerformanceDashboard';

interface AnalyticsDashboardProps {
  userId: string;
}

export function AnalyticsDashboard({ userId }: AnalyticsDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState({
    skillLevels: {
      JavaScript: { level: 3, progress: 75, xp: 750 },
      React: { level: 2, progress: 45, xp: 450 },
      TypeScript: { level: 2, progress: 60, xp: 320 },
      'Node.js': { level: 1, progress: 80, xp: 180 }
    },
    totalXP: 1700,
    badgesEarned: 12,
    learningVelocity: 2.3,
    codeQualityTrend: 18
  });

  useEffect(() => {
    // Simulate loading analytics data
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [userId]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-muted rounded w-1/3"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-muted rounded"></div>
          ))}
        </div>
        <div className="h-96 bg-muted rounded"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-3">
        <BarChart3 className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Learning Analytics</h1>
          <p className="text-muted-foreground">Track your coding journey and skill development</p>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total XP</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.totalXP.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +180 from last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Badges Earned</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.badgesEarned}</div>
            <p className="text-xs text-muted-foreground">
              3 rare, 2 epic badges
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Learning Velocity</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.learningVelocity}x</div>
            <p className="text-xs text-muted-foreground">
              Above average pace
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Code Quality</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{analyticsData.codeQualityTrend}%</div>
            <p className="text-xs text-muted-foreground">
              Improving trend
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Skill Levels */}
      <Card>
        <CardHeader>
          <CardTitle>Current Skill Levels</CardTitle>
          <CardDescription>Your progress across different programming skills</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(analyticsData.skillLevels).map(([skill, data]) => (
            <div key={skill} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{skill}</span>
                  <Badge variant="secondary">Level {data.level}</Badge>
                </div>
                <span className="text-sm text-muted-foreground">{data.xp} XP</span>
              </div>
              <Progress value={data.progress} className="h-2" />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Detailed Analytics Tabs */}
      <Tabs defaultValue="progress" className="space-y-4">
        <TabsList>
          <TabsTrigger value="progress">Skill Progress</TabsTrigger>
          <TabsTrigger value="insights">Learning Insights</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="progress" className="space-y-4">
          <SkillProgressChart userId={userId} />
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <LearningInsights userId={userId} />
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <PerformanceDashboard userId={userId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}