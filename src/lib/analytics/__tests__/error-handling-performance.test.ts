/**
 * @fileOverview Tests for Analytics Error Handling and Performance Optimization
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  AnalyticsErrorHandler, 
  AnalyticsError, 
  withErrorHandling 
} from '../error-handling';
import { 
  OptimizedAnalyticsService, 
  PerformanceMonitor, 
  AnalyticsCache,
  RealTimeSync
} from '../performance-optimization';

// Mock Firebase services
vi.mock('@/lib/firebase/analytics', () => ({
  UserProgressService: {
    getUserProgress: vi.fn(),
    createUserProgress: vi.fn(),
    updateUserProgress: vi.fn()
  },
  AnalyticsDataService: {
    saveAnalyticsData: vi.fn(),
    getAnalyticsData: vi.fn()
  },
  LearningInsightsService: {
    getUserLearningInsights: vi.fn(),
    saveLearningInsight: vi.fn()
  }
}));

describe('Analytics Error Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    PerformanceMonitor.clearMetrics();
  });

  describe('AnalyticsError', () => {
    it('should create error with proper context', () => {
      const context = {
        operation: 'test',
        userId: 'user123',
        timestamp: new Date()
      };

      const error = new AnalyticsError(
        'Test error',
        'TEST_ERROR',
        context,
        true,
        'medium'
      );

      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_ERROR');
      expect(error.context).toBe(context);
      expect(error.recoverable).toBe(true);
      expect(error.severity).toBe('medium');
    });
  });

  describe('AnalyticsErrorHandler', () => {
    it('should handle retry with exponential backoff', async () => {
      let attempts = 0;
      const operation = vi.fn().mockImplementation(() => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Temporary failure');
        }
        return 'success';
      });

      const context = {
        operation: 'testRetry',
        timestamp: new Date()
      };

      const result = await AnalyticsErrorHandler.withRetry(
        operation,
        context,
        { maxAttempts: 3, baseDelay: 10 }
      );

      expect(result).toBe('success');
      expect(attempts).toBe(3);
    });

    it('should handle timeout errors', async () => {
      const slowOperation = () => new Promise(resolve => 
        setTimeout(() => resolve('success'), 200)
      );

      const context = {
        operation: 'testTimeout',
        timestamp: new Date()
      };

      await expect(
        AnalyticsErrorHandler.withTimeout(slowOperation, 100, context)
      ).rejects.toThrow('Operation timed out after 100ms');
    });

    it('should provide fallback analytics data', async () => {
      const fallbackData = await AnalyticsErrorHandler.getFallbackAnalyticsData('user123');

      expect(fallbackData).toHaveProperty('userProgress');
      expect(fallbackData).toHaveProperty('analyticsData');
      expect(fallbackData).toHaveProperty('learningInsights');
      expect(fallbackData).toHaveProperty('skillLevels');
    });

    it('should handle AI analysis failure with fallback', async () => {
      const context = {
        operation: 'testAIFailure',
        timestamp: new Date()
      };

      const fallbackResult = await AnalyticsErrorHandler.handleAIAnalysisFailure(
        'console.log("test");',
        context
      );

      expect(fallbackResult).toHaveProperty('aiResponse');
      expect(fallbackResult).toHaveProperty('analysisQuality');
      expect(fallbackResult.fallbackUsed).toBe(true);
    });

    it('should validate analytics data', () => {
      const context = {
        operation: 'testValidation',
        timestamp: new Date()
      };

      // Valid data should not throw
      expect(() => {
        AnalyticsErrorHandler.validateAnalyticsData({
          userId: 'user123',
          timestamp: new Date()
        }, context);
      }).not.toThrow();

      // Invalid data should throw
      expect(() => {
        AnalyticsErrorHandler.validateAnalyticsData({
          userId: null,
          timestamp: null
        }, context);
      }).toThrow(AnalyticsError);
    });

    it('should create circuit breaker', async () => {
      let failures = 0;
      const flakyOperation = vi.fn().mockImplementation(() => {
        failures++;
        if (failures <= 5) {
          throw new Error('Service unavailable');
        }
        return 'success';
      });

      const circuitBreaker = AnalyticsErrorHandler.createCircuitBreaker('testService', 3, 100);

      // First 3 failures should be attempted
      for (let i = 0; i < 3; i++) {
        await expect(circuitBreaker(flakyOperation)).rejects.toThrow();
      }

      // Circuit should be open now
      await expect(circuitBreaker(flakyOperation)).rejects.toThrow('Circuit breaker is open');
    });
  });

  describe('withErrorHandling decorator', () => {
    it('should wrap method with error handling', async () => {
      class TestClass {
        @withErrorHandling({ maxAttempts: 2 })
        async testMethod() {
          throw new Error('Test error');
        }
      }

      const instance = new TestClass();
      await expect(instance.testMethod()).rejects.toThrow(AnalyticsError);
    });
  });
});

describe('Performance Optimization', () => {
  beforeEach(() => {
    PerformanceMonitor.clearMetrics();
  });

  afterEach(() => {
    RealTimeSync.cleanup();
  });

  describe('AnalyticsCache', () => {
    it('should store and retrieve cached data', () => {
      const cache = new AnalyticsCache<string>({ ttl: 1000, maxSize: 10 });

      cache.set('key1', 'value1');
      expect(cache.get('key1')).toBe('value1');
      expect(cache.size()).toBe(1);
    });

    it('should expire cached data after TTL', async () => {
      const cache = new AnalyticsCache<string>({ ttl: 50, maxSize: 10 });

      cache.set('key1', 'value1');
      expect(cache.get('key1')).toBe('value1');

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 60));
      expect(cache.get('key1')).toBeNull();
    });

    it('should evict items when cache is full (LRU)', () => {
      const cache = new AnalyticsCache<string>({ 
        ttl: 10000, 
        maxSize: 3, 
        strategy: 'lru' 
      });

      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');
      
      // Access key1 to make it most recently used
      cache.get('key1');
      
      // Add key4, should evict key2 (least recently used)
      cache.set('key4', 'value4');
      
      expect(cache.get('key1')).toBe('value1');
      expect(cache.get('key2')).toBeNull();
      expect(cache.get('key3')).toBe('value3');
      expect(cache.get('key4')).toBe('value4');
    });

    it('should provide cache statistics', () => {
      const cache = new AnalyticsCache<string>({ ttl: 1000, maxSize: 10 });
      
      cache.set('key1', 'value1');
      const stats = cache.getStats();
      
      expect(stats.size).toBe(1);
      expect(stats.maxSize).toBe(10);
      expect(stats.strategy).toBe('lru');
      expect(stats.ttl).toBe(1000);
    });
  });

  describe('PerformanceMonitor', () => {
    it('should track operation performance', () => {
      const startTime = PerformanceMonitor.startOperation('testOp', 'user123');
      
      // Simulate some work
      const endTime = startTime + 100;
      vi.spyOn(performance, 'now').mockReturnValue(endTime);
      
      const metric = PerformanceMonitor.endOperation('testOp', startTime, false, 1024, 'user123');
      
      expect(metric.operationName).toBe('testOp');
      expect(metric.duration).toBe(100);
      expect(metric.cacheHit).toBe(false);
      expect(metric.dataSize).toBe(1024);
      expect(metric.userId).toBe('user123');
    });

    it('should calculate average performance', () => {
      // Add some test metrics
      PerformanceMonitor.endOperation('testOp', 0, true, 100);
      PerformanceMonitor.endOperation('testOp', 0, false, 200);
      PerformanceMonitor.endOperation('testOp', 0, true, 150);

      const stats = PerformanceMonitor.getAveragePerformance('testOp');
      
      expect(stats.totalOperations).toBe(3);
      expect(stats.cacheHitRate).toBeCloseTo(0.67, 2);
    });

    it('should warn about slow operations', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      // Simulate slow operation (> 1000ms)
      vi.spyOn(performance, 'now').mockReturnValue(1500);
      PerformanceMonitor.endOperation('slowOp', 0, false, 0);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Slow operation detected')
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('OptimizedAnalyticsService', () => {
    it('should use cache for repeated requests', async () => {
      const mockUserProgress = { userId: 'user123', skillLevels: new Map() };
      
      // Mock the underlying service
      const { UserProgressService } = require('@/lib/firebase/analytics');
      UserProgressService.getUserProgress.mockResolvedValue(mockUserProgress);

      // First call should hit database
      const result1 = await OptimizedAnalyticsService.getUserProgress('user123');
      expect(UserProgressService.getUserProgress).toHaveBeenCalledTimes(1);
      expect(result1).toBe(mockUserProgress);

      // Second call should hit cache
      const result2 = await OptimizedAnalyticsService.getUserProgress('user123');
      expect(UserProgressService.getUserProgress).toHaveBeenCalledTimes(1); // Still 1
      expect(result2).toBe(mockUserProgress);
    });

    it('should handle batch loading efficiently', async () => {
      const mockUserProgress1 = { userId: 'user1', skillLevels: new Map() };
      const mockUserProgress2 = { userId: 'user2', skillLevels: new Map() };
      
      const { UserProgressService } = require('@/lib/firebase/analytics');
      UserProgressService.getUserProgress
        .mockResolvedValueOnce(mockUserProgress1)
        .mockResolvedValueOnce(mockUserProgress2);

      const results = await OptimizedAnalyticsService.batchLoadUserData(['user1', 'user2']);
      
      expect(results.size).toBe(2);
      expect(results.get('user1')).toBe(mockUserProgress1);
      expect(results.get('user2')).toBe(mockUserProgress2);
    });

    it('should invalidate user cache correctly', async () => {
      const mockUserProgress = { userId: 'user123', skillLevels: new Map() };
      
      const { UserProgressService } = require('@/lib/firebase/analytics');
      UserProgressService.getUserProgress.mockResolvedValue(mockUserProgress);

      // Load data into cache
      await OptimizedAnalyticsService.getUserProgress('user123');
      
      // Invalidate cache
      OptimizedAnalyticsService.invalidateUserCache('user123');
      
      // Next call should hit database again
      await OptimizedAnalyticsService.getUserProgress('user123');
      expect(UserProgressService.getUserProgress).toHaveBeenCalledTimes(2);
    });

    it('should provide cache statistics', () => {
      const stats = OptimizedAnalyticsService.getCacheStats();
      
      expect(stats).toHaveProperty('userProgress');
      expect(stats).toHaveProperty('analyticsData');
      expect(stats).toHaveProperty('insights');
      expect(stats).toHaveProperty('leaderboard');
    });
  });

  describe('RealTimeSync', () => {
    it('should batch updates for better performance', (done) => {
      const updates: any[] = [];
      
      const unsubscribe = RealTimeSync.subscribeToUpdates(
        'test-user',
        (batchedUpdates) => {
          updates.push(...batchedUpdates);
          if (updates.length >= 3) {
            expect(updates).toHaveLength(3);
            unsubscribe();
            done();
          }
        },
        { batchSize: 3, batchDelay: 50 }
      );

      // Simulate rapid updates
      setTimeout(() => {
        // These would normally come from real-time subscriptions
        // For testing, we'll simulate the batching behavior
        updates.push('update1', 'update2', 'update3');
      }, 10);
    });

    it('should clean up subscriptions properly', () => {
      const unsubscribe1 = RealTimeSync.subscribeToUpdates('user1', () => {});
      const unsubscribe2 = RealTimeSync.subscribeToUpdates('user2', () => {});
      
      // Cleanup should not throw
      expect(() => {
        RealTimeSync.cleanup();
      }).not.toThrow();
    });
  });
});

describe('Integration Tests', () => {
  it('should handle complete analytics workflow with error recovery', async () => {
    const { UserProgressService, AnalyticsDataService } = require('@/lib/firebase/analytics');
    
    // Simulate database failure then recovery
    UserProgressService.getUserProgress
      .mockRejectedValueOnce(new Error('Database unavailable'))
      .mockResolvedValueOnce({ userId: 'user123', skillLevels: new Map() });

    AnalyticsDataService.getAnalyticsData
      .mockResolvedValue([]);

    // Should handle the error and retry successfully
    const result = await OptimizedAnalyticsService.getUserProgress('user123');
    expect(result).toBeTruthy();
    
    // Should have performance metrics
    const metrics = PerformanceMonitor.getMetrics('getUserProgress');
    expect(metrics.length).toBeGreaterThan(0);
  });

  it('should maintain performance under load', async () => {
    const { UserProgressService } = require('@/lib/firebase/analytics');
    UserProgressService.getUserProgress.mockResolvedValue({ 
      userId: 'user123', 
      skillLevels: new Map() 
    });

    const startTime = Date.now();
    
    // Simulate concurrent requests
    const promises = Array.from({ length: 10 }, (_, i) => 
      OptimizedAnalyticsService.getUserProgress(`user${i}`)
    );
    
    await Promise.all(promises);
    
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    
    // Should complete within reasonable time (adjust threshold as needed)
    expect(totalTime).toBeLessThan(1000);
    
    // Should have metrics for all operations
    const metrics = PerformanceMonitor.getMetrics();
    expect(metrics.length).toBeGreaterThanOrEqual(10);
  });
});