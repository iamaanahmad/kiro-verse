// Collaborative Session Badge Awarding Service

import { 
  CollaborativeSession, 
  SessionParticipant, 
  SessionRecording 
} from '@/types/collaborative-session';
import { awardSkillBadge } from '@/ai/flows/award-skill-badge';

export interface CollaborativeBadge {
  badgeId: string;
  type: 'collaboration' | 'mentorship' | 'leadership' | 'learning' | 'contribution';
  title: string;
  description: string;
  criteria: string[];
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  skillsRecognized: string[];
  collaborationMetrics: {
    participantsHelped: number;
    knowledgeShared: number;
    problemsSolved: number;
    sessionDuration: number;
  };
}

export class CollaborativeBadgeService {
  // Analyze session for badge opportunities
  static async analyzeSessionForBadges(
    session: CollaborativeSession,
    recording?: SessionRecording
  ): Promise<Map<string, CollaborativeBadge[]>> {
    const badgeOpportunities = new Map<string, CollaborativeBadge[]>();

    for (const participant of session.participants) {
      const badges = await this.evaluateParticipantForBadges(participant, session, recording);
      if (badges.length > 0) {
        badgeOpportunities.set(participant.userId, badges);
      }
    }

    return badgeOpportunities;
  }

  // Evaluate individual participant for badges
  private static async evaluateParticipantForBadges(
    participant: SessionParticipant,
    session: CollaborativeSession,
    recording?: SessionRecording
  ): Promise<CollaborativeBadge[]> {
    const badges: CollaborativeBadge[] = [];

    // Collaboration badges
    if (participant.suggestionsGiven >= 3 && participant.helpfulnessScore >= 4) {
      badges.push({
        badgeId: `collab-mentor-${Date.now()}`,
        type: 'mentorship',
        title: 'Collaborative Mentor',
        description: 'Provided helpful guidance and suggestions to fellow developers',
        criteria: [
          'Gave 3+ helpful suggestions',
          'Maintained helpfulness score of 4+',
          'Actively participated in collaborative session'
        ],
        rarity: 'uncommon',
        skillsRecognized: ['mentorship', 'collaboration', 'communication'],
        collaborationMetrics: {
          participantsHelped: session.participants.length - 1,
          knowledgeShared: participant.suggestionsGiven,
          problemsSolved: Math.floor(participant.suggestionsGiven / 2),
          sessionDuration: session.duration || 0
        }
      });
    }

    // Leadership badges
    if (participant.role === 'host' && session.participants.length >= 3) {
      badges.push({
        badgeId: `collab-leader-${Date.now()}`,
        type: 'leadership',
        title: 'Session Leader',
        description: 'Successfully led a collaborative coding session with multiple participants',
        criteria: [
          'Hosted session with 3+ participants',
          'Maintained active engagement',
          'Facilitated collaborative learning'
        ],
        rarity: 'rare',
        skillsRecognized: ['leadership', 'facilitation', 'project-management'],
        collaborationMetrics: {
          participantsHelped: session.participants.length - 1,
          knowledgeShared: 0,
          problemsSolved: 0,
          sessionDuration: session.duration || 0
        }
      });
    }

    // Contribution badges
    if (participant.linesAdded >= 50 || participant.linesModified >= 30) {
      badges.push({
        badgeId: `collab-contributor-${Date.now()}`,
        type: 'contribution',
        title: 'Active Contributor',
        description: 'Made significant code contributions during collaborative session',
        criteria: [
          'Added 50+ lines of code OR modified 30+ lines',
          'Participated actively in session',
          'Contributed to shared codebase'
        ],
        rarity: 'common',
        skillsRecognized: ['coding', 'collaboration', 'productivity'],
        collaborationMetrics: {
          participantsHelped: 0,
          knowledgeShared: participant.linesAdded + participant.linesModified,
          problemsSolved: 1,
          sessionDuration: session.duration || 0
        }
      });
    }

    // Learning badges
    if (recording && recording.learningOutcomes.length >= 3) {
      badges.push({
        badgeId: `collab-learner-${Date.now()}`,
        type: 'learning',
        title: 'Collaborative Learner',
        description: 'Demonstrated significant learning and skill development through collaboration',
        criteria: [
          'Achieved 3+ learning outcomes',
          'Engaged in peer learning',
          'Applied feedback and suggestions'
        ],
        rarity: 'uncommon',
        skillsRecognized: recording.skillsImproved,
        collaborationMetrics: {
          participantsHelped: 0,
          knowledgeShared: 0,
          problemsSolved: recording.learningOutcomes.length,
          sessionDuration: session.duration || 0
        }
      });
    }

    // Special collaboration badges based on session metrics
    const sessionDurationHours = (session.duration || 0) / 60;
    if (sessionDurationHours >= 2 && participant.helpfulnessScore >= 4.5) {
      badges.push({
        badgeId: `collab-marathon-${Date.now()}`,
        type: 'collaboration',
        title: 'Collaboration Marathon',
        description: 'Maintained high-quality collaboration for an extended session',
        criteria: [
          'Participated in 2+ hour session',
          'Maintained helpfulness score of 4.5+',
          'Consistent engagement throughout'
        ],
        rarity: 'epic',
        skillsRecognized: ['endurance', 'collaboration', 'consistency'],
        collaborationMetrics: {
          participantsHelped: session.participants.length - 1,
          knowledgeShared: participant.suggestionsGiven,
          problemsSolved: Math.floor(participant.suggestionsGiven / 2),
          sessionDuration: session.duration || 0
        }
      });
    }

    return badges;
  }

