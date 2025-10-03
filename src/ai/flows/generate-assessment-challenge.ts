/**
 * @fileOverview AI flow for generating custom assessment challenges
 * 
 * This flow creates coding challenges based on:
 * - Target skills and difficulty level
 * - Job requirements and role expectations
 * - Company-specific needs and preferences
 * - Industry best practices and standards
 */

import { defineFlow, defineSchema, runFlow } from '@genkit-ai/flow';
import { gemini20FlashExp } from '@genkit-ai/googleai';
import { z } from 'zod';
import { AssessmentChallenge, TestCase, AIEvaluationCriteria } from '@/types/employer';

// Input schema for challenge generation
const GenerateAssessmentChallengeInputSchema = defineSchema(
  'GenerateAssessmentChallengeInput',
  z.object({
    targetSkills: z.array(z.string()).describe('Skills to assess (e.g., ["javascript", "algorithms", "react"])'),
    difficultyLevel: z.enum(['beginner', 'intermediate', 'advanced', 'expert']).describe('Challenge difficulty level'),
    jobRole: z.string().optional().describe('Target job role (e.g., "Senior Frontend Developer")'),
    companyContext: z.string().optional().describe('Company context and specific requirements'),
    timeLimit: z.number().optional().describe('Time limit in minutes'),
    focusAreas: z.array(z.string()).optional().describe('Specific areas to focus on (e.g., ["performance", "testing", "error-handling"])'),
    industryDomain: z.string().optional().describe('Industry domain (e.g., "fintech", "healthcare", "e-commerce")'),
    existingChallenges: z.array(z.string()).optional().describe('Titles of existing challenges to avoid duplication')
  })
);

// Output schema for generated challenge
const GeneratedChallengeSchema = defineSchema(
  'GeneratedChallenge',
  z.object({
    title: z.string().describe('Challenge title'),
    description: z.string().describe('Brief description of what the challenge tests'),
    prompt: z.string().describe('Detailed problem statement and requirements'),
    difficulty: z.enum(['beginner', 'intermediate', 'advanced', 'expert']),
    skillsTargeted: z.array(z.string()).describe('Skills this challenge evaluates'),
    timeLimit: z.number().describe('Recommended time limit in minutes'),
    starterCode: z.string().optional().describe('Optional starter code template'),
    testCases: z.array(z.object({
      input: z.string().describe('Test input description or example'),
      expectedOutput: z.string().describe('Expected output description'),
      isHidden: z.boolean().describe('Whether this test case is hidden from candidates'),
      weight: z.number().describe('Weight of this test case (0-1)'),
      description: z.string().describe('Description of what this test case validates')
    })).describe('Test cases for validation'),
    expectedApproach: z.string().describe('Expected solution approach or algorithm'),
    hints: z.array(z.string()).describe('Progressive hints to help candidates'),
    evaluationCriteria: z.array(z.object({
      aspect: z.enum(['code_quality', 'efficiency', 'creativity', 'best_practices', 'problem_solving']),
      weight: z.number().describe('Weight of this aspect (0-1)'),
      description: z.string().describe('What to evaluate for this aspect'),
      evaluationPrompt: z.string().describe('Specific prompt for AI evaluation of this aspect')
    })).describe('AI evaluation criteria'),
    learningObjectives: z.array(z.string()).describe('What candidates should demonstrate'),
    realWorldRelevance: z.string().describe('How this challenge relates to real-world scenarios')
  })
);

type GenerateAssessmentChallengeInput = z.infer<typeof GenerateAssessmentChallengeInputSchema>;
type GeneratedChallenge = z.infer<typeof GeneratedChallengeSchema>;

