/**
 * @fileOverview Leaderboard component with real-time updates and privacy-preserving rankings
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trophy, Medal, Award, TrendingUp, TrendingDown, Minus, Users, Clock, Shield } from 'lucide-react';
import { LeaderboardService, LeaderboardQuery, LeaderboardResult } from '@/lib/gamification/leaderboard-service';
import { LeaderboardEntry } from '@/types/gamification';
import { PerformanceMonitor, RealTimeSync } from '@/lib/analytics/performance-optimization';

interface LeaderboardProps {
  userId?: string;
  initialType?: 'global' | 'skill_based' | 'competition' | 'peer_group';
  skillId?: string;
  competitionId?: string;
  showAnonymized?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function Leaderboard({
  userId,
  initialType = 'global',
  skillId,
  competitionId,
  showAnonymized = true,
  autoRefresh = true,
  refreshInterval = 30000
}: LeaderboardProps) {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState(initialType);
  const [selectedSkill, setSelectedSkill] = useState(skillId || '');
  const [selectedTimeframe, setSelectedTimeframe] = useState<'daily' | 'weekly' | 'monthly' | 'all_time'>('weekly');
  const [userRanks, setUserRanks] = useState<any>(null);

  const fetchLeaderboard = useCallback(async () => {
    const startTime = PerformanceMonitor.startOperation('fetchLeaderboard', userId);
    
    try {
      setLoading(true);
      setError(null);

      const query: LeaderboardQuery = {
        type: selectedType,
        skillId: selectedType === 'skill_based' ? selectedSkill : undefined,
        competitionId: selectedType === 'competition' ? competitionId : undefined,
        timeframe: selectedTimeframe,
        limit: 50,
        includeAnonymized: showAnonymized
      };

      // Use Promise.all for parallel fetching when possible
      const promises = [LeaderboardService.getLeaderboard(query)];
      if (userId) {
        promises.push(LeaderboardService.getUserRanks(userId));
      }

      const results = await Promise.all(promises);
      const result = results[0] as LeaderboardResult;
      const ranks = results[1] as any;

      setLeaderboardData(result);
      if (userId && ranks) {
        setUserRanks(ranks);
      }

      PerformanceMonitor.endOperation('fetchLeaderboard', startTime, false, JSON.stringify(result).length, userId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load leaderboard');
      PerformanceMonitor.endOperation('fetchLeaderboard', startTime, false, 0, userId);
    } finally {
      setLoading(false);
    }
  }, [selectedType, selectedSkill, competitionId, selectedTimeframe, showAnonymized, userId]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  useEffect(() => {
    if (!autoRefresh) return;

    // Use real-time sync for better performance
    const unsubscribe = RealTimeSync.subscribeToUpdates(
      `leaderboard_${selectedType}_${selectedSkill}_${selectedTimeframe}`,
      (updates) => {
        // Handle batched updates
        if (updates.length > 0) {
          fetchLeaderboard();
        }
      },
      { batchSize: 5, batchDelay: 2000 } // Batch updates for better performance
    );

    // Fallback interval for cases where real-time sync isn't available
    const interval = setInterval(fetchLeaderboard, refreshInterval);
    
    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [autoRefresh, refreshInterval, fetchLeaderboard, selectedType, selectedSkill, selectedTimeframe]);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Award className="h-5 w-5 text-amber-600" />;
      default:
        return <span className="text-sm font-medium text-muted-foreground">#{rank}</span>;
    }
  };

  const getRankChangeIcon = (change: LeaderboardEntry['rankChange']) => {
    switch (change) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      case 'same':
        return <Minus className="h-4 w-4 text-gray-400" />;
      default:
        return null;
    }
  };

  const formatLastActivity = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50 animate-pulse">
                <div className="w-8 h-8 bg-muted rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-1/3" />
                  <div className="h-3 bg-muted rounded w-1/4" />
                </div>
                <div className="w-16 h-4 bg-muted rounded" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <Trophy className="h-5 w-5" />
            Leaderboard Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{error}</p>
          <Button onClick={fetchLeaderboard} className="mt-4">
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* User Rank Summary */}
      {userRanks && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Your Rankings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">#{userRanks.global}</div>
                <div className="text-sm text-muted-foreground">Global</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">#{userRanks.peerGroup}</div>
                <div className="text-sm text-muted-foreground">Peer Group</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {Object.keys(userRanks.skillBased).length}
                </div>
                <div className="text-sm text-muted-foreground">Skills Ranked</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {Object.keys(userRanks.competitions).length}
                </div>
                <div className="text-sm text-muted-foreground">Competitions</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Leaderboard */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Leaderboard
              {showAnonymized && (
                <Badge variant="secondary" className="ml-2">
                  <Shield className="h-3 w-3 mr-1" />
                  Privacy Protected
                </Badge>
              )}
            </CardTitle>
            
            <div className="flex flex-wrap gap-2">
              <Select value={selectedType} onValueChange={(value: any) => setSelectedType(value)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="global">Global</SelectItem>
                  <SelectItem value="skill_based">By Skill</SelectItem>
                  <SelectItem value="peer_group">Peer Group</SelectItem>
                  <SelectItem value="competition">Competition</SelectItem>
                </SelectContent>
              </Select>

              {selectedType === 'skill_based' && (
                <Select value={selectedSkill} onValueChange={setSelectedSkill}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Select skill" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="JavaScript">JavaScript</SelectItem>
                    <SelectItem value="React">React</SelectItem>
                    <SelectItem value="TypeScript">TypeScript</SelectItem>
                    <SelectItem value="Node.js">Node.js</SelectItem>
                    <SelectItem value="Python">Python</SelectItem>
                  </SelectContent>
                </Select>
              )}

              <Select value={selectedTimeframe} onValueChange={(value: any) => setSelectedTimeframe(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="all_time">All Time</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {leaderboardData && (
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {leaderboardData.totalParticipants.toLocaleString()} participants
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                Updated {leaderboardData.lastUpdated.toLocaleTimeString()}
              </span>
            </div>
          )}
        </CardHeader>

        <CardContent>
          {leaderboardData && leaderboardData.entries.length > 0 ? (
            <div className="space-y-2">
              {leaderboardData.entries.map((entry, index) => (
                <div
                  key={entry.userId}
                  className={`flex items-center gap-4 p-3 rounded-lg transition-colors ${
                    entry.userId === userId
                      ? 'bg-primary/10 border border-primary/20'
                      : 'hover:bg-muted/50'
                  }`}
                >
                  {/* Rank */}
                  <div className="flex items-center gap-2 w-12">
                    {getRankIcon(entry.rank)}
                    {getRankChangeIcon(entry.rankChange)}
                  </div>

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">
                        {entry.displayName || entry.username}
                      </span>
                      {entry.isAnonymized && (
                        <Badge variant="outline" className="text-xs">
                          <Shield className="h-3 w-3 mr-1" />
                          Anonymous
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {entry.badgeCount} badges • {entry.rareBadgeCount} rare
                    </div>
                  </div>

                  {/* Skills */}
                  <div className="hidden md:flex gap-1">
                    {Object.entries(entry.skillLevels).slice(0, 3).map(([skill, level]) => (
                      <Badge key={skill} variant="secondary" className="text-xs">
                        {skill} L{level}
                      </Badge>
                    ))}
                  </div>

                  {/* Points */}
                  <div className="text-right">
                    <div className="font-bold text-lg">
                      {entry.totalPoints.toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatLastActivity(entry.lastActivity)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No leaderboard data available
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}