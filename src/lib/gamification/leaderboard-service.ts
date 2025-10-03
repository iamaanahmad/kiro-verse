/**
 * @fileOverview Leaderboard service for managing rankings and competitions
 * 
 * This service provides:
 * - Real-time leaderboard updates with privacy-preserving rankings
 * - Competition management for daily, weekly, and monthly challenges
 * - Participant tracking and result calculation
 * - Anonymized peer comparison features
 */

import { 
  LeaderboardEntry, 
  Competition, 
  CompetitionParticipant, 
  CompetitionPrize,
  CompetitionRule,
  CompetitionMetadata
} from '@/types/gamification';
import { UserProgress, Challenge } from '@/types/analytics';

export interface LeaderboardQuery {
  type: 'global' | 'skill_based' | 'competition' | 'peer_group';
  skillId?: string;
  competitionId?: string;
  timeframe?: 'daily' | 'weekly' | 'monthly' | 'all_time';
  limit?: number;
  includeAnonymized?: boolean;
  userLocation?: string; // For regional leaderboards
}

export interface LeaderboardResult {
  entries: LeaderboardEntry[];
  totalParticipants: number;
  userRank?: number;
  userEntry?: LeaderboardEntry;
  lastUpdated: Date;
  nextUpdate?: Date;
}

export interface CompetitionCreationParams {
  title: string;
  description: string;
  type: 'daily' | 'weekly' | 'monthly' | 'special' | 'seasonal';
  category: 'skill_based' | 'challenge_based' | 'community_based' | 'innovation';
  startDate: Date;
  endDate: Date;
  challenges: string[]; // Challenge IDs
  prizes: CompetitionPrize[];
  rules: CompetitionRule[];
  maxParticipants?: number;
  entryFee?: number;
  registrationDeadline?: Date;
  createdBy: string;
  sponsoredBy?: string;
}

export interface CompetitionUpdateParams {
  competitionId: string;
  participantId?: string;
  score?: number;
  submissionId?: string;
  achievementIds?: string[];
}

export class LeaderboardService {
  private static readonly ANONYMIZATION_THRESHOLD = 10; // Minimum participants for anonymization
  private static readonly UPDATE_INTERVALS = {
    real_time: 30000, // 30 seconds
    frequent: 300000, // 5 minutes
    standard: 900000, // 15 minutes
    daily: 86400000 // 24 hours
  };

  /**
   * Gets leaderboard entries based on query parameters
   */
  static async getLeaderboard(query: LeaderboardQuery): Promise<LeaderboardResult> {
    try {
      const entries = await this.fetchLeaderboardEntries(query);
      const totalParticipants = await this.getTotalParticipants(query);
      const userRank = await this.getUserRank(query, entries);
      const userEntry = entries.find(entry => !entry.isAnonymized);
      
      return {
        entries: this.applyPrivacyFilters(entries, query),
        totalParticipants,
        userRank,
        userEntry,
        lastUpdated: new Date(),
        nextUpdate: this.calculateNextUpdate(query.type)
      };
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      throw error;
    }
  }

  /**
   * Gets user's current rank across different leaderboards
   */
  static async getUserRanks(userId: string): Promise<{
    global: number;
    skillBased: Record<string, number>;
    competitions: Record<string, number>;
    peerGroup: number;
  }> {
    try {
      // Global rank
      const globalQuery: LeaderboardQuery = { type: 'global', limit: 1000 };
      const globalLeaderboard = await this.getLeaderboard(globalQuery);
      const globalRank = globalLeaderboard.userRank || 0;

      // Skill-based ranks
      const skillBased: Record<string, number> = {};
      const userSkills = await this.getUserSkills(userId);
      
      for (const skillId of userSkills) {
        const skillQuery: LeaderboardQuery = { type: 'skill_based', skillId, limit: 500 };
        const skillLeaderboard = await this.getLeaderboard(skillQuery);
        skillBased[skillId] = skillLeaderboard.userRank || 0;
      }

      // Competition ranks
      const competitions: Record<string, number> = {};
      const activeCompetitions = await this.getActiveCompetitions();
      
      for (const competition of activeCompetitions) {
        const participant = competition.participants.find(p => p.userId === userId);
        if (participant) {
          competitions[competition.competitionId] = participant.currentRank;
        }
      }

      // Peer group rank (users with similar experience level)
      const peerGroupQuery: LeaderboardQuery = { type: 'peer_group', limit: 100 };
      const peerGroupLeaderboard = await this.getLeaderboard(peerGroupQuery);
      const peerGroupRank = peerGroupLeaderboard.userRank || 0;

      return {
        global: globalRank,
        skillBased,
        competitions,
        peerGroup: peerGroupRank
      };
    } catch (error) {
      console.error('Error getting user ranks:', error);
      throw error;
    }
  }

