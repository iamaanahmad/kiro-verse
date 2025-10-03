/**
 * @fileOverview Integration tests for benchmark comparison system
 * 
 * Tests the complete benchmark system including:
 * - Industry benchmark integration
 * - Peer comparison with anonymization
 * - Market readiness assessment
 * - Privacy-preserving analytics
 */

import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { BenchmarkService } from '../benchmark-service';
import { PeerComparisonService } from '../peer-comparison-service';
import { BenchmarkDataService } from '@/lib/firebase/benchmark';
import { UserProgressService } from '@/lib/firebase/analytics';
import { UserProgress, SkillLevel } from '@/types/analytics';
import { 
  MarketReadinessAssessment, 
  BenchmarkComparison, 
  AnonymizedPeerComparison 
} from '@/types/benchmark';

// Mock Firebase services
vi.mock('@/lib/firebase/analytics', () => ({
  UserProgressService: {
    getUserProgress: vi.fn()
  }
}));

vi.mock('@/lib/firebase/benchmark', () => ({
  BenchmarkDataService: {
    saveBenchmarkComparison: vi.fn(),
    saveMarketReadinessAssessment: vi.fn(),
    getUserBenchmarkComparisons: vi.fn(),
    getLatestMarketReadinessAssessment: vi.fn()
  }
}));

const mockUserProgressService = UserProgressService as {
  getUserProgress: Mock;
};

const mockBenchmarkDataService = BenchmarkDataService as {
  saveBenchmarkComparison: Mock;
  saveMarketReadinessAssessment: Mock;
  getUserBenchmarkComparisons: Mock;
  getLatestMarketReadinessAssessment: Mock;
};

