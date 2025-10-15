// Firebase Peer Review Database Operations

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
  Timestamp
} from 'firebase/firestore';
import { db } from './config';
import {
  PeerReview,
  PeerReviewRequest,
  ReviewerProfile,
  CommunityContribution,
  PeerReviewSettings,
  PeerReviewDocument,
  PeerReviewRequestDocument,
  ReviewerProfileDocument,
  CommunityContributionDocument,
  PeerReviewSettingsDocument,
  PeerReviewMatchResult,
  ReviewAnalytics
} from '@/types/peer-review';

// Collection names
export const PEER_REVIEW_COLLECTIONS = {
  PEER_REVIEWS: 'peerReviews',
  REVIEW_REQUESTS: 'reviewRequests',
  REVIEWER_PROFILES: 'reviewerProfiles',
  COMMUNITY_CONTRIBUTIONS: 'communityContributions',
  PEER_REVIEW_SETTINGS: 'peerReviewSettings',
  REVIEW_MATCHES: 'reviewMatches'
} as const;

// Peer Review Operations
export class PeerReviewService {
  // Helper method to convert PeerReview to Firestore document
  private static convertPeerReviewToDocument(review: PeerReview): PeerReviewDocument {
    return {
      ...review,
      createdAt: review.createdAt.toISOString(),
      updatedAt: review.updatedAt.toISOString(),
      completedAt: review.completedAt?.toISOString()
    };
  }

  // Helper method to convert Firestore document to PeerReview
  private static convertDocumentToPeerReview(doc: PeerReviewDocument): PeerReview {
    return {
      ...doc,
      createdAt: new Date(doc.createdAt),
      updatedAt: new Date(doc.updatedAt),
      completedAt: doc.completedAt ? new Date(doc.completedAt) : undefined
    };
  }

  static async createPeerReview(review: PeerReview): Promise<string> {
    try {
      const docRef = doc(db, PEER_REVIEW_COLLECTIONS.PEER_REVIEWS, review.reviewId);
      const document = this.convertPeerReviewToDocument(review);
      await setDoc(docRef, document);
      return review.reviewId;
    } catch (error) {
      console.error('Error creating peer review:', error);
      throw error;
    }
  }

  static async getPeerReview(reviewId: string): Promise<PeerReview | null> {
    try {
      const docRef = doc(db, PEER_REVIEW_COLLECTIONS.PEER_REVIEWS, reviewId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data() as PeerReviewDocument;
        return this.convertDocumentToPeerReview(data);
      }
      
      return null;
    } catch (error) {
      console.error('Error getting peer review:', error);
      throw error;
    }
  }

  static async updatePeerReview(reviewId: string, updates: Partial<PeerReview>): Promise<void> {
    try {
      const docRef = doc(db, PEER_REVIEW_COLLECTIONS.PEER_REVIEWS, reviewId);
      const updateData: any = { ...updates };
      
      // Convert dates to strings for Firestore
      if (updates.updatedAt) {
        updateData.updatedAt = updates.updatedAt.toISOString();
      }
      if (updates.completedAt) {
        updateData.completedAt = updates.completedAt.toISOString();
      }
      
      await updateDoc(docRef, updateData);
    } catch (error) {
      console.error('Error updating peer review:', error);
      throw error;
    }
  }

