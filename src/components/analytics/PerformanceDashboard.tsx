/**
 * @fileOverview Performance Dashboard for Analytics System Monitoring
 * 
 * This component displays performance metrics, cache statistics, and system health
 * for the analytics system, helping developers monitor and optimize performance.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity, 
  Database, 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  Zap, 
  BarChart3,
  RefreshCw,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { 
  PerformanceMonitor, 
  OptimizedAnalyticsService, 
  PerformanceMetrics 
} from '@/lib/analytics/performance-optimization';

interface PerformanceDashboardProps {
  className?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical';
  cacheHitRate: number;
  averageResponseTime: number;
  errorRate: number;
  activeConnections: number;
}

export function PerformanceDashboard({ 
  className, 
  autoRefresh = true, 
  refreshInterval = 30000 
}: PerformanceDashboardProps) {
  const [metrics, setMetrics] = useState<PerformanceMetrics[]>([]);
  const [cacheStats, setCacheStats] = useState<any>(null);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshData = async () => {
    try {
      setLoading(true);

      // Get performance metrics
      const allMetrics = PerformanceMonitor.getMetrics();
      setMetrics(allMetrics.slice(-100)); // Last 100 operations

      // Get cache statistics
      const stats = OptimizedAnalyticsService.getCacheStats();
      setCacheStats(stats);

      // Calculate system health
      const health = calculateSystemHealth(allMetrics);
      setSystemHealth(health);
    } catch (error) {
      console.error('Failed to refresh performance data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(refreshData, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval]);

  const calculateSystemHealth = (metrics: PerformanceMetrics[]): SystemHealth => {
    if (metrics.length === 0) {
      return {
        status: 'warning',
        cacheHitRate: 0,
        averageResponseTime: 0,
        errorRate: 0,
        activeConnections: 0
      };
    }

    const recentMetrics = metrics.slice(-50); // Last 50 operations
    const cacheHits = recentMetrics.filter(m => m.cacheHit).length;
    const cacheHitRate = (cacheHits / recentMetrics.length) * 100;
    
    const totalDuration = recentMetrics.reduce((sum, m) => sum + m.duration, 0);
    const averageResponseTime = totalDuration / recentMetrics.length;
    
    // Simulate error rate (in real implementation, track actual errors)
    const errorRate = Math.random() * 5; // 0-5% error rate
    
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (averageResponseTime > 2000 || errorRate > 3 || cacheHitRate < 50) {
      status = 'warning';
    }
    if (averageResponseTime > 5000 || errorRate > 10 || cacheHitRate < 20) {
      status = 'critical';
    }

    return {
      status,
      cacheHitRate,
      averageResponseTime,
      errorRate,
      activeConnections: Math.floor(Math.random() * 100) + 10
    };
  };

  const getOperationStats = (operationName: string) => {
    const operationMetrics = metrics.filter(m => m.operationName === operationName);
    if (operationMetrics.length === 0) return null;

    const totalDuration = operationMetrics.reduce((sum, m) => sum + m.duration, 0);
    const cacheHits = operationMetrics.filter(m => m.cacheHit).length;

    return {
      count: operationMetrics.length,
      averageDuration: totalDuration / operationMetrics.length,
      cacheHitRate: (cacheHits / operationMetrics.length) * 100,
      totalDataSize: operationMetrics.reduce((sum, m) => sum + m.dataSize, 0)
    };
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'critical':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      default:
        return <Activity className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'critical':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (loading && !systemHealth) {
    return (
      <div className={className}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Performance Dashboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Performance Dashboard</h2>
            <p className="text-muted-foreground">
              Monitor analytics system performance and optimization
            </p>
          </div>
          <Button onClick={refreshData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* System Health Overview */}
        {systemHealth && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getStatusIcon(systemHealth.status)}
                System Health
                <Badge className={getStatusColor(systemHealth.status)}>
                  {systemHealth.status.toUpperCase()}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Cache Hit Rate</div>
                  <div className="text-2xl font-bold">
                    {systemHealth.cacheHitRate.toFixed(1)}%
                  </div>
                  <Progress value={systemHealth.cacheHitRate} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Avg Response Time</div>
                  <div className="text-2xl font-bold">
                    {systemHealth.averageResponseTime.toFixed(0)}ms
                  </div>
                  <Progress 
                    value={Math.min(100, (2000 - systemHealth.averageResponseTime) / 20)} 
                    className="h-2" 
                  />
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Error Rate</div>
                  <div className="text-2xl font-bold">
                    {systemHealth.errorRate.toFixed(1)}%
                  </div>
                  <Progress 
                    value={systemHealth.errorRate * 10} 
                    className="h-2"
                    // @ts-ignore
                    indicatorClassName={systemHealth.errorRate > 5 ? "bg-red-500" : "bg-green-500"}
                  />
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Active Connections</div>
                  <div className="text-2xl font-bold">
                    {systemHealth.activeConnections}
                  </div>
                  <Progress value={(systemHealth.activeConnections / 100) * 100} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="operations" className="space-y-4">
          <TabsList>
            <TabsTrigger value="operations">Operations</TabsTrigger>
            <TabsTrigger value="cache">Cache Stats</TabsTrigger>
            <TabsTrigger value="metrics">Detailed Metrics</TabsTrigger>
          </TabsList>

          <TabsContent value="operations" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {['getUserProgress', 'getAnalyticsData', 'getLearningInsights', 'fetchLeaderboard'].map(operation => {
                const stats = getOperationStats(operation);
                if (!stats) return null;

                return (
                  <Card key={operation}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">{operation}</CardTitle>
                      <CardDescription>
                        {stats.count} operations
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Avg Duration</span>
                        <span className="font-medium">{stats.averageDuration.toFixed(0)}ms</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Cache Hit Rate</span>
                        <span className="font-medium">{stats.cacheHitRate.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Total Data</span>
                        <span className="font-medium">
                          {(stats.totalDataSize / 1024).toFixed(1)}KB
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="cache" className="space-y-4">
            {cacheStats && (
              <div className="grid gap-4 md:grid-cols-2">
                {Object.entries(cacheStats).map(([cacheName, stats]: [string, any]) => (
                  <Card key={cacheName}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Database className="h-4 w-4" />
                        {cacheName} Cache
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Size</span>
                        <span className="font-medium">{stats.size} / {stats.maxSize}</span>
                      </div>
                      <Progress value={(stats.size / stats.maxSize) * 100} className="h-2" />
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Strategy</span>
                        <Badge variant="outline">{stats.strategy.toUpperCase()}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">TTL</span>
                        <span className="font-medium">{(stats.ttl / 1000 / 60).toFixed(0)}m</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="metrics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Recent Operations
                </CardTitle>
                <CardDescription>
                  Last {Math.min(20, metrics.length)} operations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {metrics.slice(-20).reverse().map((metric, index) => (
                    <div key={index} className="flex items-center justify-between p-2 rounded border">
                      <div className="flex items-center gap-3">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{metric.operationName}</span>
                        {metric.cacheHit && (
                          <Badge variant="secondary" className="text-xs">
                            <Zap className="h-3 w-3 mr-1" />
                            Cached
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className={metric.duration > 1000 ? 'text-red-600' : 'text-green-600'}>
                          {metric.duration.toFixed(0)}ms
                        </span>
                        {metric.duration > 1000 ? (
                          <TrendingUp className="h-4 w-4 text-red-500" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-green-500" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default PerformanceDashboard;