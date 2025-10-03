/**
 * @fileOverview Performance Optimization for Analytics System
 * 
 * This module provides performance optimization features including:
 * - Caching strategies for analytics data and benchmark comparisons
 * - Database query optimization for analytics dashboard and leaderboards
 * - Performance monitoring for AI processing and real-time collaboration
 * - Efficient data loading and pagination for large datasets
 */

import { UserProgress, AnalyticsData, LearningInsight, SkillLevel } from '@/types/analytics';
import { UserProgressService, AnalyticsDataService, LearningInsightsService } from '@/lib/firebase/analytics';

export interface CacheConfig {
  ttl: number; // Time to live in milliseconds
  maxSize: number; // Maximum number of items in cache
  strategy: 'lru' | 'fifo' | 'lfu'; // Cache eviction strategy
}

export interface PerformanceMetrics {
  operationName: string;
  startTime: number;
  endTime: number;
  duration: number;
  cacheHit: boolean;
  dataSize: number;
  userId?: string;
}

export interface PaginationOptions {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: Record<string, any>;
}

export interface CachedData<T> {
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
}

/**
 * High-performance cache implementation with multiple eviction strategies
 */
export class AnalyticsCache<T> {
  private cache = new Map<string, CachedData<T>>();
  private accessOrder: string[] = []; // For LRU
  private accessCounts = new Map<string, number>(); // For LFU
  private config: CacheConfig;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      ttl: 5 * 60 * 1000, // 5 minutes default
      maxSize: 1000,
      strategy: 'lru',
      ...config
    };
  }

  get(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    // Check if item has expired
    if (Date.now() - item.timestamp > item.ttl) {
      this.delete(key);
      return null;
    }

    // Update access tracking
    item.lastAccessed = Date.now();
    item.accessCount++;
    this.accessCounts.set(key, (this.accessCounts.get(key) || 0) + 1);

    // Update LRU order
    if (this.config.strategy === 'lru') {
      const index = this.accessOrder.indexOf(key);
      if (index > -1) {
        this.accessOrder.splice(index, 1);
      }
      this.accessOrder.push(key);
    }

    return item.data;
  }

  set(key: string, data: T, customTtl?: number): void {
    const ttl = customTtl || this.config.ttl;
    
    // Check if we need to evict items
    if (this.cache.size >= this.config.maxSize && !this.cache.has(key)) {
      this.evict();
    }

    const cachedData: CachedData<T> = {
      data,
      timestamp: Date.now(),
      ttl,
      accessCount: 1,
      lastAccessed: Date.now()
    };

    this.cache.set(key, cachedData);
    this.accessCounts.set(key, 1);

    // Update access order for LRU
    if (this.config.strategy === 'lru') {
      const index = this.accessOrder.indexOf(key);
      if (index > -1) {
        this.accessOrder.splice(index, 1);
      }
      this.accessOrder.push(key);
    }
  }

  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    this.accessCounts.delete(key);
    
    if (this.config.strategy === 'lru') {
      const index = this.accessOrder.indexOf(key);
      if (index > -1) {
        this.accessOrder.splice(index, 1);
      }
    }
    
    return deleted;
  }

  clear(): void {
    this.cache.clear();
    this.accessOrder = [];
    this.accessCounts.clear();
  }

  size(): number {
    return this.cache.size;
  }

  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.config.maxSize,
      strategy: this.config.strategy,
      ttl: this.config.ttl
    };
  }

  private evict(): void {
    let keyToEvict: string | undefined;

    switch (this.config.strategy) {
      case 'lru':
        keyToEvict = this.accessOrder[0];
        break;
      
      case 'fifo':
        // Find oldest item by timestamp
        let oldestTime = Date.now();
        for (const [key, item] of this.cache.entries()) {
          if (item.timestamp < oldestTime) {
            oldestTime = item.timestamp;
            keyToEvict = key;
          }
        }
        break;
      
      case 'lfu':
        // Find least frequently used item
        let minCount = Infinity;
        for (const [key, count] of this.accessCounts.entries()) {
          if (count < minCount) {
            minCount = count;
            keyToEvict = key;
          }
        }
        break;
    }

    if (keyToEvict) {
      this.delete(keyToEvict);
    }
  }
}

/**
 * Performance monitoring and metrics collection
 */
export class PerformanceMonitor {
  private static metrics: PerformanceMetrics[] = [];
  private static readonly MAX_METRICS = 1000;

  static startOperation(operationName: string, userId?: string): number {
    return performance.now();
  }

