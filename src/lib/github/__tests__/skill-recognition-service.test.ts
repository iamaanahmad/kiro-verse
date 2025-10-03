import { describe, it, expect, beforeEach } from 'vitest';
import { SkillRecognitionService } from '../skill-recognition-service';
import { RetroactiveAnalysisResult } from '../github-service';

describe('SkillRecognitionService', () => {
  let skillRecognitionService: SkillRecognitionService;

  beforeEach(() => {
    skillRecognitionService = new SkillRecognitionService();
  });

  describe('recognizeSkillsFromAnalysis', () => {
    it('should recognize skills from GitHub analysis results', () => {
      const mockAnalysisResult: RetroactiveAnalysisResult = {
        userId: 'testuser',
        totalRepositories: 5,
        totalCommits: 50,
        skillsIdentified: [
          {
            skillId: 'typescript',
            skillName: 'TypeScript',
            level: 3,
            evidence: [
              'Modified src/component.tsx in commit abc123',
              'Modified lib/utils.ts in commit def456',
            ],
            confidence: 0.85,
            repositoryContributions: 8,
          },
          {
            skillId: 'react',
            skillName: 'React',
            level: 4,
            evidence: [
              'Modified components/App.tsx in commit ghi789',
            ],
            confidence: 0.9,
            repositoryContributions: 12,
          },
        ],
        suggestedBadges: [],
        analysisDate: new Date(),
      };

      const recognizedSkills = skillRecognitionService.recognizeSkillsFromAnalysis(mockAnalysisResult);

      expect(recognizedSkills).toHaveLength(2);
      
      const typescriptSkill = recognizedSkills.find(s => s.skillId === 'typescript');
      expect(typescriptSkill).toMatchObject({
        skillId: 'typescript',
        skillName: 'TypeScript',
        level: 3,
        confidence: 0.85,
        verificationStatus: 'pending',
        evidence: expect.arrayContaining([
          expect.objectContaining({
            skillId: 'typescript',
            evidenceType: 'commit',
            description: 'Modified src/component.tsx in commit abc123',
          }),
        ]),
        projectContributions: expect.any(Array),
      });

      const reactSkill = recognizedSkills.find(s => s.skillId === 'react');
      expect(reactSkill).toMatchObject({
        skillId: 'react',
        skillName: 'React',
        level: 4,
        confidence: 0.9,
        verificationStatus: 'verified',
      });
    });

    it('should sort skills by confidence score', () => {
      const mockAnalysisResult: RetroactiveAnalysisResult = {
        userId: 'testuser',
        totalRepositories: 3,
        totalCommits: 30,
        skillsIdentified: [
          {
            skillId: 'javascript',
            skillName: 'JavaScript',
            level: 2,
            evidence: ['Modified script.js in commit xyz789'],
            confidence: 0.6,
            repositoryContributions: 3,
          },
          {
            skillId: 'typescript',
            skillName: 'TypeScript',
            level: 3,
            evidence: ['Modified component.tsx in commit abc123'],
            confidence: 0.9,
            repositoryContributions: 8,
          },
        ],
        suggestedBadges: [],
        analysisDate: new Date(),
      };

      const recognizedSkills = skillRecognitionService.recognizeSkillsFromAnalysis(mockAnalysisResult);

      expect(recognizedSkills[0].skillId).toBe('typescript');
      expect(recognizedSkills[1].skillId).toBe('javascript');
    });
  });

  describe('generateBadgeRecommendations', () => {
    it('should generate badge recommendations for verified skills', () => {
      const mockSkills = [
        {
          skillId: 'typescript',
          skillName: 'TypeScript',
          level: 4,
          confidence: 0.9,
          evidence: [
            {
              skillId: 'typescript',
              evidenceType: 'commit' as const,
              description: 'Modified component.tsx',
              url: 'https://github.com/commit/abc123',
              timestamp: new Date(),
              confidence: 0.8,
              impact: 'moderate' as const,
            },
          ],
          projectContributions: [
            {
              repositoryName: 'project-1',
              contributionType: 'feature' as const,
              linesChanged: 150,
              filesModified: 3,
              complexity: 'high' as const,
              skillsUsed: ['typescript'],
              impact: 'major' as const,
              collaborators: 2,
              timeSpent: 8,
            },
          ],
          verificationStatus: 'verified' as const,
          lastUpdated: new Date(),
        },
      ];

      const recommendations = skillRecognitionService.generateBadgeRecommendations(mockSkills);

      expect(recommendations).toHaveLength(1);
      expect(recommendations[0]).toMatchObject({
        badge: expect.objectContaining({
          name: 'TypeScript Practitioner',
          skillCategory: 'typescript',
          rarity: 'epic',
        }),
        skill: mockSkills[0],
        justification: expect.stringContaining('Level 4 proficiency'),
        confidenceScore: 0.9,
      });
    });

    it('should not recommend badges for unverified skills with low confidence', () => {
      const mockSkills = [
        {
          skillId: 'python',
          skillName: 'Python',
          level: 1,
          confidence: 0.5,
          evidence: [],
          projectContributions: [],
          verificationStatus: 'unverified' as const,
          lastUpdated: new Date(),
        },
      ];

      const recommendations = skillRecognitionService.generateBadgeRecommendations(mockSkills);

      expect(recommendations).toHaveLength(0);
    });
  });

  describe('validateSkillRecognition', () => {
    it('should validate skill recognition with sufficient evidence', () => {
      const mockSkill = {
        skillId: 'react',
        skillName: 'React',
        level: 3,
        confidence: 0.8,
        evidence: [
          {
            skillId: 'react',
            evidenceType: 'commit' as const,
            description: 'Modified App.tsx',
            url: 'https://github.com/commit/abc123',
            timestamp: new Date(),
            confidence: 0.8,
            impact: 'moderate' as const,
          },
          {
            skillId: 'react',
            evidenceType: 'commit' as const,
            description: 'Added components',
            url: 'https://github.com/commit/def456',
            timestamp: new Date(),
            confidence: 0.7,
            impact: 'major' as const,
          },
          {
            skillId: 'react',
            evidenceType: 'repository' as const,
            description: 'React project',
            url: 'https://github.com/user/react-app',
            timestamp: new Date(),
            confidence: 0.9,
            impact: 'major' as const,
          },
        ],
        projectContributions: [
          {
            repositoryName: 'react-app',
            contributionType: 'feature' as const,
            linesChanged: 200,
            filesModified: 5,
            complexity: 'high' as const,
            skillsUsed: ['react'],
            impact: 'major' as const,
            collaborators: 3,
            timeSpent: 12,
          },
          {
            repositoryName: 'another-app',
            contributionType: 'bugfix' as const,
            linesChanged: 50,
            filesModified: 2,
            complexity: 'medium' as const,
            skillsUsed: ['react'],
            impact: 'moderate' as const,
            collaborators: 1,
            timeSpent: 4,
          },
        ],
        verificationStatus: 'verified' as const,
        lastUpdated: new Date(),
      };

      const validation = skillRecognitionService.validateSkillRecognition(mockSkill);

      expect(validation.isValid).toBe(true);
      expect(validation.issues).toHaveLength(0);
      expect(validation.recommendations).toHaveLength(0);
    });

    it('should identify issues with insufficient evidence', () => {
      const mockSkill = {
        skillId: 'python',
        skillName: 'Python',
        level: 3,
        confidence: 0.5,
        evidence: [
          {
            skillId: 'python',
            evidenceType: 'commit' as const,
            description: 'Modified script.py',
            url: 'https://github.com/commit/abc123',
            timestamp: new Date(),
            confidence: 0.5,
            impact: 'minor' as const,
          },
        ],
        projectContributions: [
          {
            repositoryName: 'single-project',
            contributionType: 'feature' as const,
            linesChanged: 30,
            filesModified: 1,
            complexity: 'low' as const,
            skillsUsed: ['python'],
            impact: 'minor' as const,
            collaborators: 1,
            timeSpent: 2,
          },
        ],
        verificationStatus: 'unverified' as const,
        lastUpdated: new Date(),
      };

      const validation = skillRecognitionService.validateSkillRecognition(mockSkill);

      expect(validation.isValid).toBe(false);
      expect(validation.issues).toContain('Insufficient evidence for skill verification');
      expect(validation.issues).toContain('Confidence score below minimum threshold');
      expect(validation.issues).toContain('Skills demonstrated in limited project contexts');
      expect(validation.recommendations).toContain('Provide more code examples demonstrating this skill');
    });
  });
});