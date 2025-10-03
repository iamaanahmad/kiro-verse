/**
 * @fileOverview Integration tests for challenge participation and leaderboard updates
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CompetitionManager } from '@/components/gamification/CompetitionManager';
import { Leaderboard } from '@/components/gamification/Leaderboard';
import { GamificationService } from '@/lib/gamification/gamification-service';
import { ChallengeRepository } from '@/lib/challenges/challenge-repository';
import { LeaderboardService } from '@/lib/gamification/leaderboard-service';
import { setupMockServices, resetMockServices, createMockChallenge } from '../mocks/external-services';

// Setup mocks for integration testing
setupMockServices();

vi.mock('@/lib/gamification/gamification-service');
vi.mock('@/lib/challenges/challenge-repository');
vi.mock('@/lib/gamification/leaderboard-service');

const mockGamificationService = vi.mocked(GamificationService);
const mockChallengeRepository = vi.mocked(ChallengeRepository);
const mockLeaderboardService = vi.mocked(LeaderboardService);

const mockCompetition = {
  competitionId: 'comp-123',
  title: 'Weekly JavaScript Challenge',
  description: 'Test your JavaScript skills in this weekly competition',
  type: 'weekly' as const,
  status: 'active' as const,
  startDate: new Date('2024-01-15T00:00:00Z'),
  endDate: new Date('2024-01-22T23:59:59Z'),
  maxParticipants: 100,
  currentParticipants: 45,
  prizes: [
    { position: 1, type: 'badge', value: 'JavaScript Champion', rarity: 'legendary' },
    { position: 2, type: 'points', value: 500, rarity: 'epic' },
    { position: 3, type: 'points', value: 250, rarity: 'rare' }
  ],
  rules: ['Complete all challenges within time limit', 'No external help allowed'],
  eligibilityRequirements: ['Minimum JavaScript skill level 2'],
  createdBy: 'system',
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-15T00:00:00Z'),
  tags: ['javascript', 'algorithms'],
  difficulty: 'intermediate' as const,
  category: 'skill-based'
};

const mockChallenges = [
  createMockChallenge({
    challengeId: 'challenge-1',
    title: 'Array Sorting Challenge',
    competitionId: 'comp-123',
    difficulty: 'intermediate',
    timeLimit: 30
  }),
  createMockChallenge({
    challengeId: 'challenge-2',
    title: 'String Manipulation Challenge',
    competitionId: 'comp-123',
    difficulty: 'intermediate',
    timeLimit: 25
  }),
  createMockChallenge({
    challengeId: 'challenge-3',
    title: 'Algorithm Optimization Challenge',
    competitionId: 'comp-123',
    difficulty: 'advanced',
    timeLimit: 45
  })
];

const mockLeaderboardData = {
  entries: [
    {
      userId: 'user-1',
      username: 'developer1',
      displayName: 'Alice Johnson',
      rank: 1,
      totalPoints: 2850,
      badgeCount: 18,
      rareBadgeCount: 4,
      skillLevels: { JavaScript: 5, Algorithms: 4, React: 3 },
      lastActivity: new Date('2024-01-15T16:30:00Z'),
      rankChange: 'up' as const,
      isAnonymized: false,
      challengesCompleted: 3,
      averageScore: 94,
      competitionPoints: 285
    },
    {
      userId: 'user-2',
      username: 'developer2',
      displayName: 'Bob Smith',
      rank: 2,
      totalPoints: 2720,
      badgeCount: 15,
      rareBadgeCount: 3,
      skillLevels: { JavaScript: 4, Algorithms: 4, TypeScript: 3 },
      lastActivity: new Date('2024-01-15T15:45:00Z'),
      rankChange: 'same' as const,
      isAnonymized: false,
      challengesCompleted: 3,
      averageScore: 91,
      competitionPoints: 272
    },
    {
      userId: 'user-123',
      username: 'testuser',
      displayName: 'Test User',
      rank: 5,
      totalPoints: 2100,
      badgeCount: 12,
      rareBadgeCount: 2,
      skillLevels: { JavaScript: 3, React: 3, CSS: 2 },
      lastActivity: new Date('2024-01-15T14:20:00Z'),
      rankChange: 'down' as const,
      isAnonymized: false,
      challengesCompleted: 2,
      averageScore: 87,
      competitionPoints: 174
    }
  ],
  totalParticipants: 45,
  lastUpdated: new Date('2024-01-15T16:35:00Z'),
  metadata: {
    type: 'competition',
    competitionId: 'comp-123',
    timeframe: 'current'
  }
};

const mockUserStatus = {
  isParticipating: false,
  canJoin: true,
  eligibilityStatus: 'eligible' as const,
  currentRank: null,
  totalPoints: 0,
  challengesCompleted: 0,
  challengesRemaining: 3,
  timeRemaining: 7 * 24 * 60 * 60 * 1000, // 7 days
  joinedAt: null
};

describe('Challenge Participation Integration Tests', () => {
  beforeEach(() => {
    resetMockServices();
    
    // Setup default mock responses
    mockGamificationService.getActiveCompetitions.mockResolvedValue([mockCompetition]);
    mockGamificationService.getUserCompetitionStatus.mockResolvedValue(mockUserStatus);
    mockGamificationService.joinCompetition.mockResolvedValue({ success: true });
    mockGamificationService.leaveCompetition.mockResolvedValue({ success: true });
    mockChallengeRepository.getChallengesByCompetition.mockResolvedValue(mockChallenges);
    mockLeaderboardService.getLeaderboard.mockResolvedValue(mockLeaderboardData);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Complete Challenge Participation Workflow', () => {
    it('should allow user to join competition and participate in challenges', async () => {
      render(<CompetitionManager userId="user-123" />);
      
      // Wait for competitions to load
      await waitFor(() => {
        expect(screen.getByText('Weekly JavaScript Challenge')).toBeInTheDocument();
      });
      
      // Verify competition details
      expect(screen.getByText('45/100 participants')).toBeInTheDocument();
      expect(screen.getByText('Active')).toBeInTheDocument();
      expect(screen.getByText('JavaScript Champion')).toBeInTheDocument();
      
      // Join competition
      const joinButton = screen.getByText('Join Competition');
      fireEvent.click(joinButton);
      
      await waitFor(() => {
        expect(mockGamificationService.joinCompetition).toHaveBeenCalledWith(
          'user-123',
          'comp-123'
        );
      });
      
      // Update mock to reflect joined status
      mockGamificationService.getUserCompetitionStatus.mockResolvedValue({
        ...mockUserStatus,
        isParticipating: true,
        joinedAt: new Date(),
        challengesRemaining: 3
      });
      
      // Re-render to show updated status
      render(<CompetitionManager userId="user-123" />);
      
      await waitFor(() => {
        expect(screen.getByText('Leave Competition')).toBeInTheDocument();
        expect(screen.getByText('3 challenges remaining')).toBeInTheDocument();
      });
    });

    it('should display available challenges after joining', async () => {
      // Mock user as already participating
      mockGamificationService.getUserCompetitionStatus.mockResolvedValue({
        ...mockUserStatus,
        isParticipating: true,
        joinedAt: new Date('2024-01-15T10:00:00Z'),
        challengesCompleted: 0,
        challengesRemaining: 3
      });
      
      render(<CompetitionManager userId="user-123" showChallenges={true} />);
      
      await waitFor(() => {
        expect(screen.getByText('Available Challenges')).toBeInTheDocument();
      });
      
      // Verify challenges are displayed
      expect(screen.getByText('Array Sorting Challenge')).toBeInTheDocument();
      expect(screen.getByText('String Manipulation Challenge')).toBeInTheDocument();
      expect(screen.getByText('Algorithm Optimization Challenge')).toBeInTheDocument();
      
      // Verify challenge details
      expect(screen.getByText('30 min')).toBeInTheDocument();
      expect(screen.getByText('25 min')).toBeInTheDocument();
      expect(screen.getByText('45 min')).toBeInTheDocument();
    });

    it('should handle challenge submission and scoring', async () => {
      // Mock user participating with one challenge completed
      mockGamificationService.getUserCompetitionStatus.mockResolvedValue({
        ...mockUserStatus,
        isParticipating: true,
        joinedAt: new Date('2024-01-15T10:00:00Z'),
        challengesCompleted: 1,
        challengesRemaining: 2,
        currentRank: 8,
        totalPoints: 85
      });
      
      const mockSubmission = {
        submissionId: 'sub-123',
        challengeId: 'challenge-1',
        userId: 'user-123',
        code: 'function sort(arr) { return arr.sort((a, b) => a - b); }',
        language: 'javascript',
        submittedAt: new Date(),
        totalScore: 85,
        passed: true,
        evaluationResults: [
          { testCase: 0, passed: true, actualOutput: '[1,2,3]', executionTime: 5 }
        ],
        feedback: ['Good solution!']
      };
      
      mockChallengeRepository.submitSolution.mockResolvedValue(mockSubmission);
      mockChallengeRepository.updateSubmissionResults.mockResolvedValue(undefined);
      
      render(<CompetitionManager userId="user-123" showChallenges={true} />);
      
      await waitFor(() => {
        expect(screen.getByText('Available Challenges')).toBeInTheDocument();
      });
      
      // Start a challenge
      const startButton = screen.getAllByText('Start Challenge')[0];
      fireEvent.click(startButton);
      
      // Should open challenge interface
      await waitFor(() => {
        expect(screen.getByText('Array Sorting Challenge')).toBeInTheDocument();
        expect(screen.getByRole('textbox')).toBeInTheDocument(); // Code editor
      });
      
      // Submit solution
      const codeEditor = screen.getByRole('textbox');
      fireEvent.change(codeEditor, {
        target: { value: 'function sort(arr) { return arr.sort((a, b) => a - b); }' }
      });
      
      const submitButton = screen.getByText('Submit Solution');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockChallengeRepository.submitSolution).toHaveBeenCalledWith(
          'challenge-1',
          'user-123',
          'function sort(arr) { return arr.sort((a, b) => a - b); }',
          'javascript'
        );
      });
      
      // Should show results
      await waitFor(() => {
        expect(screen.getByText('Challenge Completed!')).toBeInTheDocument();
        expect(screen.getByText('Score: 85/100')).toBeInTheDocument();
        expect(screen.getByText('Good solution!')).toBeInTheDocument();
      });
    });

    it('should update leaderboard after challenge completion', async () => {
      // Mock updated leaderboard with user's new position
      const updatedLeaderboard = {
        ...mockLeaderboardData,
        entries: [
          ...mockLeaderboardData.entries.slice(0, 2),
          {
            ...mockLeaderboardData.entries[2],
            rank: 3,
            totalPoints: 2350,
            challengesCompleted: 3,
            averageScore: 89,
            competitionPoints: 235,
            rankChange: 'up' as const
          }
        ]
      };
      
      mockLeaderboardService.getLeaderboard.mockResolvedValue(updatedLeaderboard);
      
      render(<Leaderboard userId="user-123" competitionId="comp-123" />);
      
      await waitFor(() => {
        expect(screen.getByText('Test User')).toBeInTheDocument();
      });
      
      // Should show updated rank and points
      expect(screen.getByText('#3')).toBeInTheDocument();
      expect(screen.getByText('2,350')).toBeInTheDocument();
      expect(screen.getByText('3 challenges')).toBeInTheDocument();
      
      // Should show rank improvement indicator
      const rankChangeIcon = document.querySelector('.text-green-500');
      expect(rankChangeIcon).toBeInTheDocument();
    });
  });

  describe('Leaderboard Updates and Real-time Features', () => {
    it('should display real-time leaderboard updates', async () => {
      render(<Leaderboard competitionId="comp-123" autoRefresh={true} refreshInterval={1000} />);
      
      await waitFor(() => {
        expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
        expect(screen.getByText('2,850')).toBeInTheDocument();
      });
      
      // Simulate leaderboard update
      const updatedData = {
        ...mockLeaderboardData,
        entries: [
          {
            ...mockLeaderboardData.entries[1], // Bob moves to first
            rank: 1,
            totalPoints: 2900,
            rankChange: 'up' as const
          },
          {
            ...mockLeaderboardData.entries[0], // Alice moves to second
            rank: 2,
            rankChange: 'down' as const
          },
          mockLeaderboardData.entries[2]
        ]
      };
      
      mockLeaderboardService.getLeaderboard.mockResolvedValue(updatedData);
      
      // Fast-forward time to trigger refresh
      vi.advanceTimersByTime(1000);
      
      await waitFor(() => {
        expect(screen.getByText('Bob Smith')).toBeInTheDocument();
        expect(screen.getByText('2,900')).toBeInTheDocument();
      });
      
      // Verify rank change indicators
      const upArrow = document.querySelector('.text-green-500');
      const downArrow = document.querySelector('.text-red-500');
      expect(upArrow).toBeInTheDocument();
      expect(downArrow).toBeInTheDocument();
    });

    it('should handle participant count updates', async () => {
      render(<CompetitionManager />);
      
      await waitFor(() => {
        expect(screen.getByText('45/100 participants')).toBeInTheDocument();
      });
      
      // Simulate new participant joining
      const updatedCompetition = {
        ...mockCompetition,
        currentParticipants: 46
      };
      
      mockGamificationService.getActiveCompetitions.mockResolvedValue([updatedCompetition]);
      
      // Trigger refresh
      vi.advanceTimersByTime(5000);
      
      await waitFor(() => {
        expect(screen.getByText('46/100 participants')).toBeInTheDocument();
      });
    });

    it('should show live challenge completion notifications', async () => {
      render(<Leaderboard competitionId="comp-123" showLiveUpdates={true} />);
      
      await waitFor(() => {
        expect(screen.getByText('Leaderboard')).toBeInTheDocument();
      });
      
      // Simulate live update notification
      const liveUpdate = {
        type: 'challenge_completed',
        userId: 'user-456',
        username: 'newuser',
        challengeId: 'challenge-1',
        score: 92,
        timestamp: new Date()
      };
      
      // Mock WebSocket message
      const mockWebSocket = new WebSocket('ws://localhost');
      mockWebSocket.onmessage?.({ data: JSON.stringify(liveUpdate) } as MessageEvent);
      
      await waitFor(() => {
        expect(screen.getByText('newuser completed Array Sorting Challenge')).toBeInTheDocument();
        expect(screen.getByText('Score: 92')).toBeInTheDocument();
      });
    });

    it('should handle leaderboard filtering and sorting', async () => {
      render(<Leaderboard competitionId="comp-123" />);
      
      await waitFor(() => {
        expect(screen.getByText('Leaderboard')).toBeInTheDocument();
      });
      
      // Test timeframe filter
      const timeframeSelect = screen.getByDisplayValue('Current');
      fireEvent.click(timeframeSelect);
      fireEvent.click(screen.getByText('Daily'));
      
      await waitFor(() => {
        expect(mockLeaderboardService.getLeaderboard).toHaveBeenCalledWith(
          expect.objectContaining({
            timeframe: 'daily',
            competitionId: 'comp-123'
          })
        );
      });
      
      // Test skill-based filtering
      const skillFilter = screen.getByLabelText('Filter by skill');
      fireEvent.change(skillFilter, { target: { value: 'JavaScript' } });
      
      await waitFor(() => {
        expect(mockLeaderboardService.getLeaderboard).toHaveBeenCalledWith(
          expect.objectContaining({
            skillFilter: 'JavaScript'
          })
        );
      });
    });
  });

  describe('Competition Management Workflow', () => {
    it('should handle competition lifecycle events', async () => {
      // Test upcoming competition
      const upcomingCompetition = {
        ...mockCompetition,
        status: 'upcoming' as const,
        startDate: new Date(Date.now() + 24 * 60 * 60 * 1000) // Tomorrow
      };
      
      mockGamificationService.getActiveCompetitions.mockResolvedValue([upcomingCompetition]);
      
      render(<CompetitionManager />);
      
      await waitFor(() => {
        expect(screen.getByText('Upcoming')).toBeInTheDocument();
        expect(screen.getByText('Starts in 1 day')).toBeInTheDocument();
      });
      
      // Test competition start
      const activeCompetition = {
        ...upcomingCompetition,
        status: 'active' as const,
        startDate: new Date()
      };
      
      mockGamificationService.getActiveCompetitions.mockResolvedValue([activeCompetition]);
      
      // Simulate time passing
      vi.advanceTimersByTime(24 * 60 * 60 * 1000);
      
      await waitFor(() => {
        expect(screen.getByText('Active')).toBeInTheDocument();
        expect(screen.getByText('Join Competition')).toBeInTheDocument();
      });
    });

    it('should handle competition end and results', async () => {
      // Mock competition ending
      const endingCompetition = {
        ...mockCompetition,
        status: 'ended' as const,
        endDate: new Date(Date.now() - 60 * 60 * 1000) // 1 hour ago
      };
      
      mockGamificationService.getActiveCompetitions.mockResolvedValue([endingCompetition]);
      
      const finalLeaderboard = {
        ...mockLeaderboardData,
        metadata: {
          ...mockLeaderboardData.metadata,
          isFinal: true
        }
      };
      
      mockLeaderboardService.getLeaderboard.mockResolvedValue(finalLeaderboard);
      
      render(<CompetitionManager />);
      
      await waitFor(() => {
        expect(screen.getByText('Ended')).toBeInTheDocument();
        expect(screen.getByText('View Results')).toBeInTheDocument();
      });
      
      // View final results
      const viewResultsButton = screen.getByText('View Results');
      fireEvent.click(viewResultsButton);
      
      await waitFor(() => {
        expect(screen.getByText('Final Results')).toBeInTheDocument();
        expect(screen.getByText('🏆 Alice Johnson')).toBeInTheDocument();
        expect(screen.getByText('🥈 Bob Smith')).toBeInTheDocument();
      });
    });

    it('should handle prize distribution', async () => {
      const completedCompetition = {
        ...mockCompetition,
        status: 'completed' as const,
        prizesDistributed: true
      };
      
      mockGamificationService.getActiveCompetitions.mockResolvedValue([completedCompetition]);
      
      // Mock user winning a prize
      mockGamificationService.getUserCompetitionStatus.mockResolvedValue({
        ...mockUserStatus,
        isParticipating: true,
        finalRank: 2,
        prizeAwarded: {
          type: 'points',
          value: 500,
          rarity: 'epic'
        }
      });
      
      render(<CompetitionManager userId="user-123" />);
      
      await waitFor(() => {
        expect(screen.getByText('Congratulations!')).toBeInTheDocument();
        expect(screen.getByText('You finished 2nd place')).toBeInTheDocument();
        expect(screen.getByText('500 points awarded')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle competition join failures', async () => {
      mockGamificationService.joinCompetition.mockRejectedValue(
        new Error('Competition is full')
      );
      
      render(<CompetitionManager userId="user-123" />);
      
      await waitFor(() => {
        expect(screen.getByText('Join Competition')).toBeInTheDocument();
      });
      
      const joinButton = screen.getByText('Join Competition');
      fireEvent.click(joinButton);
      
      await waitFor(() => {
        expect(screen.getByText('Failed to join competition')).toBeInTheDocument();
        expect(screen.getByText('Competition is full')).toBeInTheDocument();
      });
    });

    it('should handle challenge submission failures', async () => {
      mockChallengeRepository.submitSolution.mockRejectedValue(
        new Error('Submission timeout')
      );
      
      mockGamificationService.getUserCompetitionStatus.mockResolvedValue({
        ...mockUserStatus,
        isParticipating: true
      });
      
      render(<CompetitionManager userId="user-123" showChallenges={true} />);
      
      await waitFor(() => {
        const startButton = screen.getAllByText('Start Challenge')[0];
        fireEvent.click(startButton);
      });
      
      await waitFor(() => {
        const codeEditor = screen.getByRole('textbox');
        fireEvent.change(codeEditor, { target: { value: 'test code' } });
        
        const submitButton = screen.getByText('Submit Solution');
        fireEvent.click(submitButton);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Submission failed')).toBeInTheDocument();
        expect(screen.getByText('Submission timeout')).toBeInTheDocument();
        expect(screen.getByText('Try Again')).toBeInTheDocument();
      });
    });

    it('should handle leaderboard service outages', async () => {
      mockLeaderboardService.getLeaderboard.mockRejectedValue(
        new Error('Leaderboard service unavailable')
      );
      
      render(<Leaderboard competitionId="comp-123" />);
      
      await waitFor(() => {
        expect(screen.getByText('Leaderboard Error')).toBeInTheDocument();
        expect(screen.getByText('Leaderboard service unavailable')).toBeInTheDocument();
      });
      
      // Test retry functionality
      mockLeaderboardService.getLeaderboard.mockResolvedValue(mockLeaderboardData);
      
      const retryButton = screen.getByText('Try Again');
      fireEvent.click(retryButton);
      
      await waitFor(() => {
        expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
      });
    });

    it('should handle network connectivity issues', async () => {
      // Simulate network error
      mockGamificationService.getActiveCompetitions.mockRejectedValue(
        new Error('Network error')
      );
      
      render(<CompetitionManager />);
      
      await waitFor(() => {
        expect(screen.getByText('Connection Error')).toBeInTheDocument();
        expect(screen.getByText(/check your internet connection/i)).toBeInTheDocument();
      });
      
      // Test automatic retry
      mockGamificationService.getActiveCompetitions.mockResolvedValue([mockCompetition]);
      
      // Simulate network recovery
      vi.advanceTimersByTime(5000);
      
      await waitFor(() => {
        expect(screen.getByText('Weekly JavaScript Challenge')).toBeInTheDocument();
      });
    });
  });
});