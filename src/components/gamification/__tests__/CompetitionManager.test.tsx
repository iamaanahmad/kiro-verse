/**
 * @fileOverview Unit tests for CompetitionManager component
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { CompetitionManager } from '../CompetitionManager';

// Mock the gamification service
vi.mock('@/lib/gamification/gamification-service', () => ({
  GamificationService: {
    getActiveCompetitions: vi.fn(),
    joinCompetition: vi.fn(),
    leaveCompetition: vi.fn(),
    getCompetitionLeaderboard: vi.fn(),
    getUserCompetitionStatus: vi.fn(),
    createCompetition: vi.fn(),
    updateCompetition: vi.fn(),
    endCompetition: vi.fn()
  }
}));

// Mock the challenge service
vi.mock('@/lib/challenges/challenge-repository', () => ({
  ChallengeRepository: {
    getChallengesByCompetition: vi.fn()
  }
}));

import { GamificationService } from '@/lib/gamification/gamification-service';
import { ChallengeRepository } from '@/lib/challenges/challenge-repository';

const mockGamificationService = vi.mocked(GamificationService);
const mockChallengeRepository = vi.mocked(ChallengeRepository);

const mockCompetitions = [
  {
    competitionId: 'comp1',
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
  },
  {
    competitionId: 'comp2',
    title: 'Daily Code Golf',
    description: 'Write the shortest code possible',
    type: 'daily' as const,
    status: 'upcoming' as const,
    startDate: new Date('2024-01-16T00:00:00Z'),
    endDate: new Date('2024-01-16T23:59:59Z'),
    maxParticipants: 50,
    currentParticipants: 0,
    prizes: [
      { position: 1, type: 'badge', value: 'Code Golf Master', rarity: 'rare' }
    ],
    rules: ['Shortest working solution wins'],
    eligibilityRequirements: [],
    createdBy: 'admin',
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-15T00:00:00Z'),
    tags: ['code-golf', 'optimization'],
    difficulty: 'advanced' as const,
    category: 'creative'
  }
];

const mockLeaderboard = [
  {
    userId: 'user1',
    username: 'developer1',
    displayName: 'John Doe',
    rank: 1,
    totalPoints: 850,
    challengesCompleted: 3,
    averageScore: 95,
    lastSubmission: new Date('2024-01-15T14:30:00Z'),
    badges: ['JavaScript Expert', 'Speed Demon']
  },
  {
    userId: 'user2',
    username: 'developer2',
    displayName: 'Jane Smith',
    rank: 2,
    totalPoints: 720,
    challengesCompleted: 3,
    averageScore: 88,
    lastSubmission: new Date('2024-01-15T13:45:00Z'),
    badges: ['Algorithm Master']
  }
];

const mockUserStatus = {
  isParticipating: true,
  joinedAt: new Date('2024-01-15T10:00:00Z'),
  currentRank: 5,
  totalPoints: 450,
  challengesCompleted: 2,
  challengesRemaining: 1,
  timeRemaining: 3600000, // 1 hour in milliseconds
  eligibilityStatus: 'eligible' as const,
  canJoin: true
};

describe('CompetitionManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mocks
    mockGamificationService.getActiveCompetitions.mockResolvedValue(mockCompetitions);
    mockGamificationService.getCompetitionLeaderboard.mockResolvedValue(mockLeaderboard);
    mockGamificationService.getUserCompetitionStatus.mockResolvedValue(mockUserStatus);
    mockGamificationService.joinCompetition.mockResolvedValue({ success: true });
    mockGamificationService.leaveCompetition.mockResolvedValue({ success: true });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render competition manager with default props', async () => {
      render(<CompetitionManager />);
      
      expect(screen.getByText('Competitions')).toBeInTheDocument();
      
      await waitFor(() => {
        expect(screen.getByText('Weekly JavaScript Challenge')).toBeInTheDocument();
        expect(screen.getByText('Daily Code Golf')).toBeInTheDocument();
      });
    });

    it('should show loading state initially', () => {
      render(<CompetitionManager />);
      
      expect(screen.getByText('Competitions')).toBeInTheDocument();
      // Should show loading skeletons
      expect(document.querySelectorAll('.animate-pulse')).toHaveLength(3);
    });

    it('should display user status when userId is provided', async () => {
      render(<CompetitionManager userId="test-user" />);
      
      await waitFor(() => {
        expect(mockGamificationService.getUserCompetitionStatus).toHaveBeenCalledWith(
          'test-user',
          'comp1'
        );
      });
    });
  });

  describe('Competition Display', () => {
    it('should display competition details correctly', async () => {
      render(<CompetitionManager />);
      
      await waitFor(() => {
        // Check first competition
        expect(screen.getByText('Weekly JavaScript Challenge')).toBeInTheDocument();
        expect(screen.getByText('Test your JavaScript skills in this weekly competition')).toBeInTheDocument();
        expect(screen.getByText('45/100 participants')).toBeInTheDocument();
        expect(screen.getByText('Active')).toBeInTheDocument();
        
        // Check second competition
        expect(screen.getByText('Daily Code Golf')).toBeInTheDocument();
        expect(screen.getByText('Upcoming')).toBeInTheDocument();
      });
    });

    it('should show competition prizes', async () => {
      render(<CompetitionManager />);
      
      await waitFor(() => {
        expect(screen.getByText('JavaScript Champion')).toBeInTheDocument();
        expect(screen.getByText('500 points')).toBeInTheDocument();
        expect(screen.getByText('250 points')).toBeInTheDocument();
      });
    });

    it('should display competition rules and requirements', async () => {
      render(<CompetitionManager />);
      
      await waitFor(() => {
        expect(screen.getByText('Complete all challenges within time limit')).toBeInTheDocument();
        expect(screen.getByText('Minimum JavaScript skill level 2')).toBeInTheDocument();
      });
    });

    it('should show time remaining for active competitions', async () => {
      render(<CompetitionManager />);
      
      await waitFor(() => {
        // Should show some form of time display
        expect(document.querySelector('[data-testid="time-remaining"]')).toBeInTheDocument();
      });
    });
  });

  describe('Competition Participation', () => {
    it('should allow joining a competition', async () => {
      render(<CompetitionManager userId="test-user" />);
      
      await waitFor(() => {
        const joinButton = screen.getByText('Join Competition');
        fireEvent.click(joinButton);
      });
      
      await waitFor(() => {
        expect(mockGamificationService.joinCompetition).toHaveBeenCalledWith(
          'test-user',
          'comp1'
        );
      });
    });

    it('should allow leaving a competition', async () => {
      mockGamificationService.getUserCompetitionStatus.mockResolvedValue({
        ...mockUserStatus,
        isParticipating: true
      });
      
      render(<CompetitionManager userId="test-user" />);
      
      await waitFor(() => {
        const leaveButton = screen.getByText('Leave Competition');
        fireEvent.click(leaveButton);
      });
      
      await waitFor(() => {
        expect(mockGamificationService.leaveCompetition).toHaveBeenCalledWith(
          'test-user',
          'comp1'
        );
      });
    });

    it('should show different states based on participation status', async () => {
      // Test not participating
      mockGamificationService.getUserCompetitionStatus.mockResolvedValue({
        ...mockUserStatus,
        isParticipating: false,
        canJoin: true
      });
      
      render(<CompetitionManager userId="test-user" />);
      
      await waitFor(() => {
        expect(screen.getByText('Join Competition')).toBeInTheDocument();
      });
      
      // Test participating
      mockGamificationService.getUserCompetitionStatus.mockResolvedValue({
        ...mockUserStatus,
        isParticipating: true
      });
      
      render(<CompetitionManager userId="test-user" />);
      
      await waitFor(() => {
        expect(screen.getByText('Leave Competition')).toBeInTheDocument();
      });
    });

    it('should disable join button when user is not eligible', async () => {
      mockGamificationService.getUserCompetitionStatus.mockResolvedValue({
        ...mockUserStatus,
        isParticipating: false,
        canJoin: false,
        eligibilityStatus: 'insufficient_skill_level'
      });
      
      render(<CompetitionManager userId="test-user" />);
      
      await waitFor(() => {
        const joinButton = screen.getByText('Not Eligible');
        expect(joinButton).toBeDisabled();
      });
    });
  });

  describe('Competition Leaderboard', () => {
    it('should display competition leaderboard', async () => {
      render(<CompetitionManager userId="test-user" showLeaderboard={true} />);
      
      await waitFor(() => {
        expect(screen.getByText('Leaderboard')).toBeInTheDocument();
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
        expect(screen.getByText('850')).toBeInTheDocument();
        expect(screen.getByText('720')).toBeInTheDocument();
      });
    });

    it('should show user rank in leaderboard', async () => {
      render(<CompetitionManager userId="test-user" showLeaderboard={true} />);
      
      await waitFor(() => {
        expect(screen.getByText('#1')).toBeInTheDocument();
        expect(screen.getByText('#2')).toBeInTheDocument();
      });
    });

    it('should display challenge completion status', async () => {
      render(<CompetitionManager userId="test-user" showLeaderboard={true} />);
      
      await waitFor(() => {
        expect(screen.getByText('3 challenges')).toBeInTheDocument();
        expect(screen.getByText('95% avg')).toBeInTheDocument();
      });
    });
  });

  describe('Competition Filtering', () => {
    it('should filter competitions by status', async () => {
      render(<CompetitionManager />);
      
      await waitFor(() => {
        const statusFilter = screen.getByDisplayValue('All');
        fireEvent.click(statusFilter);
        fireEvent.click(screen.getByText('Active'));
      });
      
      // Should only show active competitions
      await waitFor(() => {
        expect(screen.getByText('Weekly JavaScript Challenge')).toBeInTheDocument();
        expect(screen.queryByText('Daily Code Golf')).not.toBeInTheDocument();
      });
    });

    it('should filter competitions by type', async () => {
      render(<CompetitionManager />);
      
      await waitFor(() => {
        const typeFilter = screen.getByDisplayValue('All Types');
        fireEvent.click(typeFilter);
        fireEvent.click(screen.getByText('Weekly'));
      });
      
      // Should only show weekly competitions
      await waitFor(() => {
        expect(screen.getByText('Weekly JavaScript Challenge')).toBeInTheDocument();
        expect(screen.queryByText('Daily Code Golf')).not.toBeInTheDocument();
      });
    });

    it('should filter competitions by difficulty', async () => {
      render(<CompetitionManager />);
      
      await waitFor(() => {
        const difficultyFilter = screen.getByDisplayValue('All Levels');
        fireEvent.click(difficultyFilter);
        fireEvent.click(screen.getByText('Intermediate'));
      });
      
      // Should only show intermediate competitions
      await waitFor(() => {
        expect(screen.getByText('Weekly JavaScript Challenge')).toBeInTheDocument();
        expect(screen.queryByText('Daily Code Golf')).not.toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message when competitions fetch fails', async () => {
      mockGamificationService.getActiveCompetitions.mockRejectedValue(
        new Error('Network error')
      );
      
      render(<CompetitionManager />);
      
      await waitFor(() => {
        expect(screen.getByText('Failed to load competitions')).toBeInTheDocument();
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });

    it('should handle join competition errors', async () => {
      mockGamificationService.joinCompetition.mockRejectedValue(
        new Error('Competition is full')
      );
      
      render(<CompetitionManager userId="test-user" />);
      
      await waitFor(() => {
        const joinButton = screen.getByText('Join Competition');
        fireEvent.click(joinButton);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Failed to join competition')).toBeInTheDocument();
      });
    });

    it('should handle leave competition errors', async () => {
      mockGamificationService.getUserCompetitionStatus.mockResolvedValue({
        ...mockUserStatus,
        isParticipating: true
      });
      
      mockGamificationService.leaveCompetition.mockRejectedValue(
        new Error('Cannot leave after submission')
      );
      
      render(<CompetitionManager userId="test-user" />);
      
      await waitFor(() => {
        const leaveButton = screen.getByText('Leave Competition');
        fireEvent.click(leaveButton);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Failed to leave competition')).toBeInTheDocument();
      });
    });
  });

  describe('Real-time Updates', () => {
    it('should refresh data at specified intervals', async () => {
      render(<CompetitionManager refreshInterval={1000} />);
      
      await waitFor(() => {
        expect(mockGamificationService.getActiveCompetitions).toHaveBeenCalledTimes(1);
      });
      
      // Fast-forward time
      vi.advanceTimersByTime(1000);
      
      await waitFor(() => {
        expect(mockGamificationService.getActiveCompetitions).toHaveBeenCalledTimes(2);
      });
    });

    it('should update participant counts in real-time', async () => {
      render(<CompetitionManager userId="test-user" />);
      
      await waitFor(() => {
        expect(screen.getByText('45/100 participants')).toBeInTheDocument();
      });
      
      // Simulate real-time update
      mockGamificationService.getActiveCompetitions.mockResolvedValue([
        {
          ...mockCompetitions[0],
          currentParticipants: 46
        },
        mockCompetitions[1]
      ]);
      
      vi.advanceTimersByTime(5000);
      
      await waitFor(() => {
        expect(screen.getByText('46/100 participants')).toBeInTheDocument();
      });
    });
  });

  describe('Competition Creation (Admin)', () => {
    it('should show create competition button for admins', async () => {
      render(<CompetitionManager userId="admin-user" isAdmin={true} />);
      
      await waitFor(() => {
        expect(screen.getByText('Create Competition')).toBeInTheDocument();
      });
    });

    it('should open competition creation form', async () => {
      render(<CompetitionManager userId="admin-user" isAdmin={true} />);
      
      await waitFor(() => {
        const createButton = screen.getByText('Create Competition');
        fireEvent.click(createButton);
      });
      
      expect(screen.getByText('Create New Competition')).toBeInTheDocument();
      expect(screen.getByLabelText('Title')).toBeInTheDocument();
      expect(screen.getByLabelText('Description')).toBeInTheDocument();
    });

    it('should handle competition creation', async () => {
      mockGamificationService.createCompetition.mockResolvedValue({
        competitionId: 'new-comp',
        success: true
      });
      
      render(<CompetitionManager userId="admin-user" isAdmin={true} />);
      
      await waitFor(() => {
        const createButton = screen.getByText('Create Competition');
        fireEvent.click(createButton);
      });
      
      // Fill form
      fireEvent.change(screen.getByLabelText('Title'), {
        target: { value: 'New Competition' }
      });
      fireEvent.change(screen.getByLabelText('Description'), {
        target: { value: 'Test competition' }
      });
      
      fireEvent.click(screen.getByText('Create'));
      
      await waitFor(() => {
        expect(mockGamificationService.createCompetition).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'New Competition',
            description: 'Test competition'
          })
        );
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', async () => {
      render(<CompetitionManager />);
      
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /competitions/i })).toBeInTheDocument();
        
        const buttons = screen.getAllByRole('button');
        expect(buttons.length).toBeGreaterThan(0);
      });
    });

    it('should support keyboard navigation', async () => {
      render(<CompetitionManager userId="test-user" />);
      
      await waitFor(() => {
        const joinButton = screen.getByText('Join Competition');
        joinButton.focus();
        expect(document.activeElement).toBe(joinButton);
      });
    });

    it('should have proper focus management in modals', async () => {
      render(<CompetitionManager userId="admin-user" isAdmin={true} />);
      
      await waitFor(() => {
        const createButton = screen.getByText('Create Competition');
        fireEvent.click(createButton);
      });
      
      // Focus should move to the modal
      const titleInput = screen.getByLabelText('Title');
      expect(document.activeElement).toBe(titleInput);
    });
  });
});