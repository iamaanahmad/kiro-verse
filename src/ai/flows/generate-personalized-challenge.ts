'use server';

/**
 * @fileOverview AI flow for generating personalized coding challenges based on user learning patterns and preferences
 *
 * This flow creates highly personalized challenges that:
 * - Adapt to user's learning style and pace
 * - Target specific skill gaps and growth areas
 * - Incorporate user preferences for challenge types and difficulty progression
 * - Use learning pattern data to optimize engagement and learning outcomes
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { PersonalizationDataService } from '@/lib/firebase/personalization';
import { UserProgressService } from '@/lib/firebase/analytics';
import { PersonalizationEngine } from '@/lib/personalization/personalization-engine';
import type { 
  LearningStyle, 
  ChallengeRecommendation, 
  CustomChallenge,
  PersonalizationAspect 
} from '@/types/personalization';
import type { UserProgress } from '@/types/analytics';

const GeneratePersonalizedChallengeInputSchema = z.object({
  userId: z.string().describe('The user ID for personalized challenge generation.'),
  targetSkills: z.array(z.string()).optional().describe('Specific skills to target. If not provided, will be determined from user progress.'),
  challengeType: z.enum(['skill_building', 'weakness_addressing', 'strength_advancing', 'comprehensive']).optional().default('skill_building').describe('Type of personalized challenge to generate.'),
  adaptationLevel: z.enum(['light', 'moderate', 'heavy']).optional().default('moderate').describe('How much to adapt the challenge to user preferences.'),
  includeCollaborativeElements: z.boolean().optional().default(false).describe('Whether to include collaborative aspects for users who prefer them.'),
  respectTimeConstraints: z.boolean().optional().default(true).describe('Whether to respect user\'s typical time availability.'),
  buildOnRecentProgress: z.boolean().optional().default(true).describe('Whether to build on recent skill improvements.'),
});
export type GeneratePersonalizedChallengeInput = z.infer<typeof GeneratePersonalizedChallengeInputSchema>;

const GeneratePersonalizedChallengeOutputSchema = z.object({
  recommendation: z.object({
    challengeId: z.string().describe('Unique identifier for the generated challenge.'),
    title: z.string().describe('Personalized challenge title.'),
    description: z.string().describe('Challenge description tailored to user\'s learning style.'),
    difficulty: z.enum(['beginner', 'intermediate', 'advanced', 'expert']).describe('Difficulty level based on user\'s current skills.'),
    estimatedDuration: z.number().describe('Estimated completion time based on user\'s learning pace.'),
    skillsTargeted: z.array(z.string()).describe('Skills this challenge will help develop.'),
    personalizedAspects: z.array(z.object({
      aspect: z.string().describe('What aspect was personalized (e.g., difficulty_curve, problem_domain).'),
      value: z.string().describe('The personalized value.'),
      reason: z.string().describe('Why this personalization was applied.'),
    })).describe('How the challenge was personalized for this user.'),
    reasoning: z.string().describe('Explanation of why this challenge is recommended for the user.'),
    confidenceScore: z.number().min(0).max(1).describe('Confidence in the recommendation quality.'),
  }),
  customChallenge: z.object({
    title: z.string().describe('Challenge title.'),
    description: z.string().describe('Detailed challenge description.'),
    prompt: z.string().describe('The main coding prompt.'),
    expectedApproach: z.array(z.string()).describe('Expected solution approaches.'),
    evaluationCriteria: z.array(z.string()).describe('How the solution will be evaluated.'),
    hints: z.array(z.string()).describe('Progressive hints tailored to user\'s learning style.'),
    testCases: z.array(z.object({
      input: z.string().describe('Test input.'),
      expectedOutput: z.string().describe('Expected output.'),
      isHidden: z.boolean().describe('Whether this test case is hidden.'),
      weight: z.number().describe('Weight of this test case in evaluation.'),
      description: z.string().optional().describe('What this test case validates.'),
    })).describe('Test cases for validation.'),
    learningObjectives: z.array(z.string()).describe('What the user will learn.'),
  }),
  adaptiveElements: z.object({
    feedbackStyle: z.string().describe('How feedback should be delivered for this user.'),
    progressTracking: z.string().describe('How progress should be tracked and displayed.'),
    nextStepSuggestions: z.array(z.string()).describe('Suggested next steps after completion.'),
    collaborativeOpportunities: z.array(z.string()).optional().describe('Opportunities for peer interaction if user prefers collaboration.'),
  }),
});
export type GeneratePersonalizedChallengeOutput = z.infer<typeof GeneratePersonalizedChallengeOutputSchema>;

export const generatePersonalizedChallenge = ai.defineFlow(
  {
    name: 'generatePersonalizedChallenge',
    inputSchema: GeneratePersonalizedChallengeInputSchema,
    outputSchema: GeneratePersonalizedChallengeOutputSchema,
  },
  async (input): Promise<GeneratePersonalizedChallengeOutput> => {
    try {
      // Get user data for personalization
      const [userProgress, learningStyle, patterns] = await Promise.all([
        UserProgressService.getUserProgress(input.userId),
        PersonalizationDataService.getLearningStyle(input.userId),
        PersonalizationDataService.getUserLearningPatterns(input.userId)
      ]);

      if (!userProgress) {
        throw new Error(`User progress not found for user ${input.userId}`);
      }

      // Determine target skills based on user progress and input
      const targetSkills = input.targetSkills || await determineTargetSkills(
        userProgress, 
        learningStyle, 
        input.challengeType
      );

      // Analyze user context for personalization
      const userContext = analyzeUserContext(userProgress, learningStyle, patterns);

      // Generate personalized challenge using AI
      const challengePrompt = buildPersonalizedChallengePrompt(
        userContext,
        targetSkills,
        input
      );

      const aiResponse = await ai.generate({
        model: 'gemini-2.0-flash-exp',
        prompt: challengePrompt,
        config: {
          temperature: 0.7,
          maxOutputTokens: 2000,
        },
      });

      // Parse and structure the AI response
      const challengeData = parseAIResponse(aiResponse.text, userContext, targetSkills);

      // Create personalization aspects
      const personalizedAspects = createPersonalizationAspects(userContext, learningStyle, input);

      // Generate adaptive elements
      const adaptiveElements = generateAdaptiveElements(userContext, learningStyle);

      // Calculate confidence score
      const confidenceScore = calculateConfidenceScore(userContext, targetSkills, challengeData);

      const recommendation: ChallengeRecommendation = {
        recommendationId: `personalized_${input.userId}_${Date.now()}`,
        userId: input.userId,
        customChallenge: challengeData.customChallenge,
        difficulty: challengeData.difficulty,
        skillsTargeted: targetSkills,
        personalizedAspects,
        estimatedDuration: adjustDurationForUser(challengeData.estimatedDuration, learningStyle),
        reasoning: generatePersonalizedReasoning(userContext, targetSkills, input.challengeType),
        confidenceScore,
        createdAt: new Date()
      };

      // Save the recommendation
      await PersonalizationDataService.saveChallengeRecommendation(recommendation);

      return {
        recommendation: {
          challengeId: recommendation.recommendationId,
          title: challengeData.customChallenge.title,
          description: challengeData.customChallenge.description,
          difficulty: challengeData.difficulty,
          estimatedDuration: recommendation.estimatedDuration,
          skillsTargeted: targetSkills,
          personalizedAspects,
          reasoning: recommendation.reasoning,
          confidenceScore
        },
        customChallenge: challengeData.customChallenge,
        adaptiveElements
      };

    } catch (error) {
      console.error('Error generating personalized challenge:', error);
      throw new Error(`Failed to generate personalized challenge: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
);

// Helper functions

async function determineTargetSkills(
  userProgress: UserProgress,
  learningStyle: LearningStyle | null,
  challengeType: string
): Promise<string[]> {
  const skillLevels = Array.from(userProgress.skillLevels.values());
  
  switch (challengeType) {
    case 'weakness_addressing':
      return skillLevels
        .filter(skill => skill.currentLevel < 2 || skill.trendDirection === 'declining')
        .map(skill => skill.skillName)
        .slice(0, 2);
    
    case 'strength_advancing':
      return skillLevels
        .filter(skill => skill.currentLevel >= 3 && skill.trendDirection === 'improving')
        .map(skill => skill.skillName)
        .slice(0, 2);
    
    case 'comprehensive':
      return skillLevels
        .sort((a, b) => b.experiencePoints - a.experiencePoints)
        .map(skill => skill.skillName)
        .slice(0, 3);
    
    default: // skill_building
      return skillLevels
        .filter(skill => skill.currentLevel >= 1 && skill.currentLevel <= 3)
        .map(skill => skill.skillName)
        .slice(0, 2);
  }
}

function analyzeUserContext(
  userProgress: UserProgress,
  learningStyle: LearningStyle | null,
  patterns: any[]
): any {
  return {
    skillLevels: userProgress.skillLevels,
    learningVelocity: userProgress.learningVelocity,
    codeQualityTrend: userProgress.codeQualityTrend,
    preferredFeedbackType: learningStyle?.preferredFeedbackType || 'detailed',
    learningPace: learningStyle?.learningPace || 'moderate',
    challengePreference: learningStyle?.challengePreference || 'incremental',
    interactionStyle: learningStyle?.interactionStyle || 'independent',
    motivationFactors: learningStyle?.motivationFactors || [],
    detectedPatterns: patterns.map(p => ({ type: p.patternType, confidence: p.confidence }))
  };
}

function buildPersonalizedChallengePrompt(
  userContext: any,
  targetSkills: string[],
  input: GeneratePersonalizedChallengeInput
): string {
  const skillsText = targetSkills.join(', ');
  const paceText = userContext.learningPace === 'fast' ? 'quick to grasp concepts' : 
                   userContext.learningPace === 'slow' ? 'prefers thorough understanding' : 
                   'learns at a steady pace';
  
  const feedbackPreference = userContext.preferredFeedbackType === 'detailed' ? 'detailed explanations' :
                            userContext.preferredFeedbackType === 'concise' ? 'concise feedback' :
                            userContext.preferredFeedbackType === 'visual' ? 'visual examples' :
                            'example-based learning';

  return `Create a personalized coding challenge for a developer who:
- Is working on: ${skillsText}
- Learning pace: ${paceText}
- Prefers: ${feedbackPreference}
- Challenge preference: ${userContext.challengePreference}
- Interaction style: ${userContext.interactionStyle}
- Challenge type: ${input.challengeType}

The challenge should:
1. Match their learning style and pace
2. Build on their current skill level appropriately
3. Include ${userContext.preferredFeedbackType} hints and guidance
4. Be engaging for someone with ${userContext.interactionStyle} preferences
5. Take approximately ${userContext.learningPace === 'fast' ? '30-45' : userContext.learningPace === 'slow' ? '60-90' : '45-60'} minutes

Generate a complete challenge with:
- Title and description
- Clear coding prompt
- Progressive test cases
- Hints tailored to their learning style
- Learning objectives
- Expected solution approaches`;
}

function parseAIResponse(aiText: string, userContext: any, targetSkills: string[]): any {
  // This is a simplified parser - in a real implementation, you'd use more sophisticated parsing
  const lines = aiText.split('\n').filter(line => line.trim());
  
  const title = extractSection(lines, 'title') || `Personalized ${targetSkills[0]} Challenge`;
  const description = extractSection(lines, 'description') || 'A personalized coding challenge designed for your learning style.';
  const prompt = extractSection(lines, 'prompt') || 'Solve the following problem using your preferred approach.';
  
  const difficulty = determineDifficultyFromContext(userContext, targetSkills);
  const estimatedDuration = userContext.learningPace === 'fast' ? 35 : 
                           userContext.learningPace === 'slow' ? 75 : 50;

  return {
    difficulty,
    estimatedDuration,
    customChallenge: {
      title,
      description,
      prompt,
      expectedApproach: ['Analyze the problem', 'Design solution', 'Implement and test'],
      evaluationCriteria: ['Correctness', 'Code quality', 'Efficiency'],
      hints: generatePersonalizedHints(userContext),
      testCases: generateTestCases(),
      learningObjectives: [`Master ${targetSkills.join(' and ')}`, 'Apply best practices', 'Problem-solving skills']
    }
  };
}

function extractSection(lines: string[], sectionName: string): string | null {
  const sectionIndex = lines.findIndex(line => 
    line.toLowerCase().includes(sectionName.toLowerCase())
  );
  
  if (sectionIndex === -1) return null;
  
  // Get the next few lines as the section content
  const contentLines = lines.slice(sectionIndex + 1, sectionIndex + 4)
    .filter(line => line.trim() && !line.includes(':'));
  
  return contentLines.join(' ').trim() || null;
}

function determineDifficultyFromContext(userContext: any, targetSkills: string[]): 'beginner' | 'intermediate' | 'advanced' | 'expert' {
  const avgLevel = targetSkills.reduce((sum, skill) => {
    const skillLevel = userContext.skillLevels.get(skill);
    return sum + (skillLevel?.currentLevel || 1);
  }, 0) / targetSkills.length;

  if (avgLevel >= 3.5) return 'expert';
  if (avgLevel >= 2.5) return 'advanced';
  if (avgLevel >= 1.5) return 'intermediate';
  return 'beginner';
}

function generatePersonalizedHints(userContext: any): string[] {
  const baseHints = [
    'Start by understanding the problem requirements',
    'Consider the most efficient approach',
    'Test your solution with edge cases'
  ];

  if (userContext.preferredFeedbackType === 'detailed') {
    return [
      'Begin by carefully analyzing each requirement and constraint in the problem statement',
      'Consider multiple solution approaches and evaluate their time and space complexity',
      'Implement your solution step by step, testing each component thoroughly'
    ];
  }

  if (userContext.preferredFeedbackType === 'concise') {
    return [
      'Analyze → Design → Implement',
      'Check edge cases',
      'Optimize if needed'
    ];
  }

  return baseHints;
}

function generateTestCases(): any[] {
  return [
    {
      input: 'example input',
      expectedOutput: 'expected output',
      isHidden: false,
      weight: 1,
      description: 'Basic functionality test'
    },
    {
      input: 'edge case input',
      expectedOutput: 'edge case output',
      isHidden: true,
      weight: 1,
      description: 'Edge case validation'
    }
  ];
}

function createPersonalizationAspects(
  userContext: any,
  learningStyle: LearningStyle | null,
  input: GeneratePersonalizedChallengeInput
): PersonalizationAspect[] {
  const aspects: PersonalizationAspect[] = [];

  aspects.push({
    aspect: 'difficulty_curve',
    value: userContext.challengePreference,
    reason: `Matches user's preference for ${userContext.challengePreference} difficulty progression`
  });

  if (learningStyle?.learningPace) {
    aspects.push({
      aspect: 'time_constraint',
      value: learningStyle.learningPace,
      reason: `Adjusted for ${learningStyle.learningPace} learning pace`
    });
  }

  if (input.includeCollaborativeElements && userContext.interactionStyle === 'collaborative') {
    aspects.push({
      aspect: 'collaboration',
      value: 'enabled',
      reason: 'User prefers collaborative learning experiences'
    });
  }

  return aspects;
}

function generateAdaptiveElements(userContext: any, learningStyle: LearningStyle | null): any {
  return {
    feedbackStyle: userContext.preferredFeedbackType,
    progressTracking: userContext.learningPace === 'fast' ? 'milestone-based' : 'step-by-step',
    nextStepSuggestions: [
      'Review solution approaches',
      'Explore related concepts',
      'Try a more advanced variation'
    ],
    collaborativeOpportunities: userContext.interactionStyle === 'collaborative' ? [
      'Share solution with peers',
      'Join discussion forum',
      'Participate in code review'
    ] : undefined
  };
}

function adjustDurationForUser(baseDuration: number, learningStyle: LearningStyle | null): number {
  if (!learningStyle) return baseDuration;

  switch (learningStyle.learningPace) {
    case 'fast':
      return Math.round(baseDuration * 0.8);
    case 'slow':
      return Math.round(baseDuration * 1.4);
    default:
      return baseDuration;
  }
}

function generatePersonalizedReasoning(
  userContext: any,
  targetSkills: string[],
  challengeType: string
): string {
  const skillsText = targetSkills.join(' and ');
  const paceText = userContext.learningPace === 'fast' ? 'quick learning style' :
                   userContext.learningPace === 'slow' ? 'thorough learning approach' :
                   'steady learning pace';

  return `This challenge is personalized for your ${paceText} and focuses on ${skillsText}. ` +
         `It's designed as a ${challengeType.replace('_', ' ')} challenge that matches your ` +
         `preference for ${userContext.challengePreference} difficulty progression and ` +
         `${userContext.preferredFeedbackType} feedback style.`;
}

function calculateConfidenceScore(userContext: any, targetSkills: string[], challengeData: any): number {
  let confidence = 0.7; // Base confidence

  // Increase confidence based on available user data
  if (userContext.skillLevels.size > 0) confidence += 0.1;
  if (userContext.detectedPatterns.length > 0) confidence += 0.1;
  if (targetSkills.length > 0) confidence += 0.1;

  return Math.min(0.95, confidence);
}