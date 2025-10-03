import { AIIntegrationService } from '../ai-integration-service';
import { generateObject } from 'ai';
import { PeerReview, AIEnhancedFeedback } from '@/types/peer-review';

// Mock the AI dependencies
jest.mock('ai');
jest.mock('@/ai/models', () => ({
  gemini2Flash: {}
}));

const mockGenerateObject = generateObject as jest.MockedFunction<typeof generateObject>;

const mockPeerReview: PeerReview = {
  reviewId: 'review-1',
  reviewerId: 'reviewer-1',
  revieweeId: 'reviewee-1',
  codeSubmissionId: 'code-1',
  type: 'code_review',
  status: 'completed',
  overallRating: 4,
  feedback: {
    strengths: ['Good code structure', 'Clear variable names'],
    improvementAreas: ['Add error handling', 'Improve performance'],
    codeQuality: {
      readability: 4,
      efficiency: 3,
      maintainability: 4,
      testability: 3,
      comments: ['Well organized']
    },
    bestPractices: {
      followsConventions: true,
      properErrorHandling: false,
      securityConsiderations: true,
      performanceOptimizations: false,
      comments: ['Good conventions']
    },
    generalComments: 'Overall good work',
    encouragement: 'Keep it up!'
  },
  suggestions: [
    {
      suggestionId: 'suggestion-1',
      suggestedCode: 'try { ... } catch (error) { ... }',
      explanation: 'Add error handling',
      category: 'best_practice',
      priority: 'high'
    }
  ],
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  completedAt: new Date('2024-01-01'),
  isAnonymous: false,
  visibility: 'community'
};

const mockAIEnhancedFeedback: AIEnhancedFeedback = {
  aiAnalysisId: 'ai-analysis-1',
  peerFeedbackAlignment: 0.85,
  additionalInsights: ['Consider using TypeScript for better type safety'],
  conflictingOpinions: [
    {
      topic: 'Error Handling',
      peerOpinion: 'Add try-catch blocks',
      aiOpinion: 'Use async/await with proper error boundaries',
      explanation: 'Different approaches to error handling',
      recommendedApproach: 'Combine both approaches for comprehensive error handling'
    }
  ],
  synthesizedRecommendations: [
    'Implement comprehensive error handling',
    'Consider TypeScript migration',
    'Add performance monitoring'
  ],
  confidenceScore: 0.9
};

const mockCodeContent = `
function fetchUserData(userId) {
  return fetch(\`/api/users/\${userId}\`)
    .then(response => response.json());
}
`;