describe('Benchmark System Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createComprehensiveUserProgress = (): UserProgress => {
    const skillLevels = new Map<string, SkillLevel>();
    
    // JavaScript - Strong skill
    skillLevels.set('JavaScript', {
      skillId: 'JavaScript',
      skillName: 'JavaScript',
      currentLevel: 4,
      experiencePoints: 1200,
      competencyAreas: [
        { areaId: 'async', name: 'Async Programming', level: 4, maxLevel: 5, skills: ['promises', 'async-await'] },
        { areaId: 'es6', name: 'ES6+ Features', level: 4, maxLevel: 5, skills: ['arrow-functions', 'destructuring'] }
      ],
      industryBenchmark: {
        industryAverage: 70,
        experienceLevel: 'senior',
        percentile: 85,
        lastUpdated: new Date()
      },
      verificationStatus: 'verified',
      progressHistory: [
        { timestamp: new Date('2024-01-01'), level: 2, experiencePoints: 400 },
        { timestamp: new Date('2024-02-01'), level: 3, experiencePoints: 800 },
        { timestamp: new Date('2024-03-01'), level: 4, experiencePoints: 1200 }
      ],
      trendDirection: 'improving',
      lastUpdated: new Date()
    });

    // React - Developing skill
    skillLevels.set('React', {
      skillId: 'React',
      skillName: 'React',
      currentLevel: 3,
      experiencePoints: 750,
      competencyAreas: [
        { areaId: 'hooks', name: 'React Hooks', level: 3, maxLevel: 5, skills: ['useState', 'useEffect'] },
        { areaId: 'components', name: 'Component Design', level: 3, maxLevel: 5, skills: ['functional-components'] }
      ],
      industryBenchmark: {
        industryAverage: 75,
        experienceLevel: 'mid',
        percentile: 65,
        lastUpdated: new Date()
      },
      verificationStatus: 'verified',
      progressHistory: [
        { timestamp: new Date('2024-01-15'), level: 1, experiencePoints: 200 },
        { timestamp: new Date('2024-02-15'), level: 2, experiencePoints: 450 },
        { timestamp: new Date('2024-03-15'), level: 3, experiencePoints: 750 }
      ],
      trendDirection: 'improving',
      lastUpdated: new Date()
    });

    // TypeScript - Weak skill (gap area)
    skillLevels.set('TypeScript', {
      skillId: 'TypeScript',
      skillName: 'TypeScript',
      currentLevel: 2,
      experiencePoints: 300,
      competencyAreas: [
        { areaId: 'types', name: 'Type System', level: 2, maxLevel: 5, skills: ['basic-types'] }
      ],
      industryBenchmark: {
        industryAverage: 65,
        experienceLevel: 'junior',
        percentile: 35,
        lastUpdated: new Date()
      },
      verificationStatus: 'pending',
      progressHistory: [
        { timestamp: new Date('2024-02-01'), level: 1, experiencePoints: 100 },
        { timestamp: new Date('2024-03-01'), level: 2, experiencePoints: 300 }
      ],
      trendDirection: 'improving',
      lastUpdated: new Date()
    });

    // Node.js - Average skill
    skillLevels.set('Node.js', {
      skillId: 'Node.js',
      skillName: 'Node.js',
      currentLevel: 3,
      experiencePoints: 600,
      competencyAreas: [
        { areaId: 'api', name: 'API Development', level: 3, maxLevel: 5, skills: ['express', 'routing'] }
      ],
      industryBenchmark: {
        industryAverage: 70,
        experienceLevel: 'mid',
        percentile: 55,
        lastUpdated: new Date()
      },
      verificationStatus: 'verified',
      progressHistory: [
        { timestamp: new Date('2024-01-01'), level: 2, experiencePoints: 300 },
        { timestamp: new Date('2024-03-01'), level: 3, experiencePoints: 600 }
      ],
      trendDirection: 'stable',
      lastUpdated: new Date()
    });

    return {
      userId: 'integration-test-user',
      skillLevels,
      learningVelocity: 2.1,
      codeQualityTrend: {
        direction: 'improving',
        changePercentage: 25,
        timeframe: '30d',
        dataPoints: 15
      },
      challengesCompleted: [
        {
          challengeId: 'challenge_1',
          title: 'JavaScript Async Challenge',
          description: 'Build async data processing pipeline',
          difficulty: 'intermediate',
          skillsTargeted: ['JavaScript', 'async-programming'],
          timeLimit: 3600,
          evaluationCriteria: [],
          createdBy: 'ai',
          isActive: true,
          completedAt: new Date('2024-03-01'),
          score: 85,
          ranking: 15,
          prompt: 'Create an async data pipeline',
          testCases: [],
          hints: [],
          tags: ['async', 'javascript'],
          category: 'backend',
          estimatedDuration: 60,
          prerequisites: [],
          learningObjectives: [],
          createdAt: new Date('2024-02-28'),
          updatedAt: new Date('2024-02-28'),
          participantCount: 150,
          averageScore: 72,
          successRate: 0.68
        }
      ],
      peerInteractions: [
        {
          interactionId: 'interaction_1',
          type: 'review',
          peerId: 'peer_123',
          feedback: 'Great code structure!',
          rating: 4,
          timestamp: new Date('2024-03-10')
        }
      ],
      lastAnalysisDate: new Date(),
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date()
    };
  };

  describe('Complete Benchmark Analysis Workflow', () => {
    it('should perform comprehensive benchmark analysis combining industry and peer comparisons', async () => {
      const userProgress = createComprehensiveUserProgress();
      mockUserProgressService.getUserProgress.mockResolvedValue(userProgress);
      mockBenchmarkDataService.saveBenchmarkComparison.mockResolvedValue(undefined);
      mockBenchmarkDataService.saveMarketReadinessAssessment.mockResolvedValue(undefined);

      // Step 1: Industry benchmark comparison
      const industryComparisons = await BenchmarkService.compareUserToIndustryBenchmarks('integration-test-user');
      
      expect(industryComparisons).toBeDefined();
      expect(industryComparisons.length).toBe(4); // All 4 skills
      
      // Verify JavaScript (strong skill) comparison
      const jsComparison = industryComparisons.find(c => c.skillId === 'JavaScript');
      expect(jsComparison).toBeDefined();
      expect(jsComparison!.performanceLevel).toMatch(/above_average|exceptional/);
      
      // Verify TypeScript (weak skill) comparison
      const tsComparison = industryComparisons.find(c => c.skillId === 'TypeScript');
      expect(tsComparison).toBeDefined();
      expect(tsComparison!.performanceLevel).toMatch(/below_average|average/);

      // Step 2: Peer comparison
      const peerComparisons = await PeerComparisonService.compareUserToPeers('integration-test-user');
      
      expect(peerComparisons).toBeDefined();
      expect(peerComparisons.length).toBeGreaterThan(0);
      
      // Verify anonymization
      for (const peerComp of peerComparisons) {
        expect(peerComp.peerGroupStats.groupSize).toBeGreaterThan(10);
        expect(peerComp.anonymizedInsights.length).toBeGreaterThan(0);
        
        // Ensure no personal data leakage
        for (const insight of peerComp.anonymizedInsights) {
          expect(insight).not.toContain('integration-test-user');
          expect(insight).not.toMatch(/user-\d+/);
        }
      }

      // Step 3: Market readiness assessment
      const assessment = await BenchmarkService.generateMarketReadinessAssessment('integration-test-user');
      
      expect(assessment).toBeDefined();
      expect(assessment.userId).toBe('integration-test-user');
      expect(assessment.overallReadiness).toBeGreaterThan(0);
      expect(assessment.overallReadiness).toBeLessThanOrEqual(100);
      
      // Should identify TypeScript as a skill gap
      const tsGap = assessment.skillGaps.find(gap => gap.skillId === 'TypeScript');
      expect(tsGap).toBeDefined();
      expect(tsGap!.priority).toMatch(/medium|high|critical/);
      
      // Should identify JavaScript as a strength
      const jsStrength = assessment.strengths.find(strength => strength.skillId === 'JavaScript');
      expect(jsStrength).toBeDefined();
      expect(jsStrength!.marketValue).toMatch(/high|exceptional/);
      
      // Should provide actionable recommendations
      expect(assessment.recommendedActions.length).toBeGreaterThan(0);
      const skillDevActions = assessment.recommendedActions.filter(action => action.type === 'skill_development');
      expect(skillDevActions.length).toBeGreaterThan(0);
      
      // Should suggest relevant job opportunities
      expect(assessment.jobOpportunities.length).toBeGreaterThan(0);
      for (const job of assessment.jobOpportunities) {
        expect(job.matchScore).toBeGreaterThanOrEqual(60);
        expect(job.skillsMatch).toBeGreaterThanOrEqual(0);
        expect(job.experienceMatch).toBeGreaterThanOrEqual(0);
      }
    });

    it('should maintain data consistency across different comparison methods', async () => {
      const userProgress = createComprehensiveUserProgress();
      mockUserProgressService.getUserProgress.mockResolvedValue(userProgress);

      // Get industry and peer comparisons for the same skill
      const industryComparisons = await BenchmarkService.compareUserToIndustryBenchmarks('integration-test-user', { targetExperienceLevel: 'mid' });
      const peerComparisons = await PeerComparisonService.compareUserToPeers('integration-test-user', 'JavaScript', 'mid');

      expect(industryComparisons.length).toBeGreaterThan(0);
      expect(peerComparisons.length).toBeGreaterThan(0);

      const industryJs = industryComparisons.find(c => c.skillId === 'JavaScript');
      const peerJs = peerComparisons.find(c => c.skillId === 'JavaScript');

      expect(industryJs).toBeDefined();
      expect(peerJs).toBeDefined();

      // Both should indicate similar performance levels for the same user/skill
      if (industryJs!.performanceLevel === 'above_average' || industryJs!.performanceLevel === 'exceptional') {
        expect(peerJs!.relativePerformance).toMatch(/above|well_above/);
      }
      
      // Percentiles should be in reasonable ranges
      expect(Math.abs(industryJs!.percentileRank - peerJs!.userPercentile)).toBeLessThan(30);
    });
  });

  describe('Privacy and Anonymization Validation', () => {
    it('should ensure complete anonymization in peer comparisons', async () => {
      const userProgress = createComprehensiveUserProgress();
      mockUserProgressService.getUserProgress.mockResolvedValue(userProgress);

      const peerComparisons = await PeerComparisonService.compareUserToPeers('integration-test-user');
      
      for (const comparison of peerComparisons) {
        // Verify group size meets minimum threshold
        expect(comparison.peerGroupStats.groupSize).toBeGreaterThanOrEqual(10);
        
        // Verify no individual data points are exposed
        expect(comparison.peerGroupStats.averageScore % 1).toBe(0); // Should be rounded
        expect(comparison.peerGroupStats.medianScore % 1).toBe(0); // Should be rounded
        
        // Verify insights don't contain identifying information
        for (const insight of comparison.anonymizedInsights) {
          expect(insight).not.toMatch(/\b\d{1,3}\.\d+\b/); // No precise decimals
          expect(insight).not.toContain('integration-test-user');
          expect(insight).not.toMatch(/user[_-]?\d+/i);
        }
        
        // Verify statistical measures are appropriately aggregated
        expect(comparison.peerGroupStats.skillDistribution.standardDeviation).toBeGreaterThan(0);
        expect(comparison.peerGroupStats.skillDistribution.range.max).toBeGreaterThan(
          comparison.peerGroupStats.skillDistribution.range.min
        );
      }
    });

    it('should provide confidence intervals for statistical reliability', async () => {
      const userProgress = createComprehensiveUserProgress();
      mockUserProgressService.getUserProgress.mockResolvedValue(userProgress);

      const ranking = await PeerComparisonService.generateAnonymizedRanking('integration-test-user', 'JavaScript');
      
      expect(ranking).toBeDefined();
      expect(ranking!.confidenceInterval).toBeDefined();
      
      const ci = ranking!.confidenceInterval;
      expect(ci.lower).toBeLessThanOrEqual(ci.upper);
      expect(ci.lower).toBeGreaterThanOrEqual(0);
      expect(ci.upper).toBeLessThanOrEqual(100);
      
      // Confidence interval should be reasonable (not too wide for large groups)
      const intervalWidth = ci.upper - ci.lower;
      expect(intervalWidth).toBeLessThan(40); // Should be less than 40 percentile points
    });
  });

  describe('Statistical Analysis Integration', () => {
    it('should perform comprehensive statistical analysis across skill groups', async () => {
      const skills = ['JavaScript', 'React', 'TypeScript', 'Node.js'];
      const experienceLevels = ['junior', 'mid', 'senior'];
      
      for (const skill of skills) {
        for (const level of experienceLevels) {
          const analysis = await PeerComparisonService.performStatisticalAnalysis(skill, level);
          
          expect(analysis).toBeDefined();
          expect(analysis!.sampleSize).toBeGreaterThan(0);
          expect(analysis!.mean).toBeGreaterThan(0);
          expect(analysis!.standardDeviation).toBeGreaterThan(0);
          
          // Verify statistical relationships
          expect(analysis!.variance).toBeCloseTo(Math.pow(analysis!.standardDeviation, 2), 1);
          
          // Confidence interval should contain the mean
          expect(analysis!.confidenceInterval95.lower).toBeLessThan(analysis!.mean);
          expect(analysis!.confidenceInterval95.upper).toBeGreaterThan(analysis!.mean);
          
          // Distribution type should be classified
          expect(analysis!.distributionType).toMatch(/normal|skewed_left|skewed_right|bimodal|uniform/);
        }
      }
    });

    it('should handle outlier detection appropriately', async () => {
      const analysis = await PeerComparisonService.performStatisticalAnalysis('JavaScript', 'senior');
      
      expect(analysis).toBeDefined();
      expect(analysis!.outlierThresholds).toBeDefined();
      
      const thresholds = analysis!.outlierThresholds;
      expect(thresholds.lower).toBeLessThan(analysis!.mean);
      expect(thresholds.upper).toBeGreaterThan(analysis!.mean);
      
      // Outlier thresholds should be reasonable relative to the data range
      const dataRange = 100; // Assuming 0-100 scale
      const thresholdRange = thresholds.upper - thresholds.lower;
      expect(thresholdRange).toBeLessThan(dataRange * 1.5); // Not too wide
      expect(thresholdRange).toBeGreaterThan(dataRange * 0.3); // Not too narrow
    });
  });

  describe('Market Readiness Assessment Integration', () => {
    it('should generate comprehensive assessment with all components', async () => {
      const userProgress = createComprehensiveUserProgress();
      mockUserProgressService.getUserProgress.mockResolvedValue(userProgress);

      const assessment = await BenchmarkService.generateMarketReadinessAssessment(
        'integration-test-user',
        'Full Stack Developer',
        'Software Development'
      );

      // Verify assessment completeness
      expect(assessment.userId).toBe('integration-test-user');
      expect(assessment.assessmentId).toBeDefined();
      expect(assessment.overallReadiness).toBeGreaterThan(0);
      expect(assessment.experienceLevel).toBeDefined();
      expect(assessment.skillGaps).toBeDefined();
      expect(assessment.strengths).toBeDefined();
      expect(assessment.recommendedActions).toBeDefined();
      expect(assessment.jobOpportunities).toBeDefined();
      
      // Verify skill gap analysis
      expect(assessment.skillGaps.length).toBeGreaterThan(0);
      const criticalGaps = assessment.skillGaps.filter(gap => gap.priority === 'critical');
      const highGaps = assessment.skillGaps.filter(gap => gap.priority === 'high');
      
      // Should have actionable time estimates
      for (const gap of assessment.skillGaps) {
        expect(gap.estimatedTimeToClose).toBeGreaterThan(0);
        expect(gap.recommendedResources).toBeDefined();
      }
      
      // Verify strength identification
      expect(assessment.strengths.length).toBeGreaterThan(0);
      for (const strength of assessment.strengths) {
        expect(strength.industryPercentile).toBeGreaterThan(50); // Strengths should be above average
        expect(strength.marketValue).toMatch(/medium|high|exceptional/);
        expect(strength.relatedOpportunities.length).toBeGreaterThan(0);
      }
      
      // Verify recommended actions
      expect(assessment.recommendedActions.length).toBeGreaterThan(0);
      const skillDevActions = assessment.recommendedActions.filter(action => action.type === 'skill_development');
      const networkingActions = assessment.recommendedActions.filter(action => action.type === 'networking');
      
      expect(skillDevActions.length).toBeGreaterThan(0); // Should have skill development recommendations
      
      for (const action of assessment.recommendedActions) {
        expect(action.estimatedEffort).toBeGreaterThan(0);
        expect(action.expectedImpact).toBeGreaterThan(0);
        expect(action.expectedImpact).toBeLessThanOrEqual(100);
      }
      
      // Verify job opportunity matching
      expect(assessment.jobOpportunities.length).toBeGreaterThan(0);
      for (const job of assessment.jobOpportunities) {
        expect(job.matchScore).toBeGreaterThanOrEqual(60); // Only good matches
        expect(job.skillsMatch).toBeGreaterThanOrEqual(0);
        expect(job.experienceMatch).toBeGreaterThanOrEqual(0);
        expect(job.requiredSkills.length).toBeGreaterThan(0);
        expect(job.salaryRange).toBeDefined();
        expect(job.salaryRange.min).toBeLessThan(job.salaryRange.max);
      }
    });

    it('should provide consistent readiness scores across multiple assessments', async () => {
      const userProgress = createComprehensiveUserProgress();
      mockUserProgressService.getUserProgress.mockResolvedValue(userProgress);

      // Generate multiple assessments
      const assessment1 = await BenchmarkService.generateMarketReadinessAssessment('integration-test-user');
      const assessment2 = await BenchmarkService.generateMarketReadinessAssessment('integration-test-user');

      // Readiness scores should be consistent (within reasonable variance)
      expect(Math.abs(assessment1.overallReadiness - assessment2.overallReadiness)).toBeLessThan(10);
      
      // Experience level should be consistent
      expect(assessment1.experienceLevel.level).toBe(assessment2.experienceLevel.level);
      
      // Number of skill gaps should be similar
      expect(Math.abs(assessment1.skillGaps.length - assessment2.skillGaps.length)).toBeLessThanOrEqual(1);
      
      // Number of strengths should be similar
      expect(Math.abs(assessment1.strengths.length - assessment2.strengths.length)).toBeLessThanOrEqual(1);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle users with minimal skill data', async () => {
      const minimalUserProgress: UserProgress = {
        userId: 'minimal-user',
        skillLevels: new Map([
          ['JavaScript', {
            skillId: 'JavaScript',
            skillName: 'JavaScript',
            currentLevel: 1,
            experiencePoints: 50,
            competencyAreas: [],
            industryBenchmark: {
              industryAverage: 70,
              experienceLevel: 'entry',
              percentile: 25,
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

      mockUserProgressService.getUserProgress.mockResolvedValue(minimalUserProgress);

      const assessment = await BenchmarkService.generateMarketReadinessAssessment('minimal-user');
      
      expect(assessment).toBeDefined();
      expect(assessment.experienceLevel.level).toBe('entry');
      expect(assessment.overallReadiness).toBeGreaterThanOrEqual(0);
      expect(assessment.skillGaps.length).toBeGreaterThanOrEqual(0); // May or may not have gaps
      expect(assessment.recommendedActions.length).toBeGreaterThanOrEqual(0); // May or may not have actions
    });

    it('should handle service failures gracefully', async () => {
      mockUserProgressService.getUserProgress.mockRejectedValue(new Error('Service unavailable'));

      await expect(
        BenchmarkService.compareUserToIndustryBenchmarks('test-user')
      ).rejects.toThrow('Service unavailable');

      await expect(
        PeerComparisonService.compareUserToPeers('test-user')
      ).rejects.toThrow('Service unavailable');
    });

    it('should validate data integrity across services', async () => {
      const userProgress = createComprehensiveUserProgress();
      mockUserProgressService.getUserProgress.mockResolvedValue(userProgress);

      // Test that all services return consistent user identification
      const industryComparisons = await BenchmarkService.compareUserToIndustryBenchmarks('integration-test-user');
      const peerComparisons = await PeerComparisonService.compareUserToPeers('integration-test-user');
      const assessment = await BenchmarkService.generateMarketReadinessAssessment('integration-test-user');

      // All should reference the same user
      for (const comparison of industryComparisons) {
        expect(comparison.userId).toBe('integration-test-user');
      }
      
      for (const comparison of peerComparisons) {
        expect(comparison.userId).toBe('integration-test-user');
      }
      
      expect(assessment.userId).toBe('integration-test-user');
      
      // Skill IDs should be consistent across services
      const industrySkills = new Set(industryComparisons.map(c => c.skillId));
      const peerSkills = new Set(peerComparisons.map(c => c.skillId));
      const assessmentSkills = new Set([
        ...assessment.skillGaps.map(g => g.skillId),
        ...assessment.strengths.map(s => s.skillId)
      ]);
      
      // There should be overlap in skills analyzed
      const commonSkills = [...industrySkills].filter(skill => peerSkills.has(skill));
      expect(commonSkills.length).toBeGreaterThan(0);
    });
  });
});