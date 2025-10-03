// Community Service for Peer Review System
// Handles contribution tracking, badge awarding, and community engagement

import { 
  CommunityContribution, 
  PeerReview, 
  ReviewerProfile,
  ReviewerBadge,
  CommunityImpact,
  ContributionRecognition
} from '@/types/peer-review';
import { PeerReviewService } from '@/lib/firebase/peer-review';
import { AIIntegrationService } from './ai-integration-service';

export class CommunityService {
  /**
   * Records a community contribution when a peer review is completed
   */
  static async recordPeerReviewContribution(
    peerReview: PeerReview,
    reviewerProfile?: ReviewerProfile
  ): Promise<string> {
    try {
      const impact = await this.calculateReviewImpact(peerReview);
      const recognition = this.calculateRecognition(peerReview, impact);
      
      const contribution: CommunityContribution = {
        contributionId: `contribution_${Date.now()}_${peerReview.reviewerId}`,
        userId: peerReview.reviewerId,
        type: 'review',
        title: `Code Review: ${this.generateReviewTitle(peerReview)}`,
        description: this.generateReviewDescription(peerReview),
        impact,
        recognition,
        createdAt: new Date()
      };

      const contributionId = await PeerReviewService.recordCommunityContribution(contribution);
      
      // Update reviewer profile with new stats
      if (reviewerProfile) {
        await this.updateReviewerStats(reviewerProfile, peerReview, recognition);
      }
      
      // Check for badge eligibility
      await this.checkAndAwardBadges(peerReview.reviewerId, contribution);
      
      return contributionId;
    } catch (error) {
      console.error('Error recording peer review contribution:', error);
      throw error;
    }
  }

  /**
   * Records mentorship contribution
   */
  static async recordMentorshipContribution(
    mentorId: string,
    menteeId: string,
    sessionDetails: {
      duration: number;
      skillsDiscussed: string[];
      improvementAreas: string[];
      followUpActions: string[];
    }
  ): Promise<string> {
    try {
      const impact: CommunityImpact = {
        helpfulnessVotes: 0,
        learnersBenefited: 1,
        skillsImproved: sessionDetails.skillsDiscussed,
        followUpEngagement: sessionDetails.followUpActions.length,
        communityReach: 1
      };

      const recognition: ContributionRecognition = {
        points: Math.min(20, sessionDetails.duration * 0.5 + sessionDetails.skillsDiscussed.length * 2),
        badges: [],
        publicRecognition: true,
        featuredContribution: sessionDetails.duration > 60,
        mentorshipOpportunities: 1
      };

      const contribution: CommunityContribution = {
        contributionId: `mentorship_${Date.now()}_${mentorId}`,
        userId: mentorId,
        type: 'mentorship',
        title: `Mentorship Session: ${sessionDetails.skillsDiscussed.join(', ')}`,
        description: `Provided ${sessionDetails.duration} minutes of mentorship covering ${sessionDetails.skillsDiscussed.length} skills`,
        impact,
        recognition,
        createdAt: new Date()
      };

      const contributionId = await PeerReviewService.recordCommunityContribution(contribution);
      
      // Check for mentorship badges
      await this.checkMentorshipBadges(mentorId);
      
      return contributionId;
    } catch (error) {
      console.error('Error recording mentorship contribution:', error);
      throw error;
    }
  }

