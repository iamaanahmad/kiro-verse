// Firebase Analytics Database Operations and Schema Management

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
  writeBatch
} from 'firebase/firestore';
import { db } from './config';
import {
  UserProgress,
  AnalyticsData,
  LearningInsight,
  Challenge,
  Competition,
  ChallengeSubmission,
  UserProgressDocument,
  AnalyticsDataDocument,
  LearningInsightDocument,
  ChallengeDocument,
  CompetitionDocument,
  ChallengeSubmissionDocument,
  SkillLevel
} from '@/types/analytics';

// Collection names
export const COLLECTIONS = {
  USER_PROGRESS: 'userProgress',
  ANALYTICS_DATA: 'analyticsData',
  LEARNING_INSIGHTS: 'learningInsights',
  SKILL_LEVELS: 'skillLevels',
  CHALLENGES: 'challenges',
  COMPETITIONS: 'competitions',
  CHALLENGE_SUBMISSIONS: 'challengeSubmissions',
  BENCHMARKS: 'benchmarks'
} as const;

// Database schema initialization
export async function initializeAnalyticsSchema() {
  try {
    // Create indexes for optimal query performance
    // Note: In production, these would be created via Firebase Console or CLI
    console.log('Analytics schema initialization completed');
    return true;
  } catch (error) {
    console.error('Failed to initialize analytics schema:', error);
    return false;
  }
}

// User Progress Operations
export class UserProgressService {
  static async getUserProgress(userId: string): Promise<UserProgress | null> {
    try {
      const docRef = doc(db, COLLECTIONS.USER_PROGRESS, userId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data() as UserProgressDocument;
        return this.convertDocumentToUserProgress(data);
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching user progress:', error);
      
      // Check if it's a network error and provide appropriate fallback
      if (error instanceof Error && (
        error.message.includes('network') || 
        error.message.includes('offline') ||
        error.message.includes('unavailable')
      )) {
        console.warn('Network error detected, returning cached data if available');
        // In a real implementation, you might check local storage or IndexedDB
        return null;
      }
      
      throw error;
    }
  }

  static async createUserProgress(userProgress: UserProgress): Promise<void> {
    try {
      const docRef = doc(db, COLLECTIONS.USER_PROGRESS, userProgress.userId);
      const document = this.convertUserProgressToDocument(userProgress);
      await setDoc(docRef, document);
    } catch (error) {
      console.error('Error creating user progress:', error);
      throw error;
    }
  }

  static async updateUserProgress(userId: string, updates: Partial<UserProgress>): Promise<void> {
    try {
      const docRef = doc(db, COLLECTIONS.USER_PROGRESS, userId);
      const updateData: any = {
        ...updates,
        updatedAt: new Date().toISOString()
      };
      await updateDoc(docRef, updateData);
    } catch (error) {
      console.error('Error updating user progress:', error);
      throw error;
    }
  }

  static async updateSkillLevel(userId: string, skillLevel: SkillLevel): Promise<void> {
    try {
      const docRef = doc(db, COLLECTIONS.USER_PROGRESS, userId);
      const updateData = {
        [`skillLevels.${skillLevel.skillId}`]: skillLevel,
        updatedAt: new Date().toISOString()
      };
      await updateDoc(docRef, updateData);
    } catch (error) {
      console.error('Error updating skill level:', error);
      throw error;
    }
  }

  static async getUserSkillLevels(userId: string): Promise<Map<string, SkillLevel> | null> {
    try {
      const userProgress = await this.getUserProgress(userId);
      return userProgress?.skillLevels || null;
    } catch (error) {
      console.error('Error fetching user skill levels:', error);
      throw error;
    }
  }

  static async getTopSkillsForUser(userId: string, limit: number = 5): Promise<SkillLevel[]> {
    try {
      const userProgress = await this.getUserProgress(userId);
      if (!userProgress?.skillLevels) return [];

      return Array.from(userProgress.skillLevels.values())
        .sort((a, b) => b.currentLevel - a.currentLevel || b.experiencePoints - a.experiencePoints)
        .slice(0, limit);
    } catch (error) {
      console.error('Error fetching top skills:', error);
      throw error;
    }
  }

  static async getUserLearningVelocity(userId: string): Promise<number> {
    try {
      const userProgress = await this.getUserProgress(userId);
      return userProgress?.learningVelocity || 0;
    } catch (error) {
      console.error('Error fetching learning velocity:', error);
      throw error;
    }
  }

  private static convertDocumentToUserProgress(doc: UserProgressDocument): UserProgress {
    return {
      ...doc,
      skillLevels: new Map(Object.entries(doc.skillLevels || {})),
      lastAnalysisDate: new Date(doc.lastAnalysisDate),
      createdAt: new Date(doc.createdAt),
      updatedAt: new Date(doc.updatedAt)
    };
  }

  private static convertUserProgressToDocument(progress: UserProgress): UserProgressDocument {
    return {
      ...progress,
      skillLevels: Object.fromEntries(progress.skillLevels || new Map()),
      lastAnalysisDate: progress.lastAnalysisDate.toISOString(),
      createdAt: progress.createdAt.toISOString(),
      updatedAt: progress.updatedAt.toISOString()
    };
  }
}

// Analytics Data Operations
export class AnalyticsDataService {
  static async saveAnalyticsData(analyticsData: AnalyticsData): Promise<string> {
    try {
      const collectionRef = collection(db, COLLECTIONS.ANALYTICS_DATA);
      const document = this.convertAnalyticsDataToDocument(analyticsData);
      const docRef = await addDoc(collectionRef, document);
      return docRef.id;
    } catch (error) {
      console.error('Error saving analytics data:', error);
      
      // For critical data, we might want to queue it for retry
      if (error instanceof Error && (
        error.message.includes('network') || 
        error.message.includes('offline')
      )) {
        console.warn('Network error saving analytics data, consider queuing for retry');
        // In a real implementation, you might save to local storage for retry later
      }
      
      throw error;
    }
  }

