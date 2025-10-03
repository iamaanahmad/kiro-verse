/**
 * @fileOverview Unit tests for BenchmarkService
 */

import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { BenchmarkService } from '../benchmark-service';
import { UserProgressService } from '@/lib/firebase/analytics';
import { UserProgress, SkillLevel } from '@/types/analytics';
import { MarketReadinessAssessment, BenchmarkComparison } from '@/types/benchmark';

// Mock the Firebase analytics service
vi.mock('@/lib/firebase/analytics', () => ({
  UserProgressService: {
    getUserProgress: vi.fn()
  }
}));

const mockUserProgressService = UserProgressService as {
  getUserProgress: Mock;
};

describe('BenchmarkService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createMockUserProgress = (): UserProgress => ({
    userId: 'test-user-123',
    skillLevels: new Map([
      ['JavaScript', {
        skillId: 'JavaScript',
        skillName: 'JavaScript',
        currentLevel: 3,
        experiencePoints: 750,
        competencyAreas: [],
        industryBenchmark: {
          industryAverage: 70,
          experienceLevel: 'mid',
          percentile: 65,
          lastUpdated: new Date()
        },
        verificationStatus: 'verified',
        progressHistory: [
          {
            timestamp: new Date('2024-01-01'),
            level: 2,
            experiencePoints: 400
          },
          {
            timestamp: new Date('2024-02-01'),
            level: 3,
            experiencePoints: 750
          }
        ],
        trendDirection: 'improving',
        lastUpdated: new Date()
      }],
      ['React', {
        skillId: 'React',
        skillName: 'React',
        currentLevel: 2,
        experiencePoints: 450,
        competencyAreas: [],
        industryBenchmark: {
          industryAverage: 75,
          experienceLevel: 'junior',
          percentile: 45,
          lastUpdated: new Date()
        },
        verificationStatus: 'pending',
        progressHistory: [
          {
            timestamp: new Date('2024-01-15'),
            level: 1,
            experiencePoints: 200
          },
          {
            timestamp: new Date('2024-02-15'),
            level: 2,
            experiencePoints: 450
          }
        ],
        trendDirection: 'improving',
        lastUpdated: new Date()
      }]
    ]),
    learningVelocity: 1.5,
    codeQualityTrend: {
      direction: 'improving',
      changePercentage: 15,
      timeframe: '30d',
      dataPoints: 10
    },
    challengesCompleted: [],
    peerInteractions: [],
    lastAnalysisDate: new Date(),
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date()
  });

  describe('compareUserToIndustryBenchmarks', () => {
    it('should compare user skills against industry benchmarks', async () => {
      const mockUserProgress = createMockUserProgress();
      mockUserProgressService.getUserProgress.mockResolvedValue(mockUserProgress);

      const comparisons = await BenchmarkService.compareUserToIndustryBenchmarks('test-user-123');

      expect(comparisons).toHaveLength(2);
      expect(comparisons[0].skillId).toBe('JavaScript');
      expect(comparisons[1].skillId).toBe('React');
      expect(comparisons[0].userScore).toBeGreaterThan(0);
      expect(comparisons[0].percentileRank).toBeGreaterThan(0);
    });

    it('should throw error when user progress not found', async () => {
      mockUserProgressService.getUserProgress.mockResolvedValue(null);

      await expect(
        BenchmarkService.compareUserToIndustryBenchmarks('nonexistent-user')
      ).rejects.toThrow('User progress not found');
    });

    it('should handle empty skill levels', async () => {
      const emptyUserProgress = {
        ...createMockUserProgress(),
        skillLevels: new Map()
      };
      mockUserProgressService.getUserProgress.mockResolvedValue(emptyUserProgress);

      const comparisons = await BenchmarkService.compareUserToIndustryBenchmarks('test-user-123');

      expect(comparisons).toHaveLength(0);
    });
  });

  describe('generateMarketReadinessAssessment', () => {
    it('should generate comprehensive market readiness assessment', async () => {
      const mockUserProgress = createMockUserProgress();
      mockUserProgressService.getUserProgress.mockResolvedValue(mockUserProgress);

      const assessment = await BenchmarkService.generateMarketReadinessAssessment('test-user-123');

      expect(assessment).toBeDefined();
      expect(assessment.userId).toBe('test-user-123');
      expect(assessment.overallReadiness).toBeGreaterThan(0);
      expect(assessment.overallReadiness).toBeLessThanOrEqual(100);
      expect(assessment.experienceLevel).toBeDefined();
      expect(assessment.skillGaps).toBeDefined();
      expect(assessment.strengths).toBeDefined();
      expect(assessment.recommendedActions).toBeDefined();
      expect(assessment.jobOpportunities).toBeDefined();
      expect(assessment.assessmentDate).toBeInstanceOf(Date);
      expect(assessment.nextReviewDate).toBeInstanceOf(Date);
    });

    it('should identify skill gaps correctly', async () => {
      const mockUserProgress = createMockUserProgress();
      // Set React skill to be below average
      const reactSkill = mockUserProgress.skillLevels.get('React')!;
      reactSkill.currentLevel = 1;
      reactSkill.experiencePoints = 100;
      
      mockUserProgressService.getUserProgress.mockResolvedValue(mockUserProgress);

      const assessment = await BenchmarkService.generateMarketReadinessAssessment('test-user-123');

      expect(assessment.skillGaps.length).toBeGreaterThan(0);
      const reactGap = assessment.skillGaps.find(gap => gap.skillId === 'React');
      expect(reactGap).toBeDefined();
      expect(reactGap?.priority).toMatch(/medium|high|critical/);
    });

    it('should identify skill strengths correctly', async () => {
      const mockUserProgress = createMockUserProgress();
      // Set JavaScript skill to be above average
      const jsSkill = mockUserProgress.skillLevels.get('JavaScript')!;
      jsSkill.currentLevel = 4;
      jsSkill.experiencePoints = 1500;
      
      mockUserProgressService.getUserProgress.mockResolvedValue(mockUserProgress);

      const assessment = await BenchmarkService.generateMarketReadinessAssessment('test-user-123');

      expect(assessment.strengths.length).toBeGreaterThan(0);
      const jsStrength = assessment.strengths.find(strength => strength.skillId === 'JavaScript');
      expect(jsStrength).toBeDefined();
      expect(jsStrength?.marketValue).toMatch(/high|exceptional/);
    });

    it('should generate appropriate recommended actions', async () => {
      const mockUserProgress = createMockUserProgress();
      mockUserProgressService.getUserProgress.mockResolvedValue(mockUserProgress);

      const assessment = await BenchmarkService.generateMarketReadinessAssessment('test-user-123');

      expect(assessment.recommendedActions.length).toBeGreaterThan(0);
      
      const skillDevelopmentActions = assessment.recommendedActions.filter(
        action => action.type === 'skill_development'
      );
      expect(skillDevelopmentActions.length).toBeGreaterThan(0);

      const firstAction = assessment.recommendedActions[0];
      expect(firstAction.title).toBeDefined();
      expect(firstAction.description).toBeDefined();
      expect(firstAction.priority).toMatch(/low|medium|high|critical/);
      expect(firstAction.estimatedEffort).toBeGreaterThan(0);
      expect(firstAction.expectedImpact).toBeGreaterThan(0);
    });
  });

  describe('findMatchingJobOpportunities', () => {
    it('should find job opportunities matching user skills', async () => {
      const mockUserProgress = createMockUserProgress();

      const opportunities = await BenchmarkService.findMatchingJobOpportunities(mockUserProgress);

      expect(opportunities.length).toBeGreaterThan(0);
      
      for (const opportunity of opportunities) {
        expect(opportunity.matchScore).toBeGreaterThanOrEqual(60);
        expect(opportunity.skillsMatch).toBeGreaterThanOrEqual(0);
        expect(opportunity.skillsMatch).toBeLessThanOrEqual(100);
        expect(opportunity.experienceMatch).toBeGreaterThanOrEqual(0);
        expect(opportunity.experienceMatch).toBeLessThanOrEqual(100);
      }
    });

    it('should calculate skills match correctly', async () => {
      const mockUserProgress = createMockUserProgress();
      // Add TypeScript skill to improve matching
      mockUserProgress.skillLevels.set('TypeScript', {
        skillId: 'TypeScript',
        skillName: 'TypeScript',
        currentLevel: 2,
        experiencePoints: 300,
        competencyAreas: [],
        industryBenchmark: {
          industryAverage: 65,
          experienceLevel: 'junior',
          percentile: 55,
          lastUpdated: new Date()
        },
        verificationStatus: 'verified',
        progressHistory: [],
        trendDirection: 'improving',
        lastUpdated: new Date()
      });

      const opportunities = await BenchmarkService.findMatchingJobOpportunities(mockUserProgress);

      expect(opportunities.length).toBeGreaterThan(0);
      
      // Should have higher skills match due to TypeScript
      const opportunityWithTypeScript = opportunities.find(
        opp => opp.optionalSkills.some(skill => skill.skillId === 'TypeScript')
      );
      expect(opportunityWithTypeScript?.skillsMatch).toBeGreaterThan(50);
    });

    it('should sort opportunities by match score', async () => {
      const mockUserProgress = createMockUserProgress();

      const opportunities = await BenchmarkService.findMatchingJobOpportunities(mockUserProgress);

      expect(opportunities.length).toBeGreaterThanOrEqual(1);
      
      // Verify sorting (highest match score first)
      for (let i = 1; i < opportunities.length; i++) {
        expect(opportunities[i - 1].matchScore).toBeGreaterThanOrEqual(opportunities[i].matchScore);
      }
    });

    it('should filter out low-match opportunities', async () => {
      const mockUserProgress = createMockUserProgress();
      // Remove skills to create low matches
      mockUserProgress.skillLevels.clear();

      const opportunities = await BenchmarkService.findMatchingJobOpportunities(mockUserProgress);

      // Should filter out opportunities with match score < 60%
      for (const opportunity of opportunities) {
        expect(opportunity.matchScore).toBeGreaterThanOrEqual(60);
      }
    });
  });

  describe('experience level determination', () => {
    it('should correctly determine entry level', async () => {
      const entryUserProgress = createMockUserProgress();
      entryUserProgress.skillLevels.forEach(skill => {
        skill.currentLevel = 1;
        skill.experiencePoints = 50;
      });
      
      mockUserProgressService.getUserProgress.mockResolvedValue(entryUserProgress);

      const assessment = await BenchmarkService.generateMarketReadinessAssessment('test-user-123');

      expect(assessment.experienceLevel.level).toBe('entry');
    });

    it('should correctly determine senior level', async () => {
      const seniorUserProgress = createMockUserProgress();
      seniorUserProgress.skillLevels.forEach(skill => {
        skill.currentLevel = 4;
        skill.experiencePoints = 1200;
      });
      
      mockUserProgressService.getUserProgress.mockResolvedValue(seniorUserProgress);

      const assessment = await BenchmarkService.generateMarketReadinessAssessment('test-user-123');

      expect(assessment.experienceLevel.level).toMatch(/senior|principal/);
    });

    it('should correctly determine principal level', async () => {
      const principalUserProgress = createMockUserProgress();
      principalUserProgress.skillLevels.forEach(skill => {
        skill.currentLevel = 5;
        skill.experiencePoints = 2500;
      });
      
      mockUserProgressService.getUserProgress.mockResolvedValue(principalUserProgress);

      const assessment = await BenchmarkService.generateMarketReadinessAssessment('test-user-123');

      expect(assessment.experienceLevel.level).toBe('principal');
    });
  });

  describe('benchmark comparison calculations', () => {
    it('should calculate percentile rank correctly', async () => {
      const mockUserProgress = createMockUserProgress();
      mockUserProgressService.getUserProgress.mockResolvedValue(mockUserProgress);

      const comparisons = await BenchmarkService.compareUserToIndustryBenchmarks('test-user-123');

      expect(comparisons.length).toBeGreaterThan(0);
      
      for (const comparison of comparisons) {
        expect(comparison.percentileRank).toBeGreaterThanOrEqual(10);
        expect(comparison.percentileRank).toBeLessThanOrEqual(90);
        expect(comparison.performanceLevel).toMatch(/below_average|average|above_average|exceptional/);
      }
    });

    it('should generate appropriate recommendations', async () => {
      const mockUserProgress = createMockUserProgress();
      mockUserProgressService.getUserProgress.mockResolvedValue(mockUserProgress);

      const comparisons = await BenchmarkService.compareUserToIndustryBenchmarks('test-user-123');

      expect(comparisons.length).toBeGreaterThan(0);
      
      for (const comparison of comparisons) {
        expect(comparison.recommendations).toBeDefined();
        expect(comparison.recommendations.length).toBeGreaterThan(0);
        expect(typeof comparison.recommendations[0]).toBe('string');
      }
    });

    it('should calculate gap analysis correctly', async () => {
      const mockUserProgress = createMockUserProgress();
      mockUserProgressService.getUserProgress.mockResolvedValue(mockUserProgress);

      const comparisons = await BenchmarkService.compareUserToIndustryBenchmarks('test-user-123');

      expect(comparisons.length).toBeGreaterThan(0);
      
      for (const comparison of comparisons) {
        expect(comparison.gapAnalysis).toBeDefined();
        expect(comparison.gapAnalysis.timeToTarget).toBeGreaterThan(0);
        expect(comparison.gapAnalysis.difficultyLevel).toMatch(/easy|moderate|challenging|difficult/);
        expect(comparison.gapAnalysis.keyImprovementAreas).toBeDefined();
        expect(comparison.gapAnalysis.keyImprovementAreas.length).toBeGreaterThan(0);
      }
    });
  });

  describe('error handling', () => {
    it('should handle Firebase errors gracefully', async () => {
      mockUserProgressService.getUserProgress.mockRejectedValue(new Error('Firebase error'));

      await expect(
        BenchmarkService.compareUserToIndustryBenchmarks('test-user-123')
      ).rejects.toThrow('Firebase error');
    });

    it('should handle malformed user progress data', async () => {
      const malformedProgress = {
        userId: 'test-user-123',
        skillLevels: new Map([
          ['InvalidSkill', {
            skillId: 'InvalidSkill',
            skillName: 'InvalidSkill',
            currentLevel: -1, // Invalid level
            experiencePoints: -100, // Invalid experience
            competencyAreas: [],
            industryBenchmark: {
              industryAverage: 0,
              experienceLevel: 'unknown',
              percentile: 0,
              lastUpdated: new Date()
            },
            verificationStatus: 'pending',
            progressHistory: [],
            trendDirection: 'stable',
            lastUpdated: new Date()
          }]
        ]),
        learningVelocity: 0,
        codeQualityTrend: {
          direction: 'stable',
          changePercentage: 0,
          timeframe: '30d',
          dataPoints: 0
        },
        challengesCompleted: [],
        peerInteractions: [],
        lastAnalysisDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      } as UserProgress;

      mockUserProgressService.getUserProgress.mockResolvedValue(malformedProgress);

      const comparisons = await BenchmarkService.compareUserToIndustryBenchmarks('test-user-123');

      // Should handle gracefully and return empty array for unknown skills
      expect(comparisons).toHaveLength(0);
    });
  });
});