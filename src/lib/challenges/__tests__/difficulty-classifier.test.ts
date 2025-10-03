// Unit tests for Challenge Difficulty Classification System

import { describe, it, expect } from 'vitest';
import { 
  ChallengeDifficultyClassifier, 
  DifficultyMetrics, 
  DifficultyLevel 
} from '../difficulty-classifier';
import { SkillLevel } from '@/types/analytics';

describe('ChallengeDifficultyClassifier', () => {
  describe('classifyDifficulty', () => {
    it('should classify simple challenges as beginner', () => {
      const metrics: DifficultyMetrics = {
        conceptComplexity: 2,
        codeLength: 20,
        algorithmicComplexity: 1,
        prerequisiteCount: 1,
        timeComplexity: 'O(1)',
        domainSpecificity: 1
      };

      const result = ChallengeDifficultyClassifier.classifyDifficulty(metrics);

      expect(result.level).toBe('beginner');
      expect(result.score).toBeLessThan(25);
      expect(result.recommendedSkillLevel).toBeLessThanOrEqual(3);
      expect(result.estimatedDuration).toBeLessThan(30);
    });

    it('should classify complex challenges as expert', () => {
      const metrics: DifficultyMetrics = {
        conceptComplexity: 9,
        codeLength: 300,
        algorithmicComplexity: 10,
        prerequisiteCount: 8,
        timeComplexity: 'O(2^n)',
        domainSpecificity: 8
      };

      const result = ChallengeDifficultyClassifier.classifyDifficulty(metrics);

      expect(result.level).toBe('expert');
      expect(result.score).toBeGreaterThan(75);
      expect(result.recommendedSkillLevel).toBeGreaterThanOrEqual(8);
      expect(result.estimatedDuration).toBeGreaterThan(60);
    });

    it('should classify intermediate challenges correctly', () => {
      const metrics: DifficultyMetrics = {
        conceptComplexity: 5,
        codeLength: 80,
        algorithmicComplexity: 4,
        prerequisiteCount: 3,
        timeComplexity: 'O(n)',
        domainSpecificity: 3
      };

      const result = ChallengeDifficultyClassifier.classifyDifficulty(metrics);

      expect(result.level).toBe('intermediate');
      expect(result.score).toBeGreaterThanOrEqual(25);
      expect(result.score).toBeLessThanOrEqual(50);
      expect(result.reasoning).toContain('Straightforward implementation with basic concepts');
    });

    it('should provide detailed reasoning for complex challenges', () => {
      const metrics: DifficultyMetrics = {
        conceptComplexity: 8,
        codeLength: 150,
        algorithmicComplexity: 9,
        prerequisiteCount: 6,
        timeComplexity: 'O(n²)',
        domainSpecificity: 7
      };

      const result = ChallengeDifficultyClassifier.classifyDifficulty(metrics);

      expect(result.reasoning).toContain('High conceptual complexity requiring advanced understanding');
      expect(result.reasoning).toContain('Complex algorithms and data structures required');
      expect(result.reasoning).toContain('Multiple prerequisite skills needed');
      expect(result.reasoning).toContain('Substantial implementation required');
      expect(result.reasoning).toContain('Specialized domain knowledge required');
    });
  });

  describe('isUserReadyForChallenge', () => {
    let userSkills: Map<string, SkillLevel>;

    beforeEach(() => {
      userSkills = new Map([
        ['javascript', {
          skillId: 'javascript',
          skillName: 'JavaScript',
          currentLevel: 5,
          experiencePoints: 1000,
          competencyAreas: [],
          industryBenchmark: {
            industryAverage: 4,
            experienceLevel: 'intermediate',
            percentile: 70,
            lastUpdated: new Date()
          },
          verificationStatus: 'verified',
          progressHistory: [],
          trendDirection: 'improving',
          lastUpdated: new Date()
        }],
        ['algorithms', {
          skillId: 'algorithms',
          skillName: 'Algorithms',
          currentLevel: 3,
          experiencePoints: 500,
          competencyAreas: [],
          industryBenchmark: {
            industryAverage: 3,
            experienceLevel: 'beginner',
            percentile: 50,
            lastUpdated: new Date()
          },
          verificationStatus: 'verified',
          progressHistory: [],
          trendDirection: 'stable',
          lastUpdated: new Date()
        }]
      ]);
    });

    it('should indicate user is ready for appropriate difficulty challenges', () => {
      const challengeSkills = ['javascript'];
      const difficulty: DifficultyLevel = 'intermediate';

      const result = ChallengeDifficultyClassifier.isUserReadyForChallenge(
        userSkills,
        challengeSkills,
        difficulty
      );

      expect(result.ready).toBe(true);
      expect(result.missingSkills).toHaveLength(0);
      expect(result.recommendations).toHaveLength(0);
    });

    it('should identify missing skills', () => {
      const challengeSkills = ['python', 'machine-learning'];
      const difficulty: DifficultyLevel = 'beginner';

      const result = ChallengeDifficultyClassifier.isUserReadyForChallenge(
        userSkills,
        challengeSkills,
        difficulty
      );

      expect(result.ready).toBe(false);
      expect(result.missingSkills).toContain('python');
      expect(result.missingSkills).toContain('machine-learning');
      expect(result.recommendations).toHaveLength(2);
    });

    it('should recommend skill improvement for insufficient levels', () => {
      const challengeSkills = ['algorithms'];
      const difficulty: DifficultyLevel = 'advanced'; // Requires level 6, user has level 3

      const result = ChallengeDifficultyClassifier.isUserReadyForChallenge(
        userSkills,
        challengeSkills,
        difficulty
      );

      expect(result.ready).toBe(false);
      expect(result.recommendations).toContain(
        'Improve your algorithms skills to level 6 (currently level 3)'
      );
    });
  });

  describe('suggestDifficultyForUser', () => {
    it('should suggest beginner for users with no skills', () => {
      const userSkills = new Map<string, SkillLevel>();
      const targetSkills = ['javascript'];

      const result = ChallengeDifficultyClassifier.suggestDifficultyForUser(
        userSkills,
        targetSkills
      );

      expect(result).toBe('beginner');
    });

    it('should suggest beginner for users with no relevant skills', () => {
      const userSkills = new Map([
        ['python', {
          skillId: 'python',
          skillName: 'Python',
          currentLevel: 8,
          experiencePoints: 2000,
          competencyAreas: [],
          industryBenchmark: {
            industryAverage: 5,
            experienceLevel: 'advanced',
            percentile: 90,
            lastUpdated: new Date()
          },
          verificationStatus: 'verified',
          progressHistory: [],
          trendDirection: 'improving',
          lastUpdated: new Date()
        }]
      ]);
      const targetSkills = ['javascript'];

      const result = ChallengeDifficultyClassifier.suggestDifficultyForUser(
        userSkills,
        targetSkills
      );

      expect(result).toBe('beginner');
    });

    it('should suggest appropriate difficulty based on skill levels', () => {
      const userSkills = new Map([
        ['javascript', {
          skillId: 'javascript',
          skillName: 'JavaScript',
          currentLevel: 7,
          experiencePoints: 1500,
          competencyAreas: [],
          industryBenchmark: {
            industryAverage: 5,
            experienceLevel: 'advanced',
            percentile: 80,
            lastUpdated: new Date()
          },
          verificationStatus: 'verified',
          progressHistory: [],
          trendDirection: 'improving',
          lastUpdated: new Date()
        }],
        ['algorithms', {
          skillId: 'algorithms',
          skillName: 'Algorithms',
          currentLevel: 6,
          experiencePoints: 1200,
          competencyAreas: [],
          industryBenchmark: {
            industryAverage: 4,
            experienceLevel: 'intermediate',
            percentile: 75,
            lastUpdated: new Date()
          },
          verificationStatus: 'verified',
          progressHistory: [],
          trendDirection: 'stable',
          lastUpdated: new Date()
        }]
      ]);
      const targetSkills = ['javascript', 'algorithms'];

      const result = ChallengeDifficultyClassifier.suggestDifficultyForUser(
        userSkills,
        targetSkills
      );

      expect(result).toBe('advanced');
    });
  });

  describe('adaptDifficultyBasedOnPerformance', () => {
    it('should increase difficulty for high performers', () => {
      const currentDifficulty: DifficultyLevel = 'intermediate';
      const recentScores = [90, 95, 88, 92];
      const successRate = 0.9;

      const result = ChallengeDifficultyClassifier.adaptDifficultyBasedOnPerformance(
        currentDifficulty,
        recentScores,
        successRate
      );

      expect(result).toBe('advanced');
    });

    it('should decrease difficulty for struggling users', () => {
      const currentDifficulty: DifficultyLevel = 'intermediate';
      const recentScores = [30, 45, 25, 40];
      const successRate = 0.3;

      const result = ChallengeDifficultyClassifier.adaptDifficultyBasedOnPerformance(
        currentDifficulty,
        recentScores,
        successRate
      );

      expect(result).toBe('beginner');
    });

    it('should maintain difficulty for average performance', () => {
      const currentDifficulty: DifficultyLevel = 'intermediate';
      const recentScores = [70, 65, 75, 68];
      const successRate = 0.6;

      const result = ChallengeDifficultyClassifier.adaptDifficultyBasedOnPerformance(
        currentDifficulty,
        recentScores,
        successRate
      );

      expect(result).toBe('intermediate');
    });

    it('should not change difficulty with insufficient data', () => {
      const currentDifficulty: DifficultyLevel = 'intermediate';
      const recentScores = [90, 95]; // Less than 3 scores
      const successRate = 0.9;

      const result = ChallengeDifficultyClassifier.adaptDifficultyBasedOnPerformance(
        currentDifficulty,
        recentScores,
        successRate
      );

      expect(result).toBe('intermediate');
    });

    it('should not decrease below beginner level', () => {
      const currentDifficulty: DifficultyLevel = 'beginner';
      const recentScores = [20, 15, 25, 30];
      const successRate = 0.2;

      const result = ChallengeDifficultyClassifier.adaptDifficultyBasedOnPerformance(
        currentDifficulty,
        recentScores,
        successRate
      );

      expect(result).toBe('beginner');
    });

    it('should not increase above expert level', () => {
      const currentDifficulty: DifficultyLevel = 'expert';
      const recentScores = [95, 98, 92, 96];
      const successRate = 0.95;

      const result = ChallengeDifficultyClassifier.adaptDifficultyBasedOnPerformance(
        currentDifficulty,
        recentScores,
        successRate
      );

      expect(result).toBe('expert');
    });
  });
});