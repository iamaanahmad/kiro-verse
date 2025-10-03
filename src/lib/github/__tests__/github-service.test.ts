import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GitHubService } from '../github-service';

// Mock Octokit
vi.mock('@octokit/rest', () => ({
  Octokit: vi.fn().mockImplementation(() => ({
    repos: {
      listForUser: vi.fn(),
      listCommits: vi.fn(),
      getCommit: vi.fn(),
      get: vi.fn(),
      getContent: vi.fn(),
    },
  })),
}));

describe('GitHubService', () => {
  let githubService: GitHubService;
  let mockOctokit: any;

  beforeEach(() => {
    githubService = new GitHubService('test-token');
    mockOctokit = (githubService as any).octokit;
  });

  describe('analyzeUserRepositories', () => {
    it('should analyze user repositories and return skill analysis', async () => {
      // Mock repository data
      const mockRepos = [
        {
          id: 1,
          name: 'test-repo',
          full_name: 'user/test-repo',
          description: 'A test repository',
          language: 'TypeScript',
          stargazers_count: 10,
          forks_count: 2,
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-12-01T00:00:00Z',
          size: 1000,
        },
      ];

      const mockCommits = [
        {
          sha: 'abc123',
          commit: {
            author: {
              name: 'Test User',
              email: 'test@example.com',
              date: '2023-06-01T00:00:00Z',
            },
            message: 'Add TypeScript components',
          },
        },
      ];

      const mockDetailedCommit = {
        sha: 'abc123',
        commit: mockCommits[0].commit,
        stats: {
          additions: 100,
          deletions: 10,
          total: 110,
        },
        files: [
          {
            filename: 'src/component.tsx',
            status: 'added',
            additions: 50,
            deletions: 0,
            changes: 50,
            patch: 'import React from "react";\n\nconst Component = () => {\n  return <div>Hello</div>;\n};',
          },
        ],
      };

      mockOctokit.repos.listForUser.mockResolvedValue({ data: mockRepos });
      mockOctokit.repos.listCommits.mockResolvedValue({ data: mockCommits });
      mockOctokit.repos.getCommit.mockResolvedValue({ data: mockDetailedCommit });

      const result = await githubService.analyzeUserRepositories('testuser');

      expect(result).toMatchObject({
        userId: 'testuser',
        totalRepositories: 1,
        totalCommits: 1,
        skillsIdentified: expect.arrayContaining([
          expect.objectContaining({
            skillId: 'typescript',
            skillName: 'TypeScript',
            level: expect.any(Number),
            confidence: expect.any(Number),
          }),
        ]),
        suggestedBadges: expect.any(Array),
        analysisDate: expect.any(Date),
      });

      expect(mockOctokit.repos.listForUser).toHaveBeenCalledWith({
        username: 'testuser',
        type: 'owner',
        sort: 'updated',
        per_page: 100,
      });
    });

    it('should handle API errors gracefully', async () => {
      mockOctokit.repos.listForUser.mockRejectedValue(new Error('API Error'));

      await expect(githubService.analyzeUserRepositories('testuser')).rejects.toThrow(
        'Failed to analyze GitHub repositories'
      );
    });
  });

  describe('getRepositoryForAnalysis', () => {
    it('should get repository data for AI analysis', async () => {
      const mockRepo = {
        id: 1,
        name: 'test-repo',
        full_name: 'user/test-repo',
        description: 'A test repository',
        language: 'TypeScript',
        stargazers_count: 10,
        forks_count: 2,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-12-01T00:00:00Z',
        size: 1000,
      };

      const mockCommits = [
        {
          sha: 'abc123',
          commit: {
            author: {
              name: 'Test User',
              email: 'test@example.com',
              date: '2023-06-01T00:00:00Z',
            },
            message: 'Add TypeScript components',
          },
        },
      ];

      const mockContents = [
        {
          name: 'component.tsx',
          path: 'src/component.tsx',
          type: 'file',
        },
      ];

      const mockFileContent = {
        content: Buffer.from('import React from "react";').toString('base64'),
      };

      mockOctokit.repos.get.mockResolvedValue({ data: mockRepo });
      mockOctokit.repos.listCommits.mockResolvedValue({ data: mockCommits });
      mockOctokit.repos.getContent
        .mockResolvedValueOnce({ data: mockContents })
        .mockResolvedValueOnce({ data: mockFileContent });

      const result = await githubService.getRepositoryForAnalysis('user', 'test-repo');

      expect(result).toMatchObject({
        repository: expect.objectContaining({
          name: 'test-repo',
          language: 'TypeScript',
        }),
        recentCommits: expect.arrayContaining([
          expect.objectContaining({
            sha: 'abc123',
          }),
        ]),
        codeFiles: expect.arrayContaining([
          expect.objectContaining({
            filename: 'component.tsx',
            content: expect.any(String),
          }),
        ]),
      });
    });
  });

  describe('skill identification', () => {
    it('should identify TypeScript skills from .ts/.tsx files', () => {
      const mockFile = {
        filename: 'component.tsx',
        changes: 100,
        patch: 'import React from "react";\ninterface Props {\n  name: string;\n}',
      };

      const skills = (githubService as any).identifySkillsFromFile(mockFile);

      expect(skills).toContainEqual(
        expect.objectContaining({
          skillId: 'typescript',
          skillName: 'TypeScript',
        })
      );

      expect(skills).toContainEqual(
        expect.objectContaining({
          skillId: 'react',
          skillName: 'React',
        })
      );
    });

    it('should identify Python skills from .py files', () => {
      const mockFile = {
        filename: 'script.py',
        changes: 50,
        patch: 'def hello_world():\n    print("Hello, World!")',
      };

      const skills = (githubService as any).identifySkillsFromFile(mockFile);

      expect(skills).toContainEqual(
        expect.objectContaining({
          skillId: 'python',
          skillName: 'Python',
        })
      );
    });

    it('should calculate skill level based on code complexity', () => {
      const complexPatch = 'class MyClass implements Interface {\n  async method(): Promise<void> {\n    try {\n      await someAsyncOperation();\n    } catch (error) {\n      throw new CustomError();\n    }\n  }\n}';
      
      const level = (githubService as any).calculateSkillLevel(200, complexPatch);
      
      expect(level).toBeGreaterThan(2);
    });
  });
});