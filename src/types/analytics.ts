// Analytics Data Models for Advanced Learning Analytics System

export interface UserProgress {
  userId: string;
  skillLevels: Map<string, SkillLevel>;
  learningVelocity: number;
  codeQualityTrend: TrendData;
  challengesCompleted: Challenge[];
  peerInteractions: PeerInteraction[];
  lastAnalysisDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface SkillLevel {
  skillId: string;
  skillName: string;
  currentLevel: number;
  experiencePoints: number;
  competencyAreas: CompetencyArea[];
  industryBenchmark: BenchmarkScore;
  verificationStatus: 'verified' | 'pending' | 'unverified';
  progressHistory: ProgressPoint[];
  trendDirection: 'improving' | 'stable' | 'declining';
  lastUpdated: Date;
}

export interface AnalyticsData {
  sessionId: string;
  userId: string;
  codeSubmission: CodeSubmission;
  aiAnalysis: AIAnalysisResult;
  skillImprovements: SkillImprovement[];
  learningInsights: LearningInsight[];
  benchmarkComparisons: BenchmarkComparison[];
  timestamp: Date;
  processingStatus: 'pending' | 'completed' | 'failed';
}

export interface LearningInsight {
  id: string;
  userId: string;
  type: 'strength' | 'improvement_area' | 'recommendation';
  category: string;
  title: string;
  description: string;
  actionableSteps: string[];
  confidenceScore: number;
  priority: 'low' | 'medium' | 'high';
  isRead: boolean;
  createdAt: Date;
  expiresAt?: Date;
}

// Supporting interfaces
export interface TrendData {
  direction: 'improving' | 'stable' | 'declining';
  changePercentage: number;
  timeframe: string;
  dataPoints: number;
}

export interface Challenge {
  challengeId: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  skillsTargeted: string[];
  timeLimit?: number;
  evaluationCriteria: EvaluationCriteria[];
  createdBy: 'ai' | 'community' | 'employer';
  isActive: boolean;
  completedAt?: Date;
  score?: number;
  ranking?: number;
  // Additional fields for full challenge system
  prompt: string;
  expectedOutput?: string;
  testCases: TestCase[];
  hints: string[];
  tags: string[];
  category: string;
  estimatedDuration: number; // in minutes
  prerequisites: string[];
  learningObjectives: string[];
  createdAt: Date;
  updatedAt: Date;
  creatorId?: string;
  participantCount: number;
  averageScore: number;
  successRate: number;
}

export interface Competition {
  competitionId: string;
  title: string;
  description: string;
  type: 'daily' | 'weekly' | 'monthly' | 'special';
  challenges: string[]; // Array of challenge IDs
  participants: Participant[];
  leaderboard: LeaderboardEntry[];
  prizes: Prize[];
  startDate: Date;
  endDate: Date;
  registrationDeadline?: Date;
  maxParticipants?: number;
  entryRequirements: EntryRequirement[];
  rules: string[];
  status: 'upcoming' | 'active' | 'completed' | 'cancelled';
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TestCase {
  input: string;
  expectedOutput: string;
  isHidden: boolean;
  weight: number;
  description?: string;
}

export interface Participant {
  userId: string;
  username: string;
  registeredAt: Date;
  completedChallenges: string[];
  totalScore: number;
  rank?: number;
  badges: string[];
}

export interface LeaderboardEntry {
  userId: string;
  username: string;
  score: number;
  rank: number;
  completionTime?: number;
  badgesEarned: string[];
  lastSubmissionAt: Date;
}

export interface Prize {
  rank: number;
  title: string;
  description: string;
  type: 'badge' | 'points' | 'nft' | 'recognition';
  value?: number;
  badgeId?: string;
}

export interface EntryRequirement {
  type: 'skill_level' | 'badge' | 'experience_points' | 'completion_rate';
  skillId?: string;
  minimumLevel?: number;
  requiredBadge?: string;
  minimumPoints?: number;
  minimumRate?: number;
}

export interface ChallengeSubmission {
  submissionId: string;
  challengeId: string;
  userId: string;
  code: string;
  language: string;
  submittedAt: Date;
  evaluationResults: EvaluationResult[];
  totalScore: number;
  passed: boolean;
  executionTime?: number;
  memoryUsage?: number;
  feedback: string[];
  aiAnalysis?: AIAnalysisResult;
}

export interface EvaluationResult {
  testCaseId: string;
  passed: boolean;
  actualOutput?: string;
  executionTime?: number;
  errorMessage?: string;
  score: number;
}

export interface PeerInteraction {
  interactionId: string;
  type: 'review' | 'mentorship' | 'collaboration';
  peerId: string;
  sessionId?: string;
  feedback?: string;
  rating?: number;
  timestamp: Date;
}

export interface CompetencyArea {
  areaId: string;
  name: string;
  level: number;
  maxLevel: number;
  skills: string[];
}

export interface BenchmarkScore {
  industryAverage: number;
  experienceLevel: string;
  percentile: number;
  lastUpdated: Date;
}

export interface ProgressPoint {
  timestamp: Date;
  level: number;
  experiencePoints: number;
  milestone?: string;
}

export interface CodeSubmission {
  submissionId: string;
  code: string;
  language: string;
  context: string;
  metrics: CodeMetrics;
  timestamp: Date;
}

export interface AIAnalysisResult {
  analysisId: string;
  codeQuality: number;
  efficiency: number;
  creativity: number;
  bestPractices: number;
  suggestions: string[];
  detectedSkills: string[];
  improvementAreas: string[];
  processingTime: number;
}

export interface SkillImprovement {
  skillId: string;
  previousLevel: number;
  newLevel: number;
  improvementType: 'level_up' | 'experience_gain' | 'competency_unlock';
  evidence: string[];
  timestamp: Date;
}

export interface BenchmarkComparison {
  comparisonId: string;
  skillId: string;
  userScore: number;
  industryAverage: number;
  peerAverage: number;
  percentile: number;
  category: string;
  timestamp: Date;
}

export interface EvaluationCriteria {
  criteriaId: string;
  name: string;
  weight: number;
  description: string;
  maxScore: number;
}

export interface CodeMetrics {
  linesOfCode: number;
  complexity: number;
  maintainability: number;
  testCoverage?: number;
  performance?: number;
  security?: number;
}

// Database collection interfaces for Firestore
export interface UserProgressDocument {
  userId: string;
  skillLevels: { [skillId: string]: SkillLevel };
  learningVelocity: number;
  codeQualityTrend: TrendData;
  challengesCompleted: Challenge[];
  peerInteractions: PeerInteraction[];
  lastAnalysisDate: string; // ISO string for Firestore
  createdAt: string;
  updatedAt: string;
}

export interface AnalyticsDataDocument {
  sessionId: string;
  userId: string;
  codeSubmission: CodeSubmission;
  aiAnalysis: AIAnalysisResult;
  skillImprovements: SkillImprovement[];
  learningInsights: LearningInsight[];
  benchmarkComparisons: BenchmarkComparison[];
  timestamp: string; // ISO string for Firestore
  processingStatus: 'pending' | 'completed' | 'failed';
}

export interface LearningInsightDocument {
  id: string;
  userId: string;
  type: 'strength' | 'improvement_area' | 'recommendation';
  category: string;
  title: string;
  description: string;
  actionableSteps: string[];
  confidenceScore: number;
  priority: 'low' | 'medium' | 'high';
  isRead: boolean;
  createdAt: string;
  expiresAt?: string;
}

export interface ChallengeDocument {
  challengeId: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  skillsTargeted: string[];
  timeLimit?: number;
  evaluationCriteria: EvaluationCriteria[];
  createdBy: 'ai' | 'community' | 'employer';
  isActive: boolean;
  prompt: string;
  expectedOutput?: string;
  testCases: TestCase[];
  hints: string[];
  tags: string[];
  category: string;
  estimatedDuration: number;
  prerequisites: string[];
  learningObjectives: string[];
  createdAt: string;
  updatedAt: string;
  creatorId?: string;
  participantCount: number;
  averageScore: number;
  successRate: number;
}

export interface CompetitionDocument {
  competitionId: string;
  title: string;
  description: string;
  type: 'daily' | 'weekly' | 'monthly' | 'special';
  challenges: string[];
  participants: Participant[];
  leaderboard: LeaderboardEntry[];
  prizes: Prize[];
  startDate: string;
  endDate: string;
  registrationDeadline?: string;
  maxParticipants?: number;
  entryRequirements: EntryRequirement[];
  rules: string[];
  status: 'upcoming' | 'active' | 'completed' | 'cancelled';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChallengeSubmissionDocument {
  submissionId: string;
  challengeId: string;
  userId: string;
  code: string;
  language: string;
  submittedAt: string;
  evaluationResults: EvaluationResult[];
  totalScore: number;
  passed: boolean;
  executionTime?: number;
  memoryUsage?: number;
  feedback: string[];
  aiAnalysis?: AIAnalysisResult;
}