  static async getAnalyticsData(userId: string, limitCount: number = 50): Promise<AnalyticsData[]> {
    try {
      const q = query(
        collection(db, COLLECTIONS.ANALYTICS_DATA),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => 
        this.convertDocumentToAnalyticsData(doc.data() as AnalyticsDataDocument)
      );
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      throw error;
    }
  }

  static async getRecentAnalytics(userId: string, days: number = 30): Promise<AnalyticsData[]> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      
      const q = query(
        collection(db, COLLECTIONS.ANALYTICS_DATA),
        where('userId', '==', userId),
        where('timestamp', '>=', cutoffDate.toISOString()),
        orderBy('timestamp', 'desc'),
        limit(100)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => 
        this.convertDocumentToAnalyticsData(doc.data() as AnalyticsDataDocument)
      );
    } catch (error) {
      console.error('Error fetching recent analytics data:', error);
      throw error;
    }
  }

  static async getAnalyticsDataBySession(sessionId: string): Promise<AnalyticsData | null> {
    try {
      const q = query(
        collection(db, COLLECTIONS.ANALYTICS_DATA),
        where('sessionId', '==', sessionId),
        limit(1)
      );
      
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return this.convertDocumentToAnalyticsData(doc.data() as AnalyticsDataDocument);
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching analytics data by session:', error);
      throw error;
    }
  }

  private static convertDocumentToAnalyticsData(doc: AnalyticsDataDocument): AnalyticsData {
    return {
      ...doc,
      timestamp: new Date(doc.timestamp)
    };
  }

  private static convertAnalyticsDataToDocument(data: AnalyticsData): AnalyticsDataDocument {
    return {
      ...data,
      timestamp: data.timestamp.toISOString()
    };
  }
}

// Learning Insights Operations
export class LearningInsightsService {
  static async saveLearningInsight(insight: LearningInsight): Promise<string> {
    try {
      const docRef = doc(db, COLLECTIONS.LEARNING_INSIGHTS, insight.id);
      const document = this.convertLearningInsightToDocument(insight);
      await setDoc(docRef, document);
      return insight.id;
    } catch (error) {
      console.error('Error saving learning insight:', error);
      throw error;
    }
  }

  static async getUserLearningInsights(
    userId: string, 
    unreadOnly: boolean = false,
    limitCount: number = 20
  ): Promise<LearningInsight[]> {
    try {
      let q = query(
        collection(db, COLLECTIONS.LEARNING_INSIGHTS),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      if (unreadOnly) {
        q = query(
          collection(db, COLLECTIONS.LEARNING_INSIGHTS),
          where('userId', '==', userId),
          where('isRead', '==', false),
          orderBy('createdAt', 'desc'),
          limit(limitCount)
        );
      }
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => 
        this.convertDocumentToLearningInsight(doc.data() as LearningInsightDocument)
      );
    } catch (error) {
      console.error('Error fetching learning insights:', error);
      throw error;
    }
  }

  static async markInsightAsRead(insightId: string): Promise<void> {
    try {
      const docRef = doc(db, COLLECTIONS.LEARNING_INSIGHTS, insightId);
      await updateDoc(docRef, { isRead: true });
    } catch (error) {
      console.error('Error marking insight as read:', error);
      throw error;
    }
  }