  /**
   * Records collaboration contribution
   */
  static async recordCollaborationContribution(
    participants: string[],
    collaborationDetails: {
      sessionId: string;
      duration: number;
      codeShared: boolean;
      problemsSolved: number;
      skillsExchanged: string[];
    }
  ): Promise<string[]> {
    try {
      const contributionIds: string[] = [];
      
      for (const participantId of participants) {
        const impact: CommunityImpact = {
          helpfulnessVotes: 0,
          learnersBenefited: participants.length - 1,
          skillsImproved: collaborationDetails.skillsExchanged,
          followUpEngagement: collaborationDetails.problemsSolved,
          communityReach: participants.length
        };

        const recognition: ContributionRecognition = {
          points: Math.min(15, collaborationDetails.duration * 0.3 + collaborationDetails.problemsSolved * 3),
          badges: [],
          publicRecognition: true,
          featuredContribution: collaborationDetails.duration > 90,
          mentorshipOpportunities: 0
        };

        const contribution: CommunityContribution = {
          contributionId: `collaboration_${Date.now()}_${participantId}`,
          userId: participantId,
          type: 'collaboration',
          title: `Collaborative Session: ${collaborationDetails.skillsExchanged.join(', ')}`,
          description: `Participated in ${collaborationDetails.duration} minute collaborative coding session`,
          impact,
          recognition,
          createdAt: new Date()
        };

        const contributionId = await PeerReviewService.recordCommunityContribution(contribution);
        contributionIds.push(contributionId);
      }
      
      // Check for collaboration badges for all participants
      for (const participantId of participants) {
        await this.checkCollaborationBadges(participantId);
      }
      
      return contributionIds;
    } catch (error) {
      console.error('Error recording collaboration contribution:', error);
      throw error;
    }
  }

  /**
   * Calculates the impact of a peer review
   */
  private static async calculateReviewImpact(peerReview: PeerReview): Promise<CommunityImpact> {
    // Analyze feedback quality using AI
    const qualityAnalysis = await AIIntegrationService.analyzePeerFeedbackQuality(peerReview);
    
    return {
      helpfulnessVotes: 0, // Will be updated as users vote
      learnersBenefited: 1, // The reviewee
      skillsImproved: this.extractSkillsFromReview(peerReview),
      followUpEngagement: peerReview.suggestions.length,
      communityReach: peerReview.visibility === 'public' ? 10 : peerReview.visibility === 'community' ? 5 : 1
    };
  }

  /**
   * Calculates recognition points and badges for a contribution
   */
  private static calculateRecognition(
    peerReview: PeerReview,
    impact: CommunityImpact
  ): ContributionRecognition {
    let points = 0;
    
    // Base points for completing a review
    points += 5;
    
    // Points for quality feedback
    points += peerReview.feedback.strengths.length * 1;
    points += peerReview.feedback.improvementAreas.length * 2;
    points += peerReview.suggestions.length * 3;
    
    // Bonus for comprehensive feedback
    if (peerReview.feedback.generalComments.length > 100) points += 3;
    if (peerReview.feedback.encouragement.length > 50) points += 2;
    
    // Bonus for detailed code quality assessment
    const qualityRatings = [
      peerReview.feedback.codeQuality.readability,
      peerReview.feedback.codeQuality.efficiency,
      peerReview.feedback.codeQuality.maintainability,
      peerReview.feedback.codeQuality.testability
    ];
    const avgQualityRating = qualityRatings.reduce((sum, rating) => sum + rating, 0) / qualityRatings.length;
    if (avgQualityRating >= 4) points += 2;
    
    // Visibility bonus
    if (peerReview.visibility === 'public') points += 2;
    else if (peerReview.visibility === 'community') points += 1;
    
    return {
      points: Math.min(25, points), // Cap at 25 points per review
      badges: [],
      publicRecognition: peerReview.visibility !== 'private',
      featuredContribution: points >= 20,
      mentorshipOpportunities: peerReview.suggestions.length >= 3 ? 1 : 0
    };
  }

  /**
   * Extracts skills being improved from a peer review
   */
  private static extractSkillsFromReview(peerReview: PeerReview): string[] {
    const skills = new Set<string>();
    
    // Extract from improvement areas
    peerReview.feedback.improvementAreas.forEach(area => {
      if (area.toLowerCase().includes('javascript')) skills.add('JavaScript');
      if (area.toLowerCase().includes('typescript')) skills.add('TypeScript');
      if (area.toLowerCase().includes('react')) skills.add('React');
      if (area.toLowerCase().includes('algorithm')) skills.add('Algorithm Design');
      if (area.toLowerCase().includes('performance')) skills.add('Performance');
      if (area.toLowerCase().includes('security')) skills.add('Security');
      if (area.toLowerCase().includes('testing')) skills.add('Testing');
      if (area.toLowerCase().includes('clean code')) skills.add('Clean Code');
    });
    
    // Extract from code suggestions
    peerReview.suggestions.forEach(suggestion => {
      switch (suggestion.category) {
        case 'optimization': skills.add('Performance'); break;
        case 'security': skills.add('Security'); break;
        case 'best_practice': skills.add('Clean Code'); break;
        case 'style': skills.add('Code Style'); break;
      }
    });
    
    return Array.from(skills);
  }

