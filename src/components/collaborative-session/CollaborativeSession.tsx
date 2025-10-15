'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Users, 
  Play, 
  Pause, 
  Square, 
  Mic, 
  MicOff, 
  Video, 
  VideoOff,
  Share,
  MessageSquare,
  Lightbulb,
  Code,
  Clock,
  Eye,
  Settings,
  UserPlus,
  CircleStop,
  Download
} from 'lucide-react';
import { 
  CollaborativeSession as CollaborativeSessionType,
  SessionParticipant,
  AISuggestion,
  RealTimeInsight,
  RealTimeUpdate,
  CodeHistoryEntry,
  Position,
  CodeSelection,
  SessionComment
} from '@/types/collaborative-session';
import { CollaborativeSessionService } from '@/lib/firebase/collaborative-session';
import { useAuth } from '@/hooks/useAuth';
import { CollaborativeCodeEditor } from './CollaborativeCodeEditor';
import { SessionChat } from './SessionChat';
import { AIInsightPanel } from './AIInsightPanel';
import { ParticipantsList } from './ParticipantsList';
import { SessionRecordingPlayer } from './SessionRecordingPlayer';
import LoadingSpinner from '@/components/LoadingSpinner';
import EnhancedToast from '@/components/EnhancedToast';
import { analyzeCollaborativeSession } from '@/ai/flows/collaborative-session-mentor';

interface CollaborativeSessionProps {
  sessionId?: string;
  initialMode?: 'join' | 'create' | 'browse';
}

