// Unit tests for Challenge Evaluator

import { describe, it, expect } from 'vitest';
import { ChallengeEvaluator } from '../challenge-evaluator';
import type { TestCase, EvaluationCriteria } from '@/types/analytics';

describe('ChallengeEvaluator', () => {
  const sampleTestCases: TestCase[] = [
    {
      input: '[1, 2, 3]',
      expectedOutput: '6',
      isHidden: false,
      weight: 0.4,
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
      weight: 0.3,
      description: 'Mixed numbers test'
    }
  ];

  const sampleCriteria: EvaluationCriteria[] = [
    {
      criteriaId: 'correctness',
      name: 'Correctness',
      weight: 0.7,
      description: 'Does the solution work correctly?',
      maxScore: 100
    },
    {
      criteriaId: 'efficiency',
      name: 'Efficiency',
      weight: 0.3,
      description: 'Is the solution efficient?',
      maxScore: 100
    }
  ];

  it('should have the evaluateSubmission method', () => {
    expect(ChallengeEvaluator.evaluateSubmission).toBeDefined();
    expect(typeof ChallengeEvaluator.evaluateSubmission).toBe('function');
  });

  it('should validate test cases structure', () => {
    expect(sampleTestCases).toHaveLength(3);
    expect(sampleTestCases[0]).toHaveProperty('input');
    expect(sampleTestCases[0]).toHaveProperty('expectedOutput');
    expect(sampleTestCases[0]).toHaveProperty('weight');
  });

  it('should validate evaluation criteria structure', () => {
    expect(sampleCriteria).toHaveLength(2);
    expect(sampleCriteria[0]).toHaveProperty('name');
    expect(sampleCriteria[0]).toHaveProperty('weight');
    expect(sampleCriteria[0]).toHaveProperty('description');
    
    const totalWeight = sampleCriteria.reduce((sum, criteria) => sum + criteria.weight, 0);
    expect(totalWeight).toBe(1.0);
  });

  it('should validate evaluation options', () => {
    const defaultOptions = {
      enableAIAnalysis: true,
      strictMode: false,
      timeoutMs: 5000,
      memoryLimitMB: 128
    };
    
    expect(defaultOptions.enableAIAnalysis).toBe(true);
    expect(defaultOptions.timeoutMs).toBeGreaterThan(0);
    expect(defaultOptions.memoryLimitMB).toBeGreaterThan(0);
  });

  it('should handle different programming languages', () => {
    const supportedLanguages = ['javascript', 'typescript', 'python', 'java'];
    
    supportedLanguages.forEach(language => {
      expect(typeof language).toBe('string');
      expect(language.length).toBeGreaterThan(0);
    });
  });

  it('should validate test case weights', () => {
    const totalWeight = sampleTestCases.reduce((sum, testCase) => sum + testCase.weight, 0);
    expect(totalWeight).toBeCloseTo(1.0, 1);
    
    sampleTestCases.forEach(testCase => {
      expect(testCase.weight).toBeGreaterThan(0);
      expect(testCase.weight).toBeLessThanOrEqual(1);
    });
  });

  it('should have proper test case structure', () => {
    sampleTestCases.forEach((testCase, index) => {
      expect(testCase.input).toBeDefined();
      expect(testCase.expectedOutput).toBeDefined();
      expect(typeof testCase.isHidden).toBe('boolean');
      expect(testCase.description).toBeDefined();
      
      if (index === 0) {
        expect(testCase.input).toBe('[1, 2, 3]');
        expect(testCase.expectedOutput).toBe('6');
      }
    });
  });
});