  /**
   * Updates reviewer statistics after completing a review
   */
  private static async updateReviewerStats(
    profile: ReviewerProfile,
    peerReview: PeerReview,
    recognition: ContributionRecognition
  ): Promise<void> {
    try {
      const updatedStats = {
        ...profile.reviewStats,
        totalReviewsCompleted: profile.reviewStats.totalReviewsCompleted + 1,
        reviewsThisMonth: profile.reviewStats.reviewsThisMonth + 1,
        // Note: averageRating and helpfulnessScore would be updated based on reviewee feedback
      };

      const updatedReputation = {
        ...profile.reputation,
        points: profile.reputation.points + recognition.points
      };

      const updatedProfile: ReviewerProfile = {
        ...profile,
        reviewStats: updatedStats,
        reputation: updatedReputation
      };

      await PeerReviewService.createOrUpdateReviewerProfile(updatedProfile);
    } catch (error) {
      console.error('Error updating reviewer stats:', error);
    }
  }

  /**
   * Checks and awards badges based on contributions
   */
  private static async checkAndAwardBadges(
    userId: string,
    contribution: CommunityContribution
  ): Promise<void> {
    try {
      const contributions = await PeerReviewService.getUserContributions(userId);
      const profile = await PeerReviewService.getReviewerProfile(userId);
      
      if (!profile) return;

      const newBadges: ReviewerBadge[] = [];
      
      // First Review Badge
      if (contributions.length === 1 && contribution.type === 'review') {
        newBadges.push(this.createBadge('first_review', 'First Review', 'Completed your first peer review', 'common'));
      }
      
      // Review Milestone Badges
      const reviewCount = contributions.filter(c => c.type === 'review').length;
      if (reviewCount === 5) {
        newBadges.push(this.createBadge('reviewer_5', 'Helpful Reviewer', 'Completed 5 peer reviews', 'uncommon'));
      } else if (reviewCount === 25) {
        newBadges.push(this.createBadge('reviewer_25', 'Dedicated Reviewer', 'Completed 25 peer reviews', 'rare'));
      } else if (reviewCount === 100) {
        newBadges.push(this.createBadge('reviewer_100', 'Master Reviewer', 'Completed 100 peer reviews', 'epic'));
      }
      
      // Quality Badges
      const totalPoints = contributions.reduce((sum, c) => sum + c.recognition.points, 0);
      if (totalPoints >= 100 && !profile.reputation.badges.some(b => b.badgeId === 'quality_contributor')) {
        newBadges.push(this.createBadge('quality_contributor', 'Quality Contributor', 'Earned 100+ contribution points', 'rare'));
      }
      
      // Helpfulness Badge (based on community votes)
      const totalHelpfulness = contributions.reduce((sum, c) => sum + c.impact.helpfulnessVotes, 0);
      if (totalHelpfulness >= 50 && !profile.reputation.badges.some(b => b.badgeId === 'community_favorite')) {
        newBadges.push(this.createBadge('community_favorite', 'Community Favorite', 'Received 50+ helpfulness votes', 'epic'));
      }
      
      // Award new badges
      if (newBadges.length > 0) {
        const updatedProfile: ReviewerProfile = {
          ...profile,
          reputation: {
            ...profile.reputation,
            badges: [...profile.reputation.badges, ...newBadges]
          }
        };
        
        await PeerReviewService.createOrUpdateReviewerProfile(updatedProfile);
      }
    } catch (error) {
      console.error('Error checking and awarding badges:', error);
    }
  }