export function CollaborativeSession({ 
  sessionId, 
  initialMode = 'browse' 
}: CollaborativeSessionProps) {
  const { user } = useAuth();
  const [session, setSession] = useState<CollaborativeSessionType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('code');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingStartTime, setRecordingStartTime] = useState<Date | null>(null);
  
  // Real-time state
  const [realTimeUpdates, setRealTimeUpdates] = useState<RealTimeUpdate[]>([]);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Initialize session
  useEffect(() => {
    if (!sessionId || !user) return;

    const initializeSession = async () => {
      try {
        setLoading(true);
        const sessionData = await CollaborativeSessionService.getSession(sessionId);
        
        if (!sessionData) {
          setError('Session not found');
          return;
        }

        setSession(sessionData);

        // Join session if not already a participant
        const isParticipant = sessionData.participants.some(p => p.userId === user.uid);
        if (!isParticipant && initialMode === 'join') {
          const newParticipant: SessionParticipant = {
            userId: user.uid,
            username: user.displayName || user.email || 'Anonymous',
            role: 'participant',
            joinedAt: new Date(),
            isActive: true,
            canEdit: true,
            canSuggest: true,
            canComment: true,
            cursor: undefined,
            selection: undefined,
            isTyping: false,
            lastActivity: new Date(),
            linesAdded: 0,
            linesModified: 0,
            suggestionsGiven: 0,
            helpfulnessScore: 0
          };

          await CollaborativeSessionService.joinSession(sessionId, newParticipant);
          
          // Refresh session data
          const updatedSession = await CollaborativeSessionService.getSession(sessionId);
          if (updatedSession) {
            setSession(updatedSession);
          }
        }

        // Subscribe to real-time updates
        const unsubscribe = CollaborativeSessionService.subscribeToSessionUpdates(
          sessionId,
          handleRealTimeUpdate
        );
        unsubscribeRef.current = unsubscribe;

      } catch (err) {
        console.error('Error initializing session:', err);
        setError('Failed to load session');
      } finally {
        setLoading(false);
      }
    };

    initializeSession();

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [sessionId, user, initialMode]);

  // Handle real-time updates
  const handleRealTimeUpdate = useCallback((update: RealTimeUpdate) => {
    setRealTimeUpdates(prev => [...prev.slice(-50), update]); // Keep last 50 updates

    // Update session state based on update type
    switch (update.type) {
      case 'code_change':
        if (session && update.data.codeContent) {
          setSession(prev => prev ? {
            ...prev,
            sharedCode: {
              ...prev.sharedCode,
              content: update.data.codeContent,
              version: prev.sharedCode.version + 1,
              lastModifiedBy: update.userId || 'unknown',
              lastModifiedAt: new Date()
            }
          } : null);
        }
        break;
      
      case 'participant_join':
      case 'participant_leave':
        // Refresh session data
        if (sessionId) {
          CollaborativeSessionService.getSession(sessionId).then(updatedSession => {
            if (updatedSession) {
              setSession(updatedSession);
            }
          });
        }
        break;
    }
  }, [session, sessionId]);

  // Code editor handlers
  const handleCodeChange = useCallback(async (content: string, operation: CodeHistoryEntry) => {
    if (!session || !user) return;

    try {
      await CollaborativeSessionService.updateSharedCode(
        session.sessionId,
        content,
        user.uid,
        operation
      );

      // Trigger AI analysis for real-time insights
      if (session.aiMentorEnabled) {
        try {
          const analysisResult = await analyzeCollaborativeSession({
            sessionId: session.sessionId,
            currentCode: content,
            codeHistory: session.codeHistory.slice(-10).map(entry => ({
              entryId: entry.entryId,
              timestamp: entry.timestamp.toISOString(),
              userId: entry.userId,
              username: entry.username,
              operation: entry.operation,
              oldContent: entry.oldContent || '',
              newContent: entry.newContent || '',
              description: entry.description
            })),
            participants: session.participants.map(p => ({
              userId: p.userId,
              username: p.username,
              role: p.role,
              skillLevel: 'intermediate', // Would come from user profile
              isActive: p.isActive
            })),
            sessionContext: {
              skillLevel: session.skillLevel,
              focusAreas: session.focusAreas,
              duration: session.duration || 0,
              aiMentorEnabled: session.aiMentorEnabled
            },
            triggerType: 'code_change'
          });

          // Add AI suggestions and insights to session
          for (const suggestion of analysisResult.suggestions) {
            const aiSuggestion: AISuggestion = {
              suggestionId: suggestion.suggestionId,
              type: suggestion.type,
              title: suggestion.title,
              description: suggestion.description,
              targetPosition: suggestion.targetPosition || { line: 0, column: 0, offset: 0 },
              targetCode: suggestion.targetCode || '',
              suggestedCode: suggestion.suggestedCode || '',
              confidence: suggestion.confidence,
              reasoning: suggestion.reasoning,
              skillsTargeted: suggestion.skillsTargeted,
              status: 'pending',
              votes: [],
              createdAt: new Date(),
              priority: suggestion.priority,
              category: suggestion.category
            };

            await CollaborativeSessionService.addAISuggestion(session.sessionId, aiSuggestion);
          }

          for (const insight of analysisResult.insights) {
            const realTimeInsight: RealTimeInsight = {
              insightId: insight.insightId,
              type: insight.type,
              title: insight.title,
              message: insight.message,
              triggeredBy: insight.triggeredBy,
              relatedCode: insight.relatedCode,
              targetUsers: insight.targetUsers,
              priority: insight.priority,
              isRead: {},
              responses: [],
              createdAt: new Date(),
              aiGenerated: insight.aiGenerated
            };

            await CollaborativeSessionService.addRealTimeInsight(session.sessionId, realTimeInsight);
          }
        } catch (aiError) {
          console.error('AI analysis failed:', aiError);
          // Continue without AI insights
        }
      }
    } catch (error) {
      console.error('Error updating code:', error);
      setError('Failed to update code');
    }
  }, [session, user]);

  const handleCursorMove = useCallback(async (position: Position) => {
    if (!session || !user) return;

    try {
      await CollaborativeSessionService.updateParticipantStatus(
        session.sessionId,
        user.uid,
        {
          cursor: {
            line: position.line,
            column: position.column,
            userId: user.uid,
            color: getUserColor(user.uid),
            visible: true
          },
          lastActivity: new Date()
        }
      );
    } catch (error) {
      console.error('Error updating cursor:', error);
    }
  }, [session, user]);

  const handleSelectionChange = useCallback(async (selection: CodeSelection) => {
    if (!session || !user) return;

    try {
      await CollaborativeSessionService.updateParticipantStatus(
        session.sessionId,
        user.uid,
        {
          selection,
          lastActivity: new Date()
        }
      );
    } catch (error) {
      console.error('Error updating selection:', error);
    }
  }, [session, user]);

  // Chat handlers
  const handleSendMessage = useCallback(async (content: string, codePosition?: any) => {
    if (!session || !user) return;

    // This would integrate with a chat/comment system
    console.log('Sending message:', content, codePosition);
  }, [session, user]);

  const handleReactToMessage = useCallback(async (commentId: string, emoji: string) => {
    if (!session || !user) return;

    // This would handle message reactions
    console.log('Reacting to message:', commentId, emoji);
  }, [session, user]);

  const handleReplyToMessage = useCallback(async (commentId: string, content: string) => {
    if (!session || !user) return;

    // This would handle message replies
    console.log('Replying to message:', commentId, content);
  }, [session, user]);

  // AI insight handlers
  const handleApplySuggestion = useCallback(async (suggestionId: string) => {
    if (!session || !user) return;

    try {
      await CollaborativeSessionService.updateAISuggestion(
        session.sessionId,
        suggestionId,
        {
          status: 'accepted',
          appliedBy: user.uid,
          appliedAt: new Date()
        }
      );

      // Refresh session data
      const updatedSession = await CollaborativeSessionService.getSession(session.sessionId);
      if (updatedSession) {
        setSession(updatedSession);
      }
    } catch (error) {
      console.error('Error applying suggestion:', error);
    }
  }, [session, user]);

  const handleVoteSuggestion = useCallback(async (suggestionId: string, vote: 'up' | 'down', comment?: string) => {
    if (!session || !user) return;

    // This would handle suggestion voting
    console.log('Voting on suggestion:', suggestionId, vote, comment);
  }, [session, user]);

  const handleDismissInsight = useCallback(async (insightId: string) => {
    if (!session || !user) return;

    // This would handle insight dismissal
    console.log('Dismissing insight:', insightId);
  }, [session, user]);

  const handleMarkInsightRead = useCallback(async (insightId: string) => {
    if (!session || !user) return;

    // This would mark insight as read
    console.log('Marking insight as read:', insightId);
  }, [session, user]);

  // Participant management handlers
  const handleInviteParticipant = useCallback(() => {
    // This would open an invitation dialog
    console.log('Inviting participant');
  }, []);

  const handleUpdateParticipantRole = useCallback(async (userId: string, role: 'host' | 'participant' | 'observer') => {
    if (!session || !user) return;

    // This would update participant role
    console.log('Updating participant role:', userId, role);
  }, [session, user]);

  const handleUpdateParticipantPermissions = useCallback(async (userId: string, permissions: Partial<SessionParticipant>) => {
    if (!session || !user) return;

    try {
      await CollaborativeSessionService.updateParticipantStatus(
        session.sessionId,
        userId,
        permissions
      );

      // Refresh session data
      const updatedSession = await CollaborativeSessionService.getSession(session.sessionId);
      if (updatedSession) {
        setSession(updatedSession);
      }
    } catch (error) {
      console.error('Error updating participant permissions:', error);
    }
  }, [session, user]);

  const handleRemoveParticipant = useCallback(async (userId: string) => {
    if (!session || !user) return;

    try {
      await CollaborativeSessionService.leaveSession(session.sessionId, userId);

      // Refresh session data
      const updatedSession = await CollaborativeSessionService.getSession(session.sessionId);
      if (updatedSession) {
        setSession(updatedSession);
      }
    } catch (error) {
      console.error('Error removing participant:', error);
    }
  }, [session, user]);

  const handlePromoteToHost = useCallback(async (userId: string) => {
    if (!session || !user) return;

    // This would promote participant to host
    console.log('Promoting to host:', userId);
  }, [session, user]);

  // Session control handlers
  const handleStartRecording = useCallback(() => {
    setIsRecording(true);
    setRecordingStartTime(new Date());
  }, []);

  const handleStopRecording = useCallback(() => {
    setIsRecording(false);
    setRecordingStartTime(null);
  }, []);

  const handleLeaveSession = useCallback(async () => {
    if (!session || !user) return;

    try {
      await CollaborativeSessionService.leaveSession(session.sessionId, user.uid);
      // Navigate away or show confirmation
    } catch (error) {
      console.error('Error leaving session:', error);
    }
  }, [session, user]);

  // Helper functions
  const getUserColor = (userId: string): string => {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'];
    const hash = userId.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    return colors[Math.abs(hash) % colors.length];
  };

  const getCurrentUserParticipant = (): SessionParticipant | null => {
    if (!session || !user) return null;
    return session.participants.find(p => p.userId === user.uid) || null;
  };

  const isHost = (): boolean => {
    const participant = getCurrentUserParticipant();
    return participant?.role === 'host' || session?.hostId === user?.uid || false;
  };

  const canEdit = (): boolean => {
    const participant = getCurrentUserParticipant();
    return participant?.canEdit || false;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="max-w-md mx-auto mt-8">
        <CardContent className="p-6 text-center">
          <div className="text-destructive mb-4">{error}</div>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!session) {
    return (
      <Card className="max-w-md mx-auto mt-8">
        <CardContent className="p-6 text-center">
          <div className="text-muted-foreground mb-4">Session not found</div>
          <Button onClick={() => window.history.back()}>
            Go Back
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Session header */}
      <Card className="rounded-none border-x-0 border-t-0">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {session.title}
                <Badge variant={session.status === 'active' ? 'default' : 'secondary'}>
                  {session.status}
                </Badge>
                {isRecording && (
                  <Badge variant="destructive" className="animate-pulse">
                    <CircleStop className="h-3 w-3 mr-1" />
                    Recording
                  </Badge>
                )}
              </CardTitle>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>{session.participants.filter(p => p.isActive).length} active participants</span>
                <span>Skill level: {session.skillLevel}</span>
                <span>Focus: {session.focusAreas.join(', ')}</span>
                {session.duration && <span>{Math.round(session.duration)} min</span>}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Recording controls */}
              {isHost() && (
                <>
                  {!isRecording ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleStartRecording}
                      disabled={!session.isRecorded}
                    >
                      <CircleStop className="h-4 w-4 mr-1" />
                      Record
                    </Button>
                  ) : (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleStopRecording}
                    >
                      <Square className="h-4 w-4 mr-1" />
                      Stop
                    </Button>
                  )}
                </>
              )}

              {/* Session controls */}
              <Button variant="outline" size="sm">
                <Share className="h-4 w-4 mr-1" />
                Share
              </Button>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleLeaveSession}
              >
                Leave
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <div className="border-b px-4">
              <TabsList className="grid w-full max-w-md grid-cols-3">
                <TabsTrigger value="code">
                  <Code className="h-4 w-4 mr-1" />
                  Code
                </TabsTrigger>
                <TabsTrigger value="chat">
                  <MessageSquare className="h-4 w-4 mr-1" />
                  Chat
                </TabsTrigger>
                <TabsTrigger value="insights">
                  <Lightbulb className="h-4 w-4 mr-1" />
                  AI Insights
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="code" className="flex-1 p-4">
              <CollaborativeCodeEditor
                sessionId={session.sessionId}
                userId={user?.uid || ''}
                username={user?.displayName || user?.email || 'Anonymous'}
                sharedCode={session.sharedCode}
                canEdit={canEdit()}
                participants={session.participants}
                onCodeChange={handleCodeChange}
                onCursorMove={handleCursorMove}
                onSelectionChange={handleSelectionChange}
              />
            </TabsContent>

            <TabsContent value="chat" className="flex-1 p-4">
              <SessionChat
                sessionId={session.sessionId}
                userId={user?.uid || ''}
                username={user?.displayName || user?.email || 'Anonymous'}
                comments={[]} // Would come from session data
                aiSuggestions={session.aiSuggestions}
                realTimeInsights={session.realTimeInsights}
                onSendMessage={handleSendMessage}
                onReactToMessage={handleReactToMessage}
                onReplyToMessage={handleReplyToMessage}
              />
            </TabsContent>

            <TabsContent value="insights" className="flex-1 p-4">
              <AIInsightPanel
                sessionId={session.sessionId}
                userId={user?.uid || ''}
                aiSuggestions={session.aiSuggestions}
                realTimeInsights={session.realTimeInsights}
                onApplySuggestion={handleApplySuggestion}
                onVoteSuggestion={handleVoteSuggestion}
                onDismissInsight={handleDismissInsight}
                onMarkInsightRead={handleMarkInsightRead}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Participants sidebar */}
        <div className="w-80 border-l">
          <ParticipantsList
            sessionId={session.sessionId}
            currentUserId={user?.uid || ''}
            participants={session.participants}
            isHost={isHost()}
            onInviteParticipant={handleInviteParticipant}
            onUpdateParticipantRole={handleUpdateParticipantRole}
            onUpdateParticipantPermissions={handleUpdateParticipantPermissions}
            onRemoveParticipant={handleRemoveParticipant}
            onPromoteToHost={handlePromoteToHost}
          />
        </div>
      </div>
    </div>
  );}
