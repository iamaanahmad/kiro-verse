// Collaborative Session Types for Real-time Coding

export interface CollaborativeSession {
  sessionId: string;
  hostId: string;
  participants: SessionParticipant[];
  title: string;
  description: string;
  status: 'waiting' | 'active' | 'paused' | 'completed' | 'cancelled';
  
  // Session configuration
  maxParticipants: number;
  isPublic: boolean;
  requiresApproval: boolean;
  skillLevel: 'beginner' | 'intermediate' | 'advanced' | 'mixed';
  focusAreas: string[];
  
  // Code sharing
  sharedCode: SharedCodeState;
  codeHistory: CodeHistoryEntry[];
  
  // AI integration
  aiMentorEnabled: boolean;
  aiSuggestions: AISuggestion[];
  realTimeInsights: RealTimeInsight[];
  
  // Session metadata
  createdAt: Date;
  startedAt?: Date;
  endedAt?: Date;
  duration?: number; // in minutes
  
  // Recording and playback
  isRecorded: boolean;
  recordingUrl?: string;
  timestampedEvents: TimestampedEvent[];
  
  // Collaboration features
  voiceEnabled: boolean;
  screenSharingEnabled: boolean;
  whiteboardEnabled: boolean;
}

export interface SessionParticipant {
  userId: string;
  username: string;
  role: 'host' | 'participant' | 'observer';
  joinedAt: Date;
  leftAt?: Date;
  isActive: boolean;
  
  // Permissions
  canEdit: boolean;
  canSuggest: boolean;
  canComment: boolean;
  
  // Status
  cursor?: CursorPosition;
  selection?: CodeSelection;
  isTyping: boolean;
  lastActivity: Date;
  
  // Contribution tracking
  linesAdded: number;
  linesModified: number;
  suggestionsGiven: number;
  helpfulnessScore: number;
}

export interface SharedCodeState {
  content: string;
  language: string;
  fileName?: string;
  
  // Real-time editing
  version: number;
  lastModifiedBy: string;
  lastModifiedAt: Date;
  
  // Operational Transform data for conflict resolution
  operations: Operation[];
  
  // Syntax highlighting and formatting
  syntaxErrors: SyntaxError[];
  formattingApplied: boolean;
}

export interface CodeHistoryEntry {
  entryId: string;
  timestamp: Date;
  userId: string;
  username: string;
  operation: 'insert' | 'delete' | 'replace' | 'format';
  
  // Change details
  startPosition: Position;
  endPosition?: Position;
  oldContent?: string;
  newContent?: string;
  
  // Context
  description: string;
  aiSuggestionId?: string;
}

export interface Operation {
  operationId: string;
  type: 'insert' | 'delete' | 'retain';
  position: number;
  content?: string;
  length?: number;
  userId: string;
  timestamp: Date;
  applied: boolean;
}

export interface Position {
  line: number;
  column: number;
  offset: number;
}

export interface CursorPosition {
  line: number;
  column: number;
  userId: string;
  color: string;
  visible: boolean;
}

export interface CodeSelection {
  start: Position;
  end: Position;
  userId: string;
  color: string;
}

export interface AISuggestion {
  suggestionId: string;
  type: 'improvement' | 'bug_fix' | 'optimization' | 'best_practice' | 'learning';
  title: string;
  description: string;
  
  // Code context
  targetPosition: Position;
  targetCode: string;
  suggestedCode: string;
  
  // AI analysis
  confidence: number;
  reasoning: string;
  skillsTargeted: string[];
  
  // Interaction
  status: 'pending' | 'accepted' | 'rejected' | 'modified';
  votes: SuggestionVote[];
  appliedBy?: string;
  appliedAt?: Date;
  
  // Metadata
  createdAt: Date;
  priority: 'low' | 'medium' | 'high';
  category: string;
}

export interface SuggestionVote {
  userId: string;
  vote: 'up' | 'down';
  comment?: string;
  timestamp: Date;
}

export interface RealTimeInsight {
  insightId: string;
  type: 'code_quality' | 'performance' | 'security' | 'best_practice' | 'learning_opportunity';
  title: string;
  message: string;
  
  // Context
  triggeredBy: 'code_change' | 'ai_analysis' | 'peer_interaction' | 'time_based';
  relatedCode?: string;
  relatedPosition?: Position;
  
  // Visibility
  targetUsers: string[]; // Empty array means visible to all
  priority: 'info' | 'warning' | 'error' | 'success';
  
  // Interaction
  isRead: { [userId: string]: boolean };
  responses: InsightResponse[];
  
  // Metadata
  createdAt: Date;
  expiresAt?: Date;
  aiGenerated: boolean;
}

export interface InsightResponse {
  userId: string;
  response: 'helpful' | 'not_helpful' | 'question';
  comment?: string;
  timestamp: Date;
}

export interface TimestampedEvent {
  eventId: string;
  timestamp: Date;
  type: 'code_change' | 'ai_suggestion' | 'participant_join' | 'participant_leave' | 
        'comment' | 'voice_note' | 'screen_share' | 'whiteboard_action';
  
  // Event data
  userId?: string;
  data: any;
  description: string;
  
  // Playback
  duration?: number;
  isKeyframe: boolean;
}

export interface SessionComment {
  commentId: string;
  userId: string;
  username: string;
  content: string;
  
  // Context
  codePosition?: Position;
  codeSnippet?: string;
  replyTo?: string;
  
  // Metadata
  createdAt: Date;
  editedAt?: Date;
  isResolved: boolean;
  
  // Reactions
  reactions: CommentReaction[];
  replies: SessionComment[];
}

export interface CommentReaction {
  userId: string;
  emoji: string;
  timestamp: Date;
}

