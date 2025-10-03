/**
 * @fileOverview Unit tests for PointsCalculator
 */

import { describe, it, expect } from 'vitest';
import { PointsCalculator } from '../points-calculator';
import { AIAnalysisResult, Challenge, ChallengeSubmission } from '@/types/analytics';

describe('PointsCalculator', () => {
  const mockAIAnalysis: AIAnalysisResult = {
    analysisId: 'test-analysis',
    codeQuality: 85,
    efficiency: 75,
    creativity: 80,
    bestPractices: 90,
    suggestions: ['Use more descriptive variable names'],
    detectedSkills: ['JavaScript', 'React'],
    improvementAreas: ['Error handling'],
    processingTime: 1500
  };

  const mockChallenge: Challenge = {
    challengeId: 'test-challenge',
    title: 'Array Manipulation',
    description: 'Implement array sorting algorithm',
    difficulty: 'intermediate',
    skillsTargeted: ['algorithms', 'javascript'],
    timeLimit: 30,
    evaluationCriteria: [],
    createdBy: 'ai',
    isActive: true,
    prompt: 'Sort the array',
    testCases: [],
    hints: [],
    tags: ['sorting'],
    category: 'algorithms',
    estimatedDuration: 25,
    prerequisites: [],
    learningObjectives: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    participantCount: 100,
    averageScore: 75,
    successRate: 0.8
  };

  const mockSubmission: ChallengeSubmission = {
    submissionId: 'test-submission',
    challengeId: 'test-challenge',
    userId: 'test-user',
    code: 'function sort(arr) { return arr.sort(); }',
    language: 'javascript',
    submittedAt: new Date(),
    evaluationResults: [],
    totalScore: 85,
    passed: true,
    feedback: ['Good implementation'],
    aiAnalysis: mockAIAnalysis
  };

  describe('calculateCodeSubmissionPoints', () => {
    it('should calculate points correctly for high-quality code', () => {
      const result = PointsCalculator.calculateCodeSubmissionPoints(mockAIAnalysis, 'intermediate');
      
      expect(result.totalPoints).toBeGreaterThan(0);
      expect(result.basePoints).toBeGreaterThan(0);
      expect(result.qualityBonus).toBeGreaterThan(0);
      expect(result.breakdown).toHaveLength(6); // Base + 4 bonuses + difficulty
      expect(result.difficultyMultiplier).toBe(1.5); // Intermediate multiplier
    });

    it('should apply difficulty multipliers correctly', () => {
      const beginnerResult = PointsCalculator.calculateCodeSubmissionPoints(mockAIAnalysis, 'beginner');
      const expertResult = PointsCalculator.calculateCodeSubmissionPoints(mockAIAnalysis, 'expert');
      
      expect(expertResult.totalPoints).toBeGreaterThan(beginnerResult.totalPoints);
      expect(beginnerResult.difficultyMultiplier).toBe(1.0);
      expect(expertResult.difficultyMultiplier).toBe(3.0);
    });

    it('should handle low-quality code appropriately', () => {
      const lowQualityAnalysis: AIAnalysisResult = {
        ...mockAIAnalysis,
        codeQuality: 30,
        efficiency: 25,
        creativity: 20,
        bestPractices: 35
      };
      
      const result = PointsCalculator.calculateCodeSubmissionPoints(lowQualityAnalysis, 'beginner');
      
      expect(result.totalPoints).toBeGreaterThan(0);
      expect(result.totalPoints).toBeLessThan(80); // Should be relatively low compared to high-quality code
    });

    it('should validate points calculation', () => {
      const result = PointsCalculator.calculateCodeSubmissionPoints(mockAIAnalysis, 'intermediate');
      
      expect(PointsCalculator.validatePointsCalculation(result)).toBe(true);
    });
  });

  describe('calculateChallengePoints', () => {
    it('should calculate challenge points correctly', () => {
      const result = PointsCalculator.calculateChallengePoints(mockChallenge, mockSubmission, 1200);
      
      expect(result.totalPoints).toBeGreaterThan(0);
      expect(result.basePoints).toBe(75); // Intermediate difficulty base points
      expect(result.breakdown.length).toBeGreaterThan(2);
    });

    it('should award speed bonus for fast completion', () => {
      const fastTime = 600; // 10 minutes (50% of time limit)
      const result = PointsCalculator.calculateChallengePoints(mockChallenge, mockSubmission, fastTime);
      
      const speedBonus = result.breakdown.find(item => item.category === 'Speed Bonus');
      expect(speedBonus).toBeDefined();
      expect(speedBonus!.points).toBeGreaterThan(0);
    });

    it('should award perfect score bonus', () => {
      const perfectSubmission = { ...mockSubmission, totalScore: 100 };
      const result = PointsCalculator.calculateChallengePoints(mockChallenge, perfectSubmission);
      
      const perfectBonus = result.breakdown.find(item => item.category === 'Perfect Score Bonus');
      expect(perfectBonus).toBeDefined();
      expect(perfectBonus!.points).toBeGreaterThan(0);
    });

    it('should handle different difficulty levels', () => {
      const expertChallenge = { ...mockChallenge, difficulty: 'expert' as const };
      const beginnerChallenge = { ...mockChallenge, difficulty: 'beginner' as const };
      
      const expertResult = PointsCalculator.calculateChallengePoints(expertChallenge, mockSubmission);
      const beginnerResult = PointsCalculator.calculateChallengePoints(beginnerChallenge, mockSubmission);
      
      expect(expertResult.totalPoints).toBeGreaterThan(beginnerResult.totalPoints);
    });
  });

  describe('calculatePeerReviewPoints', () => {
    it('should calculate peer review points correctly', () => {
      const result = PointsCalculator.calculatePeerReviewPoints(4, 200, 5, false);
      
      expect(result.totalPoints).toBeGreaterThan(0);
      expect(result.basePoints).toBe(20);
      expect(result.breakdown).toHaveLength(4);
    });

    it('should award first review bonus', () => {
      const result = PointsCalculator.calculatePeerReviewPoints(3, 150, 4, true);
      
      const firstReviewBonus = result.breakdown.find(item => item.category === 'First Review Bonus');
      expect(firstReviewBonus).toBeDefined();
      expect(firstReviewBonus!.points).toBe(15);
    });

    it('should scale with review quality', () => {
      const lowQualityResult = PointsCalculator.calculatePeerReviewPoints(1, 100, 2);
      const highQualityResult = PointsCalculator.calculatePeerReviewPoints(5, 300, 5);
      
      expect(highQualityResult.totalPoints).toBeGreaterThan(lowQualityResult.totalPoints);
    });

    it('should cap length bonus appropriately', () => {
      const longReviewResult = PointsCalculator.calculatePeerReviewPoints(3, 2000, 4);
      
      const lengthBonus = longReviewResult.breakdown.find(item => item.category === 'Detail Bonus');
      expect(lengthBonus!.points).toBeLessThanOrEqual(20);
    });
  });

  describe('calculateCommunityPoints', () => {
    it('should calculate community contribution points', () => {
      const result = PointsCalculator.calculateCommunityPoints('bug_report', 'high', 10, true);
      
      expect(result.totalPoints).toBeGreaterThan(0);
      expect(result.basePoints).toBe(30); // Bug report base points
      expect(result.breakdown.length).toBeGreaterThan(2);
    });

    it('should apply impact multipliers', () => {
      const lowImpactResult = PointsCalculator.calculateCommunityPoints('feature_suggestion', 'low', 0, false);
      const highImpactResult = PointsCalculator.calculateCommunityPoints('feature_suggestion', 'high', 0, false);
      
      expect(highImpactResult.totalPoints).toBeGreaterThan(lowImpactResult.totalPoints);
    });

    it('should award acceptance bonus', () => {
      const result = PointsCalculator.calculateCommunityPoints('content_creation', 'medium', 5, true);
      
      const acceptanceBonus = result.breakdown.find(item => item.category === 'Acceptance Bonus');
      expect(acceptanceBonus).toBeDefined();
      expect(acceptanceBonus!.points).toBeGreaterThan(0);
    });

    it('should cap community votes bonus', () => {
      const result = PointsCalculator.calculateCommunityPoints('mentorship', 'low', 100, false);
      
      const votesBonus = result.breakdown.find(item => item.category === 'Community Votes Bonus');
      expect(votesBonus!.points).toBeLessThanOrEqual(50);
    });
  });

  describe('calculateRarityBonus', () => {
    it('should return correct rarity bonuses', () => {
      expect(PointsCalculator.calculateRarityBonus('common')).toBe(0);
      expect(PointsCalculator.calculateRarityBonus('uncommon')).toBe(10);
      expect(PointsCalculator.calculateRarityBonus('rare')).toBe(25);
      expect(PointsCalculator.calculateRarityBonus('epic')).toBe(50);
      expect(PointsCalculator.calculateRarityBonus('legendary')).toBe(100);
    });
  });

  describe('calculateStreakBonus', () => {
    it('should calculate streak bonuses correctly', () => {
      const result = PointsCalculator.calculateStreakBonus(15, 'daily_coding');
      
      expect(result.totalPoints).toBeGreaterThan(0);
      expect(result.basePoints).toBe(30); // 15 days * 2 points
      expect(result.breakdown.length).toBeGreaterThan(1);
    });

    it('should award milestone bonuses', () => {
      const result = PointsCalculator.calculateStreakBonus(30, 'challenge_completion');
      
      const milestoneBonus = result.breakdown.find(item => item.category.includes('Milestone'));
      expect(milestoneBonus).toBeDefined();
    });

    it('should cap base streak bonus', () => {
      const result = PointsCalculator.calculateStreakBonus(100, 'peer_review');
      
      expect(result.basePoints).toBeLessThanOrEqual(100);
    });
  });

  describe('formatPointsBreakdown', () => {
    it('should format points breakdown correctly', () => {
      const result = PointsCalculator.calculateCodeSubmissionPoints(mockAIAnalysis, 'intermediate');
      const formatted = PointsCalculator.formatPointsBreakdown(result);
      
      expect(formatted).toContain('Total Points:');
      expect(formatted).toContain('Breakdown:');
      expect(formatted).toContain('Base Points');
      expect(formatted).toContain('Code Quality Bonus');
    });

    it('should include multiplier information', () => {
      const result = PointsCalculator.calculateCodeSubmissionPoints(mockAIAnalysis, 'expert');
      const formatted = PointsCalculator.formatPointsBreakdown(result);
      
      expect(formatted).toContain('multiplier');
    });
  });

  describe('Edge cases and validation', () => {
    it('should handle zero scores gracefully', () => {
      const zeroAnalysis: AIAnalysisResult = {
        ...mockAIAnalysis,
        codeQuality: 0,
        efficiency: 0,
        creativity: 0,
        bestPractices: 0
      };
      
      const result = PointsCalculator.calculateCodeSubmissionPoints(zeroAnalysis, 'beginner');
      
      expect(result.totalPoints).toBeGreaterThanOrEqual(0);
      expect(PointsCalculator.validatePointsCalculation(result)).toBe(true);
    });

    it('should handle maximum scores', () => {
      const maxAnalysis: AIAnalysisResult = {
        ...mockAIAnalysis,
        codeQuality: 100,
        efficiency: 100,
        creativity: 100,
        bestPractices: 100
      };
      
      const result = PointsCalculator.calculateCodeSubmissionPoints(maxAnalysis, 'expert');
      
      expect(result.totalPoints).toBeGreaterThan(0);
      expect(PointsCalculator.validatePointsCalculation(result)).toBe(true);
    });

    it('should validate all calculation methods', () => {
      const codeResult = PointsCalculator.calculateCodeSubmissionPoints(mockAIAnalysis, 'intermediate');
      const challengeResult = PointsCalculator.calculateChallengePoints(mockChallenge, mockSubmission);
      const reviewResult = PointsCalculator.calculatePeerReviewPoints(4, 200, 5);
      const communityResult = PointsCalculator.calculateCommunityPoints('bug_report', 'medium', 5, true);
      const streakResult = PointsCalculator.calculateStreakBonus(10, 'daily_coding');
      
      expect(PointsCalculator.validatePointsCalculation(codeResult)).toBe(true);
      expect(PointsCalculator.validatePointsCalculation(challengeResult)).toBe(true);
      expect(PointsCalculator.validatePointsCalculation(reviewResult)).toBe(true);
      expect(PointsCalculator.validatePointsCalculation(communityResult)).toBe(true);
      expect(PointsCalculator.validatePointsCalculation(streakResult)).toBe(true);
    });
  });
});