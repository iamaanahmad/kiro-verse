/**
 * @fileOverview Unit tests for AdaptiveFeedbackSystem
 */

import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { AdaptiveFeedbackSystem } from '../adaptive-feedback-system';
import {
  FeedbackContext,
  FeedbackDeliveryOptions,
  LearningStyle
} from '@/types/personalization';
import { UserProgress } from '@/types/analytics';
import { PersonalizationDataService } from '@/lib/firebase/personalization';
import { UserProgressService } from '@/lib/firebase/analytics';

// Mock Firebase services
vi.mock('@/lib/firebase/personalization');
vi.mock('@/lib/firebase/analytics');

const mockPersonalizationDataService = PersonalizationDataService as {
  getLearningStyle: Mock;
  saveLearningStyle: Mock;
  getPersonalizationMetrics: Mock;
  savePersonalizationMetrics: Mock;
};

const mockUserProgressService = UserProgressService as {
  getUserProgress: Mock;
};

describe('AdaptiveFeedbackSystem', () => {
  const mockUserId = 'test-user-123';
  
  const mockFeedbackContext: FeedbackContext = {
    userId: mockUserId,
    codeSubmission: 'function test() { return "hello"; }',
    originalAIResponse: 'Your code looks good. Consider adding error handling.',
    userSkillLevel: 2,
    recentPerformance: [75, 80, 70],
    strugglingAreas: ['error-handling'],
    excellingAreas: ['functional-programming'],
    sessionContext: 'returning',
    timeOfDay: 'afternoon',
    deviceType: 'desktop'
  };

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
        evidence: ['Consistent practice']
      }
    ],
    adaptationHistory: [],
    lastUpdated: new Date()
  };

  const mockUserProgress: UserProgress = {
    userId: mockUserId,
    skillLevels: new Map(),
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

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockPersonalizationDataService.getLearningStyle.mockResolvedValue(mockLearningStyle);
    mockPersonalizationDataService.saveLearningStyle.mockResolvedValue(undefined);
    mockPersonalizationDataService.getPersonalizationMetrics.mockResolvedValue(null);
    mockPersonalizationDataService.savePersonalizationMetrics.mockResolvedValue(undefined);
    mockUserProgressService.getUserProgress.mockResolvedValue(mockUserProgress);
  });

  describe('generateAdaptiveFeedback', () => {
    it('should generate basic feedback when personalization is disabled', async () => {
      const options: FeedbackDeliveryOptions = {
        enablePersonalization: false,
        forceImmediate: false,
        includeEncouragement: true,
        includeNextSteps: true
      };

      const feedback = await AdaptiveFeedbackSystem.generateAdaptiveFeedback(
        mockFeedbackContext,
        options
      );

      expect(feedback.userId).toBe(mockUserId);
      expect(feedback.originalFeedback).toBe(mockFeedbackContext.originalAIResponse);
      expect(feedback.adaptedFeedback).toBe(mockFeedbackContext.originalAIResponse);
      expect(feedback.adaptations).toHaveLength(0);
    });

    it('should generate personalized feedback when enabled', async () => {
      const options: FeedbackDeliveryOptions = {
        enablePersonalization: true,
        forceImmediate: false,
        includeEncouragement: true,
        includeNextSteps: true
      };

      const feedback = await AdaptiveFeedbackSystem.generateAdaptiveFeedback(
        mockFeedbackContext,
        options
      );

      expect(feedback.userId).toBe(mockUserId);
      expect(feedback.originalFeedback).toBe(mockFeedbackContext.originalAIResponse);
      expect(feedback.tone).toBeDefined();
      expect(feedback.detailLevel).toBeDefined();
      expect(feedback.deliveryStyle).toBeDefined();
    });

    it('should adapt feedback for struggling users', async () => {
      const strugglingContext: FeedbackContext = {
        ...mockFeedbackContext,
        sessionContext: 'struggling',
        recentPerformance: [40, 45, 50]
      };

      const feedback = await AdaptiveFeedbackSystem.generateAdaptiveFeedback(strugglingContext);

      expect(feedback.tone).toBe('encouraging');
    });

    it('should adapt feedback for excelling users', async () => {
      const excellingContext: FeedbackContext = {
        ...mockFeedbackContext,
        sessionContext: 'excelling',
        recentPerformance: [85, 90, 88]
      };

      const feedback = await AdaptiveFeedbackSystem.generateAdaptiveFeedback(excellingContext);

      expect(feedback.tone).toBeDefined();
    });

    it('should handle first-time users appropriately', async () => {
      const firstTimeContext: FeedbackContext = {
        ...mockFeedbackContext,
        sessionContext: 'first_time'
      };

      const feedback = await AdaptiveFeedbackSystem.generateAdaptiveFeedback(firstTimeContext);

      expect(feedback.tone).toBe('encouraging');
    });

    it('should fallback to basic feedback on error', async () => {
      mockPersonalizationDataService.getLearningStyle.mockRejectedValue(new Error('Service error'));

      const feedback = await AdaptiveFeedbackSystem.generateAdaptiveFeedback(mockFeedbackContext);

      expect(feedback.adaptedFeedback).toBe(mockFeedbackContext.originalAIResponse);
      expect(feedback.adaptations).toHaveLength(0);
    });
  });

  describe('scheduleAdaptiveFeedback', () => {
    const mockAdaptiveFeedback = {
      feedbackId: 'feedback-123',
      userId: mockUserId,
      originalFeedback: 'Original feedback',
      adaptedFeedback: 'Adapted feedback',
      adaptations: [],
      deliveryStyle: 'immediate' as const,
      tone: 'conversational' as const,
      detailLevel: 'medium' as const,
      includesExamples: false,
      includesNextSteps: true,
      timestamp: new Date()
    };

    it('should return immediate delivery when forced', async () => {
      const options: FeedbackDeliveryOptions = {
        enablePersonalization: true,
        forceImmediate: true,
        includeEncouragement: true,
        includeNextSteps: true
      };

      const result = await AdaptiveFeedbackSystem.scheduleAdaptiveFeedback(
        mockAdaptiveFeedback,
        mockFeedbackContext,
        options
      );

      expect(result.deliveryDelay).toBe(0);
      expect(result.deliveryMethod).toBe('immediate');
    });

    it('should adjust timing for struggling users with slow pace', async () => {
      const strugglingContext: FeedbackContext = {
        ...mockFeedbackContext,
        sessionContext: 'struggling'
      };

      const slowLearningStyle: LearningStyle = {
        ...mockLearningStyle,
        learningPace: 'slow'
      };

      mockPersonalizationDataService.getLearningStyle.mockResolvedValue(slowLearningStyle);

      const result = await AdaptiveFeedbackSystem.scheduleAdaptiveFeedback(
        mockAdaptiveFeedback,
        strugglingContext,
        { enablePersonalization: true, forceImmediate: false, includeEncouragement: true, includeNextSteps: true }
      );

      expect(result.deliveryDelay).toBeGreaterThanOrEqual(5000);
      expect(result.deliveryMethod).toBe('in_app');
    });

    it('should provide faster feedback for excelling fast learners', async () => {
      const excellingContext: FeedbackContext = {
        ...mockFeedbackContext,
        sessionContext: 'excelling'
      };

      const fastLearningStyle: LearningStyle = {
        ...mockLearningStyle,
        learningPace: 'fast'
      };

      mockPersonalizationDataService.getLearningStyle.mockResolvedValue(fastLearningStyle);

      const result = await AdaptiveFeedbackSystem.scheduleAdaptiveFeedback(
        mockAdaptiveFeedback,
        excellingContext,
        { enablePersonalization: true, forceImmediate: false, includeEncouragement: true, includeNextSteps: true }
      );

      expect(result.deliveryDelay).toBeLessThanOrEqual(1000);
    });

    it('should adjust for mobile users', async () => {
      const mobileContext: FeedbackContext = {
        ...mockFeedbackContext,
        deviceType: 'mobile'
      };

      const result = await AdaptiveFeedbackSystem.scheduleAdaptiveFeedback(
        mockAdaptiveFeedback,
        mobileContext,
        { enablePersonalization: true, forceImmediate: false, includeEncouragement: true, includeNextSteps: true }
      );

      expect(result.deliveryDelay).toBeGreaterThan(0);
    });

    it('should be less intrusive during evening hours', async () => {
      const eveningContext: FeedbackContext = {
        ...mockFeedbackContext,
        timeOfDay: 'evening'
      };

      const result = await AdaptiveFeedbackSystem.scheduleAdaptiveFeedback(
        mockAdaptiveFeedback,
        eveningContext,
        { enablePersonalization: true, forceImmediate: false, includeEncouragement: true, includeNextSteps: true }
      );

      expect(result.deliveryMethod).toBe('in_app');
    });

    it('should handle errors gracefully', async () => {
      mockPersonalizationDataService.getLearningStyle.mockRejectedValue(new Error('Service error'));

      const result = await AdaptiveFeedbackSystem.scheduleAdaptiveFeedback(
        mockAdaptiveFeedback,
        mockFeedbackContext,
        { enablePersonalization: true, forceImmediate: false, includeEncouragement: true, includeNextSteps: true }
      );

      expect(result.deliveryDelay).toBe(0);
      expect(result.deliveryMethod).toBe('immediate');
    });
  });

  describe('processFeedbackResponse', () => {
    const feedbackId = 'feedback-123';

    it('should update learning style based on user feedback', async () => {
      const userResponse = {
        helpful: true,
        tooLong: true,
        rating: 4,
        preferredTone: 'direct' as const
      };

      await AdaptiveFeedbackSystem.processFeedbackResponse(
        feedbackId,
        mockUserId,
        userResponse
      );

      expect(mockPersonalizationDataService.saveLearningStyle).toHaveBeenCalled();
      
      const savedStyle = mockPersonalizationDataService.saveLearningStyle.mock.calls[0][0];
      expect(savedStyle.preferredFeedbackType).toBe('concise'); // Because user said it was too long
      expect(savedStyle.adaptationHistory).toHaveLength(2); // One for length, one for tone
    });

    it('should handle feedback that content is too short', async () => {
      const userResponse = {
        helpful: true,
        tooShort: true,
        rating: 3
      };

      await AdaptiveFeedbackSystem.processFeedbackResponse(
        feedbackId,
        mockUserId,
        userResponse
      );

      const savedStyle = mockPersonalizationDataService.saveLearningStyle.mock.calls[0][0];
      expect(savedStyle.preferredFeedbackType).toBe('detailed');
    });

    it('should update preferred tone based on user preference', async () => {
      const userResponse = {
        helpful: true,
        preferredTone: 'analytical' as const,
        rating: 5
      };

      await AdaptiveFeedbackSystem.processFeedbackResponse(
        feedbackId,
        mockUserId,
        userResponse
      );

      const savedStyle = mockPersonalizationDataService.saveLearningStyle.mock.calls[0][0];
      expect(savedStyle.preferredFeedbackType).toBe('detailed'); // Analytical maps to detailed
    });

    it('should handle missing learning style gracefully', async () => {
      mockPersonalizationDataService.getLearningStyle.mockResolvedValue(null);

      const userResponse = {
        helpful: false,
        rating: 2
      };

      // Should not throw error
      await expect(AdaptiveFeedbackSystem.processFeedbackResponse(
        feedbackId,
        mockUserId,
        userResponse
      )).resolves.not.toThrow();
    });

    it('should handle errors gracefully', async () => {
      mockPersonalizationDataService.getLearningStyle.mockRejectedValue(new Error('Service error'));

      const userResponse = {
        helpful: true,
        rating: 4
      };

      await expect(AdaptiveFeedbackSystem.processFeedbackResponse(
        feedbackId,
        mockUserId,
        userResponse
      )).rejects.toThrow('Service error');
    });
  });

  describe('generateContextualEncouragement', () => {
    it('should generate appropriate encouragement for struggling users', () => {
      const strugglingContext: FeedbackContext = {
        ...mockFeedbackContext,
        sessionContext: 'struggling'
      };

      const encouragement = AdaptiveFeedbackSystem.generateContextualEncouragement(
        strugglingContext,
        mockLearningStyle
      );

      expect(encouragement).toBeDefined();
      expect(typeof encouragement).toBe('string');
      expect(encouragement.length).toBeGreaterThan(0);
    });

    it('should generate appropriate encouragement for first-time users', () => {
      const firstTimeContext: FeedbackContext = {
        ...mockFeedbackContext,
        sessionContext: 'first_time'
      };

      const encouragement = AdaptiveFeedbackSystem.generateContextualEncouragement(
        firstTimeContext,
        mockLearningStyle
      );

      expect(encouragement).toBeDefined();
      expect(encouragement).toContain('Welcome');
    });

    it('should generate appropriate encouragement for excelling users', () => {
      const excellingContext: FeedbackContext = {
        ...mockFeedbackContext,
        sessionContext: 'excelling'
      };

      const encouragement = AdaptiveFeedbackSystem.generateContextualEncouragement(
        excellingContext,
        mockLearningStyle
      );

      expect(encouragement).toBeDefined();
      expect(encouragement.toLowerCase()).toMatch(/excellent|outstanding|impressive|fantastic/);
    });

    it('should handle null learning style', () => {
      const encouragement = AdaptiveFeedbackSystem.generateContextualEncouragement(
        mockFeedbackContext,
        null
      );

      expect(encouragement).toBeDefined();
      expect(typeof encouragement).toBe('string');
    });
  });

  describe('adaptFeedbackComplexity', () => {
    const originalFeedback = 'This is a comprehensive analysis of your code with detailed explanations and multiple suggestions for improvement.';

    it('should simplify feedback for struggling users', () => {
      const strugglingContext: FeedbackContext = {
        ...mockFeedbackContext,
        sessionContext: 'struggling'
      };

      const adaptedFeedback = AdaptiveFeedbackSystem.adaptFeedbackComplexity(
        originalFeedback,
        strugglingContext,
        mockLearningStyle
      );

      expect(adaptedFeedback.length).toBeLessThan(originalFeedback.length);
    });

    it('should simplify feedback for night time usage', () => {
      const nightContext: FeedbackContext = {
        ...mockFeedbackContext,
        timeOfDay: 'night'
      };

      const adaptedFeedback = AdaptiveFeedbackSystem.adaptFeedbackComplexity(
        originalFeedback,
        nightContext,
        mockLearningStyle
      );

      expect(adaptedFeedback.length).toBeLessThan(originalFeedback.length);
    });

    it('should simplify feedback for mobile users', () => {
      const mobileContext: FeedbackContext = {
        ...mockFeedbackContext,
        deviceType: 'mobile'
      };

      const adaptedFeedback = AdaptiveFeedbackSystem.adaptFeedbackComplexity(
        originalFeedback,
        mobileContext,
        mockLearningStyle
      );

      expect(adaptedFeedback.length).toBeLessThan(originalFeedback.length);
    });

    it('should enhance feedback for excelling users who prefer detailed feedback', () => {
      const excellingContext: FeedbackContext = {
        ...mockFeedbackContext,
        sessionContext: 'excelling'
      };

      const detailedLearningStyle: LearningStyle = {
        ...mockLearningStyle,
        preferredFeedbackType: 'detailed'
      };

      const adaptedFeedback = AdaptiveFeedbackSystem.adaptFeedbackComplexity(
        originalFeedback,
        excellingContext,
        detailedLearningStyle
      );

      expect(adaptedFeedback.length).toBeGreaterThan(originalFeedback.length);
    });

    it('should return original feedback when no adaptation needed', () => {
      const adaptedFeedback = AdaptiveFeedbackSystem.adaptFeedbackComplexity(
        originalFeedback,
        mockFeedbackContext,
        mockLearningStyle
      );

      expect(adaptedFeedback).toBe(originalFeedback);
    });
  });

  describe('generatePersonalizedNextSteps', () => {
    it('should generate next steps for struggling areas', () => {
      const nextSteps = AdaptiveFeedbackSystem.generatePersonalizedNextSteps(
        mockFeedbackContext,
        mockLearningStyle
      );

      expect(nextSteps).toHaveLength(3);
      expect(nextSteps[0]).toContain('error-handling'); // First struggling area
    });

    it('should generate next steps for excelling areas', () => {
      const excellingContext: FeedbackContext = {
        ...mockFeedbackContext,
        strugglingAreas: [],
        excellingAreas: ['JavaScript', 'React']
      };

      const nextSteps = AdaptiveFeedbackSystem.generatePersonalizedNextSteps(
        excellingContext,
        mockLearningStyle
      );

      expect(nextSteps.length).toBeGreaterThan(0);
      expect(nextSteps[0]).toContain('JavaScript'); // First excelling area
    });

    it('should adapt suggestions based on learning style', () => {
      const collaborativeLearningStyle: LearningStyle = {
        ...mockLearningStyle,
        interactionStyle: 'collaborative'
      };

      const nextSteps = AdaptiveFeedbackSystem.generatePersonalizedNextSteps(
        mockFeedbackContext,
        collaborativeLearningStyle
      );

      expect(nextSteps.some(step => step.includes('study group') || step.includes('coding partner'))).toBe(true);
    });

    it('should suggest breadth exploration for breadth-focused learners', () => {
      const breadthLearningStyle: LearningStyle = {
        ...mockLearningStyle,
        skillFocus: 'breadth'
      };

      const nextSteps = AdaptiveFeedbackSystem.generatePersonalizedNextSteps(
        mockFeedbackContext,
        breadthLearningStyle
      );

      expect(nextSteps.some(step => step.includes('related technologies') || step.includes('broaden'))).toBe(true);
    });

    it('should suggest depth exploration for depth-focused learners', () => {
      const depthLearningStyle: LearningStyle = {
        ...mockLearningStyle,
        skillFocus: 'depth'
      };

      const nextSteps = AdaptiveFeedbackSystem.generatePersonalizedNextSteps(
        mockFeedbackContext,
        depthLearningStyle
      );

      expect(nextSteps.some(step => step.includes('deeper') || step.includes('advanced'))).toBe(true);
    });

    it('should limit to 3 next steps', () => {
      const nextSteps = AdaptiveFeedbackSystem.generatePersonalizedNextSteps(
        mockFeedbackContext,
        mockLearningStyle
      );

      expect(nextSteps.length).toBeLessThanOrEqual(3);
    });

    it('should handle null learning style', () => {
      const nextSteps = AdaptiveFeedbackSystem.generatePersonalizedNextSteps(
        mockFeedbackContext,
        null
      );

      expect(nextSteps.length).toBeGreaterThan(0);
    });
  });
});