describe('AIIntegrationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('enhancePeerReviewWithAI', () => {
    it('should enhance peer review with AI analysis', async () => {
      mockGenerateObject.mockResolvedValue({
        object: {
          peerFeedbackAlignment: 0.85,
          additionalInsights: ['Consider using TypeScript for better type safety'],
          conflictingOpinions: [
            {
              topic: 'Error Handling',
              peerOpinion: 'Add try-catch blocks',
              aiOpinion: 'Use async/await with proper error boundaries',
              explanation: 'Different approaches to error handling',
              recommendedApproach: 'Combine both approaches for comprehensive error handling'
            }
          ],
          synthesizedRecommendations: [
            'Implement comprehensive error handling',
            'Consider TypeScript migration'
          ],
          confidenceScore: 0.9
        }
      });

      const result = await AIIntegrationService.enhancePeerReviewWithAI(
        mockPeerReview,
        mockCodeContent
      );

      expect(result.peerFeedbackAlignment).toBe(0.85);
      expect(result.additionalInsights).toContain('Consider using TypeScript for better type safety');
      expect(result.conflictingOpinions).toHaveLength(1);
      expect(result.synthesizedRecommendations).toHaveLength(2);
      expect(result.confidenceScore).toBe(0.9);
      expect(result.aiAnalysisId).toMatch(/^ai_enhanced_/);
    });

    it('should handle AI analysis errors', async () => {
      mockGenerateObject.mockRejectedValue(new Error('AI service unavailable'));

      await expect(
        AIIntegrationService.enhancePeerReviewWithAI(mockPeerReview, mockCodeContent)
      ).rejects.toThrow('AI service unavailable');
    });

    it('should include AI analysis context when provided', async () => {
      const mockAIAnalysis = {
        sessionId: 'session-1',
        userId: 'user-1',
        codeSubmission: {
          submissionId: 'submission-1',
          code: mockCodeContent,
          language: 'javascript',
          submittedAt: new Date()
        },
        aiAnalysis: {
          analysisId: 'analysis-1',
          overallScore: 75,
          feedback: 'Good structure, needs error handling',
          suggestions: ['Add error handling'],
          skillsAssessed: ['JavaScript'],
          createdAt: new Date()
        },
        skillImprovements: [],
        learningInsights: [
          {
            type: 'improvement',
            category: 'Error Handling',
            description: 'Add proper error handling',
            actionableSteps: ['Use try-catch blocks'],
            confidenceScore: 0.8
          }
        ],
        benchmarkComparisons: [],
        timestamp: new Date()
      };

      mockGenerateObject.mockResolvedValue({
        object: {
          peerFeedbackAlignment: 0.9,
          additionalInsights: [],
          conflictingOpinions: [],
          synthesizedRecommendations: ['Combined recommendation'],
          confidenceScore: 0.95
        }
      });

      const result = await AIIntegrationService.enhancePeerReviewWithAI(
        mockPeerReview,
        mockCodeContent,
        mockAIAnalysis
      );

      expect(result.peerFeedbackAlignment).toBe(0.9);
      expect(mockGenerateObject).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: expect.stringContaining('PREVIOUS AI ANALYSIS')
        })
      );
    });
  });

  describe('generateCombinedInsights', () => {
    it('should generate combined insights from peer and AI feedback', async () => {
      mockGenerateObject.mockResolvedValue({
        object: {
          insights: [
            {
              type: 'strength',
              title: 'Good Code Structure',
              description: 'The code is well organized and follows good practices',
              sources: ['peer', 'ai'],
              actionableSteps: ['Continue using this structure'],
              priority: 'low',
              skillsTargeted: ['Code Organization']
            },
            {
              type: 'improvement',
              title: 'Error Handling',
              description: 'Add comprehensive error handling',
              sources: ['peer'],
              actionableSteps: ['Add try-catch blocks', 'Implement error boundaries'],
              priority: 'high',
              skillsTargeted: ['Error Handling', 'JavaScript']
            }
          ]
        }
      });

      const result = await AIIntegrationService.generateCombinedInsights(
        mockPeerReview,
        mockAIEnhancedFeedback,
        mockCodeContent
      );

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(expect.objectContaining({
        type: 'strength',
        title: 'Good Code Structure',
        sources: ['peer', 'ai'],
        insightId: expect.stringMatching(/^combined_/)
      }));
      expect(result[1]).toEqual(expect.objectContaining({
        type: 'improvement',
        title: 'Error Handling',
        priority: 'high'
      }));
    });

    it('should handle insight generation errors', async () => {
      mockGenerateObject.mockRejectedValue(new Error('AI service error'));

      await expect(
        AIIntegrationService.generateCombinedInsights(
          mockPeerReview,
          mockAIEnhancedFeedback,
          mockCodeContent
        )
      ).rejects.toThrow('AI service error');
    });
  });

  describe('analyzePeerFeedbackQuality', () => {
    it('should analyze peer feedback quality', async () => {
      mockGenerateObject.mockResolvedValue({
        object: {
          qualityScore: 0.8,
          strengths: ['Specific feedback', 'Constructive suggestions'],
          improvementSuggestions: ['Add more code examples', 'Provide more context'],
          helpfulnessIndicators: ['Clear explanations', 'Actionable advice']
        }
      });

      const result = await AIIntegrationService.analyzePeerFeedbackQuality(mockPeerReview);

      expect(result.qualityScore).toBe(0.8);
      expect(result.strengths).toContain('Specific feedback');
      expect(result.improvementSuggestions).toContain('Add more code examples');
      expect(result.helpfulnessIndicators).toContain('Clear explanations');
    });

    it('should handle quality analysis errors', async () => {
      mockGenerateObject.mockRejectedValue(new Error('Analysis failed'));

      await expect(
        AIIntegrationService.analyzePeerFeedbackQuality(mockPeerReview)
      ).rejects.toThrow('Analysis failed');
    });
  });

  describe('generateReviewerImprovementSuggestions', () => {
    it('should generate improvement suggestions for reviewers', async () => {
      const reviewHistory = [mockPeerReview];
      const reviewerSkills = ['JavaScript', 'React', 'Node.js'];

      mockGenerateObject.mockResolvedValue({
        object: {
          overallFeedback: 'Good reviewer with room for improvement',
          specificSuggestions: [
            'Provide more specific code examples',
            'Include performance considerations'
          ],
          skillDevelopmentAreas: ['TypeScript', 'Testing'],
          mentorshipOpportunities: ['Junior developers', 'Code review workshops']
        }
      });

      const result = await AIIntegrationService.generateReviewerImprovementSuggestions(
        reviewHistory,
        reviewerSkills
      );

      expect(result.overallFeedback).toBe('Good reviewer with room for improvement');
      expect(result.specificSuggestions).toHaveLength(2);
      expect(result.skillDevelopmentAreas).toContain('TypeScript');
      expect(result.mentorshipOpportunities).toContain('Junior developers');
    });

    it('should handle empty review history', async () => {
      mockGenerateObject.mockResolvedValue({
        object: {
          overallFeedback: 'New reviewer, needs experience',
          specificSuggestions: ['Start with simple reviews'],
          skillDevelopmentAreas: ['Code review fundamentals'],
          mentorshipOpportunities: []
        }
      });

      const result = await AIIntegrationService.generateReviewerImprovementSuggestions(
        [],
        ['JavaScript']
      );

      expect(result.overallFeedback).toBe('New reviewer, needs experience');
      expect(result.specificSuggestions).toContain('Start with simple reviews');
    });
  });

  describe('trackAIEnhancedContribution', () => {
    it('should track AI-enhanced contribution', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await AIIntegrationService.trackAIEnhancedContribution(
        'reviewer-1',
        mockPeerReview,
        mockAIEnhancedFeedback
      );

      expect(consoleSpy).toHaveBeenCalledWith(
        'AI-Enhanced Peer Review Contribution:',
        expect.objectContaining({
          reviewerId: 'reviewer-1',
          reviewId: 'review-1',
          impactScore: expect.any(Number),
          alignmentScore: 0.85,
          confidenceScore: 0.9
        })
      );

      consoleSpy.mockRestore();
    });

    it('should handle tracking errors gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // Force an error by passing invalid data
      await AIIntegrationService.trackAIEnhancedContribution(
        '',
        null as any,
        mockAIEnhancedFeedback
      );

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error tracking AI-enhanced contribution:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('calculateContributionImpact', () => {
    it('should calculate impact score correctly', () => {
      // Access private method through any casting for testing
      const service = AIIntegrationService as any;
      const score = service.calculateContributionImpact(mockPeerReview, mockAIEnhancedFeedback);

      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should give higher scores for comprehensive reviews', () => {
      const comprehensiveReview = {
        ...mockPeerReview,
        feedback: {
          ...mockPeerReview.feedback,
          strengths: ['Good structure', 'Clear naming', 'Proper formatting', 'Good logic'],
          improvementAreas: ['Add tests', 'Error handling', 'Performance', 'Documentation'],
          generalComments: 'This is a very detailed review with comprehensive feedback that covers multiple aspects of code quality and best practices.',
          encouragement: 'Great work overall! Keep up the excellent coding practices.'
        },
        suggestions: [
          ...mockPeerReview.suggestions,
          {
            suggestionId: 'suggestion-2',
            suggestedCode: 'const result = await fetchData();',
            explanation: 'Use async/await for better readability',
            category: 'style' as const,
            priority: 'medium' as const
          }
        ]
      };

      const service = AIIntegrationService as any;
      const comprehensiveScore = service.calculateContributionImpact(comprehensiveReview, mockAIEnhancedFeedback);
      const basicScore = service.calculateContributionImpact(mockPeerReview, mockAIEnhancedFeedback);

      expect(comprehensiveScore).toBeGreaterThan(basicScore);
    });
  });
});