/**
 * @fileOverview Peer comparison service with privacy-preserving anonymization
 * 
 * This service implements:
 * - Anonymized peer comparison algorithms
 * - Privacy-preserving ranking system that protects individual identity
 * - Statistical analysis for peer group performance
 * - Secure aggregation of user data for benchmarking
 */

import { UserProgress, SkillLevel } from '@/types/analytics';
import { UserProgressService } from '@/lib/firebase/analytics';
import { BenchmarkDataService } from '@/lib/firebase/benchmark';

export interface PeerGroup {
  groupId: string;
  experienceLevel: string;
  skillCategory: string;
  memberCount: number;
  averageSkillLevel: number;
  medianSkillLevel: number;
  skillDistribution: SkillDistribution;
  lastUpdated: Date;
}

export interface SkillDistribution {
  percentile25: number;
  percentile50: number;
  percentile75: number;
  percentile90: number;
  standardDeviation: number;
  range: {
    min: number;
    max: number;
  };
}

export interface AnonymizedPeerComparison {
  comparisonId: string;
  userId: string;
  skillId: string;
  userPercentile: number;
  peerGroupStats: PeerGroupStats;
  relativePerformance: 'well_below' | 'below' | 'average' | 'above' | 'well_above';
  improvementPotential: number; // 0-100
  anonymizedInsights: string[];
  comparisonDate: Date;
}

export interface PeerGroupStats {
  groupSize: number;
  averageScore: number;
  medianScore: number;
  topPercentileThreshold: number; // 90th percentile
  skillDistribution: SkillDistribution;
  experienceLevel: string;
  region?: string;
}

export interface PeerRanking {
  rankingId: string;
  skillId: string;
  anonymizedRank: string; // e.g., "Top 10%", "Above Average"
  percentileRange: string; // e.g., "75-80th percentile"
  peerGroupSize: number;
  confidenceInterval: {
    lower: number;
    upper: number;
  };
  lastUpdated: Date;
}

export interface StatisticalAnalysis {
  analysisId: string;
  skillId: string;
  sampleSize: number;
  mean: number;
  median: number;
  standardDeviation: number;
  variance: number;
  skewness: number;
  kurtosis: number;
  confidenceInterval95: {
    lower: number;
    upper: number;
  };
  outlierThresholds: {
    lower: number;
    upper: number;
  };
  distributionType: 'normal' | 'skewed_left' | 'skewed_right' | 'bimodal' | 'uniform';
}

export interface PrivacySettings {
  enablePeerComparison: boolean;
  shareSkillLevels: boolean;
  shareExperienceData: boolean;
  shareProgressTrends: boolean;
  anonymizationLevel: 'basic' | 'enhanced' | 'maximum';
  optOutOfAggregation: boolean;
}

export class PeerComparisonService {
  private static readonly MIN_GROUP_SIZE = 10; // Minimum size for statistical significance
  private static readonly ANONYMIZATION_THRESHOLD = 5; // Minimum peers for anonymized comparison
  private static readonly CONFIDENCE_LEVEL = 0.95;

  /**
   * Compares user against anonymized peer groups
   */
  static async compareUserToPeers(
    userId: string,
    skillId?: string,
    experienceLevel?: string
  ): Promise<AnonymizedPeerComparison[]> {
    const userProgress = await UserProgressService.getUserProgress(userId);
    if (!userProgress) {
      throw new Error('User progress not found');
    }

    const comparisons: AnonymizedPeerComparison[] = [];
    const skillsToCompare = skillId ? [skillId] : Array.from(userProgress.skillLevels.keys());

    for (const skill of skillsToCompare) {
      const userSkill = userProgress.skillLevels.get(skill);
      if (!userSkill) continue;

      const peerGroup = await this.getPeerGroup(skill, experienceLevel || this.determineExperienceLevel(userProgress));
      if (peerGroup && peerGroup.memberCount >= this.MIN_GROUP_SIZE) {
        const comparison = await this.createAnonymizedComparison(userId, userSkill, peerGroup);
        comparisons.push(comparison);
      }
    }

    return comparisons;
  }

