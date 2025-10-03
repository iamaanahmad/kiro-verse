import { genkit } from 'genkit';
import { gemini20FlashExp } from '@genkit-ai/googleai';
import { z } from 'zod';
import { GitHubService, GitHubRepository, GitHubCommit } from './github-service';

const RepositoryFeedbackSchema = z.object({
  overallAssessment: z.string().describe('Overall assessment of the repository code quality and structure'),
  strengths: z.array(z.string()).describe('Key strengths identified in the codebase'),
  improvementAreas: z.array(z.string()).describe('Areas that could be improved'),
  skillsIdentified: z.array(z.object({
    skill: z.string(),
    level: z.enum(['beginner', 'intermediate', 'advanced', 'expert']),
    evidence: z.string(),
  })).describe('Programming skills demonstrated in the repository'),
  recommendations: z.array(z.string()).describe('Specific recommendations for improvement'),
  codeQualityScore: z.number().min(1).max(10).describe('Overall code quality score from 1-10'),
});

const CommitFeedbackSchema = z.object({
  commitMessage: z.string().describe('The commit message being analyzed'),
  messageQuality: z.enum(['excellent', 'good', 'fair', 'poor']).describe('Quality of the commit message'),
  codeChanges: z.object({
    quality: z.enum(['excellent', 'good', 'fair', 'poor']),
    complexity: z.enum(['low', 'medium', 'high']),
    bestPractices: z.boolean().describe('Whether the changes follow best practices'),
  }).describe('Analysis of the code changes in the commit'),
  suggestions: z.array(z.string()).describe('Suggestions for improving the commit or code'),
  skillsUsed: z.array(z.string()).describe('Programming skills demonstrated in this commit'),
});

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

export class GitHubAIFeedbackService {
  private githubService: GitHubService;

  constructor(githubAccessToken?: string) {
    this.githubService = new GitHubService(githubAccessToken);
  }

  /**
   * Generate AI feedback for a GitHub repository
   */
  async generateRepositoryFeedback(owner: string, repo: string): Promise<RepositoryFeedback> {
    try {
      const repositoryData = await this.githubService.getRepositoryForAnalysis(owner, repo);
      
      const analyzeRepository = genkit({
        name: 'analyzeGitHubRepository',
        model: gemini20FlashExp,
        inputSchema: z.object({
          repository: z.object({
            name: z.string(),
            description: z.string().nullable(),
            language: z.string().nullable(),
          }),
          codeFiles: z.array(z.object({
            filename: z.string(),
            content: z.string(),
          })),
          recentCommits: z.array(z.object({
            message: z.string(),
            sha: z.string(),
          })),
        }),
        outputSchema: RepositoryFeedbackSchema,
      });

      const result = await analyzeRepository({
        repository: {
          name: repositoryData.repository.name,
          description: repositoryData.repository.description,
          language: repositoryData.repository.language,
        },
        codeFiles: repositoryData.codeFiles,
        recentCommits: repositoryData.recentCommits.map(commit => ({
          message: commit.commit.message,
          sha: commit.sha,
        })),
      });

      return {
        repositoryId: repositoryData.repository.id.toString(),
        repositoryName: repositoryData.repository.name,
        overallAssessment: result.overallAssessment,
        strengths: result.strengths,
        improvementAreas: result.improvementAreas,
        skillsIdentified: result.skillsIdentified,
        recommendations: result.recommendations,
        codeQualityScore: result.codeQualityScore,
        analysisDate: new Date(),
      };
    } catch (error) {
      console.error('Error generating repository feedback:', error);
      throw new Error('Failed to generate AI feedback for repository');
    }
  }

  /**
   * Generate AI feedback for specific commits
   */
  async generateCommitFeedback(owner: string, repo: string, commitSha: string): Promise<CommitFeedback> {
    try {
      const { data: commit } = await this.githubService['octokit'].repos.getCommit({
        owner,
        repo,
        ref: commitSha,
      });

      const analyzeCommit = genkit({
        name: 'analyzeGitHubCommit',
        model: gemini20FlashExp,
        inputSchema: z.object({
          commitMessage: z.string(),
          files: z.array(z.object({
            filename: z.string(),
            status: z.string(),
            additions: z.number(),
            deletions: z.number(),
            patch: z.string().optional(),
          })),
          stats: z.object({
            additions: z.number(),
            deletions: z.number(),
            total: z.number(),
          }).optional(),
        }),
        outputSchema: CommitFeedbackSchema,
      });

      const result = await analyzeCommit({
        commitMessage: commit.commit.message,
        files: (commit.files || []).map(file => ({
          filename: file.filename,
          status: file.status,
          additions: file.additions,
          deletions: file.deletions,
          patch: file.patch?.substring(0, 1000) || '', // Limit patch size
        })),
        stats: commit.stats ? {
          additions: commit.stats.additions,
          deletions: commit.stats.deletions,
          total: commit.stats.total,
        } : undefined,
      });

      return {
        commitSha: commit.sha,
        commitMessage: result.commitMessage,
        messageQuality: result.messageQuality,
        codeChanges: result.codeChanges,
        suggestions: result.suggestions,
        skillsUsed: result.skillsUsed,
        analysisDate: new Date(),
      };
    } catch (error) {
      console.error('Error generating commit feedback:', error);
      throw new Error('Failed to generate AI feedback for commit');
    }
  }

  /**
   * Generate batch feedback for multiple repositories
   */
  async generateBatchRepositoryFeedback(repositories: Array<{ owner: string; repo: string }>): Promise<RepositoryFeedback[]> {
    const feedbacks: RepositoryFeedback[] = [];
    
    for (const { owner, repo } of repositories) {
      try {
        const feedback = await this.generateRepositoryFeedback(owner, repo);
        feedbacks.push(feedback);
        
        // Add delay to respect API rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Failed to analyze repository ${owner}/${repo}:`, error);
      }
    }

    return feedbacks;
  }

  /**
   * Generate learning insights from repository analysis
   */
  async generateLearningInsights(repositoryFeedback: RepositoryFeedback[]): Promise<{
    overallProgress: string;
    skillGaps: string[];
    recommendedLearningPath: string[];
    nextSteps: string[];
  }> {
    try {
      const generateInsights = genkit({
        name: 'generateGitHubLearningInsights',
        model: gemini20FlashExp,
        inputSchema: z.object({
          repositories: z.array(z.object({
            name: z.string(),
            codeQualityScore: z.number(),
            skillsIdentified: z.array(z.object({
              skill: z.string(),
              level: z.string(),
              evidence: z.string(),
            })),
            improvementAreas: z.array(z.string()),
          })),
        }),
        outputSchema: z.object({
          overallProgress: z.string().describe('Overall assessment of the developer\'s progress'),
          skillGaps: z.array(z.string()).describe('Identified skill gaps that need attention'),
          recommendedLearningPath: z.array(z.string()).describe('Recommended learning path to improve skills'),
          nextSteps: z.array(z.string()).describe('Specific next steps the developer should take'),
        }),
      });

      const result = await generateInsights({
        repositories: repositoryFeedback.map(feedback => ({
          name: feedback.repositoryName,
          codeQualityScore: feedback.codeQualityScore,
          skillsIdentified: feedback.skillsIdentified,
          improvementAreas: feedback.improvementAreas,
        })),
      });

      return result;
    } catch (error) {
      console.error('Error generating learning insights:', error);
      throw new Error('Failed to generate learning insights');
    }
  }
}