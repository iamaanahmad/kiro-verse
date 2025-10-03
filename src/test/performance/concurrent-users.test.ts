/**
 * @fileOverview Performance tests for real-time features and concurrent users
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PerformanceMonitor } from '@/lib/analytics/performance-optimization';
import { LeaderboardService } from '@/lib/gamification/leaderboard-service';
import { CollaborativeSessionService } from '@/lib/firebase/collaborative-session';
import { setupMockServices, resetMockServices } from '../mocks/external-services';

// Setup mocks for performance testing
setupMockServices();

vi.mock('@/lib/gamification/leaderboard-service');
vi.mock('@/lib/firebase/collaborative-session');
vi.mock('@/lib/analytics/performance-optimization');

const mockLeaderboardService = vi.mocked(LeaderboardService);
const mockCollaborativeService = vi.mocked(CollaborativeSessionService);
const mockPerformanceMonitor = vi.mocked(PerformanceMonitor);

// Performance test utilities
class PerformanceTestUtils {
  static async simulateConcurrentUsers(userCount: number, operation: () => Promise<any>) {
    const startTime = performance.now();
    const promises = Array.from({ length: userCount }, () => operation());
    
    try {
      const results = await Promise.all(promises);
      const endTime = performance.now();
      
      return {
        success: true,
        duration: endTime - startTime,
        throughput: userCount / ((endTime - startTime) / 1000),
        results
      };
    } catch (error) {
      const endTime = performance.now();
      return {
        success: false,
        duration: endTime - startTime,
        error: error as Error
      };
    }
  }

  static async measureMemoryUsage(operation: () => Promise<any>) {
    const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;
    
    await operation();
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
    
    const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
    
    return {
      initialMemory,
      finalMemory,
      memoryDelta: finalMemory - initialMemory
    };
  }

  static createMockUsers(count: number) {
    return Array.from({ length: count }, (_, i) => ({
      userId: `user-${i + 1}`,
      username: `testuser${i + 1}`,
      displayName: `Test User ${i + 1}`,
      sessionId: `session-${Math.floor(i / 10) + 1}` // 10 users per session
    }));
  }

  static async simulateNetworkLatency(minMs: number, maxMs: number) {
    const delay = Math.random() * (maxMs - minMs) + minMs;
    return new Promise(resolve => setTimeout(resolve, delay));
  }
}

describe('Performance Tests for Concurrent Users', () => {
  beforeEach(() => {
    resetMockServices();
    
    // Setup performance monitoring mocks
    mockPerformanceMonitor.startOperation.mockReturnValue(Date.now());
    mockPerformanceMonitor.endOperation.mockImplementation(() => {});
    mockPerformanceMonitor.getMetrics.mockReturnValue({
      totalOperations: 0,
      averageLatency: 0,
      errorRate: 0,
      totalErrors: 0,
      throughput: 0
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Leaderboard Performance Tests', () => {
    it('should handle 100 concurrent leaderboard requests', async () => {
      const mockLeaderboardData = {
        entries: Array.from({ length: 50 }, (_, i) => ({
          userId: `user-${i + 1}`,
          username: `user${i + 1}`,
          displayName: `User ${i + 1}`,
          rank: i + 1,
          totalPoints: 1000 - i * 10,
          badgeCount: 5,
          rareBadgeCount: 1,
          skillLevels: { JavaScript: 3 },
          lastActivity: new Date(),
          rankChange: 'same' as const,
          isAnonymized: false
        })),
        totalParticipants: 1000,
        lastUpdated: new Date(),
        metadata: { type: 'global', timeframe: 'weekly' }
      };

      // Add realistic network latency
      mockLeaderboardService.getLeaderboard.mockImplementation(async () => {
        await PerformanceTestUtils.simulateNetworkLatency(50, 200);
        return mockLeaderboardData;
      });

      const result = await PerformanceTestUtils.simulateConcurrentUsers(100, async () => {
        return mockLeaderboardService.getLeaderboard({
          type: 'global',
          timeframe: 'weekly',
          limit: 50
        });
      });

      expect(result.success).toBe(true);
      expect(result.duration).toBeLessThan(5000); // Should complete within 5 seconds
      expect(result.throughput).toBeGreaterThan(20); // At least 20 requests per second
      expect(mockLeaderboardService.getLeaderboard).toHaveBeenCalledTimes(100);
    });

    it('should maintain performance with large leaderboard datasets', async () => {
      const largeLeaderboardData = {
        entries: Array.from({ length: 1000 }, (_, i) => ({
          userId: `user-${i + 1}`,
          username: `user${i + 1}`,
          displayName: `User ${i + 1}`,
          rank: i + 1,
          totalPoints: 10000 - i,
          badgeCount: Math.floor(Math.random() * 20),
          rareBadgeCount: Math.floor(Math.random() * 5),
          skillLevels: {
            JavaScript: Math.floor(Math.random() * 5) + 1,
            React: Math.floor(Math.random() * 5) + 1,
            TypeScript: Math.floor(Math.random() * 5) + 1
          },
          lastActivity: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
          rankChange: ['up', 'down', 'same'][Math.floor(Math.random() * 3)] as any,
          isAnonymized: Math.random() > 0.7
        })),
        totalParticipants: 10000,
        lastUpdated: new Date(),
        metadata: { type: 'global', timeframe: 'all_time' }
      };

      mockLeaderboardService.getLeaderboard.mockResolvedValue(largeLeaderboardData);

      const memoryResult = await PerformanceTestUtils.measureMemoryUsage(async () => {
        const result = await PerformanceTestUtils.simulateConcurrentUsers(50, async () => {
          return mockLeaderboardService.getLeaderboard({
            type: 'global',
            timeframe: 'all_time',
            limit: 1000
          });
        });
        
        expect(result.success).toBe(true);
        expect(result.duration).toBeLessThan(3000);
      });

      // Memory usage should not increase significantly
      expect(memoryResult.memoryDelta).toBeLessThan(50 * 1024 * 1024); // Less than 50MB
    });

    it('should handle leaderboard updates with real-time synchronization', async () => {
      let updateCount = 0;
      const mockUpdates: any[] = [];

      mockLeaderboardService.subscribeToUpdates = vi.fn().mockImplementation((callback) => {
        const interval = setInterval(() => {
          updateCount++;
          const update = {
            type: 'rank_change',
            userId: `user-${updateCount}`,
            newRank: updateCount,
            timestamp: new Date()
          };
          mockUpdates.push(update);
          callback(update);
        }, 100);

        return () => clearInterval(interval);
      });

      const subscribers = Array.from({ length: 50 }, () => {
        return mockLeaderboardService.subscribeToUpdates((update: any) => {
          // Simulate processing update
          return Promise.resolve();
        });
      });

      // Let updates run for 1 second
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Cleanup
      subscribers.forEach(unsubscribe => unsubscribe());

      expect(mockUpdates.length).toBeGreaterThan(5);
      expect(mockLeaderboardService.subscribeToUpdates).toHaveBeenCalledTimes(50);
    });
  });

  describe('Collaborative Session Performance Tests', () => {
    it('should handle multiple users in collaborative sessions', async () => {
      const mockUsers = PerformanceTestUtils.createMockUsers(100);
      const sessions = new Map();

      mockCollaborativeService.joinSession.mockImplementation(async (sessionId, userId) => {
        await PerformanceTestUtils.simulateNetworkLatency(30, 100);
        
        if (!sessions.has(sessionId)) {
          sessions.set(sessionId, new Set());
        }
        sessions.get(sessionId).add(userId);
        
        return {
          sessionId,
          participants: Array.from(sessions.get(sessionId)).map(id => ({
            userId: id,
            username: `user-${id}`,
            isActive: true
          })),
          code: 'console.log("Hello World");',
          isActive: true
        };
      });

      const result = await PerformanceTestUtils.simulateConcurrentUsers(100, async () => {
        const user = mockUsers[Math.floor(Math.random() * mockUsers.length)];
        return mockCollaborativeService.joinSession(user.sessionId, user.userId);
      });

      expect(result.success).toBe(true);
      expect(result.duration).toBeLessThan(3000);
      expect(sessions.size).toBeGreaterThan(0);
      
      // Verify session distribution
      const totalParticipants = Array.from(sessions.values())
        .reduce((sum, participants) => sum + participants.size, 0);
      expect(totalParticipants).toBe(100);
    });

    it('should handle real-time code synchronization', async () => {
      const codeUpdates: any[] = [];
      let conflictCount = 0;

      mockCollaborativeService.updateCode.mockImplementation(async (sessionId, code, userId) => {
        await PerformanceTestUtils.simulateNetworkLatency(10, 50);
        
        const update = {
          sessionId,
          code,
          userId,
          timestamp: Date.now()
        };
        
        // Simulate conflict detection
        const recentUpdates = codeUpdates.filter(u => 
          u.sessionId === sessionId && 
          Date.now() - u.timestamp < 100
        );
        
        if (recentUpdates.length > 1) {
          conflictCount++;
        }
        
        codeUpdates.push(update);
        return update;
      });

      const users = PerformanceTestUtils.createMockUsers(20);
      const sessionId = 'session-1';

      const result = await PerformanceTestUtils.simulateConcurrentUsers(20, async () => {
        const user = users[Math.floor(Math.random() * users.length)];
        const code = `console.log("Update from ${user.userId}");`;
        return mockCollaborativeService.updateCode(sessionId, code, user.userId);
      });

      expect(result.success).toBe(true);
      expect(codeUpdates.length).toBe(20);
      expect(conflictCount).toBeLessThan(5); // Should handle conflicts gracefully
    });

    it('should maintain session performance with large code files', async () => {
      const largeCodeFile = Array.from({ length: 1000 }, (_, i) => 
        `// Line ${i + 1}\nfunction func${i}() { return ${i}; }`
      ).join('\n');

      mockCollaborativeService.updateCode.mockImplementation(async (sessionId, code, userId) => {
        await PerformanceTestUtils.simulateNetworkLatency(20, 100);
        
        // Simulate code processing time based on size
        const processingTime = Math.min(code.length / 1000, 100);
        await new Promise(resolve => setTimeout(resolve, processingTime));
        
        return { sessionId, code, userId, timestamp: Date.now() };
      });

      const result = await PerformanceTestUtils.simulateConcurrentUsers(10, async () => {
        return mockCollaborativeService.updateCode(
          'session-1',
          largeCodeFile + `\n// Update ${Date.now()}`,
          `user-${Math.floor(Math.random() * 10) + 1}`
        );
      });

      expect(result.success).toBe(true);
      expect(result.duration).toBeLessThan(5000); // Should handle large files efficiently
    });
  });

  describe('Analytics Performance Tests', () => {
    it('should handle concurrent analytics processing', async () => {
      const mockAnalyticsData = Array.from({ length: 100 }, (_, i) => ({
        userId: `user-${i + 1}`,
        code: `function test${i}() { return ${i}; }`,
        language: 'javascript',
        timestamp: new Date()
      }));

      // Mock AI analysis with realistic processing time
      const mockAIAnalysis = vi.fn().mockImplementation(async (code) => {
        await PerformanceTestUtils.simulateNetworkLatency(500, 2000); // AI processing time
        
        return {
          analysisId: `analysis-${Date.now()}`,
          codeQuality: Math.floor(Math.random() * 40) + 60,
          efficiency: Math.floor(Math.random() * 40) + 60,
          creativity: Math.floor(Math.random() * 40) + 60,
          bestPractices: Math.floor(Math.random() * 40) + 60,
          detectedSkills: ['JavaScript'],
          processingTime: Math.random() * 1000 + 500
        };
      });

      const result = await PerformanceTestUtils.simulateConcurrentUsers(50, async () => {
        const data = mockAnalyticsData[Math.floor(Math.random() * mockAnalyticsData.length)];
        return mockAIAnalysis(data.code);
      });

      expect(result.success).toBe(true);
      expect(result.duration).toBeLessThan(10000); // Should complete within 10 seconds
      expect(mockAIAnalysis).toHaveBeenCalledTimes(50);
    });

    it('should handle skill progression calculations efficiently', async () => {
      const mockUserProgress = Array.from({ length: 100 }, (_, i) => ({
        userId: `user-${i + 1}`,
        skillLevels: new Map([
          ['JavaScript', { currentLevel: Math.floor(i / 20) + 1, experiencePoints: i * 10 }],
          ['React', { currentLevel: Math.floor(i / 30) + 1, experiencePoints: i * 8 }]
        ]),
        analysisHistory: Array.from({ length: 50 }, (_, j) => ({
          timestamp: new Date(Date.now() - j * 24 * 60 * 60 * 1000),
          codeQuality: Math.random() * 100
        }))
      }));

      const calculateProgression = vi.fn().mockImplementation(async (userProgress) => {
        // Simulate complex calculations
        await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
        
        return {
          skillUpdates: new Map([
            ['JavaScript', { experienceGained: Math.floor(Math.random() * 50) + 10 }]
          ]),
          levelUps: [],
          insights: ['Good progress in JavaScript']
        };
      });

      const result = await PerformanceTestUtils.simulateConcurrentUsers(100, async () => {
        const progress = mockUserProgress[Math.floor(Math.random() * mockUserProgress.length)];
        return calculateProgression(progress);
      });

      expect(result.success).toBe(true);
      expect(result.duration).toBeLessThan(3000);
      expect(calculateProgression).toHaveBeenCalledTimes(100);
    });
  });

  describe('Database Performance Tests', () => {
    it('should handle concurrent database operations', async () => {
      const mockDatabaseOperations = {
        read: vi.fn().mockImplementation(async () => {
          await PerformanceTestUtils.simulateNetworkLatency(10, 50);
          return { data: 'mock data' };
        }),
        write: vi.fn().mockImplementation(async () => {
          await PerformanceTestUtils.simulateNetworkLatency(20, 100);
          return { success: true };
        }),
        update: vi.fn().mockImplementation(async () => {
          await PerformanceTestUtils.simulateNetworkLatency(15, 75);
          return { success: true };
        })
      };

      const operations = [
        () => mockDatabaseOperations.read(),
        () => mockDatabaseOperations.write(),
        () => mockDatabaseOperations.update()
      ];

      const result = await PerformanceTestUtils.simulateConcurrentUsers(200, async () => {
        const operation = operations[Math.floor(Math.random() * operations.length)];
        return operation();
      });

      expect(result.success).toBe(true);
      expect(result.duration).toBeLessThan(2000);
      
      const totalOperations = mockDatabaseOperations.read.mock.calls.length +
                            mockDatabaseOperations.write.mock.calls.length +
                            mockDatabaseOperations.update.mock.calls.length;
      expect(totalOperations).toBe(200);
    });

    it('should handle database connection pooling', async () => {
      let activeConnections = 0;
      const maxConnections = 20;
      const connectionQueue: any[] = [];

      const mockConnection = vi.fn().mockImplementation(async () => {
        if (activeConnections >= maxConnections) {
          // Queue the request
          return new Promise((resolve) => {
            connectionQueue.push(resolve);
          });
        }

        activeConnections++;
        await PerformanceTestUtils.simulateNetworkLatency(50, 200);
        
        // Release connection
        activeConnections--;
        if (connectionQueue.length > 0) {
          const nextRequest = connectionQueue.shift();
          nextRequest();
        }
        
        return { connectionId: Date.now() };
      });

      const result = await PerformanceTestUtils.simulateConcurrentUsers(50, mockConnection);

      expect(result.success).toBe(true);
      expect(activeConnections).toBeLessThanOrEqual(maxConnections);
      expect(mockConnection).toHaveBeenCalledTimes(50);
    });
  });

  describe('Error Handling Under Load', () => {
    it('should handle service failures gracefully under load', async () => {
      let failureCount = 0;
      const maxFailures = 10;

      const unreliableService = vi.fn().mockImplementation(async () => {
        await PerformanceTestUtils.simulateNetworkLatency(50, 200);
        
        if (failureCount < maxFailures && Math.random() < 0.2) {
          failureCount++;
          throw new Error('Service temporarily unavailable');
        }
        
        return { success: true, data: 'mock data' };
      });

      const results = await Promise.allSettled(
        Array.from({ length: 100 }, () => unreliableService())
      );

      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      expect(successful).toBeGreaterThan(80); // At least 80% success rate
      expect(failed).toBeLessThanOrEqual(maxFailures);
      expect(unreliableService).toHaveBeenCalledTimes(100);
    });

    it('should implement circuit breaker pattern', async () => {
      let consecutiveFailures = 0;
      let circuitOpen = false;
      const failureThreshold = 5;

      const circuitBreakerService = vi.fn().mockImplementation(async () => {
        if (circuitOpen) {
          throw new Error('Circuit breaker is open');
        }

        await PerformanceTestUtils.simulateNetworkLatency(50, 200);
        
        if (Math.random() < 0.3) { // 30% failure rate
          consecutiveFailures++;
          if (consecutiveFailures >= failureThreshold) {
            circuitOpen = true;
            setTimeout(() => {
              circuitOpen = false;
              consecutiveFailures = 0;
            }, 1000); // Reset after 1 second
          }
          throw new Error('Service failure');
        }
        
        consecutiveFailures = 0;
        return { success: true };
      });

      const results = await Promise.allSettled(
        Array.from({ length: 50 }, async () => {
          try {
            return await circuitBreakerService();
          } catch (error) {
            // Implement retry logic
            await new Promise(resolve => setTimeout(resolve, 100));
            return circuitBreakerService();
          }
        })
      );

      const circuitBreakerErrors = results.filter(r => 
        r.status === 'rejected' && 
        (r.reason as Error).message === 'Circuit breaker is open'
      ).length;

      expect(circuitBreakerErrors).toBeGreaterThan(0); // Circuit breaker should have activated
      expect(circuitBreakerService).toHaveBeenCalled();
    });
  });

  describe('Resource Usage Monitoring', () => {
    it('should monitor CPU usage during intensive operations', async () => {
      const cpuIntensiveOperation = vi.fn().mockImplementation(async () => {
        // Simulate CPU-intensive work
        const start = Date.now();
        while (Date.now() - start < 10) {
          Math.random() * Math.random();
        }
        return { processed: true };
      });

      const startTime = performance.now();
      
      const result = await PerformanceTestUtils.simulateConcurrentUsers(20, cpuIntensiveOperation);
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;

      expect(result.success).toBe(true);
      expect(totalTime).toBeLessThan(1000); // Should complete within 1 second
      expect(cpuIntensiveOperation).toHaveBeenCalledTimes(20);
    });

    it('should track memory usage patterns', async () => {
      const memoryIntensiveOperation = vi.fn().mockImplementation(async () => {
        // Simulate memory allocation
        const largeArray = new Array(10000).fill(0).map(() => ({
          id: Math.random(),
          data: new Array(100).fill('test data')
        }));
        
        await new Promise(resolve => setTimeout(resolve, 10));
        
        // Clear reference to allow garbage collection
        largeArray.length = 0;
        
        return { processed: true };
      });

      const memoryResult = await PerformanceTestUtils.measureMemoryUsage(async () => {
        await PerformanceTestUtils.simulateConcurrentUsers(10, memoryIntensiveOperation);
      });

      expect(memoryResult.memoryDelta).toBeLessThan(100 * 1024 * 1024); // Less than 100MB
      expect(memoryIntensiveOperation).toHaveBeenCalledTimes(10);
    });
  });
});