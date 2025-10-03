'use server';

/**
 * @fileOverview An AI agent to analyze code and determine if a skill badge should be awarded.
 *
 * - awardSkillBadge - A function that analyzes code and determines badge eligibility.
 * - AwardSkillBadgeInput - The input type for the awardSkillBadge function.
 * - AwardSkillBadgeOutput - The return type for the awardSkillBadge function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { SkillProgressTracker } from '@/lib/analytics/skill-progress-tracker';
import { UserProgressService, LearningInsightsService } from '@/lib/firebase/analytics';
import type { SkillLevel, LearningInsight } from '@/types/analytics';

const AwardSkillBadgeInputSchema = z.object({
  code: z.string().describe('The code to be analyzed for skill demonstration.'),
  userId: z.string().optional().describe('The user ID for analytics and progression tracking.'),
  context: z.string().optional().describe('Additional context about the code submission.'),
  enableAnalytics: z.boolean().optional().default(true).describe('Whether to track skill progression and analytics.'),
  previousSkillLevel: z.number().optional().describe('The user\'s previous skill level for this badge.'),
});
export type AwardSkillBadgeInput = z.infer<typeof AwardSkillBadgeInputSchema>;

const AwardSkillBadgeOutputSchema = z.object({
  badgeName: z.string().describe('The name of the skill badge to award, e.g., "JavaScript Promises".'),
  badgeDescription: z.string().describe('A description of the skill demonstrated in the code.'),
  skillLevel: z.number().optional().describe('The calculated skill level for this badge (1-4).'),
  experiencePoints: z.number().optional().describe('Experience points earned for this skill demonstration.'),
  isLevelUp: z.boolean().optional().describe('Whether this badge award represents a level increase.'),
  previousLevel: z.number().optional().describe('The previous skill level before this award.'),
  skillProgression: z.object({
    improvementAreas: z.array(z.string()),
    strengths: z.array(z.string()),
    nextMilestones: z.array(z.string()),
  }).optional().describe('Detailed skill progression analysis.'),
  analyticsSessionId: z.string().optional().describe('Session ID for analytics tracking.'),
  verificationStatus: z.enum(['verified', 'pending', 'unverified']).optional().describe('Blockchain verification status.'),
});
export type AwardSkillBadgeOutput = z.infer<typeof AwardSkillBadgeOutputSchema>;

export async function awardSkillBadge(input: AwardSkillBadgeInput): Promise<AwardSkillBadgeOutput> {
  return awardSkillBadgeFlow(input);
}

const awardSkillBadgePrompt = ai.definePrompt({
  name: 'awardSkillBadgePrompt',
  input: { schema: AwardSkillBadgeInputSchema },
  output: { schema: AwardSkillBadgeOutputSchema },
  prompt: `You are Kiro, an AI code mentor that awards skill badges for demonstrated programming abilities and tracks skill progression.

Analyze the following code and determine what specific programming skill is being demonstrated. Look for:
- Language-specific features (JavaScript, TypeScript, Python, etc.)
- Framework usage (React, Next.js, Express, etc.)
- Programming concepts (Async/Await, Error Handling, Design Patterns)
- Best practices (Code Quality, Testing, Documentation)
- Code complexity and sophistication level

Skill Level Assessment (1-4):
- Level 1 (Beginner): Basic syntax usage, simple implementations
- Level 2 (Intermediate): Proper patterns, some best practices
- Level 3 (Advanced): Complex implementations, multiple concepts combined
- Level 4 (Expert): Sophisticated patterns, exceptional code quality

Experience Points Calculation:
- Base points: 10-50 based on code complexity
- Quality bonus: +10-30 for clean, well-structured code
- Innovation bonus: +5-20 for creative or advanced approaches

Only award a badge if the code genuinely demonstrates the skill, not just mentions it.

Code to analyze:
{{code}}

{{#if context}}
Context: {{context}}
{{/if}}

{{#if previousSkillLevel}}
Previous skill level for this badge: {{previousSkillLevel}}
{{/if}}

Respond with a specific skill name, description, and progression analysis. Examples:
- "JavaScript Promises" for code using Promise.then() or async/await
- "React Hooks" for code using useState, useEffect, etc.
- "Error Handling" for code with proper try/catch blocks
- "TypeScript Interfaces" for code defining and using interfaces`,
});

const awardSkillBadgeFlow = ai.defineFlow(
  {
    name: 'awardSkillBadgeFlow',
    inputSchema: AwardSkillBadgeInputSchema,
    outputSchema: AwardSkillBadgeOutputSchema,
  },
  async input => {
    const { code, userId, context, enableAnalytics, previousSkillLevel } = input;
    
    // Get enhanced AI analysis with skill progression
    const { output } = await awardSkillBadgePrompt(input);
    
    // If analytics are enabled and userId is provided, track skill progression
    if (enableAnalytics && userId) {
      try {
        // Analyze code submission for comprehensive skill tracking
        const analyticsData = await SkillProgressTracker.analyzeCodeSubmission(
          userId,
          code,
          context || 'Badge award analysis',
          {
            enableRealTimeAnalysis: true,
            generateInsights: true,
            updateBenchmarks: true,
            trackLearningVelocity: true
          }
        );

        // Calculate skill progression details
        const skillProgression = await calculateSkillProgression(
          userId,
          output!.badgeName,
          analyticsData,
          previousSkillLevel
        );

        // Generate badge-specific learning insights
        const badgeInsights = await generateBadgeInsights(
          userId,
          output!.badgeName,
          output!.badgeDescription,
          skillProgression,
          analyticsData
        );

        // Save badge insights
        for (const insight of badgeInsights) {
          await LearningInsightsService.saveLearningInsight(insight);
        }

        // Create analytics event for badge awarding
        await createBadgeAnalyticsEvent(
          userId,
          output!.badgeName,
          skillProgression,
          analyticsData.sessionId
        );

        // Return enhanced response with progression data
        return {
          ...output!,
          skillLevel: skillProgression.newLevel,
          experiencePoints: skillProgression.experienceGained,
          isLevelUp: skillProgression.isLevelUp,
          previousLevel: skillProgression.previousLevel,
          skillProgression: {
            improvementAreas: skillProgression.improvementAreas,
            strengths: skillProgression.strengths,
            nextMilestones: skillProgression.nextMilestones,
          },
          analyticsSessionId: analyticsData.sessionId,
          verificationStatus: 'pending', // Will be updated when blockchain verification completes
        };
      } catch (error) {
        console.error('Error tracking badge analytics:', error);
        // Return basic response if analytics fail
        return output!;
      }
    }
    
    return output!;
  }
);

/**
 * Calculates detailed skill progression for badge awarding
 */
