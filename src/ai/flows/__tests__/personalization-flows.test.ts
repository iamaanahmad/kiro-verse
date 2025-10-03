/**
 * @fileOverview Unit tests for personalization AI flows
 */

import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { 
  generatePersonalizedChallenge,
  peerMentorshipFacilitator,
  learningPathOptimizer,
  skillBenchmarkAnalyzer
} from '../index';
import { PersonalizationDataService } from '@/lib/firebase/personalization';
import { UserProgressService } from '@/lib/firebase/analytics';
import { BenchmarkService } from '@/lib/benchmark/benchmark-service';
import type { UserProgress, SkillLevel } from '@/types/analytics';
import type { LearningStyle } from '@/types/personalization';

// Mock dependencies
vi.mock('@/lib/firebase/personalization');
vi.mock('@/lib/firebase/analytics');
vi.mock('@/lib/benchmark/benchmark-service');
vi.mock('@/ai/genkit', () => ({
  ai: {
    generate: vi.fn(),
    defineFlow: vi.fn((config, handler) => handler)
  }
}));

const mockPersonalizationDataService = PersonalizationDataService as {
  getLearningStyle: Mock;
  getUserLearningPatterns: Mock;
  getUserRecommendations: Mock;
  savePersonalizedRecommendation: Mock;
  saveChallengeRecommendation: Mock;
};

const mockUserProgressService = UserProgressService as {
  getUserProgress: Mock;
};

const mockBenchmarkService = BenchmarkService as {
  getUserBenchmarkData: Mock;
};

