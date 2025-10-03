/**
 * @fileOverview Unit tests for BadgeCalculator
 */

import { describe, it, expect } from 'vitest';
import { BadgeCalculator } from '../badge-calculator';
import { BadgeAwardContext } from '@/types/gamification';
import { UserProgress, AIAnalysisResult, Challenge, ChallengeSubmission } from '@/types/analytics';

describe('BadgeCalculator', () => {
  const mockUserProgress: UserProgress = {
    userId: 'test-user',
    skillLevels: new Map([
      ['JavaScript', {
        skillId: 'JavaScript',
        skillName: 'JavaScript',
        currentLevel: 3,
        experiencePoints: 750,
        competencyAreas: [],
        industryBenchmark: {
          industryAverage: 50,
          experienceLevel: 'intermediate',
          percentile: 75,
          lastUpdated: new Date()
        },
        verificationStatus: 'verified',
        progressHistory: [],
        trendDirection: 'improving',
        lastUpdated: new Date()
      }],
      ['React', {
        skillId: 'React',
        skillName: 'React',
        currentLevel: 2,
        experiencePoints: 300,
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
    learningVelocity: 2.5,
    codeQualityTrend: {
      direction: 'improving',
      changePercentage: 15,
      timeframe: '30d',
      dataPoints: 10
    },
    challengesCompleted: [],
    peerInteractions: [],
    lastAnalysisDate: new Date(),
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockAIAnalysis: AIAnalysisResult = {
    analysisId: 'test-analysis',
    codeQuality: 85,
    efficiency: 75,
    creativity: 80,
    bestPractices: 90,
    suggestions: ['Use more descriptive variable names'],
    detectedSkills: ['JavaScript', 'hooks'],
    improvementAreas: ['Error handling'],
    processingTime: 1500
  };

  const mockChallenge: Challenge = {
    challengeId: 'test-challenge',
    title: 'React Hooks Challenge',
    description: 'Implement custom hooks',
    difficulty: 'intermediate',
    skillsTargeted: ['react', 'hooks'],
    timeLimit: 30,
    evaluationCriteria: [],
    createdBy: 'ai',
    isActive: true,
    prompt: 'Create a custom hook',
    testCases: [],
    hints: [],
    tags: ['react', 'hooks'],
    category: 'frontend',
    estimatedDuration: 25,
    prerequisites: [],
    learningObjectives: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    participantCount: 50,
    averageScore: 70,
    successRate: 0.75
  };

  const mockSubmission: ChallengeSubmission = {
    submissionId: 'test-submission',
    challengeId: 'test-challenge',
    userId: 'test-user',
    code: 'function useCustomHook() { return useState(); }',
    language: 'javascript',
    submittedAt: new Date(),
    evaluationResults: [],
    totalScore: 100,
    passed: true,
    feedback: ['Excellent implementation'],
    aiAnalysis: mockAIAnalysis
  };

  const mockContext: BadgeAwardContext = {
    userId: 'test-user',
    userProgress: mockUserProgress,
    aiAnalysis: mockAIAnalysis,
    challenge: mockChallenge,
    submission: mockSubmission,
    peerReviewScore: 4.5,
    timeConstraints: {
      submissionTime: 1200,
      sessionDuration: 1800
    }
  };

  describe('evaluateBadgeEligibility', () => {
    it('should evaluate JavaScript Fundamentals badge eligibility correctly', async () => {
      const result = await BadgeCalculator.evaluateBadgeEligibility('JavaScript Fundamentals', mockContext);
      
      expect(result.isEligible).toBe(true);
      expect(result.badgeAward).toBeDefined();
      expect(result.badgeAward!.badgeName).toBe('JavaScript Fundamentals');
      expect(result.missingCriteria).toHaveLength(0);
      expect(result.progressToNext).toBe(100);
    });

    it('should handle ineligible badge correctly', async () => {
      const lowLevelContext = {
        ...mockContext,
        userProgress: {
          ...mockUserProgress,
          skillLevels: new Map([
            ['JavaScript', {
              ...mockUserProgress.skillLevels.get('JavaScript')!,
              currentLevel: 1,
              experiencePoints: 50
            }]
          ])
        }
      };

      const result = await BadgeCalculator.evaluateBadgeEligibility('JavaScript Master', lowLevelContext);
      
      expect(result.isEligible).toBe(false);
      expect(result.badgeAward).toBeUndefined();
      expect(result.missingCriteria.length).toBeGreaterThan(0);
      expect(result.progressToNext).toBeLessThan(100);
    });

    it('should return error for non-existent badge', async () => {
      const result = await BadgeCalculator.evaluateBadgeEligibility('Non-existent Badge', mockContext);
      
      expect(result.isEligible).toBe(false);
      expect(result.missingCriteria).toContain('Badge not found');
      expect(result.progressToNext).toBe(0);
    });

    it('should evaluate React Hooks Expert badge with specific skills', async () => {
      const result = await BadgeCalculator.evaluateBadgeEligibility('React Hooks Expert', mockContext);
      
      // Should be eligible since user has React level 2+ and detected hooks skill
      expect(result.isEligible).toBe(true);
      expect(result.badgeAward).toBeDefined();
    });
  });

  describe('calculateBadgeRarity', () => {
    it('should calculate rarity correctly for common badge', () => {
      const badgeConfig = {
        category: 'skill',
        subcategory: 'javascript',
        criteria: { minimumSkillLevel: 1 },
        rarity: 'common'
      };

      const result = BadgeCalculator.calculateBadgeRarity(badgeConfig, mockContext, []);
      
      expect(result.rarityLevel).toBe('common');
      expect(result.baseRarity).toBe(10);
      expect(result.finalRarity).toBeGreaterThanOrEqual(10);
    });

    it('should calculate rarity correctly for legendary badge', () => {
      const badgeConfig = {
        category: 'skill',
        subcategory: 'typescript',
        criteria: { minimumSkillLevel: 4, codeQualityThreshold: 95 },
        rarity: 'legendary'
      };

      const result = BadgeCalculator.calculateBadgeRarity(badgeConfig, mockContext, []);
      
      expect(result.rarityLevel).toBe('legendary');
      expect(result.baseRarity).toBe(95);
    });

    it('should apply quality bonus for high-quality code', () => {
      const highQualityContext = {
        ...mockContext,
        aiAnalysis: {
          ...mockAIAnalysis,
          codeQuality: 95,
          efficiency: 95,
          creativity: 95,
          bestPractices: 95
        }
      };

      const badgeConfig = {
        category: 'skill',
        subcategory: 'javascript',
        criteria: {},
        rarity: 'uncommon'
      };

      const result = BadgeCalculator.calculateBadgeRarity(badgeConfig, highQualityContext, []);
      
      expect(result.qualityBonus).toBeGreaterThan(0);
      expect(result.finalRarity).toBeGreaterThan(result.baseRarity);
    });

    it('should apply time bonus for fast completion', () => {
      const fastContext = {
        ...mockContext,
        timeConstraints: {
          submissionTime: 300, // 5 minutes
          sessionDuration: 300
        },
        challenge: {
          ...mockChallenge,
          timeLimit: 30 // 30 minutes
        }
      };

      const badgeConfig = {
        category: 'achievement',
        subcategory: 'speed',
        criteria: {},
        rarity: 'rare'
      };

      const result = BadgeCalculator.calculateBadgeRarity(badgeConfig, fastContext, []);
      
      expect(result.timeBonus).toBeGreaterThan(0);
    });
  });

  describe('createBadgeAward', () => {
    it('should create a complete badge award', async () => {
      const badgeConfig = {
        category: 'skill',
        subcategory: 'javascript',
        criteria: { minimumSkillLevel: 1 },
        rarity: 'common'
      };

      const validationResults = [
        {
          criterion: 'Minimum Skill Level',
          value: 3,
          threshold: 1,
          passed: true
        }
      ];

      const badge = await BadgeCalculator.createBadgeAward(
        'JavaScript Fundamentals',
        badgeConfig,
        mockContext,
        validationResults
      );
      
      expect(badge.badgeId).toBeDefined();
      expect(badge.badgeName).toBe('JavaScript Fundamentals');
      expect(badge.badgeType.category).toBe('skill');
      expect(badge.badgeType.subcategory).toBe('javascript');
      expect(badge.rarity.level).toBeDefined();
      expect(badge.description).toBeDefined();
      expect(badge.awardedAt).toBeInstanceOf(Date);
      expect(badge.verificationStatus).toBe('pending');
      expect(badge.metadata.skillsValidated).toContain('JavaScript');
      expect(badge.metadata.validationCriteria).toEqual(validationResults);
    });

    it('should generate appropriate icon URL', async () => {
      const badgeConfig = {
        category: 'skill',
        subcategory: 'react',
        criteria: {},
        rarity: 'rare'
      };

      const badge = await BadgeCalculator.createBadgeAward(
        'React Hooks Expert',
        badgeConfig,
        mockContext,
        []
      );
      
      expect(badge.iconUrl).toContain('/badges/');
      expect(badge.iconUrl).toContain('react-hooks-expert');
      expect(badge.iconUrl).toContain('.svg');
    });
  });

  describe('createSpecialBadge', () => {
    it('should create special limited edition badge', () => {
      const specialBadge = BadgeCalculator.createSpecialBadge(
        'Early Adopter',
        mockContext,
        'launch-event-2024',
        42,
        1000
      );
      
      expect(specialBadge.badgeName).toBe('Early Adopter');
      expect(specialBadge.limitedEdition).toBe(true);
      expect(specialBadge.eventId).toBe('launch-event-2024');
      expect(specialBadge.serialNumber).toBe(42);
      expect(specialBadge.totalMinted).toBe(1000);
      expect(specialBadge.transferable).toBe(false);
    });

    it('should throw error for non-existent special badge', () => {
      expect(() => {
        BadgeCalculator.createSpecialBadge('Non-existent Special Badge', mockContext);
      }).toThrow('Special badge Non-existent Special Badge not found');
    });
  });

  describe('createCommunityBadge', () => {
    it('should create community contribution badge', () => {
      const communityBadge = BadgeCalculator.createCommunityBadge(
        'Helpful Reviewer',
        mockContext,
        'peer_review',
        85,
        ['user1', 'user2', 'user3']
      );
      
      expect(communityBadge.badgeName).toBe('Helpful Reviewer');
      expect(communityBadge.contributionType).toBe('peer_review');
      expect(communityBadge.impactScore).toBe(85);
      expect(communityBadge.communityVotes).toBe(3);
      expect(communityBadge.endorsements).toHaveLength(3);
    });

    it('should throw error for non-existent community badge', () => {
      expect(() => {
        BadgeCalculator.createCommunityBadge(
          'Non-existent Community Badge',
          mockContext,
          'peer_review',
          50
        );
      }).toThrow('Community badge Non-existent Community Badge not found');
    });
  });

  describe('trackAchievementProgress', () => {
    it('should track achievement progress correctly', async () => {
      const progress = await BadgeCalculator.trackAchievementProgress(
        'test-user',
        'rising-star',
        750,
        1000
      );
      
      expect(progress.userId).toBe('test-user');
      expect(progress.achievementId).toBe('rising-star');
      expect(progress.currentProgress).toBe(750);
      expect(progress.targetProgress).toBe(1000);
      expect(progress.progressPercentage).toBe(75);
      expect(progress.isCompleted).toBe(false);
      expect(progress.milestones).toBeDefined();
      expect(progress.estimatedCompletion).toBeInstanceOf(Date);
    });

    it('should mark achievement as completed when target reached', async () => {
      const progress = await BadgeCalculator.trackAchievementProgress(
        'test-user',
        'first-steps',
        100,
        100
      );
      
      expect(progress.progressPercentage).toBe(100);
      expect(progress.isCompleted).toBe(true);
      expect(progress.estimatedCompletion).toBeUndefined();
    });

    it('should update milestone completion status', async () => {
      const progress = await BadgeCalculator.trackAchievementProgress(
        'test-user',
        'code-master',
        600,
        1000
      );
      
      const completedMilestones = progress.milestones.filter(m => m.isCompleted);
      const incompleteMilestones = progress.milestones.filter(m => !m.isCompleted);
      
      expect(completedMilestones.length).toBeGreaterThan(0);
      expect(incompleteMilestones.length).toBeGreaterThan(0);
      
      // 25% and 50% milestones should be completed (600/1000 = 60%)
      expect(completedMilestones.some(m => m.name === '25% Progress')).toBe(true);
      expect(completedMilestones.some(m => m.name === '50% Progress')).toBe(true);
    });
  });

  describe('Edge cases and validation', () => {
    it('should handle context without AI analysis', async () => {
      const contextWithoutAI = {
        ...mockContext,
        aiAnalysis: undefined
      };

      const result = await BadgeCalculator.evaluateBadgeEligibility(
        'JavaScript Fundamentals',
        contextWithoutAI
      );
      
      // Should still work for badges that don't require AI analysis
      expect(result).toBeDefined();
    });

    it('should handle context without challenge', async () => {
      const contextWithoutChallenge = {
        ...mockContext,
        challenge: undefined,
        submission: undefined
      };

      const result = await BadgeCalculator.evaluateBadgeEligibility(
        'JavaScript Fundamentals',
        contextWithoutChallenge
      );
      
      expect(result).toBeDefined();
    });

    it('should handle empty skill levels', async () => {
      const contextWithoutSkills = {
        ...mockContext,
        userProgress: {
          ...mockUserProgress,
          skillLevels: new Map()
        }
      };

      const result = await BadgeCalculator.evaluateBadgeEligibility(
        'JavaScript Fundamentals',
        contextWithoutSkills
      );
      
      expect(result.isEligible).toBe(false);
      expect(result.missingCriteria.length).toBeGreaterThan(0);
    });

    it('should calculate progress correctly with partial criteria met', async () => {
      const partialContext = {
        ...mockContext,
        userProgress: {
          ...mockUserProgress,
          skillLevels: new Map([
            ['JavaScript', {
              ...mockUserProgress.skillLevels.get('JavaScript')!,
              currentLevel: 2 // Meets skill level but not quality threshold for advanced badge
            }]
          ])
        },
        aiAnalysis: {
          ...mockAIAnalysis,
          codeQuality: 70 // Below 80 threshold for advanced badge
        }
      };

      const result = await BadgeCalculator.evaluateBadgeEligibility(
        'JavaScript Advanced',
        partialContext
      );
      
      expect(result.isEligible).toBe(false);
      expect(result.progressToNext).toBeGreaterThanOrEqual(0);
      expect(result.progressToNext).toBeLessThan(100);
    });
  });
});