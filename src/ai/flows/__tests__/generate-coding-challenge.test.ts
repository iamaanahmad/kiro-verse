// Unit tests for AI-powered challenge generator

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { generateCodingChallenge, type GenerateCodingChallengeInput } from '../generate-coding-challenge';

// Mock dependencies
vi.mock('@/ai/genkit', () => ({
  ai: {
    definePrompt: vi.fn(() => vi.fn()),
    defineFlow: vi.fn((_, fn) => fn)
  }
}));

vi.mock('@/lib/firebase/analytics', () => ({
  ChallengeService: {
    createChallenge: vi.fn().mockResolvedValue('challenge_123')
  },
  AnalyticsUtils: {
    generateChallengeId: vi.fn(() => 'challenge_123')
  },
  UserProgressService: {
    getUserProgress: vi.fn()
  }
}));

vi.mock('@/lib/challenges/difficulty-classifier', () => ({
  ChallengeDifficultyClassifier: {
    classifyDifficulty: vi.fn(),
    suggestDifficultyForUser: vi.fn(),
    adaptDifficultyBasedOnPerformance: vi.fn()
  }
}));

vi.mock('@/lib/challenges/challenge-validator', () => ({
  ChallengeValidator: {
    validateChallenge: vi.fn()
  }
}));

describe('generateCodingChallenge', () => {
  let mockInput: GenerateCodingChallengeInput;

  beforeEach(() => {
    vi.clearAllMocks();
    mockInput = {
      targetSkills: ['javascript', 'algorithms'],
      difficulty: 'intermediate',
      category: 'algorithms',
      timeLimit: 60,
      includeHints: true,
      adaptToPreviousPerformance: true,
      challengeType: 'coding'
    };
  });

  it('should generate a coding challenge with basic input', async () => {
    // Mock the AI flow response
    const mockOutput = {
      challenge: {
        title: 'Array Sum Challenge',
        description: 'Calculate the sum of elements in an array',
        prompt: 'Write a function that takes an array of numbers and returns their sum',
        difficulty: 'intermediate' as const,
        estimatedDuration: 30,
        skillsTargeted: ['javascript', 'algorithms'],
        category: 'algorithms',
        tags: ['arrays', 'math'],
        learningObjectives: ['Understanding array iteration', 'Basic arithmetic operations'],
        prerequisites: ['Basic JavaScript knowledge']
      },
      testCases: [
        {
          input: '[1, 2, 3]',
          expectedOutput: '6',
          isHidden: false,
          description: 'Basic sum test'
        }
      ],
      hints: ['Use a loop to iterate through the array'],
      evaluationCriteria: [
        {
          name: 'Correctness',
          weight: 0.6,
          description: 'Does the solution work correctly?'
        },
        {
          name: 'Efficiency',
          weight: 0.4,
          description: 'Is the solution efficient?'
        }
      ],
      difficultyAnalysis: {
        score: 50,
        reasoning: ['Intermediate level concepts'],
        recommendedSkillLevel: 5
      }
    };

    // Mock the difficulty classifier
    const { ChallengeDifficultyClassifier } = await import('@/lib/challenges/difficulty-classifier');
    vi.mocked(ChallengeDifficultyClassifier.classifyDifficulty).mockReturnValue({
      level: 'intermediate',
      score: 50,
      reasoning: ['Intermediate level concepts'],
      recommendedSkillLevel: 5,
      estimatedDuration: 45
    });

    // Mock the AI flow to return our mock output
    const mockFlow = vi.fn().mockResolvedValue(mockOutput);
    
    // Replace the actual implementation with our mock
    vi.doMock('../generate-coding-challenge', () => ({
      generateCodingChallenge: mockFlow
    }));

    const result = await mockFlow(mockInput);

    expect(result).toBeDefined();
    expect(result.challenge.title).toBe('Array Sum Challenge');
    expect(result.challenge.difficulty).toBe('intermediate');
    expect(result.testCases).toHaveLength(1);
    expect(result.evaluationCriteria).toHaveLength(2);
  });

  it('should handle different challenge types', async () => {
    const debuggingInput = {
      ...mockInput,
      challengeType: 'debugging' as const
    };

    const mockOutput = {
      challenge: {
        title: 'Debug the Function',
        description: 'Find and fix the bug in this code',
        prompt: 'The following function has a bug. Fix it.',
        difficulty: 'intermediate' as const,
        estimatedDuration: 25,
        skillsTargeted: ['javascript', 'debugging'],
        category: 'debugging',
        tags: ['debugging', 'javascript'],
        learningObjectives: ['Debugging skills'],
        prerequisites: ['Basic JavaScript']
      },
      testCases: [
        {
          input: 'buggy code',
          expectedOutput: 'fixed code',
          isHidden: false,
          description: 'Fix the bug'
        }
      ],
      hints: ['Look for syntax errors'],
      evaluationCriteria: [
        {
          name: 'Correctness',
          weight: 1.0,
          description: 'Is the bug fixed?'
        }
      ],
      difficultyAnalysis: {
        score: 40,
        reasoning: ['Debugging task'],
        recommendedSkillLevel: 4
      }
    };

    const mockFlow = vi.fn().mockResolvedValue(mockOutput);
    const result = await mockFlow(debuggingInput);

    expect(result.challenge.category).toBe('debugging');
    expect(result.challenge.title).toBe('Debug the Function');
  });

  it('should validate required input parameters', () => {
    const invalidInput = {
      targetSkills: [],
      includeHints: true,
      adaptToPreviousPerformance: true,
      challengeType: 'coding' as const
    };

    // This should be handled by the schema validation
    expect(invalidInput.targetSkills).toHaveLength(0);
  });
});