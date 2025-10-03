/**
 * @fileOverview Unit tests for LeaderboardService
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LeaderboardService } from '../leaderboard-service';
import { LeaderboardQuery, CompetitionCreationParams } from '../leaderboard-service';

describe('LeaderboardService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getLeaderboard', () => {
    it('should fetch global leaderboard successfully', async () => {
      const query: LeaderboardQuery = {
        type: 'global',
        limit: 10,
        timeframe: 'weekly'
      };

      const result = await LeaderboardService.getLeaderboard(query);

      expect(result).toBeDefined();
      expect(result.entries).toBeDefined();
      expect(Array.isArray(result.entries)).toBe(true);
      expect(result.entries.length).toBeLessThanOrEqual(10);
      expect(result.totalParticipants).toBeGreaterThan(0);
      expect(result.lastUpdated).toBeInstanceOf(Date);
      expect(result.nextUpdate).toBeInstanceOf(Date);
    });

    it('should fetch skill-based leaderboard', async () => {
      const query: LeaderboardQuery = {
        type: 'skill_based',
        skillId: 'JavaScript',
        limit: 20,
        timeframe: 'monthly'
      };

      const result = await LeaderboardService.getLeaderboard(query);

      expect(result).toBeDefined();
      expect(result.entries.length).toBeLessThanOrEqual(20);
      expect(result.entries.every(entry => entry.skillLevels.JavaScript)).toBeTruthy();
    });

    it('should apply anonymization when requested', async () => {
      const query: LeaderboardQuery = {
        type: 'global',
        limit: 5,
        includeAnonymized: true
      };

      const result = await LeaderboardService.getLeaderboard(query);

      expect(result.entries.length).toBeGreaterThan(0);
      // First entry should be user's own (not anonymized), others should be anonymized
      if (result.entries.length > 1) {
        expect(result.entries.slice(1).every(entry => entry.isAnonymized)).toBe(true);
      }
    });

    it('should handle competition leaderboard', async () => {
      const query: LeaderboardQuery = {
        type: 'competition',
        competitionId: 'comp_123',
        limit: 15
      };

      const result = await LeaderboardService.getLeaderboard(query);

      expect(result).toBeDefined();
      expect(result.entries).toBeDefined();
      expect(result.totalParticipants).toBeGreaterThanOrEqual(0);
    });

    it('should handle peer group leaderboard', async () => {
      const query: LeaderboardQuery = {
        type: 'peer_group',
        limit: 25,
        timeframe: 'daily'
      };

      const result = await LeaderboardService.getLeaderboard(query);

      expect(result).toBeDefined();
      expect(result.entries.length).toBeLessThanOrEqual(25);
    });
  });

  describe('getUserRanks', () => {
    it('should return user ranks across different categories', async () => {
      const userId = 'test-user-123';
      const ranks = await LeaderboardService.getUserRanks(userId);

      expect(ranks).toBeDefined();
      expect(ranks.global).toBeGreaterThan(0);
      expect(ranks.peerGroup).toBeGreaterThan(0);
      expect(typeof ranks.skillBased).toBe('object');
      expect(typeof ranks.competitions).toBe('object');
    });

    it('should include skill-based rankings', async () => {
      const userId = 'test-user-456';
      const ranks = await LeaderboardService.getUserRanks(userId);

      expect(Object.keys(ranks.skillBased).length).toBeGreaterThan(0);
      Object.values(ranks.skillBased).forEach(rank => {
        expect(rank).toBeGreaterThanOrEqual(0);
      });
    });

    it('should handle user with no competition participation', async () => {
      const userId = 'new-user-789';
      const ranks = await LeaderboardService.getUserRanks(userId);

      expect(ranks.competitions).toBeDefined();
      expect(typeof ranks.competitions).toBe('object');
    });
  });

  describe('createCompetition', () => {
    it('should create a new competition successfully', async () => {
      const params: CompetitionCreationParams = {
        title: 'Test Competition',
        description: 'A test competition for unit testing',
        type: 'weekly',
        category: 'skill_based',
        startDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        endDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000), // Next week
        challenges: ['challenge_1', 'challenge_2'],
        prizes: [
          { rank: 1, title: 'Gold Badge', description: 'First place', type: 'badge', value: 'gold_test' },
          { rank: 2, title: 'Silver Badge', description: 'Second place', type: 'badge', value: 'silver_test' }
        ],
        rules: [
          { ruleId: 'rule_1', description: 'No cheating', category: 'conduct', isRequired: true }
        ],
        createdBy: 'test-admin'
      };

      const competition = await LeaderboardService.createCompetition(params);

      expect(competition).toBeDefined();
      expect(competition.competitionId).toBeDefined();
      expect(competition.title).toBe(params.title);
      expect(competition.description).toBe(params.description);
      expect(competition.type).toBe(params.type);
      expect(competition.category).toBe(params.category);
      expect(competition.createdBy).toBe(params.createdBy);
      expect(competition.participants).toEqual([]);
      expect(competition.leaderboard).toEqual([]);
      expect(competition.status).toBe('upcoming');
      expect(competition.metadata).toBeDefined();
      expect(competition.metadata.totalParticipants).toBe(0);
    });

    it('should set correct status based on start date', async () => {
      const params: CompetitionCreationParams = {
        title: 'Active Competition',
        description: 'Already started competition',
        type: 'daily',
        category: 'challenge_based',
        startDate: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
        endDate: new Date(Date.now() + 23 * 60 * 60 * 1000), // 23 hours from now
        challenges: ['challenge_1'],
        prizes: [],
        rules: [],
        createdBy: 'test-admin'
      };

      const competition = await LeaderboardService.createCompetition(params);

      expect(competition.status).toBe('registration_open');
    });

    it('should include metadata with estimated values', async () => {
      const params: CompetitionCreationParams = {
        title: 'Metadata Test Competition',
        description: 'Testing metadata generation',
        type: 'monthly',
        category: 'innovation',
        startDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 31 * 24 * 60 * 60 * 1000),
        challenges: ['challenge_1', 'challenge_2', 'challenge_3'],
        prizes: [],
        rules: [],
        createdBy: 'test-admin'
      };

      const competition = await LeaderboardService.createCompetition(params);

      expect(competition.metadata.skillsTargeted).toBeDefined();
      expect(Array.isArray(competition.metadata.skillsTargeted)).toBe(true);
      expect(competition.metadata.difficultyLevel).toBeDefined();
      expect(['beginner', 'intermediate', 'advanced', 'expert', 'mixed']).toContain(competition.metadata.difficultyLevel);
      expect(competition.metadata.estimatedDuration).toBeGreaterThan(0);
    });
  });

  describe('registerForCompetition', () => {
    it('should register user for competition successfully', async () => {
      const competitionId = 'test-comp-123';
      const userId = 'test-user-456';
      const username = 'testuser';

      const participant = await LeaderboardService.registerForCompetition(competitionId, userId, username);

      expect(participant).toBeDefined();
      expect(participant.userId).toBe(userId);
      expect(participant.username).toBe(username);
      expect(participant.registeredAt).toBeInstanceOf(Date);
      expect(participant.currentScore).toBe(0);
      expect(participant.currentRank).toBeGreaterThan(0);
      expect(participant.submissionsCount).toBe(0);
      expect(participant.qualificationStatus).toBe('qualified');
      expect(Array.isArray(participant.achievements)).toBe(true);
    });

    it('should handle registration for non-existent competition', async () => {
      const competitionId = 'non-existent-comp';
      const userId = 'test-user-789';
      const username = 'testuser2';

      // Mock the getCompetition to return null
      const originalGetCompetition = (LeaderboardService as any).getCompetition;
      (LeaderboardService as any).getCompetition = vi.fn().mockResolvedValue(null);

      await expect(
        LeaderboardService.registerForCompetition(competitionId, userId, username)
      ).rejects.toThrow('Competition not found');

      // Restore original method
      (LeaderboardService as any).getCompetition = originalGetCompetition;
    });
  });

  describe('updateCompetitionScore', () => {
    it('should update participant score successfully', async () => {
      // First register a participant with a unique user ID
      const uniqueUserId = `test-user-update-${Date.now()}`;
      await LeaderboardService.registerForCompetition('test-comp-123', uniqueUserId, 'testuser');
      
      const params = {
        competitionId: 'test-comp-123',
        participantId: uniqueUserId,
        score: 85,
        submissionId: 'submission-789',
        achievementIds: ['achievement-1', 'achievement-2']
      };

      // This should not throw an error
      await expect(LeaderboardService.updateCompetitionScore(params)).resolves.toBeUndefined();
    });

    it('should handle score update for non-existent competition', async () => {
      const params = {
        competitionId: 'non-existent-comp',
        participantId: 'test-user-456',
        score: 85
      };

      // Mock the getCompetition to return null
      const originalGetCompetition = (LeaderboardService as any).getCompetition;
      (LeaderboardService as any).getCompetition = vi.fn().mockResolvedValue(null);

      await expect(LeaderboardService.updateCompetitionScore(params)).rejects.toThrow('Competition not found');

      // Restore original method
      (LeaderboardService as any).getCompetition = originalGetCompetition;
    });
  });

  describe('getPeerComparison', () => {
    it('should return peer comparison data', async () => {
      const userId = 'test-user-123';
      const skillId = 'JavaScript';
      const experienceLevel = 'intermediate';

      const comparison = await LeaderboardService.getPeerComparison(userId, skillId, experienceLevel);

      expect(comparison).toBeDefined();
      expect(comparison.userPercentile).toBeGreaterThanOrEqual(0);
      expect(comparison.userPercentile).toBeLessThanOrEqual(100);
      expect(comparison.averageScore).toBeGreaterThan(0);
      expect(comparison.topPercentileScore).toBeGreaterThan(0);
      expect(comparison.peerCount).toBeGreaterThan(0);
      expect(Array.isArray(comparison.anonymizedRanges)).toBe(true);
    });

    it('should include anonymized ranges', async () => {
      const userId = 'test-user-456';
      const comparison = await LeaderboardService.getPeerComparison(userId);

      expect(comparison.anonymizedRanges.length).toBeGreaterThan(0);
      comparison.anonymizedRanges.forEach(range => {
        expect(range.range).toBeDefined();
        expect(range.count).toBeGreaterThanOrEqual(0);
        expect(range.percentage).toBeGreaterThanOrEqual(0);
        expect(range.percentage).toBeLessThanOrEqual(100);
      });
    });

    it('should handle user with no peers', async () => {
      const userId = 'unique-user-789';
      
      // Mock findSimilarPeers to return empty array
      const originalFindSimilarPeers = (LeaderboardService as any).findSimilarPeers;
      (LeaderboardService as any).findSimilarPeers = vi.fn().mockResolvedValue([]);

      const comparison = await LeaderboardService.getPeerComparison(userId);

      expect(comparison.peerCount).toBe(0);
      expect(comparison.anonymizedRanges).toEqual([]);

      // Restore original method
      (LeaderboardService as any).findSimilarPeers = originalFindSimilarPeers;
    });
  });

  describe('endCompetition', () => {
    it('should end competition and return results', async () => {
      const competitionId = 'test-comp-123';

      const results = await LeaderboardService.endCompetition(competitionId);

      expect(results).toBeDefined();
      expect(Array.isArray(results.winners)).toBe(true);
      expect(Array.isArray(results.finalLeaderboard)).toBe(true);
      expect(Array.isArray(results.prizeDistribution)).toBe(true);
    });

    it('should handle ending non-existent competition', async () => {
      const competitionId = 'non-existent-comp';

      // Mock the getCompetition to return null
      const originalGetCompetition = (LeaderboardService as any).getCompetition;
      (LeaderboardService as any).getCompetition = vi.fn().mockResolvedValue(null);

      await expect(LeaderboardService.endCompetition(competitionId)).rejects.toThrow('Competition not found');

      // Restore original method
      (LeaderboardService as any).getCompetition = originalGetCompetition;
    });

    it('should limit winners to top 10', async () => {
      const competitionId = 'large-comp-123';

      const results = await LeaderboardService.endCompetition(competitionId);

      expect(results.winners.length).toBeLessThanOrEqual(10);
    });
  });

  describe('Error handling', () => {
    it('should handle service errors gracefully', async () => {
      // Mock a method to throw an error
      const originalFetchLeaderboardEntries = (LeaderboardService as any).fetchLeaderboardEntries;
      (LeaderboardService as any).fetchLeaderboardEntries = vi.fn().mockRejectedValue(new Error('Database error'));

      const query: LeaderboardQuery = { type: 'global', limit: 10 };

      await expect(LeaderboardService.getLeaderboard(query)).rejects.toThrow('Database error');

      // Restore original method
      (LeaderboardService as any).fetchLeaderboardEntries = originalFetchLeaderboardEntries;
    });

    it('should handle invalid query parameters', async () => {
      const query: LeaderboardQuery = {
        type: 'skill_based',
        // Missing skillId for skill_based query
        limit: 10
      };

      // Should still work but may return empty results
      const result = await LeaderboardService.getLeaderboard(query);
      expect(result).toBeDefined();
    });

    it('should handle negative or zero limits', async () => {
      const query: LeaderboardQuery = {
        type: 'global',
        limit: 0
      };

      const result = await LeaderboardService.getLeaderboard(query);
      expect(result).toBeDefined();
      expect(result.entries).toBeDefined();
    });
  });

  describe('Privacy and anonymization', () => {
    it('should properly anonymize entries when requested', async () => {
      const query: LeaderboardQuery = {
        type: 'global',
        limit: 10,
        includeAnonymized: true
      };

      const result = await LeaderboardService.getLeaderboard(query);

      if (result.entries.length > 1) {
        const anonymizedEntries = result.entries.slice(1);
        anonymizedEntries.forEach(entry => {
          expect(entry.isAnonymized).toBe(true);
          expect(entry.username).toBe('Anonymous User');
          expect(entry.displayName).toBeUndefined();
          expect(entry.userId).toMatch(/^anonymous_\d+$/);
        });
      }
    });

    it('should preserve user own entry visibility', async () => {
      const query: LeaderboardQuery = {
        type: 'global',
        limit: 10,
        includeAnonymized: false // Test without anonymization first
      };

      const result = await LeaderboardService.getLeaderboard(query);

      if (result.entries.length > 0) {
        // When anonymization is disabled, entries should not be anonymized
        result.entries.forEach(entry => {
          expect(entry.isAnonymized).toBe(false);
        });
      }
    });
  });
});