/**
 * @fileOverview Badge calculation and awarding system
 * 
 * This service implements sophisticated badge awarding logic that:
 * - Calculates badge eligibility based on multiple criteria
 * - Determines badge rarity using advanced algorithms
 * - Integrates with blockchain verification system
 * - Manages achievement progress and milestone tracking
 */

import { 
  BadgeAward, 
  BadgeType, 
  BadgeRarity, 
  BadgeCriteria,
  BadgeMetadata,
  ValidationCriteria,
  RarityCalculation,
  SpecialBadge,
  CommunityBadge,
  Achievement,
  AchievementProgress,
  Milestone
} from '@/types/gamification';
import { 
  AIAnalysisResult, 
  SkillLevel, 
  UserProgress, 
  Challenge, 
  ChallengeSubmission 
} from '@/types/analytics';
import { PointsCalculator } from './points-calculator';

export interface BadgeEligibilityResult {
  isEligible: boolean;
  badgeAward?: BadgeAward;
  missingCriteria: string[];
  progressToNext: number; // 0-100 percentage
  estimatedTimeToEarn?: string;
}

export interface BadgeAwardContext {
  userId: string;
  userProgress: UserProgress;
  aiAnalysis?: AIAnalysisResult;
  challenge?: Challenge;
  submission?: ChallengeSubmission;
  peerReviewScore?: number;
  communityContribution?: any;
  timeConstraints?: {
    submissionTime?: number;
    sessionDuration?: number;
    streakDays?: number;
  };
}

export class BadgeCalculator {
  private static readonly SKILL_BADGES = {
    // JavaScript badges
    'JavaScript Fundamentals': {
      category: 'skill',
      subcategory: 'javascript',
      criteria: { minimumSkillLevel: 1, codeQualityThreshold: 60 },
      rarity: 'common'
    },
    'JavaScript Advanced': {
      category: 'skill',
      subcategory: 'javascript',
      criteria: { minimumSkillLevel: 3, codeQualityThreshold: 80 },
      rarity: 'rare'
    },
    'JavaScript Master': {
      category: 'skill',
      subcategory: 'javascript',
      criteria: { minimumSkillLevel: 4, codeQualityThreshold: 90 },
      rarity: 'epic'
    },
    
    // React badges
    'React Hooks Expert': {
      category: 'skill',
      subcategory: 'react',
      criteria: { specificSkills: ['hooks'], minimumSkillLevel: 3, codeQualityThreshold: 85 },
      rarity: 'rare'
    },
    'React Performance Optimizer': {
      category: 'skill',
      subcategory: 'react',
      criteria: { specificSkills: ['performance', 'optimization'], minimumSkillLevel: 4 },
      rarity: 'epic'
    },
    
    // TypeScript badges
    'TypeScript Type Safety': {
      category: 'skill',
      subcategory: 'typescript',
      criteria: { specificSkills: ['interfaces', 'type-guards'], minimumSkillLevel: 2 },
      rarity: 'uncommon'
    },
    'TypeScript Generics Master': {
      category: 'skill',
      subcategory: 'typescript',
      criteria: { specificSkills: ['generics', 'advanced-types'], minimumSkillLevel: 4 },
      rarity: 'legendary'
    },
    
    // Algorithm badges
    'Algorithm Efficiency': {
      category: 'skill',
      subcategory: 'algorithms',
      criteria: { codeQualityThreshold: 85, specificSkills: ['optimization'] },
      rarity: 'rare'
    },
    'Data Structure Master': {
      category: 'skill',
      subcategory: 'algorithms',
      criteria: { minimumSkillLevel: 4, specificSkills: ['data-structures'] },
      rarity: 'epic'
    }
  };

  private static readonly ACHIEVEMENT_BADGES = {
    // Challenge completion badges
    'Challenge Conqueror': {
      category: 'achievement',
      subcategory: 'challenges',
      criteria: { challengeCompletion: true, requiredPoints: 500 },
      rarity: 'uncommon'
    },
    'Speed Demon': {
      category: 'achievement',
      subcategory: 'challenges',
      criteria: { 
        challengeCompletion: true,
        timeConstraints: { type: 'within_timeframe', duration: 300 } // 5 minutes
      },
      rarity: 'rare'
    },
    'Perfect Score': {
      category: 'achievement',
      subcategory: 'challenges',
      criteria: { challengeCompletion: true },
      rarity: 'epic',
      specialConditions: ['100% completion score']
    },
    
    // Milestone badges
    'First Steps': {
      category: 'milestone',
      subcategory: 'progression',
      criteria: { minimumSkillLevel: 1 },
      rarity: 'common'
    },
    'Rising Star': {
      category: 'milestone',
      subcategory: 'progression',
      criteria: { requiredPoints: 1000 },
      rarity: 'uncommon'
    },
    'Code Virtuoso': {
      category: 'milestone',
      subcategory: 'progression',
      criteria: { requiredPoints: 10000, minimumSkillLevel: 4 },
      rarity: 'legendary'
    },
    
    // Community badges
    'Helpful Reviewer': {
      category: 'community',
      subcategory: 'peer_review',
      criteria: { peerReviewScore: 4.0 },
      rarity: 'uncommon'
    },
    'Mentor': {
      category: 'community',
      subcategory: 'mentorship',
      criteria: { peerReviewScore: 4.5, requiredPoints: 2000 },
      rarity: 'rare'
    }
  };

