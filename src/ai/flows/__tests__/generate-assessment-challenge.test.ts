import { 
  generateCodingChallenge, 
  convertToAssessmentChallenge 
} from '../generate-assessment-challenge';

// Mock Genkit dependencies
jest.mock('@genkit-ai/flow', () => ({
  defineFlow: jest.fn((config, fn) => fn),
  defineSchema: jest.fn((name, schema) => schema),
  runFlow: jest.fn()
}));

jest.mock('@genkit-ai/googleai', () => ({
  gemini20FlashExp: {
    generate: jest.fn()
  }
}));

describe('generateAssessmentChallenge', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateCodingChallenge', () => {
    it('generates a coding challenge with basic input', async () => {
      const { runFlow } = require('@genkit-ai/flow');
      const mockGeneratedChallenge = {
        title: 'Array Sum Challenge',
        description: 'Test array manipulation skills',
        prompt: 'Write a function that sums all elements in an array',
        difficulty: 'intermediate',
        skillsTargeted: ['javascript', 'algorithms'],
        timeLimit: 30,
        starterCode: 'function sumArray(arr) {\n  // Your code here\n}',
        testCases: [
          {
            input: '[1, 2, 3, 4, 5]',
            expectedOutput: '15',
            isHidden: false,
            weight: 1,
            description: 'Basic sum test'
          },
          {
            input: '[]',
            expectedOutput: '0',
            isHidden: true,
            weight: 1,
            description: 'Empty array test'
          }
        ],
        expectedApproach: 'Use reduce or loop to sum elements',
        hints: [
          'Consider using Array.reduce()',
          'Handle empty array case'
        ],
        evaluationCriteria: [
          {
            aspect: 'correctness',
            weight: 0.5,
            description: 'Solution correctness',
            evaluationPrompt: 'Check if solution handles all test cases'
          },
          {
            aspect: 'code_quality',
            weight: 0.3,
            description: 'Code readability',
            evaluationPrompt: 'Assess code structure and naming'
          },
          {
            aspect: 'efficiency',
            weight: 0.2,
            description: 'Algorithm efficiency',
            evaluationPrompt: 'Evaluate time complexity'
          }
        ],
        learningObjectives: ['Array manipulation', 'Basic algorithms'],
        realWorldRelevance: 'Common data processing scenario'
      };

      runFlow.mockResolvedValue(mockGeneratedChallenge);

      const input = {
        targetSkills: ['javascript', 'algorithms'],
        difficultyLevel: 'intermediate' as const,
        jobRole: 'Frontend Developer',
        timeLimit: 30
      };

      const result = await generateCodingChallenge(input);

      expect(runFlow).toHaveBeenCalled();
      expect(result).toMatchObject({
        title: 'Array Sum Challenge',
        description: 'Test array manipulation skills',
        difficulty: 'intermediate',
        skillsTargeted: ['javascript', 'algorithms'],
        timeLimit: 30
      });
      expect(result.challengeId).toMatch(/^challenge_\d+_[a-z0-9]+$/);
    });

    it('handles AI generation errors gracefully', async () => {
      const { runFlow } = require('@genkit-ai/flow');
      runFlow.mockRejectedValue(new Error('AI service unavailable'));

      const input = {
        targetSkills: ['javascript'],
        difficultyLevel: 'beginner' as const
      };

      await expect(generateCodingChallenge(input)).rejects.toThrow('Failed to generate coding challenge');
    });

    it('generates challenges for different difficulty levels', async () => {
      const { runFlow } = require('@genkit-ai/flow');
      
      const difficulties = ['beginner', 'intermediate', 'advanced', 'expert'] as const;
      
      for (const difficulty of difficulties) {
        const mockChallenge = {
          title: `${difficulty} Challenge`,
          description: `Test ${difficulty} skills`,
          prompt: 'Solve this problem',
          difficulty,
          skillsTargeted: ['javascript'],
          timeLimit: difficulty === 'beginner' ? 20 : difficulty === 'expert' ? 90 : 45,
          testCases: [],
          expectedApproach: 'Use appropriate approach',
          hints: [],
          evaluationCriteria: [],
          learningObjectives: [],
          realWorldRelevance: 'Relevant scenario'
        };

        runFlow.mockResolvedValue(mockChallenge);

        const result = await generateCodingChallenge({
          targetSkills: ['javascript'],
          difficultyLevel: difficulty
        });

        expect(result.difficulty).toBe(difficulty);
        expect(result.timeLimit).toBeGreaterThan(0);
      }
    });

    it('incorporates job role and company context', async () => {
      const { runFlow } = require('@genkit-ai/flow');
      
      const mockChallenge = {
        title: 'E-commerce Cart Challenge',
        description: 'Shopping cart functionality for e-commerce',
        prompt: 'Implement shopping cart operations',
        difficulty: 'intermediate',
        skillsTargeted: ['javascript', 'react'],
        timeLimit: 60,
        testCases: [],
        expectedApproach: 'Use React state management',
        hints: ['Consider state updates', 'Handle edge cases'],
        evaluationCriteria: [],
        learningObjectives: ['State management', 'Component design'],
        realWorldRelevance: 'E-commerce applications commonly need cart functionality'
      };

      runFlow.mockResolvedValue(mockChallenge);

      const input = {
        targetSkills: ['javascript', 'react'],
        difficultyLevel: 'intermediate' as const,
        jobRole: 'Frontend Developer',
        companyContext: 'E-commerce platform',
        industryDomain: 'retail'
      };

      const result = await generateCodingChallenge(input);

      expect(result.title).toContain('Cart');
      expect(result.realWorldRelevance).toContain('e-commerce');
    });

    it('avoids duplicating existing challenges', async () => {
      const { runFlow } = require('@genkit-ai/flow');
      
      const mockChallenge = {
        title: 'Unique Algorithm Challenge',
        description: 'Different from existing challenges',
        prompt: 'Solve this unique problem',
        difficulty: 'intermediate',
        skillsTargeted: ['javascript'],
        timeLimit: 45,
        testCases: [],
        expectedApproach: 'Novel approach',
        hints: [],
        evaluationCriteria: [],
        learningObjectives: [],
        realWorldRelevance: 'Unique scenario'
      };

      runFlow.mockResolvedValue(mockChallenge);

      const input = {
        targetSkills: ['javascript'],
        difficultyLevel: 'intermediate' as const,
        existingChallenges: ['Array Sum Challenge', 'String Manipulation']
      };

      const result = await generateCodingChallenge(input);

      expect(result.title).not.toBe('Array Sum Challenge');
      expect(result.title).not.toBe('String Manipulation');
    });
  });

  describe('convertToAssessmentChallenge', () => {
    it('converts generated challenge to assessment format', () => {
      const generatedChallenge = {
        title: 'Test Challenge',
        description: 'Test description',
        prompt: 'Solve this problem',
        difficulty: 'intermediate' as const,
        skillsTargeted: ['javascript'],
        timeLimit: 30,
        starterCode: 'function test() {}',
        testCases: [
          {
            input: 'test input',
            expectedOutput: 'test output',
            isHidden: false,
            weight: 1,
            description: 'test case'
          }
        ],
        expectedApproach: 'Use loops',
        hints: ['hint 1', 'hint 2'],
        evaluationCriteria: [
          {
            aspect: 'correctness' as const,
            weight: 1,
            description: 'Check correctness',
            evaluationPrompt: 'Evaluate correctness'
          }
        ],
        learningObjectives: ['Learn loops'],
        realWorldRelevance: 'Common scenario'
      };

      const result = convertToAssessmentChallenge(generatedChallenge, 'custom-id');

      expect(result).toMatchObject({
        challengeId: 'custom-id',
        title: 'Test Challenge',
        description: 'Test description',
        prompt: 'Solve this problem',
        difficulty: 'intermediate',
        skillsTargeted: ['javascript'],
        timeLimit: 30,
        starterCode: 'function test() {}',
        expectedApproach: 'Use loops',
        hints: ['hint 1', 'hint 2'],
        maxScore: 100,
        weight: 1,
        evaluationMethod: 'ai_assisted'
      });

      expect(result.testCases).toHaveLength(1);
      expect(result.testCases[0]).toMatchObject({
        testId: 'test_1',
        input: 'test input',
        expectedOutput: 'test output',
        isHidden: false,
        weight: 1,
        description: 'test case'
      });

      expect(result.aiEvaluationCriteria).toHaveLength(1);
      expect(result.aiEvaluationCriteria[0]).toMatchObject({
        aspect: 'correctness',
        weight: 1,
        description: 'Check correctness',
        evaluationPrompt: 'Evaluate correctness'
      });
    });

    it('generates challenge ID when not provided', () => {
      const generatedChallenge = {
        title: 'Test',
        description: 'Test',
        prompt: 'Test',
        difficulty: 'beginner' as const,
        skillsTargeted: ['javascript'],
        timeLimit: 30,
        testCases: [],
        expectedApproach: 'Test',
        hints: [],
        evaluationCriteria: [],
        learningObjectives: [],
        realWorldRelevance: 'Test'
      };

      const result = convertToAssessmentChallenge(generatedChallenge);

      expect(result.challengeId).toMatch(/^challenge_\d+_[a-z0-9]+$/);
    });
  });

  describe('validation', () => {
    it('validates challenge has required fields', async () => {
      const { runFlow } = require('@genkit-ai/flow');
      
      // Mock invalid challenge (missing required fields)
      const invalidChallenge = {
        title: '',
        description: 'Test',
        prompt: '',
        difficulty: 'intermediate',
        skillsTargeted: ['javascript'],
        timeLimit: 30,
        testCases: [], // Empty test cases
        expectedApproach: 'Test',
        hints: [],
        evaluationCriteria: [],
        learningObjectives: [],
        realWorldRelevance: 'Test'
      };

      runFlow.mockResolvedValue(invalidChallenge);

      const input = {
        targetSkills: ['javascript'],
        difficultyLevel: 'intermediate' as const
      };

      await expect(generateCodingChallenge(input)).rejects.toThrow();
    });

    it('validates difficulty level matches input', async () => {
      const { runFlow } = require('@genkit-ai/flow');
      
      const mismatchedChallenge = {
        title: 'Test Challenge',
        description: 'Test',
        prompt: 'Test problem',
        difficulty: 'advanced', // Different from input
        skillsTargeted: ['javascript'],
        timeLimit: 30,
        testCases: [{ input: 'test', expectedOutput: 'test', isHidden: false, weight: 1, description: 'test' }],
        expectedApproach: 'Test',
        hints: [],
        evaluationCriteria: [{ aspect: 'correctness', weight: 1, description: 'test', evaluationPrompt: 'test' }],
        learningObjectives: [],
        realWorldRelevance: 'Test'
      };

      runFlow.mockResolvedValue(mismatchedChallenge);

      const input = {
        targetSkills: ['javascript'],
        difficultyLevel: 'beginner' as const
      };

      await expect(generateCodingChallenge(input)).rejects.toThrow();
    });

    it('validates skills coverage', async () => {
      const { runFlow } = require('@genkit-ai/flow');
      
      const incompleteCoverage = {
        title: 'Test Challenge',
        description: 'Test',
        prompt: 'Test problem',
        difficulty: 'intermediate',
        skillsTargeted: ['javascript'], // Missing 'react' from input
        timeLimit: 30,
        testCases: [{ input: 'test', expectedOutput: 'test', isHidden: false, weight: 1, description: 'test' }],
        expectedApproach: 'Test',
        hints: [],
        evaluationCriteria: [{ aspect: 'correctness', weight: 1, description: 'test', evaluationPrompt: 'test' }],
        learningObjectives: [],
        realWorldRelevance: 'Test'
      };

      runFlow.mockResolvedValue(incompleteCoverage);

      const input = {
        targetSkills: ['javascript', 'react'],
        difficultyLevel: 'intermediate' as const
      };

      await expect(generateCodingChallenge(input)).rejects.toThrow();
    });
  });
});