  /**
   * Gets anonymized peer group statistics for a skill
   */
  static async getPeerGroupStats(
    skillId: string,
    experienceLevel: string,
    region?: string
  ): Promise<PeerGroupStats | null> {
    const peerGroup = await this.getPeerGroup(skillId, experienceLevel, region);
    if (!peerGroup || peerGroup.memberCount < this.MIN_GROUP_SIZE) {
      return null;
    }

    return {
      groupSize: peerGroup.memberCount,
      averageScore: peerGroup.averageSkillLevel,
      medianScore: peerGroup.medianSkillLevel,
      topPercentileThreshold: peerGroup.skillDistribution.percentile90,
      skillDistribution: peerGroup.skillDistribution,
      experienceLevel,
      region
    };
  }

  /**
   * Generates privacy-preserving peer rankings
   */
  static async generateAnonymizedRanking(
    userId: string,
    skillId: string
  ): Promise<PeerRanking | null> {
    const userProgress = await UserProgressService.getUserProgress(userId);
    if (!userProgress) return null;

    const userSkill = userProgress.skillLevels.get(skillId);
    if (!userSkill) return null;

    const experienceLevel = this.determineExperienceLevel(userProgress);
    const peerGroup = await this.getPeerGroup(skillId, experienceLevel);
    
    if (!peerGroup || peerGroup.memberCount < this.ANONYMIZATION_THRESHOLD) {
      return null;
    }

    const userScore = this.convertSkillToScore(userSkill);
    const percentile = this.calculatePercentile(userScore, peerGroup.skillDistribution);
    
    return {
      rankingId: `ranking_${userId}_${skillId}_${Date.now()}`,
      skillId,
      anonymizedRank: this.getAnonymizedRank(percentile),
      percentileRange: this.getPercentileRange(percentile),
      peerGroupSize: peerGroup.memberCount,
      confidenceInterval: this.calculateConfidenceInterval(percentile, peerGroup.memberCount),
      lastUpdated: new Date()
    };
  }

  /**
   * Performs statistical analysis on peer group data
   */
  static async performStatisticalAnalysis(
    skillId: string,
    experienceLevel: string
  ): Promise<StatisticalAnalysis | null> {
    const peerData = await this.getAnonymizedPeerData(skillId, experienceLevel);
    if (peerData.length < this.MIN_GROUP_SIZE) {
      return null;
    }

    const stats = this.calculateStatistics(peerData);
    
    return {
      analysisId: `analysis_${skillId}_${experienceLevel}_${Date.now()}`,
      skillId,
      sampleSize: peerData.length,
      mean: stats.mean,
      median: stats.median,
      standardDeviation: stats.standardDeviation,
      variance: stats.variance,
      skewness: stats.skewness,
      kurtosis: stats.kurtosis,
      confidenceInterval95: stats.confidenceInterval95,
      outlierThresholds: stats.outlierThresholds,
      distributionType: stats.distributionType
    };
  }

  /**
   * Updates peer group data with new user information (anonymized)
   */
  static async updatePeerGroupData(userProgress: UserProgress): Promise<void> {
    const privacySettings = await this.getUserPrivacySettings(userProgress.userId);
    
    if (!privacySettings.enablePeerComparison || privacySettings.optOutOfAggregation) {
      return; // User opted out of peer comparison
    }

    const experienceLevel = this.determineExperienceLevel(userProgress);
    
    for (const [skillId, skillLevel] of userProgress.skillLevels) {
      if (privacySettings.shareSkillLevels) {
        await this.addAnonymizedDataPoint(skillId, skillLevel, experienceLevel);
      }
    }
  }

