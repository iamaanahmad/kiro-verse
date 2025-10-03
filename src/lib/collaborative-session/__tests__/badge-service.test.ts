import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CollaborativeBadgeService } from '../badge-service';
import { CollaborativeSession, SessionParticipant, SessionRecording } from '@/types/collaborative-session';
import { awardSkillBadge } from '@/ai/flows/award-skill-badge';

// Mock the badge awarding flow
vi.mock('@/ai/flows/award-skill-badge');

describe('CollaborativeBadgeService', () => {
  const mockParticipant: SessionParticipant = {
    userId: 'test-user-id',
    username: 'Test User',
    role: 'participant',
    joinedAt: new Date(),
    isActive: true,
    canEdit: true,
    canSuggest: true,
    canComment: true,
    isTyping: false,
    lastActivity: new Date(),
    linesAdded: 60,
    linesModified: 25,
    suggestionsGiven: 5,
    helpfulnessScore: 4.2
  };

  const mockSession: CollaborativeSession = {
    sessionId: 'test-session-id',
    hostId: 'host-user-id',
    participants: [mockParticipant],
    title: 'Test Session',
    description: 'Test collaborative session',
    status: 'completed',
    maxParticipants: 5,
    isPublic: true,
    requiresApproval: false,
    skillLevel: 'intermediate',
    focusAreas: ['javascript', 'react'],
    sharedCode: {
      content: 'test code',
      language: 'javascript',
      version: 1,
      lastModifiedBy: 'test-user-id',
      lastModifiedAt: new Date(),
      operations: [],
      syntaxErrors: [],
      formattingApplied: false
    },
    codeHistory: [],
    aiMentorEnabled: true,
    aiSuggestions: [],
    realTimeInsights: [],
    createdAt: new Date(),
    duration: 90, // 1.5 hours
    isRecorded: true,
    timestampedEvents: [],
    voiceEnabled: false,
    screenSharingEnabled: false,
    whiteboardEnabled: false
  };

  const mockRecording: SessionRecording = {
    recordingId: 'test-recording-id',
    sessionId: 'test-session-id',
    title: 'Test Recording',
    events: [],
    finalCode: 'final test code',
    duration: 90,
    keyMoments: [],
    learningOutcomes: [
      'Learned React hooks',
      'Improved JavaScript skills',
      'Better understanding of async/await',
      'Enhanced debugging techniques'
    ],
    skillsImproved: ['react', 'javascript', 'debugging'],
    collaborationInsights: [],
    createdAt: new Date(),
    isPublic: false,
    viewCount: 0,
    allowedViewers: [],
    requiresAuthentication: true
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(awardSkillBadge).mockResolvedValue({
      success: true,
      badgeId: 'test-badge-id',
      transactionHash: 'test-tx-hash',
      message: 'Badge awarded successfully'
    });
  });

  describe('analyzeSessionForBadges', () => {
    it('should identify collaboration badges for active contributors', async () => {
      const badgeOpportunities = await CollaborativeBadgeService.analyzeSessionForBadges(mockSession);
      
      expect(badgeOpportunities.has('test-user-id')).toBe(true);
      
      const userBadges = badgeOpportunities.get('test-user-id')!;
      expect(userBadges.length).toBeGreaterThan(0);
      
      // Should get contributor badge for high line count
      const contributorBadge = userBadges.find(b => b.type === 'contribution');
      expect(contributorBadge).toBeDefined();
      expect(contributorBadge?.title).toBe('Active Contributor');
    });

    it('should award mentorship badges for helpful participants', async () => {
      const helpfulParticipant = {
        ...mockParticipant,
        suggestionsGiven: 5,
        helpfulnessScore: 4.5
      };

      const sessionWithMentor = {
        ...mockSession,
        participants: [helpfulParticipant]
      };

      const badgeOpportunities = await CollaborativeBadgeService.analyzeSessionForBadges(sessionWithMentor);
      const userBadges = badgeOpportunities.get('test-user-id')!;
      
      const mentorBadge = userBadges.find(b => b.type === 'mentorship');
      expect(mentorBadge).toBeDefined();
      expect(mentorBadge?.title).toBe('Collaborative Mentor');
      expect(mentorBadge?.rarity).toBe('uncommon');
    });

    it('should award leadership badges for session hosts', async () => {
      const hostParticipant = {
        ...mockParticipant,
        role: 'host' as const
      };

      const sessionWithMultipleParticipants = {
        ...mockSession,
        hostId: 'test-user-id',
        participants: [
          hostParticipant,
          { ...mockParticipant, userId: 'user-2', username: 'User 2' },
          { ...mockParticipant, userId: 'user-3', username: 'User 3' }
        ]
      };

      const badgeOpportunities = await CollaborativeBadgeService.analyzeSessionForBadges(sessionWithMultipleParticipants);
      const userBadges = badgeOpportunities.get('test-user-id')!;
      
      const leaderBadge = userBadges.find(b => b.type === 'leadership');
      expect(leaderBadge).toBeDefined();
      expect(leaderBadge?.title).toBe('Session Leader');
      expect(leaderBadge?.rarity).toBe('rare');
    });

    it('should award learning badges based on recording outcomes', async () => {
      const badgeOpportunities = await CollaborativeBadgeService.analyzeSessionForBadges(mockSession, mockRecording);
      const userBadges = badgeOpportunities.get('test-user-id')!;
      
      const learningBadge = userBadges.find(b => b.type === 'learning');
      expect(learningBadge).toBeDefined();
      expect(learningBadge?.title).toBe('Collaborative Learner');
      expect(learningBadge?.skillsRecognized).toEqual(['react', 'javascript', 'debugging']);
    });

    it('should award marathon badges for long sessions with high quality', async () => {
      const marathonParticipant = {
        ...mockParticipant,
        helpfulnessScore: 4.7
      };

      const longSession = {
        ...mockSession,
        duration: 150, // 2.5 hours
        participants: [marathonParticipant]
      };

      const badgeOpportunities = await CollaborativeBadgeService.analyzeSessionForBadges(longSession);
      const userBadges = badgeOpportunities.get('test-user-id')!;
      
      const marathonBadge = userBadges.find(b => b.title === 'Collaboration Marathon');
      expect(marathonBadge).toBeDefined();
      expect(marathonBadge?.rarity).toBe('epic');
    });
  });

  describe('awardSessionBadges', () => {
    it('should successfully award badges to participants', async () => {
      const awardedBadges = await CollaborativeBadgeService.awardSessionBadges(mockSession, mockRecording);
      
      expect(awardedBadges.has('test-user-id')).toBe(true);
      expect(awardSkillBadge).toHaveBeenCalled();
      
      const userBadges = awardedBadges.get('test-user-id')!;
      expect(userBadges.length).toBeGreaterThan(0);
    });

    it('should handle badge awarding failures gracefully', async () => {
      vi.mocked(awardSkillBadge).mockRejectedValue(new Error('Badge awarding failed'));
      
      const awardedBadges = await CollaborativeBadgeService.awardSessionBadges(mockSession);
      
      // Should not throw error, but return empty results
      expect(awardedBadges.size).toBe(0);
    });
  });

  describe('calculateCollaborationScore', () => {
    it('should calculate correct collaboration score', () => {
      const score = CollaborativeBadgeService.calculateCollaborationScore(mockParticipant, mockSession);
      
      // Base participation: 20
      // Lines added (60 * 0.5 = 30, capped at 30): 30
      // Lines modified (25 * 0.3 = 7.5): 7.5
      // Helpfulness (4.2 * 10): 42
      // Suggestions (5 * 5 = 25, capped at 25): 25
      // Session duration (1.5 * 5 = 7.5): 7.5
      // Total: ~132, capped at 100
      
      expect(score).toBe(100);
    });

    it('should give host bonus', () => {
      const hostParticipant = {
        ...mockParticipant,
        role: 'host' as const,
        linesAdded: 0,
        linesModified: 0,
        suggestionsGiven: 0,
        helpfulnessScore: 0
      };

      const shortSession = {
        ...mockSession,
        duration: 0
      };

      const score = CollaborativeBadgeService.calculateCollaborationScore(hostParticipant, shortSession);
      
      // Base participation: 20 + Host bonus: 10 = 30
      expect(score).toBe(30);
    });

    it('should handle inactive participants', () => {
      const inactiveParticipant = {
        ...mockParticipant,
        isActive: false,
        linesAdded: 0,
        linesModified: 0,
        suggestionsGiven: 0,
        helpfulnessScore: 0
      };

      const score = CollaborativeBadgeService.calculateCollaborationScore(inactiveParticipant, mockSession);
      
      // Only session duration bonus: 1.5 * 5 = 7.5
      expect(score).toBe(8);
    });
  });

  describe('getBadgeRequirements', () => {
    it('should return all available badge requirements', () => {
      const requirements = CollaborativeBadgeService.getBadgeRequirements();
      
      expect(requirements.length).toBeGreaterThan(0);
      expect(requirements.every(req => req.badgeId && req.title && req.description)).toBe(true);
      
      const badgeTypes = requirements.map(req => req.type);
      expect(badgeTypes).toContain('mentorship');
      expect(badgeTypes).toContain('leadership');
      expect(badgeTypes).toContain('contribution');
      expect(badgeTypes).toContain('learning');
      expect(badgeTypes).toContain('collaboration');
    });

    it('should have proper rarity distribution', () => {
      const requirements = CollaborativeBadgeService.getBadgeRequirements();
      
      const rarities = requirements.map(req => req.rarity);
      expect(rarities).toContain('common');
      expect(rarities).toContain('uncommon');
      expect(rarities).toContain('rare');
      expect(rarities).toContain('epic');
    });
  });
});