  /**
   * Creates a new competition
   */
  static async createCompetition(params: CompetitionCreationParams): Promise<Competition> {
    try {
      const competitionId = `comp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const competition: Competition = {
        competitionId,
        title: params.title,
        description: params.description,
        type: params.type,
        category: params.category,
        startDate: params.startDate,
        endDate: params.endDate,
        registrationDeadline: params.registrationDeadline,
        maxParticipants: params.maxParticipants,
        entryFee: params.entryFee,
        prizes: params.prizes,
        rules: params.rules,
        participants: [],
        leaderboard: [],
        status: params.startDate > new Date() ? 'upcoming' : 'registration_open',
        createdBy: params.createdBy,
        sponsoredBy: params.sponsoredBy,
        metadata: {
          totalParticipants: 0,
          averageScore: 0,
          topScore: 0,
          submissionsCount: 0,
          skillsTargeted: await this.extractSkillsFromChallenges(params.challenges),
          difficultyLevel: await this.calculateCompetitionDifficulty(params.challenges),
          estimatedDuration: await this.estimateCompetitionDuration(params.challenges)
        }
      };

      // Save competition to database
      await this.saveCompetition(competition);
      
      return competition;
    } catch (error) {
      console.error('Error creating competition:', error);
      throw error;
    }
  }

  /**
   * Registers a user for a competition
   */
  static async registerForCompetition(
    competitionId: string, 
    userId: string, 
    username: string
  ): Promise<CompetitionParticipant> {
    try {
      const competition = await this.getCompetition(competitionId);
      
      if (!competition) {
        throw new Error('Competition not found');
      }

      // Validate registration eligibility
      await this.validateRegistrationEligibility(competition, userId);

      const participant: CompetitionParticipant = {
        userId,
        username,
        registeredAt: new Date(),
        currentScore: 0,
        currentRank: competition.participants.length + 1,
        submissionsCount: 0,
        qualificationStatus: 'qualified',
        achievements: []
      };

      // Add participant to competition
      competition.participants.push(participant);
      competition.metadata.totalParticipants = competition.participants.length;

      // Update competition status if needed
      if (competition.status === 'upcoming' && new Date() >= competition.startDate) {
        competition.status = 'active';
      }

      await this.updateCompetition(competition);
      
      return participant;
    } catch (error) {
      console.error('Error registering for competition:', error);
      throw error;
    }
  }

  /**
   * Updates competition participant score and rankings
   */
  static async updateCompetitionScore(params: CompetitionUpdateParams): Promise<void> {
    try {
      const competition = await this.getCompetition(params.competitionId);
      
      if (!competition) {
        throw new Error('Competition not found');
      }

      const participant = competition.participants.find(p => p.userId === params.participantId);
      
      if (!participant) {
        throw new Error('Participant not found');
      }

      // Update participant data
      if (params.score !== undefined) {
        participant.currentScore = Math.max(participant.currentScore, params.score);
        participant.lastSubmissionAt = new Date();
        participant.submissionsCount += 1;
      }

      if (params.achievementIds) {
        participant.achievements.push(...params.achievementIds);
      }

      // Recalculate rankings
      await this.recalculateCompetitionRankings(competition);
      
      // Update metadata
      competition.metadata.averageScore = this.calculateAverageScore(competition.participants);
      competition.metadata.topScore = Math.max(...competition.participants.map(p => p.currentScore));
      competition.metadata.submissionsCount = competition.participants.reduce(
        (sum, p) => sum + p.submissionsCount, 0
      );

      await this.updateCompetition(competition);
    } catch (error) {
      console.error('Error updating competition score:', error);
      throw error;
    }
  }

  /**
   * Gets anonymized peer comparison data
   */
  static async getPeerComparison(
    userId: string,
    skillId?: string,
    experienceLevel?: string
  ): Promise<{
    userPercentile: number;
    averageScore: number;
    topPercentileScore: number;
    peerCount: number;
    anonymizedRanges: Array<{
      range: string;
      count: number;
      percentage: number;
    }>;
  }> {
    try {
      const peers = await this.findSimilarPeers(userId, skillId, experienceLevel);
      const userScore = await this.getUserScore(userId, skillId);
      
      // Calculate percentile
      const betterPeers = peers.filter(peer => peer.score > userScore).length;
      const userPercentile = Math.round(((peers.length - betterPeers) / peers.length) * 100);
      
      // Calculate statistics
      const averageScore = peers.reduce((sum, peer) => sum + peer.score, 0) / peers.length;
      const sortedScores = peers.map(p => p.score).sort((a, b) => b - a);
      const topPercentileScore = sortedScores[Math.floor(sortedScores.length * 0.1)]; // Top 10%
      
      // Create anonymized ranges
      const anonymizedRanges = this.createAnonymizedRanges(sortedScores);
      
      return {
        userPercentile,
        averageScore: Math.round(averageScore),
        topPercentileScore: Math.round(topPercentileScore),
        peerCount: peers.length,
        anonymizedRanges
      };
    } catch (error) {
      console.error('Error getting peer comparison:', error);
      throw error;
    }
  }

  /**
   * Ends a competition and calculates final results
   */
  static async endCompetition(competitionId: string): Promise<{
    winners: CompetitionParticipant[];
    finalLeaderboard: LeaderboardEntry[];
    prizeDistribution: Array<{
      participant: CompetitionParticipant;
      prize: CompetitionPrize;
    }>;
  }> {
    try {
      const competition = await this.getCompetition(competitionId);
      
      if (!competition) {
        throw new Error('Competition not found');
      }

      // Final ranking calculation
      await this.recalculateCompetitionRankings(competition);
      
      // Determine winners and prize distribution
      const winners = competition.participants
        .filter(p => p.qualificationStatus === 'qualified')
        .sort((a, b) => a.currentRank - b.currentRank)
        .slice(0, 10); // Top 10 winners

      const prizeDistribution = this.distributePrizes(winners, competition.prizes);
      
      // Create final leaderboard
      const finalLeaderboard = await this.createFinalLeaderboard(competition);
      
      // Update competition status
      competition.status = 'completed';
      await this.updateCompetition(competition);
      
      return {
        winners,
        finalLeaderboard,
        prizeDistribution
      };
    } catch (error) {
      console.error('Error ending competition:', error);
      throw error;
    }
  }

  // Private helper methods

  private static async fetchLeaderboardEntries(query: LeaderboardQuery): Promise<LeaderboardEntry[]> {
    // This would fetch from database based on query parameters
    // For now, we'll return mock data
    const mockEntries: LeaderboardEntry[] = [];
    
    for (let i = 1; i <= (query.limit || 10); i++) {
      mockEntries.push({
        userId: `user_${i}`,
        username: query.includeAnonymized ? `Anonymous_${i}` : `User${i}`,
        displayName: query.includeAnonymized ? undefined : `Display User ${i}`,
        totalPoints: Math.floor(Math.random() * 10000) + 1000,
        rank: i,
        previousRank: i + Math.floor(Math.random() * 3) - 1,
        rankChange: Math.random() > 0.5 ? 'up' : 'down',
        badgeCount: Math.floor(Math.random() * 50) + 5,
        rareBadgeCount: Math.floor(Math.random() * 10),
        skillLevels: {
          JavaScript: Math.floor(Math.random() * 4) + 1,
          React: Math.floor(Math.random() * 4) + 1,
          TypeScript: Math.floor(Math.random() * 4) + 1
        },
        lastActivity: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        isAnonymized: query.includeAnonymized || false
      });
    }
    
    return mockEntries.sort((a, b) => b.totalPoints - a.totalPoints);
  }

  private static async getTotalParticipants(query: LeaderboardQuery): Promise<number> {
    // This would count total participants from database
    return Math.floor(Math.random() * 10000) + 1000;
  }

  private static async getUserRank(query: LeaderboardQuery, entries: LeaderboardEntry[]): Promise<number> {
    // Find user's rank in the entries
    const userEntry = entries.find(entry => !entry.isAnonymized);
    return userEntry?.rank || 0;
  }

  private static applyPrivacyFilters(
    entries: LeaderboardEntry[], 
    query: LeaderboardQuery
  ): LeaderboardEntry[] {
    if (!query.includeAnonymized) {
      return entries;
    }

    // Apply anonymization for privacy
    return entries.map((entry, index) => {
      if (index === 0) return entry; // Keep user's own entry visible
      
      return {
        ...entry,
        userId: `anonymous_${entry.rank}`,
        username: `Anonymous User`,
        displayName: undefined,
        isAnonymized: true
      };
    });
  }

  private static calculateNextUpdate(type: string): Date {
    const now = new Date();
    const interval = this.UPDATE_INTERVALS.standard;
    return new Date(now.getTime() + interval);
  }

  private static async getUserSkills(userId: string): Promise<string[]> {
    // This would fetch user's skills from database
    return ['JavaScript', 'React', 'TypeScript', 'Node.js'];
  }

  private static async getActiveCompetitions(): Promise<Competition[]> {
    // This would fetch active competitions from database
    return [];
  }

  private static async extractSkillsFromChallenges(challengeIds: string[]): Promise<string[]> {
    // This would analyze challenges to extract targeted skills
    return ['JavaScript', 'algorithms', 'problem-solving'];
  }

  private static async calculateCompetitionDifficulty(challengeIds: string[]): Promise<'beginner' | 'intermediate' | 'advanced' | 'expert' | 'mixed'> {
    // This would analyze challenge difficulties
    return 'intermediate';
  }

  private static async estimateCompetitionDuration(challengeIds: string[]): Promise<number> {
    // This would estimate total duration based on challenges
    return 120; // 2 hours
  }

  private static async saveCompetition(competition: Competition): Promise<void> {
    // This would save to database
    console.log('Saving competition:', competition.competitionId);
  }

  private static mockCompetitions: Map<string, Competition> = new Map();

  private static async getCompetition(competitionId: string): Promise<Competition | null> {
    // Check if we have a mock competition stored
    if (this.mockCompetitions.has(competitionId)) {
      return this.mockCompetitions.get(competitionId)!;
    }

    // This would fetch from database
    // For now, return mock competition
    const mockCompetition: Competition = {
      competitionId,
      title: 'Mock Competition',
      description: 'A test competition',
      type: 'daily',
      category: 'skill_based',
      startDate: new Date(),
      endDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      prizes: [],
      rules: [],
      participants: [],
      leaderboard: [],
      status: 'active',
      createdBy: 'system',
      metadata: {
        totalParticipants: 0,
        averageScore: 0,
        topScore: 0,
        submissionsCount: 0,
        skillsTargeted: ['JavaScript'],
        difficultyLevel: 'intermediate',
        estimatedDuration: 60
      }
    };

    this.mockCompetitions.set(competitionId, mockCompetition);
    return mockCompetition;
  }

  private static async validateRegistrationEligibility(competition: Competition, userId: string): Promise<void> {
    // Check if registration is still open
    if (competition.registrationDeadline && new Date() > competition.registrationDeadline) {
      throw new Error('Registration deadline has passed');
    }

    // Check if competition is full
    if (competition.maxParticipants && competition.participants.length >= competition.maxParticipants) {
      throw new Error('Competition is full');
    }

    // Check if user is already registered
    if (competition.participants.some(p => p.userId === userId)) {
      throw new Error('User is already registered');
    }

    // Additional eligibility checks would go here
  }

  private static async updateCompetition(competition: Competition): Promise<void> {
    // This would update in database
    // For testing, store in mock competitions
    this.mockCompetitions.set(competition.competitionId, competition);
    console.log('Updating competition:', competition.competitionId);
  }

  private static async recalculateCompetitionRankings(competition: Competition): Promise<void> {
    // Sort participants by score (descending) and update ranks
    competition.participants.sort((a, b) => {
      if (b.currentScore !== a.currentScore) {
        return b.currentScore - a.currentScore;
      }
      // Tie-breaker: fewer submissions wins
      return a.submissionsCount - b.submissionsCount;
    });

    // Update ranks
    competition.participants.forEach((participant, index) => {
      participant.currentRank = index + 1;
    });

    // Update leaderboard
    competition.leaderboard = competition.participants.map(participant => ({
      userId: participant.userId,
      username: participant.username,
      score: participant.currentScore,
      rank: participant.currentRank,
      badgesEarned: participant.achievements,
      lastSubmissionAt: participant.lastSubmissionAt || participant.registeredAt,
      isAnonymized: false
    }));
  }

  private static calculateAverageScore(participants: CompetitionParticipant[]): number {
    if (participants.length === 0) return 0;
    const totalScore = participants.reduce((sum, p) => sum + p.currentScore, 0);
    return Math.round(totalScore / participants.length);
  }

  private static async findSimilarPeers(
    userId: string, 
    skillId?: string, 
    experienceLevel?: string
  ): Promise<Array<{ userId: string; score: number }>> {
    // This would find peers with similar characteristics
    const mockPeers = [];
    for (let i = 0; i < 100; i++) {
      mockPeers.push({
        userId: `peer_${i}`,
        score: Math.floor(Math.random() * 1000) + 500
      });
    }
    return mockPeers;
  }

  private static async getUserScore(userId: string, skillId?: string): Promise<number> {
    // This would get user's score for comparison
    return Math.floor(Math.random() * 1000) + 500;
  }

  private static createAnonymizedRanges(scores: number[]): Array<{
    range: string;
    count: number;
    percentage: number;
  }> {
    const ranges = [
      { min: 0, max: 200, label: '0-200' },
      { min: 201, max: 400, label: '201-400' },
      { min: 401, max: 600, label: '401-600' },
      { min: 601, max: 800, label: '601-800' },
      { min: 801, max: 1000, label: '801-1000' },
      { min: 1001, max: Infinity, label: '1000+' }
    ];

    return ranges.map(range => {
      const count = scores.filter(score => score >= range.min && score <= range.max).length;
      const percentage = Math.round((count / scores.length) * 100);
      
      return {
        range: range.label,
        count,
        percentage
      };
    }).filter(range => range.count > 0);
  }

  private static distributePrizes(
    winners: CompetitionParticipant[], 
    prizes: CompetitionPrize[]
  ): Array<{ participant: CompetitionParticipant; prize: CompetitionPrize }> {
    const distribution = [];
    
    for (const prize of prizes) {
      if (typeof prize.rank === 'number') {
        const winner = winners.find(w => w.currentRank === prize.rank);
        if (winner) {
          distribution.push({ participant: winner, prize });
        }
      } else if (prize.rank === 'top_10') {
        const topTenWinners = winners.slice(0, 10);
        for (const winner of topTenWinners) {
          distribution.push({ participant: winner, prize });
        }
      } else if (prize.rank === 'participation') {
        for (const winner of winners) {
          distribution.push({ participant: winner, prize });
        }
      }
    }
    
    return distribution;
  }

  private static async createFinalLeaderboard(competition: Competition): Promise<LeaderboardEntry[]> {
    return competition.participants.map(participant => ({
      userId: participant.userId,
      username: participant.username,
      totalPoints: participant.currentScore,
      rank: participant.currentRank,
      badgeCount: participant.achievements.length,
      rareBadgeCount: Math.floor(participant.achievements.length * 0.2),
      skillLevels: {}, // Would be populated from user data
      lastActivity: participant.lastSubmissionAt || participant.registeredAt,
      isAnonymized: false,
      rankChange: 'same'
    }));
  }
}