  static endOperation(
    operationName: string,
    startTime: number,
    cacheHit: boolean = false,
    dataSize: number = 0,
    userId?: string
  ): PerformanceMetrics {
    const endTime = performance.now();
    const duration = endTime - startTime;

    const metric: PerformanceMetrics = {
      operationName,
      startTime,
      endTime,
      duration,
      cacheHit,
      dataSize,
      userId
    };

    // Store metric (with size limit)
    this.metrics.push(metric);
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics.shift();
    }

    // Log slow operations
    if (duration > 1000) { // More than 1 second
      console.warn(`Slow operation detected: ${operationName} took ${duration.toFixed(2)}ms`);
    }

    return metric;
  }

  static getMetrics(operationName?: string): PerformanceMetrics[] {
    if (operationName) {
      return this.metrics.filter(m => m.operationName === operationName);
    }
    return [...this.metrics];
  }

  static getAveragePerformance(operationName: string): {
    averageDuration: number;
    cacheHitRate: number;
    totalOperations: number;
  } {
    const operationMetrics = this.getMetrics(operationName);
    
    if (operationMetrics.length === 0) {
      return { averageDuration: 0, cacheHitRate: 0, totalOperations: 0 };
    }

    const totalDuration = operationMetrics.reduce((sum, m) => sum + m.duration, 0);
    const cacheHits = operationMetrics.filter(m => m.cacheHit).length;

    return {
      averageDuration: totalDuration / operationMetrics.length,
      cacheHitRate: cacheHits / operationMetrics.length,
      totalOperations: operationMetrics.length
    };
  }

  static clearMetrics(): void {
    this.metrics = [];
  }
}

/**
 * Optimized analytics service with caching and performance monitoring
 */
export class OptimizedAnalyticsService {
  private static userProgressCache = new AnalyticsCache<UserProgress>({
    ttl: 2 * 60 * 1000, // 2 minutes for user progress
    maxSize: 500,
    strategy: 'lru'
  });

  private static analyticsDataCache = new AnalyticsCache<AnalyticsData[]>({
    ttl: 5 * 60 * 1000, // 5 minutes for analytics data
    maxSize: 200,
    strategy: 'lru'
  });

  private static insightsCache = new AnalyticsCache<LearningInsight[]>({
    ttl: 10 * 60 * 1000, // 10 minutes for insights
    maxSize: 300,
    strategy: 'lru'
  });

  private static leaderboardCache = new AnalyticsCache<any[]>({
    ttl: 1 * 60 * 1000, // 1 minute for leaderboards (more dynamic)
    maxSize: 50,
    strategy: 'lru'
  });

  /**
   * Get user progress with caching
   */
  static async getUserProgress(userId: string, forceRefresh: boolean = false): Promise<UserProgress | null> {
    const cacheKey = `user_progress_${userId}`;
    const startTime = PerformanceMonitor.startOperation('getUserProgress', userId);

    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cached = this.userProgressCache.get(cacheKey);
      if (cached) {
        PerformanceMonitor.endOperation('getUserProgress', startTime, true, JSON.stringify(cached).length, userId);
        return cached;
      }
    }

