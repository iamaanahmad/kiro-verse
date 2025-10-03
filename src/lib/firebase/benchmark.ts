/**
 * @fileOverview Firebase service for benchmark data storage and retrieval
 * 
 * This service handles:
 * - Industry benchmark data persistence
 * - Market readiness assessment storage
 * - Benchmark comparison history
 * - Job opportunity caching
 */

import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs,
  writeBatch,
  Timestamp
} from 'firebase/firestore';
import { db } from './config';
import {
  IndustryBenchmark,
  MarketReadinessAssessment,
  BenchmarkComparison,
  JobOpportunity,
  IndustryBenchmarkDocument,
  MarketReadinessAssessmentDocument,
  BenchmarkComparisonDocument,
  JobOpportunityDocument,
  BenchmarkUpdateResult
} from '@/types/benchmark';

export class BenchmarkDataService {
  private static readonly COLLECTIONS = {
    INDUSTRY_BENCHMARKS: 'industryBenchmarks',
    MARKET_ASSESSMENTS: 'marketAssessments',
    BENCHMARK_COMPARISONS: 'benchmarkComparisons',
    JOB_OPPORTUNITIES: 'jobOpportunities'
  };

  /**
   * Industry Benchmark Operations
   */
  static async saveIndustryBenchmark(benchmark: IndustryBenchmark): Promise<void> {
    try {
      const docRef = doc(db, this.COLLECTIONS.INDUSTRY_BENCHMARKS, benchmark.benchmarkId);
      const benchmarkDoc: IndustryBenchmarkDocument = {
        ...benchmark,
        lastUpdated: benchmark.lastUpdated.toISOString(),
        validUntil: benchmark.validUntil.toISOString()
      };
      
      await setDoc(docRef, benchmarkDoc);
    } catch (error) {
      console.error('Error saving industry benchmark:', error);
      throw error;
    }
  }

  static async getIndustryBenchmark(benchmarkId: string): Promise<IndustryBenchmark | null> {
    try {
      const docRef = doc(db, this.COLLECTIONS.INDUSTRY_BENCHMARKS, benchmarkId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }
      
      const data = docSnap.data() as IndustryBenchmarkDocument;
      return {
        ...data,
        lastUpdated: new Date(data.lastUpdated),
        validUntil: new Date(data.validUntil)
      };
    } catch (error) {
      console.error('Error getting industry benchmark:', error);
      throw error;
    }
  }