  private static readonly SPECIAL_BADGES = {
    'Early Adopter': {
      category: 'special',
      subcategory: 'limited_time',
      criteria: {},
      rarity: 'legendary',
      limitedEdition: true,
      expirationDate: new Date('2024-12-31')
    },
    'Beta Tester': {
      category: 'special',
      subcategory: 'contribution',
      criteria: {},
      rarity: 'epic',
      limitedEdition: true
    }
  };

  /**
   * Evaluates badge eligibility for a given context
   */
  static async evaluateBadgeEligibility(
    badgeName: string,
    context: BadgeAwardContext
  ): Promise<BadgeEligibilityResult> {
    const badgeConfig = this.getBadgeConfig(badgeName);
    
    if (!badgeConfig) {
      return {
        isEligible: false,
        missingCriteria: ['Badge not found'],
        progressToNext: 0
      };
    }

    const validationResults = await this.validateBadgeCriteria(badgeConfig.criteria, context);
    const isEligible = validationResults.every(result => result.passed);
    
    if (isEligible) {
      const badgeAward = await this.createBadgeAward(badgeName, badgeConfig, context, validationResults);
      return {
        isEligible: true,
        badgeAward,
        missingCriteria: [],
        progressToNext: 100
      };
    } else {
      const missingCriteria = validationResults
        .filter(result => !result.passed)
        .map(result => result.criterion);
      
      const progressToNext = this.calculateProgressToNext(validationResults);
      const estimatedTimeToEarn = this.estimateTimeToEarn(validationResults, context);
      
      return {
        isEligible: false,
        missingCriteria,
        progressToNext,
        estimatedTimeToEarn
      };
    }
  }

  /**
   * Calculates badge rarity based on multiple factors
   */
  static calculateBadgeRarity(
    badgeConfig: any,
    context: BadgeAwardContext,
    validationResults: ValidationCriteria[]
  ): RarityCalculation {
    // Base rarity from configuration
    const rarityScores = {
      common: 10,
      uncommon: 30,
      rare: 60,
      epic: 85,
      legendary: 95
    };
    
    const baseRarity = rarityScores[badgeConfig.rarity as keyof typeof rarityScores] || 50;
    
    // Difficulty bonus based on criteria complexity
    const difficultyBonus = this.calculateDifficultyBonus(badgeConfig.criteria);
    
    // Quality bonus based on performance
    const qualityBonus = this.calculateQualityBonus(context);
    
    // Time bonus for quick achievement
    const timeBonus = this.calculateTimeBonus(context);
    
    // Community bonus for peer recognition
    const communityBonus = this.calculateCommunityBonus(context);
    
    const finalRarity = Math.min(100, baseRarity + difficultyBonus + qualityBonus + timeBonus + communityBonus);
    
    // Determine rarity level
    let rarityLevel: BadgeRarity['level'] = 'common';
    if (finalRarity >= 95) rarityLevel = 'legendary';
    else if (finalRarity >= 85) rarityLevel = 'epic';
    else if (finalRarity >= 60) rarityLevel = 'rare';
    else if (finalRarity >= 30) rarityLevel = 'uncommon';
    
    return {
      baseRarity,
      difficultyBonus,
      qualityBonus,
      timeBonus,
      communityBonus,
      finalRarity,
      rarityLevel
    };
  }