  // Award badges to session participants
  static async awardSessionBadges(
    session: CollaborativeSession,
    recording?: SessionRecording
  ): Promise<Map<string, string[]>> {
    const awardedBadges = new Map<string, string[]>();

    try {
      const badgeOpportunities = await this.analyzeSessionForBadges(session, recording);

      for (const [userId, badges] of badgeOpportunities) {
        const userBadges: string[] = [];

        for (const badge of badges) {
          try {
            // Use existing badge awarding system
            const result = await awardSkillBadge({
              userId,
              skillName: badge.title,
              skillLevel: this.mapRarityToLevel(badge.rarity),
              evidence: {
                type: 'collaborative_session',
                sessionId: session.sessionId,
                description: badge.description,
                criteria: badge.criteria,
                collaborationMetrics: badge.collaborationMetrics,
                skillsRecognized: badge.skillsRecognized,
                timestamp: new Date().toISOString()
              },
              context: `Earned through collaborative coding session: ${session.title}`
            });

            if (result.success) {
              userBadges.push(badge.badgeId);
            }
          } catch (error) {
            console.error(`Error awarding badge ${badge.badgeId} to user ${userId}:`, error);
          }
        }

        if (userBadges.length > 0) {
          awardedBadges.set(userId, userBadges);
        }
      }
    } catch (error) {
      console.error('Error awarding session badges:', error);
    }

    return awardedBadges;
  }

  // Map badge rarity to skill level
  private static mapRarityToLevel(rarity: string): string {
    switch (rarity) {
      case 'common': return 'beginner';
      case 'uncommon': return 'intermediate';
      case 'rare': return 'advanced';
      case 'epic': return 'expert';
      case 'legendary': return 'master';
      default: return 'intermediate';
    }
  }

  // Get badge requirements for display
  static getBadgeRequirements(): CollaborativeBadge[] {
    return [
      {
        badgeId: 'collab-mentor',
        type: 'mentorship',
        title: 'Collaborative Mentor',
        description: 'Help fellow developers with helpful suggestions and guidance',
        criteria: [
          'Give 3+ helpful suggestions in a session',
          'Maintain helpfulness score of 4+',
          'Actively participate in collaborative sessions'
        ],
        rarity: 'uncommon',
        skillsRecognized: ['mentorship', 'collaboration', 'communication'],
        collaborationMetrics: {
          participantsHelped: 0,
          knowledgeShared: 3,
          problemsSolved: 0,
          sessionDuration: 0
        }
      },
      {
        badgeId: 'collab-leader',
        type: 'leadership',
        title: 'Session Leader',
        description: 'Successfully lead collaborative coding sessions',
        criteria: [
          'Host session with 3+ participants',
          'Maintain active engagement',
          'Facilitate collaborative learning'
        ],
        rarity: 'rare',
        skillsRecognized: ['leadership', 'facilitation', 'project-management'],
        collaborationMetrics: {
          participantsHelped: 3,
          knowledgeShared: 0,
          problemsSolved: 0,
          sessionDuration: 0
        }
      },
      {
        badgeId: 'collab-contributor',
        type: 'contribution',
        title: 'Active Contributor',
        description: 'Make significant code contributions during sessions',
        criteria: [
          'Add 50+ lines of code OR modify 30+ lines',
          'Participate actively in session',
          'Contribute to shared codebase'
        ],
        rarity: 'common',
        skillsRecognized: ['coding', 'collaboration', 'productivity'],
        collaborationMetrics: {
          participantsHelped: 0,
          knowledgeShared: 50,
          problemsSolved: 1,
          sessionDuration: 0
        }
      },
      {
        badgeId: 'collab-learner',
        type: 'learning',
        title: 'Collaborative Learner',
        description: 'Demonstrate learning and skill development through collaboration',
        criteria: [
          'Achieve 3+ learning outcomes',
          'Engage in peer learning',
          'Apply feedback and suggestions'
        ],
        rarity: 'uncommon',
        skillsRecognized: ['learning', 'adaptability', 'growth-mindset'],
        collaborationMetrics: {
          participantsHelped: 0,
          knowledgeShared: 0,
          problemsSolved: 3,
          sessionDuration: 0
        }
      },
      {
        badgeId: 'collab-marathon',
        type: 'collaboration',
        title: 'Collaboration Marathon',
        description: 'Maintain high-quality collaboration for extended sessions',
        criteria: [
          'Participate in 2+ hour session',
          'Maintain helpfulness score of 4.5+',
          'Consistent engagement throughout'
        ],
        rarity: 'epic',
        skillsRecognized: ['endurance', 'collaboration', 'consistency'],
        collaborationMetrics: {
          participantsHelped: 0,
          knowledgeShared: 0,
          problemsSolved: 0,
          sessionDuration: 120
        }
      }
    ];
  }

  // Calculate collaboration score for a participant
  static calculateCollaborationScore(participant: SessionParticipant, session: CollaborativeSession): number {
    let score = 0;

    // Base participation score
    score += participant.isActive ? 20 : 0;

    // Contribution score
    score += Math.min(participant.linesAdded * 0.5, 30);
    score += Math.min(participant.linesModified * 0.3, 20);

    // Helpfulness score
    score += participant.helpfulnessScore * 10;

    // Suggestion score
    score += Math.min(participant.suggestionsGiven * 5, 25);

    // Role bonus
    if (participant.role === 'host') score += 10;

    // Session duration bonus
    const sessionHours = (session.duration || 0) / 60;
    score += Math.min(sessionHours * 5, 15);

    return Math.min(Math.round(score), 100);
  }
}