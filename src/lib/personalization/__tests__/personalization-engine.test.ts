/**
 * @fileOverview Unit tests for PersonalizationEngine
 */

import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { PersonalizationEngine } from '../personalization-engine';
import {
  LearningPattern,
  LearningStyle,
  AdaptationContext,
  PersonalizationMetrics
} from '@/types/personalization';
import {
  UserProgress,
  AnalyticsData,
  SkillLevel
} from '@/types/analytics';
import { PersonalizationDataService } from '@/lib/firebase/personalization';
import { UserProgressService, AnalyticsDataService } from '@/lib/firebase/analytics';

// Mock Firebase services
vi.mock('@/lib/firebase/personalization');
vi.mock('@/lib/firebase/analytics');

const mockPersonalizationDataService = PersonalizationDataService as {
  getLearningStyle: Mock;
  saveLearningStyle: Mock;
  saveLearningPattern: Mock;
  getPersonalizationMetrics: Mock;
  savePersonalizationMetrics: Mock;
  saveResourceSuggestion: Mock;
  saveChallengeRecommendation: Mock;
};

const mockUserProgressService = UserProgressService as {
  getUserProgress: Mock;
};

const mockAnalyticsDataService = AnalyticsDataService as {
  getRecentAnalytics: Mock;
};

