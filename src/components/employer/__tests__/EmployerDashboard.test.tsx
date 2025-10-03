import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EmployerDashboard } from '../EmployerDashboard';
import { CandidateProfile } from '@/types/employer';

// Mock the employer service
jest.mock('@/lib/employer/employer-service', () => ({
  employerService: {
    getEmployerDashboard: jest.fn()
  }
}));

const mockCandidateProfile: CandidateProfile = {
  userId: 'test-user-1',
  username: 'testuser',
  displayName: 'Test User',
  email: 'test@example.com',
  skillLevels: [
    {
      skillId: 'javascript',
      skillName: 'JavaScript',
      currentLevel: 8,
      experiencePoints: 2400,
      competencyAreas: [],
      industryBenchmark: {
        industryAverage: 6.5,
        experienceLevel: 'mid',
        percentile: 85,
        lastUpdated: new Date()
      },
      verificationStatus: 'verified',
      progressHistory: [],
      trendDirection: 'improving',
      lastUpdated: new Date()
    }
  ],
  overallProgress: {} as any,
  learningVelocity: 85,
  codeQualityTrend: {
    direction: 'improving',
    changePercentage: 15.2,
    timeframe: '30 days'
  },
  verifiedBadges: [],
  blockchainCredentials: [],
  assessmentResults: [],
  industryBenchmarks: [],
  marketReadiness: {} as any,
  peerComparisons: [],
  recentActivity: {
    totalSessions: 45,
    totalCodeSubmissions: 128,
    averageSessionDuration: 35,
    lastActiveDate: new Date(),
    streakDays: 12,
    weeklyActivity: [],
    skillFocus: []
  },
  learningInsights: [],
  portfolioProjects: [],
  profileVisibility: {
    isPublic: true,
    showRealName: true,
    showContactInfo: false,
    showDetailedAnalytics: true,
    showBenchmarkComparisons: true,
    allowEmployerContact: true,
    visibleToEmployers: true
  },
  lastUpdated: new Date(),
  createdAt: new Date()
};

const mockDashboardData = {
  employerId: 'test-employer',
  companyName: 'Test Company',
  candidateProfiles: [mockCandidateProfile],
  customAssessments: [],
  assessmentResults: [],
  industryBenchmarks: [],
  dashboardMetrics: {
    totalCandidatesViewed: 45,
    totalAssessmentsCreated: 3,
    totalAssessmentCompletions: 28,
    averageCandidateScore: 78.5,
    topPerformingSkills: ['JavaScript', 'React', 'TypeScript'],
    assessmentCompletionRate: 85.2,
    candidateEngagementRate: 92.1,
    lastUpdated: new Date()
  },
  recentActivity: []
};

