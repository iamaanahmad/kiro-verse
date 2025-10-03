/**
 * @fileOverview Points calculation system for gamification features
 * 
 * This service implements sophisticated points calculation algorithms that:
 * - Calculate base points from code quality metrics
 * - Apply bonus multipliers for various achievements
 * - Consider difficulty levels and rarity factors
 * - Integrate with existing analytics and badge systems
 */

import { 
  PointsCalculation, 
  PointsBreakdown, 
  PointsConfig,
  BadgeRarity 
} from '@/types/gamification';
import { AIAnalysisResult, Challenge, ChallengeSubmission } from '@/types/analytics';

export class PointsCalculator {
  private static readonly DEFAULT_CONFIG: PointsConfig = {
    basePointsRange: { min: 10, max: 100 },
    qualityBonusMultiplier: 0.5,
    efficiencyBonusMultiplier: 0.3,
    creativityBonusMultiplier: 0.4,
    bestPracticesBonusMultiplier: 0.6,
    difficultyMultipliers: {
      beginner: 1.0,
      intermediate: 1.5,
      advanced: 2.0,
      expert: 3.0
    },
    rarityBonuses: {
      common: 0,
      uncommon: 10,
      rare: 25,
      epic: 50,
      legendary: 100
    }
  };

  /**
   * Calculates points for a code submission based on AI analysis
   */
  static calculateCodeSubmissionPoints(
    aiAnalysis: AIAnalysisResult,
    difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert' = 'intermediate',
    config: Partial<PointsConfig> = {}
  ): PointsCalculation {
    const finalConfig = { ...this.DEFAULT_CONFIG, ...config };
    const breakdown: PointsBreakdown[] = [];

    // Calculate base points from overall code quality
    const averageQuality = (
      aiAnalysis.codeQuality + 
      aiAnalysis.efficiency + 
      aiAnalysis.creativity + 
      aiAnalysis.bestPractices
    ) / 4;

    const basePoints = Math.round(
      finalConfig.basePointsRange.min + 
      (averageQuality / 100) * (finalConfig.basePointsRange.max - finalConfig.basePointsRange.min)
    );

    breakdown.push({
      category: 'Base Points',
      points: basePoints,
      description: `Base points from overall code quality (${averageQuality.toFixed(1)}%)`
    });

    // Calculate quality bonus
    const qualityBonus = Math.round(
      (aiAnalysis.codeQuality / 100) * basePoints * finalConfig.qualityBonusMultiplier
    );

    breakdown.push({
      category: 'Code Quality Bonus',
      points: qualityBonus,
      description: `Bonus for code quality score of ${aiAnalysis.codeQuality}%`,
      multiplier: finalConfig.qualityBonusMultiplier
    });

    // Calculate efficiency bonus
    const efficiencyBonus = Math.round(
      (aiAnalysis.efficiency / 100) * basePoints * finalConfig.efficiencyBonusMultiplier
    );

    breakdown.push({
      category: 'Efficiency Bonus',
      points: efficiencyBonus,
      description: `Bonus for efficiency score of ${aiAnalysis.efficiency}%`,
      multiplier: finalConfig.efficiencyBonusMultiplier
    });

    // Calculate creativity bonus
    const creativityBonus = Math.round(
      (aiAnalysis.creativity / 100) * basePoints * finalConfig.creativityBonusMultiplier
    );

    breakdown.push({
      category: 'Creativity Bonus',
      points: creativityBonus,
      description: `Bonus for creativity score of ${aiAnalysis.creativity}%`,
      multiplier: finalConfig.creativityBonusMultiplier
    });

    // Calculate best practices bonus
    const bestPracticesBonus = Math.round(
      (aiAnalysis.bestPractices / 100) * basePoints * finalConfig.bestPracticesBonusMultiplier
    );

    breakdown.push({
      category: 'Best Practices Bonus',
      points: bestPracticesBonus,
      description: `Bonus for best practices score of ${aiAnalysis.bestPractices}%`,
      multiplier: finalConfig.bestPracticesBonusMultiplier
    });

    // Apply difficulty multiplier
    const difficultyMultiplier = finalConfig.difficultyMultipliers[difficulty];
    const subtotal = basePoints + qualityBonus + efficiencyBonus + creativityBonus + bestPracticesBonus;
    const difficultyBonus = Math.round(subtotal * (difficultyMultiplier - 1));

    if (difficultyBonus > 0) {
      breakdown.push({
        category: 'Difficulty Bonus',
        points: difficultyBonus,
        description: `${difficulty} difficulty multiplier (${difficultyMultiplier}x)`,
        multiplier: difficultyMultiplier
      });
    }

    const totalPoints = subtotal + difficultyBonus;

    return {
      basePoints,
      qualityBonus,
      efficiencyBonus,
      creativityBonus,
      bestPracticesBonus,
      difficultyMultiplier,
      totalPoints,
      breakdown
    };
  }