async function calculateSkillProgression(
  userId: string,
  badgeName: string,
  analyticsData: any,
  previousSkillLevel?: number
): Promise<{
  previousLevel: number;
  newLevel: number;
  experienceGained: number;
  isLevelUp: boolean;
  improvementAreas: string[];
  strengths: string[];
  nextMilestones: string[];
}> {
  // Get current user progress
  const userProgress = await UserProgressService.getUserProgress(userId);
  const currentSkill = userProgress?.skillLevels.get(badgeName);
  
  const previousLevel = previousSkillLevel || currentSkill?.currentLevel || 0;
  const baseExperience = calculateBaseExperience(analyticsData.aiAnalysis);
  const qualityBonus = calculateQualityBonus(analyticsData.aiAnalysis);
  const experienceGained = baseExperience + qualityBonus;
  
  // Calculate new level based on total experience
  const totalExperience = (currentSkill?.experiencePoints || 0) + experienceGained;
  const newLevel = calculateLevelFromExperience(totalExperience);
  const isLevelUp = newLevel > previousLevel;
  
  // Analyze strengths and improvement areas
  const strengths = identifyStrengths(analyticsData.aiAnalysis);
  const improvementAreas = identifyImprovementAreas(analyticsData.aiAnalysis);
  const nextMilestones = generateNextMilestones(badgeName, newLevel);
  
  return {
    previousLevel,
    newLevel,
    experienceGained,
    isLevelUp,
    improvementAreas,
    strengths,
    nextMilestones,
  };
}

/**
 * Generates learning insights specific to badge awards
 */
