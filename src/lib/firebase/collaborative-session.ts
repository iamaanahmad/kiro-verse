// Firebase Collaborative Session Database Operations

import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs,
  addDoc,
  writeBatch,
  arrayUnion,
  arrayRemove,
  Timestamp,
  onSnapshot,
  deleteDoc
} from 'firebase/firestore';
import { db } from './config';
import {
  CollaborativeSession,
  SessionParticipant,
  SessionInvitation,
  SessionRecording,
  CollaborativeSessionSettings,
  CollaborativeSessionDocument,
  SessionInvitationDocument,
  SessionRecordingDocument,
  CollaborativeSessionSettingsDocument,
  AISuggestion,
  RealTimeInsight,
  TimestampedEvent,
  CodeHistoryEntry,
  SessionComment,
  RealTimeUpdate
} from '@/types/collaborative-session';

// Collection names
export const COLLABORATIVE_SESSION_COLLECTIONS = {
  SESSIONS: 'collaborativeSessions',
  INVITATIONS: 'sessionInvitations',
  RECORDINGS: 'sessionRecordings',
  SETTINGS: 'collaborativeSessionSettings',
  COMMENTS: 'sessionComments',
  REAL_TIME_UPDATES: 'realTimeUpdates'
} as const;

export class CollaborativeSessionService {
  // Helper methods for document conversion
  private static convertSessionToDocument(session: CollaborativeSession): CollaborativeSessionDocument {
    return {
      ...session,
      createdAt: session.createdAt.toISOString(),
      startedAt: session.startedAt?.toISOString(),
      endedAt: session.endedAt?.toISOString(),
      timestampedEvents: session.timestampedEvents.map(event => ({
        ...event,
        timestamp: event.timestamp.toISOString()
      })) as any,
      codeHistory: session.codeHistory.map(entry => ({
        ...entry,
        timestamp: entry.timestamp.toISOString()
      })) as any,
      aiSuggestions: session.aiSuggestions.map(suggestion => ({
        ...suggestion,
        createdAt: suggestion.createdAt.toISOString(),
        appliedAt: suggestion.appliedAt?.toISOString()
      })) as any,
      realTimeInsights: session.realTimeInsights.map(insight => ({
        ...insight,
        createdAt: insight.createdAt.toISOString(),
        expiresAt: insight.expiresAt?.toISOString()
      })) as any
    };
  }

  private static convertDocumentToSession(doc: CollaborativeSessionDocument): CollaborativeSession {
    return {
      ...doc,
      createdAt: new Date(doc.createdAt),
      startedAt: doc.startedAt ? new Date(doc.startedAt) : undefined,
      endedAt: doc.endedAt ? new Date(doc.endedAt) : undefined,
      timestampedEvents: doc.timestampedEvents.map(event => ({
        ...event,
        timestamp: new Date(event.timestamp as any)
      })),
      codeHistory: doc.codeHistory.map(entry => ({
        ...entry,
        timestamp: new Date(entry.timestamp as any)
      })),
      aiSuggestions: doc.aiSuggestions.map(suggestion => ({
        ...suggestion,
        createdAt: new Date(suggestion.createdAt as any),
        appliedAt: suggestion.appliedAt ? new Date(suggestion.appliedAt as any) : undefined
      })),
      realTimeInsights: doc.realTimeInsights.map(insight => ({
        ...insight,
        createdAt: new Date(insight.createdAt as any),
        expiresAt: insight.expiresAt ? new Date(insight.expiresAt as any) : undefined
      }))
    };
  }

  // Session CRUD Operations
  static async createSession(session: CollaborativeSession): Promise<string> {
    try {
      const docRef = doc(db, COLLABORATIVE_SESSION_COLLECTIONS.SESSIONS, session.sessionId);
      const document = this.convertSessionToDocument(session);
      await setDoc(docRef, document);
      return session.sessionId;
    } catch (error) {
      console.error('Error creating collaborative session:', error);
      throw error;
    }
  }

  static async getSession(sessionId: string): Promise<CollaborativeSession | null> {
    try {
      const docRef = doc(db, COLLABORATIVE_SESSION_COLLECTIONS.SESSIONS, sessionId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data() as CollaborativeSessionDocument;
        return this.convertDocumentToSession(data);
      }
      
      return null;
    } catch (error) {
      console.error('Error getting collaborative session:', error);
      throw error;
    }
  }

