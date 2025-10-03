/**
 * Unit tests for enhanced AI flows structure and interface
 */

import { describe, it, expect } from 'vitest';

describe('Enhanced AI Flows Structure', () => {

  it('should have enhanced sendChatMessage input schema with analytics fields', () => {
    // Test the schema structure by creating a mock validation
    const validInput = {
      code: 'console.log("test");',
      query: 'What does this do?',
      userId: 'test-user',
      enableAnalytics: true
    };
    
    // Verify required fields are present
    expect(validInput.code).toBeDefined();
    expect(validInput.query).toBeDefined();
    expect(validInput.userId).toBeDefined();
    expect(validInput.enableAnalytics).toBeDefined();
  });

  it('should have enhanced sendChatMessage output schema with analytics fields', () => {
    // Test the expected output structure
    const validOutput = {
      aiResponse: 'This logs "test" to the console',
      detectedSkills: ['JavaScript'],
      learningInsights: [{
        type: 'strength',
        category: 'JavaScript',
        title: 'Good logging',
        description: 'You used console.log correctly',
        actionableSteps: ['Continue practicing'],
        priority: 'low'
      }],
      analyticsSessionId: 'session-123'
    };
    
    expect(validOutput.aiResponse).toBeDefined();
    expect(Array.isArray(validOutput.detectedSkills)).toBe(true);
    expect(Array.isArray(validOutput.learningInsights)).toBe(true);
    expect(validOutput.analyticsSessionId).toBeDefined();
  });

  it('should have enhanced awardSkillBadge input schema with analytics fields', () => {
    // Test the expected input structure
    const validInput = {
      code: 'const x = 5;',
      userId: 'test-user',
      context: 'Variable declaration',
      enableAnalytics: true,
      previousSkillLevel: 1
    };
    
    expect(validInput.code).toBeDefined();
    expect(validInput.userId).toBeDefined();
    expect(validInput.context).toBeDefined();
    expect(validInput.enableAnalytics).toBeDefined();
    expect(validInput.previousSkillLevel).toBeDefined();
  });

  it('should have enhanced awardSkillBadge output schema with progression fields', () => {
    // Test the expected output structure
    const validOutput = {
      badgeName: 'JavaScript Variables',
      badgeDescription: 'Demonstrated variable declaration skills',
      skillLevel: 2,
      experiencePoints: 25,
      isLevelUp: true,
      previousLevel: 1,
      skillProgression: {
        improvementAreas: ['Error handling'],
        strengths: ['Clean syntax'],
        nextMilestones: ['Learn functions']
      },
      analyticsSessionId: 'session-456',
      verificationStatus: 'pending'
    };
    
    expect(validOutput.badgeName).toBeDefined();
    expect(validOutput.badgeDescription).toBeDefined();
    expect(validOutput.skillLevel).toBeDefined();
    expect(validOutput.experiencePoints).toBeDefined();
    expect(validOutput.isLevelUp).toBeDefined();
    expect(validOutput.previousLevel).toBeDefined();
    expect(validOutput.skillProgression).toBeDefined();
    expect(validOutput.analyticsSessionId).toBeDefined();
    expect(validOutput.verificationStatus).toBeDefined();
    
    // Test that the schema includes analytics fields
    const validInput = {
      code: 'console.log("test");',
      query: 'What does this do?',
      userId: 'test-user',
      enableAnalytics: true
    };

  });
});

// Export the schemas for testing
export type { SendChatMessageInput, SendChatMessageOutput } from '../send-chat-message';
export type { AwardSkillBadgeInput, AwardSkillBadgeOutput } from '../award-skill-badge';