  /**
   * Gets peer group for a specific skill and experience level
   */
  private static async getPeerGroup(
    skillId: string,
    experienceLevel: string,
    region?: string
  ): Promise<PeerGroup | null> {
    // In a real implementation, this would query aggregated, anonymized data
    // For now, we'll simulate peer group data
    const mockPeerGroups: Record<string, PeerGroup> = {
      [`${skillId}_${experienceLevel}`]: {
        groupId: `group_${skillId}_${experienceLevel}`,
        experienceLevel,
        skillCategory: skillId,
        memberCount: Math.floor(Math.random() * 500) + 50, // 50-550 members
        averageSkillLevel: this.getAverageForLevel(experienceLevel),
        medianSkillLevel: this.getMedianForLevel(experienceLevel),
        skillDistribution: this.generateSkillDistribution(experienceLevel),
        lastUpdated: new Date()
      }
    };

    return mockPeerGroups[`${skillId}_${experienceLevel}`] || null;
  }

  /**
   * Creates anonymized comparison between user and peer group
   */
  private static async createAnonymizedComparison(
    userId: string,
    userSkill: SkillLevel,
    peerGroup: PeerGroup
  ): Promise<AnonymizedPeerComparison> {
    const userScore = this.convertSkillToScore(userSkill);
    const percentile = this.calculatePercentile(userScore, peerGroup.skillDistribution);
    const relativePerformance = this.determineRelativePerformance(percentile);
    const improvementPotential = this.calculateImprovementPotential(userScore, peerGroup);

    return {
      comparisonId: `comparison_${userId}_${userSkill.skillId}_${Date.now()}`,
      userId,
      skillId: userSkill.skillId,
      userPercentile: percentile,
      peerGroupStats: {
        groupSize: peerGroup.memberCount,
        averageScore: peerGroup.averageSkillLevel,
        medianScore: peerGroup.medianSkillLevel,
        topPercentileThreshold: peerGroup.skillDistribution.percentile90,
        skillDistribution: peerGroup.skillDistribution,
        experienceLevel: peerGroup.experienceLevel
      },
      relativePerformance,
      improvementPotential,
      anonymizedInsights: this.generateAnonymizedInsights(percentile, peerGroup, userSkill),
      comparisonDate: new Date()
    };
  }

  /**
   * Gets anonymized peer data for statistical analysis
   */
  private static async getAnonymizedPeerData(
    skillId: string,
    experienceLevel: string
  ): Promise<number[]> {
    // In production, this would fetch anonymized aggregated data
    // For now, simulate realistic peer data
    const baseScore = this.getAverageForLevel(experienceLevel);
    const stdDev = 15;
    const sampleSize = Math.floor(Math.random() * 200) + 100;
    
    const data: number[] = [];
    for (let i = 0; i < sampleSize; i++) {
      // Generate normally distributed scores
      const score = this.generateNormalRandom(baseScore, stdDev);
      data.push(Math.max(0, Math.min(100, score)));
    }
    
    return data;
  }

  /**
   * Adds anonymized data point to peer group statistics
   */
  private static async addAnonymizedDataPoint(
    skillId: string,
    skillLevel: SkillLevel,
    experienceLevel: string
  ): Promise<void> {
    // In production, this would update aggregated statistics without storing individual data
    // Implementation would use differential privacy techniques
    const anonymizedScore = this.anonymizeScore(this.convertSkillToScore(skillLevel));
    
    // Store only aggregated, anonymized statistics
    console.log(`Adding anonymized data point for ${skillId} at ${experienceLevel} level: ${anonymizedScore}`);
  }

  /**
   * Gets user privacy settings
   */
  private static async getUserPrivacySettings(userId: string): Promise<PrivacySettings> {
    // In production, this would fetch from user preferences
    return {
      enablePeerComparison: true,
      shareSkillLevels: true,
      shareExperienceData: true,
      shareProgressTrends: false,
      anonymizationLevel: 'enhanced',
      optOutOfAggregation: false
    };
  }

  // Helper methods for calculations and anonymization

