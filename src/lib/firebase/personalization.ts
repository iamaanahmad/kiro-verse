/**
 * @fileOverview Firebase service for personalization data management
 * 
 * This service handles all Firebase operations for the personalization system:
 * - Learning patterns storage and retrieval
 * - Learning style management
 * - Personalized recommendations
 * - Resource suggestions and challenge recommendations
 * - Personalization metrics tracking
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from './config';
import {
  LearningPattern,
  LearningStyle,
  PersonalizedRecommendation,
  ResourceSuggestion,
  ChallengeRecommendation,
  PersonalizationMetrics,
  LearningPatternDocument,
  LearningStyleDocument,
  PersonalizedRecommendationDocument,
  ResourceSuggestionDocument,
  ChallengeRecommendationDocument
} from '@/types/personalization';

export class PersonalizationDataService {
  private static readonly COLLECTIONS = {
    LEARNING_PATTERNS: 'learning_patterns',
    LEARNING_STYLES: 'learning_styles',
    PERSONALIZED_RECOMMENDATIONS: 'personalized_recommendations',
    RESOURCE_SUGGESTIONS: 'resource_suggestions',
    CHALLENGE_RECOMMENDATIONS: 'challenge_recommendations',
    PERSONALIZATION_METRICS: 'personalization_metrics'
  };

  // Learning Patterns Management

  static async saveLearningPattern(pattern: LearningPattern): Promise<void> {
    try {
      const patternDoc: LearningPatternDocument = {
        ...pattern,
        detectedAt: pattern.detectedAt.toISOString(),
        lastUpdated: pattern.lastUpdated.toISOString()
      };

      await setDoc(
        doc(db, this.COLLECTIONS.LEARNING_PATTERNS, pattern.patternId),
        patternDoc
      );
    } catch (error) {
      console.error('Error saving learning pattern:', error);
      throw error;
    }
  }

  static async getLearningPattern(patternId: string): Promise<LearningPattern | null> {
    try {
      const docRef = doc(db, this.COLLECTIONS.LEARNING_PATTERNS, patternId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      const data = docSnap.data() as LearningPatternDocument;
      return {
        ...data,
        detectedAt: new Date(data.detectedAt),
        lastUpdated: new Date(data.lastUpdated)
      };
    } catch (error) {
      console.error('Error getting learning pattern:', error);
      throw error;
    }
  }

  static async getUserLearningPatterns(
    userId: string,
    patternType?: LearningPattern['patternType']
  ): Promise<LearningPattern[]> {
    try {
      let q = query(
        collection(db, this.COLLECTIONS.LEARNING_PATTERNS),
        where('userId', '==', userId),
        orderBy('lastUpdated', 'desc')
      );

      if (patternType) {
        q = query(q, where('patternType', '==', patternType));
      }

      const querySnapshot = await getDocs(q);
      const patterns: LearningPattern[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data() as LearningPatternDocument;
        patterns.push({
          ...data,
          detectedAt: new Date(data.detectedAt),
          lastUpdated: new Date(data.lastUpdated)
        });
      });

      return patterns;
    } catch (error) {
      console.error('Error getting user learning patterns:', error);
      throw error;
    }
  }

  static async updateLearningPattern(
    patternId: string,
    updates: Partial<LearningPattern>
  ): Promise<void> {
    try {
      const docRef = doc(db, this.COLLECTIONS.LEARNING_PATTERNS, patternId);
      const updateData: any = { ...updates };

      // Convert dates to ISO strings
      if (updates.detectedAt) {
        updateData.detectedAt = updates.detectedAt.toISOString();
      }
      if (updates.lastUpdated) {
        updateData.lastUpdated = updates.lastUpdated.toISOString();
      }

      await updateDoc(docRef, updateData);
    } catch (error) {
      console.error('Error updating learning pattern:', error);
      throw error;
    }
  }

  static async deleteLearningPattern(patternId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, this.COLLECTIONS.LEARNING_PATTERNS, patternId));
    } catch (error) {
      console.error('Error deleting learning pattern:', error);
      throw error;
    }
  }

  // Learning Style Management

  static async saveLearningStyle(learningStyle: LearningStyle): Promise<void> {
    try {
      const styleDoc: LearningStyleDocument = {
        ...learningStyle,
        lastUpdated: learningStyle.lastUpdated.toISOString()
      };

      await setDoc(
        doc(db, this.COLLECTIONS.LEARNING_STYLES, learningStyle.userId),
        styleDoc
      );
    } catch (error) {
      console.error('Error saving learning style:', error);
      throw error;
    }
  }

  static async getLearningStyle(userId: string): Promise<LearningStyle | null> {
    try {
      const docRef = doc(db, this.COLLECTIONS.LEARNING_STYLES, userId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      const data = docSnap.data() as LearningStyleDocument;
      return {
        ...data,
        lastUpdated: new Date(data.lastUpdated)
      };
    } catch (error) {
      console.error('Error getting learning style:', error);
      throw error;
    }
  }

  static async updateLearningStyle(
    userId: string,
    updates: Partial<LearningStyle>
  ): Promise<void> {
    try {
      const docRef = doc(db, this.COLLECTIONS.LEARNING_STYLES, userId);
      const updateData: any = { ...updates };

      if (updates.lastUpdated) {
        updateData.lastUpdated = updates.lastUpdated.toISOString();
      }

      await updateDoc(docRef, updateData);
    } catch (error) {
      console.error('Error updating learning style:', error);
      throw error;
    }
  }

  // Personalized Recommendations Management

  static async savePersonalizedRecommendation(
    recommendation: PersonalizedRecommendation
  ): Promise<void> {
    try {
      const recommendationDoc: PersonalizedRecommendationDocument = {
        ...recommendation,
        createdAt: recommendation.createdAt.toISOString(),
        expiresAt: recommendation.expiresAt?.toISOString(),
        acceptedAt: recommendation.acceptedAt?.toISOString(),
        completedAt: recommendation.completedAt?.toISOString()
      };

      await setDoc(
        doc(db, this.COLLECTIONS.PERSONALIZED_RECOMMENDATIONS, recommendation.recommendationId),
        recommendationDoc
      );
    } catch (error) {
      console.error('Error saving personalized recommendation:', error);
      throw error;
    }
  }

  static async getUserRecommendations(
    userId: string,
    type?: PersonalizedRecommendation['type'],
    includeExpired: boolean = false
  ): Promise<PersonalizedRecommendation[]> {
    try {
      let q = query(
        collection(db, this.COLLECTIONS.PERSONALIZED_RECOMMENDATIONS),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );

      if (type) {
        q = query(q, where('type', '==', type));
      }

      const querySnapshot = await getDocs(q);
      const recommendations: PersonalizedRecommendation[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data() as PersonalizedRecommendationDocument;
        const recommendation: PersonalizedRecommendation = {
          ...data,
          createdAt: new Date(data.createdAt),
          expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
          acceptedAt: data.acceptedAt ? new Date(data.acceptedAt) : undefined,
          completedAt: data.completedAt ? new Date(data.completedAt) : undefined
        };

        // Filter out expired recommendations if requested
        if (!includeExpired && recommendation.expiresAt && recommendation.expiresAt < new Date()) {
          return;
        }

        recommendations.push(recommendation);
      });

      return recommendations;
    } catch (error) {
      console.error('Error getting user recommendations:', error);
      throw error;
    }
  }

  static async updateRecommendationStatus(
    recommendationId: string,
    updates: {
      isAccepted?: boolean;
      acceptedAt?: Date;
      completedAt?: Date;
      effectiveness?: number;
    }
  ): Promise<void> {
    try {
      const docRef = doc(db, this.COLLECTIONS.PERSONALIZED_RECOMMENDATIONS, recommendationId);
      const updateData: any = { ...updates };

      if (updates.acceptedAt) {
        updateData.acceptedAt = updates.acceptedAt.toISOString();
      }
      if (updates.completedAt) {
        updateData.completedAt = updates.completedAt.toISOString();
      }

      await updateDoc(docRef, updateData);
    } catch (error) {
      console.error('Error updating recommendation status:', error);
      throw error;
    }
  }

  // Resource Suggestions Management

  static async saveResourceSuggestion(suggestion: ResourceSuggestion): Promise<void> {
    try {
      const suggestionDoc: ResourceSuggestionDocument = {
        ...suggestion,
        createdAt: suggestion.createdAt.toISOString(),
        viewedAt: suggestion.viewedAt?.toISOString(),
        completedAt: suggestion.completedAt?.toISOString()
      };

      await setDoc(
        doc(db, this.COLLECTIONS.RESOURCE_SUGGESTIONS, suggestion.suggestionId),
        suggestionDoc
      );
    } catch (error) {
      console.error('Error saving resource suggestion:', error);
      throw error;
    }
  }

  static async getUserResourceSuggestions(
    userId: string,
    resourceType?: ResourceSuggestion['resourceType'],
    urgency?: ResourceSuggestion['urgency']
  ): Promise<ResourceSuggestion[]> {
    try {
      let q = query(
        collection(db, this.COLLECTIONS.RESOURCE_SUGGESTIONS),
        where('userId', '==', userId),
        orderBy('relevanceScore', 'desc'),
        limit(20)
      );

      if (resourceType) {
        q = query(q, where('resourceType', '==', resourceType));
      }
      if (urgency) {
        q = query(q, where('urgency', '==', urgency));
      }

      const querySnapshot = await getDocs(q);
      const suggestions: ResourceSuggestion[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data() as ResourceSuggestionDocument;
        suggestions.push({
          ...data,
          createdAt: new Date(data.createdAt),
          viewedAt: data.viewedAt ? new Date(data.viewedAt) : undefined,
          completedAt: data.completedAt ? new Date(data.completedAt) : undefined
        });
      });

      return suggestions;
    } catch (error) {
      console.error('Error getting user resource suggestions:', error);
      throw error;
    }
  }

  static async updateResourceSuggestionStatus(
    suggestionId: string,
    updates: {
      viewedAt?: Date;
      completedAt?: Date;
      userRating?: number;
    }
  ): Promise<void> {
    try {
      const docRef = doc(db, this.COLLECTIONS.RESOURCE_SUGGESTIONS, suggestionId);
      const updateData: any = { ...updates };

      if (updates.viewedAt) {
        updateData.viewedAt = updates.viewedAt.toISOString();
      }
      if (updates.completedAt) {
        updateData.completedAt = updates.completedAt.toISOString();
      }

      await updateDoc(docRef, updateData);
    } catch (error) {
      console.error('Error updating resource suggestion status:', error);
      throw error;
    }
  }

  // Challenge Recommendations Management

  static async saveChallengeRecommendation(
    recommendation: ChallengeRecommendation
  ): Promise<void> {
    try {
      const recommendationDoc: ChallengeRecommendationDocument = {
        ...recommendation,
        createdAt: recommendation.createdAt.toISOString(),
        acceptedAt: recommendation.acceptedAt?.toISOString(),
        completedAt: recommendation.completedAt?.toISOString()
      };

      await setDoc(
        doc(db, this.COLLECTIONS.CHALLENGE_RECOMMENDATIONS, recommendation.recommendationId),
        recommendationDoc
      );
    } catch (error) {
      console.error('Error saving challenge recommendation:', error);
      throw error;
    }
  }

  static async getUserChallengeRecommendations(
    userId: string,
    difficulty?: ChallengeRecommendation['difficulty']
  ): Promise<ChallengeRecommendation[]> {
    try {
      let q = query(
        collection(db, this.COLLECTIONS.CHALLENGE_RECOMMENDATIONS),
        where('userId', '==', userId),
        orderBy('confidenceScore', 'desc'),
        limit(10)
      );

      if (difficulty) {
        q = query(q, where('difficulty', '==', difficulty));
      }

      const querySnapshot = await getDocs(q);
      const recommendations: ChallengeRecommendation[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data() as ChallengeRecommendationDocument;
        recommendations.push({
          ...data,
          createdAt: new Date(data.createdAt),
          acceptedAt: data.acceptedAt ? new Date(data.acceptedAt) : undefined,
          completedAt: data.completedAt ? new Date(data.completedAt) : undefined
        });
      });

      return recommendations;
    } catch (error) {
      console.error('Error getting user challenge recommendations:', error);
      throw error;
    }
  }

  static async updateChallengeRecommendationStatus(
    recommendationId: string,
    updates: {
      acceptedAt?: Date;
      completedAt?: Date;
      userFeedback?: ChallengeRecommendation['userFeedback'];
    }
  ): Promise<void> {
    try {
      const docRef = doc(db, this.COLLECTIONS.CHALLENGE_RECOMMENDATIONS, recommendationId);
      const updateData: any = { ...updates };

      if (updates.acceptedAt) {
        updateData.acceptedAt = updates.acceptedAt.toISOString();
      }
      if (updates.completedAt) {
        updateData.completedAt = updates.completedAt.toISOString();
      }

      await updateDoc(docRef, updateData);
    } catch (error) {
      console.error('Error updating challenge recommendation status:', error);
      throw error;
    }
  }

  // Personalization Metrics Management

  static async savePersonalizationMetrics(metrics: PersonalizationMetrics): Promise<void> {
    try {
      const metricsDoc = {
        ...metrics,
        lastCalculated: metrics.lastCalculated.toISOString()
      };

      await setDoc(
        doc(db, this.COLLECTIONS.PERSONALIZATION_METRICS, metrics.userId),
        metricsDoc
      );
    } catch (error) {
      console.error('Error saving personalization metrics:', error);
      throw error;
    }
  }

  static async getPersonalizationMetrics(userId: string): Promise<PersonalizationMetrics | null> {
    try {
      const docRef = doc(db, this.COLLECTIONS.PERSONALIZATION_METRICS, userId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      const data = docSnap.data();
      return {
        ...data,
        lastCalculated: new Date(data.lastCalculated)
      } as PersonalizationMetrics;
    } catch (error) {
      console.error('Error getting personalization metrics:', error);
      throw error;
    }
  }

  static async updatePersonalizationMetrics(
    userId: string,
    updates: Partial<PersonalizationMetrics>
  ): Promise<void> {
    try {
      const docRef = doc(db, this.COLLECTIONS.PERSONALIZATION_METRICS, userId);
      const updateData: any = { ...updates };

      if (updates.lastCalculated) {
        updateData.lastCalculated = updates.lastCalculated.toISOString();
      }

      await updateDoc(docRef, updateData);
    } catch (error) {
      console.error('Error updating personalization metrics:', error);
      throw error;
    }
  }

  // Batch Operations

  static async batchSaveRecommendations(
    recommendations: PersonalizedRecommendation[]
  ): Promise<void> {
    try {
      const batch = writeBatch(db);

      recommendations.forEach((recommendation) => {
        const docRef = doc(db, this.COLLECTIONS.PERSONALIZED_RECOMMENDATIONS, recommendation.recommendationId);
        const recommendationDoc: PersonalizedRecommendationDocument = {
          ...recommendation,
          createdAt: recommendation.createdAt.toISOString(),
          expiresAt: recommendation.expiresAt?.toISOString(),
          acceptedAt: recommendation.acceptedAt?.toISOString(),
          completedAt: recommendation.completedAt?.toISOString()
        };
        batch.set(docRef, recommendationDoc);
      });

      await batch.commit();
    } catch (error) {
      console.error('Error batch saving recommendations:', error);
      throw error;
    }
  }

  static async batchSaveResourceSuggestions(
    suggestions: ResourceSuggestion[]
  ): Promise<void> {
    try {
      const batch = writeBatch(db);

      suggestions.forEach((suggestion) => {
        const docRef = doc(db, this.COLLECTIONS.RESOURCE_SUGGESTIONS, suggestion.suggestionId);
        const suggestionDoc: ResourceSuggestionDocument = {
          ...suggestion,
          createdAt: suggestion.createdAt.toISOString(),
          viewedAt: suggestion.viewedAt?.toISOString(),
          completedAt: suggestion.completedAt?.toISOString()
        };
        batch.set(docRef, suggestionDoc);
      });

      await batch.commit();
    } catch (error) {
      console.error('Error batch saving resource suggestions:', error);
      throw error;
    }
  }

  // Cleanup Operations

  static async cleanupExpiredRecommendations(): Promise<number> {
    try {
      const now = new Date();
      const q = query(
        collection(db, this.COLLECTIONS.PERSONALIZED_RECOMMENDATIONS),
        where('expiresAt', '<', now.toISOString())
      );

      const querySnapshot = await getDocs(q);
      const batch = writeBatch(db);
      let deletedCount = 0;

      querySnapshot.forEach((doc) => {
        batch.delete(doc.ref);
        deletedCount++;
      });

      if (deletedCount > 0) {
        await batch.commit();
      }

      return deletedCount;
    } catch (error) {
      console.error('Error cleaning up expired recommendations:', error);
      throw error;
    }
  }

  static async getUserPersonalizationSummary(userId: string): Promise<{
    learningStyle: LearningStyle | null;
    activeRecommendations: number;
    completedRecommendations: number;
    metrics: PersonalizationMetrics | null;
  }> {
    try {
      const [learningStyle, recommendations, metrics] = await Promise.all([
        this.getLearningStyle(userId),
        this.getUserRecommendations(userId),
        this.getPersonalizationMetrics(userId)
      ]);

      const activeRecommendations = recommendations.filter(r => !r.completedAt).length;
      const completedRecommendations = recommendations.filter(r => r.completedAt).length;

      return {
        learningStyle,
        activeRecommendations,
        completedRecommendations,
        metrics
      };
    } catch (error) {
      console.error('Error getting user personalization summary:', error);
      throw error;
    }
  }
}