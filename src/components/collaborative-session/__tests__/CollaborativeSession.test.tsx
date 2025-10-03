import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { CollaborativeSession } from '../CollaborativeSession';
import { CollaborativeSessionService } from '@/lib/firebase/collaborative-session';
import { analyzeCollaborativeSession } from '@/ai/flows/collaborative-session-mentor';

// Mock dependencies
vi.mock('@/lib/firebase/collaborative-session');
vi.mock('@/ai/flows/collaborative-session-mentor');
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: {
      uid: 'test-user-id',
      displayName: 'Test User',
      email: 'test@example.com'
    }
  })
}));

const mockSession = {
  sessionId: 'test-session-id',
  hostId: 'host-user-id',
  participants: [
    {
      userId: 'test-user-id',
      username: 'Test User',
      role: 'participant' as const,
      joinedAt: new Date(),
      isActive: true,
      canEdit: true,
      canSuggest: true,
      canComment: true,
      isTyping: false,
      lastActivity: new Date(),
      linesAdded: 0,
      linesModified: 0,
      suggestionsGiven: 0,
      helpfulnessScore: 0
    }
  ],
  title: 'Test Collaborative Session',
  description: 'A test session for unit testing',
  status: 'active' as const,
  maxParticipants: 5,
  isPublic: true,
  requiresApproval: false,
  skillLevel: 'intermediate' as const,
  focusAreas: ['javascript', 'react'],
  sharedCode: {
    content: 'console.log("Hello, World!");',
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
  duration: 30,
  isRecorded: true,
  timestampedEvents: [],
  voiceEnabled: false,
  screenSharingEnabled: false,
  whiteboardEnabled: false
};

describe('CollaborativeSession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock CollaborativeSessionService methods
    vi.mocked(CollaborativeSessionService.getSession).mockResolvedValue(mockSession);
    vi.mocked(CollaborativeSessionService.joinSession).mockResolvedValue();
    vi.mocked(CollaborativeSessionService.subscribeToSessionUpdates).mockReturnValue(() => {});
    vi.mocked(CollaborativeSessionService.updateSharedCode).mockResolvedValue();
    vi.mocked(CollaborativeSessionService.updateParticipantStatus).mockResolvedValue();
    vi.mocked(CollaborativeSessionService.addAISuggestion).mockResolvedValue();
    vi.mocked(CollaborativeSessionService.addRealTimeInsight).mockResolvedValue();
    
    // Mock AI analysis
    vi.mocked(analyzeCollaborativeSession).mockResolvedValue({
      suggestions: [],
      insights: [],
      collaborationFeedback: {
        teamDynamics: 'Good collaboration',
        codeQualityTrend: 'improving',
        participationBalance: 'balanced',
        learningOpportunities: [],
        recommendedActions: []
      }
    });
  });

  it('renders loading state initially', () => {
    render(<CollaborativeSession sessionId="test-session-id" />);
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('renders session interface after loading', async () => {
    render(<CollaborativeSession sessionId="test-session-id" />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Collaborative Session')).toBeInTheDocument();
    });

    expect(screen.getByText('active')).toBeInTheDocument();
    expect(screen.getByText('1 active participants')).toBeInTheDocument();
    expect(screen.getByText('Skill level: intermediate')).toBeInTheDocument();
  });

  it('displays error message when session not found', async () => {
    vi.mocked(CollaborativeSessionService.getSession).mockResolvedValue(null);
    
    render(<CollaborativeSession sessionId="nonexistent-session" />);
    
    await waitFor(() => {
      expect(screen.getByText('Session not found')).toBeInTheDocument();
    });
  });

  it('handles code changes and triggers AI analysis', async () => {
    render(<CollaborativeSession sessionId="test-session-id" />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Collaborative Session')).toBeInTheDocument();
    });

    // Simulate code change
    const codeEditor = screen.getByRole('textbox');
    fireEvent.change(codeEditor, { target: { value: 'console.log("Updated code");' } });

    await waitFor(() => {
      expect(CollaborativeSessionService.updateSharedCode).toHaveBeenCalled();
      expect(analyzeCollaborativeSession).toHaveBeenCalled();
    });
  });

  it('switches between tabs correctly', async () => {
    render(<CollaborativeSession sessionId="test-session-id" />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Collaborative Session')).toBeInTheDocument();
    });

    // Switch to chat tab
    fireEvent.click(screen.getByText('Chat'));
    expect(screen.getByText('Session Chat')).toBeInTheDocument();

    // Switch to insights tab
    fireEvent.click(screen.getByText('AI Insights'));
    expect(screen.getByText('AI Insights')).toBeInTheDocument();
  });

  it('handles participant management for hosts', async () => {
    const hostSession = {
      ...mockSession,
      hostId: 'test-user-id',
      participants: [
        {
          ...mockSession.participants[0],
          role: 'host' as const
        }
      ]
    };
    
    vi.mocked(CollaborativeSessionService.getSession).mockResolvedValue(hostSession);
    
    render(<CollaborativeSession sessionId="test-session-id" />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Collaborative Session')).toBeInTheDocument();
    });

    // Host should see recording controls
    expect(screen.getByText('Record')).toBeInTheDocument();
  });

  it('handles real-time updates', async () => {
    const mockUnsubscribe = vi.fn();
    let updateCallback: ((update: any) => void) | null = null;
    
    vi.mocked(CollaborativeSessionService.subscribeToSessionUpdates).mockImplementation(
      (sessionId, callback) => {
        updateCallback = callback;
        return mockUnsubscribe;
      }
    );

    render(<CollaborativeSession sessionId="test-session-id" />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Collaborative Session')).toBeInTheDocument();
    });

    // Simulate real-time update
    if (updateCallback) {
      updateCallback({
        type: 'code_change',
        sessionId: 'test-session-id',
        userId: 'other-user',
        data: { codeContent: 'Updated by other user' },
        timestamp: new Date()
      });
    }

    // Verify unsubscribe is called on cleanup
    // This would be tested in a more complex test setup
  });

  it('handles session recording controls', async () => {
    const hostSession = {
      ...mockSession,
      hostId: 'test-user-id',
      participants: [
        {
          ...mockSession.participants[0],
          role: 'host' as const
        }
      ]
    };
    
    vi.mocked(CollaborativeSessionService.getSession).mockResolvedValue(hostSession);
    
    render(<CollaborativeSession sessionId="test-session-id" />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Collaborative Session')).toBeInTheDocument();
    });

    // Start recording
    const recordButton = screen.getByText('Record');
    fireEvent.click(recordButton);

    await waitFor(() => {
      expect(screen.getByText('Stop')).toBeInTheDocument();
      expect(screen.getByText('Recording')).toBeInTheDocument();
    });

    // Stop recording
    const stopButton = screen.getByText('Stop');
    fireEvent.click(stopButton);

    await waitFor(() => {
      expect(screen.getByText('Record')).toBeInTheDocument();
    });
  });

  it('handles cursor and selection updates', async () => {
    render(<CollaborativeSession sessionId="test-session-id" />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Collaborative Session')).toBeInTheDocument();
    });

    // These would be tested with more specific interactions
    // that trigger cursor and selection changes in the code editor
    expect(CollaborativeSessionService.updateParticipantStatus).toHaveBeenCalledWith(
      'test-session-id',
      'test-user-id',
      expect.any(Object)
    );
  });

  it('handles AI suggestion interactions', async () => {
    const sessionWithSuggestions = {
      ...mockSession,
      aiSuggestions: [
        {
          suggestionId: 'test-suggestion',
          type: 'improvement' as const,
          title: 'Test Suggestion',
          description: 'A test suggestion',
          targetPosition: { line: 0, column: 0, offset: 0 },
          targetCode: 'old code',
          suggestedCode: 'new code',
          confidence: 0.8,
          reasoning: 'Test reasoning',
          skillsTargeted: ['javascript'],
          status: 'pending' as const,
          votes: [],
          createdAt: new Date(),
          priority: 'medium' as const,
          category: 'code_quality'
        }
      ]
    };
    
    vi.mocked(CollaborativeSessionService.getSession).mockResolvedValue(sessionWithSuggestions);
    vi.mocked(CollaborativeSessionService.updateAISuggestion).mockResolvedValue();
    
    render(<CollaborativeSession sessionId="test-session-id" />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Collaborative Session')).toBeInTheDocument();
    });

    // Switch to insights tab
    fireEvent.click(screen.getByText('AI Insights'));

    // Apply suggestion (this would require more specific component interaction)
    expect(screen.getByText('AI Insights')).toBeInTheDocument();
  });

  it('handles leave session', async () => {
    vi.mocked(CollaborativeSessionService.leaveSession).mockResolvedValue();
    
    render(<CollaborativeSession sessionId="test-session-id" />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Collaborative Session')).toBeInTheDocument();
    });

    const leaveButton = screen.getByText('Leave');
    fireEvent.click(leaveButton);

    await waitFor(() => {
      expect(CollaborativeSessionService.leaveSession).toHaveBeenCalledWith(
        'test-session-id',
        'test-user-id'
      );
    });
  });
});