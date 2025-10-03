'use server';

/**
 * @fileOverview An AI agent to generate personalized coding challenges based on user skill level and learning goals.
 *
 * - generateCodingChallenge - A function that creates AI-powered coding challenges.
 * - GenerateCodingChallengeInput - The input type for the generateCodingChallenge function.
 * - GenerateCodingChallengeOutput - The return type for the generateCodingChallenge function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { ChallengeDifficultyClassifier, DifficultyMetrics } from '@/lib/challenges/difficulty-classifier';
import { ChallengeService, AnalyticsUtils } from '@/lib/firebase/analytics';
import { UserProgressService } from '@/lib/firebase/analytics';
import type { Challenge, EvaluationCriteria } from '@/types/analytics';

const GenerateCodingChallengeInputSchema = z.object({
  userId: z.string().optional().describe('The user ID for personalized challenge generation.'),
  targetSkills: z.array(z.string()).describe('Skills to target in the challenge (e.g., ["javascript", "algorithms"]).'),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced', 'expert']).optional().describe('Desired difficulty level. If not provided, will be determined based on user skill level.'),
  category: z.string().optional().describe('Challenge category (e.g., "algorithms", "web-development", "data-structures").'),
  timeLimit: z.number().optional().describe('Time limit for the challenge in minutes.'),
  includeHints: z.boolean().optional().default(true).describe('Whether to include hints in the challenge.'),
  adaptToPreviousPerformance: z.boolean().optional().default(true).describe('Whether to adapt difficulty based on user\'s previous performance.'),
  challengeType: z.enum(['coding', 'debugging', 'optimization', 'design']).optional().default('coding').describe('Type of challenge to generate.'),
});
export type GenerateCodingChallengeInput = z.infer<typeof GenerateCodingChallengeInputSchema>;

const GenerateCodingChallengeOutputSchema = z.object({
  challenge: z.object({
    title: z.string().describe('The challenge title.'),
    description: z.string().describe('Detailed challenge description.'),
    prompt: z.string().describe('The coding prompt for the user.'),
    difficulty: z.enum(['beginner', 'intermediate', 'advanced', 'expert']).describe('Final difficulty level.'),
    estimatedDuration: z.number().describe('Estimated completion time in minutes.'),
    skillsTargeted: z.array(z.string()).describe('Skills this challenge targets.'),
    category: z.string().describe('Challenge category.'),
    tags: z.array(z.string()).describe('Relevant tags for the challenge.'),
    learningObjectives: z.array(z.string()).describe('What the user will learn from this challenge.'),
    prerequisites: z.array(z.string()).describe('Required knowledge or skills.'),
  }),
  testCases: z.array(z.object({
    input: z.string().describe('Test case input.'),
    expectedOutput: z.string().describe('Expected output for the test case.'),
    isHidden: z.boolean().describe('Whether this test case is hidden from the user.'),
    description: z.string().optional().describe('Description of what this test case validates.'),
  })).describe('Test cases to validate the solution.'),
  hints: z.array(z.string()).describe('Progressive hints to help the user.'),
  evaluationCriteria: z.array(z.object({
    name: z.string().describe('Criteria name (e.g., "Correctness", "Efficiency").'),
    weight: z.number().describe('Weight of this criteria (0-1, should sum to 1).'),
    description: z.string().describe('What this criteria evaluates.'),
  })).describe('How the solution will be evaluated.'),
  difficultyAnalysis: z.object({
    score: z.number().describe('Difficulty score (0-100).'),
    reasoning: z.array(z.string()).describe('Reasons for the difficulty classification.'),
    recommendedSkillLevel: z.number().describe('Recommended user skill level (1-10).'),
  }).describe('Analysis of the challenge difficulty.'),
  adaptationNotes: z.string().optional().describe('Notes on how the challenge was adapted for the user.'),
});
export type GenerateCodingChallengeOutput = z.infer<typeof GenerateCodingChallengeOutputSchema>;

export async function generateCodingChallenge(input: GenerateCodingChallengeInput): Promise<GenerateCodingChallengeOutput> {
  return generateCodingChallengeFlow(input);
}

const generateCodingChallengePrompt = ai.definePrompt({
  name: 'generateCodingChallengePrompt',
  input: { schema: GenerateCodingChallengeInputSchema },
  output: { schema: GenerateCodingChallengeOutputSchema },
  prompt: `You are Kiro, an AI coding mentor that creates personalized coding challenges to help developers improve their skills.

Create a coding challenge that:
- Targets the specified skills: {{targetSkills}}
- Matches the difficulty level: {{difficulty}}
- Fits the category: {{category}}
- Is appropriate for the challenge type: {{challengeType}}

Challenge Requirements:
1. **Clear and Engaging**: The challenge should have a clear problem statement that's interesting to solve
2. **Educational Value**: Focus on teaching specific programming concepts and skills
3. **Progressive Difficulty**: Include multiple test cases that increase in complexity
4. **Real-world Relevance**: Connect to practical programming scenarios when possible
5. **Comprehensive Testing**: Include both visible and hidden test cases

Difficulty Guidelines:
- **Beginner**: Basic syntax, simple logic, 1-2 concepts, 15-30 minutes
- **Intermediate**: Multiple concepts, moderate complexity, error handling, 30-60 minutes  
- **Advanced**: Complex algorithms, optimization, design patterns, 60-120 minutes
- **Expert**: Sophisticated solutions, multiple approaches, system design, 120+ minutes

Challenge Types:
- **Coding**: Write a function/program from scratch
- **Debugging**: Fix broken code with specific issues
- **Optimization**: Improve existing code for performance/readability
- **Design**: Architect a solution with multiple components

Test Case Strategy:
- Start with simple, obvious cases
- Include edge cases (empty inputs, boundary values)
- Add complex scenarios that test full understanding
- Hide some test cases to prevent hardcoding solutions

Evaluation Criteria (should sum to 1.0):
- Correctness (0.4-0.6): Does the solution work?
- Efficiency (0.2-0.3): Is it optimized appropriately?
- Code Quality (0.1-0.2): Is it clean and readable?
- Best Practices (0.1-0.2): Follows language conventions?

{{#if includeHints}}
Provide 3-5 progressive hints that guide without giving away the solution.
{{/if}}

{{#if timeLimit}}
Target completion time: {{timeLimit}} minutes
{{/if}}

Generate a complete, well-structured coding challenge that will help the user learn and grow their programming skills.`,
});

const generateCodingChallengeFlow = ai.defineFlow(
  {
    name: 'generateCodingChallengeFlow',
    inputSchema: GenerateCodingChallengeInputSchema,
    outputSchema: GenerateCodingChallengeOutputSchema,
  },
  async input => {
    const { 
      userId, 
      targetSkills, 
      difficulty: requestedDifficulty, 
      category, 
      timeLimit,
      adaptToPreviousPerformance
    } = input;
    
    // Determine optimal difficulty based on user's skill level
    let finalDifficulty = requestedDifficulty;
    let adaptationNotes = '';
    
    if (userId && adaptToPreviousPerformance) {
      try {
        const userProgress = await UserProgressService.getUserProgress(userId);
        if (userProgress) {
          // Suggest difficulty based on user's skill levels
          const suggestedDifficulty = ChallengeDifficultyClassifier.suggestDifficultyForUser(
            userProgress.skillLevels,
            targetSkills
          );
          
          if (!requestedDifficulty) {
            finalDifficulty = suggestedDifficulty;
            adaptationNotes = `Difficulty adapted to ${suggestedDifficulty} based on your current skill levels in ${targetSkills.join(', ')}.`;
          } else if (requestedDifficulty !== suggestedDifficulty) {
            adaptationNotes = `You requested ${requestedDifficulty} difficulty. Based on your skills, we recommend ${suggestedDifficulty} level challenges.`;
          }
          
          // Adapt based on recent performance if available
          const recentScores = await getRecentChallengeScores(userId, targetSkills);
          if (recentScores.length >= 3) {
            const averageScore = recentScores.reduce((sum, score) => sum + score, 0) / recentScores.length;
            const successRate = recentScores.filter(score => score >= 70).length / recentScores.length;
            
            const adaptedDifficulty = ChallengeDifficultyClassifier.adaptDifficultyBasedOnPerformance(
              finalDifficulty || suggestedDifficulty,
              recentScores,
              successRate
            );
            
            if (adaptedDifficulty !== (finalDifficulty || suggestedDifficulty)) {
              finalDifficulty = adaptedDifficulty;
              adaptationNotes += ` Difficulty further adjusted to ${adaptedDifficulty} based on your recent performance (avg: ${Math.round(averageScore)}%, success rate: ${Math.round(successRate * 100)}%).`;
            }
          }
        }
      } catch (error) {
        console.error('Error adapting challenge difficulty:', error);
        // Continue with requested difficulty if adaptation fails
      }
    }
    
    // Set default difficulty if still not determined
    if (!finalDifficulty) {
      finalDifficulty = 'intermediate';
    }
    
    // Generate the challenge using AI
    const enhancedInput = {
      ...input,
      difficulty: finalDifficulty,
      category: category || inferCategoryFromSkills(targetSkills),
    };
    
    const { output } = await generateCodingChallengePrompt(enhancedInput);
    
    if (!output) {
      throw new Error('Failed to generate challenge');
    }
    
    // Analyze and validate the generated challenge difficulty
    const difficultyMetrics = analyzeChallengeComplexity(output.challenge, output.testCases);
    const difficultyClassification = ChallengeDifficultyClassifier.classifyDifficulty(difficultyMetrics);
    
    // Create and store the challenge if user ID is provided
    if (userId) {
      try {
        const challengeId = AnalyticsUtils.generateChallengeId();
        const challenge: Challenge = {
          challengeId,
          title: output.challenge.title,
          description: output.challenge.description,
          difficulty: output.challenge.difficulty,
          skillsTargeted: output.challenge.skillsTargeted,
          timeLimit: timeLimit || output.challenge.estimatedDuration,
          evaluationCriteria: output.evaluationCriteria.map((criteria) => ({
            criteriaId: `criteria_${Math.random().toString(36).substr(2, 9)}`,
            name: criteria.name,
            weight: criteria.weight,
            description: criteria.description,
            maxScore: 100,
          })),
          createdBy: 'ai',
          isActive: true,
          prompt: output.challenge.prompt,
          testCases: output.testCases.map((testCase) => ({
            input: testCase.input,
            expectedOutput: testCase.expectedOutput,
            isHidden: testCase.isHidden,
            weight: testCase.isHidden ? 0.3 : 0.7, // Hidden tests worth less
            description: testCase.description,
          })),
          hints: output.hints,
          tags: output.challenge.tags,
          category: output.challenge.category,
          estimatedDuration: output.challenge.estimatedDuration,
          prerequisites: output.challenge.prerequisites,
          learningObjectives: output.challenge.learningObjectives,
          createdAt: new Date(),
          updatedAt: new Date(),
          creatorId: 'ai-system',
          participantCount: 0,
          averageScore: 0,
          successRate: 0,
        };
        
        await ChallengeService.createChallenge(challenge);
        console.log(`Generated and stored challenge: ${challengeId}`);
      } catch (error) {
        console.error('Error storing generated challenge:', error);
        // Continue without storing if there's an error
      }
    }
    
    return {
      ...output,
      difficultyAnalysis: {
        score: difficultyClassification.score,
        reasoning: difficultyClassification.reasoning,
        recommendedSkillLevel: difficultyClassification.recommendedSkillLevel,
      },
      adaptationNotes: adaptationNotes || undefined,
    };
  }
);

/**
 * Gets recent challenge scores for a user in specific skill areas
 */