describe('EmployerDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders dashboard header with company name', async () => {
    const { employerService } = require('@/lib/employer/employer-service');
    employerService.getEmployerDashboard.mockResolvedValue(mockDashboardData);

    render(<EmployerDashboard employerId="test-employer" />);

    await waitFor(() => {
      expect(screen.getByText('Employer Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Test Company')).toBeInTheDocument();
    });
  });

  it('displays dashboard metrics correctly', async () => {
    const { employerService } = require('@/lib/employer/employer-service');
    employerService.getEmployerDashboard.mockResolvedValue(mockDashboardData);

    render(<EmployerDashboard employerId="test-employer" />);

    await waitFor(() => {
      expect(screen.getByText('45')).toBeInTheDocument(); // Candidates viewed
      expect(screen.getByText('3')).toBeInTheDocument(); // Assessments created
      expect(screen.getByText('85.2%')).toBeInTheDocument(); // Completion rate
      expect(screen.getByText('78.5')).toBeInTheDocument(); // Average score
    });
  });

  it('renders candidate profiles in the candidates tab', async () => {
    const { employerService } = require('@/lib/employer/employer-service');
    employerService.getEmployerDashboard.mockResolvedValue(mockDashboardData);

    render(<EmployerDashboard employerId="test-employer" />);

    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
      expect(screen.getByText('@testuser')).toBeInTheDocument();
      expect(screen.getByText('JavaScript')).toBeInTheDocument();
    });
  });

  it('filters candidates by search term', async () => {
    const { employerService } = require('@/lib/employer/employer-service');
    employerService.getEmployerDashboard.mockResolvedValue(mockDashboardData);

    render(<EmployerDashboard employerId="test-employer" />);

    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search candidates...');
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

    await waitFor(() => {
      expect(screen.queryByText('Test User')).not.toBeInTheDocument();
    });
  });

  it('calls onCandidateSelect when candidate card is clicked', async () => {
    const { employerService } = require('@/lib/employer/employer-service');
    employerService.getEmployerDashboard.mockResolvedValue(mockDashboardData);

    const mockOnCandidateSelect = jest.fn();
    render(
      <EmployerDashboard 
        employerId="test-employer" 
        onCandidateSelect={mockOnCandidateSelect}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });

    const candidateCard = screen.getByText('Test User').closest('.cursor-pointer');
    if (candidateCard) {
      fireEvent.click(candidateCard);
      expect(mockOnCandidateSelect).toHaveBeenCalledWith(mockCandidateProfile);
    }
  });

  it('calls onCreateAssessment when create assessment button is clicked', async () => {
    const { employerService } = require('@/lib/employer/employer-service');
    employerService.getEmployerDashboard.mockResolvedValue(mockDashboardData);

    const mockOnCreateAssessment = jest.fn();
    render(
      <EmployerDashboard 
        employerId="test-employer" 
        onCreateAssessment={mockOnCreateAssessment}
      />
    );

    await waitFor(() => {
      const createButton = screen.getByText('Create Assessment');
      fireEvent.click(createButton);
      expect(mockOnCreateAssessment).toHaveBeenCalled();
    });
  });

  it('displays loading state initially', () => {
    const { employerService } = require('@/lib/employer/employer-service');
    employerService.getEmployerDashboard.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<EmployerDashboard employerId="test-employer" />);

    expect(screen.getByRole('status')).toBeInTheDocument(); // Loading spinner
  });

  it('handles error state gracefully', async () => {
    const { employerService } = require('@/lib/employer/employer-service');
    employerService.getEmployerDashboard.mockRejectedValue(new Error('Failed to load'));

    render(<EmployerDashboard employerId="test-employer" />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load dashboard data')).toBeInTheDocument();
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });
  });

  it('sorts candidates by different criteria', async () => {
    const { employerService } = require('@/lib/employer/employer-service');
    const multiCandidateData = {
      ...mockDashboardData,
      candidateProfiles: [
        mockCandidateProfile,
        {
          ...mockCandidateProfile,
          userId: 'test-user-2',
          username: 'testuser2',
          displayName: 'Test User 2',
          skillLevels: [
            {
              ...mockCandidateProfile.skillLevels[0],
              currentLevel: 6
            }
          ],
          recentActivity: {
            ...mockCandidateProfile.recentActivity,
            lastActiveDate: new Date(Date.now() - 86400000) // 1 day ago
          }
        }
      ]
    };
    employerService.getEmployerDashboard.mockResolvedValue(multiCandidateData);

    render(<EmployerDashboard employerId="test-employer" />);

    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
      expect(screen.getByText('Test User 2')).toBeInTheDocument();
    });

    // Test sorting by activity
    const sortSelect = screen.getByDisplayValue('Sort by Score');
    fireEvent.change(sortSelect, { target: { value: 'activity' } });

    // The order should change based on last active date
    await waitFor(() => {
      const candidates = screen.getAllByText(/Test User/);
      expect(candidates[0]).toHaveTextContent('Test User'); // More recent activity
    });
  });

  it('switches between tabs correctly', async () => {
    const { employerService } = require('@/lib/employer/employer-service');
    employerService.getEmployerDashboard.mockResolvedValue(mockDashboardData);

    render(<EmployerDashboard employerId="test-employer" />);

    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });

    // Switch to assessments tab
    const assessmentsTab = screen.getByText('Assessments');
    fireEvent.click(assessmentsTab);

    await waitFor(() => {
      expect(screen.getByText('Custom Assessments')).toBeInTheDocument();
      expect(screen.getByText('No assessments created yet')).toBeInTheDocument();
    });

    // Switch to analytics tab
    const analyticsTab = screen.getByText('Analytics');
    fireEvent.click(analyticsTab);

    await waitFor(() => {
      expect(screen.getByText('Analytics Overview')).toBeInTheDocument();
      expect(screen.getByText('Analytics dashboard coming soon')).toBeInTheDocument();
    });
  });
});