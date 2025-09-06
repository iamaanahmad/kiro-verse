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

const AwardSkillBadgeInputSchema = z.object({
  code: z.string().describe('The code to be analyzed for skill demonstration.'),
});
export type AwardSkillBadgeInput = z.infer<typeof AwardSkillBadgeInputSchema>;

const AwardSkillBadgeOutputSchema = z.object({
  badgeName: z.string().describe('The name of the skill badge to award, e.g., "JavaScript Promises".'),
  badgeDescription: z.string().describe('A description of the skill demonstrated in the code.'),
});
export type AwardSkillBadgeOutput = z.infer<typeof AwardSkillBadgeOutputSchema>;

export async function awardSkillBadge(input: AwardSkillBadgeInput): Promise<AwardSkillBadgeOutput> {
  return awardSkillBadgeFlow(input);
}

const awardSkillBadgePrompt = ai.definePrompt({
  name: 'awardSkillBadgePrompt',
  input: { schema: AwardSkillBadgeInputSchema },
  output: { schema: AwardSkillBadgeOutputSchema },
  prompt: `You are Kiro, an AI code mentor that awards skill badges for demonstrated programming abilities.

Analyze the following code and determine what specific programming skill is being demonstrated. Look for:
- Language-specific features (JavaScript, TypeScript, Python, etc.)
- Framework usage (React, Next.js, Express, etc.)
- Programming concepts (Async/Await, Error Handling, Design Patterns)
- Best practices (Code Quality, Testing, Documentation)

Only award a badge if the code genuinely demonstrates the skill, not just mentions it.

Code to analyze:
{{code}}

Respond with a specific skill name and description. Examples:
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
    const { output } = await awardSkillBadgePrompt(input);
    return output!;
  }
);