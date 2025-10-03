/**
 * @fileOverview Firebase integration for employer verification and assessment data
 * 
 * This module handles:
 * - Candidate profile storage and retrieval for employers
 * - Custom assessment management
 * - Assessment result tracking
 * - Employer dashboard metrics
 */

import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from './config';
import { 
  CandidateProfileDocument, 
  CustomAssessmentDocument, 
  AssessmentResultDocument,
  CandidateProfile,
  CustomAssessment,
  AssessmentResult,
  EmployerDashboardData
} from '@/types/employer';

// Collection names
const COLLECTIONS = {
  CANDIDATE_PROFILES: 'candidateProfiles',
  CUSTOM_ASSESSMENTS: 'customAssessments',
  ASSESSMENT_RESULTS: 'assessmentResults',
  EMPLOYER_METRICS: 'employerMetrics',
  EMPLOYER_ACTIVITY: 'employerActivity'
} as const;

/**
 * Get candidate profiles visible to employers
 */
export async function getCandidateProfiles(
  employerId: string,
  filters?: {
    skillIds?: string[];
    minSkillLevel?: number;
    verificationStatus?: 'verified' | 'pending' | 'unverified';
    limit?: number;
  }
): Promise<CandidateProfile[]> {
  try {
    let q = query(
      collection(db, COLLECTIONS.CANDIDATE_PROFILES),
      where('profileVisibility.visibleToEmployers', '==', true),
      orderBy('lastUpdated', 'desc')
    );

    if (filters?.limit) {
      q = query(q, limit(filters.limit));
    }

    const snapshot = await getDocs(q);
    const profiles: CandidateProfile[] = [];

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data() as CandidateProfileDocument;
      const profile = convertCandidateProfileFromFirestore(data);
      
      // Apply client-side filters
      if (filters?.skillIds && !profile.skillLevels.some(skill => filters.skillIds!.includes(skill.skillId))) {
        continue;
      }
      
      if (filters?.minSkillLevel && !profile.skillLevels.some(skill => skill.currentLevel >= filters.minSkillLevel!)) {
        continue;
      }
      
      if (filters?.verificationStatus && !profile.verifiedBadges.some(badge => badge.verificationStatus === filters.verificationStatus)) {
        continue;
      }

      profiles.push(profile);
    }

    return profiles;
  } catch (error) {
    console.error('Error fetching candidate profiles:', error);
    throw new Error('Failed to fetch candidate profiles');
  }
}

/**
 * Get a specific candidate profile by ID
 */
export async function getCandidateProfile(candidateId: string): Promise<CandidateProfile | null> {
  try {
    const docRef = doc(db, COLLECTIONS.CANDIDATE_PROFILES, candidateId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    const data = docSnap.data() as CandidateProfileDocument;
    
    // Check if profile is visible to employers
    if (!data.profileVisibility.visibleToEmployers) {
      return null;
    }

    return convertCandidateProfileFromFirestore(data);
  } catch (error) {
    console.error('Error fetching candidate profile:', error);
    return null;
  }
}

/**
 * Create or update a candidate profile
 */
export async function saveCandidateProfile(profile: CandidateProfile): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.CANDIDATE_PROFILES, profile.userId);
    const profileDoc = convertCandidateProfileToFirestore(profile);
    
    await setDoc(docRef, profileDoc, { merge: true });
  } catch (error) {
    console.error('Error saving candidate profile:', error);
    throw new Error('Failed to save candidate profile');
  }
}

/**
 * Get custom assessments created by an employer
 */
export async function getCustomAssessments(employerId: string): Promise<CustomAssessment[]> {
  try {
    const q = query(
      collection(db, COLLECTIONS.CUSTOM_ASSESSMENTS),
      where('createdBy', '==', employerId),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const data = doc.data() as CustomAssessmentDocument;
      return convertCustomAssessmentFromFirestore(data);
    });
  } catch (error) {
    console.error('Error fetching custom assessments:', error);
    throw new Error('Failed to fetch custom assessments');
  }
}

