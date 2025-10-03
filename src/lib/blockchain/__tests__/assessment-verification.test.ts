import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AssessmentVerificationService } from '../assessment-verification';
import type { AssessmentResult } from '../assessment-verification';

// Mock the blockchain verification service
vi.mock('../verification-service', () => ({
  blockchainVerificationService: {
    mintEnhancedBadge: vi.fn().mockResolvedValue({
      success: true,
      txHash: '0xabcdef1234567890',
      tokenId: '42',
      badge: {
        id: 'assessment-badge-123',
        name: 'TechCorp Excellent Performance',
        description: 'Completed Full Stack Assessment with 85% score',
        txHash: '0xabcdef1234567890',
        date: new Date().toISOString(),
        icon: 'data:image/svg+xml;base64,PHN2Zw==',
        verificationStatus: 'verified',
        metadata: {
          skillProgression: {
            skillLevel: 3,
            experiencePoints: 850,
            isLevelUp: false,
            competencyAreas: ['JavaScript', 'React', 'Node.js']
          }
        },
        blockchainData: {
          contractAddress: '0x742d35Cc6634C0532925a3b8D4C9db96C4b5Da5e',
          tokenId: '42',
          network: 'sepolia',
          blockNumber: 12345678,
          gasUsed: 150000,
          confirmations: 1,
          verificationUrl: 'https://sepolia.etherscan.io/tx/0xabcdef1234567890'
        }
      }
    }),
    verifyBadge: vi.fn().mockResolvedValue({
      isValid: true,
      tokenId: '42',
      owner: '0x742d35Cc6634C0532925a3b8D4C9db96C4b5Da5e',
      metadata: {
        onChainMetadata: {
          assessment_data: {
            assessmentId: 'assessment-123',
            employerId: 'employer-456',
            performanceLevel: 'exceeds_expectations'
          }
        }
      }
    })
  }
}));

// Mock environment variables
const mockEnv = {
  SERVER_WALLET_ADDRESS: '0x742d35Cc6634C0532925a3b8D4C9db96C4b5Da5e'
};

