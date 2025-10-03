import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  updateDoc,
  arrayUnion,
  Timestamp 
} from 'firebase/firestore';
import { db } from './config';
import { RetroactiveAnalysisResult } from '../github/github-service';
import { RepositoryFeedback, CommitFeedback } from '../github/ai-feedback-service';
import { RecognizedSkill, SkillBadgeRecommendation } from '../github/skill-recognition-service';

export interface GitHubIntegrationData {
  userId: string;
  githubUsername: string;
  accessToken?: string; // Encrypted
  connectedAt: Date;
  lastAnalysis?: Date;
  analysisResults?: RetroactiveAnalysisResult;
  repositoryFeedbacks: RepositoryFeedback[];
  recognizedSkills: RecognizedSkill[];
  badgeRecommendations: SkillBadgeRecommendation[];
  settings: {
    autoAnalysis: boolean;
    publicProfile: boolean;
    feedbackEnabled: boolean;
  };
}

export interface GitHubAnalysisHistory {
  id: string;
  userId: string;
  analysisType: 'full_analysis' | 'repository_feedback' | 'commit_feedback';
  timestamp: Date;
  results: any;
  skillsIdentified: number;
  badgesAwarded: number;
}

export class GitHubIntegrationFirebaseService {
  private readonly COLLECTION_NAME = 'github_integrations';
  private readonly ANALYSIS_HISTORY_COLLECTION = 'github_analysis_history';
  private readonly REPOSITORY_FEEDBACK_COLLECTION = 'repository_feedbacks';

  /**
   * Save GitHub integration data for a user
   */
  async saveGitHubIntegration(data: GitHubIntegrationData): Promise<void> {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, data.userId);
      
      const firestoreData = {
        ...data,
        connectedAt: Timestamp.fromDate(data.connectedAt),
        lastAnalysis: data.lastAnalysis ? Timestamp.fromDate(data.lastAnalysis) : null,
        analysisResults: data.analysisResults ? {
          ...data.analysisResults,
          analysisDate: Timestamp.fromDate(data.analysisResults.analysisDate),
        } : null,
        repositoryFeedbacks: data.repositoryFeedbacks.map(feedback => ({
          ...feedback,
          analysisDate: Timestamp.fromDate(feedback.analysisDate),
        })),
        recognizedSkills: data.recognizedSkills.map(skill => ({
          ...skill,
          lastUpdated: Timestamp.fromDate(skill.lastUpdated),
          evidence: skill.evidence.map(evidence => ({
            ...evidence,
            timestamp: Timestamp.fromDate(evidence.timestamp),
          })),
        })),
      };