  private static determineExperienceLevel(userProgress: UserProgress): string {
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

  private static convertSkillToScore(skill: SkillLevel): number {
    const baseScore = skill.currentLevel * 20; // Level 1-5 maps to 20-100
    const experienceBonus = Math.min(20, skill.experiencePoints / 50);
    return Math.min(100, baseScore + experienceBonus);
  }

  private static calculatePercentile(score: number, distribution: SkillDistribution): number {
    if (score >= distribution.percentile90) {
      const range = 100 - distribution.percentile90;
      if (range === 0) return 95;
      return Math.round(90 + (score - distribution.percentile90) / range * 10);
    }
    if (score >= distribution.percentile75) {
      const range = distribution.percentile90 - distribution.percentile75;
      if (range === 0) return 82;
      return Math.round(75 + (score - distribution.percentile75) / range * 15);
    }
    if (score >= distribution.percentile50) {
      const range = distribution.percentile75 - distribution.percentile50;
      if (range === 0) return 62;
      return Math.round(50 + (score - distribution.percentile50) / range * 25);
    }
    if (score >= distribution.percentile25) {
      const range = distribution.percentile50 - distribution.percentile25;
      if (range === 0) return 37;
      return Math.round(25 + (score - distribution.percentile25) / range * 25);
    }
    const range = distribution.percentile25 - distribution.range.min;
    if (range === 0) return 12;
    return Math.round((score - distribution.range.min) / range * 25);
  }

  private static determineRelativePerformance(percentile: number): 'well_below' | 'below' | 'average' | 'above' | 'well_above' {
    if (percentile >= 90) return 'well_above';
    if (percentile >= 75) return 'above';
    if (percentile >= 25) return 'average';
    if (percentile >= 10) return 'below';
    return 'well_below';
  }

  private static calculateImprovementPotential(userScore: number, peerGroup: PeerGroup): number {
    const targetScore = peerGroup.skillDistribution.percentile75;
    const maxImprovement = 100 - userScore;
    const potentialGain = Math.max(0, targetScore - userScore);
    return Math.min(100, (potentialGain / maxImprovement) * 100);
  }

  private static generateAnonymizedInsights(
    percentile: number,
    peerGroup: PeerGroup,
    userSkill: SkillLevel
  ): string[] {
    const insights: string[] = [];
    
    if (percentile >= 75) {
      insights.push(`Your ${userSkill.skillName} skills are above average compared to peers at your experience level`);
      insights.push(`You're performing better than ${Math.round(percentile)}% of similar developers`);
    } else if (percentile >= 25) {
      insights.push(`Your ${userSkill.skillName} skills are in the average range for your peer group`);
      insights.push(`Focus on consistent practice to move into the top quartile`);
    } else {
      insights.push(`There's significant room for improvement in ${userSkill.skillName}`);
      insights.push(`Consider dedicating more time to this skill to catch up with peers`);
    }

    if (peerGroup.memberCount > 100) {
      insights.push(`This comparison is based on a large peer group of ${peerGroup.memberCount}+ developers`);
    }

    return insights;
  }

  private static getAnonymizedRank(percentile: number): string {
    if (percentile >= 95) return 'Top 5%';
    if (percentile >= 90) return 'Top 10%';
    if (percentile >= 75) return 'Above Average';
    if (percentile >= 50) return 'Average';
    if (percentile >= 25) return 'Below Average';
    return 'Bottom Quartile';
  }

  private static getPercentileRange(percentile: number): string {
    if (isNaN(percentile)) return '0-5th percentile';
    const lower = Math.floor(percentile / 5) * 5;
    const upper = Math.min(100, lower + 5);
    return `${lower}-${upper}th percentile`;
  }

  private static calculateConfidenceInterval(percentile: number, sampleSize: number): { lower: number; upper: number } {
    // Simplified confidence interval calculation
    const marginOfError = 1.96 * Math.sqrt((percentile * (100 - percentile)) / sampleSize);
    return {
      lower: Math.max(0, percentile - marginOfError),
      upper: Math.min(100, percentile + marginOfError)
    };
  }

  private static calculateStatistics(data: number[]): {
    mean: number;
    median: number;
    standardDeviation: number;
    variance: number;
    skewness: number;
    kurtosis: number;
    confidenceInterval95: { lower: number; upper: number };
    outlierThresholds: { lower: number; upper: number };
    distributionType: 'normal' | 'skewed_left' | 'skewed_right' | 'bimodal' | 'uniform';
  } {
    const sorted = [...data].sort((a, b) => a - b);
    const n = data.length;
    
    // Mean
    const mean = data.reduce((sum, val) => sum + val, 0) / n;
    
    // Median
    const median = n % 2 === 0 
      ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2
      : sorted[Math.floor(n / 2)];
    
    // Variance and Standard Deviation
    const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (n - 1);
    const standardDeviation = Math.sqrt(variance);
    
    // Skewness
    const skewness = data.reduce((sum, val) => sum + Math.pow((val - mean) / standardDeviation, 3), 0) / n;
    
    // Kurtosis
    const kurtosis = data.reduce((sum, val) => sum + Math.pow((val - mean) / standardDeviation, 4), 0) / n - 3;
    
    // Confidence Interval (95%)
    const marginOfError = 1.96 * (standardDeviation / Math.sqrt(n));
    const confidenceInterval95 = {
      lower: mean - marginOfError,
      upper: mean + marginOfError
    };
    
    // Outlier thresholds (IQR method)
    const q1 = sorted[Math.floor(n * 0.25)];
    const q3 = sorted[Math.floor(n * 0.75)];
    const iqr = q3 - q1;
    const outlierThresholds = {
      lower: q1 - 1.5 * iqr,
      upper: q3 + 1.5 * iqr
    };
    
    // Distribution type (simplified classification)
    let distributionType: 'normal' | 'skewed_left' | 'skewed_right' | 'bimodal' | 'uniform' = 'normal';
    if (Math.abs(skewness) > 1) {
      distributionType = skewness > 0 ? 'skewed_right' : 'skewed_left';
    } else if (kurtosis > 3) {
      distributionType = 'bimodal';
    } else if (kurtosis < -1) {
      distributionType = 'uniform';
    }
    
    return {
      mean,
      median,
      standardDeviation,
      variance,
      skewness,
      kurtosis,
      confidenceInterval95,
      outlierThresholds,
      distributionType
    };
  }

  private static anonymizeScore(score: number): number {
    // Add noise for differential privacy
    const noise = (Math.random() - 0.5) * 10; // ±5 points of noise
    return Math.max(0, Math.min(100, score + noise));
  }

  private static generateNormalRandom(mean: number, stdDev: number): number {
    // Box-Muller transform for normal distribution
    const u1 = Math.random();
    const u2 = Math.random();
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return mean + stdDev * z0;
  }

  private static getAverageForLevel(experienceLevel: string): number {
    const averages = {
      entry: 35,
      junior: 50,
      mid: 65,
      senior: 80,
      lead: 90,
      principal: 95
    };
    return averages[experienceLevel as keyof typeof averages] || 50;
  }

  private static getMedianForLevel(experienceLevel: string): number {
    const medians = {
      entry: 32,
      junior: 48,
      mid: 63,
      senior: 78,
      lead: 88,
      principal: 93
    };
    return medians[experienceLevel as keyof typeof medians] || 48;
  }

  private static generateSkillDistribution(experienceLevel: string): SkillDistribution {
    const base = this.getAverageForLevel(experienceLevel);
    const stdDev = 15;
    
    return {
      percentile25: Math.max(0, base - stdDev),
      percentile50: base,
      percentile75: Math.min(100, base + stdDev * 0.67),
      percentile90: Math.min(100, base + stdDev * 1.28),
      standardDeviation: stdDev,
      range: {
        min: Math.max(0, base - stdDev * 2),
        max: Math.min(100, base + stdDev * 2)
      }
    };
  }
}