  static async updateSession(sessionId: string, updates: Partial<CollaborativeSession>): Promise<void> {
    try {
      const docRef = doc(db, COLLABORATIVE_SESSION_COLLECTIONS.SESSIONS, sessionId);
      const updateData: any = { ...updates };
      
      // Convert dates to strings for Firestore
      if (updates.startedAt) {
        updateData.startedAt = updates.startedAt.toISOString();
      }
      if (updates.endedAt) {
        updateData.endedAt = updates.endedAt.toISOString();
      }
      
      await updateDoc(docRef, updateData);
    } catch (error) {
      console.error('Error updating collaborative session:', error);
      throw error;
    }
  }

  static async deleteSession(sessionId: string): Promise<void> {
    try {
      const docRef = doc(db, COLLABORATIVE_SESSION_COLLECTIONS.SESSIONS, sessionId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting collaborative session:', error);
      throw error;
    }
  }

  // Participant Management
  static async joinSession(sessionId: string, participant: SessionParticipant): Promise<void> {
    try {
      const docRef = doc(db, COLLABORATIVE_SESSION_COLLECTIONS.SESSIONS, sessionId);
      await updateDoc(docRef, {
        participants: arrayUnion({
          ...participant,
          joinedAt: participant.joinedAt.toISOString(),
          leftAt: participant.leftAt?.toISOString(),
          lastActivity: participant.lastActivity.toISOString()
        })
      });
    } catch (error) {
      console.error('Error joining session:', error);
      throw error;
    }
  }

  static async leaveSession(sessionId: string, userId: string): Promise<void> {
    try {
      const session = await this.getSession(sessionId);
      if (!session) throw new Error('Session not found');

      const updatedParticipants = session.participants.map(p => 
        p.userId === userId 
          ? { ...p, isActive: false, leftAt: new Date() }
          : p
      );

      await this.updateSession(sessionId, { participants: updatedParticipants });
    } catch (error) {
      console.error('Error leaving session:', error);
      throw error;
    }
  }

  static async updateParticipantStatus(
    sessionId: string, 
    userId: string, 
    updates: Partial<SessionParticipant>
  ): Promise<void> {
    try {
      const session = await this.getSession(sessionId);
      if (!session) throw new Error('Session not found');

      const updatedParticipants = session.participants.map(p => 
        p.userId === userId ? { ...p, ...updates, lastActivity: new Date() } : p
      );

      await this.updateSession(sessionId, { participants: updatedParticipants });
    } catch (error) {
      console.error('Error updating participant status:', error);
      throw error;
    }
  }

  // Code Collaboration
  static async updateSharedCode(
    sessionId: string, 
    codeContent: string, 
    userId: string,
    operation: CodeHistoryEntry
  ): Promise<void> {
    try {
      const session = await this.getSession(sessionId);
      if (!session) throw new Error('Session not found');

      const updatedCodeState = {
        ...session.sharedCode,
        content: codeContent,
        version: session.sharedCode.version + 1,
        lastModifiedBy: userId,
        lastModifiedAt: new Date()
      };

      const updatedHistory = [...session.codeHistory, operation];

      await this.updateSession(sessionId, {
        sharedCode: updatedCodeState,
        codeHistory: updatedHistory
      });

      // Emit real-time update
      await this.emitRealTimeUpdate({
        type: 'code_change',
        sessionId,
        userId,
        data: { codeContent, operation },
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error updating shared code:', error);
      throw error;
    }
  }

  // AI Integration
  static async addAISuggestion(sessionId: string, suggestion: AISuggestion): Promise<void> {
    try {
      const session = await this.getSession(sessionId);
      if (!session) throw new Error('Session not found');

      const updatedSuggestions = [...session.aiSuggestions, suggestion];
      await this.updateSession(sessionId, { aiSuggestions: updatedSuggestions });

      // Emit real-time update
      await this.emitRealTimeUpdate({
        type: 'ai_suggestion',
        sessionId,
        data: suggestion,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error adding AI suggestion:', error);
      throw error;
    }
  }

  static async updateAISuggestion(
    sessionId: string, 
    suggestionId: string, 
    updates: Partial<AISuggestion>
  ): Promise<void> {
    try {
      const session = await this.getSession(sessionId);
      if (!session) throw new Error('Session not found');

      const updatedSuggestions = session.aiSuggestions.map(s => 
        s.suggestionId === suggestionId ? { ...s, ...updates } : s
      );

      await this.updateSession(sessionId, { aiSuggestions: updatedSuggestions });
    } catch (error) {
      console.error('Error updating AI suggestion:', error);
      throw error;
    }
  }

  static async addRealTimeInsight(sessionId: string, insight: RealTimeInsight): Promise<void> {
    try {
      const session = await this.getSession(sessionId);
      if (!session) throw new Error('Session not found');

      const updatedInsights = [...session.realTimeInsights, insight];
      await this.updateSession(sessionId, { realTimeInsights: updatedInsights });

      // Emit real-time update
      await this.emitRealTimeUpdate({
        type: 'insight',
        sessionId,
        data: insight,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error adding real-time insight:', error);
      throw error;
    }
  }

  // Session Discovery
  static async getPublicSessions(skillLevel?: string, focusAreas?: string[]): Promise<CollaborativeSession[]> {
    try {
      let q = query(
        collection(db, COLLABORATIVE_SESSION_COLLECTIONS.SESSIONS),
        where('isPublic', '==', true),
        where('status', 'in', ['waiting', 'active']),
        orderBy('createdAt', 'desc'),
        limit(20)
      );

      const querySnapshot = await getDocs(q);
      const sessions: CollaborativeSession[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data() as CollaborativeSessionDocument;
        const session = this.convertDocumentToSession(data);
        
        // Filter by skill level and focus areas if provided
        if (skillLevel && session.skillLevel !== skillLevel && session.skillLevel !== 'mixed') {
          return;
        }
        
        if (focusAreas && focusAreas.length > 0) {
          const hasMatchingFocus = focusAreas.some(area => 
            session.focusAreas.includes(area)
          );
          if (!hasMatchingFocus) return;
        }
        
        sessions.push(session);
      });
      
      return sessions;
    } catch (error) {
      console.error('Error getting public sessions:', error);
      throw error;
    }
  }

  static async getUserSessions(userId: string, status?: string): Promise<CollaborativeSession[]> {
    try {
      const q = query(
        collection(db, COLLABORATIVE_SESSION_COLLECTIONS.SESSIONS),
        where('participants', 'array-contains-any', [{ userId }]),
        orderBy('createdAt', 'desc'),
        limit(50)
      );

      const querySnapshot = await getDocs(q);
      const sessions: CollaborativeSession[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data() as CollaborativeSessionDocument;
        const session = this.convertDocumentToSession(data);
        
        // Check if user is actually a participant
        const isParticipant = session.participants.some(p => p.userId === userId);
        if (!isParticipant) return;
        
        // Filter by status if provided
        if (status && session.status !== status) return;
        
        sessions.push(session);
      });
      
      return sessions;
    } catch (error) {
      console.error('Error getting user sessions:', error);
      throw error;
    }
  }

  // Invitations
  static async createInvitation(invitation: SessionInvitation): Promise<string> {
    try {
      const docRef = doc(db, COLLABORATIVE_SESSION_COLLECTIONS.INVITATIONS, invitation.invitationId);
      const document: SessionInvitationDocument = {
        ...invitation,
        sentAt: invitation.sentAt.toISOString(),
        respondedAt: invitation.respondedAt?.toISOString(),
        expiresAt: invitation.expiresAt.toISOString()
      };
      await setDoc(docRef, document);
      return invitation.invitationId;
    } catch (error) {
      console.error('Error creating session invitation:', error);
      throw error;
    }
  }

  static async respondToInvitation(
    invitationId: string, 
    response: 'accepted' | 'declined'
  ): Promise<void> {
    try {
      const docRef = doc(db, COLLABORATIVE_SESSION_COLLECTIONS.INVITATIONS, invitationId);
      await updateDoc(docRef, {
        status: response,
        respondedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error responding to invitation:', error);
      throw error;
    }
  }

  static async getUserInvitations(userId: string): Promise<SessionInvitation[]> {
    try {
      const q = query(
        collection(db, COLLABORATIVE_SESSION_COLLECTIONS.INVITATIONS),
        where('inviteeId', '==', userId),
        where('status', '==', 'pending'),
        orderBy('sentAt', 'desc'),
        limit(20)
      );

      const querySnapshot = await getDocs(q);
      const invitations: SessionInvitation[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data() as SessionInvitationDocument;
        invitations.push({
          ...data,
          sentAt: new Date(data.sentAt),
          respondedAt: data.respondedAt ? new Date(data.respondedAt) : undefined,
          expiresAt: new Date(data.expiresAt)
        });
      });
      
      return invitations;
    } catch (error) {
      console.error('Error getting user invitations:', error);
      throw error;
    }
  }

  // Recording and Playback
  static async createRecording(recording: SessionRecording): Promise<string> {
    try {
      const docRef = doc(db, COLLABORATIVE_SESSION_COLLECTIONS.RECORDINGS, recording.recordingId);
      const document: SessionRecordingDocument = {
        ...recording,
        createdAt: recording.createdAt.toISOString(),
        events: recording.events.map(event => ({
          ...event,
          timestamp: event.timestamp.toISOString()
        })) as any,
        keyMoments: recording.keyMoments.map(moment => ({
          ...moment,
          timestamp: moment.timestamp.toISOString()
        })) as any
      };
      await setDoc(docRef, document);
      return recording.recordingId;
    } catch (error) {
      console.error('Error creating session recording:', error);
      throw error;
    }
  }

  static async getRecording(recordingId: string): Promise<SessionRecording | null> {
    try {
      const docRef = doc(db, COLLABORATIVE_SESSION_COLLECTIONS.RECORDINGS, recordingId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data() as SessionRecordingDocument;
        return {
          ...data,
          createdAt: new Date(data.createdAt),
          events: data.events.map(event => ({
            ...event,
            timestamp: new Date(event.timestamp as any)
          })),
          keyMoments: data.keyMoments.map(moment => ({
            ...moment,
            timestamp: new Date(moment.timestamp as any)
          }))
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error getting session recording:', error);
      throw error;
    }
  }

  // Real-time Updates
  static async emitRealTimeUpdate(update: RealTimeUpdate): Promise<void> {
    try {
      const docRef = doc(collection(db, COLLABORATIVE_SESSION_COLLECTIONS.REAL_TIME_UPDATES));
      await setDoc(docRef, {
        ...update,
        timestamp: update.timestamp.toISOString()
      });
    } catch (error) {
      console.error('Error emitting real-time update:', error);
      throw error;
    }
  }

  static subscribeToSessionUpdates(
    sessionId: string, 
    callback: (update: RealTimeUpdate) => void
  ): () => void {
    const q = query(
      collection(db, COLLABORATIVE_SESSION_COLLECTIONS.REAL_TIME_UPDATES),
      where('sessionId', '==', sessionId),
      orderBy('timestamp', 'desc'),
      limit(1)
    );

    return onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const data = change.doc.data();
          const update: RealTimeUpdate = {
            ...data,
            timestamp: new Date(data.timestamp)
          } as RealTimeUpdate;
          callback(update);
        }
      });
    });
  }

  // Settings
  static async updateSettings(settings: CollaborativeSessionSettings): Promise<void> {
    try {
      const docRef = doc(db, COLLABORATIVE_SESSION_COLLECTIONS.SETTINGS, settings.userId);
      const document: CollaborativeSessionSettingsDocument = {
        ...settings,
        updatedAt: settings.updatedAt.toISOString()
      };
      await setDoc(docRef, document);
    } catch (error) {
      console.error('Error updating collaborative session settings:', error);
      throw error;
    }
  }

  static async getSettings(userId: string): Promise<CollaborativeSessionSettings | null> {
    try {
      const docRef = doc(db, COLLABORATIVE_SESSION_COLLECTIONS.SETTINGS, userId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data() as CollaborativeSessionSettingsDocument;
        return {
          ...data,
          updatedAt: new Date(data.updatedAt)
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error getting collaborative session settings:', error);
      throw error;
    }
  }

  // Analytics
  static async getSessionAnalytics(userId: string): Promise<any> {
    try {
      const sessions = await this.getUserSessions(userId);
      
      const totalSessions = sessions.length;
      const completedSessions = sessions.filter(s => s.status === 'completed');
      const totalDuration = completedSessions.reduce((sum, s) => sum + (s.duration || 0), 0);
      const averageParticipants = sessions.length > 0 
        ? sessions.reduce((sum, s) => sum + s.participants.length, 0) / sessions.length 
        : 0;

      return {
        totalSessions,
        totalDuration,
        averageParticipants,
        completedSessions: completedSessions.length,
        skillsImproved: [], // Would be calculated from session outcomes
        collaborationScore: 0, // Would be calculated from peer feedback
        aiInteractionCount: 0, // Would be calculated from AI suggestions used
        recordingsCreated: 0 // Would be calculated from recordings
      };
    } catch (error) {
      console.error('Error getting session analytics:', error);
      throw error;
    }
  }
}