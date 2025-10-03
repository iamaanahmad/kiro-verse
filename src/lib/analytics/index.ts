/**
 * @fileOverview Main entry point for the analytics system
 * 
 * This module provides a clean API for integrating the skill progression tracking
 * system with the rest of the KiroVerse application.
 */

export { SkillProgressTracker } from './skill-progress-tracker';
export type { 
  SkillAnalysisResult, 
  ProgressTrackingOptions 
} from './skill-progress-tracker';

// Re-export analytics types for convenience
export type {
  UserProgress,
  SkillLevel,
  AnalyticsData,
  LearningInsight,
  SkillImprovement,
  CodeSubmission,
  AIAnalysisResult,
  CodeMetrics,
  ProgressPoint,
  TrendData
} from '@/types/analytics';

// Re-export database services
export {
  UserProgressService,
  AnalyticsDataService,
  LearningInsightsService,
  AnalyticsUtils,
  COLLECTIONS
} from '@/lib/firebase/analytics';

/**
 * Convenience function to analyze code and track skill progression
 * This is the main entry point for most use cases
 */
export async function analyzeAndTrackProgress(
  userId: string,
  code: string,
  context?: string
) {
  return SkillProgressTracker.analyzeCodeSubmission(userId, code, context);
}

/**
 * Convenience function to get user's current skill progression
 */
export async function getUserSkillProgress(userId: string) {
  return UserProgressService.getUserProgress(userId);
}

/**
 * Convenience function to get user's learning insights
 */
export async function getUserLearningInsights(userId: string, unreadOnly = false) {
  return LearningInsightsService.getUserLearningInsights(userId, unreadOnly);
}