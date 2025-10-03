/**
 * @fileOverview Unit tests for Leaderboard component
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Leaderboard } from '../Leaderboard';
import { LeaderboardService } from '@/lib/gamification/leaderboard-service';
import { PerformanceMonitor, RealTimeSync } from '@/lib/analytics/performance-optimization';

// Mock dependencies
vi.mock('@/lib/gamification/leaderboard-service');
vi.mock('@/lib/analytics/performance-optimization');

const mockLeaderboardService = vi.mocked(LeaderboardService);
const mockPerformanceMonitor = vi.mocked(PerformanceMonitor);
const mockRealTimeSync = vi.mocked(RealTimeSync);

const mockLeaderboardData = {
  entries: [
    {
      userId: 'user1',
      username: 'developer1',
      displayName: 'John Doe',
      rank: 1,
      totalPoints: 2500,
      badgeCount: 15,
      rareBadgeCount: 3,
      skillLevels: { JavaScript: 4, React: 3, TypeScript: 2 },
      lastActivity: new Date('2024-01-15'),
      rankChange: 'up' as const,
      isAnonymized: false
    },
    {
      userId: 'user2',
      username: 'anonymous_user_123',
      displayName: 'Anonymous User',
      rank: 2,
      totalPoints: 2200,
      badgeCount: 12,
      rareBadgeCount: 2,
      skillLevels: { Python: 4, JavaScript: 3 },
      lastActivity: new Date('2024-01-14'),
      rankChange: 'same' as const,
      isAnonymized: true
    },
    {
      userId: 'user3',
      username: 'developer3',
      displayName: 'Jane Smith',
      rank: 3,
      totalPoints: 1800,
      badgeCount: 8,
      rareBadgeCount: 1,
      skillLevels: { React: 4, CSS: 3 },
      lastActivity: new Date('2024-01-13'),
      rankChange: 'down' as const,
      isAnonymized: false
    }
  ],
  totalParticipants: 150,
  lastUpdated: new Date('2024-01-15T10:30:00Z'),
  metadata: {
    type: 'global',
    timeframe: 'weekly'
  }
};

const mockUserRanks = {
  global: 5,
  peerGroup: 3,
  skillBased: {
    JavaScript: 4,
    React: 6
  },
  competitions: {
    'weekly-challenge': 2
  }
};

describe('Leaderboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mocks
    mockLeaderboardService.getLeaderboard.mockResolvedValue(mockLeaderboardData);
    mockLeaderboardService.getUserRanks.mockResolvedValue(mockUserRanks);
    mockPerformanceMonitor.startOperation.mockReturnValue(Date.now());
    mockPerformanceMonitor.endOperation.mockImplementation(() => {});
    mockRealTimeSync.subscribeToUpdates.mockReturnValue(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render leaderboard with default props', async () => {
      render(<Leaderboard />);
      
      expect(screen.getByText('Leaderboard')).toBeInTheDocument();
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('2,500')).toBeInTheDocument();
      });
    });

    it('should show loading state initially', () => {
      render(<Leaderboard />);
      
      expect(screen.getByText('Leaderboard')).toBeInTheDocument();
      // Should show loading skeletons
      expect(document.querySelectorAll('.animate-pulse')).toHaveLength(10);
    });

    it('should display user rankings when userId is provided', async () => {
      render(<Leaderboard userId="test-user" />);
      
      await waitFor(() => {
        expect(screen.getByText('Your Rankings')).toBeInTheDocument();
        expect(screen.getByText('#5')).toBeInTheDocument(); // Global rank
        expect(screen.getByText('#3')).toBeInTheDocument(); // Peer group rank
      });
    });
  });

  describe('Leaderboard Data Display', () => {
    it('should display leaderboard entries correctly', async () => {
      render(<Leaderboard />);
      
      await waitFor(() => {
        // Check first place entry
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('2,500')).toBeInTheDocument();
        expect(screen.getByText('15 badges • 3 rare')).toBeInTheDocument();
        
        // Check anonymized entry
        expect(screen.getByText('Anonymous User')).toBeInTheDocument();
        expect(screen.getByText('Anonymous')).toBeInTheDocument();
      });
    });

    it('should show rank icons for top 3 positions', async () => {
      render(<Leaderboard />);
      
      await waitFor(() => {
        // Trophy, Medal, and Award icons should be present
        const icons = document.querySelectorAll('svg');
        expect(icons.length).toBeGreaterThan(3);
      });
    });

    it('should display skill badges for each user', async () => {
      render(<Leaderboard />);
      
      await waitFor(() => {
        expect(screen.getByText('JavaScript L4')).toBeInTheDocument();
        expect(screen.getByText('React L3')).toBeInTheDocument();
        expect(screen.getByText('Python L4')).toBeInTheDocument();
      });
    });

    it('should show privacy protection badge when anonymized', async () => {
      render(<Leaderboard showAnonymized={true} />);
      
      await waitFor(() => {
        expect(screen.getByText('Privacy Protected')).toBeInTheDocument();
      });
    });
  });

  describe('Filtering and Controls', () => {
    it('should allow changing leaderboard type', async () => {
      render(<Leaderboard />);
      
      await waitFor(() => {
        const typeSelect = screen.getByDisplayValue('Global');
        fireEvent.click(typeSelect);
      });
      
      expect(screen.getByText('By Skill')).toBeInTheDocument();
      expect(screen.getByText('Peer Group')).toBeInTheDocument();
      expect(screen.getByText('Competition')).toBeInTheDocument();
    });

    it('should show skill selector when skill-based type is selected', async () => {
      render(<Leaderboard initialType="skill_based" />);
      
      await waitFor(() => {
        expect(screen.getByText('Select skill')).toBeInTheDocument();
      });
    });

    it('should allow changing timeframe', async () => {
      render(<Leaderboard />);
      
      await waitFor(() => {
        const timeframeSelect = screen.getByDisplayValue('Weekly');
        fireEvent.click(timeframeSelect);
      });
      
      expect(screen.getByText('Daily')).toBeInTheDocument();
      expect(screen.getByText('Monthly')).toBeInTheDocument();
      expect(screen.getByText('All Time')).toBeInTheDocument();
    });

    it('should refetch data when filters change', async () => {
      render(<Leaderboard />);
      
      await waitFor(() => {
        expect(mockLeaderboardService.getLeaderboard).toHaveBeenCalledTimes(1);
      });
      
      // Change type to skill-based
      const typeSelect = screen.getByDisplayValue('Global');
      fireEvent.click(typeSelect);
      fireEvent.click(screen.getByText('By Skill'));
      
      await waitFor(() => {
        expect(mockLeaderboardService.getLeaderboard).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Real-time Updates', () => {
    it('should subscribe to real-time updates when autoRefresh is enabled', async () => {
      render(<Leaderboard autoRefresh={true} />);
      
      await waitFor(() => {
        expect(mockRealTimeSync.subscribeToUpdates).toHaveBeenCalledWith(
          expect.stringContaining('leaderboard_'),
          expect.any(Function),
          expect.objectContaining({ batchSize: 5, batchDelay: 2000 })
        );
      });
    });

    it('should not subscribe to updates when autoRefresh is disabled', async () => {
      render(<Leaderboard autoRefresh={false} />);
      
      await waitFor(() => {
        expect(mockRealTimeSync.subscribeToUpdates).not.toHaveBeenCalled();
      });
    });

    it('should handle real-time update callbacks', async () => {
      let updateCallback: (updates: any[]) => void = () => {};
      
      mockRealTimeSync.subscribeToUpdates.mockImplementation((key, callback, options) => {
        updateCallback = callback;
        return () => {};
      });
      
      render(<Leaderboard autoRefresh={true} />);
      
      await waitFor(() => {
        expect(mockLeaderboardService.getLeaderboard).toHaveBeenCalledTimes(1);
      });
      
      // Simulate real-time update
      updateCallback([{ type: 'rank_change', userId: 'user1' }]);
      
      await waitFor(() => {
        expect(mockLeaderboardService.getLeaderboard).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message when leaderboard fetch fails', async () => {
      mockLeaderboardService.getLeaderboard.mockRejectedValue(new Error('Network error'));
      
      render(<Leaderboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Leaderboard Error')).toBeInTheDocument();
        expect(screen.getByText('Network error')).toBeInTheDocument();
        expect(screen.getByText('Try Again')).toBeInTheDocument();
      });
    });

    it('should allow retry after error', async () => {
      mockLeaderboardService.getLeaderboard
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(mockLeaderboardData);
      
      render(<Leaderboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByText('Try Again'));
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
    });

    it('should handle empty leaderboard data gracefully', async () => {
      mockLeaderboardService.getLeaderboard.mockResolvedValue({
        ...mockLeaderboardData,
        entries: []
      });
      
      render(<Leaderboard />);
      
      await waitFor(() => {
        expect(screen.getByText('No leaderboard data available')).toBeInTheDocument();
      });
    });
  });

  describe('Performance Monitoring', () => {
    it('should track performance metrics for leaderboard operations', async () => {
      render(<Leaderboard userId="test-user" />);
      
      await waitFor(() => {
        expect(mockPerformanceMonitor.startOperation).toHaveBeenCalledWith(
          'fetchLeaderboard',
          'test-user'
        );
        expect(mockPerformanceMonitor.endOperation).toHaveBeenCalledWith(
          'fetchLeaderboard',
          expect.any(Number),
          false,
          expect.any(Number),
          'test-user'
        );
      });
    });

    it('should track performance on error', async () => {
      mockLeaderboardService.getLeaderboard.mockRejectedValue(new Error('Test error'));
      
      render(<Leaderboard userId="test-user" />);
      
      await waitFor(() => {
        expect(mockPerformanceMonitor.endOperation).toHaveBeenCalledWith(
          'fetchLeaderboard',
          expect.any(Number),
          false,
          0,
          'test-user'
        );
      });
    });
  });

  describe('User Highlighting', () => {
    it('should highlight current user in leaderboard', async () => {
      render(<Leaderboard userId="user1" />);
      
      await waitFor(() => {
        const userEntry = screen.getByText('John Doe').closest('div');
        expect(userEntry).toHaveClass('bg-primary/10');
      });
    });

    it('should not highlight when user is not in current leaderboard', async () => {
      render(<Leaderboard userId="user999" />);
      
      await waitFor(() => {
        const entries = document.querySelectorAll('.bg-primary\\/10');
        expect(entries).toHaveLength(0);
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', async () => {
      render(<Leaderboard />);
      
      await waitFor(() => {
        // Check for proper heading structure
        expect(screen.getByRole('heading', { name: /leaderboard/i })).toBeInTheDocument();
        
        // Check for proper button roles
        const selects = screen.getAllByRole('combobox');
        expect(selects.length).toBeGreaterThan(0);
      });
    });

    it('should support keyboard navigation', async () => {
      render(<Leaderboard />);
      
      await waitFor(() => {
        const typeSelect = screen.getByDisplayValue('Global');
        expect(typeSelect).toBeInTheDocument();
        
        // Should be focusable
        typeSelect.focus();
        expect(document.activeElement).toBe(typeSelect);
      });
    });
  });

  describe('Responsive Design', () => {
    it('should hide skill badges on mobile screens', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 500,
      });
      
      render(<Leaderboard />);
      
      await waitFor(() => {
        const skillBadges = document.querySelectorAll('.hidden.md\\:flex');
        expect(skillBadges.length).toBeGreaterThan(0);
      });
    });

    it('should stack controls vertically on small screens', async () => {
      render(<Leaderboard />);
      
      await waitFor(() => {
        const controlsContainer = document.querySelector('.flex.flex-col.sm\\:flex-row');
        expect(controlsContainer).toBeInTheDocument();
      });
    });
  });
});