// Challenge Content Validation System

import type { Challenge, TestCase, EvaluationCriteria } from '@/types/analytics';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

export interface ValidationOptions {
  strictMode?: boolean;
  requireMinimumTestCases?: number;
  requireHiddenTestCases?: boolean;
  validateCodeExecution?: boolean;
}

export class ChallengeValidator {
  /**
   * Validates a complete challenge for quality and completeness
   */
  static validateChallenge(
    challenge: Partial<Challenge>,
    options: ValidationOptions = {}
  ): ValidationResult {
    const {
      strictMode = false,
      requireMinimumTestCases = 3,
      requireHiddenTestCases = true,
      validateCodeExecution = false
    } = options;

    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Validate basic challenge properties
    this.validateBasicProperties(challenge, errors, warnings);

    // Validate challenge content quality
    this.validateContentQuality(challenge, errors, warnings, suggestions, strictMode);

    // Validate test cases
    if (challenge.testCases) {
      this.validateTestCases(
        challenge.testCases,
        errors,
        warnings,
        suggestions,
        requireMinimumTestCases,
        requireHiddenTestCases
      );
    }

    // Validate evaluation criteria
    if (challenge.evaluationCriteria) {
      this.validateEvaluationCriteria(challenge.evaluationCriteria, errors, warnings);
    }

    // Validate difficulty consistency
    this.validateDifficultyConsistency(challenge, warnings, suggestions);

    // Validate learning objectives alignment
    this.validateLearningAlignment(challenge, warnings, suggestions);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions
    };
  }

  /**
   * Validates basic required properties
   */
  private static validateBasicProperties(
    challenge: Partial<Challenge>,
    errors: string[],
    warnings: string[]
  ): void {
    // Required fields
    if (!challenge.title || challenge.title.trim().length === 0) {
      errors.push('Challenge title is required');
    } else if (challenge.title.length < 5) {
      warnings.push('Challenge title is very short');
    } else if (challenge.title.length > 100) {
      warnings.push('Challenge title is very long');
    }

    if (!challenge.description || challenge.description.trim().length === 0) {
      errors.push('Challenge description is required');
    } else if (challenge.description.length < 50) {
      warnings.push('Challenge description is quite short');
    }

    if (!challenge.prompt || challenge.prompt.trim().length === 0) {
      errors.push('Challenge prompt is required');
    }

    if (!challenge.difficulty) {
      errors.push('Challenge difficulty level is required');
    }

    if (!challenge.skillsTargeted || challenge.skillsTargeted.length === 0) {
      errors.push('At least one target skill is required');
    }

    if (!challenge.category || challenge.category.trim().length === 0) {
      warnings.push('Challenge category should be specified');
    }
  }

  /**
   * Validates content quality and clarity
   */
  private static validateContentQuality(
    challenge: Partial<Challenge>,
    errors: string[],
    warnings: string[],
    suggestions: string[],
    strictMode: boolean
  ): void {
    // Check title quality
    if (challenge.title) {
      if (!/^[A-Z]/.test(challenge.title)) {
        warnings.push('Challenge title should start with a capital letter');
      }
      
      if (challenge.title.includes('TODO') || challenge.title.includes('FIXME')) {
        errors.push('Challenge title contains placeholder text');
      }
    }

    // Check description quality
    if (challenge.description) {
      const sentences = challenge.description.split(/[.!?]+/).filter(s => s.trim().length > 0);
      
      if (sentences.length < 2) {
        warnings.push('Challenge description should have multiple sentences for clarity');
      }

      if (challenge.description.includes('TODO') || challenge.description.includes('FIXME')) {
        errors.push('Challenge description contains placeholder text');
      }

      // Check for clear problem statement
      if (!this.hasActionVerbs(challenge.description)) {
        suggestions.push('Include clear action verbs in the description (e.g., "implement", "create", "solve")');
      }
    }

    // Check prompt quality
    if (challenge.prompt) {
      if (!challenge.prompt.includes('function') && !challenge.prompt.includes('class') && !challenge.prompt.includes('implement')) {
        warnings.push('Challenge prompt should clearly specify what to implement');
      }

      if (strictMode && !this.hasExampleUsage(challenge.prompt)) {
        suggestions.push('Consider adding example usage to the prompt for clarity');
      }
    }

    // Check learning objectives
    if (challenge.learningObjectives && challenge.learningObjectives.length === 0) {
      warnings.push('Learning objectives help users understand the educational value');
    }

    // Check estimated duration reasonableness
    if (challenge.estimatedDuration) {
      if (challenge.estimatedDuration < 5) {
        warnings.push('Estimated duration seems too short for a meaningful challenge');
      } else if (challenge.estimatedDuration > 240) {
        warnings.push('Estimated duration seems very long for a single challenge');
      }
    }
  }

  /**
   * Validates test cases for completeness and quality
   */
  private static validateTestCases(
    testCases: TestCase[],
    errors: string[],
    warnings: string[],
    suggestions: string[],
    requireMinimumTestCases: number,
    requireHiddenTestCases: boolean
  ): void {
    if (testCases.length < requireMinimumTestCases) {
      errors.push(`At least ${requireMinimumTestCases} test cases are required`);
    }

    const visibleTests = testCases.filter(tc => !tc.isHidden);
    const hiddenTests = testCases.filter(tc => tc.isHidden);

    if (visibleTests.length === 0) {
      errors.push('At least one visible test case is required for user guidance');
    }

    if (requireHiddenTestCases && hiddenTests.length === 0) {
      warnings.push('Hidden test cases help prevent hardcoded solutions');
    }

    // Validate individual test cases
    testCases.forEach((testCase, index) => {
      if (!testCase.input && testCase.input !== '') {
        errors.push(`Test case ${index + 1} is missing input`);
      }

      if (!testCase.expectedOutput && testCase.expectedOutput !== '') {
        errors.push(`Test case ${index + 1} is missing expected output`);
      }

      if (testCase.weight < 0 || testCase.weight > 1) {
        warnings.push(`Test case ${index + 1} weight should be between 0 and 1`);
      }
    });

    // Check for edge cases
    const hasEmptyInput = testCases.some(tc => tc.input === '' || tc.input === '[]' || tc.input === '{}');
    const hasLargeInput = testCases.some(tc => tc.input.length > 100);
    
    if (!hasEmptyInput) {
      suggestions.push('Consider adding edge cases with empty or minimal input');
    }

    if (testCases.length > 3 && !hasLargeInput) {
      suggestions.push('Consider adding test cases with larger input to test scalability');
    }

    // Check test case diversity
    const uniqueInputs = new Set(testCases.map(tc => tc.input));
    if (uniqueInputs.size < testCases.length * 0.8) {
      warnings.push('Test cases should have diverse inputs to thoroughly test the solution');
    }
  }

  /**
   * Validates evaluation criteria
   */
  private static validateEvaluationCriteria(
    criteria: EvaluationCriteria[],
    errors: string[],
    warnings: string[]
  ): void {
    if (criteria.length === 0) {
      errors.push('At least one evaluation criterion is required');
      return;
    }

    const totalWeight = criteria.reduce((sum, criterion) => sum + criterion.weight, 0);
    
    if (Math.abs(totalWeight - 1.0) > 0.01) {
      errors.push(`Evaluation criteria weights must sum to 1.0 (currently ${totalWeight.toFixed(2)})`);
    }

    // Check for essential criteria
    const criteriaNames = criteria.map(c => c.name.toLowerCase());
    
    if (!criteriaNames.includes('correctness')) {
      warnings.push('Consider including "Correctness" as an evaluation criterion');
    }

    // Validate individual criteria
    criteria.forEach((criterion, index) => {
      if (!criterion.name || criterion.name.trim().length === 0) {
        errors.push(`Evaluation criterion ${index + 1} is missing a name`);
      }

      if (!criterion.description || criterion.description.trim().length === 0) {
        warnings.push(`Evaluation criterion "${criterion.name}" should have a description`);
      }

      if (criterion.weight <= 0) {
        errors.push(`Evaluation criterion "${criterion.name}" must have a positive weight`);
      }

      if (criterion.maxScore <= 0) {
        errors.push(`Evaluation criterion "${criterion.name}" must have a positive max score`);
      }
    });
  }

  /**
   * Validates difficulty consistency across challenge elements
   */
  private static validateDifficultyConsistency(
    challenge: Partial<Challenge>,
    warnings: string[],
    suggestions: string[]
  ): void {
    if (!challenge.difficulty) return;

    const difficulty = challenge.difficulty;
    
    // Check estimated duration consistency
    if (challenge.estimatedDuration) {
      const expectedDuration = this.getExpectedDurationRange(difficulty);
      
      if (challenge.estimatedDuration < expectedDuration.min) {
        warnings.push(`Estimated duration (${challenge.estimatedDuration}min) seems short for ${difficulty} difficulty`);
      } else if (challenge.estimatedDuration > expectedDuration.max) {
        warnings.push(`Estimated duration (${challenge.estimatedDuration}min) seems long for ${difficulty} difficulty`);
      }
    }

    // Check prerequisites consistency
    if (challenge.prerequisites) {
      const expectedPrereqs = this.getExpectedPrerequisiteCount(difficulty);
      
      if (challenge.prerequisites.length < expectedPrereqs.min) {
        suggestions.push(`Consider adding more prerequisites for ${difficulty} difficulty`);
      } else if (challenge.prerequisites.length > expectedPrereqs.max) {
        warnings.push(`Many prerequisites for ${difficulty} difficulty might be overwhelming`);
      }
    }

    // Check learning objectives consistency
    if (challenge.learningObjectives) {
      const expectedObjectives = this.getExpectedObjectiveCount(difficulty);
      
      if (challenge.learningObjectives.length > expectedObjectives.max) {
        suggestions.push(`Consider focusing on fewer learning objectives for better clarity`);
      }
    }
  }

  /**
   * Validates alignment between different challenge elements
   */
  private static validateLearningAlignment(
    challenge: Partial<Challenge>,
    warnings: string[],
    suggestions: string[]
  ): void {
    // Check skill-objective alignment
    if (challenge.skillsTargeted && challenge.learningObjectives) {
      const skillsInObjectives = challenge.learningObjectives.some(obj =>
        challenge.skillsTargeted!.some(skill =>
          obj.toLowerCase().includes(skill.toLowerCase())
        )
      );

      if (!skillsInObjectives) {
        suggestions.push('Learning objectives should align with targeted skills');
      }
    }

    // Check category-skill alignment
    if (challenge.category && challenge.skillsTargeted) {
      const categoryKeywords = this.getCategoryKeywords(challenge.category);
      const hasAlignedSkills = challenge.skillsTargeted.some(skill =>
        categoryKeywords.some(keyword =>
          skill.toLowerCase().includes(keyword.toLowerCase())
        )
      );

      if (!hasAlignedSkills) {
        warnings.push('Targeted skills should align with the challenge category');
      }
    }

    // Check tags relevance
    if (challenge.tags && challenge.skillsTargeted) {
      const relevantTags = challenge.tags.filter(tag =>
        challenge.skillsTargeted!.some(skill =>
          skill.toLowerCase().includes(tag.toLowerCase()) ||
          tag.toLowerCase().includes(skill.toLowerCase())
        )
      );

      if (relevantTags.length === 0) {
        suggestions.push('Tags should be relevant to the targeted skills');
      }
    }
  }

  // Helper methods

  private static hasActionVerbs(text: string): boolean {
    const actionVerbs = ['implement', 'create', 'build', 'write', 'develop', 'solve', 'design', 'optimize'];
    return actionVerbs.some(verb => text.toLowerCase().includes(verb));
  }

  private static hasExampleUsage(text: string): boolean {
    return text.includes('example') || text.includes('Example') || text.includes('e.g.') || text.includes('for instance');
  }

  private static getExpectedDurationRange(difficulty: string): { min: number; max: number } {
    const ranges = {
      beginner: { min: 10, max: 30 },
      intermediate: { min: 20, max: 60 },
      advanced: { min: 45, max: 120 },
      expert: { min: 90, max: 240 }
    };
    return ranges[difficulty as keyof typeof ranges] || { min: 15, max: 60 };
  }

  private static getExpectedPrerequisiteCount(difficulty: string): { min: number; max: number } {
    const counts = {
      beginner: { min: 0, max: 2 },
      intermediate: { min: 1, max: 4 },
      advanced: { min: 2, max: 6 },
      expert: { min: 3, max: 8 }
    };
    return counts[difficulty as keyof typeof counts] || { min: 1, max: 4 };
  }

  private static getExpectedObjectiveCount(difficulty: string): { min: number; max: number } {
    const counts = {
      beginner: { min: 1, max: 3 },
      intermediate: { min: 2, max: 4 },
      advanced: { min: 2, max: 5 },
      expert: { min: 3, max: 6 }
    };
    return counts[difficulty as keyof typeof counts] || { min: 2, max: 4 };
  }

  private static getCategoryKeywords(category: string): string[] {
    const keywords: { [key: string]: string[] } = {
      'algorithms': ['algorithm', 'sorting', 'searching', 'recursion', 'dynamic'],
      'web-development': ['web', 'html', 'css', 'javascript', 'react', 'frontend'],
      'backend': ['server', 'api', 'database', 'node', 'express', 'backend'],
      'data-structures': ['array', 'list', 'tree', 'graph', 'stack', 'queue'],
      'mobile': ['mobile', 'app', 'ios', 'android', 'react-native'],
      'data-science': ['data', 'analysis', 'python', 'pandas', 'numpy', 'ml']
    };
    
    return keywords[category.toLowerCase()] || [];
  }
}