export const generateAssessmentChallengeFlow = defineFlow(
  {
    name: 'generateAssessmentChallenge',
    inputSchema: GenerateAssessmentChallengeInputSchema,
    outputSchema: GeneratedChallengeSchema,
  },
  async (input: GenerateAssessmentChallengeInput): Promise<GeneratedChallenge> => {
    const {
      targetSkills,
      difficultyLevel,
      jobRole,
      companyContext,
      timeLimit,
      focusAreas,
      industryDomain,
      existingChallenges
    } = input;

    // Build context for challenge generation
    const contextPrompt = buildContextPrompt(input);
    
    // Generate the challenge using AI
    const llmResponse = await gemini20FlashExp.generate({
      prompt: `${contextPrompt}

Generate a coding challenge that meets the following requirements:

CHALLENGE REQUIREMENTS:
- Target Skills: ${targetSkills.join(', ')}
- Difficulty Level: ${difficultyLevel}
- Time Limit: ${timeLimit || 'flexible'} minutes
${jobRole ? `- Job Role: ${jobRole}` : ''}
${companyContext ? `- Company Context: ${companyContext}` : ''}
${focusAreas ? `- Focus Areas: ${focusAreas.join(', ')}` : ''}
${industryDomain ? `- Industry Domain: ${industryDomain}` : ''}
${existingChallenges ? `- Avoid duplicating these existing challenges: ${existingChallenges.join(', ')}` : ''}

CHALLENGE DESIGN PRINCIPLES:
1. Real-world relevance: The challenge should reflect actual problems developers face
2. Skill assessment: Clearly test the specified skills at the appropriate difficulty level
3. Fair evaluation: Include comprehensive test cases and clear evaluation criteria
4. Progressive difficulty: Start accessible but allow for advanced solutions
5. Industry alignment: Match current industry practices and expectations

DIFFICULTY LEVEL GUIDELINES:
- Beginner: Basic syntax, simple algorithms, fundamental concepts
- Intermediate: Data structures, moderate algorithms, design patterns
- Advanced: Complex algorithms, system design, optimization, edge cases
- Expert: Advanced algorithms, architectural decisions, performance optimization

EVALUATION FOCUS:
- Code correctness and functionality
- Algorithm efficiency and optimization
- Code quality and readability
- Best practices and patterns
- Problem-solving approach
- Error handling and edge cases

Please generate a comprehensive coding challenge that includes:
1. A clear, engaging title
2. Detailed problem description with context
3. Specific requirements and constraints
4. Comprehensive test cases (both visible and hidden)
5. Expected solution approach
6. Progressive hints for guidance
7. Detailed evaluation criteria for AI assessment
8. Learning objectives and real-world relevance

The challenge should be engaging, fair, and provide meaningful assessment of the candidate's abilities.`,
      config: {
        temperature: 0.7,
        maxOutputTokens: 4000,
      },
    });

    // Parse and validate the response
    const generatedChallenge = parseAIResponse(llmResponse.text(), input);
    
    // Validate the generated challenge
    validateChallenge(generatedChallenge, input);
    
    return generatedChallenge;
  }
);

/**
 * Build context prompt based on input parameters
 */
function buildContextPrompt(input: GenerateAssessmentChallengeInput): string {
  const { jobRole, companyContext, industryDomain, difficultyLevel } = input;
  
  let context = `You are an expert technical interviewer and assessment designer creating coding challenges for software engineering positions.`;
  
  if (jobRole) {
    context += ` The challenge is for a ${jobRole} position.`;
  }
  
  if (industryDomain) {
    context += ` The company operates in the ${industryDomain} industry.`;
  }
  
  if (companyContext) {
    context += ` Additional company context: ${companyContext}`;
  }
  
  context += ` The challenge should be at ${difficultyLevel} level and assess real-world problem-solving skills.`;
  
  return context;
}

/**
 * Parse AI response and convert to structured challenge
 */
function parseAIResponse(response: string, input: GenerateAssessmentChallengeInput): GeneratedChallenge {
  try {
    // Try to extract JSON from the response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return GeneratedChallengeSchema.parse(parsed);
    }
    
    // If no JSON found, parse manually from structured text
    return parseStructuredResponse(response, input);
  } catch (error) {
    console.error('Failed to parse AI response:', error);
    throw new Error('Failed to generate valid challenge structure');
  }
}

/**
 * Parse structured text response when JSON parsing fails
 */
function parseStructuredResponse(response: string, input: GenerateAssessmentChallengeInput): GeneratedChallenge {
  // This is a fallback parser for when the AI doesn't return valid JSON
  // Extract key information using regex patterns
  
  const titleMatch = response.match(/(?:Title|TITLE):\s*(.+)/i);
  const descriptionMatch = response.match(/(?:Description|DESCRIPTION):\s*(.+)/i);
  const promptMatch = response.match(/(?:Prompt|PROMPT|Problem):\s*([\s\S]*?)(?:\n\n|\n(?=[A-Z]))/i);
  
  // Generate a basic challenge structure
  const challenge: GeneratedChallenge = {
    title: titleMatch?.[1]?.trim() || `${input.targetSkills.join(' & ')} Challenge`,
    description: descriptionMatch?.[1]?.trim() || `Assess ${input.targetSkills.join(', ')} skills`,
    prompt: promptMatch?.[1]?.trim() || generateFallbackPrompt(input),
    difficulty: input.difficultyLevel,
    skillsTargeted: input.targetSkills,
    timeLimit: input.timeLimit || getDifficultyTimeLimit(input.difficultyLevel),
    starterCode: generateStarterCode(input.targetSkills),
    testCases: generateBasicTestCases(),
    expectedApproach: `Solve using ${input.targetSkills.join(' and ')} concepts`,
    hints: generateBasicHints(input.targetSkills),
    evaluationCriteria: generateEvaluationCriteria(),
    learningObjectives: [`Demonstrate ${input.targetSkills.join(', ')} proficiency`],
    realWorldRelevance: `This challenge reflects common ${input.targetSkills.join('/')} development scenarios`
  };
  
  return challenge;
}

/**
 * Generate fallback prompt when AI parsing fails
 */
function generateFallbackPrompt(input: GenerateAssessmentChallengeInput): string {
  const skills = input.targetSkills.join(', ');
  return `Create a solution that demonstrates your ${skills} skills at ${input.difficultyLevel} level. 
Your solution should be efficient, well-structured, and follow best practices.`;
}

/**
 * Get default time limit based on difficulty
 */
