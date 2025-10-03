/**
 * @fileOverview Unit tests for GamificationService
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GamificationService } from '../gamification-service';
import { UserProgress, Challenge, ChallengeSubmission } from '@/types/analytics';
import { UserProgressService } from '@/lib/firebase/analytics';

// Mock the dependencies
vi.mock('@/lib/firebase/analytics');
vi.mock('@/ai/flows/award-skill-badge');

const mockUserProgressService = UserProgressService as any;

describe('GamificationService', () => {
  const mockUserProgress: UserProgress = {
    userId: 'test-user',
    skillLevels: new Map([
      ['JavaScript', {
        skillId: 'JavaScript',
        skillName: 'JavaScript',
        currentLevel: 2,
        experiencePoints: 300,
        competencyAreas: [],
        industryBenchmark: {
          industryAverage: 50,
          experienceLevel: 'intermediate',
          percentile: 65,
          lastUpdated: new Date()
        },
        verificationStatus: 'verified',
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

  const mockChallenge: Challenge = {
    challengeId: 'test-challenge',
    title: 'Array Sorting Challenge',
    description: 'Implement efficient sorting algorithm',
    difficulty: 'intermediate',
    skillsTargeted: ['algorithms', 'javascript'],
    timeLimit: 30,
    evaluationCriteria: [],
    createdBy: 'ai',
    isActive: true,
    prompt: 'Sort the array efficiently',
    testCases: [],
    hints: [],
    tags: ['sorting', 'algorithms'],
    category: 'algorithms',
    estimatedDuration: 25,
    prerequisites: [],
    learningObjectives: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    participantCount: 150,
    averageScore: 72,
    successRate: 0.78
  };

  const mockSubmission: ChallengeSubmission = {
    submissionId: 'test-submission',
    challengeId: 'test-challenge',
    userId: 'test-user',
    code: 'function quickSort(arr) { /* implementation */ }',
    language: 'javascript',
    submittedAt: new Date(),
    evaluationResults: [],
    totalScore: 85,
    passed: true,
    feedback: ['Good algorithm choice', 'Clean implementation'],
    aiAnalysis: {
      analysisId: 'test-analysis',
      codeQuality: 80,
      efficiency: 85,
      creativity: 75,
      bestPractices: 82,
      suggestions: ['Add input validation'],
      detectedSkills: ['JavaScript', 'algorithms'],
      improvementAreas: ['Edge case handling'],
      processingTime: 1200
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUserProgressService.getUserProgress = vi.fn().mockResolvedValue(mockUserProgress);
  });

  describe('processCodeAnalysisGamification', () => {
    it('should process code analysis gamification successfully', async () => {
      const params = {
        userId: 'test-user',
        code: 'function hello() { console.log("Hello World"); }',
        context: 'Basic JavaScript function',
        difficulty: 'beginner' as const,
        enableBlockchainVerification: false
      };

      const result = await GamificationService.processCodeAnalysisGamification(params);

      expect(result).toBeDefined();
      expect(result.pointsEarned).toBeDefined();
      expect(result.pointsEarned.totalPoints).toBeGreaterThan(0);
      expect(result.badgesAwarded).toBeDefined();
      expect(Array.isArray(result.badgesAwarded)).toBe(true);
      expect(result.achievementsUnlocked).toBeDefined();
      expect(result.newMilestones).toBeDefined();
      expect(result.totalPoints).toBeGreaterThan(0);
    });

    it('should handle different difficulty levels', async () => {
      const beginnerParams = {
        userId: 'test-user',
        code: 'let x = 5;',
        difficulty: 'beginner' as const
      };

      const expertParams = {
        userId: 'test-user',
        code: 'class AdvancedDataStructure { /* complex implementation */ }',
        difficulty: 'expert' as const
      };

      const beginnerResult = await GamificationService.processCodeAnalysisGamification(beginnerParams);
      const expertResult = await GamificationService.processCodeAnalysisGamification(expertParams);

      expect(expertResult.pointsEarned.totalPoints).toBeGreaterThan(beginnerResult.pointsEarned.totalPoints);
    });

    it('should throw error when user progress not found', async () => {
      mockUserProgressService.getUserProgress = vi.fn().mockResolvedValue(null);

      const params = {
        userId: 'non-existent-user',
        code: 'console.log("test");'
      };

      await expect(GamificationService.processCodeAnalysisGamification(params))
        .rejects.toThrow('User progress not found');
    });

    it('should include rank change information', async () => {
      const params = {
        userId: 'test-user',
        code: 'function fibonacci(n) { /* implementation */ }'
      };

      const result = await GamificationService.processCodeAnalysisGamification(params);

      expect(result.rankChange).toBeDefined();
      expect(result.rankChange!.previousRank).toBeGreaterThan(0);
      expect(result.rankChange!.newRank).toBeGreaterThan(0);
      expect(['up', 'down', 'same']).toContain(result.rankChange!.direction);
    });
  });

  describe('processChallengeCompletionGamification', () => {
    it('should process challenge completion successfully', async () => {
      const params = {
        userId: 'test-user',
        challenge: mockChallenge,
        submission: mockSubmission,
        completionTime: 1200, // 20 minutes
        enableBlockchainVerification: false
      };

      const result = await GamificationService.processChallengeCompletionGamification(params);

      expect(result).toBeDefined();
      expect(result.pointsEarned.totalPoints).toBeGreaterThan(0);
      expect(result.badgesAwarded).toBeDefined();
      expect(result.totalPoints).toBeGreaterThan(0);
    });

    it('should award speed bonus for fast completion', async () => {
      const fastParams = {
        userId: 'test-user',
        challenge: mockChallenge,
        submission: mockSubmission,
        completionTime: 600 // 10 minutes (fast)
      };

      const slowParams = {
        userId: 'test-user',
        challenge: mockChallenge,
        submission: mockSubmission,
        completionTime: 1800 // 30 minutes (full time)
      };

      const fastResult = await GamificationService.processChallengeCompletionGamification(fastParams);
      const slowResult = await GamificationService.processChallengeCompletionGamification(slowParams);

      // Fast completion should have speed bonus
      const fastSpeedBonus = fastResult.pointsEarned.breakdown.find(
        item => item.category === 'Speed Bonus'
      );
      const slowSpeedBonus = slowResult.pointsEarned.breakdown.find(
        item => item.category === 'Speed Bonus'
      );

      expect(fastSpeedBonus).toBeDefined();
      expect(slowSpeedBonus).toBeUndefined();
    });

    it('should award perfect score bonus', async () => {
      const perfectSubmission = {
        ...mockSubmission,
        totalScore: 100
      };

      const params = {
        userId: 'test-user',
        challenge: mockChallenge,
        submission: perfectSubmission
      };

      const result = await GamificationService.processChallengeCompletionGamification(params);

      const perfectBonus = result.pointsEarned.breakdown.find(
        item => item.category === 'Perfect Score Bonus'
      );

      expect(perfectBonus).toBeDefined();
      expect(perfectBonus!.points).toBeGreaterThan(0);
    });
  });

  describe('processPeerReviewGamification', () => {
    it('should process peer review gamification successfully', async () => {
      const params = {
        userId: 'test-user',
        reviewQuality: 4,
        reviewLength: 250,
        helpfulness: 5,
        isFirstReview: true
      };

      const result = await GamificationService.processPeerReviewGamification(params);

      expect(result).toBeDefined();
      expect(result.pointsEarned.totalPoints).toBeGreaterThan(0);
      expect(result.pointsEarned.basePoints).toBe(20); // Base peer review points
    });

    it('should award first review bonus', async () => {
      const firstReviewParams = {
        userId: 'test-user',
        reviewQuality: 3,
        reviewLength: 150,
        helpfulness: 4,
        isFirstReview: true
      };

      const regularReviewParams = {
        ...firstReviewParams,
        isFirstReview: false
      };

      const firstResult = await GamificationService.processPeerReviewGamification(firstReviewParams);
      const regularResult = await GamificationService.processPeerReviewGamification(regularReviewParams);

      expect(firstResult.pointsEarned.totalPoints).toBeGreaterThan(regularResult.pointsEarned.totalPoints);

      const firstReviewBonus = firstResult.pointsEarned.breakdown.find(
        item => item.category === 'First Review Bonus'
      );
      expect(firstReviewBonus).toBeDefined();
    });

    it('should scale points with review quality', async () => {
      const lowQualityParams = {
        userId: 'test-user',
        reviewQuality: 1,
        reviewLength: 50,
        helpfulness: 2
      };

      const highQualityParams = {
        userId: 'test-user',
        reviewQuality: 5,
        reviewLength: 300,
        helpfulness: 5
      };

      const lowResult = await GamificationService.processPeerReviewGamification(lowQualityParams);
      const highResult = await GamificationService.processPeerReviewGamification(highQualityParams);

      expect(highResult.pointsEarned.totalPoints).toBeGreaterThan(lowResult.pointsEarned.totalPoints);
    });
  });

  describe('processCommunityContributionGamification', () => {
    it('should process community contribution successfully', async () => {
      const params = {
        userId: 'test-user',
        contributionType: 'bug_report' as const,
        impact: 'high' as const,
        communityVotes: 15,
        isAccepted: true
      };

      const result = await GamificationService.processCommunityContributionGamification(params);

      expect(result).toBeDefined();
      expect(result.pointsEarned.totalPoints).toBeGreaterThan(0);
      expect(result.badgesAwarded).toHaveLength(1);
      expect(result.badgesAwarded[0].badgeName).toContain('Bug Hunter');
    });

    it('should apply impact multipliers correctly', async () => {
      const lowImpactParams = {
        userId: 'test-user',
        contributionType: 'feature_suggestion' as const,
        impact: 'low' as const,
        communityVotes: 2,
        isAccepted: false
      };

      const highImpactParams = {
        ...lowImpactParams,
        impact: 'high' as const,
        communityVotes: 20,
        isAccepted: true
      };

      const lowResult = await GamificationService.processCommunityContributionGamification(lowImpactParams);
      const highResult = await GamificationService.processCommunityContributionGamification(highImpactParams);

      expect(highResult.pointsEarned.totalPoints).toBeGreaterThan(lowResult.pointsEarned.totalPoints);
    });

    it('should create appropriate community badges', async () => {
      const mentorshipParams = {
        userId: 'test-user',
        contributionType: 'mentorship' as const,
        impact: 'medium' as const,
        communityVotes: 8,
        isAccepted: true
      };

      const result = await GamificationService.processCommunityContributionGamification(mentorshipParams);

      expect(result.badgesAwarded[0].badgeName).toContain('Mentor');
      expect(result.badgesAwarded[0].badgeType.category).toBe('community');
    });
  });

  describe('processStreakBonus', () => {
    it('should calculate streak bonuses correctly', async () => {
      const result = await GamificationService.processStreakBonus('test-user', 'daily_coding', 15);

      expect(result.totalPoints).toBeGreaterThan(0);
      expect(result.basePoints).toBe(30); // 15 days * 2 points
      expect(result.breakdown.length).toBeGreaterThan(1);
    });

    it('should award milestone bonuses for long streaks', async () => {
      const result = await GamificationService.processStreakBonus('test-user', 'challenge_completion', 30);

      const milestoneBonus = result.breakdown.find(item => item.category.includes('Milestone'));
      expect(milestoneBonus).toBeDefined();
    });

    it('should handle different streak types', async () => {
      const codingStreak = await GamificationService.processStreakBonus('test-user', 'daily_coding', 10);
      const reviewStreak = await GamificationService.processStreakBonus('test-user', 'peer_review', 10);
      const challengeStreak = await GamificationService.processStreakBonus('test-user', 'challenge_completion', 10);

      expect(codingStreak.totalPoints).toBeGreaterThan(0);
      expect(reviewStreak.totalPoints).toBeGreaterThan(0);
      expect(challengeStreak.totalPoints).toBeGreaterThan(0);
    });
  });

  describe('getUserGamificationStatus', () => {
    it('should return complete gamification status', async () => {
      const status = await GamificationService.getUserGamificationStatus('test-user');

      expect(status).toBeDefined();
      expect(status.totalPoints).toBeGreaterThan(0);
      expect(status.badgeCount).toBeGreaterThanOrEqual(0);
      expect(status.rareBadgeCount).toBeGreaterThanOrEqual(0);
      expect(status.currentRank).toBeGreaterThan(0);
      expect(status.achievementsCompleted).toBeGreaterThanOrEqual(0);
      expect(status.currentStreaks).toBeDefined();
      expect(status.nextMilestones).toBeDefined();
      expect(Array.isArray(status.nextMilestones)).toBe(true);
    });

    it('should throw error for non-existent user', async () => {
      mockUserProgressService.getUserProgress = vi.fn().mockResolvedValue(null);

      await expect(GamificationService.getUserGamificationStatus('non-existent-user'))
        .rejects.toThrow('User progress not found');
    });

    it('should include current streaks information', async () => {
      const status = await GamificationService.getUserGamificationStatus('test-user');

      expect(status.currentStreaks).toHaveProperty('daily_coding');
      expect(status.currentStreaks).toHaveProperty('challenge_completion');
      expect(status.currentStreaks).toHaveProperty('peer_review');
      expect(typeof status.currentStreaks.daily_coding).toBe('number');
    });

    it('should include next milestones', async () => {
      const status = await GamificationService.getUserGamificationStatus('test-user');

      expect(status.nextMilestones.length).toBeGreaterThan(0);
      expect(status.nextMilestones.every(milestone => typeof milestone === 'string')).toBe(true);
    });
  });

  describe('Error handling and edge cases', () => {
    it('should handle service errors gracefully', async () => {
      mockUserProgressService.getUserProgress = vi.fn().mockRejectedValue(new Error('Database error'));

      const params = {
        userId: 'test-user',
        code: 'console.log("test");'
      };

      await expect(GamificationService.processCodeAnalysisGamification(params))
        .rejects.toThrow('Database error');
    });

    it('should handle missing optional parameters', async () => {
      const minimalParams = {
        userId: 'test-user',
        code: 'let x = 1;'
      };

      const result = await GamificationService.processCodeAnalysisGamification(minimalParams);

      expect(result).toBeDefined();
      expect(result.pointsEarned.totalPoints).toBeGreaterThan(0);
    });

    it('should handle zero completion time', async () => {
      const params = {
        userId: 'test-user',
        challenge: mockChallenge,
        submission: mockSubmission,
        completionTime: 0
      };

      const result = await GamificationService.processChallengeCompletionGamification(params);

      expect(result).toBeDefined();
      expect(result.pointsEarned.totalPoints).toBeGreaterThan(0);
    });

    it('should handle empty user progress', async () => {
      const emptyProgress: UserProgress = {
        ...mockUserProgress,
        skillLevels: new Map(),
        challengesCompleted: [],
        peerInteractions: []
      };

      mockUserProgressService.getUserProgress = vi.fn().mockResolvedValue(emptyProgress);

      const params = {
        userId: 'test-user',
        code: 'console.log("hello");'
      };

      const result = await GamificationService.processCodeAnalysisGamification(params);

      expect(result).toBeDefined();
      expect(result.pointsEarned.totalPoints).toBeGreaterThan(0);
    });
  });
});