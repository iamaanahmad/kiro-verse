/**
 * @fileOverview Employer verification and assessment data models
 * 
 * This module defines the data structures for:
 * - Employer dashboard and candidate verification
 * - Custom assessment creation and management
 * - Candidate profile analysis and comparison
 * - Blockchain verification for employer use
 */

import { SkillLevel, UserProgress, LearningInsight, AnalyticsData } from './analytics';
import { BenchmarkComparison, MarketReadinessAssessment, JobOpportunity } from './benchmark';
import { BadgeAward, LeaderboardEntry } from './gamification';

export interface CandidateProfile {
  userId: string;
  username: string;
  displayName?: string;
  email?: string;
  profileUrl?: string;
  avatarUrl?: string;
  
  // Core analytics data
  skillLevels: SkillLevel[];
  overallProgress: UserProgress;
  learningVelocity: number;
  codeQualityTrend: {
    direction: 'improving' | 'stable' | 'declining';
    changePercentage: number;
    timeframe: string;
  };
  
  // Verification and credentials
  verifiedBadges: VerifiedBadge[];
  blockchainCredentials: BlockchainCredential[];
  assessmentResults: AssessmentResult[];
  
  // Benchmarking and comparison
  industryBenchmarks: BenchmarkComparison[];
  marketReadiness: MarketReadinessAssessment;
  peerComparisons: PeerComparison[];
  
  // Activity and engagement
  recentActivity: ActivitySummary;
  learningInsights: LearningInsight[];
  portfolioProjects: PortfolioProject[];
  
  // Privacy and visibility settings
  profileVisibility: ProfileVisibility;
  lastUpdated: Date;
  createdAt: Date;
}

export interface VerifiedBadge extends BadgeAward {
  verificationLevel: 'blockchain_verified' | 'platform_verified' | 'self_reported';
  verificationDate: Date;
  verifierInfo?: {
    verifierId: string;
    verifierName: string;
    verificationMethod: string;
  };
  skillEvidence: SkillEvidence[];
}

export interface BlockchainCredential {
  credentialId: string;
  badgeId: string;
  transactionHash: string;
  blockNumber: number;
  contractAddress: string;
  tokenId: string;
  mintedAt: Date;
  verificationUrl: string;
  metadata: {
    skillsValidated: string[];
    assessmentScore?: number;
    difficultyLevel: string;
    issuerSignature: string;
  };
  isValid: boolean;
  lastVerified: Date;
}

export interface SkillEvidence {
  evidenceId: string;
  type: 'code_submission' | 'project_completion' | 'peer_review' | 'assessment_result';
  description: string;
  artifactUrl?: string;
  codeQuality: number;
  timestamp: Date;
  verificationStatus: 'verified' | 'pending' | 'disputed';
}

export interface AssessmentResult {
  assessmentId: string;
  assessmentTitle: string;
  assessmentType: 'custom' | 'standard' | 'certification';
  completedAt: Date;
  score: number;
  maxScore: number;
  percentileRank: number;
  timeSpent: number; // in minutes
  
  // Detailed results
  skillBreakdown: SkillAssessmentScore[];
  codeQuality: CodeQualityMetrics;
  problemSolvingApproach: ProblemSolvingAnalysis;
  
  // Verification
  isVerified: boolean;
  verificationHash?: string;
  employerFeedback?: string;
  
  // Comparison data
  industryBenchmark: number;
  peerAverage: number;
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
}

export interface SkillAssessmentScore {
  skillId: string;
  skillName: string;
  score: number;
  maxScore: number;
  industryBenchmark: number;
  strengthAreas: string[];
  improvementAreas: string[];
}

export interface CodeQualityMetrics {
  readability: number;
  maintainability: number;
  efficiency: number;
  bestPractices: number;
  testCoverage?: number;
  documentation: number;
  errorHandling: number;
}

export interface ProblemSolvingAnalysis {
  approach: 'systematic' | 'intuitive' | 'experimental' | 'collaborative';
  timeManagement: number; // 0-100
  debuggingSkills: number; // 0-100
  creativityScore: number; // 0-100
  adaptability: number; // 0-100
  communicationClarity: number; // 0-100
}

