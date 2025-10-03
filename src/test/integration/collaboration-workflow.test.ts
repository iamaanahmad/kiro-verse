/**
 * @fileOverview Integration tests for peer collaboration and mentorship workflows
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CollaborativeSession } from '@/components/collaborative-session/CollaborativeSession';
import { PeerReview } from '@/components/peer-review/PeerReview';
import { setupMockServices, resetMockServices } from '../mocks/external-services';

// Setup mocks for integration testing
setupMockServices();

vi.mock('@/lib/firebase/collaborative-session', () => ({
  CollaborativeSessionService: {
    createSession: vi.fn(),
    joinSession: vi.fn(),
    leaveSession: vi.fn(),
    updateCode: vi.fn(),
    sendMessage: vi.fn(),
    getSessionHistory: vi.fn(),
    subscribeToSession: vi.fn()
  }
}));

vi.mock('@/lib/firebase/peer-review', () => ({
  PeerReviewService: {
    submitForReview: vi.fn(),
    getReviewRequests: vi.fn(),
    submitReview: vi.fn(),
    getReviewHistory: vi.fn()
  }
}));

vi.mock('@/ai/flows/collaborative-session-mentor', () => ({
  collaborativeSessionMentor: vi.fn()
}));

vi.mock('@/ai/flows/peer-mentorship-facilitator', () => ({
  peerMentorshipFacilitator: vi.fn()
}));

import { CollaborativeSessionService } from '@/lib/firebase/collaborative-session';
import { PeerReviewService } from '@/lib/firebase/peer-review';
import { collaborativeSessionMentor } from '@/ai/flows/collaborative-session-mentor';
import { peerMentorshipFacilitator } from '@/ai/flows/peer-mentorship-facilitator';

const mockCollaborativeService = vi.mocked(CollaborativeSessionService);
const mockPeerReviewService = vi.mocked(PeerReviewService);
const mockSessionMentor = vi.mocked(collaborativeSessionMentor);
const mockPeerMentorFacilitator = vi.mocked(peerMentorshipFacilitator);

const mockSession = {
  sessionId: 'session-123',
  title: 'React Hooks Practice',
  description: 'Learning React hooks together',
  hostUserId: 'user-456',
  participants: [
    {
      userId: 'user-456',
      username: 'mentor_alice',
      displayName: 'Alice (Mentor)',
      role: 'host',
      joinedAt: new Date('2024-01-15T14:00:00Z'),
      isActive: true,
      cursor: { line: 10, column: 5 }
    },
    {
      userId: 'user-123',
      username: 'learner_bob',
      displayName: 'Bob (Learning)',
      role: 'participant',
      joinedAt: new Date('2024-01-15T14:05:00Z'),
      isActive: true,
      cursor: { line: 15, column: 8 }
    }
  ],
  code: `import React, { useState, useEffect } from 'react';

function UserProfile({ userId }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUser(userId).then(userData => {
      setUser(userData);
      setLoading(false);
    });
  }, [userId]);

  if (loading) return <div>Loading...</div>;
  
  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
    </div>
  );
}`,
  language: 'javascript',
  createdAt: new Date('2024-01-15T14:00:00Z'),
  updatedAt: new Date('2024-01-15T14:30:00Z'),
  isActive: true,
  maxParticipants: 5,
  tags: ['react', 'hooks', 'learning'],
  difficulty: 'intermediate',
  aiInsights: [
    {
      timestamp: new Date('2024-01-15T14:15:00Z'),
      type: 'suggestion',
      content: 'Consider adding error handling for the fetch operation',
      relevantLines: [7, 8, 9, 10],
      confidence: 0.85
    },
    {
      timestamp: new Date('2024-01-15T14:20:00Z'),
      type: 'best_practice',
      content: 'Good use of useEffect with dependency array',
      relevantLines: [6],
      confidence: 0.92
    }
  ],
  chatMessages: [
    {
      messageId: 'msg-1',
      userId: 'user-456',
      username: 'mentor_alice',
      content: 'Great start! Let\'s add some error handling.',
      timestamp: new Date('2024-01-15T14:10:00Z'),
      type: 'message'
    },
    {
      messageId: 'msg-2',
      userId: 'user-123',
      username: 'learner_bob',
      content: 'How should I handle the error case?',
      timestamp: new Date('2024-01-15T14:12:00Z'),
      type: 'message'
    }
  ]
};

const mockReviewRequest = {
  requestId: 'review-123',
  submitterId: 'user-123',
  submitterName: 'Bob Developer',
  title: 'React Component Review',
  description: 'Please review my user profile component',
  code: mockSession.code,
  language: 'javascript',
  skillLevel: 'intermediate',
  specificAreas: ['error handling', 'performance', 'best practices'],
  submittedAt: new Date('2024-01-15T15:00:00Z'),
  status: 'pending',
  reviewers: [],
  tags: ['react', 'components']
};

const mockReview = {
  reviewId: 'review-456',
  requestId: 'review-123',
  reviewerId: 'user-789',
  reviewerName: 'Carol Expert',
  overallRating: 4,
  feedback: {
    strengths: [
      'Good component structure',
      'Proper use of hooks',
      'Clean and readable code'
    ],
    improvements: [
      'Add error handling for fetch operations',
      'Consider loading states for better UX',
      'Add PropTypes or TypeScript for type safety'
    ],
    suggestions: [
      'Use a custom hook for data fetching',
      'Implement error boundaries',
      'Add unit tests for the component'
    ]
  },
  lineComments: [
    {
      line: 7,
      comment: 'Consider wrapping this in a try-catch block',
      type: 'improvement'
    },
    {
      line: 14,
      comment: 'Nice conditional rendering!',
      type: 'praise'
    }
  ],
  submittedAt: new Date('2024-01-15T16:00:00Z'),
  isHelpful: null
};

describe('Peer Collaboration Integration Tests', () => {
  beforeEach(() => {
    resetMockServices();
    
    // Setup default mock responses
    mockCollaborativeService.createSession.mockResolvedValue(mockSession);
    mockCollaborativeService.joinSession.mockResolvedValue(mockSession);
    mockCollaborativeService.subscribeToSession.mockReturnValue(() => {});
    mockPeerReviewService.submitForReview.mockResolvedValue(mockReviewRequest);
    mockPeerReviewService.getReviewRequests.mockResolvedValue([mockReviewRequest]);
    mockPeerReviewService.submitReview.mockResolvedValue(mockReview);
    
    // Setup AI mentor responses
    mockSessionMentor.mockResolvedValue({
      suggestions: ['Consider adding error handling'],
      insights: ['Good use of React hooks'],
      nextSteps: ['Practice with custom hooks']
    });
    
    mockPeerMentorFacilitator.mockResolvedValue({
      facilitationTips: ['Encourage questions', 'Provide specific examples'],
      learningObjectives: ['Understanding useEffect', 'Error handling patterns'],
      recommendedResources: ['React docs on hooks', 'Error handling guide']
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Collaborative Coding Session Workflow', () => {
    it('should create and join collaborative session', async () => {
      render(<CollaborativeSession userId="user-123" />);
      
      // Create new session
      const createButton = screen.getByText('Create Session');
      fireEvent.click(createButton);
      
      // Fill session details
      fireEvent.change(screen.getByLabelText('Session Title'), {
        target: { value: 'React Hooks Practice' }
      });
      fireEvent.change(screen.getByLabelText('Description'), {
        target: { value: 'Learning React hooks together' }
      });
      
      const startButton = screen.getByText('Start Session');
      fireEvent.click(startButton);
      
      await waitFor(() => {
        expect(mockCollaborativeService.createSession).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'React Hooks Practice',
            description: 'Learning React hooks together',
            hostUserId: 'user-123'
          })
        );
      });
      
      // Should show session interface
      await waitFor(() => {
        expect(screen.getByText('React Hooks Practice')).toBeInTheDocument();
        expect(screen.getByText('Alice (Mentor)')).toBeInTheDocument();
        expect(screen.getByText('Bob (Learning)')).toBeInTheDocument();
      });
    });

    it('should handle real-time code collaboration', async () => {
      // Mock existing session
      mockCollaborativeService.joinSession.mockResolvedValue(mockSession);
      
      render(<CollaborativeSession sessionId="session-123" userId="user-123" />);
      
      await waitFor(() => {
        expect(screen.getByText('React Hooks Practice')).toBeInTheDocument();
      });
      
      // Should show code editor with current code
      const codeEditor = screen.getByRole('textbox');
      expect(codeEditor).toHaveValue(expect.stringContaining('useState'));
      
      // Simulate code change
      const newCode = mockSession.code + '\n\n// Added error handling';
      fireEvent.change(codeEditor, { target: { value: newCode } });
      
      await waitFor(() => {
        expect(mockCollaborativeService.updateCode).toHaveBeenCalledWith(
          'session-123',
          newCode,
          'user-123'
        );
      });
      
      // Should show other participants' cursors
      expect(document.querySelector('.cursor-alice')).toBeInTheDocument();
    });

    it('should provide AI mentorship during session', async () => {
      render(<CollaborativeSession sessionId="session-123" userId="user-123" />);
      
      await waitFor(() => {
        expect(screen.getByText('AI Insights')).toBeInTheDocument();
      });
      
      // Should show AI suggestions
      expect(screen.getByText('Consider adding error handling for the fetch operation')).toBeInTheDocument();
      expect(screen.getByText('Good use of useEffect with dependency array')).toBeInTheDocument();
      
      // Request AI help
      const askAIButton = screen.getByText('Ask AI Mentor');
      fireEvent.click(askAIButton);
      
      await waitFor(() => {
        expect(mockSessionMentor).toHaveBeenCalledWith(
          expect.objectContaining({
            code: mockSession.code,
            participants: mockSession.participants,
            context: 'collaborative_session'
          })
        );
      });
      
      // Should show AI response
      await waitFor(() => {
        expect(screen.getByText('Consider adding error handling')).toBeInTheDocument();
        expect(screen.getByText('Practice with custom hooks')).toBeInTheDocument();
      });
    });

    it('should handle session chat and communication', async () => {
      render(<CollaborativeSession sessionId="session-123" userId="user-123" />);
      
      await waitFor(() => {
        expect(screen.getByText('Session Chat')).toBeInTheDocument();
      });
      
      // Should show existing messages
      expect(screen.getByText('Great start! Let\'s add some error handling.')).toBeInTheDocument();
      expect(screen.getByText('How should I handle the error case?')).toBeInTheDocument();
      
      // Send new message
      const messageInput = screen.getByPlaceholderText('Type a message...');
      fireEvent.change(messageInput, {
        target: { value: 'Thanks for the help!' }
      });
      
      const sendButton = screen.getByText('Send');
      fireEvent.click(sendButton);
      
      await waitFor(() => {
        expect(mockCollaborativeService.sendMessage).toHaveBeenCalledWith(
          'session-123',
          'user-123',
          'Thanks for the help!',
          'message'
        );
      });
    });

    it('should record and playback session for learning', async () => {
      const sessionWithRecording = {
        ...mockSession,
        recording: {
          recordingId: 'rec-123',
          startTime: new Date('2024-01-15T14:00:00Z'),
          endTime: new Date('2024-01-15T14:30:00Z'),
          events: [
            {
              timestamp: new Date('2024-01-15T14:05:00Z'),
              type: 'code_change',
              userId: 'user-456',
              data: { line: 7, change: 'added error handling' }
            },
            {
              timestamp: new Date('2024-01-15T14:10:00Z'),
              type: 'ai_insight',
              data: { suggestion: 'Consider adding error handling' }
            }
          ]
        }
      };
      
      mockCollaborativeService.getSessionHistory.mockResolvedValue(sessionWithRecording);
      
      render(<CollaborativeSession sessionId="session-123" userId="user-123" mode="playback" />);
      
      await waitFor(() => {
        expect(screen.getByText('Session Playback')).toBeInTheDocument();
        expect(screen.getByText('30 minutes')).toBeInTheDocument();
      });
      
      // Should show playback controls
      expect(screen.getByRole('button', { name: /play/i })).toBeInTheDocument();
      expect(screen.getByRole('slider')).toBeInTheDocument(); // Timeline
      
      // Start playback
      const playButton = screen.getByRole('button', { name: /play/i });
      fireEvent.click(playButton);
      
      // Should show timestamped events
      await waitFor(() => {
        expect(screen.getByText('14:05 - Code change by Alice')).toBeInTheDocument();
        expect(screen.getByText('14:10 - AI Insight')).toBeInTheDocument();
      });
    });
  });

  describe('Peer Review Workflow', () => {
    it('should submit code for peer review', async () => {
      render(<PeerReview userId="user-123" />);
      
      // Submit for review
      const submitTab = screen.getByText('Submit for Review');
      fireEvent.click(submitTab);
      
      // Fill review request form
      fireEvent.change(screen.getByLabelText('Title'), {
        target: { value: 'React Component Review' }
      });
      fireEvent.change(screen.getByLabelText('Description'), {
        target: { value: 'Please review my user profile component' }
      });
      fireEvent.change(screen.getByRole('textbox', { name: /code/i }), {
        target: { value: mockSession.code }
      });
      
      // Select specific areas for review
      fireEvent.click(screen.getByLabelText('Error Handling'));
      fireEvent.click(screen.getByLabelText('Performance'));
      fireEvent.click(screen.getByLabelText('Best Practices'));
      
      const submitButton = screen.getByText('Submit for Review');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockPeerReviewService.submitForReview).toHaveBeenCalledWith(
          expect.objectContaining({
            submitterId: 'user-123',
            title: 'React Component Review',
            description: 'Please review my user profile component',
            code: mockSession.code,
            specificAreas: ['error handling', 'performance', 'best practices']
          })
        );
      });
      
      // Should show success message
      await waitFor(() => {
        expect(screen.getByText('Review request submitted successfully!')).toBeInTheDocument();
      });
    });

    it('should display available review requests', async () => {
      render(<PeerReview userId="user-789" />);
      
      // Switch to review tab
      const reviewTab = screen.getByText('Review Code');
      fireEvent.click(reviewTab);
      
      await waitFor(() => {
        expect(screen.getByText('Available Reviews')).toBeInTheDocument();
      });
      
      // Should show review requests
      expect(screen.getByText('React Component Review')).toBeInTheDocument();
      expect(screen.getByText('Bob Developer')).toBeInTheDocument();
      expect(screen.getByText('Intermediate')).toBeInTheDocument();
      expect(screen.getByText('error handling, performance, best practices')).toBeInTheDocument();
      
      // Start review
      const startReviewButton = screen.getByText('Start Review');
      fireEvent.click(startReviewButton);
      
      await waitFor(() => {
        expect(screen.getByText('Reviewing: React Component Review')).toBeInTheDocument();
      });
    });

    it('should provide comprehensive peer review', async () => {
      // Mock starting a review
      render(<PeerReview userId="user-789" reviewRequestId="review-123" />);
      
      await waitFor(() => {
        expect(screen.getByText('Reviewing: React Component Review')).toBeInTheDocument();
      });
      
      // Should show code with line numbers
      expect(screen.getByText('1')).toBeInTheDocument(); // Line number
      expect(screen.getByText('import React')).toBeInTheDocument();
      
      // Add line comment
      const line7 = screen.getByTestId('line-7');
      fireEvent.click(line7);
      
      const commentInput = screen.getByPlaceholderText('Add a comment for this line...');
      fireEvent.change(commentInput, {
        target: { value: 'Consider wrapping this in a try-catch block' }
      });
      
      const addCommentButton = screen.getByText('Add Comment');
      fireEvent.click(addCommentButton);
      
      // Fill overall review
      fireEvent.change(screen.getByLabelText('Strengths'), {
        target: { value: 'Good component structure\nProper use of hooks\nClean and readable code' }
      });
      
      fireEvent.change(screen.getByLabelText('Areas for Improvement'), {
        target: { value: 'Add error handling for fetch operations\nConsider loading states for better UX' }
      });
      
      fireEvent.change(screen.getByLabelText('Suggestions'), {
        target: { value: 'Use a custom hook for data fetching\nImplement error boundaries' }
      });
      
      // Set overall rating
      const fourStars = screen.getByLabelText('4 stars');
      fireEvent.click(fourStars);
      
      // Submit review
      const submitReviewButton = screen.getByText('Submit Review');
      fireEvent.click(submitReviewButton);
      
      await waitFor(() => {
        expect(mockPeerReviewService.submitReview).toHaveBeenCalledWith(
          expect.objectContaining({
            requestId: 'review-123',
            reviewerId: 'user-789',
            overallRating: 4,
            feedback: expect.objectContaining({
              strengths: expect.arrayContaining(['Good component structure']),
              improvements: expect.arrayContaining(['Add error handling for fetch operations']),
              suggestions: expect.arrayContaining(['Use a custom hook for data fetching'])
            }),
            lineComments: expect.arrayContaining([
              expect.objectContaining({
                line: 7,
                comment: 'Consider wrapping this in a try-catch block'
              })
            ])
          })
        );
      });
    });

    it('should integrate AI feedback with peer reviews', async () => {
      // Mock AI analysis of the code
      mockPeerMentorFacilitator.mockResolvedValue({
        codeAnalysis: {
          strengths: ['Good hook usage', 'Clean structure'],
          issues: ['Missing error handling', 'No loading state management'],
          suggestions: ['Add try-catch blocks', 'Implement proper loading states']
        },
        reviewGuidance: {
          focusAreas: ['Error handling patterns', 'React best practices'],
          questionPrompts: ['How would you handle fetch errors?', 'What loading states are missing?']
        }
      });
      
      render(<PeerReview userId="user-789" reviewRequestId="review-123" />);
      
      await waitFor(() => {
        expect(screen.getByText('AI Analysis')).toBeInTheDocument();
      });
      
      // Should show AI insights
      expect(screen.getByText('Missing error handling')).toBeInTheDocument();
      expect(screen.getByText('Add try-catch blocks')).toBeInTheDocument();
      
      // Should show review guidance
      expect(screen.getByText('Focus Areas')).toBeInTheDocument();
      expect(screen.getByText('Error handling patterns')).toBeInTheDocument();
      
      // Should show suggested questions
      expect(screen.getByText('Suggested Questions')).toBeInTheDocument();
      expect(screen.getByText('How would you handle fetch errors?')).toBeInTheDocument();
    });

    it('should track community contributions and badges', async () => {
      // Mock user with review history
      const reviewHistory = [
        { reviewId: 'rev-1', rating: 4.5, submittedAt: new Date('2024-01-10') },
        { reviewId: 'rev-2', rating: 4.8, submittedAt: new Date('2024-01-12') },
        { reviewId: 'rev-3', rating: 4.2, submittedAt: new Date('2024-01-14') }
      ];
      
      mockPeerReviewService.getReviewHistory.mockResolvedValue(reviewHistory);
      
      render(<PeerReview userId="user-789" />);
      
      // Switch to profile tab
      const profileTab = screen.getByText('My Reviews');
      fireEvent.click(profileTab);
      
      await waitFor(() => {
        expect(screen.getByText('Review Statistics')).toBeInTheDocument();
      });
      
      // Should show review stats
      expect(screen.getByText('3 reviews completed')).toBeInTheDocument();
      expect(screen.getByText('4.5 average rating')).toBeInTheDocument();
      
      // Should show earned badges
      expect(screen.getByText('Helpful Reviewer')).toBeInTheDocument();
      expect(screen.getByText('Community Contributor')).toBeInTheDocument();
      
      // Should show contribution impact
      expect(screen.getByText('Helped 3 developers improve their code')).toBeInTheDocument();
    });
  });

  describe('Mentorship Facilitation', () => {
    it('should match mentors with learners', async () => {
      const mentorshipRequest = {
        requestId: 'mentor-123',
        learnerId: 'user-123',
        learnerName: 'Bob Learner',
        skillArea: 'React',
        currentLevel: 'beginner',
        goals: ['Learn hooks', 'Understand state management'],
        preferredStyle: 'hands-on',
        availability: ['weekends', 'evenings']
      };
      
      const mentorMatch = {
        mentorId: 'user-456',
        mentorName: 'Alice Expert',
        skillLevel: 'expert',
        rating: 4.8,
        specialties: ['React', 'JavaScript', 'Performance'],
        matchScore: 0.92,
        availability: ['weekends']
      };
      
      mockPeerMentorFacilitator.mockResolvedValue({
        matches: [mentorMatch],
        recommendations: ['Start with basic hooks', 'Practice with small projects']
      });
      
      render(<PeerReview userId="user-123" mode="mentorship" />);
      
      // Request mentorship
      const requestMentorshipButton = screen.getByText('Request Mentorship');
      fireEvent.click(requestMentorshipButton);
      
      // Fill mentorship request
      fireEvent.change(screen.getByLabelText('Skill Area'), {
        target: { value: 'React' }
      });
      fireEvent.change(screen.getByLabelText('Current Level'), {
        target: { value: 'beginner' }
      });
      fireEvent.change(screen.getByLabelText('Learning Goals'), {
        target: { value: 'Learn hooks\nUnderstand state management' }
      });
      
      const submitButton = screen.getByText('Find Mentor');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Mentor Matches')).toBeInTheDocument();
      });
      
      // Should show mentor match
      expect(screen.getByText('Alice Expert')).toBeInTheDocument();
      expect(screen.getByText('4.8 ⭐')).toBeInTheDocument();
      expect(screen.getByText('92% match')).toBeInTheDocument();
      expect(screen.getByText('React, JavaScript, Performance')).toBeInTheDocument();
      
      // Connect with mentor
      const connectButton = screen.getByText('Connect');
      fireEvent.click(connectButton);
      
      await waitFor(() => {
        expect(screen.getByText('Mentorship request sent to Alice Expert')).toBeInTheDocument();
      });
    });

    it('should facilitate structured learning sessions', async () => {
      const learningPlan = {
        sessionId: 'learning-123',
        mentorId: 'user-456',
        learnerId: 'user-123',
        topic: 'React Hooks',
        objectives: [
          'Understand useState and useEffect',
          'Practice with custom hooks',
          'Learn performance optimization'
        ],
        activities: [
          { type: 'explanation', duration: 10, content: 'Hook basics' },
          { type: 'coding', duration: 20, content: 'Build a counter component' },
          { type: 'review', duration: 10, content: 'Code review and feedback' }
        ],
        resources: [
          'React Hooks documentation',
          'Custom hooks examples',
          'Performance best practices'
        ]
      };
      
      mockSessionMentor.mockResolvedValue({
        learningPlan,
        nextSteps: ['Practice with more complex hooks', 'Build a real project'],
        assessmentQuestions: [
          'When would you use useEffect?',
          'How do you optimize re-renders?'
        ]
      });
      
      render(<CollaborativeSession sessionId="learning-123" userId="user-123" mode="mentorship" />);
      
      await waitFor(() => {
        expect(screen.getByText('Learning Session: React Hooks')).toBeInTheDocument();
      });
      
      // Should show learning objectives
      expect(screen.getByText('Learning Objectives')).toBeInTheDocument();
      expect(screen.getByText('Understand useState and useEffect')).toBeInTheDocument();
      
      // Should show structured activities
      expect(screen.getByText('Session Activities')).toBeInTheDocument();
      expect(screen.getByText('Hook basics (10 min)')).toBeInTheDocument();
      expect(screen.getByText('Build a counter component (20 min)')).toBeInTheDocument();
      
      // Should show resources
      expect(screen.getByText('Resources')).toBeInTheDocument();
      expect(screen.getByText('React Hooks documentation')).toBeInTheDocument();
      
      // Complete activity
      const completeButton = screen.getByText('Mark Complete');
      fireEvent.click(completeButton);
      
      await waitFor(() => {
        expect(screen.getByText('Activity completed!')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle session connection failures', async () => {
      mockCollaborativeService.joinSession.mockRejectedValue(
        new Error('Session not found')
      );
      
      render(<CollaborativeSession sessionId="invalid-session" userId="user-123" />);
      
      await waitFor(() => {
        expect(screen.getByText('Session Error')).toBeInTheDocument();
        expect(screen.getByText('Session not found')).toBeInTheDocument();
      });
      
      // Should offer to create new session
      expect(screen.getByText('Create New Session')).toBeInTheDocument();
    });

    it('should handle network disconnections gracefully', async () => {
      render(<CollaborativeSession sessionId="session-123" userId="user-123" />);
      
      await waitFor(() => {
        expect(screen.getByText('React Hooks Practice')).toBeInTheDocument();
      });
      
      // Simulate network disconnection
      mockCollaborativeService.updateCode.mockRejectedValue(
        new Error('Network error')
      );
      
      const codeEditor = screen.getByRole('textbox');
      fireEvent.change(codeEditor, { target: { value: 'new code' } });
      
      await waitFor(() => {
        expect(screen.getByText('Connection lost')).toBeInTheDocument();
        expect(screen.getByText('Attempting to reconnect...')).toBeInTheDocument();
      });
      
      // Should show offline indicator
      expect(screen.getByText('Offline')).toBeInTheDocument();
    });

    it('should handle review submission failures', async () => {
      mockPeerReviewService.submitReview.mockRejectedValue(
        new Error('Review submission failed')
      );
      
      render(<PeerReview userId="user-789" reviewRequestId="review-123" />);
      
      await waitFor(() => {
        // Fill and submit review
        const submitButton = screen.getByText('Submit Review');
        fireEvent.click(submitButton);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Failed to submit review')).toBeInTheDocument();
        expect(screen.getByText('Review submission failed')).toBeInTheDocument();
      });
      
      // Should offer to save draft
      expect(screen.getByText('Save as Draft')).toBeInTheDocument();
    });

    it('should handle AI service outages', async () => {
      mockSessionMentor.mockRejectedValue(
        new Error('AI service unavailable')
      );
      
      render(<CollaborativeSession sessionId="session-123" userId="user-123" />);
      
      await waitFor(() => {
        const askAIButton = screen.getByText('Ask AI Mentor');
        fireEvent.click(askAIButton);
      });
      
      await waitFor(() => {
        expect(screen.getByText('AI mentor temporarily unavailable')).toBeInTheDocument();
        expect(screen.getByText('Continue with peer collaboration')).toBeInTheDocument();
      });
      
      // Should still allow manual collaboration
      expect(screen.getByRole('textbox')).toBeEnabled();
      expect(screen.getByPlaceholderText('Type a message...')).toBeEnabled();
    });
  });
});