export interface SessionInvitation {
  invitationId: string;
  sessionId: string;
  inviterId: string;
  inviteeId: string;
  
  // Invitation details
  message?: string;
  role: 'participant' | 'observer';
  permissions: ParticipantPermissions;
  
  // Status
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  sentAt: Date;
  respondedAt?: Date;
  expiresAt: Date;
}

export interface ParticipantPermissions {
  canEdit: boolean;
  canSuggest: boolean;
  canComment: boolean;
  canInviteOthers: boolean;
  canModerateChat: boolean;
}

export interface SessionRecording {
  recordingId: string;
  sessionId: string;
  title: string;
  description?: string;
  
  // Recording data
  events: TimestampedEvent[];
  finalCode: string;
  duration: number;
  
  // AI analysis of session
  keyMoments: KeyMoment[];
  learningOutcomes: string[];
  skillsImproved: string[];
  collaborationInsights: string[];
  
  // Metadata
  createdAt: Date;
  isPublic: boolean;
  viewCount: number;
  
  // Access control
  allowedViewers: string[];
  requiresAuthentication: boolean;
}

export interface KeyMoment {
  momentId: string;
  timestamp: Date;
  title: string;
  description: string;
  type: 'breakthrough' | 'learning' | 'collaboration' | 'problem_solving' | 'ai_insight';
  
  // Context
  codeSnapshot: string;
  participantsInvolved: string[];
  aiInsightId?: string;
  
  // Importance
  importance: number; // 1-10 scale
  skillsRelevant: string[];
}

export interface CollaborativeSessionSettings {
  userId: string;
  
  // Default preferences
  defaultMaxParticipants: number;
  defaultIsPublic: boolean;
  defaultRequiresApproval: boolean;
  
  // Notification preferences
  notifyOnInvitation: boolean;
  notifyOnSessionStart: boolean;
  notifyOnAISuggestion: boolean;
  notifyOnMention: boolean;
  
  // Privacy settings
  allowPublicInvitations: boolean;
  shareProfileInSessions: boolean;
  allowRecording: boolean;
  
  // AI preferences
  enableAIMentor: boolean;
  aiSuggestionFrequency: 'minimal' | 'moderate' | 'frequent';
  aiInsightTypes: string[];
  
  // Collaboration preferences
  preferredRole: 'host' | 'participant' | 'observer';
  skillsToShare: string[];
  skillsToLearn: string[];
  
  updatedAt: Date;
}

// Database document interfaces for Firestore
export interface CollaborativeSessionDocument {
  sessionId: string;
  hostId: string;
  participants: SessionParticipant[];
  title: string;
  description: string;
  status: 'waiting' | 'active' | 'paused' | 'completed' | 'cancelled';
  maxParticipants: number;
  isPublic: boolean;
  requiresApproval: boolean;
  skillLevel: 'beginner' | 'intermediate' | 'advanced' | 'mixed';
  focusAreas: string[];
  sharedCode: SharedCodeState;
  codeHistory: CodeHistoryEntry[];
  aiMentorEnabled: boolean;
  aiSuggestions: AISuggestion[];
  realTimeInsights: RealTimeInsight[];
  createdAt: string;
  startedAt?: string;
  endedAt?: string;
  duration?: number;
  isRecorded: boolean;
  recordingUrl?: string;
  timestampedEvents: TimestampedEvent[];
  voiceEnabled: boolean;
  screenSharingEnabled: boolean;
  whiteboardEnabled: boolean;
}

export interface SessionInvitationDocument {
  invitationId: string;
  sessionId: string;
  inviterId: string;
  inviteeId: string;
  message?: string;
  role: 'participant' | 'observer';
  permissions: ParticipantPermissions;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  sentAt: string;
  respondedAt?: string;
  expiresAt: string;
}

export interface SessionRecordingDocument {
  recordingId: string;
  sessionId: string;
  title: string;
  description?: string;
  events: TimestampedEvent[];
  finalCode: string;
  duration: number;
  keyMoments: KeyMoment[];
  learningOutcomes: string[];
  skillsImproved: string[];
  collaborationInsights: string[];
  createdAt: string;
  isPublic: boolean;
  viewCount: number;
  allowedViewers: string[];
  requiresAuthentication: boolean;
}

export interface CollaborativeSessionSettingsDocument {
  userId: string;
  defaultMaxParticipants: number;
  defaultIsPublic: boolean;
  defaultRequiresApproval: boolean;
  notifyOnInvitation: boolean;
  notifyOnSessionStart: boolean;
  notifyOnAISuggestion: boolean;
  notifyOnMention: boolean;
  allowPublicInvitations: boolean;
  shareProfileInSessions: boolean;
  allowRecording: boolean;
  enableAIMentor: boolean;
  aiSuggestionFrequency: 'minimal' | 'moderate' | 'frequent';
  aiInsightTypes: string[];
  preferredRole: 'host' | 'participant' | 'observer';
  skillsToShare: string[];
  skillsToLearn: string[];
  updatedAt: string;
}

// API Response types
export interface SessionMatchResult {
  recommendedSessions: CollaborativeSession[];
  skillBasedMatches: CollaborativeSession[];
  publicSessions: CollaborativeSession[];
  friendSessions: CollaborativeSession[];
}

export interface SessionAnalytics {
  totalSessions: number;
  totalDuration: number;
  averageParticipants: number;
  skillsImproved: string[];
  collaborationScore: number;
  aiInteractionCount: number;
  recordingsCreated: number;
  learningOutcomes: string[];
}

export interface RealTimeUpdate {
  type: 'code_change' | 'cursor_move' | 'participant_join' | 'participant_leave' | 
        'ai_suggestion' | 'insight' | 'comment' | 'status_change';
  sessionId: string;
  userId?: string;
  data: any;
  timestamp: Date;
}