export interface PeerComparison {
  comparisonId: string;
  skillId: string;
  userPercentile: number;
  peerGroupSize: number;
  peerGroupCriteria: {
    experienceLevel: string;
    industry?: string;
    region?: string;
    timeframe: string;
  };
  anonymizedStats: {
    average: number;
    median: number;
    topPercentile: number;
    bottomPercentile: number;
  };
  rankingPosition: number;
  comparisonDate: Date;
}

export interface ActivitySummary {
  totalSessions: number;
  totalCodeSubmissions: number;
  averageSessionDuration: number; // in minutes
  lastActiveDate: Date;
  streakDays: number;
  weeklyActivity: WeeklyActivity[];
  skillFocus: SkillFocusArea[];
}

export interface WeeklyActivity {
  weekStartDate: Date;
  sessionsCount: number;
  codeSubmissions: number;
  skillsImproved: string[];
  averageQuality: number;
}

export interface SkillFocusArea {
  skillId: string;
  skillName: string;
  timeSpent: number; // in minutes
  improvementRate: number;
  focusIntensity: 'low' | 'medium' | 'high';
}

export interface PortfolioProject {
  projectId: string;
  title: string;
  description: string;
  technologies: string[];
  repositoryUrl?: string;
  liveUrl?: string;
  skillsValidated: string[];
  codeQualityScore: number;
  complexityLevel: 'simple' | 'moderate' | 'complex' | 'advanced';
  completionDate: Date;
  verificationStatus: 'verified' | 'pending' | 'unverified';
}

export interface ProfileVisibility {
  isPublic: boolean;
  showRealName: boolean;
  showContactInfo: boolean;
  showDetailedAnalytics: boolean;
  showBenchmarkComparisons: boolean;
  allowEmployerContact: boolean;
  visibleToEmployers: boolean;
}

// Custom Assessment Types
export interface CustomAssessment {
  assessmentId: string;
  title: string;
  description: string;
  createdBy: string; // employer user ID
  companyName: string;
  
  // Assessment configuration
  targetSkills: SkillRequirement[];
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert' | 'mixed';
  estimatedDuration: number; // in minutes
  timeLimit?: number; // in minutes
  
  // Assessment content
  challenges: AssessmentChallenge[];
  evaluationCriteria: EvaluationCriteria[];
  passingScore: number;
  
  // AI configuration
  aiGenerationPrompt?: string;
  useAIEvaluation: boolean;
  customInstructions?: string;
  
  // Status and metadata
  status: 'draft' | 'active' | 'paused' | 'completed' | 'archived';
  participantCount: number;
  averageScore: number;
  completionRate: number;
  
  // Dates
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
  expiresAt?: Date;
}

export interface SkillRequirement {
  skillId: string;
  skillName: string;
  minimumLevel: number;
  weight: number; // 0-1, importance in overall assessment
  isRequired: boolean;
}

export interface AssessmentChallenge {
  challengeId: string;
  title: string;
  description: string;
  prompt: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  skillsTargeted: string[];
  timeLimit?: number; // in minutes
  
  // Challenge content
  starterCode?: string;
  testCases: TestCase[];
  expectedApproach?: string;
  hints: string[];
  
  // Scoring
  maxScore: number;
  weight: number; // relative weight in overall assessment
  evaluationMethod: 'automated' | 'ai_assisted' | 'manual';
  
  // AI evaluation configuration
  aiEvaluationCriteria?: AIEvaluationCriteria[];
}

export interface TestCase {
  testId: string;
  input: string;
  expectedOutput: string;
  isHidden: boolean;
  weight: number;
  description?: string;
  timeoutMs?: number;
}

export interface EvaluationCriteria {
  criteriaId: string;
  name: string;
  description: string;
  weight: number;
  maxScore: number;
  evaluationType: 'automated' | 'ai_assisted' | 'manual';
  rubric?: EvaluationRubric[];
}

export interface EvaluationRubric {
  scoreRange: { min: number; max: number };
  description: string;
  indicators: string[];
}

export interface AIEvaluationCriteria {
  aspect: 'code_quality' | 'efficiency' | 'creativity' | 'best_practices' | 'problem_solving';
  weight: number;
  description: string;
  evaluationPrompt: string;
}

// Employer Dashboard Types
export interface EmployerDashboardData {
  employerId: string;
  companyName: string;
  candidateProfiles: CandidateProfile[];
  customAssessments: CustomAssessment[];
  assessmentResults: AssessmentResult[];
  industryBenchmarks: IndustryBenchmarkSummary[];
  dashboardMetrics: DashboardMetrics;
  recentActivity: EmployerActivity[];
}

