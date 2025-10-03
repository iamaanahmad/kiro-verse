/**
 * @fileOverview Benchmark data models for industry standards and peer comparisons
 * 
 * This module defines the data structures for:
 * - Industry benchmark data and standards
 * - Experience level classifications
 * - Market readiness assessments
 * - Job opportunity matching
 */

export interface IndustryBenchmark {
  benchmarkId: string;
  skillId: string;
  skillName: string;
  industry: string;
  experienceLevel: ExperienceLevel;
  averageScore: number;
  percentileRanges: PercentileRange[];
  sampleSize: number;
  dataSource: string;
  lastUpdated: Date;
  validUntil: Date;
  region: string;
  currency?: string;
  salaryRange?: SalaryRange;
}

export interface PercentileRange {
  percentile: number;
  minScore: number;
  maxScore: number;
  description: string;
}

export interface SalaryRange {
  min: number;
  max: number;
  median: number;
  currency: string;
}

export interface ExperienceLevel {
  level: 'entry' | 'junior' | 'mid' | 'senior' | 'lead' | 'principal';
  yearsOfExperience: number;
  description: string;
  requiredSkills: string[];
  typicalResponsibilities: string[];
}

export interface MarketReadinessAssessment {
  userId: string;
  assessmentId: string;
  overallReadiness: number; // 0-100
  experienceLevel: ExperienceLevel;
  skillGaps: SkillGap[];
  strengths: SkillStrength[];
  recommendedActions: RecommendedAction[];
  jobOpportunities: JobOpportunity[];
  assessmentDate: Date;
  nextReviewDate: Date;
}

export interface SkillGap {
  skillId: string;
  skillName: string;
  currentLevel: number;
  requiredLevel: number;
  industryAverage: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimatedTimeToClose: number; // in weeks
  recommendedResources: LearningResource[];
}

export interface SkillStrength {
  skillId: string;
  skillName: string;
  currentLevel: number;
  industryPercentile: number;
  marketValue: 'low' | 'medium' | 'high' | 'exceptional';
  relatedOpportunities: string[];
}

export interface RecommendedAction {
  actionId: string;
  type: 'skill_development' | 'certification' | 'project_experience' | 'networking';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  estimatedEffort: number; // in hours
  expectedImpact: number; // 0-100
  resources: LearningResource[];
  deadline?: Date;
}

export interface LearningResource {
  resourceId: string;
  type: 'course' | 'tutorial' | 'documentation' | 'project' | 'certification';
  title: string;
  description: string;
  url?: string;
  provider: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedDuration: number; // in hours
  cost: number;
  currency: string;
  rating?: number;
  reviewCount?: number;
}

export interface JobOpportunity {
  opportunityId: string;
  title: string;
  company: string;
  location: string;
  remote: boolean;
  experienceLevel: ExperienceLevel;
  requiredSkills: SkillRequirement[];
  optionalSkills: SkillRequirement[];
  salaryRange: SalaryRange;
  matchScore: number; // 0-100
  skillsMatch: number; // 0-100
  experienceMatch: number; // 0-100;
  description: string;
  applicationUrl?: string;
  postedDate: Date;
  expiryDate?: Date;
}

export interface SkillRequirement {
  skillId: string;
  skillName: string;
  minimumLevel: number;
  weight: number; // importance weight 0-1
  category: 'technical' | 'soft' | 'domain';
}

export interface BenchmarkComparison {
  comparisonId: string;
  userId: string;
  skillId: string;
  userScore: number;
  industryBenchmark: IndustryBenchmark;
  percentileRank: number;
  performanceLevel: 'below_average' | 'average' | 'above_average' | 'exceptional';
  gapAnalysis: GapAnalysis;
  recommendations: string[];
  comparisonDate: Date;
}

export interface GapAnalysis {
  scoreGap: number; // difference from industry average
  percentileGap: number; // difference from target percentile
  timeToTarget: number; // estimated weeks to reach target
  difficultyLevel: 'easy' | 'moderate' | 'challenging' | 'difficult';
  keyImprovementAreas: string[];
}

export interface BenchmarkDataSource {
  sourceId: string;
  name: string;
  description: string;
  credibility: number; // 0-100
  updateFrequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annually';
  lastUpdate: Date;
  coverage: {
    skills: string[];
    industries: string[];
    regions: string[];
    experienceLevels: string[];
  };
  apiEndpoint?: string;
  dataFormat: 'json' | 'csv' | 'xml';
  accessMethod: 'api' | 'scraping' | 'manual' | 'partnership';
}

// Database document interfaces for Firestore
export interface IndustryBenchmarkDocument {
  benchmarkId: string;
  skillId: string;
  skillName: string;
  industry: string;
  experienceLevel: ExperienceLevel;
  averageScore: number;
  percentileRanges: PercentileRange[];
  sampleSize: number;
  dataSource: string;
  lastUpdated: string; // ISO string
  validUntil: string; // ISO string
  region: string;
  currency?: string;
  salaryRange?: SalaryRange;
}

export interface MarketReadinessAssessmentDocument {
  userId: string;
  assessmentId: string;
  overallReadiness: number;
  experienceLevel: ExperienceLevel;
  skillGaps: SkillGap[];
  strengths: SkillStrength[];
  recommendedActions: RecommendedAction[];
  jobOpportunities: JobOpportunity[];
  assessmentDate: string; // ISO string
  nextReviewDate: string; // ISO string
}

export interface BenchmarkComparisonDocument {
  comparisonId: string;
  userId: string;
  skillId: string;
  userScore: number;
  industryBenchmark: IndustryBenchmark;
  percentileRank: number;
  performanceLevel: 'below_average' | 'average' | 'above_average' | 'exceptional';
  gapAnalysis: GapAnalysis;
  recommendations: string[];
  comparisonDate: string; // ISO string
}

export interface JobOpportunityDocument {
  opportunityId: string;
  title: string;
  company: string;
  location: string;
  remote: boolean;
  experienceLevel: ExperienceLevel;
  requiredSkills: SkillRequirement[];
  optionalSkills: SkillRequirement[];
  salaryRange: SalaryRange;
  matchScore: number;
  skillsMatch: number;
  experienceMatch: number;
  description: string;
  applicationUrl?: string;
  postedDate: string; // ISO string
  expiryDate?: string; // ISO string
}

// Utility types for benchmark analysis
export interface BenchmarkAnalysisOptions {
  includeIndustryComparison?: boolean;
  includePeerComparison?: boolean;
  includeJobMatching?: boolean;
  targetExperienceLevel?: string;
  targetIndustry?: string;
  targetRegion?: string;
}

export interface BenchmarkUpdateResult {
  success: boolean;
  updatedBenchmarks: number;
  errors: string[];
  lastUpdateTime: Date;
  nextUpdateTime: Date;
}