import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AssessmentVerificationService } from '../assessment-verification';
import { BlockchainVerificationService } from '../verification-service';
import type { AssessmentResult } from '../assessment-verification';

// Mock the blockchain verification service
vi.mock('../verification-service');

describe('Assessment Verification Integration', () => {
  let assessmentService: AssessmentVerificationService;
  let mockBlockchainService: any;

  beforeEach(() => {
    vi.stubEnv('SERVER_WALLET_ADDRESS', '0x742d35Cc6634C0532925a3b8D4C9db96C4b5Da5e');
    assessmentService = new AssessmentVerificationService();
    mockBlockchainService = {
      mintEnhancedBadge: vi.fn(),
      verifyBadge: vi.fn(),
      createEmployerVerificationData: vi.fn()
    };
    
    // Mock the imported service
    vi.mocked(require('../verification-service').blockchainVerificationService).mockImplementation(() => mockBlockchainService);
  });

  describe('End-to-End Assessment Verification Flow', () => {
    it('should complete full assessment verification workflow', async () => {
      // Setup mock responses
      mockBlockchainService.mintEnhancedBadge.mockResolvedValue({
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
            },
            achievementDetails: {
              codeQuality: 85,
              efficiency: 82,
              creativity: 78,
              bestPractices: 86,
              complexity: 'advanced',
              detectedSkills: ['JavaScript', 'React', 'Node.js'],
              improvementAreas: ['Algorithm optimization'],
              strengths: ['Clean code', 'Good practices']
            },
            verificationData: {
              issuedAt: new Date().toISOString(),
              issuerId: 'employer-789',
              verificationMethod: 'assessment'
            },
            rarity: {
              level: 'rare',
              totalIssued: 247,
              rarityScore: 85
            },
            employerInfo: {
              jobRelevance: ['Frontend Developer', 'Full Stack Developer'],
              marketValue: 85,
              demandLevel: 'high',
              salaryImpact: 15
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
      });

      mockBlockchainService.verifyBadge.mockResolvedValue({
        isValid: true,
        tokenId: '42',
        owner: '0x742d35Cc6634C0532925a3b8D4C9db96C4b5Da5e',
        metadata: {
          onChainMetadata: {
            assessment_data: {
              assessmentId: 'assessment-123',
              employerId: 'employer-789',
              performanceLevel: 'exceeds_expectations'
            }
          }
        }
      });

      // Create comprehensive assessment result
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
            feedback: 'Excellent understanding of modern JavaScript features and async programming'
          },
          {
            skillName: 'React',
            score: 82,
            maxScore: 100,
            level: 'intermediate',
            feedback: 'Good component design and state management skills'
          },
          {
            skillName: 'Node.js',
            score: 85,
            maxScore: 100,
            level: 'advanced',
            feedback: 'Strong backend development and API design skills'
          }
        ],
        timeSpent: 120,
        codeSubmissions: [
          {
            questionId: 'q1-async-programming',
            code: `
              const fetchUserData = async (userId) => {
                try {
                  const response = await fetch(\`/api/users/\${userId}\`);
                  if (!response.ok) {
                    throw new Error('Failed to fetch user data');
                  }
                  return await response.json();
                } catch (error) {
                  console.error('Error fetching user:', error);
                  throw error;
                }
              };
            `,
            language: 'javascript',
            score: 88,
            feedback: [
              'Excellent async/await usage',
              'Proper error handling implementation',
              'Clean and readable code structure'
            ],
            executionTime: 45,
            testsPassed: 9,
            totalTests: 10
          },
          {
            questionId: 'q2-react-component',
            code: `
              import React, { useState, useEffect } from 'react';
              
              const UserProfile = ({ userId }) => {
                const [user, setUser] = useState(null);
                const [loading, setLoading] = useState(true);
                const [error, setError] = useState(null);
                
                useEffect(() => {
                  const loadUser = async () => {
                    try {
                      setLoading(true);
                      const userData = await fetchUserData(userId);
                      setUser(userData);
                    } catch (err) {
                      setError(err.message);
                    } finally {
                      setLoading(false);
                    }
                  };
                  
                  loadUser();
                }, [userId]);
                
                if (loading) return <div>Loading...</div>;
                if (error) return <div>Error: {error}</div>;
                
                return (
                  <div className="user-profile">
                    <h2>{user.name}</h2>
                    <p>{user.email}</p>
                  </div>
                );
              };
            `,
            language: 'javascript',
            score: 82,
            feedback: [
              'Good React hooks usage',
              'Proper loading and error states',
              'Component structure could be improved'
            ],
            executionTime: 60,
            testsPassed: 8,
            totalTests: 10
          }
        ],
        aiAnalysis: {
          overallQuality: 85,
          problemSolvingApproach: 'Systematic and methodical approach to problem-solving with good consideration of edge cases and error handling',
          codeOrganization: 88,
          algorithmicThinking: 82,
          bestPracticesAdherence: 86,
          creativityScore: 78,
          strengths: [
            'Excellent async/await and Promise handling',
            'Clean and readable code structure',
            'Good error handling practices',
            'Proper React hooks usage',
            'Strong understanding of modern JavaScript'
          ],
          improvementAreas: [
            'Algorithm optimization techniques',
            'Advanced React patterns (custom hooks, context)',
            'Performance optimization strategies',
            'Testing implementation'
          ],
          recommendedNextSteps: [
            'Practice advanced algorithm problems',
            'Learn React performance optimization',
            'Implement comprehensive testing strategies',
            'Study system design patterns'
          ]
        }
      };

      const employerInfo = {
        companyName: 'TechCorp',
        assessmentTitle: 'Full Stack Developer Assessment',
        jobRole: 'Senior Frontend Developer',
        industry: 'Technology'
      };

      // Step 1: Create assessment verification
      const verificationResult = await assessmentService.verifyAssessmentCompletion(
        assessmentResult,
        employerInfo
      );

      expect(verificationResult.success).toBe(true);
      expect(verificationResult.verificationBadge).toBeDefined();
      expect(verificationResult.txHash).toBe('0xabcdef1234567890');

      // Verify the badge contains assessment data
      const badge = verificationResult.verificationBadge!;
      expect(badge.assessmentData.assessmentId).toBe('assessment-123');
      expect(badge.assessmentData.performanceLevel).toBe('exceeds_expectations');
      expect(badge.assessmentData.skillsVerified).toEqual(['JavaScript', 'React', 'Node.js']);

      // Step 2: Verify assessment authenticity
      const authenticityResult = await assessmentService.verifyAssessmentAuthenticity(
        '0xabcdef1234567890',
        'assessment-123'
      );

      expect(authenticityResult.isValid).toBe(true);
      expect(authenticityResult.assessmentData.assessmentId).toBe('assessment-123');
      expect(authenticityResult.verificationDetails.blockchainVerified).toBe(true);

      // Step 3: Create employer verification tools
      const employerTools = await assessmentService.createEmployerVerificationTools(
        assessmentResult,
        badge
      );

      expect(employerTools.verificationReport).toBeDefined();
      expect(employerTools.verificationReport.verificationStatus).toBe('blockchain_verified');
      expect(employerTools.verificationReport.tamperProof).toBe(true);

      expect(employerTools.skillBreakdown).toBeDefined();
      expect(employerTools.skillBreakdown.overallScore).toBe(85);
      expect(employerTools.skillBreakdown.skillsAssessed).toHaveLength(3);

      expect(employerTools.performanceAnalysis).toBeDefined();
      expect(employerTools.performanceAnalysis.strengths).toContain('Excellent async/await and Promise handling');

      expect(employerTools.recommendationSummary).toBeDefined();
      expect(employerTools.recommendationSummary.hiringRecommendation).toContain('Recommended');

      // Verify blockchain service was called with correct parameters
      expect(mockBlockchainService.mintEnhancedBadge).toHaveBeenCalledWith(
        expect.any(String), // wallet address
        expect.objectContaining({
          name: 'TechCorp Excellent Performance',
          description: expect.stringContaining('85%')
        }),
        expect.objectContaining({
          skillProgression: expect.objectContaining({
            skillLevel: 3,
            competencyAreas: ['JavaScript', 'React', 'Node.js']
          }),
          verificationData: expect.objectContaining({
            verificationMethod: 'assessment'
          })
        }),
        expect.objectContaining({
          includeMetadata: true,
          enableVerification: true
        })
      );
    });

    it('should handle assessment verification failures gracefully', async () => {
      // Mock blockchain service failure
      mockBlockchainService.mintEnhancedBadge.mockResolvedValue({
        success: false,
        error: 'Blockchain network unavailable'
      });

      const assessmentResult: AssessmentResult = {
        assessmentId: 'assessment-456',
        userId: 'user-789',
        employerId: 'employer-123',
        completedAt: new Date().toISOString(),
        totalScore: 75,
        maxScore: 100,
        percentageScore: 75,
        performanceLevel: 'meets_expectations',
        skillsAssessed: [],
        timeSpent: 90,
        codeSubmissions: [],
        aiAnalysis: {
          overallQuality: 75,
          problemSolvingApproach: 'Standard approach',
          codeOrganization: 75,
          algorithmicThinking: 75,
          bestPracticesAdherence: 75,
          creativityScore: 70,
          strengths: [],
          improvementAreas: [],
          recommendedNextSteps: []
        }
      };

      const employerInfo = {
        companyName: 'TestCorp',
        assessmentTitle: 'Basic Assessment'
      };

      const result = await assessmentService.verifyAssessmentCompletion(
        assessmentResult,
        employerInfo
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Blockchain network unavailable');
    });

    it('should validate assessment result completeness', async () => {
      // Test with incomplete assessment result
      const incompleteAssessment = {
        assessmentId: 'test-123',
        userId: 'user-456',
        // Missing required fields
      } as any;

      const employerInfo = {
        companyName: 'TestCorp',
        assessmentTitle: 'Test Assessment'
      };

      await expect(
        assessmentService.verifyAssessmentCompletion(incompleteAssessment, employerInfo)
      ).rejects.toThrow();
    });
  });

  describe('Performance Level Mapping and Rarity Calculation', () => {
    it('should correctly map performance levels to skill levels and rarity', async () => {
      const testCases = [
        {
          performanceLevel: 'exceptional' as const,
          expectedSkillLevel: 4,
          expectedRarity: 'epic' as const,
          score: 95
        },
        {
          performanceLevel: 'exceeds_expectations' as const,
          expectedSkillLevel: 3,
          expectedRarity: 'rare' as const,
          score: 85
        },
        {
          performanceLevel: 'meets_expectations' as const,
          expectedSkillLevel: 2,
          expectedRarity: 'uncommon' as const,
          score: 75
        },
        {
          performanceLevel: 'below_expectations' as const,
          expectedSkillLevel: 1,
          expectedRarity: 'common' as const,
          score: 60
        }
      ];

      for (const testCase of testCases) {
        mockBlockchainService.mintEnhancedBadge.mockResolvedValue({
          success: true,
          txHash: '0xtest123',
          badge: {
            metadata: {
              skillProgression: {
                skillLevel: testCase.expectedSkillLevel
              },
              rarity: {
                level: testCase.expectedRarity
              }
            }
          }
        });

        const assessmentResult: AssessmentResult = {
          assessmentId: `test-${testCase.performanceLevel}`,
          userId: 'test-user',
          employerId: 'test-employer',
          completedAt: new Date().toISOString(),
          totalScore: testCase.score,
          maxScore: 100,
          percentageScore: testCase.score,
          performanceLevel: testCase.performanceLevel,
          skillsAssessed: [],
          timeSpent: 60,
          codeSubmissions: [],
          aiAnalysis: {
            overallQuality: testCase.score,
            problemSolvingApproach: 'Test approach',
            codeOrganization: testCase.score,
            algorithmicThinking: testCase.score,
            bestPracticesAdherence: testCase.score,
            creativityScore: testCase.score,
            strengths: [],
            improvementAreas: [],
            recommendedNextSteps: []
          }
        };

        const employerInfo = {
          companyName: 'TestCorp',
          assessmentTitle: 'Performance Level Test'
        };

        const result = await assessmentService.verifyAssessmentCompletion(
          assessmentResult,
          employerInfo
        );

        expect(result.success).toBe(true);
        expect(result.verificationBadge?.metadata?.skillProgression.skillLevel).toBe(testCase.expectedSkillLevel);
        expect(result.verificationBadge?.metadata?.rarity?.level).toBe(testCase.expectedRarity);
      }
    });
  });

  describe('Market Value and Salary Impact Calculation', () => {
    it('should calculate appropriate market values based on performance and skills', async () => {
      mockBlockchainService.mintEnhancedBadge.mockResolvedValue({
        success: true,
        txHash: '0xtest123',
        badge: {
          metadata: {
            employerInfo: {
              marketValue: 85,
              salaryImpact: 20,
              demandLevel: 'high'
            }
          }
        }
      });

      const highPerformanceAssessment: AssessmentResult = {
        assessmentId: 'high-performance-test',
        userId: 'user-123',
        employerId: 'employer-456',
        completedAt: new Date().toISOString(),
        totalScore: 92,
        maxScore: 100,
        percentageScore: 92,
        performanceLevel: 'exceptional',
        skillsAssessed: [
          { skillName: 'JavaScript', score: 95, maxScore: 100, level: 'expert', feedback: 'Outstanding' },
          { skillName: 'TypeScript', score: 90, maxScore: 100, level: 'advanced', feedback: 'Excellent' },
          { skillName: 'React', score: 88, maxScore: 100, level: 'advanced', feedback: 'Very good' },
          { skillName: 'Node.js', score: 94, maxScore: 100, level: 'expert', feedback: 'Exceptional' }
        ],
        timeSpent: 90, // Efficient completion
        codeSubmissions: [],
        aiAnalysis: {
          overallQuality: 92,
          problemSolvingApproach: 'Innovative and efficient',
          codeOrganization: 95,
          algorithmicThinking: 90,
          bestPracticesAdherence: 94,
          creativityScore: 88,
          strengths: ['Exceptional technical skills', 'Innovative problem solving'],
          improvementAreas: [],
          recommendedNextSteps: ['Lead technical initiatives']
        }
      };

      const employerInfo = {
        companyName: 'TechLeader Inc.',
        assessmentTitle: 'Senior Full Stack Assessment',
        jobRole: 'Lead Developer',
        industry: 'Technology'
      };

      const result = await assessmentService.verifyAssessmentCompletion(
        highPerformanceAssessment,
        employerInfo
      );

      expect(result.success).toBe(true);
      
      const employerTools = await assessmentService.createEmployerVerificationTools(
        highPerformanceAssessment,
        result.verificationBadge!
      );

      expect(employerTools.recommendationSummary.hiringRecommendation).toContain('Strongly Recommended');
      expect(employerTools.recommendationSummary.roleAlignment).toContain('senior');
      expect(employerTools.skillBreakdown.timeEfficiency).toBe('Highly Efficient');
    });
  });
});