describe('AssessmentVerificationService', () => {
  let service: AssessmentVerificationService;

  beforeEach(() => {
    vi.stubEnv('SERVER_WALLET_ADDRESS', mockEnv.SERVER_WALLET_ADDRESS);
    service = new AssessmentVerificationService();
  });

  describe('verifyAssessmentCompletion', () => {
    it('should create blockchain verification for assessment completion', async () => {
      const assessmentResult: AssessmentResult = {
        assessmentId: 'assessment-123',
        userId: 'user-456',
        employerId: 'employer-789',
        completedAt: new Date().toISOString(),
        totalScore: 85,
        maxScore: 100,
        percentageScore: 85,
        performanceLevel: 'exceeds_expectations',
        skillsAssessed: [
          {
            skillName: 'JavaScript',
            score: 88,
            maxScore: 100,
            level: 'advanced',
            feedback: 'Excellent understanding of modern JavaScript features'
          },
          {
            skillName: 'React',
            score: 82,
            maxScore: 100,
            level: 'intermediate',
            feedback: 'Good component design and state management'
          }
        ],
        timeSpent: 120, // 2 hours
        codeSubmissions: [
          {
            questionId: 'q1',
            code: 'const fetchData = async () => { /* implementation */ }',
            language: 'javascript',
            score: 85,
            feedback: ['Clean async/await usage', 'Good error handling'],
            testsPassed: 8,
            totalTests: 10
          }
        ],
        aiAnalysis: {
          overallQuality: 85,
          problemSolvingApproach: 'Systematic and well-structured approach',
          codeOrganization: 88,
          algorithmicThinking: 82,
          bestPracticesAdherence: 86,
          creativityScore: 78,
          strengths: ['Clean code structure', 'Good error handling', 'Modern JavaScript usage'],
          improvementAreas: ['Algorithm optimization', 'Testing practices'],
          recommendedNextSteps: ['Practice advanced algorithms', 'Learn testing frameworks']
        }
      };

      const employerInfo = {
        companyName: 'TechCorp',
        assessmentTitle: 'Full Stack Developer Assessment',
        jobRole: 'Senior Frontend Developer',
        industry: 'Technology'
      };

      const result = await service.verifyAssessmentCompletion(assessmentResult, employerInfo);

      expect(result.success).toBe(true);
      expect(result.verificationBadge).toBeDefined();
      expect(result.verificationBadge?.name).toBe('TechCorp Excellent Performance');
      expect(result.verificationBadge?.assessmentData.assessmentId).toBe('assessment-123');
      expect(result.verificationBadge?.assessmentData.performanceLevel).toBe('exceeds_expectations');
      expect(result.txHash).toBe('0xabcdef1234567890');
    });

    it('should handle different performance levels correctly', async () => {
      const assessmentResult: AssessmentResult = {
        assessmentId: 'assessment-456',
        userId: 'user-789',
        employerId: 'employer-123',
        completedAt: new Date().toISOString(),
        totalScore: 95,
        maxScore: 100,
        percentageScore: 95,
        performanceLevel: 'exceptional',
        skillsAssessed: [
          {
            skillName: 'TypeScript',
            score: 95,
            maxScore: 100,
            level: 'expert',
            feedback: 'Outstanding mastery of TypeScript features'
          }
        ],
        timeSpent: 90,
        codeSubmissions: [],
        aiAnalysis: {
          overallQuality: 95,
          problemSolvingApproach: 'Innovative and efficient',
          codeOrganization: 98,
          algorithmicThinking: 94,
          bestPracticesAdherence: 96,
          creativityScore: 92,
          strengths: ['Exceptional code quality', 'Innovative solutions'],
          improvementAreas: [],
          recommendedNextSteps: ['Lead technical initiatives', 'Mentor junior developers']
        }
      };

      const employerInfo = {
        companyName: 'InnovateTech',
        assessmentTitle: 'Senior TypeScript Assessment',
        jobRole: 'Lead Developer',
        industry: 'Software'
      };

      const result = await service.verifyAssessmentCompletion(assessmentResult, employerInfo);

      expect(result.success).toBe(true);
      expect(result.verificationBadge?.name).toBe('InnovateTech Outstanding Achievement');
      expect(result.verificationBadge?.assessmentData.performanceLevel).toBe('exceptional');
    });
  });

  describe('verifyAssessmentAuthenticity', () => {
    it('should verify assessment result authenticity', async () => {
      const txHash = '0xabcdef1234567890';
      const assessmentId = 'assessment-123';

      const result = await service.verifyAssessmentAuthenticity(txHash, assessmentId);

      expect(result.isValid).toBe(true);
      expect(result.assessmentData).toBeDefined();
      expect(result.assessmentData.assessmentId).toBe('assessment-123');
      expect(result.verificationDetails).toBeDefined();
      expect(result.verificationDetails.blockchainVerified).toBe(true);
      expect(result.verificationDetails.tamperProof).toBe(true);
    });

    it('should detect assessment ID mismatch', async () => {
      // Mock verification service to return different assessment ID
      const mockVerifyBadge = vi.fn().mockResolvedValue({
        isValid: true,
        tokenId: '42',
        owner: '0x742d35Cc6634C0532925a3b8D4C9db96C4b5Da5e',
        metadata: {
          onChainMetadata: {
            assessment_data: {
              assessmentId: 'different-assessment-id',
              employerId: 'employer-456',
              performanceLevel: 'exceeds_expectations'
            }
          }
        }
      });

      const { blockchainVerificationService } = await import('../verification-service');
      vi.mocked(blockchainVerificationService.verifyBadge).mockImplementation(mockVerifyBadge);

      const result = await service.verifyAssessmentAuthenticity('0xabcdef1234567890', 'assessment-123');

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Assessment ID mismatch');
    });
  });

  describe('createEmployerVerificationTools', () => {
    it('should create comprehensive employer verification tools', async () => {
      const assessmentResult: AssessmentResult = {
        assessmentId: 'assessment-123',
        userId: 'user-456',
        employerId: 'employer-789',
        completedAt: new Date().toISOString(),
        totalScore: 85,
        maxScore: 100,
        percentageScore: 85,
        performanceLevel: 'exceeds_expectations',
        skillsAssessed: [
          {
            skillName: 'JavaScript',
            score: 88,
            maxScore: 100,
            level: 'advanced',
            feedback: 'Excellent understanding'
          },
          {
            skillName: 'React',
            score: 82,
            maxScore: 100,
            level: 'intermediate',
            feedback: 'Good component design'
          }
        ],
        timeSpent: 120,
        codeSubmissions: [],
        aiAnalysis: {
          overallQuality: 85,
          problemSolvingApproach: 'Systematic approach',
          codeOrganization: 88,
          algorithmicThinking: 82,
          bestPracticesAdherence: 86,
          creativityScore: 78,
          strengths: ['Clean code', 'Good practices'],
          improvementAreas: ['Algorithm optimization'],
          recommendedNextSteps: ['Practice algorithms']
        }
      };

      const verificationBadge = {
        id: 'badge-123',
        name: 'TechCorp Assessment',
        description: 'Assessment completion',
        txHash: '0xabcdef1234567890',
        date: new Date().toISOString(),
        icon: 'data:image/svg+xml;base64,PHN2Zw==',
        assessmentData: {
          assessmentId: 'assessment-123',
          employerId: 'employer-789',
          performanceLevel: 'exceeds_expectations' as const,
          skillsVerified: ['JavaScript', 'React'],
          completionDate: new Date().toISOString(),
          validUntil: new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000).toISOString()
        },
        blockchainData: {
          contractAddress: '0x742d35Cc6634C0532925a3b8D4C9db96C4b5Da5e',
          tokenId: '42',
          network: 'sepolia' as const,
          blockNumber: 12345678,
          gasUsed: 150000,
          confirmations: 1,
          verificationUrl: 'https://sepolia.etherscan.io/tx/0xabcdef1234567890'
        }
      };

      const result = await service.createEmployerVerificationTools(assessmentResult, verificationBadge);

      expect(result.verificationReport).toBeDefined();
      expect(result.verificationReport.candidateId).toBe('user-456');
      expect(result.verificationReport.verificationStatus).toBe('blockchain_verified');
      expect(result.verificationReport.tamperProof).toBe(true);

      expect(result.skillBreakdown).toBeDefined();
      expect(result.skillBreakdown.overallScore).toBe(85);
      expect(result.skillBreakdown.performanceLevel).toBe('exceeds_expectations');
      expect(result.skillBreakdown.skillsAssessed).toHaveLength(2);

      expect(result.performanceAnalysis).toBeDefined();
      expect(result.performanceAnalysis.strengths).toEqual(['Clean code', 'Good practices']);
      expect(result.performanceAnalysis.improvementAreas).toEqual(['Algorithm optimization']);

      expect(result.recommendationSummary).toBeDefined();
      expect(result.recommendationSummary.hiringRecommendation).toContain('Recommended');
      expect(result.recommendationSummary.roleAlignment).toBeDefined();
      expect(result.recommendationSummary.marketComparison).toBeDefined();
    });
  });

  describe('Performance Level Mapping', () => {
    it('should map performance levels to correct badge names', async () => {
      const testCases = [
        { level: 'below_expectations' as const, expectedName: 'Assessment Completion' },
        { level: 'meets_expectations' as const, expectedName: 'Competent Performance' },
        { level: 'exceeds_expectations' as const, expectedName: 'Excellent Performance' },
        { level: 'exceptional' as const, expectedName: 'Outstanding Achievement' }
      ];

      for (const testCase of testCases) {
        const assessmentResult: AssessmentResult = {
          assessmentId: 'test-assessment',
          userId: 'test-user',
          employerId: 'test-employer',
          completedAt: new Date().toISOString(),
          totalScore: 70,
          maxScore: 100,
          percentageScore: 70,
          performanceLevel: testCase.level,
          skillsAssessed: [],
          timeSpent: 60,
          codeSubmissions: [],
          aiAnalysis: {
            overallQuality: 70,
            problemSolvingApproach: 'Standard approach',
            codeOrganization: 70,
            algorithmicThinking: 70,
            bestPracticesAdherence: 70,
            creativityScore: 70,
            strengths: [],
            improvementAreas: [],
            recommendedNextSteps: []
          }
        };

        const employerInfo = {
          companyName: 'TestCorp',
          assessmentTitle: 'Test Assessment'
        };

        const result = await service.verifyAssessmentCompletion(assessmentResult, employerInfo);

        expect(result.success).toBe(true);
        expect(result.verificationBadge?.name).toBe(`TestCorp ${testCase.expectedName}`);
      }
    });
  });
});