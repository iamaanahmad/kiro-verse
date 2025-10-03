/**
 * @fileOverview Comprehensive unit tests for analytics system components
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SkillProgressTracker } from '../skill-progress-tracker';
import { PerformanceMonitor, RealTimeSync } from '../performance-optimization';
import { ErrorHandler } from '../error-handling';

// Mock Firebase and external dependencies
vi.mock('@/lib/firebase/analytics', () => ({
  AnalyticsFirebaseService: {
    saveUserProgress: vi.fn(),
    getUserProgress: vi.fn(),
    saveAnalyticsData: vi.fn(),
    getAnalyticsData: vi.fn()
  }
}));

vi.mock('@/ai/flows/get-code-feedback', () => ({
  getCodeFeedback: vi.fn()
}));

const mockCodeSubmission = {
  code: 'function fibonacci(n) { return n <= 1 ? n : fibonacci(n-1) + fibonacci(n-2); }',
  language: 'javascript',
  userId: 'user-123',
  sessionId: 'session-456',
  timestamp: new Date('2024-01-15T10:30:00Z')
};

const mockAIAnalysis = {
  analysisId: 'analysis-789',
  codeQuality: 75,
  efficiency: 60,
  creativity: 85,
  bestPractices: 70,
  suggestions: ['Consider using memoization for better performance'],
  detectedSkills: ['JavaScript', 'Recursion', 'Algorithms'],
  improvementAreas: ['Performance Optimization', 'Memory Usage'],
  processingTime: 1500
};

describe('Analytics System Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('SkillProgressTracker', () => {
    it('should analyze code submission and track skill improvements', async () => {
      vi.mocked(require('@/ai/flows/get-code-feedback').getCodeFeedback)
        .mockResolvedValue(mockAIAnalysis);

      const result = await SkillProgressTracker.analyzeCodeSubmission(mockCodeSubmission);

      expect(result.aiAnalysis).toEqual(mockAIAnalysis);
      expect(result.skillImprovements).toBeDefined();
      expect(result.skillImprovements.length).toBeGreaterThan(0);
      expect(result.learningInsights).toBeDefined();
    });

    it('should calculate skill level progression correctly', async () => {
      const previousProgress = {
        userId: 'user-123',
        skillLevels: new Map([
          ['JavaScript', {
            skillId: 'JavaScript',
            skillName: 'JavaScript',
            currentLevel: 2,
            experiencePoints: 450,
            competencyAreas: [],
            industryBenchmark: {
              industryAverage: 50,
              experienceLevel: 'beginner',
              percentile: 60,
              lastUpdated: new Date()
            },
            verificationStatus: 'pending',
            progressHistory: [],
            trendDirection: 'improving',
            lastUpdated: new Date()
          }]
        ]),
        learningVelocity: 1.5,
        codeQualityTrend: {
          direction: 'improving',
          changePercentage: 10,
          timeframe: '30d',
          dataPoints: 5
        },
        challengesCompleted: [],
        peerInteractions: [],
        lastAnalysisDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const progression = SkillProgressTracker.calculateSkillProgression(
        mockAIAnalysis,
        previousProgress
      );

      expect(progression.skillUpdates).toBeDefined();
      expect(progression.skillUpdates.size).toBeGreaterThan(0);
      expect(progression.experienceGained).toBeGreaterThan(0);
      expect(progression.levelUps).toBeDefined();
    });

    it('should generate learning insights based on analysis', () => {
      const insights = SkillProgressTracker.generateLearningInsights(
        mockAIAnalysis,
        mockCodeSubmission
      );

      expect(insights).toHaveLength(3); // Should generate multiple insights
      expect(insights[0].type).toMatch(/strength|improvement_area|recommendation/);
      expect(insights[0].description).toBeDefined();
      expect(insights[0].actionableSteps).toBeDefined();
      expect(insights[0].confidenceScore).toBeGreaterThan(0);
    });

    it('should handle edge cases in skill detection', async () => {
      const emptyCodeSubmission = {
        ...mockCodeSubmission,
        code: ''
      };

      const emptyAnalysis = {
        ...mockAIAnalysis,
        detectedSkills: [],
        codeQuality: 0
      };

      vi.mocked(require('@/ai/flows/get-code-feedback').getCodeFeedback)
        .mockResolvedValue(emptyAnalysis);

      const result = await SkillProgressTracker.analyzeCodeSubmission(emptyCodeSubmission);

      expect(result.aiAnalysis).toEqual(emptyAnalysis);
      expect(result.skillImprovements).toHaveLength(0);
    });
  });

  describe('PerformanceMonitor', () => {
    it('should track operation performance metrics', () => {
      const startTime = PerformanceMonitor.startOperation('testOperation', 'user-123');
      
      expect(startTime).toBeTypeOf('number');
      expect(startTime).toBeGreaterThan(0);
    });

    it('should end operation and calculate metrics', () => {
      const startTime = Date.now() - 1000; // 1 second ago
      
      PerformanceMonitor.endOperation('testOperation', startTime, false, 1024, 'user-123');
      
      const metrics = PerformanceMonitor.getMetrics('testOperation');
      
      expect(metrics.totalOperations).toBe(1);
      expect(metrics.averageLatency).toBeGreaterThan(0);
      expect(metrics.errorRate).toBe(0);
    });

    it('should track errors correctly', () => {
      const startTime = Date.now() - 500;
      
      PerformanceMonitor.endOperation('testOperation', startTime, true, 0, 'user-123');
      
      const metrics = PerformanceMonitor.getMetrics('testOperation');
      
      expect(metrics.errorRate).toBeGreaterThan(0);
      expect(metrics.totalErrors).toBe(1);
    });

    it('should provide performance insights', () => {
      // Generate some test data
      for (let i = 0; i < 10; i++) {
        const startTime = Date.now() - Math.random() * 1000;
        PerformanceMonitor.endOperation('testOperation', startTime, i % 3 === 0, 1024, 'user-123');
      }
      
      const insights = PerformanceMonitor.getPerformanceInsights();
      
      expect(insights.slowOperations).toBeDefined();
      expect(insights.errorProneOperations).toBeDefined();
      expect(insights.recommendations).toBeDefined();
      expect(insights.recommendations.length).toBeGreaterThan(0);
    });

    it('should handle concurrent operations', () => {
      const operations = [];
      
      // Start multiple operations
      for (let i = 0; i < 5; i++) {
        operations.push(PerformanceMonitor.startOperation(`operation${i}`, 'user-123'));
      }
      
      // End them with different results
      operations.forEach((startTime, index) => {
        PerformanceMonitor.endOperation(`operation${index}`, startTime, false, 512, 'user-123');
      });
      
      // Check that all operations were tracked
      for (let i = 0; i < 5; i++) {
        const metrics = PerformanceMonitor.getMetrics(`operation${i}`);
        expect(metrics.totalOperations).toBe(1);
      }
    });
  });

  describe('RealTimeSync', () => {
    it('should subscribe to updates with callback', () => {
      const callback = vi.fn();
      const options = { batchSize: 5, batchDelay: 1000 };
      
      const unsubscribe = RealTimeSync.subscribeToUpdates('test-key', callback, options);
      
      expect(typeof unsubscribe).toBe('function');
    });

    it('should batch updates correctly', async () => {
      const callback = vi.fn();
      const updates: any[] = [];
      
      RealTimeSync.subscribeToUpdates('test-key', callback, { batchSize: 3, batchDelay: 100 });
      
      // Simulate multiple updates
      for (let i = 0; i < 5; i++) {
        RealTimeSync.pushUpdate('test-key', { type: 'update', data: i });
      }
      
      // Wait for batch processing
      await new Promise(resolve => setTimeout(resolve, 150));
      
      expect(callback).toHaveBeenCalled();
    });

    it('should handle subscription cleanup', () => {
      const callback = vi.fn();
      
      const unsubscribe = RealTimeSync.subscribeToUpdates('test-key', callback);
      
      // Should not throw when unsubscribing
      expect(() => unsubscribe()).not.toThrow();
    });

    it('should manage multiple subscriptions', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      
      const unsubscribe1 = RealTimeSync.subscribeToUpdates('key1', callback1);
      const unsubscribe2 = RealTimeSync.subscribeToUpdates('key2', callback2);
      
      RealTimeSync.pushUpdate('key1', { type: 'test' });
      RealTimeSync.pushUpdate('key2', { type: 'test' });
      
      // Cleanup
      unsubscribe1();
      unsubscribe2();
    });
  });

  describe('ErrorHandler', () => {
    it('should handle analytics processing errors gracefully', () => {
      const error = new Error('Analytics processing failed');
      const context = { userId: 'user-123', operation: 'skillAnalysis' };
      
      const result = ErrorHandler.handleAnalyticsError(error, context);
      
      expect(result.handled).toBe(true);
      expect(result.fallbackData).toBeDefined();
      expect(result.retryable).toBeDefined();
    });

    it('should provide fallback data for failed operations', () => {
      const fallbackData = ErrorHandler.getFallbackAnalyticsData('user-123');
      
      expect(fallbackData.userProgress).toBeDefined();
      expect(fallbackData.skillLevels).toBeDefined();
      expect(fallbackData.learningInsights).toBeDefined();
    });

    it('should implement retry logic for transient errors', async () => {
      let attempts = 0;
      const operation = vi.fn().mockImplementation(() => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Transient error');
        }
        return { success: true };
      });
      
      const result = await ErrorHandler.retryOperation(operation, 3, 100);
      
      expect(result.success).toBe(true);
      expect(attempts).toBe(3);
    });

    it('should categorize errors correctly', () => {
      const networkError = new Error('Network timeout');
      const validationError = new Error('Invalid input data');
      const systemError = new Error('System overload');
      
      expect(ErrorHandler.categorizeError(networkError)).toBe('network');
      expect(ErrorHandler.categorizeError(validationError)).toBe('validation');
      expect(ErrorHandler.categorizeError(systemError)).toBe('system');
    });

    it('should log errors with appropriate severity', () => {
      const logSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      ErrorHandler.logError(new Error('Test error'), 'high', { userId: 'user-123' });
      
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('Test error'),
        expect.objectContaining({ severity: 'high' })
      );
      
      logSpy.mockRestore();
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complete analytics workflow', async () => {
      // Mock successful AI analysis
      vi.mocked(require('@/ai/flows/get-code-feedback').getCodeFeedback)
        .mockResolvedValue(mockAIAnalysis);
      
      // Mock Firebase operations
      vi.mocked(require('@/lib/firebase/analytics').AnalyticsFirebaseService.saveUserProgress)
        .mockResolvedValue(undefined);
      
      const startTime = PerformanceMonitor.startOperation('fullAnalysis', 'user-123');
      
      try {
        const result = await SkillProgressTracker.analyzeCodeSubmission(mockCodeSubmission);
        
        expect(result.aiAnalysis).toBeDefined();
        expect(result.skillImprovements).toBeDefined();
        expect(result.learningInsights).toBeDefined();
        
        PerformanceMonitor.endOperation('fullAnalysis', startTime, false, 2048, 'user-123');
      } catch (error) {
        PerformanceMonitor.endOperation('fullAnalysis', startTime, true, 0, 'user-123');
        throw error;
      }
      
      const metrics = PerformanceMonitor.getMetrics('fullAnalysis');
      expect(metrics.totalOperations).toBe(1);
      expect(metrics.errorRate).toBe(0);
    });

    it('should handle analytics failure with graceful degradation', async () => {
      // Mock AI analysis failure
      vi.mocked(require('@/ai/flows/get-code-feedback').getCodeFeedback)
        .mockRejectedValue(new Error('AI service unavailable'));
      
      const startTime = PerformanceMonitor.startOperation('failedAnalysis', 'user-123');
      
      try {
        await SkillProgressTracker.analyzeCodeSubmission(mockCodeSubmission);
      } catch (error) {
        const handled = ErrorHandler.handleAnalyticsError(error as Error, {
          userId: 'user-123',
          operation: 'codeAnalysis'
        });
        
        expect(handled.handled).toBe(true);
        expect(handled.fallbackData).toBeDefined();
        
        PerformanceMonitor.endOperation('failedAnalysis', startTime, true, 0, 'user-123');
      }
      
      const metrics = PerformanceMonitor.getMetrics('failedAnalysis');
      expect(metrics.errorRate).toBeGreaterThan(0);
    });

    it('should maintain data consistency across components', async () => {
      const userId = 'user-123';
      const sessionId = 'session-456';
      
      // Simulate multiple analytics operations
      const operations = [
        SkillProgressTracker.analyzeCodeSubmission({
          ...mockCodeSubmission,
          code: 'console.log("Hello World");'
        }),
        SkillProgressTracker.analyzeCodeSubmission({
          ...mockCodeSubmission,
          code: 'function add(a, b) { return a + b; }'
        })
      ];
      
      vi.mocked(require('@/ai/flows/get-code-feedback').getCodeFeedback)
        .mockResolvedValue(mockAIAnalysis);
      
      const results = await Promise.all(operations);
      
      // Verify that all operations completed successfully
      results.forEach(result => {
        expect(result.aiAnalysis).toBeDefined();
        expect(result.skillImprovements).toBeDefined();
      });
      
      // Verify performance tracking
      const insights = PerformanceMonitor.getPerformanceInsights();
      expect(insights.recommendations).toBeDefined();
    });
  });
});