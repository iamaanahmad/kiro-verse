/**
 * @fileOverview Benchmark service for industry standards and market readiness assessment
 * 
 * This service implements:
 * - Industry benchmark data integration and management
 * - User skill comparison against industry standards
 * - Experience level classification and market readiness assessment
 * - Job opportunity suggestion logic based on skill levels
 */

import {
  IndustryBenchmark,
  MarketReadinessAssessment,
  BenchmarkComparison,
  JobOpportunity,
  SkillGap,
  SkillStrength,
  RecommendedAction,
  ExperienceLevel,
  GapAnalysis,
  BenchmarkAnalysisOptions,
  BenchmarkUpdateResult,
  LearningResource,
  SkillRequirement
} from '@/types/benchmark';
import { UserProgress, SkillLevel } from '@/types/analytics';
import { UserProgressService } from '@/lib/firebase/analytics';

export class BenchmarkService {
  private static readonly INDUSTRY_STANDARDS = {
    'JavaScript': {
      entry: { min: 20, max: 40, average: 30 },
      junior: { min: 40, max: 60, average: 50 },
      mid: { min: 60, max: 80, average: 70 },
      senior: { min: 80, max: 95, average: 87 },
      lead: { min: 90, max: 100, average: 95 },
      principal: { min: 95, max: 100, average: 98 }
    },
    'TypeScript': {
      entry: { min: 15, max: 35, average: 25 },
      junior: { min: 35, max: 55, average: 45 },
      mid: { min: 55, max: 75, average: 65 },
      senior: { min: 75, max: 90, average: 82 },
      lead: { min: 85, max: 98, average: 91 },
      principal: { min: 92, max: 100, average: 96 }
    },
    'React': {
      entry: { min: 25, max: 45, average: 35 },
      junior: { min: 45, max: 65, average: 55 },
      mid: { min: 65, max: 85, average: 75 },
      senior: { min: 85, max: 95, average: 90 },
      lead: { min: 90, max: 100, average: 95 },
      principal: { min: 95, max: 100, average: 97 }
    },
    'Node.js': {
      entry: { min: 20, max: 40, average: 30 },
      junior: { min: 40, max: 60, average: 50 },
      mid: { min: 60, max: 80, average: 70 },
      senior: { min: 80, max: 95, average: 87 },
      lead: { min: 90, max: 100, average: 95 },
      principal: { min: 95, max: 100, average: 98 }
    }
  };

  private static readonly EXPERIENCE_LEVELS: Record<string, ExperienceLevel> = {
    entry: {
      level: 'entry',
      yearsOfExperience: 0,
      description: 'New to professional development, learning fundamentals',
      requiredSkills: ['basic programming', 'version control', 'debugging'],
      typicalResponsibilities: ['Bug fixes', 'Simple features', 'Code reviews participation']
    },
    junior: {
      level: 'junior',
      yearsOfExperience: 1,
      description: 'Building foundational skills, working on guided tasks',
      requiredSkills: ['programming fundamentals', 'testing', 'documentation'],
      typicalResponsibilities: ['Feature development', 'Unit testing', 'Code maintenance']
    },
    mid: {
      level: 'mid',
      yearsOfExperience: 3,
      description: 'Independent contributor with solid technical skills',
      requiredSkills: ['system design', 'performance optimization', 'mentoring'],
      typicalResponsibilities: ['Complex features', 'Architecture decisions', 'Junior mentoring']
    },
    senior: {
      level: 'senior',
      yearsOfExperience: 5,
      description: 'Technical leader with deep expertise and mentoring abilities',
      requiredSkills: ['advanced architecture', 'team leadership', 'strategic thinking'],
      typicalResponsibilities: ['System architecture', 'Technical leadership', 'Cross-team collaboration']
    },
    lead: {
      level: 'lead',
      yearsOfExperience: 8,
      description: 'Technical leader responsible for multiple systems and teams',
      requiredSkills: ['enterprise architecture', 'people management', 'business alignment'],
      typicalResponsibilities: ['Technical strategy', 'Team management', 'Stakeholder communication']
    },
    principal: {
      level: 'principal',
      yearsOfExperience: 12,
      description: 'Senior technical leader driving organization-wide technical decisions',
      requiredSkills: ['organizational leadership', 'innovation', 'industry expertise'],
      typicalResponsibilities: ['Technical vision', 'Innovation leadership', 'Industry representation']
    }
  };

