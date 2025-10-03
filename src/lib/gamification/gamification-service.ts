/**
 * @fileOverview Gamification service that integrates points and badge systems
 * 
 * This service provides a unified interface for:
 * - Points calculation and tracking
 * - Badge awarding and verification
 * - Achievement progress monitoring
 * - Integration with existing blockchain badge system
 */

import { 
  PointsCalculation, 
  BadgeAward, 
  AchievementProgress,
  BadgeAwardContext,
  BadgeEligibilityResult
} from '@/types/gamification';
import { 
  AIAnalysisResult, 
  UserProgress, 
  Challenge, 
  ChallengeSubmission 
} from '@/types/analytics';
import { PointsCalculator } from './points-calculator';
import { BadgeCalculator } from './badge-calculator';
import { UserProgressService } from '@/lib/firebase/analytics';
import { awardSkillBadge } from '@/ai/flows/award-skill-badge';

export interface GamificationResult {
  pointsEarned: PointsCalculation;
  badgesAwarded: BadgeAward[];
  achievementsUnlocked: string[];
  newMilestones: string[];
  totalPoints: number;
  rankChange?: {
    previousRank: number;
    newRank: number;
    direction: 'up' | 'down' | 'same';
  };
}

export interface CodeAnalysisGamification {
  userId: string;
  code: string;
  context?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  challengeId?: string;
  enableBlockchainVerification?: boolean;
}

export interface ChallengeCompletionGamification {
  userId: string;
  challenge: Challenge;
  submission: ChallengeSubmission;
  completionTime?: number;
  enableBlockchainVerification?: boolean;
}

export interface PeerReviewGamification {
  userId: string;
  reviewQuality: number;
  reviewLength: number;
  helpfulness: number;
  isFirstReview?: boolean;
}

export interface CommunityContributionGamification {
  userId: string;
  contributionType: 'bug_report' | 'feature_suggestion' | 'content_creation' | 'mentorship' | 'moderation';
  impact: 'low' | 'medium' | 'high';
  communityVotes?: number;
  isAccepted?: boolean;
}

export class GamificationService {
  /**
   * Processes gamification for code analysis submissions
   */
  static async processCodeAnalysisGamification(
    params: CodeAnalysisGamification
  ): Promise<GamificationResult> {
    const { userId, code, context, difficulty = 'intermediate', enableBlockchainVerification = true } = params;
    
    try {
      // Get user progress for context
      const userProgress = await UserProgressService.getUserProgress(userId);
      if (!userProgress) {
        throw new Error('User progress not found');
      }

      // Get AI analysis (this would typically come from the existing analytics flow)
      const aiAnalysisResult = await this.getAIAnalysis(code, context);
      
      // Calculate points for code submission
      const pointsEarned = PointsCalculator.calculateCodeSubmissionPoints(
        aiAnalysisResult,
        difficulty
      );

      // Create badge award context
      const badgeContext: BadgeAwardContext = {
        userId,
        userProgress,
        aiAnalysis: aiAnalysisResult,
        timeConstraints: {
          sessionDuration: Date.now() // Current timestamp for session tracking
        }
      };

      // Check for eligible badges
      const badgesAwarded = await this.evaluateAndAwardBadges(badgeContext, enableBlockchainVerification);
      
      // Update user points and progress
      const updatedProgress = await this.updateUserPoints(userId, pointsEarned.totalPoints);
      
      // Check for achievement unlocks
      const achievementsUnlocked = await this.checkAchievementUnlocks(userId, updatedProgress);
      
      // Check for new milestones
      const newMilestones = await this.checkMilestoneProgress(userId, pointsEarned.totalPoints);
      
      // Calculate rank change
      const rankChange = await this.calculateRankChange(userId, updatedProgress.totalPoints);

      return {
        pointsEarned,
        badgesAwarded,
        achievementsUnlocked,
        newMilestones,
        totalPoints: updatedProgress.totalPoints,
        rankChange
      };
    } catch (error) {
      console.error('Error processing code analysis gamification:', error);
      throw error;
    }
  }