async function getRecentChallengeScores(_userId: string, _targetSkills: string[]): Promise<number[]> {
  try {
    // This would typically query the user's recent challenge submissions
    // For now, return empty array - this will be implemented when we have submission data
    return [];
  } catch (error) {
    console.error('Error fetching recent challenge scores:', error);
    return [];
  }
}

/**
 * Infers challenge category from target skills
 */
function inferCategoryFromSkills(targetSkills: string[]): string {
  const skillCategories: { [key: string]: string[] } = {
    'algorithms': ['algorithms', 'data-structures', 'sorting', 'searching', 'recursion'],
    'web-development': ['javascript', 'typescript', 'react', 'html', 'css', 'node.js'],
    'backend': ['node.js', 'express', 'database', 'api', 'server'],
    'frontend': ['react', 'vue', 'angular', 'html', 'css', 'ui'],
    'data-science': ['python', 'pandas', 'numpy', 'machine-learning', 'statistics'],
    'mobile': ['react-native', 'flutter', 'ios', 'android', 'mobile'],
    'devops': ['docker', 'kubernetes', 'ci-cd', 'deployment', 'infrastructure'],
  };
  
  for (const [category, skills] of Object.entries(skillCategories)) {
    if (targetSkills.some(skill => skills.includes(skill.toLowerCase()))) {
      return category;
    }
  }
  
  return 'general-programming';
}

