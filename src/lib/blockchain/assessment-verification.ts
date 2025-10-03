/**
 * Assessment Result Blockchain Verification Service
 * Handles verification of custom assessment completions and results
 */

import { ethers } from 'ethers';
import type { Badge, BadgeMetadata, BlockchainVerificationData } from '@/types';
import { blockchainVerificationService } from './verification-service';

export interface AssessmentResult {
  assessmentId: string;
  userId: string;
  employerId: string;
  completedAt: string;
  totalScore: number;
  maxScore: number;
  percentageScore: number;
  performanceLevel: 'below_expectations' | 'meets_expectations' | 'exceeds_expectations' | 'exceptional';
  skillsAssessed: AssessmentSkill[];
  timeSpent: number; // in minutes
  codeSubmissions: AssessmentSubmission[];
  aiAnalysis: AssessmentAIAnalysis;
}

export interface AssessmentSkill {
  skillName: string;
  score: number;
  maxScore: number;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  feedback: string;
}

export interface AssessmentSubmission {
  questionId: string;
  code: string;
  language: string;
  score: number;
  feedback: string[];
  executionTime?: number;
  testsPassed: number;
  totalTests: number;
}

export interface AssessmentAIAnalysis {
  overallQuality: number;
  problemSolvingApproach: string;
  codeOrganization: number;
  algorithmicThinking: number;
  bestPracticesAdherence: number;
  creativityScore: number;
  strengths: string[];
  improvementAreas: string[];
  recommendedNextSteps: string[];
}

export interface AssessmentVerificationBadge extends Badge {
  assessmentData: {
    assessmentId: string;
    employerId: string;
    performanceLevel: AssessmentResult['performanceLevel'];
    skillsVerified: string[];
    completionDate: string;
    validUntil?: string;
  };
}

export class AssessmentVerificationService {
  /**
   * Create blockchain verification for assessment completion
   */
  async verifyAssessmentCompletion(
    assessmentResult: AssessmentResult,
    employerInfo: {
      companyName: string;
      assessmentTitle: string;
      jobRole?: string;
      industry?: string;
    }
  ): Promise<{
    success: boolean;
    verificationBadge?: AssessmentVerificationBadge;
    txHash?: string;
    error?: string;
  }> {
    try {
      // 1. Create assessment verification badge
      const badgeDetails = this.createAssessmentBadgeDetails(assessmentResult, employerInfo);
      
      // 2. Create comprehensive metadata
      const metadata = this.createAssessmentMetadata(assessmentResult, employerInfo);
      
      // 3. Mint verification badge on blockchain
      const mintResult = await blockchainVerificationService.mintEnhancedBadge(
        process.env.SERVER_WALLET_ADDRESS || '', // Mint to server wallet first
        badgeDetails,
        metadata,
        {
          includeMetadata: true,
          generateIPFS: false,
          enableVerification: true,
          rarityCalculation: true
        }
      );

      if (!mintResult.success) {
        return {
          success: false,
          error: mintResult.error
        };
      }

      // 4. Create assessment verification badge
      const verificationBadge: AssessmentVerificationBadge = {
        ...mintResult.badge!,
        assessmentData: {
          assessmentId: assessmentResult.assessmentId,
          employerId: assessmentResult.employerId,
          performanceLevel: assessmentResult.performanceLevel,
          skillsVerified: assessmentResult.skillsAssessed.map(skill => skill.skillName),
          completionDate: assessmentResult.completedAt,
          validUntil: this.calculateExpirationDate(assessmentResult.completedAt)
        }
      };

      return {
        success: true,
        verificationBadge,
        txHash: mintResult.txHash
      };

    } catch (error) {
      console.error('Assessment verification failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Assessment verification failed'
      };
    }
  }