  /**
   * Processes gamification for challenge completion
   */
  static async processChallengeCompletionGamification(
    params: ChallengeCompletionGamification
  ): Promise<GamificationResult> {
    const { userId, challenge, submission, completionTime, enableBlockchainVerification = true } = params;
    
    try {
      // Get user progress
      const userProgress = await UserProgressService.getUserProgress(userId);
      if (!userProgress) {
        throw new Error('User progress not found');
      }

      // Calculate points for challenge completion
      const pointsEarned = PointsCalculator.calculateChallengePoints(
        challenge,
        submission,
        completionTime
      );

      // Create badge award context
      const badgeContext: BadgeAwardContext = {
        userId,
        userProgress,
        challenge,
        submission,
        aiAnalysis: submission.aiAnalysis,
        timeConstraints: {
          submissionTime: completionTime,
          sessionDuration: completionTime
        }
      };

      // Evaluate challenge-specific badges
      const badgesAwarded = await this.evaluateChallengeSpecificBadges(
        badgeContext, 
        enableBlockchainVerification
      );
      
      // Update user progress
      const updatedProgress = await this.updateUserPoints(userId, pointsEarned.totalPoints);
      
      // Update challenge completion in user progress
      await this.updateChallengeCompletion(userId, challenge, submission);
      
      // Check achievements and milestones
      const achievementsUnlocked = await this.checkAchievementUnlocks(userId, updatedProgress);
      const newMilestones = await this.checkMilestoneProgress(userId, pointsEarned.totalPoints);
      const rankChange = await this.calculateRankChange(userId, updatedProgress.totalPoints);

      return {
        pointsEarned,
        badgesAwarded,
        achievementsUnlocked,
        newMilestones,
        totalPoints: updatedProgress.totalPoints,
        rankChange
      };
    } catch (error) {
      console.error('Error processing challenge completion gamification:', error);
      throw error;
    }
  }

  /**
   * Processes gamification for peer review activities
   */
  static async processPeerReviewGamification(
    params: PeerReviewGamification
  ): Promise<GamificationResult> {
    const { userId, reviewQuality, reviewLength, helpfulness, isFirstReview = false } = params;
    
    try {
      // Calculate points for peer review
      const pointsEarned = PointsCalculator.calculatePeerReviewPoints(
        reviewQuality,
        reviewLength,
        helpfulness,
        isFirstReview
      );

      // Get user progress
      const userProgress = await UserProgressService.getUserProgress(userId);
      if (!userProgress) {
        throw new Error('User progress not found');
      }

      // Create badge context for community badges
      const badgeContext: BadgeAwardContext = {
        userId,
        userProgress,
        peerReviewScore: reviewQuality
      };

      // Check for peer review badges
      const badgesAwarded = await this.evaluatePeerReviewBadges(badgeContext);
      
      // Update user progress
      const updatedProgress = await this.updateUserPoints(userId, pointsEarned.totalPoints);
      
      // Check achievements and milestones
      const achievementsUnlocked = await this.checkAchievementUnlocks(userId, updatedProgress);
      const newMilestones = await this.checkMilestoneProgress(userId, pointsEarned.totalPoints);
      const rankChange = await this.calculateRankChange(userId, updatedProgress.totalPoints);

      return {
        pointsEarned,
        badgesAwarded,
        achievementsUnlocked,
        newMilestones,
        totalPoints: updatedProgress.totalPoints,
        rankChange
      };
    } catch (error) {
      console.error('Error processing peer review gamification:', error);
      throw error;
    }
  }

  /**
   * Processes gamification for community contributions
   */
  static async processCommunityContributionGamification(
    params: CommunityContributionGamification
  ): Promise<GamificationResult> {
    const { userId, contributionType, impact, communityVotes = 0, isAccepted = false } = params;
    
    try {
      // Calculate points for community contribution
      const pointsEarned = PointsCalculator.calculateCommunityPoints(
        contributionType,
        impact,
        communityVotes,
        isAccepted
      );

      // Get user progress
      const userProgress = await UserProgressService.getUserProgress(userId);
      if (!userProgress) {
        throw new Error('User progress not found');
      }

      // Create community badge
      const communityBadge = BadgeCalculator.createCommunityBadge(
        this.getCommunityBadgeName(contributionType, impact),
        { userId, userProgress },
        contributionType,
        this.calculateImpactScore(impact, communityVotes, isAccepted),
        [] // Endorsements would be populated from actual data
      );

      const badgesAwarded = [communityBadge];
      
      // Update user progress
      const updatedProgress = await this.updateUserPoints(userId, pointsEarned.totalPoints);
      
      // Check achievements and milestones
      const achievementsUnlocked = await this.checkAchievementUnlocks(userId, updatedProgress);
      const newMilestones = await this.checkMilestoneProgress(userId, pointsEarned.totalPoints);
      const rankChange = await this.calculateRankChange(userId, updatedProgress.totalPoints);

      return {
        pointsEarned,
        badgesAwarded,
        achievementsUnlocked,
        newMilestones,
        totalPoints: updatedProgress.totalPoints,
        rankChange
      };
    } catch (error) {
      console.error('Error processing community contribution gamification:', error);
      throw error;
    }
  }

  /**
   * Calculates streak bonuses for consistent activity
   */
  static async processStreakBonus(
    userId: string,
    streakType: 'daily_coding' | 'challenge_completion' | 'peer_review',
    streakDays: number
  ): Promise<PointsCalculation> {
    return PointsCalculator.calculateStreakBonus(streakDays, streakType);
  }