      await setDoc(docRef, firestoreData, { merge: true });
    } catch (error) {
      console.error('Error saving GitHub integration:', error);
      throw new Error('Failed to save GitHub integration data');
    }
  }

  /**
   * Get GitHub integration data for a user
   */
  async getGitHubIntegration(userId: string): Promise<GitHubIntegrationData | null> {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, userId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      const data = docSnap.data();
      
      return {
        ...data,
        connectedAt: data.connectedAt.toDate(),
        lastAnalysis: data.lastAnalysis?.toDate(),
        analysisResults: data.analysisResults ? {
          ...data.analysisResults,
          analysisDate: data.analysisResults.analysisDate.toDate(),
        } : undefined,
        repositoryFeedbacks: (data.repositoryFeedbacks || []).map((feedback: any) => ({
          ...feedback,
          analysisDate: feedback.analysisDate.toDate(),
        })),
        recognizedSkills: (data.recognizedSkills || []).map((skill: any) => ({
          ...skill,
          lastUpdated: skill.lastUpdated.toDate(),
          evidence: skill.evidence.map((evidence: any) => ({
            ...evidence,
            timestamp: evidence.timestamp.toDate(),
          })),
        })),
      } as GitHubIntegrationData;
    } catch (error) {
      console.error('Error getting GitHub integration:', error);
      throw new Error('Failed to get GitHub integration data');
    }
  }

  /**
   * Update GitHub analysis results
   */
  async updateAnalysisResults(userId: string, analysisResult: RetroactiveAnalysisResult): Promise<void> {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, userId);
      
      await updateDoc(docRef, {
        analysisResults: {
          ...analysisResult,
          analysisDate: Timestamp.fromDate(analysisResult.analysisDate),
        },
        lastAnalysis: Timestamp.fromDate(new Date()),
      });

      // Save to analysis history
      await this.saveAnalysisHistory({
        id: `${userId}-${Date.now()}`,
        userId,
        analysisType: 'full_analysis',
        timestamp: new Date(),
        results: analysisResult,
        skillsIdentified: analysisResult.skillsIdentified.length,
        badgesAwarded: analysisResult.suggestedBadges.length,
      });
    } catch (error) {
      console.error('Error updating analysis results:', error);
      throw new Error('Failed to update analysis results');
    }
  }

  /**
   * Add repository feedback
   */
  async addRepositoryFeedback(userId: string, feedback: RepositoryFeedback): Promise<void> {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, userId);
      
      const firestoreFeedback = {
        ...feedback,
        analysisDate: Timestamp.fromDate(feedback.analysisDate),
      };

      await updateDoc(docRef, {
        repositoryFeedbacks: arrayUnion(firestoreFeedback),
      });

      // Also save as separate document for easier querying
      const feedbackDocRef = doc(db, this.REPOSITORY_FEEDBACK_COLLECTION, `${userId}-${feedback.repositoryId}`);
      await setDoc(feedbackDocRef, {
        userId,
        ...firestoreFeedback,
      });
    } catch (error) {
      console.error('Error adding repository feedback:', error);
      throw new Error('Failed to add repository feedback');
    }
  }

  /**
   * Update recognized skills
   */
  async updateRecognizedSkills(userId: string, skills: RecognizedSkill[]): Promise<void> {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, userId);
      
      const firestoreSkills = skills.map(skill => ({
        ...skill,
        lastUpdated: Timestamp.fromDate(skill.lastUpdated),
        evidence: skill.evidence.map(evidence => ({
          ...evidence,
          timestamp: Timestamp.fromDate(evidence.timestamp),
        })),
      }));

      await updateDoc(docRef, {
        recognizedSkills: firestoreSkills,
      });
    } catch (error) {
      console.error('Error updating recognized skills:', error);
      throw new Error('Failed to update recognized skills');
    }
  }

  /**
   * Save analysis history
   */
  async saveAnalysisHistory(history: GitHubAnalysisHistory): Promise<void> {
    try {
      const docRef = doc(db, this.ANALYSIS_HISTORY_COLLECTION, history.id);
      
      await setDoc(docRef, {
        ...history,
        timestamp: Timestamp.fromDate(history.timestamp),
      });
    } catch (error) {
      console.error('Error saving analysis history:', error);
      throw new Error('Failed to save analysis history');
    }
  }

  /**
   * Get analysis history for a user
   */
  async getAnalysisHistory(userId: string, limitCount: number = 10): Promise<GitHubAnalysisHistory[]> {
    try {
      const q = query(
        collection(db, this.ANALYSIS_HISTORY_COLLECTION),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          timestamp: data.timestamp.toDate(),
        } as GitHubAnalysisHistory;
      });
    } catch (error) {
      console.error('Error getting analysis history:', error);
      throw new Error('Failed to get analysis history');
    }
  }

  /**
   * Get repository feedbacks for a user
   */
  async getRepositoryFeedbacks(userId: string): Promise<RepositoryFeedback[]> {
    try {
      const q = query(
        collection(db, this.REPOSITORY_FEEDBACK_COLLECTION),
        where('userId', '==', userId),
        orderBy('analysisDate', 'desc')
      );

      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          analysisDate: data.analysisDate.toDate(),
        } as RepositoryFeedback;
      });
    } catch (error) {
      console.error('Error getting repository feedbacks:', error);
      throw new Error('Failed to get repository feedbacks');
    }
  }

  /**
   * Update GitHub integration settings
   */
  async updateSettings(userId: string, settings: Partial<GitHubIntegrationData['settings']>): Promise<void> {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, userId);
      
      await updateDoc(docRef, {
        [`settings.${Object.keys(settings)[0]}`]: Object.values(settings)[0],
      });
    } catch (error) {
      console.error('Error updating GitHub integration settings:', error);
      throw new Error('Failed to update settings');
    }
  }

  /**
   * Delete GitHub integration
   */
  async deleteGitHubIntegration(userId: string): Promise<void> {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, userId);
      await updateDoc(docRef, {
        accessToken: null,
        githubUsername: null,
        settings: {
          autoAnalysis: false,
          publicProfile: false,
          feedbackEnabled: false,
        },
      });
    } catch (error) {
      console.error('Error deleting GitHub integration:', error);
      throw new Error('Failed to delete GitHub integration');
    }
  }

  /**
   * Get users with GitHub integration enabled
   */
  async getUsersWithGitHubIntegration(): Promise<string[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where('githubUsername', '!=', null)
      );

      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => doc.id);
    } catch (error) {
      console.error('Error getting users with GitHub integration:', error);
      throw new Error('Failed to get users with GitHub integration');
    }
  }
}