/**
 * Analyzes the complexity of a generated challenge
 */
function analyzeChallengeComplexity(challenge: any, _testCases: any[]): DifficultyMetrics {
  // Estimate complexity based on challenge characteristics
  const conceptComplexity = estimateConceptComplexity(challenge);
  const codeLength = estimateCodeLength(challenge);
  const algorithmicComplexity = estimateAlgorithmicComplexity(challenge);
  const prerequisiteCount = challenge.prerequisites?.length || 0;
  const timeComplexity = estimateTimeComplexity(challenge);
  const domainSpecificity = estimateDomainSpecificity(challenge);
  
  return {
    conceptComplexity,
    codeLength,
    algorithmicComplexity,
    prerequisiteCount,
    timeComplexity,
    domainSpecificity,
  };
}

function estimateConceptComplexity(challenge: any): number {
  const difficultyMap = {
    'beginner': 2,
    'intermediate': 5,
    'advanced': 7,
    'expert': 9
  };
  
  let complexity = difficultyMap[challenge.difficulty as keyof typeof difficultyMap] || 5;
  
  // Adjust based on learning objectives count
  if (challenge.learningObjectives?.length > 3) complexity += 1;
  if (challenge.skillsTargeted?.length > 2) complexity += 1;
  
  return Math.min(complexity, 10);
}

