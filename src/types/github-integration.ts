export interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  created_at: string;
  updated_at: string;
  size: number;
}

export interface GitHubCommit {
  sha: string;
  commit: {
    author: {
      name: string;
      email: string;
      date: string;
    };
    message: string;
  };
  stats?: {
    additions: number;
    deletions: number;
    total: number;
  };
  files?: Array<{
    filename: string;
    status: string;
    additions: number;
    deletions: number;
    changes: number;
    patch?: string;
  }>;
}

export interface SkillAnalysisResult {
  skillId: string;
  skillName: string;
  level: number;
  evidence: string[];
  confidence: number;
  repositoryContributions: number;
}

export interface RetroactiveAnalysisResult {
  userId: string;
  totalRepositories: number;
  totalCommits: number;
  skillsIdentified: SkillAnalysisResult[];
  suggestedBadges: Badge[];
  analysisDate: Date;
}

export interface RepositoryFeedback {
  repositoryId: string;
  repositoryName: string;
  overallAssessment: string;
  strengths: string[];
  improvementAreas: string[];
  skillsIdentified: Array<{
    skill: string;
    level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    evidence: string;
  }>;
  recommendations: string[];
  codeQualityScore: number;
  analysisDate: Date;
}

export interface CommitFeedback {
  commitSha: string;
  commitMessage: string;
  messageQuality: 'excellent' | 'good' | 'fair' | 'poor';
  codeChanges: {
    quality: 'excellent' | 'good' | 'fair' | 'poor';
    complexity: 'low' | 'medium' | 'high';
    bestPractices: boolean;
  };
  suggestions: string[];
  skillsUsed: string[];
  analysisDate: Date;
}

export interface ProjectContribution {
  repositoryName: string;
  contributionType: 'feature' | 'bugfix' | 'refactor' | 'documentation' | 'testing';
  linesChanged: number;
  filesModified: number;
  complexity: 'low' | 'medium' | 'high';
  skillsUsed: string[];
  impact: 'minor' | 'moderate' | 'major';
  collaborators: number;
  timeSpent: number;
}

export interface SkillEvidence {
  skillId: string;
  evidenceType: 'commit' | 'pull_request' | 'issue' | 'repository';
  description: string;
  url: string;
  timestamp: Date;
  confidence: number;
  impact: 'minor' | 'moderate' | 'major';
}

export interface RecognizedSkill {
  skillId: string;
  skillName: string;
  level: number;
  confidence: number;
  evidence: SkillEvidence[];
  projectContributions: ProjectContribution[];
  verificationStatus: 'verified' | 'pending' | 'unverified';
  lastUpdated: Date;
}

export interface SkillBadgeRecommendation {
  badge: Badge;
  skill: RecognizedSkill;
  justification: string;
  requiredEvidence: SkillEvidence[];
  confidenceScore: number;
}

export interface GitHubIntegrationData {
  userId: string;
  githubUsername: string;
  accessToken?: string;
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

// Import Badge type from gamification
import { Badge } from './gamification';