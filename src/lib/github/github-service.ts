import { Octokit } from '@octokit/rest';
import { SkillLevel, AnalyticsData } from '@/types/analytics';
import { Badge } from '@/types/gamification';

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

export class GitHubService {
  private octokit: Octokit;

  constructor(accessToken?: string) {
    this.octokit = new Octokit({
      auth: accessToken,
    });
  }

  /**
   * Analyze user's GitHub repositories for skill identification
   */
  async analyzeUserRepositories(username: string): Promise<RetroactiveAnalysisResult> {
    try {
      const repositories = await this.getUserRepositories(username);
      const commits = await this.getRepositoryCommits(repositories);
      const skillsAnalysis = await this.analyzeCommitsForSkills(commits);
      
      return {
        userId: username,
        totalRepositories: repositories.length,
        totalCommits: commits.length,
        skillsIdentified: skillsAnalysis,
        suggestedBadges: this.generateSuggestedBadges(skillsAnalysis),
        analysisDate: new Date(),
      };
    } catch (error) {
      console.error('Error analyzing GitHub repositories:', error);
      throw new Error('Failed to analyze GitHub repositories');
    }
  }

  /**
   * Get user's public repositories
   */
  private async getUserRepositories(username: string): Promise<GitHubRepository[]> {
    const { data } = await this.octokit.repos.listForUser({
      username,
      type: 'owner',
      sort: 'updated',
      per_page: 100,
    });

    return data.map(repo => ({
      id: repo.id,
      name: repo.name,
      full_name: repo.full_name,
      description: repo.description,
      language: repo.language,
      stargazers_count: repo.stargazers_count,
      forks_count: repo.forks_count,
      created_at: repo.created_at,
      updated_at: repo.updated_at,
      size: repo.size,
    }));
  }

  /**
   * Get commits from repositories with detailed information
   */
  private async getRepositoryCommits(repositories: GitHubRepository[]): Promise<GitHubCommit[]> {
    const allCommits: GitHubCommit[] = [];
    
    for (const repo of repositories.slice(0, 10)) { // Limit to 10 repos for performance
      try {
        const { data: commits } = await this.octokit.repos.listCommits({
          owner: repo.full_name.split('/')[0],
          repo: repo.name,
          per_page: 50, // Limit commits per repo
        });

        // Get detailed commit information
        for (const commit of commits.slice(0, 20)) { // Limit to 20 commits per repo
          try {
            const { data: detailedCommit } = await this.octokit.repos.getCommit({
              owner: repo.full_name.split('/')[0],
              repo: repo.name,
              ref: commit.sha,
            });

            allCommits.push({
              sha: detailedCommit.sha,
              commit: detailedCommit.commit,
              stats: detailedCommit.stats,
              files: detailedCommit.files,
            });
          } catch (error) {
            console.warn(`Failed to get detailed commit ${commit.sha}:`, error);
          }
        }
      } catch (error) {
        console.warn(`Failed to get commits for repository ${repo.name}:`, error);
      }
    }

    return allCommits;
  }