  /**
   * Calculates points for challenge completion
   */
  static calculateChallengePoints(
    challenge: Challenge,
    submission: ChallengeSubmission,
    completionTime?: number
  ): PointsCalculation {
    const breakdown: PointsBreakdown[] = [];

    // Base points from challenge difficulty
    const difficultyPoints = this.getDifficultyBasePoints(challenge.difficulty);
    breakdown.push({
      category: 'Challenge Base Points',
      points: difficultyPoints,
      description: `Base points for ${challenge.difficulty} challenge`
    });

    // Performance bonus based on score
    const performanceBonus = Math.round((submission.totalScore / 100) * difficultyPoints * 0.5);
    breakdown.push({
      category: 'Performance Bonus',
      points: performanceBonus,
      description: `Bonus for ${submission.totalScore}% completion score`,
      multiplier: 0.5
    });

    // Speed bonus for fast completion
    let speedBonus = 0;
    if (completionTime && challenge.timeLimit) {
      const timeRatio = completionTime / (challenge.timeLimit * 60); // Convert to seconds
      if (timeRatio < 0.5) {
        speedBonus = Math.round(difficultyPoints * 0.3);
        breakdown.push({
          category: 'Speed Bonus',
          points: speedBonus,
          description: `Fast completion bonus (${Math.round(timeRatio * 100)}% of time limit)`
        });
      }
    }

    // Perfect score bonus
    let perfectBonus = 0;
    if (submission.totalScore === 100) {
      perfectBonus = Math.round(difficultyPoints * 0.2);
      breakdown.push({
        category: 'Perfect Score Bonus',
        points: perfectBonus,
        description: 'Bonus for 100% completion'
      });
    }

    // AI analysis bonus if available
    let aiBonus = 0;
    if (submission.aiAnalysis) {
      const aiPoints = this.calculateCodeSubmissionPoints(
        submission.aiAnalysis,
        challenge.difficulty
      );
      aiBonus = Math.round(aiPoints.totalPoints * 0.3);
      breakdown.push({
        category: 'AI Analysis Bonus',
        points: aiBonus,
        description: 'Bonus from AI code quality analysis'
      });
    }

    const totalPoints = difficultyPoints + performanceBonus + speedBonus + perfectBonus + aiBonus;

    return {
      basePoints: difficultyPoints,
      qualityBonus: performanceBonus,
      efficiencyBonus: speedBonus,
      creativityBonus: perfectBonus,
      bestPracticesBonus: aiBonus,
      difficultyMultiplier: this.DEFAULT_CONFIG.difficultyMultipliers[challenge.difficulty],
      totalPoints,
      breakdown
    };
  }

  /**
   * Calculates points for peer review activities
   */
  static calculatePeerReviewPoints(
    reviewQuality: number, // 1-5 rating
    reviewLength: number, // number of characters
    helpfulness: number, // 1-5 rating from reviewee
    isFirstReview: boolean = false
  ): PointsCalculation {
    const breakdown: PointsBreakdown[] = [];

    // Base points for providing review
    const basePoints = 20;
    breakdown.push({
      category: 'Review Base Points',
      points: basePoints,
      description: 'Base points for providing peer review'
    });

    // Quality bonus
    const qualityBonus = Math.round((reviewQuality - 1) * 10); // 0-40 points
    breakdown.push({
      category: 'Review Quality Bonus',
      points: qualityBonus,
      description: `Quality bonus for ${reviewQuality}/5 rating`
    });

    // Length bonus for detailed reviews
    const lengthBonus = Math.min(20, Math.round(reviewLength / 50)); // Up to 20 points
    breakdown.push({
      category: 'Detail Bonus',
      points: lengthBonus,
      description: `Bonus for detailed review (${reviewLength} characters)`
    });

    // Helpfulness bonus
    const helpfulnessBonus = Math.round((helpfulness - 1) * 8); // 0-32 points
    breakdown.push({
      category: 'Helpfulness Bonus',
      points: helpfulnessBonus,
      description: `Helpfulness bonus for ${helpfulness}/5 rating`
    });

    // First review bonus
    let firstReviewBonus = 0;
    if (isFirstReview) {
      firstReviewBonus = 15;
      breakdown.push({
        category: 'First Review Bonus',
        points: firstReviewBonus,
        description: 'Bonus for being the first to review'
      });
    }

    const totalPoints = basePoints + qualityBonus + lengthBonus + helpfulnessBonus + firstReviewBonus;

    return {
      basePoints,
      qualityBonus,
      efficiencyBonus: lengthBonus,
      creativityBonus: helpfulnessBonus,
      bestPracticesBonus: firstReviewBonus,
      difficultyMultiplier: 1,
      totalPoints,
      breakdown
    };
  }

