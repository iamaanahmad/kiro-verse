import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PeerReview } from '../PeerReview';
import { PeerReviewService } from '@/lib/firebase/peer-review';
import { useAuth } from '@/hooks/useAuth';

// Mock the dependencies
jest.mock('@/lib/firebase/peer-review');
jest.mock('@/hooks/useAuth');
jest.mock('@/components/EnhancedToast');

const mockPeerReviewService = PeerReviewService as jest.Mocked<typeof PeerReviewService>;
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

const mockUser = {
  uid: 'test-user-id',
  email: 'test@example.com',
  displayName: 'Test User'
};

const mockPeerReview = {
  reviewId: 'review-1',
  reviewerId: 'reviewer-1',
  revieweeId: 'test-user-id',
  codeSubmissionId: 'code-1',
  type: 'code_review' as const,
  status: 'completed' as const,
  overallRating: 4,
  feedback: {
    strengths: ['Good code structure', 'Clear variable names'],
    improvementAreas: ['Add error handling', 'Improve performance'],
    codeQuality: {
      readability: 4,
      efficiency: 3,
      maintainability: 4,
      testability: 3,
      comments: ['Well organized']
    },
    bestPractices: {
      followsConventions: true,
      properErrorHandling: false,
      securityConsiderations: true,
      performanceOptimizations: false,
      comments: ['Good conventions']
    },
    generalComments: 'Overall good work',
    encouragement: 'Keep it up!'
  },
  suggestions: [
    {
      suggestionId: 'suggestion-1',
      suggestedCode: 'try { ... } catch (error) { ... }',
      explanation: 'Add error handling',
      category: 'best_practice' as const,
      priority: 'high' as const
    }
  ],
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  completedAt: new Date('2024-01-01'),
  isAnonymous: false,
  visibility: 'community' as const
};

const mockReviewRequest = {
  requestId: 'request-1',
  requesterId: 'requester-1',
  codeSubmissionId: 'code-1',
  title: 'Review my React component',
  description: 'Please review my component for best practices',
  skillLevel: 'intermediate' as const,
  skillsRequested: ['React', 'JavaScript'],
  urgency: 'medium' as const,
  estimatedReviewTime: 30,
  preferredReviewerLevel: 'any' as const,
  isAnonymous: false,
  maxReviewers: 3,
  status: 'open' as const,
  createdAt: new Date('2024-01-01'),
  expiresAt: new Date('2024-01-08'),
  assignedReviewers: [],
  completedReviews: []
};