  /**
   * Compares user skills against industry benchmarks
   */
  static async compareUserToIndustryBenchmarks(
    userId: string,
    options: BenchmarkAnalysisOptions = {}
  ): Promise<BenchmarkComparison[]> {
    const userProgress = await UserProgressService.getUserProgress(userId);
    if (!userProgress) {
      throw new Error('User progress not found');
    }

    const comparisons: BenchmarkComparison[] = [];
    const targetLevel = options.targetExperienceLevel || this.determineUserExperienceLevel(userProgress);

    for (const [skillId, skillLevel] of userProgress.skillLevels) {
      const benchmark = await this.getIndustryBenchmark(skillId, targetLevel);
      if (benchmark) {
        const comparison = await this.createBenchmarkComparison(
          userId,
          skillLevel,
          benchmark
        );
        comparisons.push(comparison);
      }
    }

    return comparisons;
  }

  /**
   * Generates comprehensive market readiness assessment
   */
  static async generateMarketReadinessAssessment(
    userId: string,
    targetRole?: string,
    targetIndustry?: string
  ): Promise<MarketReadinessAssessment> {
    const userProgress = await UserProgressService.getUserProgress(userId);
    if (!userProgress) {
      throw new Error('User progress not found');
    }

    const benchmarkComparisons = await this.compareUserToIndustryBenchmarks(userId);
    const currentLevel = this.determineUserExperienceLevel(userProgress);
    const skillGaps = this.identifySkillGaps(benchmarkComparisons, currentLevel);
    const strengths = this.identifySkillStrengths(benchmarkComparisons);
    const recommendedActions = await this.generateRecommendedActions(skillGaps, strengths);
    const jobOpportunities = await this.findMatchingJobOpportunities(
      userProgress,
      targetRole,
      targetIndustry
    );

    const overallReadiness = this.calculateOverallReadiness(
      benchmarkComparisons,
      skillGaps,
      strengths
    );

    return {
      userId,
      assessmentId: `assessment_${Date.now()}`,
      overallReadiness,
      experienceLevel: this.EXPERIENCE_LEVELS[currentLevel],
      skillGaps,
      strengths,
      recommendedActions,
      jobOpportunities,
      assessmentDate: new Date(),
      nextReviewDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    };
  }

  /**
   * Finds job opportunities matching user's skill profile
   */
  static async findMatchingJobOpportunities(
    userProgress: UserProgress,
    targetRole?: string,
    targetIndustry?: string
  ): Promise<JobOpportunity[]> {
    const userSkills = Array.from(userProgress.skillLevels.keys());
    const experienceLevel = this.determineUserExperienceLevel(userProgress);
    
    // Mock job opportunities - in production, this would integrate with job APIs
    const mockOpportunities: JobOpportunity[] = [
      {
        opportunityId: 'job_1',
        title: 'Frontend Developer',
        company: 'Tech Startup Inc.',
        location: 'San Francisco, CA',
        remote: true,
        experienceLevel: this.EXPERIENCE_LEVELS.junior,
        requiredSkills: [
          { skillId: 'JavaScript', skillName: 'JavaScript', minimumLevel: 2, weight: 0.9, category: 'technical' },
          { skillId: 'React', skillName: 'React', minimumLevel: 2, weight: 0.8, category: 'technical' }
        ],
        optionalSkills: [
          { skillId: 'TypeScript', skillName: 'TypeScript', minimumLevel: 1, weight: 0.6, category: 'technical' }
        ],
        salaryRange: { min: 80000, max: 120000, median: 100000, currency: 'USD' },
        matchScore: 0,
        skillsMatch: 0,
        experienceMatch: 0,
        description: 'Join our growing team to build amazing user experiences',
        applicationUrl: 'https://example.com/apply/1',
        postedDate: new Date(),
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      },
      {
        opportunityId: 'job_2',
        title: 'Full Stack Developer',
        company: 'Enterprise Corp',
        location: 'New York, NY',
        remote: false,
        experienceLevel: this.EXPERIENCE_LEVELS.mid,
        requiredSkills: [
          { skillId: 'JavaScript', skillName: 'JavaScript', minimumLevel: 3, weight: 0.8, category: 'technical' },
          { skillId: 'Node.js', skillName: 'Node.js', minimumLevel: 3, weight: 0.8, category: 'technical' },
          { skillId: 'React', skillName: 'React', minimumLevel: 3, weight: 0.7, category: 'technical' }
        ],
        optionalSkills: [
          { skillId: 'TypeScript', skillName: 'TypeScript', minimumLevel: 2, weight: 0.5, category: 'technical' }
        ],
        salaryRange: { min: 120000, max: 160000, median: 140000, currency: 'USD' },
        matchScore: 0,
        skillsMatch: 0,
        experienceMatch: 0,
        description: 'Lead development of enterprise applications',
        applicationUrl: 'https://example.com/apply/2',
        postedDate: new Date(),
        expiryDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000)
      }
    ];

