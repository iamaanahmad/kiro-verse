/**
 * @fileOverview Unit tests for SkillProgressTracker service
 * 
 * Tests cover:
 * - Skill level calculation algorithms
 * - Code quality metrics calculation
 * - Experience gain calculations
 * - Learning insights generation
 * - Progress tracking functionality
 */

import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { SkillProgressTracker } from '../skill-progress-tracker';
import { UserProgressService, AnalyticsDataService, LearningInsightsService } from '@/lib/firebase/analytics';
import { sendChatMessage } from '@/ai/flows/send-chat-message';
import { awardSkillBadge } from '@/ai/flows/award-skill-badge';
import { 
  UserProgress, 
  SkillLevel, 
  AIAnalysisResult,
  SkillImprovement,
  LearningInsight 
} from '@/types/analytics';

// Mock external dependencies
vi.mock('@/lib/firebase/analytics');
vi.mock('@/ai/flows/send-chat-message');
vi.mock('@/ai/flows/award-skill-badge');

const mockUserProgressService = UserProgressService as any;
const mockAnalyticsDataService = AnalyticsDataService as any;
const mockLearningInsightsService = LearningInsightsService as any;
const mockSendChatMessage = sendChatMessage as Mock;
const mockAwardSkillBadge = awardSkillBadge as Mock;