  /**
   * Verify assessment result authenticity
   */
  async verifyAssessmentAuthenticity(
    txHash: string,
    assessmentId: string
  ): Promise<{
    isValid: boolean;
    assessmentData?: any;
    verificationDetails?: any;
    error?: string;
  }> {
    try {
      // Verify the blockchain transaction
      const verificationResult = await blockchainVerificationService.verifyBadge(txHash);
      
      if (!verificationResult.isValid) {
        return {
          isValid: false,
          error: verificationResult.error
        };
      }

      // Extract assessment data from metadata
      const onChainMetadata = verificationResult.metadata?.onChainMetadata;
      if (!onChainMetadata) {
        return {
          isValid: false,
          error: 'Assessment metadata not found on blockchain'
        };
      }

      // Verify assessment ID matches
      const assessmentData = onChainMetadata.assessment_data;
      if (assessmentData?.assessmentId !== assessmentId) {
        return {
          isValid: false,
          error: 'Assessment ID mismatch'
        };
      }

      return {
        isValid: true,
        assessmentData: assessmentData,
        verificationDetails: {
          tokenId: verificationResult.tokenId,
          owner: verificationResult.owner,
          blockchainVerified: true,
          tamperProof: true
        }
      };

    } catch (error) {
      console.error('Assessment authenticity verification failed:', error);
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Verification failed'
      };
    }
  }

  /**
   * Create employer verification tools for assessment results
   */
  async createEmployerVerificationTools(
    assessmentResult: AssessmentResult,
    verificationBadge: AssessmentVerificationBadge
  ): Promise<{
    verificationReport: any;
    skillBreakdown: any;
    performanceAnalysis: any;
    recommendationSummary: any;
  }> {
    const verificationReport = {
      candidateId: assessmentResult.userId,
      assessmentId: assessmentResult.assessmentId,
      completionDate: assessmentResult.completedAt,
      verificationStatus: 'blockchain_verified',
      transactionHash: verificationBadge.txHash,
      blockchainNetwork: verificationBadge.blockchainData?.network,
      tokenId: verificationBadge.blockchainData?.tokenId,
      tamperProof: true,
      validUntil: verificationBadge.assessmentData.validUntil
    };

    const skillBreakdown = {
      overallScore: assessmentResult.percentageScore,
      performanceLevel: assessmentResult.performanceLevel,
      skillsAssessed: assessmentResult.skillsAssessed.map(skill => ({
        skillName: skill.skillName,
        score: skill.score,
        maxScore: skill.maxScore,
        percentage: Math.round((skill.score / skill.maxScore) * 100),
        level: skill.level,
        feedback: skill.feedback
      })),
      timeEfficiency: this.calculateTimeEfficiency(assessmentResult.timeSpent, assessmentResult.skillsAssessed.length),
      codeQuality: assessmentResult.aiAnalysis.overallQuality
    };

    const performanceAnalysis = {
      strengths: assessmentResult.aiAnalysis.strengths,
      improvementAreas: assessmentResult.aiAnalysis.improvementAreas,
      problemSolvingScore: assessmentResult.aiAnalysis.algorithmicThinking,
      codeOrganizationScore: assessmentResult.aiAnalysis.codeOrganization,
      creativityScore: assessmentResult.aiAnalysis.creativityScore,
      bestPracticesScore: assessmentResult.aiAnalysis.bestPracticesAdherence,
      approachDescription: assessmentResult.aiAnalysis.problemSolvingApproach
    };

    const recommendationSummary = {
      hiringRecommendation: this.generateHiringRecommendation(assessmentResult),
      roleAlignment: this.assessRoleAlignment(assessmentResult),
      developmentAreas: assessmentResult.aiAnalysis.improvementAreas,
      nextSteps: assessmentResult.aiAnalysis.recommendedNextSteps,
      marketComparison: await this.getMarketComparison(assessmentResult)
    };

    return {
      verificationReport,
      skillBreakdown,
      performanceAnalysis,
      recommendationSummary
    };
  }

  // Private helper methods

  private createAssessmentBadgeDetails(
    assessmentResult: AssessmentResult,
    employerInfo: any
  ): Omit<Badge, 'id' | 'txHash' | 'date' | 'verificationStatus' | 'blockchainData'> {
    const performanceLevelMap = {
      'below_expectations': 'Assessment Completion',
      'meets_expectations': 'Competent Performance',
      'exceeds_expectations': 'Excellent Performance',
      'exceptional': 'Outstanding Achievement'
    };

    return {
      name: `${employerInfo.companyName} ${performanceLevelMap[assessmentResult.performanceLevel]}`,
      description: `Completed ${employerInfo.assessmentTitle} assessment with ${assessmentResult.percentageScore}% score. Verified skills: ${assessmentResult.skillsAssessed.map(s => s.skillName).join(', ')}.`,
      icon: this.generateAssessmentBadgeIcon(assessmentResult.performanceLevel)
    };
  }

  private createAssessmentMetadata(
    assessmentResult: AssessmentResult,
    employerInfo: any
  ): BadgeMetadata {
    return {
      skillProgression: {
        skillLevel: this.mapPerformanceToLevel(assessmentResult.performanceLevel),
        experiencePoints: Math.round(assessmentResult.percentageScore * 10),
        isLevelUp: false,
        competencyAreas: assessmentResult.skillsAssessed.map(skill => skill.skillName)
      },
      achievementDetails: {
        codeQuality: assessmentResult.aiAnalysis.overallQuality,
        efficiency: this.calculateEfficiencyScore(assessmentResult),
        creativity: assessmentResult.aiAnalysis.creativityScore,
        bestPractices: assessmentResult.aiAnalysis.bestPracticesAdherence,
        complexity: this.determineComplexity(assessmentResult),
        detectedSkills: assessmentResult.skillsAssessed.map(skill => skill.skillName),
        improvementAreas: assessmentResult.aiAnalysis.improvementAreas,
        strengths: assessmentResult.aiAnalysis.strengths
      },
      verificationData: {
        issuedAt: new Date().toISOString(),
        issuerId: assessmentResult.employerId,
        verificationMethod: 'assessment',
        evidenceHash: this.createEvidenceHash(assessmentResult),
        witnessSignatures: [employerInfo.companyName]
      },
      rarity: {
        level: this.mapPerformanceToRarity(assessmentResult.performanceLevel),
        totalIssued: 0, // Will be calculated by the verification service
        rarityScore: assessmentResult.percentageScore
      },
      employerInfo: {
        jobRelevance: assessmentResult.skillsAssessed.map(skill => skill.skillName),
        marketValue: this.calculateMarketValue(assessmentResult),
        demandLevel: this.assessDemandLevel(assessmentResult.skillsAssessed),
        salaryImpact: this.estimateSalaryImpact(assessmentResult)
      }
    };
  }

  private generateAssessmentBadgeIcon(performanceLevel: AssessmentResult['performanceLevel']): string {
    // Generate SVG badge icon based on performance level
    const colors = {
      'below_expectations': '#6b7280',
      'meets_expectations': '#3b82f6',
      'exceeds_expectations': '#10b981',
      'exceptional': '#f59e0b'
    };

    const color = colors[performanceLevel];
    const svg = `
      <svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="40" fill="${color}"/>
        <text x="50" y="35" font-family="Arial" font-size="12" fill="white" text-anchor="middle">VERIFIED</text>
        <text x="50" y="55" font-family="Arial" font-size="10" fill="white" text-anchor="middle">ASSESSMENT</text>
        <text x="50" y="70" font-family="Arial" font-size="8" fill="white" text-anchor="middle">${performanceLevel.toUpperCase()}</text>
      </svg>
    `;

    return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
  }

  private mapPerformanceToLevel(performanceLevel: AssessmentResult['performanceLevel']): number {
    const levelMap = {
      'below_expectations': 1,
      'meets_expectations': 2,
      'exceeds_expectations': 3,
      'exceptional': 4
    };
    return levelMap[performanceLevel];
  }

  private mapPerformanceToRarity(performanceLevel: AssessmentResult['performanceLevel']): 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' {
    const rarityMap = {
      'below_expectations': 'common' as const,
      'meets_expectations': 'uncommon' as const,
      'exceeds_expectations': 'rare' as const,
      'exceptional': 'epic' as const
    };
    return rarityMap[performanceLevel];
  }

  private calculateEfficiencyScore(assessmentResult: AssessmentResult): number {
    // Calculate efficiency based on time spent vs expected time
    const expectedTimePerSkill = 30; // minutes
    const expectedTotalTime = assessmentResult.skillsAssessed.length * expectedTimePerSkill;
    const efficiency = Math.max(0, Math.min(100, (expectedTotalTime / assessmentResult.timeSpent) * 100));
    return Math.round(efficiency);
  }

  private determineComplexity(assessmentResult: AssessmentResult): 'beginner' | 'intermediate' | 'advanced' | 'expert' {
    const avgSkillLevel = assessmentResult.skillsAssessed.reduce((sum, skill) => {
      const levelMap = { 'beginner': 1, 'intermediate': 2, 'advanced': 3, 'expert': 4 };
      return sum + levelMap[skill.level];
    }, 0) / assessmentResult.skillsAssessed.length;

    if (avgSkillLevel >= 3.5) return 'expert';
    if (avgSkillLevel >= 2.5) return 'advanced';
    if (avgSkillLevel >= 1.5) return 'intermediate';
    return 'beginner';
  }

  private createEvidenceHash(assessmentResult: AssessmentResult): string {
    // Create a hash of the assessment data for tamper detection
    const evidenceData = {
      assessmentId: assessmentResult.assessmentId,
      userId: assessmentResult.userId,
      totalScore: assessmentResult.totalScore,
      completedAt: assessmentResult.completedAt,
      skillsAssessed: assessmentResult.skillsAssessed.map(s => ({ name: s.skillName, score: s.score }))
    };
    
    return ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(evidenceData)));
  }

  private calculateMarketValue(assessmentResult: AssessmentResult): number {
    // Calculate market value based on skills and performance
    const baseValue = 50;
    const performanceMultiplier = {
      'below_expectations': 0.8,
      'meets_expectations': 1.0,
      'exceeds_expectations': 1.3,
      'exceptional': 1.6
    };
    
    const skillCount = assessmentResult.skillsAssessed.length;
    const qualityBonus = assessmentResult.aiAnalysis.overallQuality / 100;
    
    return Math.round(baseValue * performanceMultiplier[assessmentResult.performanceLevel] * (1 + skillCount * 0.1) * (1 + qualityBonus));
  }

  private assessDemandLevel(skills: AssessmentSkill[]): 'low' | 'medium' | 'high' | 'critical' {
    // Assess demand level based on skills assessed
    const highDemandSkills = ['JavaScript', 'TypeScript', 'React', 'Python', 'AWS', 'Docker', 'Kubernetes'];
    const matchingSkills = skills.filter(skill => 
      highDemandSkills.some(demand => skill.skillName.toLowerCase().includes(demand.toLowerCase()))
    );
    
    const demandRatio = matchingSkills.length / skills.length;
    
    if (demandRatio >= 0.8) return 'critical';
    if (demandRatio >= 0.6) return 'high';
    if (demandRatio >= 0.3) return 'medium';
    return 'low';
  }

  private estimateSalaryImpact(assessmentResult: AssessmentResult): number {
    // Estimate salary impact percentage based on performance and skills
    const baseImpact = {
      'below_expectations': 0,
      'meets_expectations': 5,
      'exceeds_expectations': 15,
      'exceptional': 25
    };
    
    const skillBonus = Math.min(10, assessmentResult.skillsAssessed.length * 2);
    return baseImpact[assessmentResult.performanceLevel] + skillBonus;
  }

  private calculateTimeEfficiency(timeSpent: number, skillCount: number): string {
    const expectedTime = skillCount * 30; // 30 minutes per skill
    const efficiency = (expectedTime / timeSpent) * 100;
    
    if (efficiency >= 120) return 'Highly Efficient';
    if (efficiency >= 100) return 'Efficient';
    if (efficiency >= 80) return 'Adequate';
    return 'Needs Improvement';
  }

  private generateHiringRecommendation(assessmentResult: AssessmentResult): string {
    const score = assessmentResult.percentageScore;
    const performance = assessmentResult.performanceLevel;
    
    if (performance === 'exceptional' && score >= 90) {
      return 'Strongly Recommended - Exceptional candidate with outstanding performance';
    } else if (performance === 'exceeds_expectations' && score >= 80) {
      return 'Recommended - Strong candidate who exceeds expectations';
    } else if (performance === 'meets_expectations' && score >= 70) {
      return 'Consider - Competent candidate who meets basic requirements';
    } else {
      return 'Not Recommended - Performance below expectations, consider additional training';
    }
  }

  private assessRoleAlignment(assessmentResult: AssessmentResult): string {
    const avgScore = assessmentResult.percentageScore;
    
    if (avgScore >= 85) return 'Excellent fit for senior roles';
    if (avgScore >= 75) return 'Good fit for mid-level roles';
    if (avgScore >= 65) return 'Suitable for junior roles with mentorship';
    return 'May need additional training before role placement';
  }

  private async getMarketComparison(assessmentResult: AssessmentResult): Promise<any> {
    // This would typically query market data
    return {
      percentile: Math.min(95, Math.max(5, assessmentResult.percentageScore)),
      industryAverage: 72,
      topPerformerThreshold: 85,
      comparison: assessmentResult.percentageScore >= 85 ? 'Top 15% of candidates' : 
                 assessmentResult.percentageScore >= 72 ? 'Above average performance' :
                 'Below average performance'
    };
  }

  private calculateExpirationDate(completedAt: string): string {
    // Assessment verifications expire after 2 years
    const completionDate = new Date(completedAt);
    completionDate.setFullYear(completionDate.getFullYear() + 2);
    return completionDate.toISOString();
  }
}

// Export singleton instance
export const assessmentVerificationService = new AssessmentVerificationService();