  static async deleteExpiredInsights(): Promise<number> {
    try {
      const now = new Date().toISOString();
      const q = query(
        collection(db, COLLECTIONS.LEARNING_INSIGHTS),
        where('expiresAt', '<=', now)
      );
      
      const querySnapshot = await getDocs(q);
      const batch = writeBatch(db);
      
      querySnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
      return querySnapshot.size;
    } catch (error) {
      console.error('Error deleting expired insights:', error);
      throw error;
    }
  }

  private static convertDocumentToLearningInsight(doc: LearningInsightDocument): LearningInsight {
    return {
      ...doc,
      createdAt: new Date(doc.createdAt),
      expiresAt: doc.expiresAt ? new Date(doc.expiresAt) : undefined
    };
  }

  private static convertLearningInsightToDocument(insight: LearningInsight): LearningInsightDocument {
    return {
      ...insight,
      createdAt: insight.createdAt.toISOString(),
      expiresAt: insight.expiresAt?.toISOString()
    };
  }
}

// Challenge Operations
export class ChallengeService {
  static async createChallenge(challenge: Challenge): Promise<string> {
    try {
      const docRef = doc(db, COLLECTIONS.CHALLENGES, challenge.challengeId);
      const document = this.convertChallengeToDocument(challenge);
      await setDoc(docRef, document);
      return challenge.challengeId;
    } catch (error) {
      console.error('Error creating challenge:', error);
      throw error;
    }
  }