  /**
   * Analyze commits to identify programming skills
   */
  private async analyzeCommitsForSkills(commits: GitHubCommit[]): Promise<SkillAnalysisResult[]> {
    const skillMap = new Map<string, SkillAnalysisResult>();

    for (const commit of commits) {
      if (!commit.files) continue;

      for (const file of commit.files) {
        const skills = this.identifySkillsFromFile(file);
        
        for (const skill of skills) {
          if (skillMap.has(skill.skillId)) {
            const existing = skillMap.get(skill.skillId)!;
            existing.repositoryContributions += 1;
            existing.evidence.push(`Modified ${file.filename} in commit ${commit.sha.substring(0, 7)}`);
            existing.confidence = Math.min(existing.confidence + 0.1, 1.0);
          } else {
            skillMap.set(skill.skillId, {
              ...skill,
              repositoryContributions: 1,
              evidence: [`Modified ${file.filename} in commit ${commit.sha.substring(0, 7)}`],
            });
          }
        }
      }
    }

    return Array.from(skillMap.values()).sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Identify skills based on file changes
   */
  private identifySkillsFromFile(file: any): SkillAnalysisResult[] {
    const skills: SkillAnalysisResult[] = [];
    const filename = file.filename.toLowerCase();
    const patch = file.patch || '';

    // Language-based skills
    if (filename.endsWith('.ts') || filename.endsWith('.tsx')) {
      skills.push({
        skillId: 'typescript',
        skillName: 'TypeScript',
        level: this.calculateSkillLevel(file.changes, patch),
        evidence: [],
        confidence: 0.8,
        repositoryContributions: 0,
      });
    }

    if (filename.endsWith('.js') || filename.endsWith('.jsx')) {
      skills.push({
        skillId: 'javascript',
        skillName: 'JavaScript',
        level: this.calculateSkillLevel(file.changes, patch),
        evidence: [],
        confidence: 0.8,
        repositoryContributions: 0,
      });
    }

    if (filename.endsWith('.py')) {
      skills.push({
        skillId: 'python',
        skillName: 'Python',
        level: this.calculateSkillLevel(file.changes, patch),
        evidence: [],
        confidence: 0.8,
        repositoryContributions: 0,
      });
    }

    // Framework-based skills
    if (filename.includes('react') || patch.includes('import React')) {
      skills.push({
        skillId: 'react',
        skillName: 'React',
        level: this.calculateSkillLevel(file.changes, patch),
        evidence: [],
        confidence: 0.7,
        repositoryContributions: 0,
      });
    }

    if (filename.includes('next') || patch.includes('next/')) {
      skills.push({
        skillId: 'nextjs',
        skillName: 'Next.js',
        level: this.calculateSkillLevel(file.changes, patch),
        evidence: [],
        confidence: 0.7,
        repositoryContributions: 0,
      });
    }

    // Database skills
    if (filename.includes('sql') || patch.includes('SELECT') || patch.includes('INSERT')) {
      skills.push({
        skillId: 'sql',
        skillName: 'SQL',
        level: this.calculateSkillLevel(file.changes, patch),
        evidence: [],
        confidence: 0.6,
        repositoryContributions: 0,
      });
    }

    return skills;
  }

  /**
   * Calculate skill level based on code changes and complexity
   */
  private calculateSkillLevel(changes: number, patch: string): number {
    let level = 1;

    // Base level on amount of changes
    if (changes > 100) level = 3;
    else if (changes > 50) level = 2;

    // Increase level based on complexity indicators
    const complexityIndicators = [
      'class ', 'interface ', 'async ', 'await ', 'Promise',
      'try ', 'catch ', 'throw ', 'extends ', 'implements ',
      'generic', 'type ', 'enum ', 'namespace '
    ];

    const complexityScore = complexityIndicators.reduce((score, indicator) => {
      return score + (patch.includes(indicator) ? 1 : 0);
    }, 0);

    level = Math.min(level + Math.floor(complexityScore / 3), 5);

    return level;
  }

  /**
   * Generate suggested badges based on skill analysis
   */
  private generateSuggestedBadges(skills: SkillAnalysisResult[]): Badge[] {
    const badges: Badge[] = [];

    for (const skill of skills) {
      if (skill.confidence > 0.7 && skill.repositoryContributions > 5) {
        badges.push({
          id: `github-${skill.skillId}`,
          name: `${skill.skillName} Contributor`,
          description: `Demonstrated ${skill.skillName} skills through GitHub contributions`,
          iconUrl: `/badges/${skill.skillId}.svg`,
          rarity: skill.level >= 4 ? 'legendary' : skill.level >= 3 ? 'epic' : 'rare',
          skillCategory: skill.skillId,
          requirements: [`${skill.repositoryContributions} repository contributions in ${skill.skillName}`],
          issuedAt: new Date(),
          blockchainTxHash: '', // Will be filled when minted
          verificationUrl: '', // Will be filled when minted
        });
      }
    }

    return badges;
  }

  /**
   * Get repository analysis for AI feedback integration
   */
  async getRepositoryForAnalysis(owner: string, repo: string): Promise<{
    repository: GitHubRepository;
    recentCommits: GitHubCommit[];
    codeFiles: Array<{ filename: string; content: string }>;
  }> {
    try {
      // Get repository information
      const { data: repoData } = await this.octokit.repos.get({ owner, repo });
      
      // Get recent commits
      const { data: commits } = await this.octokit.repos.listCommits({
        owner,
        repo,
        per_page: 10,
      });

      // Get code files from the repository
      const { data: contents } = await this.octokit.repos.getContent({
        owner,
        repo,
        path: '',
      });

      const codeFiles: Array<{ filename: string; content: string }> = [];
      
      if (Array.isArray(contents)) {
        for (const item of contents.slice(0, 5)) { // Limit to 5 files
          if (item.type === 'file' && this.isCodeFile(item.name)) {
            try {
              const { data: fileData } = await this.octokit.repos.getContent({
                owner,
                repo,
                path: item.path,
              });

              if ('content' in fileData && fileData.content) {
                const content = Buffer.from(fileData.content, 'base64').toString('utf-8');
                codeFiles.push({
                  filename: item.name,
                  content: content.substring(0, 2000), // Limit content size
                });
              }
            } catch (error) {
              console.warn(`Failed to get content for ${item.name}:`, error);
            }
          }
        }
      }

      return {
        repository: {
          id: repoData.id,
          name: repoData.name,
          full_name: repoData.full_name,
          description: repoData.description,
          language: repoData.language,
          stargazers_count: repoData.stargazers_count,
          forks_count: repoData.forks_count,
          created_at: repoData.created_at,
          updated_at: repoData.updated_at,
          size: repoData.size,
        },
        recentCommits: commits.map(commit => ({
          sha: commit.sha,
          commit: commit.commit,
        })),
        codeFiles,
      };
    } catch (error) {
      console.error('Error getting repository for analysis:', error);
      throw new Error('Failed to get repository data');
    }
  }

  /**
   * Check if a file is a code file that should be analyzed
   */
  private isCodeFile(filename: string): boolean {
    const codeExtensions = [
      '.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.cpp', '.c',
      '.cs', '.php', '.rb', '.go', '.rs', '.swift', '.kt', '.scala'
    ];
    
    return codeExtensions.some(ext => filename.toLowerCase().endsWith(ext));
  }
}