    // Calculate match scores for each opportunity
    return mockOpportunities.map(opportunity => {
      const skillsMatch = this.calculateSkillsMatch(userProgress, opportunity);
      const experienceMatch = this.calculateExperienceMatch(experienceLevel, opportunity.experienceLevel);
      const matchScore = (skillsMatch * 0.7) + (experienceMatch * 0.3);

      return {
        ...opportunity,
        matchScore: Math.round(matchScore),
        skillsMatch: Math.round(skillsMatch),
        experienceMatch: Math.round(experienceMatch)
      };
    }).filter(opportunity => opportunity.matchScore >= 60) // Only show good matches
      .sort((a, b) => b.matchScore - a.matchScore);
  }

  /**
   * Gets industry benchmark for a specific skill and experience level
   */
  private static async getIndustryBenchmark(
    skillId: string,
    experienceLevel: string
  ): Promise<IndustryBenchmark | null> {
    const standards = this.INDUSTRY_STANDARDS[skillId as keyof typeof this.INDUSTRY_STANDARDS];
    if (!standards) return null;

    const levelStandard = standards[experienceLevel as keyof typeof standards];
    if (!levelStandard) return null;

    return {
      benchmarkId: `benchmark_${skillId}_${experienceLevel}`,
      skillId,
      skillName: skillId,
      industry: 'Software Development',
      experienceLevel: this.EXPERIENCE_LEVELS[experienceLevel],
      averageScore: levelStandard.average,
      percentileRanges: [
        { percentile: 25, minScore: levelStandard.min, maxScore: levelStandard.min + 10, description: 'Below Average' },
        { percentile: 50, minScore: levelStandard.min + 10, maxScore: levelStandard.average, description: 'Average' },
        { percentile: 75, minScore: levelStandard.average, maxScore: levelStandard.max - 5, description: 'Above Average' },
        { percentile: 90, minScore: levelStandard.max - 5, maxScore: levelStandard.max, description: 'Exceptional' }
      ],
      sampleSize: 1000,
      dataSource: 'Industry Survey 2024',
      lastUpdated: new Date(),
      validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      region: 'Global',
      salaryRange: this.getSalaryRangeForSkill(skillId, experienceLevel)
    };
  }

  /**
   * Creates benchmark comparison for a user skill
   */
  private static async createBenchmarkComparison(
    userId: string,
    skillLevel: SkillLevel,
    benchmark: IndustryBenchmark
  ): Promise<BenchmarkComparison> {
    const userScore = this.convertLevelToScore(skillLevel.currentLevel, skillLevel.experiencePoints);
    const percentileRank = this.calculatePercentileRank(userScore, benchmark);
    const performanceLevel = this.determinePerformanceLevel(percentileRank);
    const gapAnalysis = this.analyzeGap(userScore, benchmark);

    return {
      comparisonId: `comparison_${Date.now()}_${skillLevel.skillId}`,
      userId,
      skillId: skillLevel.skillId,
      userScore,
      industryBenchmark: benchmark,
      percentileRank,
      performanceLevel,
      gapAnalysis,
      recommendations: this.generateRecommendations(gapAnalysis, skillLevel),
      comparisonDate: new Date()
    };
  }

  /**
   * Determines user's experience level based on overall progress
   */
  private static determineUserExperienceLevel(userProgress: UserProgress): string {
    const skillLevels = Array.from(userProgress.skillLevels.values());
    const averageLevel = skillLevels.reduce((sum, skill) => sum + skill.currentLevel, 0) / skillLevels.length;
    const totalExperience = skillLevels.reduce((sum, skill) => sum + skill.experiencePoints, 0);

    if (averageLevel >= 4 && totalExperience >= 2000) return 'principal';
    if (averageLevel >= 3.5 && totalExperience >= 1500) return 'lead';
    if (averageLevel >= 3 && totalExperience >= 1000) return 'senior';
    if (averageLevel >= 2.5 && totalExperience >= 500) return 'mid';
    if (averageLevel >= 2 && totalExperience >= 200) return 'junior';
    return 'entry';
  }

  /**
   * Identifies skill gaps based on benchmark comparisons
   */
  private static identifySkillGaps(
    comparisons: BenchmarkComparison[],
    currentLevel: string
  ): SkillGap[] {
    return comparisons
      .filter(comparison => comparison.performanceLevel === 'below_average')
      .map(comparison => ({
        skillId: comparison.skillId,
        skillName: comparison.skillId,
        currentLevel: comparison.userScore,
        requiredLevel: comparison.industryBenchmark.averageScore,
        industryAverage: comparison.industryBenchmark.averageScore,
        priority: comparison.gapAnalysis.scoreGap > 20 ? 'critical' : 
                 comparison.gapAnalysis.scoreGap > 10 ? 'high' : 'medium',
        estimatedTimeToClose: comparison.gapAnalysis.timeToTarget,
        recommendedResources: this.getRecommendedResources(comparison.skillId)
      }));
  }

  /**
   * Identifies skill strengths based on benchmark comparisons
   */
  private static identifySkillStrengths(comparisons: BenchmarkComparison[]): SkillStrength[] {
    return comparisons
      .filter(comparison => comparison.performanceLevel === 'above_average' || comparison.performanceLevel === 'exceptional')
      .map(comparison => ({
        skillId: comparison.skillId,
        skillName: comparison.skillId,
        currentLevel: comparison.userScore,
        industryPercentile: comparison.percentileRank,
        marketValue: comparison.percentileRank > 90 ? 'exceptional' :
                    comparison.percentileRank > 75 ? 'high' :
                    comparison.percentileRank > 50 ? 'medium' : 'low',
        relatedOpportunities: this.getRelatedOpportunities(comparison.skillId)
      }));
  }

  /**
   * Generates recommended actions based on gaps and strengths
   */
  private static async generateRecommendedActions(
    skillGaps: SkillGap[],
    strengths: SkillStrength[]
  ): Promise<RecommendedAction[]> {
    const actions: RecommendedAction[] = [];

    // Actions for skill gaps
    for (const gap of skillGaps.slice(0, 3)) { // Top 3 gaps
      actions.push({
        actionId: `action_gap_${gap.skillId}`,
        type: 'skill_development',
        title: `Improve ${gap.skillName} Skills`,
        description: `Focus on closing the gap in ${gap.skillName} to reach industry standards`,
        priority: gap.priority,
        estimatedEffort: gap.estimatedTimeToClose * 10, // Convert weeks to hours
        expectedImpact: Math.min(100, gap.requiredLevel - gap.currentLevel),
        resources: gap.recommendedResources
      });
    }

    // Actions for leveraging strengths
    for (const strength of strengths.slice(0, 2)) { // Top 2 strengths
      if (strength.marketValue === 'high' || strength.marketValue === 'exceptional') {
        actions.push({
          actionId: `action_strength_${strength.skillId}`,
          type: 'networking',
          title: `Leverage ${strength.skillName} Expertise`,
          description: `Your ${strength.skillName} skills are above average. Consider mentoring others or seeking leadership opportunities.`,
          priority: 'medium',
          estimatedEffort: 20,
          expectedImpact: 80,
          resources: []
        });
      }
    }

    return actions;
  }

  // Helper methods

  private static convertLevelToScore(level: number, experiencePoints: number): number {
    // Convert skill level and experience to a 0-100 score
    const baseScore = level * 20; // Level 1-5 maps to 20-100
    const experienceBonus = Math.min(20, experiencePoints / 50); // Up to 20 bonus points
    return Math.min(100, baseScore + experienceBonus);
  }

  private static calculatePercentileRank(userScore: number, benchmark: IndustryBenchmark): number {
    for (let i = benchmark.percentileRanges.length - 1; i >= 0; i--) {
      const range = benchmark.percentileRanges[i];
      if (userScore >= range.minScore) {
        return range.percentile;
      }
    }
    return 10; // Below all ranges
  }

  private static determinePerformanceLevel(percentileRank: number): 'below_average' | 'average' | 'above_average' | 'exceptional' {
    if (percentileRank >= 90) return 'exceptional';
    if (percentileRank >= 75) return 'above_average';
    if (percentileRank >= 25) return 'average';
    return 'below_average';
  }

  private static analyzeGap(userScore: number, benchmark: IndustryBenchmark): GapAnalysis {
    const scoreGap = benchmark.averageScore - userScore;
    const targetPercentile = 75; // Target above average
    const targetScore = benchmark.percentileRanges.find(r => r.percentile === targetPercentile)?.minScore || benchmark.averageScore;
    const percentileGap = targetScore - userScore;
    
    return {
      scoreGap,
      percentileGap,
      timeToTarget: Math.max(1, Math.ceil(Math.abs(percentileGap) / 5)), // Weeks to close gap
      difficultyLevel: Math.abs(percentileGap) > 30 ? 'difficult' :
                      Math.abs(percentileGap) > 20 ? 'challenging' :
                      Math.abs(percentileGap) > 10 ? 'moderate' : 'easy',
      keyImprovementAreas: this.getImprovementAreas(benchmark.skillId)
    };
  }

  private static generateRecommendations(gapAnalysis: GapAnalysis, skillLevel: SkillLevel): string[] {
    const recommendations: string[] = [];
    
    if (gapAnalysis.scoreGap > 0) {
      recommendations.push(`Focus on improving ${skillLevel.skillName} - you're ${gapAnalysis.scoreGap} points below industry average`);
      recommendations.push(`Estimated time to reach target: ${gapAnalysis.timeToTarget} weeks with consistent practice`);
    } else {
      recommendations.push(`Great job! Your ${skillLevel.skillName} skills are above industry average`);
      recommendations.push('Consider mentoring others or taking on more challenging projects');
    }

    return recommendations;
  }

  private static calculateSkillsMatch(userProgress: UserProgress, opportunity: JobOpportunity): number {
    const allRequirements = [...opportunity.requiredSkills, ...opportunity.optionalSkills];
    let totalWeight = 0;
    let matchedWeight = 0;

    for (const requirement of allRequirements) {
      totalWeight += requirement.weight;
      const userSkill = userProgress.skillLevels.get(requirement.skillId);
      
      if (userSkill && userSkill.currentLevel >= requirement.minimumLevel) {
        matchedWeight += requirement.weight;
      }
    }

    return totalWeight > 0 ? (matchedWeight / totalWeight) * 100 : 0;
  }

  private static calculateExperienceMatch(userLevel: string, requiredLevel: ExperienceLevel): number {
    const userLevelIndex = Object.keys(this.EXPERIENCE_LEVELS).indexOf(userLevel);
    const requiredLevelIndex = Object.keys(this.EXPERIENCE_LEVELS).indexOf(requiredLevel.level);
    
    if (userLevelIndex >= requiredLevelIndex) {
      return 100; // Meets or exceeds requirement
    } else {
      const gap = requiredLevelIndex - userLevelIndex;
      return Math.max(0, 100 - (gap * 25)); // 25% penalty per level gap
    }
  }

  private static calculateOverallReadiness(
    comparisons: BenchmarkComparison[],
    skillGaps: SkillGap[],
    strengths: SkillStrength[]
  ): number {
    if (comparisons.length === 0) return 0;

    const averagePercentile = comparisons.reduce((sum, comp) => sum + comp.percentileRank, 0) / comparisons.length;
    const gapPenalty = skillGaps.length * 5; // 5% penalty per gap
    const strengthBonus = strengths.length * 3; // 3% bonus per strength

    return Math.max(0, Math.min(100, averagePercentile - gapPenalty + strengthBonus));
  }

  private static getSalaryRangeForSkill(skillId: string, experienceLevel: string): { min: number; max: number; median: number; currency: string } {
    const baseSalaries = {
      entry: { min: 60000, max: 80000, median: 70000 },
      junior: { min: 80000, max: 100000, median: 90000 },
      mid: { min: 100000, max: 130000, median: 115000 },
      senior: { min: 130000, max: 170000, median: 150000 },
      lead: { min: 170000, max: 220000, median: 195000 },
      principal: { min: 220000, max: 300000, median: 260000 }
    };

    const base = baseSalaries[experienceLevel as keyof typeof baseSalaries] || baseSalaries.entry;
    
    // Adjust based on skill demand
    const skillMultiplier = skillId === 'React' || skillId === 'TypeScript' ? 1.1 : 1.0;
    
    return {
      min: Math.round(base.min * skillMultiplier),
      max: Math.round(base.max * skillMultiplier),
      median: Math.round(base.median * skillMultiplier),
      currency: 'USD'
    };
  }

  private static getRecommendedResources(skillId: string): LearningResource[] {
    const resourceMap: Record<string, LearningResource[]> = {
      'JavaScript': [
        {
          resourceId: 'js_course_1',
          type: 'course',
          title: 'Advanced JavaScript Concepts',
          description: 'Deep dive into closures, prototypes, and async programming',
          url: 'https://example.com/js-course',
          provider: 'Tech Academy',
          difficulty: 'intermediate',
          estimatedDuration: 40,
          cost: 99,
          currency: 'USD',
          rating: 4.8,
          reviewCount: 1250
        }
      ],
      'React': [
        {
          resourceId: 'react_course_1',
          type: 'course',
          title: 'React Performance Optimization',
          description: 'Learn to build fast and efficient React applications',
          url: 'https://example.com/react-course',
          provider: 'React Masters',
          difficulty: 'advanced',
          estimatedDuration: 30,
          cost: 149,
          currency: 'USD',
          rating: 4.9,
          reviewCount: 890
        }
      ]
    };

    return resourceMap[skillId] || [];
  }

  private static getRelatedOpportunities(skillId: string): string[] {
    const opportunityMap: Record<string, string[]> = {
      'JavaScript': ['Frontend Developer', 'Full Stack Developer', 'Web Developer'],
      'React': ['React Developer', 'Frontend Engineer', 'UI Developer'],
      'TypeScript': ['TypeScript Developer', 'Senior Frontend Developer', 'Full Stack Engineer'],
      'Node.js': ['Backend Developer', 'Full Stack Developer', 'API Developer']
    };

    return opportunityMap[skillId] || [];
  }

  private static getImprovementAreas(skillId: string): string[] {
    const improvementMap: Record<string, string[]> = {
      'JavaScript': ['ES6+ features', 'Async programming', 'Error handling'],
      'React': ['Hooks optimization', 'State management', 'Performance tuning'],
      'TypeScript': ['Advanced types', 'Generics', 'Type guards'],
      'Node.js': ['Stream processing', 'Event handling', 'Performance optimization']
    };

    return improvementMap[skillId] || ['Code quality', 'Best practices', 'Performance'];
  }
}