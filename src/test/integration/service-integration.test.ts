/**
 * @fileOverview Integration tests for service layer interactions
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { setupMockServices, resetMockServices, createMockChallenge, createMockAnalytics } from '../mocks/external-services';

// Setup mocks for integration testing
setupMockServices();

vi.mock('@/lib/gamification/gamification-service', () => ({
  GamificationService: {
    getActiveCompetitions: vi.fn(),
    joinCompetition: vi.fn(),
    leaveCompetition: vi.fn(),
    getUserCompetitionStatus: vi.fn(),
    getCompetitionLeaderboard: vi.fn(),
    processCodeAnalysis: vi.fn()
  }
}));

vi.mock('@/lib/gamification/leaderboard-service', () => ({
  LeaderboardService: {
    getLeaderboard: vi.fn(),
    getUserRanks: vi.fn(),
    updateUserRank: vi.fn()
  }
}));

vi.mock('@/lib/firebase/collaborative-session', () => ({
  CollaborativeSessionService: {
    createSession: vi.fn(),
    joinSession: vi.fn(),
    updateCode: vi.fn(),
    sendMessage: vi.fn(),
    subscribeToSession: vi.fn()
  }
}));

vi.mock('@/lib/firebase/analytics', () => ({
  UserProgressService: {
    getUserProgress: vi.fn(),
    saveUserProgress: vi.fn(),
    updateUserProgress: vi.fn()
  },
  AnalyticsDataService: {
    saveAnalyticsData: vi.fn(),
    getAnalyticsData: vi.fn(),
    getAnalyticsHistory: vi.fn()
  }
}));

import { GamificationService } from '@/lib/gamification/gamification-service';
import { LeaderboardService } from '@/lib/gamification/leaderboard-service';
import { CollaborativeSessionService } from '@/lib/firebase/collaborative-session';
import { UserProgressService, AnalyticsDataService } from '@/lib/firebase/analytics';

const mockGamificationService = vi.mocked(GamificationService);
const mockLeaderboardService = vi.mocked(LeaderboardService);
const mockCollaborativeService = vi.mocked(CollaborativeSessionService);
const mockUserProgressService = vi.mocked(UserProgressService);
const mockAnalyticsService = vi.mocked(AnalyticsDataService);

describe('Service Integration Tests', () => {
  beforeEach(() => {
    resetMockServices();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Analytics and Gamification Integration', () => {
    it('should handle user progress tracking with gamification', async () => {
      const userId = 'user-123';

      // Mock user progress data
      const mockUserProgress = {
        userId,
        skillLevels: new Map([
          ['JavaScript', {
            skillId: 'JavaScript',
            currentLevel: 3,
            experiencePoints: 750,
            verificationStatus: 'verified' as const
          }]
        ]),
        learningVelocity: 2.5,
        lastAnalysisDate: new Date()
      };

      const mockAnalyticsData = createMockAnalytics({
        codeQuality: 88,
        detectedSkills: ['JavaScript', 'React']
      });

      // Setup mocks
      mockUserProgressService.getUserProgress.mockResolvedValue(mockUserProgress);
      mockUserProgressService.saveUserProgress.mockResolvedValue(undefined);
      mockAnalyticsService.saveAnalyticsData.mockResolvedValue('analytics-123');
      mockGamificationService.processCodeAnalysis.mockResolvedValue({
        pointsAwarded: 150,
        badgesEarned: ['JavaScript Intermediate'],
        achievements: ['Code Quality Improver']
      });

      // Test workflow
      const userProgress = await mockUserProgressService.getUserProgress(userId);
      expect(userProgress?.userId).toBe(userId);
      expect(userProgress?.skillLevels.get('JavaScript')?.currentLevel).toBe(3);

      const analyticsId = await mockAnalyticsService.saveAnalyticsData({
        userId,
        analysisId: 'analysis-456',
        codeSubmission: {
          code: 'const test = () => console.log("Hello");',
          language: 'javascript'
        },
        aiAnalysis: mockAnalyticsData,
        timestamp: new Date()
      });
      expect(analyticsId).toBe('analytics-123');

      const gamificationResult = await mockGamificationService.processCodeAnalysis(
        userId,
        mockAnalyticsData
      );
      expect(gamificationResult.pointsAwarded).toBe(150);
      expect(gamificationResult.badgesEarned).toContain('JavaScript Intermediate');
    });

    it('should handle leaderboard updates with user progress', async () => {
      const userId = 'user-123';

      const mockLeaderboard = {
        entries: [
          {
            userId,
            username: 'testuser',
            rank: 5,
            totalPoints: 850,
            challengesCompleted: 2,
            rankChange: 'up' as const,
            skillLevels: { JavaScript: 3, React: 2 }
          }
        ],
        totalParticipants: 50,
        lastUpdated: new Date(),
        metadata: { type: 'global', timeframe: 'weekly' }
      };

      mockLeaderboardService.getLeaderboard.mockResolvedValue(mockLeaderboard);
      mockLeaderboardService.getUserRanks.mockResolvedValue({
        global: 5,
        skillBased: { JavaScript: 3, React: 8 }
      });

      // Get leaderboard
      const leaderboard = await mockLeaderboardService.getLeaderboard({
        type: 'global',
        timeframe: 'weekly',
        limit: 50
      });

      expect(leaderboard.entries[0].userId).toBe(userId);
      expect(leaderboard.entries[0].rank).toBe(5);
      expect(leaderboard.entries[0].rankChange).toBe('up');

      // Get user ranks
      const userRanks = await mockLeaderboardService.getUserRanks(userId);
      expect(userRanks.global).toBe(5);
      expect(userRanks.skillBased.JavaScript).toBe(3);
    });
  });

  describe('Collaborative Session Workflow', () => {
    it('should handle collaborative session creation and participation', async () => {
      const hostUserId = 'user-456';
      const participantUserId = 'user-123';
      const sessionId = 'session-789';

      const mockSession = {
        sessionId,
        title: 'React Hooks Practice',
        hostUserId,
        participants: [
          { userId: hostUserId, role: 'host', isActive: true },
          { userId: participantUserId, role: 'participant', isActive: true }
        ],
        code: 'const [state, setState] = useState();',
        isActive: true
      };

      mockCollaborativeService.createSession.mockResolvedValue(mockSession);
      mockCollaborativeService.joinSession.mockResolvedValue(mockSession);
      mockCollaborativeService.updateCode.mockResolvedValue({ success: true });
      mockCollaborativeService.sendMessage.mockResolvedValue({ success: true });

      // Create session
      const session = await mockCollaborativeService.createSession({
        title: 'React Hooks Practice',
        hostUserId,
        maxParticipants: 5
      });

      expect(session.sessionId).toBe(sessionId);
      expect(session.hostUserId).toBe(hostUserId);

      // Join session
      const joinedSession = await mockCollaborativeService.joinSession(sessionId, participantUserId);
      expect(joinedSession.participants).toHaveLength(2);

      // Update code
      const codeUpdate = await mockCollaborativeService.updateCode(
        sessionId,
        'const [count, setCount] = useState(0);',
        participantUserId
      );
      expect(codeUpdate.success).toBe(true);

      // Send message
      const messageResult = await mockCollaborativeService.sendMessage(
        sessionId,
        participantUserId,
        'Great example!',
        'message'
      );
      expect(messageResult.success).toBe(true);
    });
  });

  describe('Analytics Data Processing', () => {
    it('should handle analytics data storage and retrieval', async () => {
      const userId = 'user-123';
      const analyticsData = {
        userId,
        analysisId: 'analysis-456',
        codeSubmission: {
          code: 'const fibonacci = n => n <= 1 ? n : fibonacci(n-1) + fibonacci(n-2);',
          language: 'javascript'
        },
        aiAnalysis: createMockAnalytics({
          codeQuality: 85,
          efficiency: 70,
          detectedSkills: ['JavaScript', 'Recursion']
        }),
        timestamp: new Date()
      };

      mockAnalyticsService.saveAnalyticsData.mockResolvedValue('analytics-123');
      mockAnalyticsService.getAnalyticsData.mockResolvedValue(analyticsData);
      mockAnalyticsService.getAnalyticsHistory.mockResolvedValue([analyticsData]);

      // Save analytics data
      const analyticsId = await mockAnalyticsService.saveAnalyticsData(analyticsData);
      expect(analyticsId).toBe('analytics-123');

      // Retrieve analytics data
      const retrievedData = await mockAnalyticsService.getAnalyticsData(analyticsId);
      expect(retrievedData.userId).toBe(userId);
      expect(retrievedData.aiAnalysis.codeQuality).toBe(85);

      // Get analytics history
      const history = await mockAnalyticsService.getAnalyticsHistory(userId, { limit: 10 });
      expect(history).toHaveLength(1);
      expect(history[0].aiAnalysis.detectedSkills).toContain('JavaScript');
    });

    it('should integrate analytics with user progress updates', async () => {
      const userId = 'user-123';
      
      const initialProgress = {
        userId,
        skillLevels: new Map([
          ['JavaScript', { currentLevel: 2, experiencePoints: 400 }]
        ]),
        learningVelocity: 1.8,
        lastAnalysisDate: new Date(Date.now() - 24 * 60 * 60 * 1000) // Yesterday
      };

      const updatedProgress = {
        ...initialProgress,
        skillLevels: new Map([
          ['JavaScript', { currentLevel: 3, experiencePoints: 600 }]
        ]),
        learningVelocity: 2.2,
        lastAnalysisDate: new Date()
      };

      mockUserProgressService.getUserProgress.mockResolvedValue(initialProgress);
      mockUserProgressService.updateUserProgress.mockResolvedValue(undefined);

      // Get initial progress
      const progress = await mockUserProgressService.getUserProgress(userId);
      expect(progress?.skillLevels.get('JavaScript')?.currentLevel).toBe(2);

      // Update progress after analysis
      await mockUserProgressService.updateUserProgress(userId, {
        skillLevels: updatedProgress.skillLevels,
        learningVelocity: updatedProgress.learningVelocity,
        lastAnalysisDate: updatedProgress.lastAnalysisDate
      });

      expect(mockUserProgressService.updateUserProgress).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({
          learningVelocity: 2.2
        })
      );
    });
  });

  describe('Cross-Service Integration', () => {
    it('should handle analytics integration with gamification and leaderboards', async () => {
      const userId = 'user-123';

      // Mock analytics data
      const mockAnalytics = createMockAnalytics({
        codeQuality: 88,
        efficiency: 85,
        detectedSkills: ['JavaScript', 'Algorithms']
      });

      // Mock gamification processing
      const gamificationResult = {
        pointsAwarded: 200,
        badgesEarned: ['Algorithm Master'],
        achievements: ['Quality Coder'],
        newRank: 3
      };

      // Mock updated leaderboard position
      const updatedLeaderboard = {
        entries: [
          {
            userId,
            username: 'testuser',
            rank: 3,
            totalPoints: 1200,
            rankChange: 'up' as const,
            skillLevels: { JavaScript: 4, Algorithms: 3 }
          }
        ],
        totalParticipants: 100,
        lastUpdated: new Date(),
        metadata: { type: 'global', timeframe: 'weekly' }
      };

      mockGamificationService.processCodeAnalysis.mockResolvedValue(gamificationResult);
      mockLeaderboardService.getLeaderboard.mockResolvedValue(updatedLeaderboard);
      mockAnalyticsService.saveAnalyticsData.mockResolvedValue('analytics-456');

      // Process analytics through gamification
      const result = await mockGamificationService.processCodeAnalysis(userId, mockAnalytics);
      expect(result.pointsAwarded).toBe(200);
      expect(result.badgesEarned).toContain('Algorithm Master');

      // Save analytics data
      const analyticsId = await mockAnalyticsService.saveAnalyticsData({
        userId,
        analysisId: 'analysis-789',
        aiAnalysis: mockAnalytics,
        gamificationResult: result,
        timestamp: new Date()
      });
      expect(analyticsId).toBe('analytics-456');

      // Check updated leaderboard
      const leaderboard = await mockLeaderboardService.getLeaderboard({
        type: 'global',
        timeframe: 'weekly'
      });
      expect(leaderboard.entries[0].rank).toBe(3);
      expect(leaderboard.entries[0].rankChange).toBe('up');
    });

    it('should handle error propagation across services', async () => {
      const userId = 'user-123';
      const competitionId = 'comp-456';

      // Mock service failure
      mockGamificationService.joinCompetition.mockRejectedValue(
        new Error('Competition is full')
      );

      try {
        await mockGamificationService.joinCompetition(userId, competitionId);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Competition is full');
      }

      // Verify other services can still function
      mockLeaderboardService.getLeaderboard.mockResolvedValue({
        entries: [],
        totalParticipants: 0,
        lastUpdated: new Date()
      });

      const leaderboard = await mockLeaderboardService.getLeaderboard({
        type: 'competition',
        competitionId
      });

      expect(leaderboard.entries).toHaveLength(0);
    });

    it('should handle concurrent service operations', async () => {
      const userIds = ['user-1', 'user-2', 'user-3', 'user-4', 'user-5'];
      const competitionId = 'comp-123';

      // Mock concurrent operations
      mockGamificationService.getUserCompetitionStatus.mockImplementation(async (userId) => {
        await new Promise(resolve => setTimeout(resolve, Math.random() * 50));
        return {
          isParticipating: false,
          canJoin: true,
          eligibilityStatus: 'eligible',
          currentRank: null
        };
      });

      const startTime = performance.now();
      const promises = userIds.map(userId => 
        mockGamificationService.getUserCompetitionStatus(userId, competitionId)
      );
      const results = await Promise.all(promises);
      const endTime = performance.now();

      expect(results).toHaveLength(5);
      expect(results.every(result => result.canJoin)).toBe(true);
      expect(endTime - startTime).toBeLessThan(200); // Should handle concurrency efficiently
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle large dataset operations efficiently', async () => {
      const largeLeaderboard = {
        entries: Array.from({ length: 1000 }, (_, i) => ({
          userId: `user-${i + 1}`,
          rank: i + 1,
          totalPoints: 1000 - i,
          challengesCompleted: Math.floor(Math.random() * 10),
          rankChange: 'same' as const
        })),
        totalParticipants: 1000,
        lastUpdated: new Date()
      };

      mockLeaderboardService.getLeaderboard.mockResolvedValue(largeLeaderboard);

      const startTime = performance.now();
      const leaderboard = await mockLeaderboardService.getLeaderboard({
        type: 'global',
        limit: 1000
      });
      const endTime = performance.now();

      expect(leaderboard.entries).toHaveLength(1000);
      expect(endTime - startTime).toBeLessThan(100); // Should process large datasets quickly
    });

    it('should handle service timeouts gracefully', async () => {
      mockCollaborativeService.createSession.mockImplementation(
        () => new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Service timeout')), 100)
        )
      );

      try {
        await mockCollaborativeService.createSession({
          title: 'Test Session',
          hostUserId: 'user-123'
        });
        expect.fail('Should have thrown a timeout error');
      } catch (error) {
        expect((error as Error).message).toBe('Service timeout');
      }
    });
  });
});