/**
 * Create a new custom assessment
 */
export async function createCustomAssessment(assessment: CustomAssessment): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.CUSTOM_ASSESSMENTS, assessment.assessmentId);
    const assessmentDoc = convertCustomAssessmentToFirestore(assessment);
    
    await setDoc(docRef, assessmentDoc);
  } catch (error) {
    console.error('Error creating custom assessment:', error);
    throw new Error('Failed to create custom assessment');
  }
}

/**
 * Update an existing custom assessment
 */
export async function updateCustomAssessment(assessment: CustomAssessment): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.CUSTOM_ASSESSMENTS, assessment.assessmentId);
    const assessmentDoc = convertCustomAssessmentToFirestore(assessment);
    
    await updateDoc(docRef, assessmentDoc);
  } catch (error) {
    console.error('Error updating custom assessment:', error);
    throw new Error('Failed to update custom assessment');
  }
}

/**
 * Get assessment results for an employer's assessments
 */
export async function getAssessmentResults(
  employerId: string,
  assessmentId?: string
): Promise<AssessmentResult[]> {
  try {
    // First get the employer's assessments to filter results
    const assessments = await getCustomAssessments(employerId);
    const assessmentIds = assessmentId ? [assessmentId] : assessments.map(a => a.assessmentId);

    if (assessmentIds.length === 0) {
      return [];
    }

    const q = query(
      collection(db, COLLECTIONS.ASSESSMENT_RESULTS),
      where('assessmentId', 'in', assessmentIds),
      orderBy('completedAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const data = doc.data() as AssessmentResultDocument;
      return convertAssessmentResultFromFirestore(data);
    });
  } catch (error) {
    console.error('Error fetching assessment results:', error);
    throw new Error('Failed to fetch assessment results');
  }
}

/**
 * Save an assessment result
 */
export async function saveAssessmentResult(result: AssessmentResult): Promise<void> {
  try {
    const resultId = `${result.assessmentId}_${Date.now()}`;
    const docRef = doc(db, COLLECTIONS.ASSESSMENT_RESULTS, resultId);
    const resultDoc = convertAssessmentResultToFirestore(result);
    
    await setDoc(docRef, resultDoc);
  } catch (error) {
    console.error('Error saving assessment result:', error);
    throw new Error('Failed to save assessment result');
  }
}

/**
 * Get employer dashboard metrics
 */
export async function getEmployerMetrics(employerId: string) {
  try {
    const docRef = doc(db, COLLECTIONS.EMPLOYER_METRICS, employerId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      // Return default metrics if none exist
      return {
        totalCandidatesViewed: 0,
        totalAssessmentsCreated: 0,
        totalAssessmentCompletions: 0,
        averageCandidateScore: 0,
        topPerformingSkills: [],
        assessmentCompletionRate: 0,
        candidateEngagementRate: 0,
        lastUpdated: new Date()
      };
    }

    const data = docSnap.data();
    return {
      ...data,
      lastUpdated: data.lastUpdated?.toDate() || new Date()
    };
  } catch (error) {
    console.error('Error fetching employer metrics:', error);
    throw new Error('Failed to fetch employer metrics');
  }
}

/**
 * Update employer metrics
 */
export async function updateEmployerMetrics(employerId: string, metrics: any): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.EMPLOYER_METRICS, employerId);
    await setDoc(docRef, {
      ...metrics,
      lastUpdated: Timestamp.now()
    }, { merge: true });
  } catch (error) {
    console.error('Error updating employer metrics:', error);
    throw new Error('Failed to update employer metrics');
  }
}

/**
 * Log employer activity
 */