  /**
   * Gets current user gamification status
   */
  static async getUserGamificationStatus(userId: string): Promise<{
    totalPoints: number;
    badgeCount: number;
    rareBadgeCount: number;
    currentRank: number;
    achievementsCompleted: number;
    currentStreaks: Record<string, number>;
    nextMilestones: string[];
  }> {
    try {
      const userProgress = await UserProgressService.getUserProgress(userId);
      if (!userProgress) {
        throw new Error('User progress not found');
      }

      // This would typically fetch from a dedicated gamification collection
      // For now, we'll calculate from available data
      const totalPoints = this.calculateTotalUserPoints(userProgress);
      const badgeCount = this.calculateUserBadgeCount(userProgress);
      const rareBadgeCount = this.calculateRareBadgeCount(userProgress);
      const currentRank = await this.calculateUserRank(userId, totalPoints);
      const achievementsCompleted = this.calculateCompletedAchievements(userProgress);
      const currentStreaks = await this.getCurrentStreaks(userId);
      const nextMilestones = await this.getNextMilestones(userId);

      return {
        totalPoints,
        badgeCount,
        rareBadgeCount,
        currentRank,
        achievementsCompleted,
        currentStreaks,
        nextMilestones
      };
    } catch (error) {
      console.error('Error getting user gamification status:', error);
      throw error;
    }
  }

  // Private helper methods

  private static async getAIAnalysis(code: string, context?: string): Promise<AIAnalysisResult> {
    // This would typically use the existing AI analysis flow
    // For now, we'll simulate the analysis
    return {
      analysisId: `analysis_${Date.now()}`,
      codeQuality: Math.floor(Math.random() * 40) + 60, // 60-100
      efficiency: Math.floor(Math.random() * 40) + 60,
      creativity: Math.floor(Math.random() * 40) + 60,
      bestPractices: Math.floor(Math.random() * 40) + 60,
      suggestions: ['Consider using more descriptive variable names'],
      detectedSkills: ['JavaScript', 'React'],
      improvementAreas: ['Error handling'],
      processingTime: 1500
    };
  }

  private static async evaluateAndAwardBadges(
    context: BadgeAwardContext,
    enableBlockchainVerification: boolean
  ): Promise<BadgeAward[]> {
    const badges: BadgeAward[] = [];
    
    // Check skill-based badges
    const skillBadges = ['JavaScript Fundamentals', 'React Hooks Expert', 'TypeScript Type Safety'];
    
    for (const badgeName of skillBadges) {
      const eligibility = await BadgeCalculator.evaluateBadgeEligibility(badgeName, context);
      
      if (eligibility.isEligible && eligibility.badgeAward) {
        badges.push(eligibility.badgeAward);
        
        // Integrate with existing blockchain badge system if enabled
        if (enableBlockchainVerification) {
          await this.integrateWithBlockchainBadgeSystem(
            context.userId,
            eligibility.badgeAward,
            context.aiAnalysis?.codeQuality || 0
          );
        }
      }
    }
    
    return badges;
  }

  private static async evaluateChallengeSpecificBadges(
    context: BadgeAwardContext,
    enableBlockchainVerification: boolean
  ): Promise<BadgeAward[]> {
    const badges: BadgeAward[] = [];
    
    // Check challenge-specific badges
    const challengeBadges = ['Challenge Conqueror', 'Speed Demon', 'Perfect Score'];
    
    for (const badgeName of challengeBadges) {
      const eligibility = await BadgeCalculator.evaluateBadgeEligibility(badgeName, context);
      
      if (eligibility.isEligible && eligibility.badgeAward) {
        badges.push(eligibility.badgeAward);
        
        if (enableBlockchainVerification) {
          await this.integrateWithBlockchainBadgeSystem(
            context.userId,
            eligibility.badgeAward,
            context.submission?.totalScore || 0
          );
        }
      }
    }
    
    return badges;
  }

  private static async evaluatePeerReviewBadges(context: BadgeAwardContext): Promise<BadgeAward[]> {
    const badges: BadgeAward[] = [];
    
    // Check peer review badges
    const reviewBadges = ['Helpful Reviewer', 'Mentor'];
    
    for (const badgeName of reviewBadges) {
      const eligibility = await BadgeCalculator.evaluateBadgeEligibility(badgeName, context);
      
      if (eligibility.isEligible && eligibility.badgeAward) {
        badges.push(eligibility.badgeAward);
      }
    }
    
    return badges;
  }