  static async getChallenge(challengeId: string): Promise<Challenge | null> {
    try {
      const docRef = doc(db, COLLECTIONS.CHALLENGES, challengeId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data() as ChallengeDocument;
        return this.convertDocumentToChallenge(data);
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching challenge:', error);
      throw error;
    }
  }

  static async getChallengesByDifficulty(
    difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert',
    limitCount: number = 20
  ): Promise<Challenge[]> {
    try {
      const q = query(
        collection(db, COLLECTIONS.CHALLENGES),
        where('difficulty', '==', difficulty),
        where('isActive', '==', true),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => 
        this.convertDocumentToChallenge(doc.data() as ChallengeDocument)
      );
    } catch (error) {
      console.error('Error fetching challenges by difficulty:', error);
      throw error;
    }
  }

  static async getChallengesBySkill(
    skillId: string,
    limitCount: number = 20
  ): Promise<Challenge[]> {
    try {
      const q = query(
        collection(db, COLLECTIONS.CHALLENGES),
        where('skillsTargeted', 'array-contains', skillId),
        where('isActive', '==', true),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => 
        this.convertDocumentToChallenge(doc.data() as ChallengeDocument)
      );
    } catch (error) {
      console.error('Error fetching challenges by skill:', error);
      throw error;
    }
  }

  static async getChallengesByCategory(
    category: string,
    limitCount: number = 20
  ): Promise<Challenge[]> {
    try {
      const q = query(
        collection(db, COLLECTIONS.CHALLENGES),
        where('category', '==', category),
        where('isActive', '==', true),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => 
        this.convertDocumentToChallenge(doc.data() as ChallengeDocument)
      );
    } catch (error) {
      console.error('Error fetching challenges by category:', error);
      throw error;
    }
  }

  static async updateChallenge(challengeId: string, updates: Partial<Challenge>): Promise<void> {
    try {
      const docRef = doc(db, COLLECTIONS.CHALLENGES, challengeId);
      const updateData: any = {
        ...updates,
        updatedAt: new Date().toISOString()
      };
      await updateDoc(docRef, updateData);
    } catch (error) {
      console.error('Error updating challenge:', error);
      throw error;
    }
  }

  static async updateChallengeStats(
    challengeId: string, 
    participantCount: number, 
    averageScore: number, 
    successRate: number
  ): Promise<void> {
    try {
      const docRef = doc(db, COLLECTIONS.CHALLENGES, challengeId);
      await updateDoc(docRef, {
        participantCount,
        averageScore,
        successRate,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating challenge stats:', error);
      throw error;
    }
  }

  static async deactivateChallenge(challengeId: string): Promise<void> {
    try {
      await this.updateChallenge(challengeId, { isActive: false });
    } catch (error) {
      console.error('Error deactivating challenge:', error);
      throw error;
    }
  }

  static async getActiveChallenges(limitCount: number = 50): Promise<Challenge[]> {
    try {
      const q = query(
        collection(db, COLLECTIONS.CHALLENGES),
        where('isActive', '==', true),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => 
        this.convertDocumentToChallenge(doc.data() as ChallengeDocument)
      );
    } catch (error) {
      console.error('Error fetching active challenges:', error);
      throw error;
    }
  }

  private static convertDocumentToChallenge(doc: ChallengeDocument): Challenge {
    return {
      ...doc,
      createdAt: new Date(doc.createdAt),
      updatedAt: new Date(doc.updatedAt)
    };
  }

  private static convertChallengeToDocument(challenge: Challenge): ChallengeDocument {
    return {
      ...challenge,
      createdAt: challenge.createdAt.toISOString(),
      updatedAt: challenge.updatedAt.toISOString()
    };
  }
}

// Competition Operations
export class CompetitionService {
  static async createCompetition(competition: Competition): Promise<string> {
    try {
      const docRef = doc(db, COLLECTIONS.COMPETITIONS, competition.competitionId);
      const document = this.convertCompetitionToDocument(competition);
      await setDoc(docRef, document);
      return competition.competitionId;
    } catch (error) {
      console.error('Error creating competition:', error);
      throw error;
    }
  }

  static async getCompetition(competitionId: string): Promise<Competition | null> {
    try {
      const docRef = doc(db, COLLECTIONS.COMPETITIONS, competitionId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data() as CompetitionDocument;
        return this.convertDocumentToCompetition(data);
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching competition:', error);
      throw error;
    }
  }

  static async getActiveCompetitions(): Promise<Competition[]> {
    try {
      const now = new Date().toISOString();
      const q = query(
        collection(db, COLLECTIONS.COMPETITIONS),
        where('status', '==', 'active'),
        where('endDate', '>', now),
        orderBy('endDate', 'asc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => 
        this.convertDocumentToCompetition(doc.data() as CompetitionDocument)
      );
    } catch (error) {
      console.error('Error fetching active competitions:', error);
      throw error;
    }
  }

  static async getUpcomingCompetitions(): Promise<Competition[]> {
    try {
      const now = new Date().toISOString();
      const q = query(
        collection(db, COLLECTIONS.COMPETITIONS),
        where('status', '==', 'upcoming'),
        where('startDate', '>', now),
        orderBy('startDate', 'asc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => 
        this.convertDocumentToCompetition(doc.data() as CompetitionDocument)
      );
    } catch (error) {
      console.error('Error fetching upcoming competitions:', error);
      throw error;
    }
  }

  static async updateCompetitionStatus(
    competitionId: string, 
    status: 'upcoming' | 'active' | 'completed' | 'cancelled'
  ): Promise<void> {
    try {
      const docRef = doc(db, COLLECTIONS.COMPETITIONS, competitionId);
      await updateDoc(docRef, {
        status,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating competition status:', error);
      throw error;
    }
  }

  static async addParticipantToCompetition(
    competitionId: string, 
    participant: any
  ): Promise<void> {
    try {
      const competition = await this.getCompetition(competitionId);
      if (!competition) throw new Error('Competition not found');

      const updatedParticipants = [...competition.participants, participant];
      await this.updateCompetition(competitionId, { participants: updatedParticipants });
    } catch (error) {
      console.error('Error adding participant to competition:', error);
      throw error;
    }
  }

  static async updateCompetitionLeaderboard(
    competitionId: string, 
    leaderboard: any[]
  ): Promise<void> {
    try {
      await this.updateCompetition(competitionId, { leaderboard });
    } catch (error) {
      console.error('Error updating competition leaderboard:', error);
      throw error;
    }
  }

  private static async updateCompetition(competitionId: string, updates: Partial<Competition>): Promise<void> {
    try {
      const docRef = doc(db, COLLECTIONS.COMPETITIONS, competitionId);
      const updateData: any = {
        ...updates,
        updatedAt: new Date().toISOString()
      };
      await updateDoc(docRef, updateData);
    } catch (error) {
      console.error('Error updating competition:', error);
      throw error;
    }
  }

  private static convertDocumentToCompetition(doc: CompetitionDocument): Competition {
    return {
      ...doc,
      startDate: new Date(doc.startDate),
      endDate: new Date(doc.endDate),
      registrationDeadline: doc.registrationDeadline ? new Date(doc.registrationDeadline) : undefined,
      createdAt: new Date(doc.createdAt),
      updatedAt: new Date(doc.updatedAt)
    };
  }

  private static convertCompetitionToDocument(competition: Competition): CompetitionDocument {
    return {
      ...competition,
      startDate: competition.startDate.toISOString(),
      endDate: competition.endDate.toISOString(),
      registrationDeadline: competition.registrationDeadline?.toISOString(),
      createdAt: competition.createdAt.toISOString(),
      updatedAt: competition.updatedAt.toISOString()
    };
  }
}

// Challenge Submission Operations
export class ChallengeSubmissionService {
  static async submitChallenge(submission: ChallengeSubmission): Promise<string> {
    try {
      const docRef = doc(db, COLLECTIONS.CHALLENGE_SUBMISSIONS, submission.submissionId);
      const document = this.convertSubmissionToDocument(submission);
      await setDoc(docRef, document);
      return submission.submissionId;
    } catch (error) {
      console.error('Error submitting challenge:', error);
      throw error;
    }
  }

  static async getUserSubmissions(
    userId: string, 
    challengeId?: string,
    limitCount: number = 50
  ): Promise<ChallengeSubmission[]> {
    try {
      let q = query(
        collection(db, COLLECTIONS.CHALLENGE_SUBMISSIONS),
        where('userId', '==', userId),
        orderBy('submittedAt', 'desc'),
        limit(limitCount)
      );

      if (challengeId) {
        q = query(
          collection(db, COLLECTIONS.CHALLENGE_SUBMISSIONS),
          where('userId', '==', userId),
          where('challengeId', '==', challengeId),
          orderBy('submittedAt', 'desc'),
          limit(limitCount)
        );
      }
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => 
        this.convertDocumentToSubmission(doc.data() as ChallengeSubmissionDocument)
      );
    } catch (error) {
      console.error('Error fetching user submissions:', error);
      throw error;
    }
  }

  static async getChallengeSubmissions(
    challengeId: string,
    limitCount: number = 100
  ): Promise<ChallengeSubmission[]> {
    try {
      const q = query(
        collection(db, COLLECTIONS.CHALLENGE_SUBMISSIONS),
        where('challengeId', '==', challengeId),
        orderBy('totalScore', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => 
        this.convertDocumentToSubmission(doc.data() as ChallengeSubmissionDocument)
      );
    } catch (error) {
      console.error('Error fetching challenge submissions:', error);
      throw error;
    }
  }

  static async getBestSubmission(userId: string, challengeId: string): Promise<ChallengeSubmission | null> {
    try {
      const q = query(
        collection(db, COLLECTIONS.CHALLENGE_SUBMISSIONS),
        where('userId', '==', userId),
        where('challengeId', '==', challengeId),
        orderBy('totalScore', 'desc'),
        limit(1)
      );
      
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return this.convertDocumentToSubmission(doc.data() as ChallengeSubmissionDocument);
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching best submission:', error);
      throw error;
    }
  }

  private static convertDocumentToSubmission(doc: ChallengeSubmissionDocument): ChallengeSubmission {
    return {
      ...doc,
      submittedAt: new Date(doc.submittedAt)
    };
  }

  private static convertSubmissionToDocument(submission: ChallengeSubmission): ChallengeSubmissionDocument {
    return {
      ...submission,
      submittedAt: submission.submittedAt.toISOString()
    };
  }
}

// Utility functions for database operations
export class AnalyticsUtils {
  static generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  static generateInsightId(): string {
    return `insight_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  static generateChallengeId(): string {
    return `challenge_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  static generateCompetitionId(): string {
    return `competition_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  static generateSubmissionId(): string {
    return `submission_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  static async batchUpdateUserProgress(updates: Array<{ userId: string; data: Partial<UserProgress> }>): Promise<void> {
    try {
      const batch = writeBatch(db);
      
      updates.forEach(({ userId, data }) => {
        const docRef = doc(db, COLLECTIONS.USER_PROGRESS, userId);
        const updateData: any = {
          ...data,
          updatedAt: new Date().toISOString()
        };
        batch.update(docRef, updateData);
      });
      
      await batch.commit();
    } catch (error) {
      console.error('Error in batch update:', error);
      throw error;
    }
  }

  static async cleanupOldAnalyticsData(daysToKeep: number = 90): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
      
      const q = query(
        collection(db, COLLECTIONS.ANALYTICS_DATA),
        where('timestamp', '<=', cutoffDate.toISOString())
      );
      
      const querySnapshot = await getDocs(q);
      const batch = writeBatch(db);
      
      querySnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
      return querySnapshot.size;
    } catch (error) {
      console.error('Error cleaning up old analytics data:', error);
      throw error;
    }
  }
}

// Export all services and utilities - removed duplicate exports

// Initialize analytics schema on module load
if (typeof window === 'undefined') {
  // Only run on server side
  initializeAnalyticsSchema().catch(console.error);
}