    try {
      // Fetch from database
      const userProgress = await UserProgressService.getUserProgress(userId);
      
      // Cache the result
      if (userProgress) {
        this.userProgressCache.set(cacheKey, userProgress);
      }

      const dataSize = userProgress ? JSON.stringify(userProgress).length : 0;
      PerformanceMonitor.endOperation('getUserProgress', startTime, false, dataSize, userId);

      return userProgress;
    } catch (error) {
      PerformanceMonitor.endOperation('getUserProgress', startTime, false, 0, userId);
      throw error;
    }
  }

  /**
   * Get analytics data with caching and pagination
   */
  static async getAnalyticsData(
    userId: string,
    options: PaginationOptions = { page: 1, pageSize: 20 },
    forceRefresh: boolean = false
  ): Promise<{ data: AnalyticsData[]; total: number; hasMore: boolean }> {
    const cacheKey = `analytics_${userId}_${options.page}_${options.pageSize}`;
    const startTime = PerformanceMonitor.startOperation('getAnalyticsData', userId);

    // Check cache first
    if (!forceRefresh) {
      const cached = this.analyticsDataCache.get(cacheKey);
      if (cached) {
        PerformanceMonitor.endOperation('getAnalyticsData', startTime, true, JSON.stringify(cached).length, userId);
        return {
          data: cached,
          total: cached.length,
          hasMore: cached.length === options.pageSize
        };
      }
    }

    try {
      // Calculate offset for pagination
      const limit = options.pageSize;
      
      // Fetch from database with pagination
      const analyticsData = await AnalyticsDataService.getAnalyticsData(userId, limit);
      
      // Cache the result
      this.analyticsDataCache.set(cacheKey, analyticsData);

      const result = {
        data: analyticsData,
        total: analyticsData.length,
        hasMore: analyticsData.length === options.pageSize
      };

      const dataSize = JSON.stringify(result).length;
      PerformanceMonitor.endOperation('getAnalyticsData', startTime, false, dataSize, userId);

      return result;
    } catch (error) {
      PerformanceMonitor.endOperation('getAnalyticsData', startTime, false, 0, userId);
      throw error;
    }
  }

  /**
   * Get learning insights with caching
   */
  static async getLearningInsights(
    userId: string,
    unreadOnly: boolean = false,
    limit: number = 10,
    forceRefresh: boolean = false
  ): Promise<LearningInsight[]> {
    const cacheKey = `insights_${userId}_${unreadOnly}_${limit}`;
    const startTime = PerformanceMonitor.startOperation('getLearningInsights', userId);

    // Check cache first
    if (!forceRefresh) {
      const cached = this.insightsCache.get(cacheKey);
      if (cached) {
        PerformanceMonitor.endOperation('getLearningInsights', startTime, true, JSON.stringify(cached).length, userId);
        return cached;
      }
    }

    try {
      // Fetch from database
      const insights = await LearningInsightsService.getUserLearningInsights(userId, unreadOnly, limit);
      
      // Cache the result
      this.insightsCache.set(cacheKey, insights);

      const dataSize = JSON.stringify(insights).length;
      PerformanceMonitor.endOperation('getLearningInsights', startTime, false, dataSize, userId);

      return insights;
    } catch (error) {
      PerformanceMonitor.endOperation('getLearningInsights', startTime, false, 0, userId);
      throw error;
    }
  }

  /**
   * Batch load multiple users' data efficiently
   */
  static async batchLoadUserData(userIds: string[]): Promise<Map<string, UserProgress | null>> {
    const startTime = PerformanceMonitor.startOperation('batchLoadUserData');
    const results = new Map<string, UserProgress | null>();
    const uncachedUserIds: string[] = [];

    // Check cache for each user
    for (const userId of userIds) {
      const cacheKey = `user_progress_${userId}`;
      const cached = this.userProgressCache.get(cacheKey);
      if (cached) {
        results.set(userId, cached);
      } else {
        uncachedUserIds.push(userId);
      }
    }

    // Batch fetch uncached data
    if (uncachedUserIds.length > 0) {
      const batchPromises = uncachedUserIds.map(async (userId) => {
        try {
          const userProgress = await UserProgressService.getUserProgress(userId);
          if (userProgress) {
            this.userProgressCache.set(`user_progress_${userId}`, userProgress);
          }
          return { userId, userProgress };
        } catch (error) {
          console.error(`Failed to load user progress for ${userId}:`, error);
          return { userId, userProgress: null };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      for (const { userId, userProgress } of batchResults) {
        results.set(userId, userProgress);
      }
    }

    const cacheHitRate = (userIds.length - uncachedUserIds.length) / userIds.length;
    PerformanceMonitor.endOperation('batchLoadUserData', startTime, cacheHitRate > 0.5, results.size);

    return results;
  }

  /**
   * Preload data for better performance
   */
  static async preloadUserData(userId: string): Promise<void> {
    const startTime = PerformanceMonitor.startOperation('preloadUserData', userId);

    try {
      // Preload user progress, recent analytics, and insights in parallel
      const [userProgress, analyticsData, insights] = await Promise.all([
        this.getUserProgress(userId, true), // Force refresh for preload
        this.getAnalyticsData(userId, { page: 1, pageSize: 10 }, true),
        this.getLearningInsights(userId, false, 5, true)
      ]);

      PerformanceMonitor.endOperation('preloadUserData', startTime, false, 0, userId);
    } catch (error) {
      PerformanceMonitor.endOperation('preloadUserData', startTime, false, 0, userId);
      console.error('Failed to preload user data:', error);
    }
  }

  /**
   * Invalidate cache for a specific user
   */
  static invalidateUserCache(userId: string): void {
    const patterns = [
      `user_progress_${userId}`,
      `analytics_${userId}`,
      `insights_${userId}`
    ];

    // Clear all cache entries matching the patterns
    for (const cache of [this.userProgressCache, this.analyticsDataCache, this.insightsCache]) {
      for (const key of Array.from((cache as any).cache.keys())) {
        if (patterns.some(pattern => key.startsWith(pattern))) {
          cache.delete(key);
        }
      }
    }
  }

  /**
   * Get cache statistics
   */
  static getCacheStats() {
    return {
      userProgress: this.userProgressCache.getStats(),
      analyticsData: this.analyticsDataCache.getStats(),
      insights: this.insightsCache.getStats(),
      leaderboard: this.leaderboardCache.getStats()
    };
  }

  /**
   * Clear all caches
   */
  static clearAllCaches(): void {
    this.userProgressCache.clear();
    this.analyticsDataCache.clear();
    this.insightsCache.clear();
    this.leaderboardCache.clear();
  }
}

/**
 * Database query optimization utilities
 */
export class QueryOptimizer {
  /**
   * Optimize analytics queries with proper indexing hints
   */
  static getOptimizedAnalyticsQuery(userId: string, options: PaginationOptions) {
    // In a real implementation, this would generate optimized Firestore queries
    // with proper composite indexes and query planning
    return {
      collection: 'analyticsData',
      where: [['userId', '==', userId]],
      orderBy: [['timestamp', 'desc']],
      limit: options.pageSize,
      startAfter: options.page > 1 ? (options.page - 1) * options.pageSize : undefined
    };
  }

  /**
   * Optimize leaderboard queries for better performance
   */
  static getOptimizedLeaderboardQuery(competitionId?: string, limit: number = 50) {
    const baseQuery = {
      collection: 'challengeSubmissions',
      orderBy: [['totalScore', 'desc']],
      limit
    };

    if (competitionId) {
      return {
        ...baseQuery,
        where: [['competitionId', '==', competitionId]]
      };
    }

    return baseQuery;
  }

  /**
   * Optimize skill level queries with proper indexing
   */
  static getOptimizedSkillQuery(skillId: string, limit: number = 100) {
    return {
      collection: 'userProgress',
      where: [['skillLevels.' + skillId + '.currentLevel', '>', 0]],
      orderBy: [['skillLevels.' + skillId + '.currentLevel', 'desc']],
      limit
    };
  }
}

/**
 * Real-time data synchronization with performance optimization
 */
export class RealTimeSync {
  private static activeSubscriptions = new Map<string, () => void>();
  private static updateQueue = new Map<string, any[]>();
  private static batchTimeout: NodeJS.Timeout | null = null;

  /**
   * Subscribe to real-time updates with batching
   */
  static subscribeToUpdates(
    userId: string,
    callback: (data: any) => void,
    options: { batchSize?: number; batchDelay?: number } = {}
  ): () => void {
    const { batchSize = 10, batchDelay = 100 } = options;
    const subscriptionKey = `realtime_${userId}`;

    // Unsubscribe existing subscription
    this.unsubscribe(subscriptionKey);

    // Create batched callback
    const batchedCallback = (data: any) => {
      if (!this.updateQueue.has(subscriptionKey)) {
        this.updateQueue.set(subscriptionKey, []);
      }

      const queue = this.updateQueue.get(subscriptionKey)!;
      queue.push(data);

      // Process batch if size limit reached
      if (queue.length >= batchSize) {
        this.processBatch(subscriptionKey, callback);
      } else {
        // Set timeout for batch processing
        if (this.batchTimeout) {
          clearTimeout(this.batchTimeout);
        }
        this.batchTimeout = setTimeout(() => {
          this.processBatch(subscriptionKey, callback);
        }, batchDelay);
      }
    };

    // Store unsubscribe function
    const unsubscribe = () => {
      // Avoid circular reference by directly cleaning up
      this.activeSubscriptions.delete(subscriptionKey);
      this.updateQueue.delete(subscriptionKey);
    };

    this.activeSubscriptions.set(subscriptionKey, unsubscribe);

    return unsubscribe;
  }

  private static processBatch(subscriptionKey: string, callback: (data: any[]) => void): void {
    const queue = this.updateQueue.get(subscriptionKey);
    if (queue && queue.length > 0) {
      callback(queue);
      this.updateQueue.set(subscriptionKey, []);
    }
  }

  private static unsubscribe(subscriptionKey: string): void {
    const unsubscribe = this.activeSubscriptions.get(subscriptionKey);
    if (unsubscribe) {
      unsubscribe();
      this.activeSubscriptions.delete(subscriptionKey);
    }
    this.updateQueue.delete(subscriptionKey);
  }

  /**
   * Clean up all subscriptions
   */
  static cleanup(): void {
    for (const [key, unsubscribe] of this.activeSubscriptions.entries()) {
      unsubscribe();
    }
    this.activeSubscriptions.clear();
    this.updateQueue.clear();
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }
  }
}

/**
 * Performance decorator for automatic monitoring
 */
export function withPerformanceMonitoring(operationName?: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    const opName = operationName || `${target.constructor.name}.${propertyName}`;

    descriptor.value = async function (...args: any[]) {
      const startTime = PerformanceMonitor.startOperation(opName);
      
      try {
        const result = await method.apply(this, args);
        const dataSize = result ? JSON.stringify(result).length : 0;
        PerformanceMonitor.endOperation(opName, startTime, false, dataSize);
        return result;
      } catch (error) {
        PerformanceMonitor.endOperation(opName, startTime, false, 0);
        throw error;
      }
    };

    return descriptor;
  };
}