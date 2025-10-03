import { EmployerService } from '../employer-service';
import { CandidateProfile, CustomAssessment, ComparisonCriteria } from '@/types/employer';

// Mock Firebase functions
jest.mock('@/lib/firebase/employer', () => ({
  getCandidateProfiles: jest.fn(),
  getCandidateProfile: jest.fn(),
  getCustomAssessments: jest.fn(),
  createCustomAssessment: jest.fn(),
  getAssessmentResults: jest.fn(),
  getEmployerMetrics: jest.fn()
}));

describe('EmployerService', () => {
  let employerService: EmployerService;

  beforeEach(() => {
    employerService = EmployerService.getInstance();
    jest.clearAllMocks();
  });

  describe('getInstance', () => {
    it('returns the same instance (singleton pattern)', () => {
      const instance1 = EmployerService.getInstance();
      const instance2 = EmployerService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('getEmployerDashboard', () => {
    it('loads complete dashboard data successfully', async () => {
      const mockCandidates: CandidateProfile[] = [
        {
          userId: 'candidate1',
          username: 'testuser',
          displayName: 'Test User',
          skillLevels: [],
          overallProgress: {} as any,
          learningVelocity: 85,
          codeQualityTrend: {
            direction: 'improving',
            changePercentage: 15.2,
            timeframe: '30 days'
          },
          verifiedBadges: [],
          blockchainCredentials: [],
          assessmentResults: [],
          industryBenchmarks: [],
          marketReadiness: {} as any,
          peerComparisons: [],
          recentActivity: {
            totalSessions: 45,
            totalCodeSubmissions: 128,
            averageSessionDuration: 35,
            lastActiveDate: new Date(),
            streakDays: 12,
            weeklyActivity: [],
            skillFocus: []
          },
          learningInsights: [],
          portfolioProjects: [],
          profileVisibility: {
            isPublic: true,
            showRealName: true,
            showContactInfo: false,
            showDetailedAnalytics: true,
            showBenchmarkComparisons: true,
            allowEmployerContact: true,
            visibleToEmployers: true
          },
          lastUpdated: new Date(),
          createdAt: new Date()
        }
      ];

      // Mock the private methods by spying on the service
      jest.spyOn(employerService as any, 'getCandidateProfiles').mockResolvedValue(mockCandidates);
      jest.spyOn(employerService as any, 'getCustomAssessments').mockResolvedValue([]);
      jest.spyOn(employerService as any, 'getDashboardMetrics').mockResolvedValue({
        totalCandidatesViewed: 45,
        totalAssessmentsCreated: 3,
        totalAssessmentCompletions: 28,
        averageCandidateScore: 78.5,
        topPerformingSkills: ['JavaScript'],
        assessmentCompletionRate: 85.2,
        candidateEngagementRate: 92.1,
        lastUpdated: new Date()
      });
      jest.spyOn(employerService as any, 'getAssessmentResults').mockResolvedValue([]);
      jest.spyOn(employerService as any, 'getIndustryBenchmarks').mockResolvedValue([]);
      jest.spyOn(employerService as any, 'getRecentActivity').mockResolvedValue([]);
      jest.spyOn(employerService as any, 'getCompanyName').mockResolvedValue('Test Company');

      const result = await employerService.getEmployerDashboard('employer1');

      expect(result).toEqual({
        employerId: 'employer1',
        companyName: 'Test Company',
        candidateProfiles: mockCandidates,
        customAssessments: [],
        assessmentResults: [],
        industryBenchmarks: [],
        dashboardMetrics: expect.objectContaining({
          totalCandidatesViewed: 45,
          totalAssessmentsCreated: 3
        }),
        recentActivity: []
      });
    });

    it('handles errors gracefully', async () => {
      jest.spyOn(employerService as any, 'getCandidateProfiles').mockRejectedValue(new Error('Database error'));

      await expect(employerService.getEmployerDashboard('employer1')).rejects.toThrow('Failed to load dashboard data');
    });
  });

  describe('getCandidateProfiles', () => {
    it('returns mock candidate profiles', async () => {
      const profiles = await employerService.getCandidateProfiles('employer1');
      
      expect(profiles).toHaveLength(1);
      expect(profiles[0]).toMatchObject({
        userId: 'candidate_1',
        username: 'alex_dev',
        displayName: 'Alex Johnson'
      });
    });
  });

  describe('getCandidateProfile', () => {
    it('returns specific candidate profile', async () => {
      const profile = await employerService.getCandidateProfile('candidate_1', 'employer1');
      
      expect(profile).toMatchObject({
        userId: 'candidate_1',
        username: 'alex_dev',
        displayName: 'Alex Johnson'
      });
    });

    it('returns null for non-existent candidate', async () => {
      const profile = await employerService.getCandidateProfile('nonexistent', 'employer1');
      expect(profile).toBeNull();
    });
  });

  describe('verifyBlockchainCredentials', () => {
    it('verifies credentials successfully', async () => {
      const mockCredentials = [
        {
          credentialId: 'cred1',
          badgeId: 'badge1',
          transactionHash: '0x123',
          blockNumber: 12345,
          contractAddress: '0xabc',
          tokenId: '1',
          mintedAt: new Date(),
          verificationUrl: 'https://example.com',
          metadata: {
            skillsValidated: ['javascript'],
            assessmentScore: 88,
            difficultyLevel: 'advanced',
            issuerSignature: 'sig123'
          },
          isValid: false,
          lastVerified: new Date()
        }
      ];

      const result = await employerService.verifyBlockchainCredentials(mockCredentials);
      
      expect(result).toHaveLength(1);
      expect(result[0].isValid).toBe(true);
      expect(result[0].lastVerified).toBeInstanceOf(Date);
    });
  });

  describe('createCustomAssessment', () => {
    it('creates assessment with generated ID and timestamps', async () => {
      const assessmentData = {
        title: 'JavaScript Assessment',
        description: 'Test JavaScript skills',
        createdBy: 'employer1',
        companyName: 'Test Company',
        targetSkills: [],
        difficultyLevel: 'intermediate' as const,
        estimatedDuration: 60,
        challenges: [],
        evaluationCriteria: [],
        passingScore: 70,
        useAIEvaluation: true,
        status: 'draft' as const
      };

      const result = await employerService.createCustomAssessment(assessmentData);

      expect(result.assessmentId).toMatch(/^assessment_\d+_[a-z0-9]+$/);
      expect(result.title).toBe('JavaScript Assessment');
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
      expect(result.participantCount).toBe(0);
      expect(result.averageScore).toBe(0);
      expect(result.completionRate).toBe(0);
    });
  });

  describe('compareCandidates', () => {
    it('compares candidates based on criteria', async () => {
      const candidateIds = ['candidate_1'];
      const criteria: ComparisonCriteria[] = [
        {
          criteriaId: 'skill_js',
          name: 'JavaScript Skill',
          type: 'skill_level',
          weight: 1,
          skillId: 'javascript'
        }
      ];

      const result = await employerService.compareCandidates(candidateIds, criteria, 'employer1');

      expect(result.comparisonId).toMatch(/^comparison_\d+$/);
      expect(result.candidates).toHaveLength(1);
      expect(result.comparisonCriteria).toEqual(criteria);
      expect(result.results).toHaveLength(1);
      expect(result.results[0].candidateId).toBe('candidate_1');
      expect(result.results[0].ranking).toBe(1);
      expect(result.results[0].overallScore).toBeGreaterThan(0);
    });

    it('handles multiple candidates and ranks them correctly', async () => {
      // Mock multiple candidates
      jest.spyOn(employerService, 'getCandidateProfile')
        .mockResolvedValueOnce({
          userId: 'candidate1',
          skillLevels: [{ skillId: 'javascript', currentLevel: 8 } as any],
          learningVelocity: 90
        } as CandidateProfile)
        .mockResolvedValueOnce({
          userId: 'candidate2',
          skillLevels: [{ skillId: 'javascript', currentLevel: 6 } as any],
          learningVelocity: 70
        } as CandidateProfile);

      const candidateIds = ['candidate1', 'candidate2'];
      const criteria: ComparisonCriteria[] = [
        {
          criteriaId: 'skill_js',
          name: 'JavaScript Skill',
          type: 'skill_level',
          weight: 1,
          skillId: 'javascript'
        }
      ];

      const result = await employerService.compareCandidates(candidateIds, criteria, 'employer1');

      expect(result.results).toHaveLength(2);
      expect(result.results[0].ranking).toBe(1);
      expect(result.results[1].ranking).toBe(2);
      expect(result.results[0].overallScore).toBeGreaterThan(result.results[1].overallScore);
    });

    it('generates appropriate recommendations based on scores', async () => {
      jest.spyOn(employerService, 'getCandidateProfile')
        .mockResolvedValueOnce({
          userId: 'high_performer',
          skillLevels: [{ skillId: 'javascript', currentLevel: 9 } as any],
          learningVelocity: 95
        } as CandidateProfile)
        .mockResolvedValueOnce({
          userId: 'low_performer',
          skillLevels: [{ skillId: 'javascript', currentLevel: 3 } as any],
          learningVelocity: 40
        } as CandidateProfile);

      const candidateIds = ['high_performer', 'low_performer'];
      const criteria: ComparisonCriteria[] = [
        {
          criteriaId: 'skill_js',
          name: 'JavaScript Skill',
          type: 'skill_level',
          weight: 1,
          skillId: 'javascript'
        }
      ];

      const result = await employerService.compareCandidates(candidateIds, criteria, 'employer1');

      expect(result.results[0].recommendation).toBe('highly_recommended');
      expect(result.results[1].recommendation).toBe('not_recommended');
    });
  });

  describe('error handling', () => {
    it('handles service errors gracefully', async () => {
      jest.spyOn(employerService as any, 'getCandidateProfiles').mockRejectedValue(new Error('Network error'));

      await expect(employerService.getEmployerDashboard('employer1')).rejects.toThrow('Failed to load dashboard data');
    });

    it('handles comparison errors gracefully', async () => {
      jest.spyOn(employerService, 'getCandidateProfile').mockRejectedValue(new Error('Database error'));

      await expect(
        employerService.compareCandidates(['candidate1'], [], 'employer1')
      ).rejects.toThrow('Failed to compare candidates');
    });
  });
});