  static async getIndustryBenchmarksBySkill(skillId: string): Promise<IndustryBenchmark[]> {
    try {
      const q = query(
        collection(db, this.COLLECTIONS.INDUSTRY_BENCHMARKS),
        where('skillId', '==', skillId),
        orderBy('lastUpdated', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const benchmarks: IndustryBenchmark[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data() as IndustryBenchmarkDocument;
        benchmarks.push({
          ...data,
          lastUpdated: new Date(data.lastUpdated),
          validUntil: new Date(data.validUntil)
        });
      });
      
      return benchmarks;
    } catch (error) {
      console.error('Error getting benchmarks by skill:', error);
      throw error;
    }
  }

  static async updateIndustryBenchmarks(benchmarks: IndustryBenchmark[]): Promise<BenchmarkUpdateResult> {
    const batch = writeBatch(db);
    const errors: string[] = [];
    let updatedCount = 0;

    try {
      for (const benchmark of benchmarks) {
        try {
          const docRef = doc(db, this.COLLECTIONS.INDUSTRY_BENCHMARKS, benchmark.benchmarkId);
          const benchmarkDoc: IndustryBenchmarkDocument = {
            ...benchmark,
            lastUpdated: benchmark.lastUpdated.toISOString(),
            validUntil: benchmark.validUntil.toISOString()
          };
          
          batch.set(docRef, benchmarkDoc);
          updatedCount++;
        } catch (error) {
          errors.push(`Failed to update benchmark ${benchmark.benchmarkId}: ${error}`);
        }
      }

      await batch.commit();

      return {
        success: errors.length === 0,
        updatedBenchmarks: updatedCount,
        errors,
        lastUpdateTime: new Date(),
        nextUpdateTime: new Date(Date.now() + 24 * 60 * 60 * 1000) // Next day
      };
    } catch (error) {
      console.error('Error updating industry benchmarks:', error);
      return {
        success: false,
        updatedBenchmarks: 0,
        errors: [`Batch update failed: ${error}`],
        lastUpdateTime: new Date(),
        nextUpdateTime: new Date(Date.now() + 60 * 60 * 1000) // Retry in 1 hour
      };
    }
  }

  /**
   * Market Readiness Assessment Operations
   */
  static async saveMarketReadinessAssessment(assessment: MarketReadinessAssessment): Promise<void> {
    try {
      const docRef = doc(db, this.COLLECTIONS.MARKET_ASSESSMENTS, assessment.assessmentId);
      const assessmentDoc: MarketReadinessAssessmentDocument = {
        ...assessment,
        assessmentDate: assessment.assessmentDate.toISOString(),
        nextReviewDate: assessment.nextReviewDate.toISOString()
      };
      
      await setDoc(docRef, assessmentDoc);
    } catch (error) {
      console.error('Error saving market readiness assessment:', error);
      throw error;
    }
  }

  static async getMarketReadinessAssessment(assessmentId: string): Promise<MarketReadinessAssessment | null> {
    try {
      const docRef = doc(db, this.COLLECTIONS.MARKET_ASSESSMENTS, assessmentId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }
      
      const data = docSnap.data() as MarketReadinessAssessmentDocument;
      return {
        ...data,
        assessmentDate: new Date(data.assessmentDate),
        nextReviewDate: new Date(data.nextReviewDate)
      };
    } catch (error) {
      console.error('Error getting market readiness assessment:', error);
      throw error;
    }
  }

  static async getLatestMarketReadinessAssessment(userId: string): Promise<MarketReadinessAssessment | null> {
    try {
      const q = query(
        collection(db, this.COLLECTIONS.MARKET_ASSESSMENTS),
        where('userId', '==', userId),
        orderBy('assessmentDate', 'desc'),
        limit(1)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return null;
      }
      
      const doc = querySnapshot.docs[0];
      const data = doc.data() as MarketReadinessAssessmentDocument;
      
      return {
        ...data,
        assessmentDate: new Date(data.assessmentDate),
        nextReviewDate: new Date(data.nextReviewDate)
      };
    } catch (error) {
      console.error('Error getting latest market readiness assessment:', error);
      throw error;
    }
  }

  static async getUserMarketReadinessHistory(userId: string, limitCount: number = 10): Promise<MarketReadinessAssessment[]> {
    try {
      const q = query(
        collection(db, this.COLLECTIONS.MARKET_ASSESSMENTS),
        where('userId', '==', userId),
        orderBy('assessmentDate', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      const assessments: MarketReadinessAssessment[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data() as MarketReadinessAssessmentDocument;
        assessments.push({
          ...data,
          assessmentDate: new Date(data.assessmentDate),
          nextReviewDate: new Date(data.nextReviewDate)
        });
      });
      
      return assessments;
    } catch (error) {
      console.error('Error getting user market readiness history:', error);
      throw error;
    }
  }

  /**
   * Benchmark Comparison Operations
   */
  static async saveBenchmarkComparison(comparison: BenchmarkComparison): Promise<void> {
    try {
      const docRef = doc(db, this.COLLECTIONS.BENCHMARK_COMPARISONS, comparison.comparisonId);
      const comparisonDoc: BenchmarkComparisonDocument = {
        ...comparison,
        comparisonDate: comparison.comparisonDate.toISOString()
      };
      
      await setDoc(docRef, comparisonDoc);
    } catch (error) {
      console.error('Error saving benchmark comparison:', error);
      throw error;
    }
  }

  static async getBenchmarkComparison(comparisonId: string): Promise<BenchmarkComparison | null> {
    try {
      const docRef = doc(db, this.COLLECTIONS.BENCHMARK_COMPARISONS, comparisonId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }
      
      const data = docSnap.data() as BenchmarkComparisonDocument;
      return {
        ...data,
        comparisonDate: new Date(data.comparisonDate)
      };
    } catch (error) {
      console.error('Error getting benchmark comparison:', error);
      throw error;
    }
  }

  static async getUserBenchmarkComparisons(userId: string, skillId?: string): Promise<BenchmarkComparison[]> {
    try {
      let q = query(
        collection(db, this.COLLECTIONS.BENCHMARK_COMPARISONS),
        where('userId', '==', userId),
        orderBy('comparisonDate', 'desc')
      );

      if (skillId) {
        q = query(
          collection(db, this.COLLECTIONS.BENCHMARK_COMPARISONS),
          where('userId', '==', userId),
          where('skillId', '==', skillId),
          orderBy('comparisonDate', 'desc')
        );
      }
      
      const querySnapshot = await getDocs(q);
      const comparisons: BenchmarkComparison[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data() as BenchmarkComparisonDocument;
        comparisons.push({
          ...data,
          comparisonDate: new Date(data.comparisonDate)
        });
      });
      
      return comparisons;
    } catch (error) {
      console.error('Error getting user benchmark comparisons:', error);
      throw error;
    }
  }

  /**
   * Job Opportunity Operations
   */
  static async saveJobOpportunity(opportunity: JobOpportunity): Promise<void> {
    try {
      const docRef = doc(db, this.COLLECTIONS.JOB_OPPORTUNITIES, opportunity.opportunityId);
      const opportunityDoc: JobOpportunityDocument = {
        ...opportunity,
        postedDate: opportunity.postedDate.toISOString(),
        expiryDate: opportunity.expiryDate?.toISOString()
      };
      
      await setDoc(docRef, opportunityDoc);
    } catch (error) {
      console.error('Error saving job opportunity:', error);
      throw error;
    }
  }

  static async getJobOpportunity(opportunityId: string): Promise<JobOpportunity | null> {
    try {
      const docRef = doc(db, this.COLLECTIONS.JOB_OPPORTUNITIES, opportunityId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }
      
      const data = docSnap.data() as JobOpportunityDocument;
      return {
        ...data,
        postedDate: new Date(data.postedDate),
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : undefined
      };
    } catch (error) {
      console.error('Error getting job opportunity:', error);
      throw error;
    }
  }

  static async getActiveJobOpportunities(limitCount: number = 50): Promise<JobOpportunity[]> {
    try {
      const now = new Date().toISOString();
      const q = query(
        collection(db, this.COLLECTIONS.JOB_OPPORTUNITIES),
        where('expiryDate', '>', now),
        orderBy('expiryDate', 'asc'),
        orderBy('postedDate', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      const opportunities: JobOpportunity[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data() as JobOpportunityDocument;
        opportunities.push({
          ...data,
          postedDate: new Date(data.postedDate),
          expiryDate: data.expiryDate ? new Date(data.expiryDate) : undefined
        });
      });
      
      return opportunities;
    } catch (error) {
      console.error('Error getting active job opportunities:', error);
      throw error;
    }
  }

  static async searchJobOpportunities(
    skills: string[],
    experienceLevel?: string,
    location?: string,
    remote?: boolean
  ): Promise<JobOpportunity[]> {
    try {
      // Note: This is a simplified search. In production, you'd use more sophisticated querying
      // or a search service like Algolia or Elasticsearch
      let q = query(
        collection(db, this.COLLECTIONS.JOB_OPPORTUNITIES),
        orderBy('postedDate', 'desc'),
        limit(100)
      );

      if (remote !== undefined) {
        q = query(
          collection(db, this.COLLECTIONS.JOB_OPPORTUNITIES),
          where('remote', '==', remote),
          orderBy('postedDate', 'desc'),
          limit(100)
        );
      }
      
      const querySnapshot = await getDocs(q);
      const opportunities: JobOpportunity[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data() as JobOpportunityDocument;
        const opportunity: JobOpportunity = {
          ...data,
          postedDate: new Date(data.postedDate),
          expiryDate: data.expiryDate ? new Date(data.expiryDate) : undefined
        };

        // Filter by skills and other criteria in memory
        // In production, this would be done at the database level
        const hasMatchingSkills = skills.some(skill =>
          opportunity.requiredSkills.some(req => req.skillId === skill) ||
          opportunity.optionalSkills.some(opt => opt.skillId === skill)
        );

        const matchesExperience = !experienceLevel || 
          opportunity.experienceLevel.level === experienceLevel;

        const matchesLocation = !location || 
          opportunity.location.toLowerCase().includes(location.toLowerCase()) ||
          opportunity.remote;

        if (hasMatchingSkills && matchesExperience && matchesLocation) {
          opportunities.push(opportunity);
        }
      });
      
      return opportunities.slice(0, 20); // Return top 20 matches
    } catch (error) {
      console.error('Error searching job opportunities:', error);
      throw error;
    }
  }

  /**
   * Cleanup Operations
   */
  static async cleanupExpiredData(): Promise<void> {
    const batch = writeBatch(db);
    const now = new Date();

    try {
      // Cleanup expired benchmarks
      const expiredBenchmarksQuery = query(
        collection(db, this.COLLECTIONS.INDUSTRY_BENCHMARKS),
        where('validUntil', '<', now.toISOString())
      );
      
      const expiredBenchmarks = await getDocs(expiredBenchmarksQuery);
      expiredBenchmarks.forEach((doc) => {
        batch.delete(doc.ref);
      });

      // Cleanup expired job opportunities
      const expiredJobsQuery = query(
        collection(db, this.COLLECTIONS.JOB_OPPORTUNITIES),
        where('expiryDate', '<', now.toISOString())
      );
      
      const expiredJobs = await getDocs(expiredJobsQuery);
      expiredJobs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      console.log('Cleanup completed successfully');
    } catch (error) {
      console.error('Error during cleanup:', error);
      throw error;
    }
  }

  /**
   * Utility Methods
   */
  static generateBenchmarkId(skillId: string, experienceLevel: string, industry: string = 'software'): string {
    return `benchmark_${skillId}_${experienceLevel}_${industry}_${Date.now()}`;
  }

  static generateAssessmentId(userId: string): string {
    return `assessment_${userId}_${Date.now()}`;
  }

  static generateComparisonId(userId: string, skillId: string): string {
    return `comparison_${userId}_${skillId}_${Date.now()}`;
  }

  static generateOpportunityId(): string {
    return `opportunity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Utility class for benchmark calculations and analysis
export class BenchmarkUtils {
  static calculatePercentileRank(score: number, allScores: number[]): number {
    if (allScores.length === 0) return 50;
    
    const sortedScores = allScores.sort((a, b) => a - b);
    const rank = sortedScores.filter(s => s < score).length;
    return Math.round((rank / sortedScores.length) * 100);
  }

  static determineExperienceLevel(totalExperience: number, averageSkillLevel: number): string {
    if (averageSkillLevel >= 4 && totalExperience >= 2000) return 'principal';
    if (averageSkillLevel >= 3.5 && totalExperience >= 1500) return 'lead';
    if (averageSkillLevel >= 3 && totalExperience >= 1000) return 'senior';
    if (averageSkillLevel >= 2.5 && totalExperience >= 500) return 'mid';
    if (averageSkillLevel >= 2 && totalExperience >= 200) return 'junior';
    return 'entry';
  }

  static calculateMarketReadinessScore(
    skillScores: number[],
    industryAverages: number[],
    weights: number[] = []
  ): number {
    if (skillScores.length === 0 || skillScores.length !== industryAverages.length) {
      return 0;
    }

    const defaultWeights = weights.length === skillScores.length ? weights : 
      new Array(skillScores.length).fill(1 / skillScores.length);

    let weightedScore = 0;
    let totalWeight = 0;

    for (let i = 0; i < skillScores.length; i++) {
      const relativeScore = (skillScores[i] / industryAverages[i]) * 100;
      weightedScore += relativeScore * defaultWeights[i];
      totalWeight += defaultWeights[i];
    }

    return Math.min(100, Math.max(0, weightedScore / totalWeight));
  }

  static generateInsightId(): string {
    return `insight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  static formatPercentile(percentile: number): string {
    if (percentile >= 90) return `${percentile}th percentile (Top 10%)`;
    if (percentile >= 75) return `${percentile}th percentile (Above Average)`;
    if (percentile >= 25) return `${percentile}th percentile (Average)`;
    return `${percentile}th percentile (Below Average)`;
  }

  static formatSkillLevel(level: number): string {
    if (level >= 4) return 'Expert';
    if (level >= 3) return 'Advanced';
    if (level >= 2) return 'Intermediate';
    if (level >= 1) return 'Beginner';
    return 'Novice';
  }
}