describe('PersonalizationEngine', () => {
  const mockUserId = 'test-user-123';
  
  const mockUserProgress: UserProgress = {
    userId: mockUserId,
    skillLevels: new Map([
      ['JavaScript', {
        skillId: 'JavaScript',
        skillName: 'JavaScript',
        currentLevel: 2,
        experiencePoints: 150,
        competencyAreas: [],
        industryBenchmark: {
          industryAverage: 50,
          experienceLevel: 'intermediate',
          percentile: 60,
          lastUpdated: new Date()
        },
        verificationStatus: 'verified',
        progressHistory: [
          {
            timestamp: new Date('2024-01-01'),
            level: 1,
            experiencePoints: 50
          },
          {
            timestamp: new Date('2024-01-15'),
            level: 2,
            experiencePoints: 150
          }
        ],
        trendDirection: 'improving',
        lastUpdated: new Date()
      }]
    ]),
    learningVelocity: 0.5,
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
  };

  const mockAnalyticsData: AnalyticsData[] = [
    {
      sessionId: 'session-1',
      userId: mockUserId,
      codeSubmission: {
        submissionId: 'sub-1',
        code: 'function test() { return "hello"; }',
        language: 'JavaScript',
        context: 'practice',
        metrics: {
          linesOfCode: 1,
          complexity: 1,
          maintainability: 80
        },
        timestamp: new Date('2024-01-01')
      },
      aiAnalysis: {
        analysisId: 'analysis-1',
        codeQuality: 75,
        efficiency: 80,
        creativity: 60,
        bestPractices: 70,
        suggestions: ['Consider adding error handling'],
        detectedSkills: ['JavaScript'],
        improvementAreas: ['error-handling'],
        processingTime: 1500
      },
      skillImprovements: [],
      learningInsights: [],
      benchmarkComparisons: [],
      timestamp: new Date('2024-01-01'),
      processingStatus: 'completed'
    },
    {
      sessionId: 'session-2',
      userId: mockUserId,
      codeSubmission: {
        submissionId: 'sub-2',
        code: 'const arr = [1,2,3]; arr.map(x => x * 2);',
        language: 'JavaScript',
        context: 'practice',
        metrics: {
          linesOfCode: 1,
          complexity: 2,
          maintainability: 85
        },
        timestamp: new Date('2024-01-02')
      },
      aiAnalysis: {
        analysisId: 'analysis-2',
        codeQuality: 85,
        efficiency: 90,
        creativity: 75,
        bestPractices: 80,
        suggestions: ['Good use of functional programming'],
        detectedSkills: ['JavaScript', 'functional-programming'],
        improvementAreas: [],
        processingTime: 1200
      },
      skillImprovements: [],
      learningInsights: [],
      benchmarkComparisons: [],
      timestamp: new Date('2024-01-02'),
      processingStatus: 'completed'
    }
  ];

  const mockLearningStyle: LearningStyle = {
    userId: mockUserId,
    preferredFeedbackType: 'detailed',
    learningPace: 'moderate',
    skillFocus: 'balanced',
    challengePreference: 'incremental',
    interactionStyle: 'independent',
    motivationFactors: [
      {
        factor: 'learning',
        strength: 0.8,
        evidence: ['Consistent practice', 'Asks questions']
      }
    ],
    adaptationHistory: [],
    lastUpdated: new Date()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockUserProgressService.getUserProgress.mockResolvedValue(mockUserProgress);
    mockAnalyticsDataService.getRecentAnalytics.mockResolvedValue(mockAnalyticsData);
    mockPersonalizationDataService.getLearningStyle.mockResolvedValue(mockLearningStyle);
    mockPersonalizationDataService.saveLearningPattern.mockResolvedValue(undefined);
    mockPersonalizationDataService.saveLearningStyle.mockResolvedValue(undefined);
    mockPersonalizationDataService.getPersonalizationMetrics.mockResolvedValue(null);
    mockPersonalizationDataService.savePersonalizationMetrics.mockResolvedValue(undefined);
    mockPersonalizationDataService.saveResourceSuggestion.mockResolvedValue(undefined);
    mockPersonalizationDataService.saveChallengeRecommendation.mockResolvedValue(undefined);
  });

  describe('analyzeUserPatterns', () => {
    it('should detect coding style patterns from analytics data', async () => {
      const patterns = await PersonalizationEngine.analyzeUserPatterns(mockUserId);

      expect(patterns).toHaveLength(5); // All pattern types
      
      const codingStylePattern = patterns.find(p => p.patternType === 'coding_style');
      expect(codingStylePattern).toBeDefined();
      expect(codingStylePattern?.confidence).toBeGreaterThan(0);
      expect(codingStylePattern?.description).toContain('coding style');
    });

    it('should detect learning pace patterns', async () => {
      const patterns = await PersonalizationEngine.analyzeUserPatterns(mockUserId);

      const learningPacePattern = patterns.find(p => p.patternType === 'learning_pace');
      expect(learningPacePattern).toBeDefined();
      expect(learningPacePattern?.description).toContain('learning pace');
    });

    it('should detect skill preference patterns', async () => {
      const patterns = await PersonalizationEngine.analyzeUserPatterns(mockUserId);

      const skillPreferencePattern = patterns.find(p => p.patternType === 'skill_preference');
      expect(skillPreferencePattern).toBeDefined();
    });

    it('should return empty array when no user progress exists', async () => {
      mockUserProgressService.getUserProgress.mockResolvedValue(null);

      const patterns = await PersonalizationEngine.analyzeUserPatterns(mockUserId);

      expect(patterns).toEqual([]);
    });

    it('should return empty array when no analytics data exists', async () => {
      mockAnalyticsDataService.getRecentAnalytics.mockResolvedValue([]);

      const patterns = await PersonalizationEngine.analyzeUserPatterns(mockUserId);

      expect(patterns).toEqual([]);
    });

    it('should save detected patterns to database', async () => {
      await PersonalizationEngine.analyzeUserPatterns(mockUserId);

      expect(mockPersonalizationDataService.saveLearningPattern).toHaveBeenCalledTimes(5);
    });

    it('should update learning style based on patterns', async () => {
      await PersonalizationEngine.analyzeUserPatterns(mockUserId);

      expect(mockPersonalizationDataService.saveLearningStyle).toHaveBeenCalled();
    });
  });

  describe('generateAdaptiveFeedback', () => {
    const mockContext: AdaptationContext = {
      userId: mockUserId,
      currentSkillLevel: 2,
      recentPerformance: [75, 80, 70],
      strugglingAreas: ['error-handling'],
      excellingAreas: ['functional-programming'],
      timeSpentLearning: 30,
      preferredLearningTime: ['afternoon'],
      lastInteractionTime: new Date()
    };

    it('should generate adaptive feedback with personalized tone', async () => {
      const originalFeedback = 'Your code looks good. Consider adding error handling.';

      const adaptiveFeedback = await PersonalizationEngine.generateAdaptiveFeedback(
        mockUserId,
        originalFeedback,
        mockContext
      );

      expect(adaptiveFeedback.userId).toBe(mockUserId);
      expect(adaptiveFeedback.originalFeedback).toBe(originalFeedback);
      expect(adaptiveFeedback.adaptedFeedback).toBeDefined();
      expect(adaptiveFeedback.tone).toBeDefined();
      expect(adaptiveFeedback.detailLevel).toBeDefined();
    });

    it('should adapt feedback for struggling users', async () => {
      const strugglingContext = {
        ...mockContext,
        recentPerformance: [40, 45, 50] // Low performance
      };

      const adaptiveFeedback = await PersonalizationEngine.generateAdaptiveFeedback(
        mockUserId,
        'Your code needs improvement.',
        strugglingContext
      );

      expect(adaptiveFeedback.tone).toBe('encouraging');
      expect(adaptiveFeedback.adaptedFeedback).toContain('Great effort!');
    });

    it('should provide detailed feedback for users who prefer it', async () => {
      const detailedLearningStyle = {
        ...mockLearningStyle,
        preferredFeedbackType: 'detailed' as const
      };
      mockPersonalizationDataService.getLearningStyle.mockResolvedValue(detailedLearningStyle);

      const adaptiveFeedback = await PersonalizationEngine.generateAdaptiveFeedback(
        mockUserId,
        'Good work.',
        mockContext
      );

      expect(adaptiveFeedback.detailLevel).toBe('high');
    });

    it('should provide concise feedback for users who prefer it', async () => {
      const conciseLearningStyle = {
        ...mockLearningStyle,
        preferredFeedbackType: 'concise' as const
      };
      mockPersonalizationDataService.getLearningStyle.mockResolvedValue(conciseLearningStyle);

      const longFeedback = 'This is a very long feedback message that goes into great detail about various aspects of the code and provides extensive explanations about best practices and potential improvements.';

      const adaptiveFeedback = await PersonalizationEngine.generateAdaptiveFeedback(
        mockUserId,
        longFeedback,
        mockContext
      );

      expect(adaptiveFeedback.detailLevel).toBe('low');
      expect(adaptiveFeedback.adaptedFeedback.length).toBeLessThan(longFeedback.length);
    });

    it('should handle missing learning style gracefully', async () => {
      mockPersonalizationDataService.getLearningStyle.mockResolvedValue(null);

      const adaptiveFeedback = await PersonalizationEngine.generateAdaptiveFeedback(
        mockUserId,
        'Test feedback',
        mockContext
      );

      expect(adaptiveFeedback.adaptedFeedback).toBe('Test feedback');
      expect(adaptiveFeedback.adaptations).toHaveLength(0);
    });
  });

  describe('generateResourceSuggestions', () => {
    it('should generate resource suggestions for struggling areas', async () => {
      const strugglingAreas = ['error-handling', 'testing'];
      const suggestions = await PersonalizationEngine.generateResourceSuggestions(
        mockUserId,
        strugglingAreas,
        mockContext
      );

      expect(suggestions).toHaveLength(strugglingAreas.length * 2); // Multiple suggestions per area
      expect(suggestions[0].userId).toBe(mockUserId);
      expect(suggestions[0].urgency).toBeDefined();
      expect(suggestions[0].personalizedReason).toContain('struggling');
    });

    it('should return empty array when no struggling areas', async () => {
      const suggestions = await PersonalizationEngine.generateResourceSuggestions(
        mockUserId,
        [],
        mockContext
      );

      expect(suggestions).toEqual([]);
    });

    it('should save suggestions to database', async () => {
      const strugglingAreas = ['JavaScript'];
      await PersonalizationEngine.generateResourceSuggestions(
        mockUserId,
        strugglingAreas,
        mockContext
      );

      expect(mockPersonalizationDataService.saveResourceSuggestion).toHaveBeenCalled();
    });

    it('should limit suggestions to max recommendations per day', async () => {
      const manyAreas = Array(20).fill('JavaScript'); // Many struggling areas
      const suggestions = await PersonalizationEngine.generateResourceSuggestions(
        mockUserId,
        manyAreas,
        mockContext
      );

      expect(suggestions.length).toBeLessThanOrEqual(10); // Default max per day
    });
  });

  describe('generateChallengeRecommendations', () => {
    const mockContext: AdaptationContext = {
      userId: mockUserId,
      currentSkillLevel: 3,
      recentPerformance: [85, 90, 88],
      strugglingAreas: [],
      excellingAreas: ['JavaScript', 'React'],
      timeSpentLearning: 45,
      preferredLearningTime: ['morning'],
      lastInteractionTime: new Date()
    };

    it('should generate challenge recommendations for excelling areas', async () => {
      const excellingAreas = ['JavaScript', 'React'];
      const recommendations = await PersonalizationEngine.generateChallengeRecommendations(
        mockUserId,
        excellingAreas,
        mockContext
      );

      expect(recommendations).toHaveLength(excellingAreas.length);
      expect(recommendations[0].userId).toBe(mockUserId);
      expect(recommendations[0].difficulty).toBeDefined();
      expect(recommendations[0].reasoning).toContain('excelling');
    });

    it('should return empty array when no excelling areas', async () => {
      const recommendations = await PersonalizationEngine.generateChallengeRecommendations(
        mockUserId,
        [],
        mockContext
      );

      expect(recommendations).toEqual([]);
    });

    it('should save recommendations to database', async () => {
      const excellingAreas = ['JavaScript'];
      await PersonalizationEngine.generateChallengeRecommendations(
        mockUserId,
        excellingAreas,
        mockContext
      );

      expect(mockPersonalizationDataService.saveChallengeRecommendation).toHaveBeenCalled();
    });

    it('should adjust difficulty based on current skill level', async () => {
      const expertContext = { ...mockContext, currentSkillLevel: 4 };
      const recommendations = await PersonalizationEngine.generateChallengeRecommendations(
        mockUserId,
        ['JavaScript'],
        expertContext
      );

      expect(recommendations[0].difficulty).toBe('expert');
    });
  });

  describe('updatePersonalizationMetrics', () => {
    it('should create new metrics when none exist', async () => {
      mockPersonalizationDataService.getPersonalizationMetrics.mockResolvedValue(null);

      const metrics = await PersonalizationEngine.updatePersonalizationMetrics(mockUserId, {
        recommendationAccepted: true,
        userSatisfaction: 4
      });

      expect(metrics.userId).toBe(mockUserId);
      expect(metrics.recommendationAcceptanceRate).toBeGreaterThan(0);
      expect(metrics.satisfactionScore).toBeGreaterThan(0);
      expect(mockPersonalizationDataService.savePersonalizationMetrics).toHaveBeenCalled();
    });

    it('should update existing metrics', async () => {
      const existingMetrics: PersonalizationMetrics = {
        userId: mockUserId,
        adaptationAccuracy: 0.7,
        recommendationAcceptanceRate: 0.6,
        learningVelocityImprovement: 0.1,
        engagementScore: 0.8,
        satisfactionScore: 0.75,
        skillProgressionRate: 0.2,
        retentionRate: 0.9,
        lastCalculated: new Date('2024-01-01')
      };

      mockPersonalizationDataService.getPersonalizationMetrics.mockResolvedValue(existingMetrics);

      const updatedMetrics = await PersonalizationEngine.updatePersonalizationMetrics(mockUserId, {
        recommendationAccepted: true,
        feedbackEffective: true,
        userSatisfaction: 5
      });

      expect(updatedMetrics.recommendationAcceptanceRate).toBeGreaterThan(existingMetrics.recommendationAcceptanceRate);
      expect(updatedMetrics.adaptationAccuracy).toBeGreaterThan(existingMetrics.adaptationAccuracy);
      expect(updatedMetrics.satisfactionScore).toBeGreaterThan(existingMetrics.satisfactionScore);
    });

    it('should handle interaction data correctly', async () => {
      const metrics = await PersonalizationEngine.updatePersonalizationMetrics(mockUserId, {
        recommendationAccepted: false,
        feedbackEffective: false,
        challengeCompleted: true,
        resourceUsed: true,
        userSatisfaction: 2
      });

      expect(metrics.engagementScore).toBeGreaterThan(0.5); // Should increase due to challenge completion
      expect(mockPersonalizationDataService.savePersonalizationMetrics).toHaveBeenCalledWith(metrics);
    });
  });

  describe('error handling', () => {
    it('should handle database errors gracefully in analyzeUserPatterns', async () => {
      mockUserProgressService.getUserProgress.mockRejectedValue(new Error('Database error'));

      await expect(PersonalizationEngine.analyzeUserPatterns(mockUserId)).rejects.toThrow('Database error');
    });

    it('should handle errors in generateAdaptiveFeedback', async () => {
      mockPersonalizationDataService.getLearningStyle.mockRejectedValue(new Error('Service error'));

      await expect(PersonalizationEngine.generateAdaptiveFeedback(
        mockUserId,
        'Test feedback',
        mockContext
      )).rejects.toThrow('Service error');
    });

    it('should handle errors in resource suggestions', async () => {
      mockPersonalizationDataService.saveResourceSuggestion.mockRejectedValue(new Error('Save error'));

      await expect(PersonalizationEngine.generateResourceSuggestions(
        mockUserId,
        ['JavaScript'],
        mockContext
      )).rejects.toThrow('Save error');
    });
  });
});

const mockContext: AdaptationContext = {
  userId: 'test-user-123',
  currentSkillLevel: 2,
  recentPerformance: [75, 80, 70],
  strugglingAreas: ['error-handling'],
  excellingAreas: ['functional-programming'],
  timeSpentLearning: 30,
  preferredLearningTime: ['afternoon'],
  lastInteractionTime: new Date()
};