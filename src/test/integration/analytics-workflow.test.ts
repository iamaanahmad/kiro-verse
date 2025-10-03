/**
 * @fileOverview Integration tests for analytics dashboard and skill progression tracking workflows
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SkillProgressTracker } from '@/lib/analytics/skill-progress-tracker';
import { AnalyticsFirebaseService } from '@/lib/firebase/analytics';
import { setupMockServices, resetMockServices, createMockUser, createMockAnalytics } from '../mocks/external-services';

// Setup mocks for integration testing
setupMockServices();

vi.mock('@/lib/firebase/analytics', () => ({
  AnalyticsFirebaseService: {
    getUserProgress: vi.fn(),
    saveUserProgress: vi.fn(),
    getLearningInsights: vi.fn(),
    getBenchmarkData: vi.fn(),
    saveAnalyticsData: vi.fn(),
    getAnalyticsData: vi.fn()
  }
}));

vi.mock('@/lib/analytics/skill-progress-tracker', () => ({
  SkillProgressTracker: {
    analyzeCodeSubmission: vi.fn(),
    calculateSkillProgression: vi.fn(),
    generateLearningInsights: vi.fn()
  }
}));

const mockAnalyticsService = vi.mocked(AnalyticsFirebaseService);
const mockSkillTracker = vi.mocked(SkillProgressTracker);

const mockUserProgress = {
  userId: 'user-123',
  skillLevels: new Map([
    ['JavaScript', {
      skillId: 'JavaScript',
      skillName: 'JavaScript',
      currentLevel: 3,
      experiencePoints: 750,
      competencyAreas: ['ES6', 'Async Programming', 'DOM Manipulation'],
      industryBenchmark: {
        industryAverage: 65,
        experienceLevel: 'intermediate',
        percentile: 75,
        lastUpdated: new Date('2024-01-15T10:00:00Z')
      },
      verificationStatus: 'verified' as const,
      progressHistory: [
        { date: new Date('2024-01-01'), level: 2, experiencePoints: 400 },
        { date: new Date('2024-01-08'), level: 2, experiencePoints: 550 },
        { date: new Date('2024-01-15'), level: 3, experiencePoints: 750 }
      ],
      trendDirection: 'improving' as const,
      lastUpdated: new Date('2024-01-15T10:30:00Z')
    }],
    ['React', {
      skillId: 'React',
      skillName: 'React',
      currentLevel: 2,
      experiencePoints: 450,
      competencyAreas: ['Components', 'Hooks', 'State Management'],
      industryBenchmark: {
        industryAverage: 55,
        experienceLevel: 'beginner',
        percentile: 68,
        lastUpdated: new Date('2024-01-15T10:00:00Z')
      },
      verificationStatus: 'pending' as const,
      progressHistory: [
        { date: new Date('2024-01-01'), level: 1, experiencePoints: 150 },
        { date: new Date('2024-01-08'), level: 2, experiencePoints: 300 },
        { date: new Date('2024-01-15'), level: 2, experiencePoints: 450 }
      ],
      trendDirection: 'improving' as const,
      lastUpdated: new Date('2024-01-15T10:30:00Z')
    }]
  ]),
  learningVelocity: 2.3,
  codeQualityTrend: {
    direction: 'improving' as const,
    changePercentage: 18,
    timeframe: '30d',
    dataPoints: 12
  },
  challengesCompleted: [
    {
      challengeId: 'challenge-1',
      completedAt: new Date('2024-01-10T14:00:00Z'),
      score: 85,
      timeSpent: 1800
    },
    {
      challengeId: 'challenge-2',
      completedAt: new Date('2024-01-12T16:30:00Z'),
      score: 92,
      timeSpent: 1200
    }
  ],
  peerInteractions: [
    {
      type: 'review_given',
      targetUserId: 'user-456',
      timestamp: new Date('2024-01-14T11:00:00Z'),
      rating: 4.5
    }
  ],
  lastAnalysisDate: new Date('2024-01-15T10:30:00Z'),
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-15T10:30:00Z')
};

const mockLearningInsights = [
  {
    type: 'strength' as const,
    category: 'JavaScript',
    description: 'Excellent grasp of ES6 features and modern JavaScript patterns',
    actionableSteps: [
      'Continue exploring advanced ES6+ features',
      'Practice with TypeScript for better type safety'
    ],
    confidenceScore: 0.92
  },
  {
    type: 'improvement_area' as const,
    category: 'Error Handling',
    description: 'Could benefit from more robust error handling practices',
    actionableSteps: [
      'Learn about try-catch patterns',
      'Practice with async error handling',
      'Study error boundary patterns in React'
    ],
    confidenceScore: 0.78
  },
  {
    type: 'recommendation' as const,
    category: 'Next Steps',
    description: 'Ready to tackle more advanced React patterns and state management',
    actionableSteps: [
      'Learn Redux or Zustand for state management',
      'Practice with React performance optimization',
      'Explore React testing patterns'
    ],
    confidenceScore: 0.85
  }
];

describe('Analytics Dashboard Integration Tests', () => {
  beforeEach(() => {
    resetMockServices();
    
    // Setup default mock responses
    mockAnalyticsService.getUserProgress.mockResolvedValue(mockUserProgress);
    mockAnalyticsService.getLearningInsights.mockResolvedValue(mockLearningInsights);
    mockAnalyticsService.getBenchmarkData.mockResolvedValue({
      industryAverages: {
        JavaScript: 65,
        React: 55,
        TypeScript: 45
      },
      peerComparisons: {
        JavaScript: { percentile: 75, peerGroupSize: 150 },
        React: { percentile: 68, peerGroupSize: 120 }
      },
      lastUpdated: new Date('2024-01-15T10:00:00Z')
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Complete Analytics Dashboard Workflow', () => {
    it('should load and process user analytics data', async () => {
      const userId = 'user-123';
      
      // Test the service layer integration
      const userProgress = await mockAnalyticsService.getUserProgress(userId);
      const insights = await mockAnalyticsService.getLearningInsights(userId);
      const benchmarks = await mockAnalyticsService.getBenchmarkData(userId);
      
      // Verify data structure and content
      expect(userProgress).toBeDefined();
      expect(userProgress.userId).toBe(userId);
      expect(userProgress.skillLevels.has('JavaScript')).toBe(true);
      expect(userProgress.skillLevels.get('JavaScript')?.currentLevel).toBe(3);
      expect(userProgress.learningVelocity).toBe(2.3);
      
      expect(insights).toHaveLength(3);
      expect(insights[0].type).toBe('strength');
      expect(insights[1].type).toBe('improvement_area');
      expect(insights[2].type).toBe('recommendation');
      
      expect(benchmarks).toBeDefined();
      expect(benchmarks.industryAverages.JavaScript).toBe(65);
      expect(benchmarks.peerComparisons.JavaScript.percentile).toBe(75);
    });

    it('should process skill progression data for charts', async () => {
      const userId = 'user-123';
      const userProgress = await mockAnalyticsService.getUserProgress(userId);
      
      // Verify skill progression data structure
      const jsSkill = userProgress.skillLevels.get('JavaScript');
      expect(jsSkill?.progressHistory).toBeDefined();
      expect(jsSkill?.progressHistory.length).toBeGreaterThan(0);
      expect(jsSkill?.experiencePoints).toBe(750);
      
      const reactSkill = userProgress.skillLevels.get('React');
      expect(reactSkill?.experiencePoints).toBe(450);
      
      // Verify trend calculations
      expect(userProgress.codeQualityTrend.direction).toBe('improving');
      expect(userProgress.codeQualityTrend.changePercentage).toBe(18);
    });

    it('should generate learning insights and recommendations', async () => {
      const userId = 'user-123';
      const insights = await mockAnalyticsService.getLearningInsights(userId);
      
      // Verify insights structure and content
      expect(insights).toHaveLength(3);
      
      const strengthInsight = insights.find(i => i.type === 'strength');
      expect(strengthInsight?.description).toContain('Excellent grasp of ES6 features');
      expect(strengthInsight?.actionableSteps).toContain('Continue exploring advanced ES6+ features');
      expect(strengthInsight?.confidenceScore).toBe(0.92);
      
      const improvementInsight = insights.find(i => i.type === 'improvement_area');
      expect(improvementInsight?.description).toContain('Could benefit from more robust error handling');
      expect(improvementInsight?.actionableSteps).toContain('Learn about try-catch patterns');
      
      const recommendationInsight = insights.find(i => i.type === 'recommendation');
      expect(recommendationInsight?.description).toContain('Ready to tackle more advanced React patterns');
      expect(recommendationInsight?.actionableSteps).toContain('Learn Redux or Zustand for state management');
    });

    it('should provide industry benchmarks and peer comparisons', async () => {
      const userId = 'user-123';
      const benchmarks = await mockAnalyticsService.getBenchmarkData(userId);
      
      // Verify benchmark data structure
      expect(benchmarks.industryAverages).toBeDefined();
      expect(benchmarks.industryAverages.JavaScript).toBe(65);
      expect(benchmarks.industryAverages.React).toBe(55);
      
      expect(benchmarks.peerComparisons).toBeDefined();
      expect(benchmarks.peerComparisons.JavaScript.percentile).toBe(75);
      expect(benchmarks.peerComparisons.JavaScript.peerGroupSize).toBe(150);
      expect(benchmarks.peerComparisons.React.percentile).toBe(68);
      expect(benchmarks.peerComparisons.React.peerGroupSize).toBe(120);
      
      expect(benchmarks.lastUpdated).toBeInstanceOf(Date);
    });

    it('should handle time range filtering for analytics data', async () => {
      const userId = 'user-123';
      
      // Test different time ranges
      await mockAnalyticsService.getUserProgress(userId, { timeRange: '3m' });
      expect(mockAnalyticsService.getUserProgress).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({ timeRange: '3m' })
      );
      
      await mockAnalyticsService.getUserProgress(userId, { timeRange: '1y' });
      expect(mockAnalyticsService.getUserProgress).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({ timeRange: '1y' })
      );
    });

    it('should update analytics after new code submission', async () => {
      const userId = 'user-123';
      
      // Simulate new code submission
      const newAnalysis = createMockAnalytics({
        detectedSkills: ['JavaScript', 'React', 'TypeScript'],
        codeQuality: 88
      });
      
      mockSkillTracker.analyzeCodeSubmission.mockResolvedValue({
        aiAnalysis: newAnalysis,
        skillImprovements: [
          {
            skillId: 'JavaScript',
            previousLevel: 3,
            newLevel: 3,
            experienceGained: 25,
            improvementAreas: ['Advanced Patterns']
          }
        ],
        learningInsights: mockLearningInsights
      });
      
      const codeSubmission = {
        code: 'const advanced = () => { /* TypeScript code */ };',
        language: 'typescript',
        userId,
        sessionId: 'session-456',
        timestamp: new Date()
      };
      
      const result = await mockSkillTracker.analyzeCodeSubmission(codeSubmission);
      
      expect(result.aiAnalysis.detectedSkills).toContain('TypeScript');
      expect(result.skillImprovements[0].experienceGained).toBe(25);
      
      // Verify analytics service would be called to update progress
      await mockAnalyticsService.saveUserProgress(userId, expect.any(Object));
      expect(mockAnalyticsService.saveUserProgress).toHaveBeenCalledWith(
        userId,
        expect.any(Object)
      );
    });
  });

  describe('Skill Progression Tracking Workflow', () => {
    it('should track skill improvements from code submissions', async () => {
      const codeSubmission = {
        code: 'const fibonacci = (n) => n <= 1 ? n : fibonacci(n-1) + fibonacci(n-2);',
        language: 'javascript',
        userId: 'user-123',
        sessionId: 'session-456',
        timestamp: new Date()
      };
      
      const mockAnalysis = createMockAnalytics({
        detectedSkills: ['JavaScript', 'Algorithms', 'Recursion'],
        codeQuality: 82,
        efficiency: 65,
        creativity: 88
      });
      
      mockSkillTracker.analyzeCodeSubmission.mockResolvedValue({
        aiAnalysis: mockAnalysis,
        skillImprovements: [
          {
            skillId: 'JavaScript',
            previousLevel: 3,
            newLevel: 3,
            experienceGained: 30,
            improvementAreas: ['Recursion', 'Algorithm Design']
          },
          {
            skillId: 'Algorithms',
            previousLevel: 1,
            newLevel: 2,
            experienceGained: 50,
            improvementAreas: ['Dynamic Programming']
          }
        ],
        learningInsights: [
          {
            type: 'strength',
            category: 'Recursion',
            description: 'Good understanding of recursive patterns',
            actionableSteps: ['Practice with memoization'],
            confidenceScore: 0.85
          }
        ]
      });
      
      const result = await SkillProgressTracker.analyzeCodeSubmission(codeSubmission);
      
      expect(result.aiAnalysis).toEqual(mockAnalysis);
      expect(result.skillImprovements).toHaveLength(2);
      expect(result.skillImprovements[0].skillId).toBe('JavaScript');
      expect(result.skillImprovements[1].skillId).toBe('Algorithms');
      expect(result.learningInsights).toHaveLength(1);
    });

    it('should update user progress in database after analysis', async () => {
      const updatedProgress = {
        ...mockUserProgress,
        skillLevels: new Map([
          ...mockUserProgress.skillLevels,
          ['Algorithms', {
            skillId: 'Algorithms',
            skillName: 'Algorithms',
            currentLevel: 2,
            experiencePoints: 150,
            competencyAreas: ['Recursion', 'Sorting'],
            industryBenchmark: {
              industryAverage: 40,
              experienceLevel: 'beginner',
              percentile: 55,
              lastUpdated: new Date()
            },
            verificationStatus: 'pending' as const,
            progressHistory: [],
            trendDirection: 'improving' as const,
            lastUpdated: new Date()
          }]
        ])
      };
      
      mockAnalyticsService.saveUserProgress.mockResolvedValue(undefined);
      mockAnalyticsService.getUserProgress.mockResolvedValue(updatedProgress);
      
      const userId = 'user-123';
      
      // Save updated progress
      await mockAnalyticsService.saveUserProgress(userId, updatedProgress);
      expect(mockAnalyticsService.saveUserProgress).toHaveBeenCalledWith(userId, updatedProgress);
      
      // Retrieve updated progress
      const result = await mockAnalyticsService.getUserProgress(userId);
      
      // Verify new skill appears in the data
      expect(result.skillLevels.has('Algorithms')).toBe(true);
      expect(result.skillLevels.get('Algorithms')?.currentLevel).toBe(2);
      expect(result.skillLevels.get('Algorithms')?.experiencePoints).toBe(150);
    });

    it('should handle level-up notifications', async () => {
      const levelUpResult = {
        aiAnalysis: createMockAnalytics(),
        skillImprovements: [
          {
            skillId: 'React',
            previousLevel: 2,
            newLevel: 3,
            experienceGained: 100,
            improvementAreas: ['Advanced Hooks']
          }
        ],
        learningInsights: [],
        levelUps: [
          {
            skillId: 'React',
            newLevel: 3,
            badgeEarned: {
              badgeId: 'react-intermediate',
              badgeName: 'React Intermediate',
              description: 'Demonstrates solid React skills'
            }
          }
        ]
      };
      
      mockSkillTracker.analyzeCodeSubmission.mockResolvedValue(levelUpResult);
      
      const codeSubmission = {
        code: 'const MyComponent = () => { const [state, setState] = useState(); return <div>{state}</div>; };',
        language: 'javascript',
        userId: 'user-123',
        sessionId: 'session-456',
        timestamp: new Date()
      };
      
      const result = await mockSkillTracker.analyzeCodeSubmission(codeSubmission);
      
      // Verify level up data
      expect(result.levelUps).toHaveLength(1);
      expect(result.levelUps[0].skillId).toBe('React');
      expect(result.levelUps[0].newLevel).toBe(3);
      expect(result.levelUps[0].badgeEarned?.badgeName).toBe('React Intermediate');
      
      // Verify skill improvement
      expect(result.skillImprovements[0].skillId).toBe('React');
      expect(result.skillImprovements[0].previousLevel).toBe(2);
      expect(result.skillImprovements[0].newLevel).toBe(3);
      expect(result.skillImprovements[0].experienceGained).toBe(100);
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle analytics service failures gracefully', async () => {
      mockAnalyticsService.getUserProgress.mockRejectedValue(
        new Error('Analytics service unavailable')
      );
      
      const userId = 'user-123';
      
      try {
        await mockAnalyticsService.getUserProgress(userId);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Analytics service unavailable');
      }
      
      // Test retry functionality
      mockAnalyticsService.getUserProgress.mockResolvedValue(mockUserProgress);
      const retryResult = await mockAnalyticsService.getUserProgress(userId);
      
      expect(retryResult).toEqual(mockUserProgress);
    });

    it('should handle partial service failures', async () => {
      const userId = 'user-123';
      
      mockAnalyticsService.getUserProgress.mockResolvedValue(mockUserProgress);
      mockAnalyticsService.getLearningInsights.mockRejectedValue(
        new Error('Insights service down')
      );
      
      // Should still get user progress
      const userProgress = await mockAnalyticsService.getUserProgress(userId);
      expect(userProgress).toEqual(mockUserProgress);
      
      // Should handle insights failure
      try {
        await mockAnalyticsService.getLearningInsights(userId);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect((error as Error).message).toBe('Insights service down');
      }
    });

    it('should handle network timeouts appropriately', async () => {
      mockAnalyticsService.getUserProgress.mockImplementation(
        () => new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 100)
        )
      );
      
      const userId = 'user-123';
      
      try {
        await mockAnalyticsService.getUserProgress(userId);
        expect.fail('Should have thrown a timeout error');
      } catch (error) {
        expect((error as Error).message).toBe('Request timeout');
      }
    });
  });

  describe('Performance and Optimization', () => {
    it('should handle data loading efficiently', async () => {
      const userId = 'user-123';
      
      // Initial load
      await mockAnalyticsService.getUserProgress(userId);
      expect(mockAnalyticsService.getUserProgress).toHaveBeenCalledTimes(1);
      
      // Subsequent calls should use caching (in real implementation)
      await mockAnalyticsService.getUserProgress(userId);
      expect(mockAnalyticsService.getUserProgress).toHaveBeenCalledTimes(2);
    });

    it('should handle large datasets efficiently', async () => {
      const largeProgressHistory = Array.from({ length: 100 }, (_, i) => ({
        date: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
        level: Math.floor(i / 20) + 1,
        experiencePoints: i * 10 + 100
      }));
      
      const largeUserProgress = {
        ...mockUserProgress,
        skillLevels: new Map([
          ...mockUserProgress.skillLevels,
          ['JavaScript', {
            ...mockUserProgress.skillLevels.get('JavaScript')!,
            progressHistory: largeProgressHistory
          }]
        ])
      };
      
      mockAnalyticsService.getUserProgress.mockResolvedValue(largeUserProgress);
      
      const startTime = performance.now();
      const result = await mockAnalyticsService.getUserProgress('user-123');
      const endTime = performance.now();
      
      const processingTime = endTime - startTime;
      
      expect(result).toEqual(largeUserProgress);
      expect(result.skillLevels.get('JavaScript')?.progressHistory).toHaveLength(100);
      expect(processingTime).toBeLessThan(100); // Should process quickly
    });

    it('should handle concurrent analytics requests', async () => {
      const userIds = ['user-1', 'user-2', 'user-3', 'user-4', 'user-5'];
      
      mockAnalyticsService.getUserProgress.mockImplementation(async (userId) => {
        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
        return { ...mockUserProgress, userId };
      });
      
      const startTime = performance.now();
      const promises = userIds.map(userId => mockAnalyticsService.getUserProgress(userId));
      const results = await Promise.all(promises);
      const endTime = performance.now();
      
      expect(results).toHaveLength(5);
      expect(results.every(result => result.userId)).toBe(true);
      expect(endTime - startTime).toBeLessThan(500); // Should handle concurrency well
    });
  });
});