function estimateCodeLength(challenge: any): number {
  const difficultyMap = {
    'beginner': 30,
    'intermediate': 80,
    'advanced': 150,
    'expert': 250
  };
  
  return difficultyMap[challenge.difficulty as keyof typeof difficultyMap] || 80;
}

function estimateAlgorithmicComplexity(challenge: any): number {
  const description = challenge.description?.toLowerCase() || '';
  const prompt = challenge.prompt?.toLowerCase() || '';
  const text = description + ' ' + prompt;
  
  let complexity = 3; // Default
  
  if (text.includes('sort') || text.includes('search')) complexity += 2;
  if (text.includes('recursive') || text.includes('dynamic programming')) complexity += 3;
  if (text.includes('graph') || text.includes('tree')) complexity += 2;
  if (text.includes('optimize') || text.includes('efficient')) complexity += 2;
  if (text.includes('algorithm') || text.includes('complexity')) complexity += 1;
  
  return Math.min(complexity, 10);
}

function estimateTimeComplexity(challenge: any): string {
  const algorithmicComplexity = estimateAlgorithmicComplexity(challenge);
  
  if (algorithmicComplexity <= 3) return 'O(n)';
  if (algorithmicComplexity <= 5) return 'O(n log n)';
  if (algorithmicComplexity <= 7) return 'O(n²)';
  return 'O(2^n)';
}

function estimateDomainSpecificity(challenge: any): number {
  const skills = challenge.skillsTargeted || [];
  const generalSkills = ['javascript', 'python', 'algorithms', 'data-structures'];
  const specificSkills = skills.filter((skill: string) => !generalSkills.includes(skill.toLowerCase()));
  
  return Math.min(specificSkills.length * 2 + 1, 10);
}