  /**
   * Creates a complete badge award with metadata
   */
  static async createBadgeAward(
    badgeName: string,
    badgeConfig: any,
    context: BadgeAwardContext,
    validationResults: ValidationCriteria[]
  ): Promise<BadgeAward> {
    const rarityCalculation = this.calculateBadgeRarity(badgeConfig, context, validationResults);
    
    // Calculate estimated holders (simulated for now)
    const estimatedHolders = this.estimateBadgeHolders(rarityCalculation.rarityLevel);
    const globalPercentage = this.calculateGlobalPercentage(estimatedHolders);
    
    const badgeAward: BadgeAward = {
      badgeId: `badge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      badgeName,
      badgeType: {
        category: badgeConfig.category,
        subcategory: badgeConfig.subcategory,
        skillArea: badgeConfig.skillArea
      },
      rarity: {
        level: rarityCalculation.rarityLevel,
        rarityScore: rarityCalculation.finalRarity,
        estimatedHolders,
        globalPercentage
      },
      description: this.generateBadgeDescription(badgeName, badgeConfig, context),
      iconUrl: this.generateBadgeIconUrl(badgeName, rarityCalculation.rarityLevel),
      criteria: badgeConfig.criteria,
      awardedAt: new Date(),
      verificationStatus: 'pending',
      metadata: {
        skillsValidated: this.extractValidatedSkills(context),
        codeQualityScore: context.aiAnalysis?.codeQuality || 0,
        difficultyLevel: this.determineDifficultyLevel(context),
        validationCriteria: validationResults
      }
    };
    
    return badgeAward;
  }

  /**
   * Creates special limited edition badges
   */
  static createSpecialBadge(
    badgeName: string,
    context: BadgeAwardContext,
    eventId?: string,
    serialNumber?: number,
    totalMinted?: number
  ): SpecialBadge {
    const baseBadge = this.SPECIAL_BADGES[badgeName as keyof typeof this.SPECIAL_BADGES];
    
    if (!baseBadge) {
      throw new Error(`Special badge ${badgeName} not found`);
    }
    
    const specialBadge: SpecialBadge = {
      ...this.createBaseBadgeStructure(badgeName, baseBadge, context),
      eventId,
      limitedEdition: true,
      serialNumber,
      totalMinted,
      expirationDate: baseBadge.expirationDate,
      transferable: false
    };
    
    return specialBadge;
  }

  /**
   * Creates community contribution badges
   */
  static createCommunityBadge(
    badgeName: string,
    context: BadgeAwardContext,
    contributionType: CommunityBadge['contributionType'],
    impactScore: number,
    endorsements: string[] = []
  ): CommunityBadge {
    const baseBadge = this.ACHIEVEMENT_BADGES[badgeName as keyof typeof this.ACHIEVEMENT_BADGES];
    
    if (!baseBadge) {
      throw new Error(`Community badge ${badgeName} not found`);
    }
    
    const communityBadge: CommunityBadge = {
      ...this.createBaseBadgeStructure(badgeName, baseBadge, context),
      contributionType,
      impactScore,
      communityVotes: endorsements.length,
      endorsements
    };
    
    return communityBadge;
  }

  /**
   * Tracks achievement progress towards badges
   */
  static async trackAchievementProgress(
    userId: string,
    achievementId: string,
    currentProgress: number,
    targetProgress: number
  ): Promise<AchievementProgress> {
    const progressPercentage = Math.min(100, (currentProgress / targetProgress) * 100);
    const isCompleted = progressPercentage >= 100;
    
    // Generate milestones
    const milestones = this.generateMilestones(achievementId, targetProgress);
    
    // Update milestone completion status
    for (const milestone of milestones) {
      milestone.currentValue = Math.min(milestone.targetValue, currentProgress);
      milestone.isCompleted = milestone.currentValue >= milestone.targetValue;
      if (milestone.isCompleted && !milestone.completedAt) {
        milestone.completedAt = new Date();
      }
    }
    
    // Estimate completion time
    const estimatedCompletion = this.estimateAchievementCompletion(
      currentProgress,
      targetProgress,
      userId
    );
    
    return {
      achievementId,
      userId,
      currentProgress,
      targetProgress,
      progressPercentage,
      milestones,
      isCompleted,
      estimatedCompletion,
      lastUpdated: new Date()
    };
  }

  // Private helper methods

  private static getBadgeConfig(badgeName: string): any {
    return this.SKILL_BADGES[badgeName as keyof typeof this.SKILL_BADGES] ||
           this.ACHIEVEMENT_BADGES[badgeName as keyof typeof this.ACHIEVEMENT_BADGES] ||
           this.SPECIAL_BADGES[badgeName as keyof typeof this.SPECIAL_BADGES];
  }

  private static async validateBadgeCriteria(
    criteria: BadgeCriteria,
    context: BadgeAwardContext
  ): Promise<ValidationCriteria[]> {
    const results: ValidationCriteria[] = [];
    
    // Validate minimum skill level
    if (criteria.minimumSkillLevel) {
      const userSkillLevels = Array.from(context.userProgress.skillLevels.values());
      const maxSkillLevel = Math.max(...userSkillLevels.map(skill => skill.currentLevel), 0);
      
      results.push({
        criterion: 'Minimum Skill Level',
        value: maxSkillLevel,
        threshold: criteria.minimumSkillLevel,
        passed: maxSkillLevel >= criteria.minimumSkillLevel
      });
    }
    
    // Validate required points
    if (criteria.requiredPoints) {
      const totalPoints = this.calculateTotalUserPoints(context.userProgress);
      
      results.push({
        criterion: 'Required Points',
        value: totalPoints,
        threshold: criteria.requiredPoints,
        passed: totalPoints >= criteria.requiredPoints
      });
    }
    
    // Validate code quality threshold
    if (criteria.codeQualityThreshold && context.aiAnalysis) {
      results.push({
        criterion: 'Code Quality Threshold',
        value: context.aiAnalysis.codeQuality,
        threshold: criteria.codeQualityThreshold,
        passed: context.aiAnalysis.codeQuality >= criteria.codeQualityThreshold
      });
    }
    
    // Validate specific skills
    if (criteria.specificSkills && context.aiAnalysis) {
      const hasRequiredSkills = criteria.specificSkills.every(skill =>
        context.aiAnalysis!.detectedSkills.includes(skill)
      );
      
      results.push({
        criterion: 'Specific Skills',
        value: hasRequiredSkills,
        passed: hasRequiredSkills
      });
    }
    
    // Validate challenge completion
    if (criteria.challengeCompletion && context.submission) {
      results.push({
        criterion: 'Challenge Completion',
        value: context.submission.passed,
        passed: context.submission.passed
      });
    }
    
    // Validate peer review score
    if (criteria.peerReviewScore && context.peerReviewScore) {
      results.push({
        criterion: 'Peer Review Score',
        value: context.peerReviewScore,
        threshold: criteria.peerReviewScore,
        passed: context.peerReviewScore >= criteria.peerReviewScore
      });
    }
    
    return results;
  }

  private static calculateProgressToNext(validationResults: ValidationCriteria[]): number {
    const totalCriteria = validationResults.length;
    const passedCriteria = validationResults.filter(result => result.passed).length;
    
    return Math.round((passedCriteria / totalCriteria) * 100);
  }

  private static estimateTimeToEarn(
    validationResults: ValidationCriteria[],
    context: BadgeAwardContext
  ): string {
    // Simple estimation based on missing criteria
    const missingCriteria = validationResults.filter(result => !result.passed);
    
    if (missingCriteria.length === 0) return 'Ready to earn!';
    if (missingCriteria.length === 1) return '1-2 sessions';
    if (missingCriteria.length <= 3) return '1-2 weeks';
    return '2-4 weeks';
  }

  private static calculateDifficultyBonus(criteria: BadgeCriteria): number {
    let bonus = 0;
    
    if (criteria.minimumSkillLevel && criteria.minimumSkillLevel >= 4) bonus += 15;
    if (criteria.codeQualityThreshold && criteria.codeQualityThreshold >= 90) bonus += 10;
    if (criteria.specificSkills && criteria.specificSkills.length > 2) bonus += 5;
    if (criteria.timeConstraints) bonus += 10;
    
    return bonus;
  }

  private static calculateQualityBonus(context: BadgeAwardContext): number {
    if (!context.aiAnalysis) return 0;
    
    const averageQuality = (
      context.aiAnalysis.codeQuality +
      context.aiAnalysis.efficiency +
      context.aiAnalysis.creativity +
      context.aiAnalysis.bestPractices
    ) / 4;
    
    if (averageQuality >= 95) return 15;
    if (averageQuality >= 90) return 10;
    if (averageQuality >= 85) return 5;
    return 0;
  }

  private static calculateTimeBonus(context: BadgeAwardContext): number {
    if (!context.timeConstraints?.submissionTime || !context.challenge?.timeLimit) return 0;
    
    const timeRatio = context.timeConstraints.submissionTime / (context.challenge.timeLimit * 60);
    
    if (timeRatio < 0.3) return 10;
    if (timeRatio < 0.5) return 5;
    return 0;
  }

  private static calculateCommunityBonus(context: BadgeAwardContext): number {
    if (!context.peerReviewScore) return 0;
    
    if (context.peerReviewScore >= 4.8) return 10;
    if (context.peerReviewScore >= 4.5) return 5;
    return 0;
  }

  private static estimateBadgeHolders(rarityLevel: BadgeRarity['level']): number {
    const estimates = {
      common: 10000,
      uncommon: 5000,
      rare: 1000,
      epic: 200,
      legendary: 50
    };
    
    return estimates[rarityLevel];
  }

  private static calculateGlobalPercentage(estimatedHolders: number): number {
    const totalUsers = 100000; // Simulated total user base
    return (estimatedHolders / totalUsers) * 100;
  }

  private static generateBadgeDescription(
    badgeName: string,
    badgeConfig: any,
    context: BadgeAwardContext
  ): string {
    const skillsText = context.aiAnalysis?.detectedSkills.join(', ') || 'programming skills';
    return `Awarded for demonstrating excellence in ${skillsText}. This ${badgeConfig.rarity} badge recognizes your achievement in ${badgeConfig.subcategory}.`;
  }

  private static generateBadgeIconUrl(badgeName: string, rarity: BadgeRarity['level']): string {
    const sanitizedName = badgeName.toLowerCase().replace(/\s+/g, '-');
    return `/badges/${rarity}/${sanitizedName}.svg`;
  }

  private static extractValidatedSkills(context: BadgeAwardContext): string[] {
    return context.aiAnalysis?.detectedSkills || [];
  }

  private static determineDifficultyLevel(context: BadgeAwardContext): 'beginner' | 'intermediate' | 'advanced' | 'expert' {
    if (context.challenge) return context.challenge.difficulty;
    
    const maxSkillLevel = Math.max(
      ...Array.from(context.userProgress.skillLevels.values()).map(skill => skill.currentLevel),
      1
    );
    
    if (maxSkillLevel >= 4) return 'expert';
    if (maxSkillLevel >= 3) return 'advanced';
    if (maxSkillLevel >= 2) return 'intermediate';
    return 'beginner';
  }

  private static calculateTotalUserPoints(userProgress: UserProgress): number {
    // This would typically sum up all points from user's history
    // For now, we'll estimate based on skill levels and experience
    return Array.from(userProgress.skillLevels.values())
      .reduce((total, skill) => total + skill.experiencePoints, 0);
  }

  private static createBaseBadgeStructure(badgeName: string, badgeConfig: any, context: BadgeAwardContext): BadgeAward {
    const rarityCalculation = this.calculateBadgeRarity(badgeConfig, context, []);
    
    return {
      badgeId: `badge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      badgeName,
      badgeType: {
        category: badgeConfig.category,
        subcategory: badgeConfig.subcategory
      },
      rarity: {
        level: rarityCalculation.rarityLevel,
        rarityScore: rarityCalculation.finalRarity,
        estimatedHolders: this.estimateBadgeHolders(rarityCalculation.rarityLevel),
        globalPercentage: this.calculateGlobalPercentage(this.estimateBadgeHolders(rarityCalculation.rarityLevel))
      },
      description: this.generateBadgeDescription(badgeName, badgeConfig, context),
      criteria: badgeConfig.criteria,
      awardedAt: new Date(),
      verificationStatus: 'pending',
      metadata: {
        skillsValidated: this.extractValidatedSkills(context),
        codeQualityScore: context.aiAnalysis?.codeQuality || 0,
        difficultyLevel: this.determineDifficultyLevel(context),
        validationCriteria: []
      }
    };
  }

  private static generateMilestones(achievementId: string, targetProgress: number): Milestone[] {
    const milestonePercentages = [25, 50, 75, 90, 100];
    
    return milestonePercentages.map((percentage, index) => ({
      milestoneId: `${achievementId}_milestone_${index + 1}`,
      name: `${percentage}% Progress`,
      description: `Reach ${percentage}% completion`,
      targetValue: Math.round((percentage / 100) * targetProgress),
      currentValue: 0,
      isCompleted: false,
      reward: percentage === 100 ? {
        type: 'badge',
        value: achievementId,
        description: 'Achievement completion badge'
      } : {
        type: 'points',
        value: percentage * 2,
        description: `Milestone bonus points`
      }
    }));
  }

  private static estimateAchievementCompletion(
    currentProgress: number,
    targetProgress: number,
    userId: string
  ): Date | undefined {
    if (currentProgress >= targetProgress) return undefined;
    
    // Simple estimation based on current progress
    const remainingProgress = targetProgress - currentProgress;
    const estimatedDays = Math.ceil(remainingProgress / 10); // Assume 10 progress units per day
    
    const estimatedDate = new Date();
    estimatedDate.setDate(estimatedDate.getDate() + estimatedDays);
    
    return estimatedDate;
  }
}