export interface IndustryBenchmarkSummary {
  industry: string;
  skillId: string;
  skillName: string;
  averageScore: number;
  sampleSize: number;
  lastUpdated: Date;
  percentileRanges: {
    p25: number;
    p50: number;
    p75: number;
    p90: number;
  };
}

export interface DashboardMetrics {
  totalCandidatesViewed: number;
  totalAssessmentsCreated: number;
  totalAssessmentCompletions: number;
  averageCandidateScore: number;
  topPerformingSkills: string[];
  assessmentCompletionRate: number;
  candidateEngagementRate: number;
  lastUpdated: Date;
}

export interface EmployerActivity {
  activityId: string;
  type: 'candidate_viewed' | 'assessment_created' | 'assessment_completed' | 'verification_checked';
  description: string;
  timestamp: Date;
  relatedEntityId?: string; // candidate ID, assessment ID, etc.
  metadata?: Record<string, any>;
}

// Candidate Comparison Types
export interface CandidateComparison {
  comparisonId: string;
  candidates: CandidateProfile[];
  comparisonCriteria: ComparisonCriteria[];
  results: ComparisonResult[];
  createdAt: Date;
  createdBy: string;
}

export interface ComparisonCriteria {
  criteriaId: string;
  name: string;
  type: 'skill_level' | 'experience' | 'code_quality' | 'learning_velocity' | 'assessment_score';
  weight: number;
  skillId?: string;
  assessmentId?: string;
}

export interface ComparisonResult {
  candidateId: string;
  overallScore: number;
  criteriaScores: CriteriaScore[];
  ranking: number;
  strengths: string[];
  weaknesses: string[];
  recommendation: 'highly_recommended' | 'recommended' | 'consider' | 'not_recommended';
}

export interface CriteriaScore {
  criteriaId: string;
  score: number;
  normalizedScore: number; // 0-100
  industryPercentile: number;
  notes?: string;
}

// Database document interfaces for Firestore
export interface CandidateProfileDocument {
  userId: string;
  username: string;
  displayName?: string;
  email?: string;
  profileUrl?: string;
  avatarUrl?: string;
  skillLevels: SkillLevel[];
  overallProgress: UserProgress;
  learningVelocity: number;
  codeQualityTrend: {
    direction: 'improving' | 'stable' | 'declining';
    changePercentage: number;
    timeframe: string;
  };
  verifiedBadges: VerifiedBadge[];
  blockchainCredentials: BlockchainCredential[];
  assessmentResults: AssessmentResult[];
  industryBenchmarks: BenchmarkComparison[];
  marketReadiness: MarketReadinessAssessment;
  peerComparisons: PeerComparison[];
  recentActivity: ActivitySummary;
  learningInsights: LearningInsight[];
  portfolioProjects: PortfolioProject[];
  profileVisibility: ProfileVisibility;
  lastUpdated: string; // ISO string
  createdAt: string; // ISO string
}

export interface CustomAssessmentDocument {
  assessmentId: string;
  title: string;
  description: string;
  createdBy: string;
  companyName: string;
  targetSkills: SkillRequirement[];
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert' | 'mixed';
  estimatedDuration: number;
  timeLimit?: number;
  challenges: AssessmentChallenge[];
  evaluationCriteria: EvaluationCriteria[];
  passingScore: number;
  aiGenerationPrompt?: string;
  useAIEvaluation: boolean;
  customInstructions?: string;
  status: 'draft' | 'active' | 'paused' | 'completed' | 'archived';
  participantCount: number;
  averageScore: number;
  completionRate: number;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  publishedAt?: string; // ISO string
  expiresAt?: string; // ISO string
}

export interface AssessmentResultDocument {
  assessmentId: string;
  assessmentTitle: string;
  assessmentType: 'custom' | 'standard' | 'certification';
  completedAt: string; // ISO string
  score: number;
  maxScore: number;
  percentileRank: number;
  timeSpent: number;
  skillBreakdown: SkillAssessmentScore[];
  codeQuality: CodeQualityMetrics;
  problemSolvingApproach: ProblemSolvingAnalysis;
  isVerified: boolean;
  verificationHash?: string;
  employerFeedback?: string;
  industryBenchmark: number;
  peerAverage: number;
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
}
</content>