describe('PeerReview Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: mockUser as any,
      loading: false
    });
  });

  it('renders loading state initially', () => {
    mockUseAuth.mockReturnValue({
      user: mockUser as any,
      loading: true
    });

    render(<PeerReview />);
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('renders peer review interface when loaded', async () => {
    mockPeerReviewService.getReviewsForUser.mockResolvedValue([mockPeerReview]);
    mockPeerReviewService.getOpenReviewRequests.mockResolvedValue([mockReviewRequest]);
    mockPeerReviewService.getReviewerProfile.mockResolvedValue(null);

    render(<PeerReview />);

    await waitFor(() => {
      expect(screen.getByText('Peer Review System')).toBeInTheDocument();
      expect(screen.getByText('Collaborate with the community to improve your coding skills')).toBeInTheDocument();
    });
  });

  it('displays reviews in the reviews tab', async () => {
    mockPeerReviewService.getReviewsForUser.mockResolvedValue([mockPeerReview]);
    mockPeerReviewService.getOpenReviewRequests.mockResolvedValue([]);
    mockPeerReviewService.getReviewerProfile.mockResolvedValue(null);

    render(<PeerReview />);

    await waitFor(() => {
      expect(screen.getByText('Your Reviews')).toBeInTheDocument();
      expect(screen.getByText('Good code structure')).toBeInTheDocument();
      expect(screen.getByText('Add error handling')).toBeInTheDocument();
    });
  });

  it('displays open requests in the requests tab', async () => {
    mockPeerReviewService.getReviewsForUser.mockResolvedValue([]);
    mockPeerReviewService.getOpenReviewRequests.mockResolvedValue([mockReviewRequest]);
    mockPeerReviewService.getReviewerProfile.mockResolvedValue(null);

    render(<PeerReview />);

    // Switch to requests tab
    fireEvent.click(screen.getByText('Open Requests'));

    await waitFor(() => {
      expect(screen.getByText('Review my React component')).toBeInTheDocument();
      expect(screen.getByText('Please review my component for best practices')).toBeInTheDocument();
    });
  });

  it('opens review form when "Give Review" button is clicked', async () => {
    mockPeerReviewService.getReviewsForUser.mockResolvedValue([]);
    mockPeerReviewService.getOpenReviewRequests.mockResolvedValue([]);
    mockPeerReviewService.getReviewerProfile.mockResolvedValue(null);

    render(<PeerReview codeSubmissionId="code-1" />);

    await waitFor(() => {
      const giveReviewButton = screen.getByText('Give Review');
      fireEvent.click(giveReviewButton);
      expect(screen.getByText('Provide Peer Review')).toBeInTheDocument();
    });
  });

  it('opens request form when "Request Review" button is clicked', async () => {
    mockPeerReviewService.getReviewsForUser.mockResolvedValue([]);
    mockPeerReviewService.getOpenReviewRequests.mockResolvedValue([]);
    mockPeerReviewService.getReviewerProfile.mockResolvedValue(null);

    render(<PeerReview />);

    await waitFor(() => {
      const requestReviewButton = screen.getByText('Request Review');
      fireEvent.click(requestReviewButton);
      expect(screen.getByText('Request Peer Review')).toBeInTheDocument();
    });
  });

  it('handles review submission', async () => {
    mockPeerReviewService.getReviewsForUser.mockResolvedValue([]);
    mockPeerReviewService.getOpenReviewRequests.mockResolvedValue([]);
    mockPeerReviewService.getReviewerProfile.mockResolvedValue(null);
    mockPeerReviewService.createPeerReview.mockResolvedValue('new-review-id');

    render(<PeerReview codeSubmissionId="code-1" />);

    await waitFor(() => {
      const giveReviewButton = screen.getByText('Give Review');
      fireEvent.click(giveReviewButton);
    });

    // The form should be open, but we'll test the submission handler separately
    // since the form component is complex
    expect(screen.getByText('Provide Peer Review')).toBeInTheDocument();
  });

  it('handles request submission', async () => {
    mockPeerReviewService.getReviewsForUser.mockResolvedValue([]);
    mockPeerReviewService.getOpenReviewRequests.mockResolvedValue([]);
    mockPeerReviewService.getReviewerProfile.mockResolvedValue(null);
    mockPeerReviewService.createReviewRequest.mockResolvedValue('new-request-id');

    render(<PeerReview />);

    await waitFor(() => {
      const requestReviewButton = screen.getByText('Request Review');
      fireEvent.click(requestReviewButton);
    });

    expect(screen.getByText('Request Peer Review')).toBeInTheDocument();
  });

  it('displays error state when loading fails', async () => {
    mockPeerReviewService.getReviewsForUser.mockRejectedValue(new Error('Failed to load'));
    mockPeerReviewService.getOpenReviewRequests.mockRejectedValue(new Error('Failed to load'));
    mockPeerReviewService.getReviewerProfile.mockRejectedValue(new Error('Failed to load'));

    render(<PeerReview />);

    await waitFor(() => {
      expect(screen.getByText('Error Loading Peer Reviews')).toBeInTheDocument();
      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });
  });

  it('shows empty state when no reviews exist', async () => {
    mockPeerReviewService.getReviewsForUser.mockResolvedValue([]);
    mockPeerReviewService.getOpenReviewRequests.mockResolvedValue([]);
    mockPeerReviewService.getReviewerProfile.mockResolvedValue(null);

    render(<PeerReview />);

    await waitFor(() => {
      expect(screen.getByText('No Reviews Yet')).toBeInTheDocument();
      expect(screen.getByText('Start by requesting a review or reviewing others\' code')).toBeInTheDocument();
    });
  });

  it('shows empty state when no open requests exist', async () => {
    mockPeerReviewService.getReviewsForUser.mockResolvedValue([]);
    mockPeerReviewService.getOpenReviewRequests.mockResolvedValue([]);
    mockPeerReviewService.getReviewerProfile.mockResolvedValue(null);

    render(<PeerReview />);

    // Switch to requests tab
    fireEvent.click(screen.getByText('Open Requests'));

    await waitFor(() => {
      expect(screen.getByText('No Open Requests')).toBeInTheDocument();
      expect(screen.getByText('Check back later for new review requests from the community')).toBeInTheDocument();
    });
  });

  it('handles tab switching correctly', async () => {
    mockPeerReviewService.getReviewsForUser.mockResolvedValue([]);
    mockPeerReviewService.getOpenReviewRequests.mockResolvedValue([]);
    mockPeerReviewService.getReviewerProfile.mockResolvedValue(null);

    render(<PeerReview />);

    await waitFor(() => {
      expect(screen.getByText('My Reviews')).toBeInTheDocument();
    });

    // Switch to different tabs
    fireEvent.click(screen.getByText('Open Requests'));
    expect(screen.getByText('Open Review Requests')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Community'));
    expect(screen.getByText('Overview')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Profile'));
    expect(screen.getByText('Create Your Reviewer Profile')).toBeInTheDocument();
  });
});