function getDifficultyTimeLimit(difficulty: string): number {
  const timeLimits = {
    beginner: 30,
    intermediate: 45,
    advanced: 60,
    expert: 90
  };
  return timeLimits[difficulty as keyof typeof timeLimits] || 45;
}

/**
 * Generate basic starter code template
 */
function generateStarterCode(skills: string[]): string {
  if (skills.includes('javascript') || skills.includes('typescript')) {
    return `function solution() {
  // Your code here
}`;
  }
  
  if (skills.includes('python')) {
    return `def solution():
    # Your code here
    pass`;
  }
  
  return `// Your code here`;
}

/**
 * Generate basic test cases
 */
function generateBasicTestCases(): TestCase[] {
  return [
    {
      testId: 'test1',
      input: 'Basic input case',
      expectedOutput: 'Expected output',
      isHidden: false,
      weight: 1,
      description: 'Basic functionality test'
    },
    {
      testId: 'test2',
      input: 'Edge case input',
      expectedOutput: 'Edge case output',
      isHidden: true,
      weight: 1,
      description: 'Edge case handling test'
    }
  ];
}

/**
 * Generate basic hints
 */
function generateBasicHints(skills: string[]): string[] {
  return [
    `Consider the core ${skills.join('/')} concepts needed`,
    'Think about edge cases and error handling',
    'Focus on code clarity and efficiency'
  ];
}

/**
 * Generate evaluation criteria
 */
function generateEvaluationCriteria(): AIEvaluationCriteria[] {
  return [
    {
      aspect: 'correctness',
      weight: 0.4,
      description: 'Solution correctness and functionality',
      evaluationPrompt: 'Evaluate if the solution correctly solves the problem and handles all test cases'
    },
    {
      aspect: 'code_quality',
      weight: 0.3,
      description: 'Code readability and structure',
      evaluationPrompt: 'Assess code organization, naming conventions, and readability'
    },
    {
      aspect: 'efficiency',
      weight: 0.2,
      description: 'Algorithm efficiency and optimization',
      evaluationPrompt: 'Evaluate time and space complexity of the solution'
    },
    {
      aspect: 'best_practices',
      weight: 0.1,
      description: 'Following language and industry best practices',
      evaluationPrompt: 'Check adherence to coding standards and best practices'
    }
  ];
}

/**
 * Validate generated challenge meets requirements
 */
function validateChallenge(challenge: GeneratedChallenge, input: GenerateAssessmentChallengeInput): void {
  const errors: string[] = [];
  
  // Validate required fields
  if (!challenge.title?.trim()) errors.push('Challenge title is required');
  if (!challenge.prompt?.trim()) errors.push('Challenge prompt is required');
  if (!challenge.testCases?.length) errors.push('At least one test case is required');
  
  // Validate difficulty alignment
  if (challenge.difficulty !== input.difficultyLevel) {
    errors.push(`Challenge difficulty (${challenge.difficulty}) doesn't match requested (${input.difficultyLevel})`);
  }
  
  // Validate skills coverage
  const missingSkills = input.targetSkills.filter(skill => 
    !challenge.skillsTargeted.includes(skill)
  );
  if (missingSkills.length > 0) {
    errors.push(`Challenge doesn't cover required skills: ${missingSkills.join(', ')}`);
  }
  
  // Validate evaluation criteria weights
  const totalWeight = challenge.evaluationCriteria.reduce((sum, criteria) => sum + criteria.weight, 0);
  if (Math.abs(totalWeight - 1) > 0.1) {
    errors.push('Evaluation criteria weights should sum to approximately 1.0');
  }
  
  if (errors.length > 0) {
    throw new Error(`Challenge validation failed: ${errors.join('; ')}`);
  }
}

/**
 * Convert generated challenge to AssessmentChallenge format
 */
export function convertToAssessmentChallenge(
  generated: GeneratedChallenge, 
  challengeId?: string
): AssessmentChallenge {
  return {
    challengeId: challengeId || `challenge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    title: generated.title,
    description: generated.description,
    prompt: generated.prompt,
    difficulty: generated.difficulty,
    skillsTargeted: generated.skillsTargeted,
    timeLimit: generated.timeLimit,
    starterCode: generated.starterCode,
    testCases: generated.testCases.map((tc, index) => ({
      testId: `test_${index + 1}`,
      input: tc.input,
      expectedOutput: tc.expectedOutput,
      isHidden: tc.isHidden,
      weight: tc.weight,
      description: tc.description
    })),
    expectedApproach: generated.expectedApproach,
    hints: generated.hints,
    maxScore: 100,
    weight: 1,
    evaluationMethod: 'ai_assisted',
    aiEvaluationCriteria: generated.evaluationCriteria
  };
}

/**
 * Helper function to run the challenge generation flow
 */
export async function generateCodingChallenge(
  input: GenerateAssessmentChallengeInput
): Promise<AssessmentChallenge> {
  try {
    const generated = await runFlow(generateAssessmentChallengeFlow, input);
    return convertToAssessmentChallenge(generated);
  } catch (error) {
    console.error('Failed to generate coding challenge:', error);
    throw new Error('Failed to generate coding challenge');
  }
}