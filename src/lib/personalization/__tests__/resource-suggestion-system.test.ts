/**
 * @fileOverview Unit tests for ResourceSuggestionSystem
 */

import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { ResourceSuggestionSystem } from '../resource-suggestion-system';
import {
  ResourceContext,
  LearningStyle,
  PersonalizationMetrics,
  ResourceSuggestion
} from '@/types/personalization';
import { SkillLevel } from '@/types/analytics';
import { PersonalizationDataService } from '@/lib/firebase/personalization';
import { UserProgressService } from '@/lib/firebase/analytics';

// Mock Firebase services
vi.mock('@/lib/firebase/personalization');
vi.mock('@/lib/firebase/analytics');

const mockPersonalizationDataService = PersonalizationDataService as {
  getLearningStyle: Mock;
  getPersonalizationMetrics: Mock;
  saveResourceSuggestion: Mock;
  updateResourceSuggestionStatus: Mock;
  savePersonalizationMetrics: Mock;
  getPersonalizationMetrics: Mock;
};

const mockUserProgressService = UserProgressService as {
  getUserProgress: Mock;
};

describe('ResourceSuggestionSystem', () => {
  const mockUserId = 'test-user-123';
  
  const mockSkillLevel: SkillLevel = {
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
    progressHistory: [],
    trendDirection: 'improving',
    lastUpdated: new Date()
  };

  const mockResourceContext: ResourceContext = {
    userId: mockUserId,
    strugglingAreas: ['JavaScript', 'testing'],
    skillLevels: new Map([['JavaScript', mockSkillLevel]]),
    recentInsights: [],
    learningGoals: ['Improve code quality'],
    timeAvailable: 60,
    preferredResourceTypes: ['tutorial', 'documentation'],
    currentProject: 'web-app'
  };

  const mockLearningStyle: LearningStyle = {
    userId: mockUserId,
    preferredFeedbackType: 'detailed',
    learningPace: 'moderate',
    skillFocus: 'balanced',
    challengePreference: 'incremental',
    interactionStyle: 'independent',
    motivationFactors: [],
    adaptationHistory: [],
    lastUpdated: new Date()
  };

  const mockPersonalizationMetrics: PersonalizationMetrics = {
    userId: mockUserId,
    adaptationAccuracy: 0.7,
    recommendationAcceptanceRate: 0.6,
    learningVelocityImprovement: 0.1,
    engagementScore: 0.8,
    satisfactionScore: 0.75,
    skillProgressionRate: 0.2,
    retentionRate: 0.9,
    lastCalculated: new Date()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockPersonalizationDataService.getLearningStyle.mockResolvedValue(mockLearningStyle);
    mockPersonalizationDataService.getPersonalizationMetrics.mockResolvedValue(mockPersonalizationMetrics);
    mockPersonalizationDataService.saveResourceSuggestion.mockResolvedValue(undefined);
    mockPersonalizationDataService.updateResourceSuggestionStatus.mockResolvedValue(undefined);
    mockPersonalizationDataService.savePersonalizationMetrics.mockResolvedValue(undefined);
    mockUserProgressService.getUserProgress.mockResolvedValue(null);
  });

  describe('generateResourceSuggestions', () => {
    it('should generate resource suggestions for struggling areas', async () => {
      const suggestions = await ResourceSuggestionSystem.generateResourceSuggestions(mockResourceContext);

      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions[0].userId).toBe(mockUserId);
      expect(suggestions[0].skillsAddressed).toContain('JavaScript');
      expect(suggestions[0].personalizedReason).toContain('struggling');
    });

    it('should return empty array when no struggling areas', async () => {
      const contextWithoutStruggles: ResourceContext = {
        ...mockResourceContext,
        strugglingAreas: []
      };

      const suggestions = await ResourceSuggestionSystem.generateResourceSuggestions(contextWithoutStruggles);

      expect(suggestions).toEqual([]);
    });

    it('should limit suggestions to maximum per day', async () => {
      const contextWithManyAreas: ResourceContext = {
        ...mockResourceContext,
        strugglingAreas: Array(20).fill('JavaScript') // Many struggling areas
      };

      const suggestions = await ResourceSuggestionSystem.generateResourceSuggestions(contextWithManyAreas);

      expect(suggestions.length).toBeLessThanOrEqual(8); // Should be limited
    });

    it('should save suggestions to database', async () => {
      await ResourceSuggestionSystem.generateResourceSuggestions(mockResourceContext);

      expect(mockPersonalizationDataService.saveResourceSuggestion).toHaveBeenCalled();
    });

    it('should sort suggestions by relevance score', async () => {
      const suggestions = await ResourceSuggestionSystem.generateResourceSuggestions(mockResourceContext);

      for (let i = 1; i < suggestions.length; i++) {
        expect(suggestions[i-1].relevanceScore).toBeGreaterThanOrEqual(suggestions[i].relevanceScore);
      }
    });

    it('should adjust time estimates based on learning pace', async () => {
      const fastLearningStyle: LearningStyle = {
        ...mockLearningStyle,
        learningPace: 'fast'
      };
      mockPersonalizationDataService.getLearningStyle.mockResolvedValue(fastLearningStyle);

      const suggestions = await ResourceSuggestionSystem.generateResourceSuggestions(mockResourceContext);

      // Fast learners should get shorter time estimates
      expect(suggestions[0].estimatedTime).toBeLessThan(120); // Base time would be higher
    });

    it('should handle missing learning style gracefully', async () => {
      mockPersonalizationDataService.getLearningStyle.mockResolvedValue(null);

      const suggestions = await ResourceSuggestionSystem.generateResourceSuggestions(mockResourceContext);

      expect(suggestions.length).toBeGreaterThan(0);
    });

    it('should handle missing metrics gracefully', async () => {
      mockPersonalizationDataService.getPersonalizationMetrics.mockResolvedValue(null);

      const suggestions = await ResourceSuggestionSystem.generateResourceSuggestions(mockResourceContext);

      expect(suggestions.length).toBeGreaterThan(0);
    });

    it('should handle errors gracefully', async () => {
      mockPersonalizationDataService.getLearningStyle.mockRejectedValue(new Error('Service error'));

      await expect(ResourceSuggestionSystem.generateResourceSuggestions(mockResourceContext))
        .rejects.toThrow('Service error');
    });
  });

  describe('trackResourceUsage', () => {
    const suggestionId = 'suggestion-123';

    it('should update resource suggestion status when viewed', async () => {
      const interaction = {
        viewed: true,
        clicked: false,
        completed: false,
        timeSpent: 5,
        helpful: true,
        rating: 4
      };

      await ResourceSuggestionSystem.trackResourceUsage(suggestionId, mockUserId, interaction);

      expect(mockPersonalizationDataService.updateResourceSuggestionStatus).toHaveBeenCalledWith(
        suggestionId,
        expect.objectContaining({
          viewedAt: expect.any(Date),
          userRating: 4
        })
      );
    });

    it('should update resource suggestion status when completed', async () => {
      const interaction = {
        viewed: true,
        clicked: true,
        completed: true,
        timeSpent: 30,
        helpful: true,
        rating: 5
      };

      await ResourceSuggestionSystem.trackResourceUsage(suggestionId, mockUserId, interaction);

      expect(mockPersonalizationDataService.updateResourceSuggestionStatus).toHaveBeenCalledWith(
        suggestionId,
        expect.objectContaining({
          viewedAt: expect.any(Date),
          completedAt: expect.any(Date),
          userRating: 5
        })
      );
    });

    it('should update personalization metrics', async () => {
      const interaction = {
        viewed: true,
        clicked: true,
        completed: false,
        timeSpent: 15,
        helpful: true,
        rating: 3
      };

      await ResourceSuggestionSystem.trackResourceUsage(suggestionId, mockUserId, interaction);

      expect(mockPersonalizationDataService.savePersonalizationMetrics).toHaveBeenCalled();
    });

    it('should handle missing metrics when updating', async () => {
      mockPersonalizationDataService.getPersonalizationMetrics.mockResolvedValue(null);

      const interaction = {
        viewed: true,
        clicked: true,
        completed: false,
        timeSpent: 10,
        helpful: true
      };

      // Should not throw error
      await expect(ResourceSuggestionSystem.trackResourceUsage(suggestionId, mockUserId, interaction))
        .resolves.not.toThrow();
    });

    it('should handle errors gracefully', async () => {
      mockPersonalizationDataService.updateResourceSuggestionStatus.mockRejectedValue(new Error('Update error'));

      const interaction = {
        viewed: true,
        clicked: false,
        completed: false,
        timeSpent: 5,
        helpful: true
      };

      await expect(ResourceSuggestionSystem.trackResourceUsage(suggestionId, mockUserId, interaction))
        .rejects.toThrow('Update error');
    });
  });

  describe('getContextualRecommendations', () => {
    it('should analyze code and suggest resources for detected skills', async () => {
      const codeContext = 'function test() { expect(result).toBe(true); }';
      
      const suggestions = await ResourceSuggestionSystem.getContextualRecommendations(
        mockUserId,
        codeContext,
        'testing-project'
      );

      expect(suggestions.length).toBeGreaterThan(0);
    });

    it('should return empty array when no struggling areas detected', async () => {
      const codeContext = 'console.log("hello");';
      
      // Mock user progress to show high skill levels
      const mockUserProgress = {
        userId: mockUserId,
        skillLevels: new Map([
          ['JavaScript', { ...mockSkillLevel, currentLevel: 4 }]
        ]),
        learningVelocity: 0.5,
        codeQualityTrend: { direction: 'improving', changePercentage: 15, timeframe: '30d', dataPoints: 10 },
        challengesCompleted: [],
        peerInteractions: [],
        lastAnalysisDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      mockUserProgressService.getUserProgress.mockResolvedValue(mockUserProgress);

      const suggestions = await ResourceSuggestionSystem.getContextualRecommendations(
        mockUserId,
        codeContext
      );

      expect(suggestions).toEqual([]);
    });

    it('should handle React code context', async () => {
      const reactCode = 'import React from "react"; function Component() { return <div>Hello</div>; }';
      
      const suggestions = await ResourceSuggestionSystem.getContextualRecommendations(
        mockUserId,
        reactCode,
        'react-app'
      );

      expect(suggestions.length).toBeGreaterThan(0);
    });

    it('should handle async JavaScript code', async () => {
      const asyncCode = 'async function fetchData() { const result = await fetch("/api"); return result.json(); }';
      
      const suggestions = await ResourceSuggestionSystem.getContextualRecommendations(
        mockUserId,
        asyncCode
      );

      expect(suggestions.length).toBeGreaterThan(0);
    });

    it('should handle errors gracefully', async () => {
      mockUserProgressService.getUserProgress.mockRejectedValue(new Error('Service error'));

      const suggestions = await ResourceSuggestionSystem.getContextualRecommendations(
        mockUserId,
        'test code'
      );

      expect(suggestions).toEqual([]);
    });
  });

  describe('generateEmergencyResources', () => {
    it('should generate emergency resources for critical areas', async () => {
      const criticalAreas = ['security', 'performance'];
      
      const suggestions = await ResourceSuggestionSystem.generateEmergencyResources(
        mockUserId,
        criticalAreas,
        'critical'
      );

      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions[0].title).toContain('🚨');
      expect(suggestions[0].urgency).toBe('critical');
      expect(suggestions[0].personalizedReason).toContain('Critical skill gap');
    });

    it('should prioritize quick, high-impact resources', async () => {
      const criticalAreas = ['JavaScript'];
      
      const suggestions = await ResourceSuggestionSystem.generateEmergencyResources(
        mockUserId,
        criticalAreas,
        'high'
      );

      // Should only include resources with <= 60 minutes and high rating
      suggestions.forEach(suggestion => {
        expect(suggestion.estimatedTime).toBeLessThanOrEqual(60);
      });
    });

    it('should limit to 2 resources per area', async () => {
      const criticalAreas = ['JavaScript'];
      
      const suggestions = await ResourceSuggestionSystem.generateEmergencyResources(
        mockUserId,
        criticalAreas,
        'high'
      );

      expect(suggestions.length).toBeLessThanOrEqual(2);
    });

    it('should handle unknown skill areas gracefully', async () => {
      const criticalAreas = ['unknown-skill'];
      
      const suggestions = await ResourceSuggestionSystem.generateEmergencyResources(
        mockUserId,
        criticalAreas,
        'high'
      );

      expect(suggestions).toEqual([]);
    });

    it('should handle errors gracefully', async () => {
      mockPersonalizationDataService.getLearningStyle.mockRejectedValue(new Error('Service error'));

      const suggestions = await ResourceSuggestionSystem.generateEmergencyResources(
        mockUserId,
        ['JavaScript'],
        'high'
      );

      expect(suggestions).toEqual([]);
    });
  });

  describe('resource filtering and scoring', () => {
    it('should filter resources by preferred types', async () => {
      const contextWithPreferences: ResourceContext = {
        ...mockResourceContext,
        preferredResourceTypes: ['tutorial'],
        strugglingAreas: ['JavaScript']
      };

      const suggestions = await ResourceSuggestionSystem.generateResourceSuggestions(contextWithPreferences);

      // Should prefer tutorials but may include highly rated resources of other types
      const tutorialSuggestions = suggestions.filter(s => s.resourceType === 'tutorial');
      expect(tutorialSuggestions.length).toBeGreaterThan(0);
    });

    it('should filter resources by time availability', async () => {
      const contextWithLimitedTime: ResourceContext = {
        ...mockResourceContext,
        timeAvailable: 30, // Only 30 minutes available
        strugglingAreas: ['JavaScript']
      };

      const suggestions = await ResourceSuggestionSystem.generateResourceSuggestions(contextWithLimitedTime);

      // All suggestions should fit within time constraints (with some buffer)
      suggestions.forEach(suggestion => {
        expect(suggestion.estimatedTime).toBeLessThanOrEqual(45); // 30 * 1.5 buffer
      });
    });

    it('should adapt to visual learning preferences', async () => {
      const visualLearningStyle: LearningStyle = {
        ...mockLearningStyle,
        preferredFeedbackType: 'visual'
      };
      mockPersonalizationDataService.getLearningStyle.mockResolvedValue(visualLearningStyle);

      const suggestions = await ResourceSuggestionSystem.generateResourceSuggestions(mockResourceContext);

      // Should prefer video, interactive, or tool resources
      const visualResources = suggestions.filter(s => 
        s.resourceType === 'tool' || 
        s.description.includes('interactive') ||
        s.description.includes('video')
      );
      expect(visualResources.length).toBeGreaterThan(0);
    });

    it('should calculate relevance scores correctly', async () => {
      const suggestions = await ResourceSuggestionSystem.generateResourceSuggestions(mockResourceContext);

      suggestions.forEach(suggestion => {
        expect(suggestion.relevanceScore).toBeGreaterThan(0);
        expect(suggestion.relevanceScore).toBeLessThanOrEqual(1);
      });
    });

    it('should generate personalized reasons', async () => {
      const suggestions = await ResourceSuggestionSystem.generateResourceSuggestions(mockResourceContext);

      suggestions.forEach(suggestion => {
        expect(suggestion.personalizedReason).toBeDefined();
        expect(suggestion.personalizedReason.length).toBeGreaterThan(0);
        expect(suggestion.personalizedReason).toContain(suggestion.skillsAddressed[0]);
      });
    });

    it('should determine appropriate urgency levels', async () => {
      const contextWithCriticalAreas: ResourceContext = {
        ...mockResourceContext,
        strugglingAreas: ['security', 'performance', 'testing', 'algorithms'] // Many areas including critical ones
      };

      const suggestions = await ResourceSuggestionSystem.generateResourceSuggestions(contextWithCriticalAreas);

      const highUrgencySuggestions = suggestions.filter(s => s.urgency === 'high');
      expect(highUrgencySuggestions.length).toBeGreaterThan(0);
    });
  });
});