async function generateBadgeInsights(
  userId: string,
  badgeName: string,
  badgeDescription: string,
  skillProgression: any,
  analyticsData: any
): Promise<LearningInsight[]> {
  const insights: LearningInsight[] = [];
  const timestamp = new Date();
  
  // Level up insight
  if (skillProgression.isLevelUp) {
    insights.push({
      id: `insight_${Date.now()}_levelup`,
      userId,
      type: 'strength',
      category: 'Skill Progression',
      title: `Level Up: ${badgeName}`,
      description: `Congratulations! You've advanced to level ${skillProgression.newLevel} in ${badgeName}. ${badgeDescription}`,
      actionableSteps: skillProgression.nextMilestones,
      confidenceScore: 0.95,
      priority: 'high',
      isRead: false,
      createdAt: timestamp
    });
  }
  
  // Strength recognition insight
  if (skillProgression.strengths.length > 0) {
    insights.push({
      id: `insight_${Date.now()}_strength`,
      userId,
      type: 'strength',
      category: badgeName,
      title: `Strong ${badgeName} Skills Demonstrated`,
      description: `Your code shows excellent understanding of ${badgeName} concepts.`,
      actionableSteps: [
        'Continue applying these skills in more complex scenarios',
        'Consider mentoring others in this area',
        'Explore advanced patterns and techniques'
      ],
      confidenceScore: 0.85,
      priority: 'medium',
      isRead: false,
      createdAt: timestamp
    });
  }
  
  // Improvement opportunity insight
  if (skillProgression.improvementAreas.length > 0) {
    insights.push({
      id: `insight_${Date.now()}_improvement`,
      userId,
      type: 'improvement_area',
      category: badgeName,
      title: `${badgeName} Enhancement Opportunities`,
      description: `While you've earned the ${badgeName} badge, there are areas for further growth.`,
      actionableSteps: skillProgression.improvementAreas.map(area => `Focus on improving: ${area}`),
      confidenceScore: 0.8,
      priority: 'medium',
      isRead: false,
      createdAt: timestamp
    });
  }
  
  return insights;
}

/**
 * Creates an analytics event for badge awarding
 */
async function createBadgeAnalyticsEvent(
  userId: string,
  badgeName: string,
  skillProgression: any,
  sessionId: string
): Promise<void> {
  // This would typically create a specific analytics event
  // For now, we'll log the event for tracking purposes
  console.log('Badge Analytics Event:', {
    userId,
    badgeName,
    skillProgression,
    sessionId,
    timestamp: new Date().toISOString(),
    eventType: 'badge_awarded'
  });
}

// Helper functions for skill progression calculations

function calculateBaseExperience(aiAnalysis: any): number {
  const complexity = (aiAnalysis.codeQuality + aiAnalysis.efficiency + aiAnalysis.creativity) / 3;
  return Math.round(10 + (complexity / 100) * 40); // 10-50 base points
}

function calculateQualityBonus(aiAnalysis: any): number {
  const qualityScore = aiAnalysis.bestPractices;
  if (qualityScore > 90) return 30;
  if (qualityScore > 80) return 20;
  if (qualityScore > 70) return 10;
  return 0;
}

function calculateLevelFromExperience(experience: number): number {
  if (experience >= 1500) return 4; // Expert
  if (experience >= 500) return 3;  // Advanced
  if (experience >= 100) return 2;  // Intermediate
  return 1; // Beginner
}

function identifyStrengths(aiAnalysis: any): string[] {
  const strengths: string[] = [];
  
  if (aiAnalysis.codeQuality > 80) strengths.push('Clean, readable code structure');
  if (aiAnalysis.efficiency > 80) strengths.push('Efficient algorithm implementation');
  if (aiAnalysis.creativity > 80) strengths.push('Creative problem-solving approach');
  if (aiAnalysis.bestPractices > 80) strengths.push('Strong adherence to best practices');
  
  return strengths;
}

function identifyImprovementAreas(aiAnalysis: any): string[] {
  const areas: string[] = [];
  
  if (aiAnalysis.codeQuality < 70) areas.push('Code organization and readability');
  if (aiAnalysis.efficiency < 70) areas.push('Algorithm efficiency and performance');
  if (aiAnalysis.bestPractices < 70) areas.push('Following established best practices');
  
  return areas;
}

function generateNextMilestones(badgeName: string, currentLevel: number): string[] {
  const milestones: string[] = [];
  
  switch (currentLevel) {
    case 1:
      milestones.push(`Practice more ${badgeName} examples`);
      milestones.push('Learn advanced patterns and techniques');
      milestones.push('Apply skills in larger projects');
      break;
    case 2:
      milestones.push(`Master complex ${badgeName} scenarios`);
      milestones.push('Combine with other advanced concepts');
      milestones.push('Optimize for performance and maintainability');
      break;
    case 3:
      milestones.push(`Become an expert in ${badgeName}`);
      milestones.push('Mentor others and share knowledge');
      milestones.push('Contribute to open source projects');
      break;
    case 4:
      milestones.push('Continue pushing the boundaries');
      milestones.push('Innovate new approaches and patterns');
      milestones.push('Lead technical discussions and decisions');
      break;
  }
  
  return milestones;
}