  /**
   * Calculates points for community contributions
   */
  static calculateCommunityPoints(
    contributionType: 'bug_report' | 'feature_suggestion' | 'content_creation' | 'mentorship' | 'moderation',
    impact: 'low' | 'medium' | 'high',
    communityVotes: number = 0,
    isAccepted: boolean = false
  ): PointsCalculation {
    const breakdown: PointsBreakdown[] = [];

    // Base points by contribution type
    const basePointsMap = {
      bug_report: 30,
      feature_suggestion: 25,
      content_creation: 40,
      mentorship: 50,
      moderation: 35
    };

    const basePoints = basePointsMap[contributionType];
    breakdown.push({
      category: 'Contribution Base Points',
      points: basePoints,
      description: `Base points for ${contributionType.replace('_', ' ')}`
    });

    // Impact bonus
    const impactMultipliers = { low: 1, medium: 1.5, high: 2 };
    const impactBonus = Math.round(basePoints * (impactMultipliers[impact] - 1));
    
    if (impactBonus > 0) {
      breakdown.push({
        category: 'Impact Bonus',
        points: impactBonus,
        description: `${impact} impact multiplier`,
        multiplier: impactMultipliers[impact]
      });
    }

    // Community votes bonus
    const votesBonus = Math.min(50, communityVotes * 2); // Up to 50 points
    if (votesBonus > 0) {
      breakdown.push({
        category: 'Community Votes Bonus',
        points: votesBonus,
        description: `Bonus for ${communityVotes} community votes`
      });
    }

    // Acceptance bonus
    let acceptanceBonus = 0;
    if (isAccepted) {
      acceptanceBonus = Math.round(basePoints * 0.5);
      breakdown.push({
        category: 'Acceptance Bonus',
        points: acceptanceBonus,
        description: 'Bonus for accepted contribution'
      });
    }

    const totalPoints = basePoints + impactBonus + votesBonus + acceptanceBonus;

    return {
      basePoints,
      qualityBonus: impactBonus,
      efficiencyBonus: votesBonus,
      creativityBonus: acceptanceBonus,
      bestPracticesBonus: 0,
      difficultyMultiplier: impactMultipliers[impact],
      totalPoints,
      breakdown
    };
  }

  /**
   * Calculates bonus points for badge rarity
   */
  static calculateRarityBonus(rarity: BadgeRarity['level']): number {
    return this.DEFAULT_CONFIG.rarityBonuses[rarity];
  }

  /**
   * Calculates streak bonus points
   */
  static calculateStreakBonus(
    streakDays: number,
    streakType: 'daily_coding' | 'challenge_completion' | 'peer_review'
  ): PointsCalculation {
    const breakdown: PointsBreakdown[] = [];

    // Base streak bonus
    const baseBonus = Math.min(100, streakDays * 2); // Up to 100 points
    breakdown.push({
      category: 'Streak Base Bonus',
      points: baseBonus,
      description: `${streakDays} day ${streakType.replace('_', ' ')} streak`
    });

    // Milestone bonuses
    let milestoneBonus = 0;
    const milestones = [7, 14, 30, 60, 100];
    
    for (const milestone of milestones) {
      if (streakDays >= milestone) {
        const bonus = milestone * 2;
        milestoneBonus += bonus;
        breakdown.push({
          category: `${milestone}-Day Milestone`,
          points: bonus,
          description: `Milestone bonus for ${milestone} day streak`
        });
      }
    }

    const totalPoints = baseBonus + milestoneBonus;

    return {
      basePoints: baseBonus,
      qualityBonus: 0,
      efficiencyBonus: 0,
      creativityBonus: 0,
      bestPracticesBonus: milestoneBonus,
      difficultyMultiplier: 1,
      totalPoints,
      breakdown
    };
  }

  // Helper methods

  private static getDifficultyBasePoints(difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert'): number {
    const pointsMap = {
      beginner: 50,
      intermediate: 75,
      advanced: 100,
      expert: 150
    };
    return pointsMap[difficulty];
  }

  /**
   * Validates points calculation result
   */
  static validatePointsCalculation(calculation: PointsCalculation): boolean {
    // Ensure total points match breakdown
    const breakdownTotal = calculation.breakdown.reduce((sum, item) => sum + item.points, 0);
    return Math.abs(breakdownTotal - calculation.totalPoints) <= 1; // Allow for rounding differences
  }

  /**
   * Formats points calculation for display
   */
  static formatPointsBreakdown(calculation: PointsCalculation): string {
    let result = `Total Points: ${calculation.totalPoints}\n\nBreakdown:\n`;
    
    for (const item of calculation.breakdown) {
      result += `• ${item.category}: ${item.points} points`;
      if (item.multiplier) {
        result += ` (${item.multiplier}x multiplier)`;
      }
      result += `\n  ${item.description}\n`;
    }
    
    return result;
  }
}