/**
 * @fileOverview Unit tests for ChallengeRepository
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ChallengeRepository } from '../challenge-repository';
import { Challenge, ChallengeSubmission } from '@/types/analytics';

// Mock Firebase
vi.mock('@/lib/firebase/config', () => ({
  db: {
    collection: vi.fn(),
    doc: vi.fn(),
    runTransaction: vi.fn()
  }
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  addDoc: vi.fn(),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  startAfter: vi.fn(),
  Timestamp: {
    now: () => ({ seconds: Date.now() / 1000 }),
    fromDate: (date: Date) => ({ seconds: date.getTime() / 1000 })
  }
}));

const mockChallenge: Challenge = {
  challengeId: 'challenge-123',
  title: 'Array Manipulation Challenge',
  description: 'Implement various array manipulation functions',
  difficulty: 'intermediate',
  skillsTargeted: ['javascript', 'algorithms'],
  timeLimit: 30,
  evaluationCriteria: [
    { criterion: 'Correctness', weight: 0.4, description: 'Solution produces correct output' },
    { criterion: 'Efficiency', weight: 0.3, description: 'Solution is optimally efficient' },
    { criterion: 'Code Quality', weight: 0.3, description: 'Code is clean and readable' }
  ],
  createdBy: 'ai',
  isActive: true,
  prompt: 'Implement a function that sorts an array of numbers',
  testCases: [
    { input: '[3, 1, 4, 1, 5]', expectedOutput: '[1, 1, 3, 4, 5]', isHidden: false },
    { input: '[]', expectedOutput: '[]', isHidden: false },
    { input: '[1]', expectedOutput: '[1]', isHidden: true }
  ],
  hints: ['Consider using built-in sort methods', 'Think about edge cases'],
  tags: ['sorting', 'arrays', 'algorithms'],
  category: 'algorithms',
  estimatedDuration: 25,
  prerequisites: ['Basic JavaScript knowledge'],
  learningObjectives: ['Understand sorting algorithms', 'Practice array manipulation'],
  createdAt: new Date('2024-01-15T10:00:00Z'),
  updatedAt: new Date('2024-01-15T10:00:00Z'),
  participantCount: 150,
  averageScore: 78.5,
  successRate: 0.82
};

const mockSubmission: ChallengeSubmission = {
  submissionId: 'submission-456',
  challengeId: 'challenge-123',
  userId: 'user-789',
  code: 'function sort(arr) { return arr.sort((a, b) => a - b); }',
  language: 'javascript',
  submittedAt: new Date('2024-01-15T11:30:00Z'),
  evaluationResults: [
    { testCase: 0, passed: true, actualOutput: '[1, 1, 3, 4, 5]', executionTime: 5 },
    { testCase: 1, passed: true, actualOutput: '[]', executionTime: 2 },
    { testCase: 2, passed: true, actualOutput: '[1]', executionTime: 3 }
  ],
  totalScore: 95,
  passed: true,
  feedback: ['Excellent solution!', 'Good use of built-in methods'],
  aiAnalysis: {
    analysisId: 'analysis-123',
    codeQuality: 90,
    efficiency: 85,
    creativity: 80,
    bestPractices: 95,
    suggestions: ['Consider adding input validation'],
    detectedSkills: ['JavaScript', 'Array Methods'],
    improvementAreas: ['Error Handling'],
    processingTime: 1200
  }
};

describe('ChallengeRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Challenge CRUD Operations', () => {
    it('should create a new challenge', async () => {
      const mockAddDoc = vi.fn().mockResolvedValue({ id: 'challenge-123' });
      vi.mocked(require('firebase/firestore').addDoc).mockImplementation(mockAddDoc);

      const result = await ChallengeRepository.createChallenge(mockChallenge);

      expect(result.challengeId).toBe('challenge-123');
      expect(mockAddDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          title: mockChallenge.title,
          description: mockChallenge.description,
          difficulty: mockChallenge.difficulty
        })
      );
    });

    it('should get challenge by ID', async () => {
      const mockGetDoc = vi.fn().mockResolvedValue({
        exists: () => true,
        id: 'challenge-123',
        data: () => ({
          ...mockChallenge,
          createdAt: { toDate: () => mockChallenge.createdAt },
          updatedAt: { toDate: () => mockChallenge.updatedAt }
        })
      });
      vi.mocked(require('firebase/firestore').getDoc).mockImplementation(mockGetDoc);

      const result = await ChallengeRepository.getChallengeById('challenge-123');

      expect(result).toBeDefined();
      expect(result!.challengeId).toBe('challenge-123');
      expect(result!.title).toBe(mockChallenge.title);
    });

    it('should return null for non-existent challenge', async () => {
      const mockGetDoc = vi.fn().mockResolvedValue({
        exists: () => false
      });
      vi.mocked(require('firebase/firestore').getDoc).mockImplementation(mockGetDoc);

      const result = await ChallengeRepository.getChallengeById('non-existent');

      expect(result).toBeNull();
    });

    it('should update challenge', async () => {
      const mockUpdateDoc = vi.fn().mockResolvedValue(undefined);
      vi.mocked(require('firebase/firestore').updateDoc).mockImplementation(mockUpdateDoc);

      const updates = { title: 'Updated Challenge Title', difficulty: 'advanced' as const };
      await ChallengeRepository.updateChallenge('challenge-123', updates);

      expect(mockUpdateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          ...updates,
          updatedAt: expect.any(Object)
        })
      );
    });

    it('should delete challenge', async () => {
      const mockDeleteDoc = vi.fn().mockResolvedValue(undefined);
      vi.mocked(require('firebase/firestore').deleteDoc).mockImplementation(mockDeleteDoc);

      await ChallengeRepository.deleteChallenge('challenge-123');

      expect(mockDeleteDoc).toHaveBeenCalledWith(expect.anything());
    });
  });

  describe('Challenge Querying', () => {
    it('should get challenges by difficulty', async () => {
      const mockGetDocs = vi.fn().mockResolvedValue({
        docs: [
          {
            id: 'challenge-123',
            data: () => ({
              ...mockChallenge,
              createdAt: { toDate: () => mockChallenge.createdAt },
              updatedAt: { toDate: () => mockChallenge.updatedAt }
            })
          }
        ]
      });
      vi.mocked(require('firebase/firestore').getDocs).mockImplementation(mockGetDocs);

      const result = await ChallengeRepository.getChallengesByDifficulty('intermediate');

      expect(result).toHaveLength(1);
      expect(result[0].difficulty).toBe('intermediate');
    });

    it('should get challenges by skill', async () => {
      const mockGetDocs = vi.fn().mockResolvedValue({
        docs: [
          {
            id: 'challenge-123',
            data: () => ({
              ...mockChallenge,
              createdAt: { toDate: () => mockChallenge.createdAt },
              updatedAt: { toDate: () => mockChallenge.updatedAt }
            })
          }
        ]
      });
      vi.mocked(require('firebase/firestore').getDocs).mockImplementation(mockGetDocs);

      const result = await ChallengeRepository.getChallengesBySkill('javascript');

      expect(result).toHaveLength(1);
      expect(result[0].skillsTargeted).toContain('javascript');
    });

    it('should get active challenges', async () => {
      const mockGetDocs = vi.fn().mockResolvedValue({
        docs: [
          {
            id: 'challenge-123',
            data: () => ({
              ...mockChallenge,
              createdAt: { toDate: () => mockChallenge.createdAt },
              updatedAt: { toDate: () => mockChallenge.updatedAt }
            })
          }
        ]
      });
      vi.mocked(require('firebase/firestore').getDocs).mockImplementation(mockGetDocs);

      const result = await ChallengeRepository.getActiveChallenges();

      expect(result).toHaveLength(1);
      expect(result[0].isActive).toBe(true);
    });

    it('should get challenges by competition', async () => {
      const competitionChallenge = {
        ...mockChallenge,
        competitionId: 'comp-123'
      };

      const mockGetDocs = vi.fn().mockResolvedValue({
        docs: [
          {
            id: 'challenge-123',
            data: () => ({
              ...competitionChallenge,
              createdAt: { toDate: () => competitionChallenge.createdAt },
              updatedAt: { toDate: () => competitionChallenge.updatedAt }
            })
          }
        ]
      });
      vi.mocked(require('firebase/firestore').getDocs).mockImplementation(mockGetDocs);

      const result = await ChallengeRepository.getChallengesByCompetition('comp-123');

      expect(result).toHaveLength(1);
      expect(result[0].competitionId).toBe('comp-123');
    });

    it('should search challenges by text', async () => {
      const mockGetDocs = vi.fn().mockResolvedValue({
        docs: [
          {
            id: 'challenge-123',
            data: () => ({
              ...mockChallenge,
              createdAt: { toDate: () => mockChallenge.createdAt },
              updatedAt: { toDate: () => mockChallenge.updatedAt }
            })
          }
        ]
      });
      vi.mocked(require('firebase/firestore').getDocs).mockImplementation(mockGetDocs);

      const result = await ChallengeRepository.searchChallenges('array');

      expect(result).toHaveLength(1);
      expect(result[0].title.toLowerCase()).toContain('array');
    });
  });

  describe('Challenge Submissions', () => {
    it('should submit solution to challenge', async () => {
      const mockAddDoc = vi.fn().mockResolvedValue({ id: 'submission-456' });
      vi.mocked(require('firebase/firestore').addDoc).mockImplementation(mockAddDoc);

      const result = await ChallengeRepository.submitSolution(
        'challenge-123',
        'user-789',
        'function sort(arr) { return arr.sort(); }',
        'javascript'
      );

      expect(result.submissionId).toBe('submission-456');
      expect(mockAddDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          challengeId: 'challenge-123',
          userId: 'user-789',
          code: 'function sort(arr) { return arr.sort(); }',
          language: 'javascript'
        })
      );
    });

    it('should get user submissions for challenge', async () => {
      const mockGetDocs = vi.fn().mockResolvedValue({
        docs: [
          {
            id: 'submission-456',
            data: () => ({
              ...mockSubmission,
              submittedAt: { toDate: () => mockSubmission.submittedAt }
            })
          }
        ]
      });
      vi.mocked(require('firebase/firestore').getDocs).mockImplementation(mockGetDocs);

      const result = await ChallengeRepository.getUserSubmissions('user-789', 'challenge-123');

      expect(result).toHaveLength(1);
      expect(result[0].userId).toBe('user-789');
      expect(result[0].challengeId).toBe('challenge-123');
    });

    it('should get all submissions for challenge', async () => {
      const mockGetDocs = vi.fn().mockResolvedValue({
        docs: [
          {
            id: 'submission-456',
            data: () => ({
              ...mockSubmission,
              submittedAt: { toDate: () => mockSubmission.submittedAt }
            })
          }
        ]
      });
      vi.mocked(require('firebase/firestore').getDocs).mockImplementation(mockGetDocs);

      const result = await ChallengeRepository.getChallengeSubmissions('challenge-123');

      expect(result).toHaveLength(1);
      expect(result[0].challengeId).toBe('challenge-123');
    });

    it('should update submission with evaluation results', async () => {
      const mockUpdateDoc = vi.fn().mockResolvedValue(undefined);
      vi.mocked(require('firebase/firestore').updateDoc).mockImplementation(mockUpdateDoc);

      const evaluationResults = [
        { testCase: 0, passed: true, actualOutput: '[1, 1, 3, 4, 5]', executionTime: 5 }
      ];

      await ChallengeRepository.updateSubmissionResults(
        'submission-456',
        evaluationResults,
        85,
        true,
        ['Good solution']
      );

      expect(mockUpdateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          evaluationResults,
          totalScore: 85,
          passed: true,
          feedback: ['Good solution']
        })
      );
    });
  });

  describe('Challenge Statistics', () => {
    it('should get challenge statistics', async () => {
      const mockGetDocs = vi.fn().mockResolvedValue({
        docs: [
          {
            data: () => ({
              totalScore: 85,
              passed: true
            })
          },
          {
            data: () => ({
              totalScore: 92,
              passed: true
            })
          },
          {
            data: () => ({
              totalScore: 45,
              passed: false
            })
          }
        ]
      });
      vi.mocked(require('firebase/firestore').getDocs).mockImplementation(mockGetDocs);

      const stats = await ChallengeRepository.getChallengeStatistics('challenge-123');

      expect(stats.totalSubmissions).toBe(3);
      expect(stats.successfulSubmissions).toBe(2);
      expect(stats.successRate).toBeCloseTo(0.67, 2);
      expect(stats.averageScore).toBeCloseTo(74, 0);
    });

    it('should increment participant count', async () => {
      const mockUpdateDoc = vi.fn().mockResolvedValue(undefined);
      vi.mocked(require('firebase/firestore').updateDoc).mockImplementation(mockUpdateDoc);

      await ChallengeRepository.incrementParticipantCount('challenge-123');

      expect(mockUpdateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          participantCount: expect.any(Number)
        })
      );
    });

    it('should update challenge metrics', async () => {
      const mockUpdateDoc = vi.fn().mockResolvedValue(undefined);
      vi.mocked(require('firebase/firestore').updateDoc).mockImplementation(mockUpdateDoc);

      await ChallengeRepository.updateChallengeMetrics('challenge-123', 80.5, 0.85);

      expect(mockUpdateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          averageScore: 80.5,
          successRate: 0.85
        })
      );
    });
  });

  describe('Pagination and Filtering', () => {
    it('should support pagination', async () => {
      const mockGetDocs = vi.fn().mockResolvedValue({
        docs: [
          {
            id: 'challenge-123',
            data: () => ({
              ...mockChallenge,
              createdAt: { toDate: () => mockChallenge.createdAt },
              updatedAt: { toDate: () => mockChallenge.updatedAt }
            })
          }
        ]
      });
      vi.mocked(require('firebase/firestore').getDocs).mockImplementation(mockGetDocs);

      const result = await ChallengeRepository.getChallenges({
        limit: 10,
        offset: 0
      });

      expect(result.challenges).toHaveLength(1);
      expect(result.hasMore).toBe(false);
      expect(result.total).toBe(1);
    });

    it('should filter by multiple criteria', async () => {
      const mockGetDocs = vi.fn().mockResolvedValue({
        docs: [
          {
            id: 'challenge-123',
            data: () => ({
              ...mockChallenge,
              createdAt: { toDate: () => mockChallenge.createdAt },
              updatedAt: { toDate: () => mockChallenge.updatedAt }
            })
          }
        ]
      });
      vi.mocked(require('firebase/firestore').getDocs).mockImplementation(mockGetDocs);

      const result = await ChallengeRepository.getChallenges({
        difficulty: 'intermediate',
        skills: ['javascript'],
        category: 'algorithms',
        isActive: true
      });

      expect(result.challenges).toHaveLength(1);
      expect(result.challenges[0].difficulty).toBe('intermediate');
      expect(result.challenges[0].skillsTargeted).toContain('javascript');
    });

    it('should sort challenges by different criteria', async () => {
      const mockGetDocs = vi.fn().mockResolvedValue({
        docs: [
          {
            id: 'challenge-123',
            data: () => ({
              ...mockChallenge,
              createdAt: { toDate: () => mockChallenge.createdAt },
              updatedAt: { toDate: () => mockChallenge.updatedAt }
            })
          }
        ]
      });
      vi.mocked(require('firebase/firestore').getDocs).mockImplementation(mockGetDocs);

      const result = await ChallengeRepository.getChallenges({
        sortBy: 'participantCount',
        sortOrder: 'desc'
      });

      expect(result.challenges).toHaveLength(1);
    });
  });

  describe('Error Handling', () => {
    it('should handle Firebase errors gracefully', async () => {
      const mockGetDoc = vi.fn().mockRejectedValue(new Error('Firebase connection failed'));
      vi.mocked(require('firebase/firestore').getDoc).mockImplementation(mockGetDoc);

      await expect(ChallengeRepository.getChallengeById('challenge-123')).rejects.toThrow(
        'Firebase connection failed'
      );
    });

    it('should validate challenge data before creation', async () => {
      const invalidChallenge = {
        ...mockChallenge,
        title: '', // Invalid empty title
        difficulty: 'invalid' as any
      };

      await expect(ChallengeRepository.createChallenge(invalidChallenge)).rejects.toThrow();
    });

    it('should handle concurrent submission updates', async () => {
      const mockRunTransaction = vi.fn().mockResolvedValue(undefined);
      vi.mocked(require('@/lib/firebase/config').db.runTransaction).mockImplementation(mockRunTransaction);

      await ChallengeRepository.updateSubmissionResults(
        'submission-456',
        [],
        85,
        true,
        []
      );

      expect(mockRunTransaction).toHaveBeenCalled();
    });
  });
});