describe('Personalization AI Flows', () => {
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

  const mockUserProgress: UserProgress = {
    userId: mockUserId,
    skillLevels: new Map([['JavaScript', mockSkillLevel]]),
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

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockUserProgressService.getUserProgress.mockResolvedValue(mockUserProgress);
    mockPersonalizationDataService.getLearningStyle.mockResolvedValue(mockLearningStyle);
    mockPersonalizationDataService.getUserLearningPatterns.mockResolvedValue([]);
    mockPersonalizationDataService.getUserRecommendations.mockResolvedValue([]);
    mockPersonalizationDataService.savePersonalizedRecommendation.mockResolvedValue(undefined);
    mockPersonalizationDataService.saveChallengeRecommendation.mockResolvedValue(undefined);
    mockBenchmarkService.getUserBenchmarkData.mockResolvedValue({});
  });

  describe('generatePersonalizedChallenge', () => {
    it('should generate a personalized challenge based on user profile', async () => {
      const mockAIResponse = {
        text: `Title: JavaScript Array Manipulation Challenge
        Description: Practice advanced array methods
        Prompt: Create a function that processes user data`
      };

      const mockAI = await import('@/ai/genkit');
      (mockAI.ai.generate as Mock).mockResolvedValue(mockAIResponse);

      const input = {
        userId: mockUserId,
        challengeType: 'skill_building' as const,
        adaptationLevel: 'moderate' as const
      };

      const result = await generatePersonalizedChallenge(input);

      expect(result.recommendation.challengeId).toBeDefined();
      expect(result.recommendation.userId).toBe(mockUserId);
      expect(result.recommendation.skillsTargeted).toContain('JavaScript');
      expect(result.customChallenge.title).toBeDefined();
      expect(result.adaptiveElements.feedbackStyle).toBe('detailed');
    });

    it('should adapt challenge difficulty based on user skill level', async () => {
      const advancedUserProgress = {
        ...mockUserProgress,
        skillLevels: new Map([['JavaScript', { ...mockSkillLevel, currentLevel: 4 }]])
      };
      mockUserProgressService.getUserProgress.mockResolvedValue(advancedUserProgress);

      const mockAIResponse = { text: 'Advanced challenge content' };
      const mockAI = await import('@/ai/genkit');
      (mockAI.ai.generate as Mock).mockResolvedValue(mockAIResponse);

      const input = {
        userId: mockUserId,
        challengeType: 'strength_advancing' as const
      };

      const result = await generatePersonalizedChallenge(input);

      expect(result.recommendation.difficulty).toBe('expert');
    });

    it('should handle missing user progress gracefully', async () => {
      mockUserProgressService.getUserProgress.mockResolvedValue(null);

      const input = {
        userId: mockUserId,
        challengeType: 'skill_building' as const
      };

      await expect(generatePersonalizedChallenge(input)).rejects.toThrow('User progress not found');
    });

    it('should save challenge recommendation to database', async () => {
      const mockAIResponse = { text: 'Challenge content' };
      const mockAI = await import('@/ai/genkit');
      (mockAI.ai.generate as Mock).mockResolvedValue(mockAIResponse);

      const input = {
        userId: mockUserId,
        challengeType: 'skill_building' as const
      };

      await generatePersonalizedChallenge(input);

      expect(mockPersonalizationDataService.saveChallengeRecommendation).toHaveBeenCalled();
    });
  });

  describe('peerMentorshipFacilitator', () => {
    it('should create a structured mentorship session plan', async () => {
      const mockAIResponse = {
        text: `Session Plan:
        Phase 1: Introduction (5 minutes)
        Phase 2: Problem solving (20 minutes)
        Phase 3: Reflection (5 minutes)`
      };

      const mockAI = await import('@/ai/genkit');
      (mockAI.ai.generate as Mock).mockResolvedValue(mockAIResponse);

      const input = {
        userId: mockUserId,
        sessionType: 'seeking_help' as const,
        sessionDuration: 30
      };

      const result = await peerMentorshipFacilitator(input);

      expect(result.sessionPlan.sessionId).toBeDefined();
      expect(result.sessionPlan.duration).toBe(30);
      expect(result.sessionPlan.structure).toHaveLength(3);
      expect(result.peerMatching.recommendedPeers).toBeDefined();
      expect(result.aiMentorshipGuidance.conversationStarters).toBeDefined();
    });

    it('should adapt session structure based on session type', async () => {
      const mockAIResponse = { text: 'Collaborative session plan' };
      const mockAI = await import('@/ai/genkit');
      (mockAI.ai.generate as Mock).mockResolvedValue(mockAIResponse);

      const input = {
        userId: mockUserId,
        sessionType: 'collaborative_session' as const,
        sessionDuration: 45
      };

      const result = await peerMentorshipFacilitator(input);

      expect(result.sessionPlan.sessionType).toBe('collaborative_session');
      expect(result.sessionPlan.structure[1].activities).toContain('Work on shared coding challenge');
    });

    it('should provide peer matching recommendations', async () => {
      const mockAIResponse = { text: 'Session content' };
      const mockAI = await import('@/ai/genkit');
      (mockAI.ai.generate as Mock).mockResolvedValue(mockAIResponse);

      const input = {
        userId: mockUserId,
        sessionType: 'offering_help' as const
      };

      const result = await peerMentorshipFacilitator(input);

      expect(result.peerMatching.recommendedPeers.length).toBeGreaterThan(0);
      expect(result.peerMatching.recommendedPeers[0].matchScore).toBeGreaterThan(0);
      expect(result.peerMatching.matchingStrategy).toBeDefined();
    });

    it('should adapt to user learning style', async () => {
      const collaborativeLearningStyle = {
        ...mockLearningStyle,
        interactionStyle: 'collaborative' as const
      };
      mockPersonalizationDataService.getLearningStyle.mockResolvedValue(collaborativeLearningStyle);

      const mockAIResponse = { text: 'Collaborative session' };
      const mockAI = await import('@/ai/genkit');
      (mockAI.ai.generate as Mock).mockResolvedValue(mockAIResponse);

      const input = {
        userId: mockUserId,
        sessionType: 'peer_review' as const
      };

      const result = await peerMentorshipFacilitator(input);

      expect(result.adaptiveElements.personalizedApproach).toContain('interactive');
    });
  });

  describe('learningPathOptimizer', () => {
    it('should create an optimized learning path with phases', async () => {
      const mockAIResponse = {
        text: `Learning Path:
        Phase 1: Foundation (4 weeks)
        Phase 2: Intermediate (4 weeks)
        Phase 3: Advanced (4 weeks)`
      };

      const mockAI = await import('@/ai/genkit');
      (mockAI.ai.generate as Mock).mockResolvedValue(mockAIResponse);

      const input = {
        userId: mockUserId,
        learningGoals: ['Master React', 'Learn TypeScript'],
        timeframe: '3_months' as const,
        timeCommitment: 10
      };

      const result = await learningPathOptimizer(input);

      expect(result.optimizedPath.pathId).toBeDefined();
      expect(result.optimizedPath.totalDuration).toBe(12); // 3 months = 12 weeks
      expect(result.optimizedPath.weeklyCommitment).toBe(10);
      expect(result.learningPhases).toHaveLength(3);
      expect(result.adaptiveElements.progressTracking).toBeDefined();
    });

    it('should adapt path based on user skill gaps', async () => {
      const beginnerUserProgress = {
        ...mockUserProgress,
        skillLevels: new Map([['JavaScript', { ...mockSkillLevel, currentLevel: 1 }]])
      };
      mockUserProgressService.getUserProgress.mockResolvedValue(beginnerUserProgress);

      const mockAIResponse = { text: 'Beginner-focused path' };
      const mockAI = await import('@/ai/genkit');
      (mockAI.ai.generate as Mock).mockResolvedValue(mockAIResponse);

      const input = {
        userId: mockUserId,
        learningGoals: ['JavaScript Fundamentals'],
        timeframe: '1_month' as const
      };

      const result = await learningPathOptimizer(input);

      expect(result.learningPhases[0].title).toBe('Foundation Building');
      expect(result.learningPhases[0].skillsToAcquire).toContain('JavaScript Fundamentals');
    });

    it('should include projects when requested', async () => {
      const mockAIResponse = { text: 'Project-based learning path' };
      const mockAI = await import('@/ai/genkit');
      (mockAI.ai.generate as Mock).mockResolvedValue(mockAIResponse);

      const input = {
        userId: mockUserId,
        learningGoals: ['Full Stack Development'],
        learningPreferences: {
          includeProjects: true,
          difficultyProgression: 'moderate' as const
        }
      };

      const result = await learningPathOptimizer(input);

      expect(result.learningPhases[0].projects).toBeDefined();
      expect(result.learningPhases[0].projects![0].title).toBeDefined();
    });

    it('should generate personalized recommendations', async () => {
      const visualLearningStyle = {
        ...mockLearningStyle,
        preferredFeedbackType: 'visual' as const
      };
      mockPersonalizationDataService.getLearningStyle.mockResolvedValue(visualLearningStyle);

      const mockAIResponse = { text: 'Visual learning path' };
      const mockAI = await import('@/ai/genkit');
      (mockAI.ai.generate as Mock).mockResolvedValue(mockAIResponse);

      const input = {
        userId: mockUserId,
        learningGoals: ['UI/UX Development']
      };

      const result = await learningPathOptimizer(input);

      expect(result.recommendations.some(r => r.title.includes('Visual'))).toBe(true);
    });
  });

  describe('skillBenchmarkAnalyzer', () => {
    it('should analyze skills against industry benchmarks', async () => {
      const mockAIResponse = {
        text: `Benchmark Analysis:
        Overall Score: 75/100
        Market Readiness: Competitive
        Strong areas: JavaScript, React
        Growth areas: Testing, DevOps`
      };

      const mockAI = await import('@/ai/genkit');
      (mockAI.ai.generate as Mock).mockResolvedValue(mockAIResponse);

      const input = {
        userId: mockUserId,
        analysisType: 'comprehensive' as const,
        targetRole: 'Frontend Developer'
      };

      const result = await skillBenchmarkAnalyzer(input);

      expect(result.benchmarkAnalysis.analysisId).toBeDefined();
      expect(result.benchmarkAnalysis.overallScore).toBeGreaterThan(0);
      expect(result.benchmarkAnalysis.marketReadiness).toBeDefined();
      expect(result.skillComparisons.length).toBeGreaterThan(0);
      expect(result.careerInsights.readyRoles).toBeDefined();
    });

    it('should provide role-specific analysis', async () => {
      const mockAIResponse = { text: 'Senior role analysis' };
      const mockAI = await import('@/ai/genkit');
      (mockAI.ai.generate as Mock).mockResolvedValue(mockAIResponse);

      const input = {
        userId: mockUserId,
        analysisType: 'role_specific' as const,
        targetRole: 'Senior Frontend Developer',
        experienceLevel: 'senior' as const
      };

      const result = await skillBenchmarkAnalyzer(input);

      expect(result.skillComparisons[0].targetRoleRequirement).toBeDefined();
      expect(result.careerInsights.stretchRoles.some(r => r.title.includes('Senior'))).toBe(true);
    });

    it('should identify market trends and opportunities', async () => {
      const mockAIResponse = { text: 'Market analysis content' };
      const mockAI = await import('@/ai/genkit');
      (mockAI.ai.generate as Mock).mockResolvedValue(mockAIResponse);

      const input = {
        userId: mockUserId,
        includeMarketTrends: true,
        geographicRegion: 'North America'
      };

      const result = await skillBenchmarkAnalyzer(input);

      expect(result.marketAnalysis.industryTrends).toBeDefined();
      expect(result.marketAnalysis.emergingSkills).toBeDefined();
      expect(result.marketAnalysis.competitiveAdvantages).toBeDefined();
      expect(result.actionableRecommendations.length).toBeGreaterThan(0);
    });

    it('should generate actionable recommendations', async () => {
      const mockAIResponse = { text: 'Recommendations content' };
      const mockAI = await import('@/ai/genkit');
      (mockAI.ai.generate as Mock).mockResolvedValue(mockAIResponse);

      const input = {
        userId: mockUserId,
        focusAreas: ['JavaScript', 'Testing']
      };

      const result = await skillBenchmarkAnalyzer(input);

      expect(result.actionableRecommendations.some(r => r.category === 'skill_development')).toBe(true);
      expect(result.actionableRecommendations[0].priority).toBeDefined();
      expect(result.actionableRecommendations[0].timeframe).toBeDefined();
    });

    it('should handle missing benchmark data gracefully', async () => {
      mockBenchmarkService.getUserBenchmarkData.mockResolvedValue(null);

      const mockAIResponse = { text: 'Analysis with limited data' };
      const mockAI = await import('@/ai/genkit');
      (mockAI.ai.generate as Mock).mockResolvedValue(mockAIResponse);

      const input = {
        userId: mockUserId,
        analysisType: 'market_readiness' as const
      };

      const result = await skillBenchmarkAnalyzer(input);

      expect(result.benchmarkAnalysis.overallScore).toBeGreaterThan(0);
      expect(result.skillComparisons.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle AI generation errors gracefully', async () => {
      const mockAI = await import('@/ai/genkit');
      (mockAI.ai.generate as Mock).mockRejectedValue(new Error('AI service unavailable'));

      const input = {
        userId: mockUserId,
        challengeType: 'skill_building' as const
      };

      await expect(generatePersonalizedChallenge(input)).rejects.toThrow('Failed to generate personalized challenge');
    });

    it('should handle database errors in learning path optimizer', async () => {
      mockPersonalizationDataService.savePersonalizedRecommendation.mockRejectedValue(new Error('Database error'));

      const mockAIResponse = { text: 'Learning path content' };
      const mockAI = await import('@/ai/genkit');
      (mockAI.ai.generate as Mock).mockResolvedValue(mockAIResponse);

      const input = {
        userId: mockUserId,
        learningGoals: ['React Development']
      };

      // Should not throw error even if saving fails
      const result = await learningPathOptimizer(input);
      expect(result.optimizedPath).toBeDefined();
    });

    it('should handle missing learning style data', async () => {
      mockPersonalizationDataService.getLearningStyle.mockResolvedValue(null);

      const mockAIResponse = { text: 'Default session plan' };
      const mockAI = await import('@/ai/genkit');
      (mockAI.ai.generate as Mock).mockResolvedValue(mockAIResponse);

      const input = {
        userId: mockUserId,
        sessionType: 'seeking_help' as const
      };

      const result = await peerMentorshipFacilitator(input);

      expect(result.sessionPlan).toBeDefined();
      expect(result.adaptiveElements.personalizedApproach).toBeDefined();
    });
  });
});