  /**
   * Checks for mentorship-specific badges
   */
  private static async checkMentorshipBadges(userId: string): Promise<void> {
    try {
      const contributions = await PeerReviewService.getUserContributions(userId);
      const profile = await PeerReviewService.getReviewerProfile(userId);
      
      if (!profile) return;

      const mentorshipContributions = contributions.filter(c => c.type === 'mentorship');
      const newBadges: ReviewerBadge[] = [];
      
      if (mentorshipContributions.length === 1) {
        newBadges.push(this.createBadge('first_mentor', 'First Mentor', 'Completed your first mentorship session', 'uncommon'));
      } else if (mentorshipContributions.length === 10) {
        newBadges.push(this.createBadge('dedicated_mentor', 'Dedicated Mentor', 'Completed 10 mentorship sessions', 'rare'));
      }
      
      if (newBadges.length > 0) {
        const updatedProfile: ReviewerProfile = {
          ...profile,
          reputation: {
            ...profile.reputation,
            badges: [...profile.reputation.badges, ...newBadges]
          }
        };
        
        await PeerReviewService.createOrUpdateReviewerProfile(updatedProfile);
      }
    } catch (error) {
      console.error('Error checking mentorship badges:', error);
    }
  }

  /**
   * Checks for collaboration-specific badges
   */
  private static async checkCollaborationBadges(userId: string): Promise<void> {
    try {
      const contributions = await PeerReviewService.getUserContributions(userId);
      const profile = await PeerReviewService.getReviewerProfile(userId);
      
      if (!profile) return;

      const collaborationContributions = contributions.filter(c => c.type === 'collaboration');
      const newBadges: ReviewerBadge[] = [];
      
      if (collaborationContributions.length === 1) {
        newBadges.push(this.createBadge('first_collaboration', 'Team Player', 'Participated in your first collaborative session', 'common'));
      } else if (collaborationContributions.length === 5) {
        newBadges.push(this.createBadge('collaborator', 'Active Collaborator', 'Participated in 5 collaborative sessions', 'uncommon'));
      }
      
      if (newBadges.length > 0) {
        const updatedProfile: ReviewerProfile = {
          ...profile,
          reputation: {
            ...profile.reputation,
            badges: [...profile.reputation.badges, ...newBadges]
          }
        };
        
        await PeerReviewService.createOrUpdateReviewerProfile(updatedProfile);
      }
    } catch (error) {
      console.error('Error checking collaboration badges:', error);
    }
  }

  /**
   * Creates a badge object
   */
  private static createBadge(
    id: string,
    name: string,
    description: string,
    rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
  ): ReviewerBadge {
    return {
      badgeId: id,
      name,
      description,
      iconUrl: `/badges/${id}.svg`,
      earnedAt: new Date(),
      category: 'community',
      rarity
    };
  }

  /**
   * Generates a title for a review contribution
   */
  private static generateReviewTitle(peerReview: PeerReview): string {
    const skillsCount = this.extractSkillsFromReview(peerReview).length;
    const suggestionsCount = peerReview.suggestions.length;
    
    if (suggestionsCount >= 5) {
      return 'Comprehensive Code Review';
    } else if (skillsCount >= 3) {
      return 'Multi-Skill Code Review';
    } else if (peerReview.feedback.encouragement.length > 50) {
      return 'Encouraging Code Review';
    } else {
      return 'Code Review';
    }
  }

  /**
   * Generates a description for a review contribution
   */
  private static generateReviewDescription(peerReview: PeerReview): string {
    const skills = this.extractSkillsFromReview(peerReview);
    const suggestionsCount = peerReview.suggestions.length;
    const strengthsCount = peerReview.feedback.strengths.length;
    const improvementsCount = peerReview.feedback.improvementAreas.length;
    
    let description = `Provided peer review with ${strengthsCount} strengths and ${improvementsCount} improvement areas`;
    
    if (suggestionsCount > 0) {
      description += `, including ${suggestionsCount} code suggestions`;
    }
    
    if (skills.length > 0) {
      description += `. Helped improve skills in: ${skills.join(', ')}`;
    }
    
    return description;
  }
}