  private static async integrateWithBlockchainBadgeSystem(
    userId: string,
    badge: BadgeAward,
    qualityScore: number
  ): Promise<void> {
    try {
      // Use existing award-skill-badge flow for blockchain integration
      await awardSkillBadge({
        code: `// Badge awarded: ${badge.badgeName}`,
        userId,
        context: badge.description,
        enableAnalytics: false, // Avoid circular analytics
        previousSkillLevel: 0
      });
      
      // Update badge verification status
      badge.verificationStatus = 'verified';
      badge.blockchainTxHash = `tx_${Date.now()}`; // Would be actual transaction hash
    } catch (error) {
      console.error('Error integrating with blockchain badge system:', error);
      badge.verificationStatus = 'unverified';
    }
  }

  private static async updateUserPoints(userId: string, pointsToAdd: number): Promise<{ totalPoints: number }> {
    // This would update a dedicated points tracking system
    // For now, we'll simulate the update
    const currentPoints = Math.floor(Math.random() * 5000); // Simulated current points
    const totalPoints = currentPoints + pointsToAdd;
    
    return { totalPoints };
  }

  private static async updateChallengeCompletion(
    userId: string,
    challenge: Challenge,
    submission: ChallengeSubmission
  ): Promise<void> {
    // This would update the user's challenge completion record
    console.log(`Updated challenge completion for user ${userId}: ${challenge.challengeId}`);
  }

  private static async checkAchievementUnlocks(
    userId: string,
    updatedProgress: { totalPoints: number }
  ): Promise<string[]> {
    // This would check against achievement definitions
    const achievements: string[] = [];
    
    if (updatedProgress.totalPoints >= 1000) {
      achievements.push('Rising Star');
    }
    
    if (updatedProgress.totalPoints >= 10000) {
      achievements.push('Code Virtuoso');
    }
    
    return achievements;
  }

  private static async checkMilestoneProgress(userId: string, pointsEarned: number): Promise<string[]> {
    // This would check milestone progress
    const milestones: string[] = [];
    
    if (pointsEarned >= 100) {
      milestones.push('Century Club');
    }
    
    return milestones;
  }

  private static async calculateRankChange(
    userId: string,
    totalPoints: number
  ): Promise<{ previousRank: number; newRank: number; direction: 'up' | 'down' | 'same' }> {
    // This would calculate actual rank changes based on leaderboard
    const previousRank = Math.floor(Math.random() * 1000) + 1;
    const newRank = Math.max(1, previousRank - Math.floor(totalPoints / 100));
    
    let direction: 'up' | 'down' | 'same' = 'same';
    if (newRank < previousRank) direction = 'up';
    else if (newRank > previousRank) direction = 'down';
    
    return { previousRank, newRank, direction };
  }

  private static getCommunityBadgeName(
    contributionType: string,
    impact: string
  ): string {
    const badgeNames = {
      bug_report: 'Bug Hunter',
      feature_suggestion: 'Innovator',
      content_creation: 'Content Creator',
      mentorship: 'Mentor',
      moderation: 'Community Guardian'
    };
    
    return badgeNames[contributionType as keyof typeof badgeNames] || 'Community Contributor';
  }

  private static calculateImpactScore(
    impact: string,
    communityVotes: number,
    isAccepted: boolean
  ): number {
    const impactScores = { low: 25, medium: 50, high: 75 };
    let score = impactScores[impact as keyof typeof impactScores] || 25;
    
    score += communityVotes * 2;
    if (isAccepted) score += 25;
    
    return Math.min(100, score);
  }

  private static calculateTotalUserPoints(userProgress: UserProgress): number {
    return Array.from(userProgress.skillLevels.values())
      .reduce((total, skill) => total + skill.experiencePoints, 0);
  }

  private static calculateUserBadgeCount(userProgress: UserProgress): number {
    // This would count actual badges from user's collection
    return Array.from(userProgress.skillLevels.values()).length;
  }

  private static calculateRareBadgeCount(userProgress: UserProgress): number {
    // This would count rare badges specifically
    return Math.floor(this.calculateUserBadgeCount(userProgress) * 0.2);
  }

  private static async calculateUserRank(userId: string, totalPoints: number): Promise<number> {
    // This would calculate rank from leaderboard
    return Math.max(1, Math.floor(10000 / (totalPoints / 100 + 1)));
  }

  private static calculateCompletedAchievements(userProgress: UserProgress): number {
    // This would count completed achievements
    return Math.floor(Array.from(userProgress.skillLevels.values()).length / 2);
  }

  private static async getCurrentStreaks(userId: string): Promise<Record<string, number>> {
    // This would fetch current streak data
    return {
      daily_coding: Math.floor(Math.random() * 30),
      challenge_completion: Math.floor(Math.random() * 10),
      peer_review: Math.floor(Math.random() * 15)
    };
  }

  private static async getNextMilestones(userId: string): Promise<string[]> {
    // This would fetch next milestone targets
    return [
      'Complete 10 challenges',
      'Earn 5000 points',
      'Maintain 30-day coding streak'
    ];
  }
}