export async function logEmployerActivity(
  employerId: string, 
  activityType: string, 
  description: string, 
  metadata?: Record<string, any>
): Promise<void> {
  try {
    const activityId = `${employerId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const docRef = doc(db, COLLECTIONS.EMPLOYER_ACTIVITY, activityId);
    
    await setDoc(docRef, {
      employerId,
      type: activityType,
      description,
      metadata: metadata || {},
      timestamp: Timestamp.now()
    });
  } catch (error) {
    console.error('Error logging employer activity:', error);
    // Don't throw error for activity logging to avoid disrupting main flow
  }
}

// Conversion functions between Firestore documents and TypeScript interfaces

function convertCandidateProfileFromFirestore(doc: CandidateProfileDocument): CandidateProfile {
  return {
    ...doc,
    lastUpdated: new Date(doc.lastUpdated),
    createdAt: new Date(doc.createdAt),
    recentActivity: {
      ...doc.recentActivity,
      lastActiveDate: new Date(doc.recentActivity.lastActiveDate),
      weeklyActivity: doc.recentActivity.weeklyActivity.map(wa => ({
        ...wa,
        weekStartDate: new Date(wa.weekStartDate)
      }))
    },
    verifiedBadges: doc.verifiedBadges.map(badge => ({
      ...badge,
      awardedAt: new Date(badge.awardedAt),
      verificationDate: new Date(badge.verificationDate)
    })),
    blockchainCredentials: doc.blockchainCredentials.map(cred => ({
      ...cred,
      mintedAt: new Date(cred.mintedAt),
      lastVerified: new Date(cred.lastVerified)
    })),
    assessmentResults: doc.assessmentResults.map(result => ({
      ...result,
      completedAt: new Date(result.completedAt)
    })),
    portfolioProjects: doc.portfolioProjects.map(project => ({
      ...project,
      completionDate: new Date(project.completionDate)
    }))
  };
}

function convertCandidateProfileToFirestore(profile: CandidateProfile): CandidateProfileDocument {
  return {
    ...profile,
    lastUpdated: profile.lastUpdated.toISOString(),
    createdAt: profile.createdAt.toISOString(),
    recentActivity: {
      ...profile.recentActivity,
      lastActiveDate: profile.recentActivity.lastActiveDate.toISOString(),
      weeklyActivity: profile.recentActivity.weeklyActivity.map(wa => ({
        ...wa,
        weekStartDate: wa.weekStartDate.toISOString()
      }))
    },
    verifiedBadges: profile.verifiedBadges.map(badge => ({
      ...badge,
      awardedAt: badge.awardedAt.toISOString(),
      verificationDate: badge.verificationDate.toISOString()
    })),
    blockchainCredentials: profile.blockchainCredentials.map(cred => ({
      ...cred,
      mintedAt: cred.mintedAt.toISOString(),
      lastVerified: cred.lastVerified.toISOString()
    })),
    assessmentResults: profile.assessmentResults.map(result => ({
      ...result,
      completedAt: result.completedAt.toISOString()
    })),
    portfolioProjects: profile.portfolioProjects.map(project => ({
      ...project,
      completionDate: project.completionDate.toISOString()
    }))
  };
}

function convertCustomAssessmentFromFirestore(doc: CustomAssessmentDocument): CustomAssessment {
  return {
    ...doc,
    createdAt: new Date(doc.createdAt),
    updatedAt: new Date(doc.updatedAt),
    publishedAt: doc.publishedAt ? new Date(doc.publishedAt) : undefined,
    expiresAt: doc.expiresAt ? new Date(doc.expiresAt) : undefined
  };
}

function convertCustomAssessmentToFirestore(assessment: CustomAssessment): CustomAssessmentDocument {
  return {
    ...assessment,
    createdAt: assessment.createdAt.toISOString(),
    updatedAt: assessment.updatedAt.toISOString(),
    publishedAt: assessment.publishedAt?.toISOString(),
    expiresAt: assessment.expiresAt?.toISOString()
  };
}

function convertAssessmentResultFromFirestore(doc: AssessmentResultDocument): AssessmentResult {
  return {
    ...doc,
    completedAt: new Date(doc.completedAt)
  };
}

function convertAssessmentResultToFirestore(result: AssessmentResult): AssessmentResultDocument {
  return {
    ...result,
    completedAt: result.completedAt.toISOString()
  };
}