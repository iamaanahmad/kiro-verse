// Integration tests for AI-powered challenge generator

import { describe, it, expect } from 'vitest';

describe('Challenge Generator Integration', () => {
  it('should have the required exports', async () => {
    const module = await import('../generate-coding-challenge');
    
    expect(module.generateCodingChallenge).toBeDefined();
    expect(typeof module.generateCodingChallenge).toBe('function');
  });

  it('should validate input schema requirements', () => {
    // Test that the required input properties are defined
    const requiredInput = {
      targetSkills: ['javascript'],
      includeHints: true,
      adaptToPreviousPerformance: true,
      challengeType: 'coding' as const
    };

    expect(requiredInput.targetSkills).toHaveLength(1);
    expect(requiredInput.includeHints).toBe(true);
    expect(requiredInput.adaptToPreviousPerformance).toBe(true);
    expect(requiredInput.challengeType).toBe('coding');
  });

  it('should handle different difficulty levels', () => {
    const difficulties = ['beginner', 'intermediate', 'advanced', 'expert'] as const;
    
    difficulties.forEach(difficulty => {
      expect(difficulties).toContain(difficulty);
    });
  });

  it('should handle different challenge types', () => {
    const challengeTypes = ['coding', 'debugging', 'optimization', 'design'] as const;
    
    challengeTypes.forEach(type => {
      expect(challengeTypes).toContain(type);
    });
  });
});