describe('SkillProgressTracker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mock responses
    mockSendChatMessage.mockResolvedValue({
      aiResponse: 'This code demonstrates good quality (85/100) with excellent efficiency (90/100). The creativity score is 75/100 and best practices score is 80/100. I suggest improving error handling and adding more comments. Consider better variable naming to improve readability.'
    });
    
    mockAwardSkillBadge.mockResolvedValue({
      badgeName: 'JavaScript Promises',
      badgeDescription: 'Demonstrates understanding of asynchronous JavaScript with Promises'
    });
    
    mockAnalyticsDataService.saveAnalyticsData.mockResolvedValue('analytics-id');
    mockLearningInsightsService.saveLearningInsight.mockResolvedValue('insight-id');
  });

  describe('analyzeCodeSubmission', () => {
    const sampleCode = `
      async function fetchUserData(userId) {
        try {
          const response = await fetch(\`/api/users/\${userId}\`);
          if (!response.ok) {
            throw new Error('Failed to fetch user data');
          }
          return await response.json();
        } catch (error) {
          console.error('Error fetching user data:', error);
          throw error;
        }
      }
    `;

    it('should analyze code submission and return analytics data', async () => {
      mockUserProgressService.getUserProgress.mockResolvedValue(null);
      mockUserProgressService.createUserProgress.mockResolvedValue(undefined);

      const result = await SkillProgressTracker.analyzeCodeSubmission(
        'user123',
        sampleCode,
        'API integration example'
      );

      expect(result).toBeDefined();
      expect(result.userId).toBe('user123');
      expect(result.codeSubmission.code).toBe(sampleCode);
      expect(result.processingStatus).toBe('completed');
      expect(mockAnalyticsDataService.saveAnalyticsData).toHaveBeenCalled();
    });

    it('should handle AI analysis failures gracefully', async () => {
      mockSendChatMessage.mockRejectedValue(new Error('AI service unavailable'));
      
      await expect(
        SkillProgressTracker.analyzeCodeSubmission('user123', sampleCode)
      ).rejects.toThrow('AI service unavailable');

      // Should still save failed analytics record
      expect(mockAnalyticsDataService.saveAnalyticsData).toHaveBeenCalledWith(
        expect.objectContaining({
          processingStatus: 'failed'
        })
      );
    });

    it('should detect programming language correctly', async () => {
      mockUserProgressService.getUserProgress.mockResolvedValue(null);
      mockUserProgressService.createUserProgress.mockResolvedValue(undefined);

      const result = await SkillProgressTracker.analyzeCodeSubmission(
        'user123',
        sampleCode
      );

      expect(result.codeSubmission.language).toBe('JavaScript');
    });

    it('should calculate code metrics', async () => {
      mockUserProgressService.getUserProgress.mockResolvedValue(null);
      mockUserProgressService.createUserProgress.mockResolvedValue(undefined);

      const result = await SkillProgressTracker.analyzeCodeSubmission(
        'user123',
        sampleCode
      );

      expect(result.codeSubmission.metrics).toBeDefined();
      expect(result.codeSubmission.metrics.linesOfCode).toBeGreaterThan(0);
      expect(result.codeSubmission.metrics.complexity).toBeGreaterThan(0);
      expect(result.codeSubmission.metrics.maintainability).toBeGreaterThan(0);
    });
  });

  describe('AI Analysis Parsing', () => {
    it('should extract metrics from AI response correctly', async () => {
      mockUserProgressService.getUserProgress.mockResolvedValue(null);
      mockUserProgressService.createUserProgress.mockResolvedValue(undefined);

      const result = await SkillProgressTracker.analyzeCodeSubmission(
        'user123',
        'const x = 1;'
      );

      expect(result.aiAnalysis.codeQuality).toBe(85);
      expect(result.aiAnalysis.efficiency).toBe(90);
      expect(result.aiAnalysis.creativity).toBe(75);
      expect(result.aiAnalysis.bestPractices).toBe(80);
    });

    it('should extract detected skills from badge response', async () => {
      mockUserProgressService.getUserProgress.mockResolvedValue(null);
      mockUserProgressService.createUserProgress.mockResolvedValue(undefined);

      const result = await SkillProgressTracker.analyzeCodeSubmission(
        'user123',
        'const x = 1;'
      );

      expect(result.aiAnalysis.detectedSkills).toContain('JavaScript Promises');
    });

    it('should extract suggestions and improvement areas', async () => {
      mockUserProgressService.getUserProgress.mockResolvedValue(null);
      mockUserProgressService.createUserProgress.mockResolvedValue(undefined);

      const result = await SkillProgressTracker.analyzeCodeSubmission(
        'user123',
        'const x = 1;'
      );

      expect(result.aiAnalysis.suggestions.length).toBeGreaterThan(0);
      expect(result.aiAnalysis.improvementAreas.length).toBeGreaterThan(0);
    });
  });

  describe('Skill Level Calculations', () => {
    const mockExistingProgress: UserProgress = {
      userId: 'user123',
      skillLevels: new Map([
        ['JavaScript Promises', {
          skillId: 'JavaScript Promises',
          skillName: 'JavaScript Promises',
          currentLevel: 1,
          experiencePoints: 50,
          competencyAreas: [],
          industryBenchmark: {
            industryAverage: 50,
            experienceLevel: 'beginner',
            percentile: 50,
            lastUpdated: new Date()
          },
          verificationStatus: 'pending',
          progressHistory: [],
          trendDirection: 'stable',
          lastUpdated: new Date()
        }]
      ]),
      learningVelocity: 0.5,
      codeQualityTrend: {
        direction: 'stable',
        changePercentage: 0,
        timeframe: '30d',
        dataPoints: 1
      },
      challengesCompleted: [],
      peerInteractions: [],
      lastAnalysisDate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    it('should calculate experience gain for existing skills', async () => {
      mockUserProgressService.getUserProgress.mockResolvedValue(mockExistingProgress);
      mockUserProgressService.updateUserProgress.mockResolvedValue(undefined);

      const result = await SkillProgressTracker.analyzeCodeSubmission(
        'user123',
        'const x = 1;'
      );

      const improvement = result.skillImprovements.find(
        imp => imp.skillId === 'JavaScript Promises'
      );
      
      expect(improvement).toBeDefined();
      expect(improvement?.improvementType).toBe('experience_gain');
    });

    it('should create new skill when first detected', async () => {
      const progressWithoutSkill: UserProgress = {
        ...mockExistingProgress,
        skillLevels: new Map()
      };
      
      mockUserProgressService.getUserProgress.mockResolvedValue(progressWithoutSkill);
      mockUserProgressService.updateUserProgress.mockResolvedValue(undefined);

      const result = await SkillProgressTracker.analyzeCodeSubmission(
        'user123',
        'const x = 1;'
      );

      const improvement = result.skillImprovements.find(
        imp => imp.skillId === 'JavaScript Promises'
      );
      
      expect(improvement).toBeDefined();
      expect(improvement?.previousLevel).toBe(0);
      expect(improvement?.newLevel).toBe(1);
      expect(improvement?.improvementType).toBe('level_up');
    });

    it('should calculate level up when experience threshold is reached', async () => {
      const highExperienceProgress: UserProgress = {
        ...mockExistingProgress,
        skillLevels: new Map([
          ['JavaScript Promises', {
            ...mockExistingProgress.skillLevels.get('JavaScript Promises')!,
            experiencePoints: 95 // Close to level 2 threshold (100)
          }]
        ])
      };
      
      mockUserProgressService.getUserProgress.mockResolvedValue(highExperienceProgress);
      mockUserProgressService.updateUserProgress.mockResolvedValue(undefined);

      const result = await SkillProgressTracker.analyzeCodeSubmission(
        'user123',
        'const x = 1;'
      );

      const improvement = result.skillImprovements.find(
        imp => imp.skillId === 'JavaScript Promises'
      );
      
      expect(improvement?.improvementType).toBe('level_up');
      expect(improvement?.newLevel).toBe(2);
    });
  });

  describe('Learning Insights Generation', () => {
    it('should generate strength insights for high quality code', async () => {
      mockSendChatMessage.mockResolvedValue({
        aiResponse: 'This code demonstrates excellent quality (95/100) with great efficiency (90/100).'
      });
      
      mockUserProgressService.getUserProgress.mockResolvedValue(null);
      mockUserProgressService.createUserProgress.mockResolvedValue(undefined);

      const result = await SkillProgressTracker.analyzeCodeSubmission(
        'user123',
        'const x = 1;'
      );

      const strengthInsight = result.learningInsights.find(
        insight => insight.type === 'strength'
      );
      
      expect(strengthInsight).toBeDefined();
      expect(strengthInsight?.category).toBe('Code Quality');
    });

    it('should generate improvement insights for low efficiency', async () => {
      mockSendChatMessage.mockResolvedValue({
        aiResponse: 'This code has good quality (75/100) but poor efficiency (45/100).'
      });
      
      mockUserProgressService.getUserProgress.mockResolvedValue(null);
      mockUserProgressService.createUserProgress.mockResolvedValue(undefined);

      const result = await SkillProgressTracker.analyzeCodeSubmission(
        'user123',
        'const x = 1;'
      );

      const improvementInsight = result.learningInsights.find(
        insight => insight.type === 'improvement_area'
      );
      
      expect(improvementInsight).toBeDefined();
      expect(improvementInsight?.category).toBe('Performance');
    });

    it('should generate recommendation insights for skill improvements', async () => {
      mockUserProgressService.getUserProgress.mockResolvedValue(null);
      mockUserProgressService.createUserProgress.mockResolvedValue(undefined);

      const result = await SkillProgressTracker.analyzeCodeSubmission(
        'user123',
        'const x = 1;'
      );

      const recommendationInsight = result.learningInsights.find(
        insight => insight.type === 'recommendation'
      );
      
      expect(recommendationInsight).toBeDefined();
      expect(recommendationInsight?.category).toBe('Skill Development');
    });
  });

  describe('Code Metrics Calculations', () => {
    it('should calculate cyclomatic complexity correctly', async () => {
      const complexCode = `
        function complexFunction(x) {
          if (x > 0) {
            for (let i = 0; i < x; i++) {
              if (i % 2 === 0) {
                console.log(i);
              } else {
                console.log('odd');
              }
            }
          } else {
            while (x < 0) {
              x++;
            }
          }
          return x;
        }
      `;

      mockUserProgressService.getUserProgress.mockResolvedValue(null);
      mockUserProgressService.createUserProgress.mockResolvedValue(undefined);

      const result = await SkillProgressTracker.analyzeCodeSubmission(
        'user123',
        complexCode
      );

      expect(result.codeSubmission.metrics.complexity).toBeGreaterThan(5);
    });

    it('should detect test coverage in code', async () => {
      const testCode = `
        describe('test suite', () => {
          it('should work', () => {
            expect(true).toBe(true);
          });
        });
      `;

      mockUserProgressService.getUserProgress.mockResolvedValue(null);
      mockUserProgressService.createUserProgress.mockResolvedValue(undefined);

      const result = await SkillProgressTracker.analyzeCodeSubmission(
        'user123',
        testCode
      );

      expect(result.codeSubmission.metrics.testCoverage).toBeGreaterThan(0);
    });

    it('should calculate performance score based on code patterns', async () => {
      const optimizedCode = `
        const memoizedFunction = useMemo(() => {
          return async () => {
            const result = await fetchData();
            return result;
          };
        }, []);
      `;

      mockUserProgressService.getUserProgress.mockResolvedValue(null);
      mockUserProgressService.createUserProgress.mockResolvedValue(undefined);

      const result = await SkillProgressTracker.analyzeCodeSubmission(
        'user123',
        optimizedCode
      );

      expect(result.codeSubmission.metrics.performance).toBeGreaterThan(70);
    });

    it('should calculate security score based on code patterns', async () => {
      const secureCode = `
        function sanitizeInput(input) {
          try {
            const validated = validateInput(input);
            return sanitize(validated);
          } catch (error) {
            throw new Error('Invalid input');
          }
        }
      `;

      mockUserProgressService.getUserProgress.mockResolvedValue(null);
      mockUserProgressService.createUserProgress.mockResolvedValue(undefined);

      const result = await SkillProgressTracker.analyzeCodeSubmission(
        'user123',
        secureCode
      );

      expect(result.codeSubmission.metrics.security).toBeGreaterThan(70);
    });
  });

  describe('Progress Tracking Options', () => {
    it('should skip real-time analysis when disabled', async () => {
      mockUserProgressService.getUserProgress.mockResolvedValue(null);

      await SkillProgressTracker.analyzeCodeSubmission(
        'user123',
        'const x = 1;',
        '',
        { enableRealTimeAnalysis: false }
      );

      expect(mockUserProgressService.createUserProgress).not.toHaveBeenCalled();
      expect(mockUserProgressService.updateUserProgress).not.toHaveBeenCalled();
    });

    it('should skip insights generation when disabled', async () => {
      mockUserProgressService.getUserProgress.mockResolvedValue(null);
      mockUserProgressService.createUserProgress.mockResolvedValue(undefined);

      const result = await SkillProgressTracker.analyzeCodeSubmission(
        'user123',
        'const x = 1;',
        '',
        { generateInsights: false }
      );

      expect(result.learningInsights).toHaveLength(0);
      expect(mockLearningInsightsService.saveLearningInsight).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      mockUserProgressService.getUserProgress.mockRejectedValue(
        new Error('Database connection failed')
      );

      await expect(
        SkillProgressTracker.analyzeCodeSubmission('user123', 'const x = 1;')
      ).rejects.toThrow('Database connection failed');
    });

    it('should handle invalid code input', async () => {
      mockUserProgressService.getUserProgress.mockResolvedValue(null);
      mockUserProgressService.createUserProgress.mockResolvedValue(undefined);

      const result = await SkillProgressTracker.analyzeCodeSubmission(
        'user123',
        '' // Empty code
      );

      expect(result).toBeDefined();
      expect(result.codeSubmission.metrics.linesOfCode).toBe(0);
    });
  });

  describe('Learning Velocity Calculations', () => {
    it('should calculate learning velocity based on skill progression', async () => {
      const progressWithMultipleSkills: UserProgress = {
        userId: 'user123',
        skillLevels: new Map([
          ['JavaScript', { currentLevel: 3 } as SkillLevel],
          ['React', { currentLevel: 2 } as SkillLevel],
          ['TypeScript', { currentLevel: 1 } as SkillLevel]
        ]),
        learningVelocity: 0,
        codeQualityTrend: {
          direction: 'stable',
          changePercentage: 0,
          timeframe: '30d',
          dataPoints: 1
        },
        challengesCompleted: [],
        peerInteractions: [],
        lastAnalysisDate: new Date(),
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        updatedAt: new Date()
      };

      mockUserProgressService.getUserProgress.mockResolvedValue(progressWithMultipleSkills);
      mockUserProgressService.updateUserProgress.mockResolvedValue(undefined);

      await SkillProgressTracker.analyzeCodeSubmission('user123', 'const x = 1;');

      expect(mockUserProgressService.updateUserProgress).toHaveBeenCalledWith(
        'user123',
        expect.objectContaining({
          learningVelocity: expect.any(Number)
        })
      );
    });
  });
});