  static async getReviewsForUser(userId: string, type: 'reviewer' | 'reviewee' = 'reviewee'): Promise<PeerReview[]> {
    try {
      const field = type === 'reviewer' ? 'reviewerId' : 'revieweeId';
      const q = query(
        collection(db, PEER_REVIEW_COLLECTIONS.PEER_REVIEWS),
        where(field, '==', userId),
        orderBy('createdAt', 'desc'),
        limit(50)
      );
      
      const querySnapshot = await getDocs(q);
      const reviews: PeerReview[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data() as PeerReviewDocument;
        reviews.push(this.convertDocumentToPeerReview(data));
      });
      
      return reviews;
    } catch (error) {
      console.error('Error getting reviews for user:', error);
      throw error;
    }
  }

  // Review Request Operations
  static async createReviewRequest(request: PeerReviewRequest): Promise<string> {
    try {
      const docRef = doc(db, PEER_REVIEW_COLLECTIONS.REVIEW_REQUESTS, request.requestId);
      const document: PeerReviewRequestDocument = {
        ...request,
        createdAt: request.createdAt.toISOString(),
        expiresAt: request.expiresAt.toISOString()
      };
      await setDoc(docRef, document);
      return request.requestId;
    } catch (error) {
      console.error('Error creating review request:', error);
      throw error;
    }
  }

  static async getOpenReviewRequests(skillsToMatch?: string[]): Promise<PeerReviewRequest[]> {
    try {
      let q = query(
        collection(db, PEER_REVIEW_COLLECTIONS.REVIEW_REQUESTS),
        where('status', '==', 'open'),
        orderBy('createdAt', 'desc'),
        limit(20)
      );

      const querySnapshot = await getDocs(q);
      const requests: PeerReviewRequest[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data() as PeerReviewRequestDocument;
        const request: PeerReviewRequest = {
          ...data,
          createdAt: new Date(data.createdAt),
          expiresAt: new Date(data.expiresAt)
        };
        
        // Filter by skills if provided
        if (!skillsToMatch || skillsToMatch.some(skill => request.skillsRequested.includes(skill))) {
          requests.push(request);
        }
      });
      
      return requests;
    } catch (error) {
      console.error('Error getting open review requests:', error);
      throw error;
    }
  }

  // Reviewer Profile Operations
  static async createOrUpdateReviewerProfile(profile: ReviewerProfile): Promise<void> {
    try {
      const docRef = doc(db, PEER_REVIEW_COLLECTIONS.REVIEWER_PROFILES, profile.userId);
      const document: ReviewerProfileDocument = {
        ...profile,
        skillLevels: Object.fromEntries(profile.skillLevels)
      };
      await setDoc(docRef, document);
    } catch (error) {
      console.error('Error creating/updating reviewer profile:', error);
      throw error;
    }
  }

  static async getReviewerProfile(userId: string): Promise<ReviewerProfile | null> {
    try {
      const docRef = doc(db, PEER_REVIEW_COLLECTIONS.REVIEWER_PROFILES, userId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data() as ReviewerProfileDocument;
        return {
          ...data,
          skillLevels: new Map(Object.entries(data.skillLevels))
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error getting reviewer profile:', error);
      throw error;
    }
  }

  // Community Contribution Operations
  static async recordCommunityContribution(contribution: CommunityContribution): Promise<string> {
    try {
      const docRef = doc(db, PEER_REVIEW_COLLECTIONS.COMMUNITY_CONTRIBUTIONS, contribution.contributionId);
      const document: CommunityContributionDocument = {
        ...contribution,
        createdAt: contribution.createdAt.toISOString()
      };
      await setDoc(docRef, document);
      return contribution.contributionId;
    } catch (error) {
      console.error('Error recording community contribution:', error);
      throw error;
    }
  }

  static async getUserContributions(userId: string): Promise<CommunityContribution[]> {
    try {
      const q = query(
        collection(db, PEER_REVIEW_COLLECTIONS.COMMUNITY_CONTRIBUTIONS),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(50)
      );
      
      const querySnapshot = await getDocs(q);
      const contributions: CommunityContribution[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data() as CommunityContributionDocument;
        contributions.push({
          ...data,
          createdAt: new Date(data.createdAt)
        });
      });
      
      return contributions;
    } catch (error) {
      console.error('Error getting user contributions:', error);
      throw error;
    }
  }

  // Settings Operations
  static async updatePeerReviewSettings(settings: PeerReviewSettings): Promise<void> {
    try {
      const docRef = doc(db, PEER_REVIEW_COLLECTIONS.PEER_REVIEW_SETTINGS, settings.userId);
      const document: PeerReviewSettingsDocument = {
        ...settings,
        updatedAt: settings.updatedAt.toISOString()
      };
      await setDoc(docRef, document);
    } catch (error) {
      console.error('Error updating peer review settings:', error);
      throw error;
    }
  }

  static async getPeerReviewSettings(userId: string): Promise<PeerReviewSettings | null> {
    try {
      const docRef = doc(db, PEER_REVIEW_COLLECTIONS.PEER_REVIEW_SETTINGS, userId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data() as PeerReviewSettingsDocument;
        return {
          ...data,
          updatedAt: new Date(data.updatedAt)
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error getting peer review settings:', error);
      throw error;
    }
  }

  // Matching and Analytics
  static async findPotentialReviewers(request: PeerReviewRequest): Promise<PeerReviewMatchResult> {
    try {
      // Get all available reviewers
      const q = query(
        collection(db, PEER_REVIEW_COLLECTIONS.REVIEWER_PROFILES),
        where('availability.isAvailable', '==', true),
        limit(20)
      );
      
      const querySnapshot = await getDocs(q);
      const potentialReviewers: ReviewerProfile[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data() as ReviewerProfileDocument;
        const profile: ReviewerProfile = {
          ...data,
          skillLevels: new Map(Object.entries(data.skillLevels))
        };
        
        // Basic skill matching
        const hasMatchingSkills = request.skillsRequested.some(skill => 
          profile.skillLevels.has(skill) && (profile.skillLevels.get(skill) || 0) > 0
        );
        
        if (hasMatchingSkills && profile.availability.currentLoad < 5) {
          potentialReviewers.push(profile);
        }
      });
      
      // Sort by matching score (simplified)
      const recommendedReviewers = potentialReviewers
        .sort((a, b) => b.reviewStats.averageRating - a.reviewStats.averageRating)
        .slice(0, Math.min(request.maxReviewers, 5));
      
      return {
        potentialReviewers,
        matchingScore: potentialReviewers.length > 0 ? 0.8 : 0,
        estimatedResponseTime: 24, // hours
        recommendedReviewers
      };
    } catch (error) {
      console.error('Error finding potential reviewers:', error);
      throw error;
    }
  }

  static async getReviewAnalytics(userId: string): Promise<ReviewAnalytics> {
    try {
      const reviews = await this.getReviewsForUser(userId, 'reviewee');
      
      const totalReviews = reviews.length;
      const averageRating = totalReviews > 0 
        ? reviews.reduce((sum, review) => sum + review.overallRating, 0) / totalReviews 
        : 0;
      
      // Extract skill improvements from feedback
      const skillImprovements = reviews
        .flatMap(review => review.feedback.improvementAreas)
        .filter((skill, index, arr) => arr.indexOf(skill) === index)
        .slice(0, 5);
      
      const mostHelpfulFeedback = reviews
        .flatMap(review => review.feedback.strengths)
        .filter((feedback, index, arr) => arr.indexOf(feedback) === index)
        .slice(0, 3);
      
      return {
        totalReviews,
        averageRating,
        skillImprovements,
        mostHelpfulFeedback,
        reviewTrends: [], // Simplified for now
        peerComparisons: [] // Simplified for now
      };
    } catch (error) {
      console.error('Error getting review analytics:', error);
      throw error;
    }
  }
}