// Unit tests for Challenge Validator

import { describe, it, expect } from 'vitest';
import { ChallengeValidator } from '../challenge-validator';
import type { Challenge } from '@/types/analytics';

describe('ChallengeValidator', () => {
  const validChallenge: Partial<Challenge> = {
    title: 'Array Sum Challenge',
    description: 'Calculate the sum of elements in an array. This challenge will test your understanding of array iteration and basic arithmetic operations.',
    prompt: 'Write a function that takes an array of numbers and returns their sum',
    difficulty: 'intermediate',
    skillsTargeted: ['javascript', 'algorithms'],
    category: 'algorithms',
    testCases: [
      {
        input: '[1, 2, 3]',
        expectedOutput: '6',
        isHidden: false,
        weight: 0.7,
        description: 'Basic sum test'
      },
      {
        input: '[]',
        expectedOutput: '0',
        isHidden: false,
        weight: 0.3,
        description: 'Empty array test'
      },
      {
        input: '[10, -5, 3]',
        expectedOutput: '8',
        isHidden: true,
        weight: 0.5,
        description: 'Mixed numbers test'
      }
    ],
    evaluationCriteria: [
      {
        criteriaId: 'correctness',
        name: 'Correctness',
        weight: 0.6,
        description: 'Does the solution work correctly?',
        maxScore: 100
      },
      {
        criteriaId: 'efficiency',
        name: 'Efficiency',
        weight: 0.4,
        description: 'Is the solution efficient?',
        maxScore: 100
      }
    ],
    estimatedDuration: 30,
    learningObjectives: ['Understanding array iteration', 'Basic arithmetic operations'],
    prerequisites: ['Basic JavaScript knowledge']
  };

  it('should validate a complete and correct challenge', () => {
    const result = ChallengeValidator.validateChallenge(validChallenge);
    
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should detect missing required fields', () => {
    const incompleteChallenge = {
      title: 'Test Challenge'
      // Missing description, prompt, etc.
    };

    const result = ChallengeValidator.validateChallenge(incompleteChallenge);
    
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors.some(error => error.includes('description'))).toBe(true);
    expect(result.errors.some(error => error.includes('prompt'))).toBe(true);
  });

  it('should validate test cases requirements', () => {
    const challengeWithFewTests = {
      ...validChallenge,
      testCases: [
        {
          input: '[1, 2]',
          expectedOutput: '3',
          isHidden: false,
          weight: 1.0,
          description: 'Only test'
        }
      ]
    };

    const result = ChallengeValidator.validateChallenge(challengeWithFewTests, {
      requireMinimumTestCases: 3
    });
    
    expect(result.isValid).toBe(false);
    expect(result.errors.some(error => error.includes('3 test cases'))).toBe(true);
  });

  it('should validate evaluation criteria weights', () => {
    const challengeWithBadWeights = {
      ...validChallenge,
      evaluationCriteria: [
        {
          criteriaId: 'correctness',
          name: 'Correctness',
          weight: 0.7,
          description: 'Does it work?',
          maxScore: 100
        },
        {
          criteriaId: 'efficiency',
          name: 'Efficiency',
          weight: 0.5, // This makes total > 1.0
          description: 'Is it efficient?',
          maxScore: 100
        }
      ]
    };

    const result = ChallengeValidator.validateChallenge(challengeWithBadWeights);
    
    expect(result.isValid).toBe(false);
    expect(result.errors.some(error => error.includes('sum to 1.0'))).toBe(true);
  });

  it('should provide helpful suggestions', () => {
    const challengeNeedingImprovement = {
      ...validChallenge,
      title: 'test', // Too short
      description: 'Short description.', // Too short
      testCases: validChallenge.testCases?.filter(tc => !tc.isHidden) // No hidden tests
    };

    const result = ChallengeValidator.validateChallenge(challengeNeedingImprovement);
    
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.suggestions.length).toBeGreaterThan(0);
  });

  it('should validate difficulty consistency', () => {
    const inconsistentChallenge = {
      ...validChallenge,
      difficulty: 'beginner',
      estimatedDuration: 180, // Too long for beginner
      prerequisites: ['Advanced JavaScript', 'Algorithms', 'Data Structures', 'Complex Math'] // Too many for beginner
    };

    const result = ChallengeValidator.validateChallenge(inconsistentChallenge);
    
    expect(result.warnings.some(warning => 
      warning.includes('duration') || warning.includes('prerequisites')
    )).toBe(true);
  });
});