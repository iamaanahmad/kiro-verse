'use server';

/**
 * @fileOverview An AI agent to award a skill badge based on code analysis.
 *
 * - awardSkillBadge - A function that handles the badge awarding process.
 * - AwardSkillBadgeInput - The input type for the awardSkillBadge function.
 * - AwardSkillBadgeOutput - The return type for the awardSkillBadge function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AwardSkillBadgeInputSchema = z.object({
  code: z.string().describe('The code to be analyzed for skill badge awarding.'),
});
export type AwardSkillBadgeInput = z.infer<typeof AwardSkillBadgeInputSchema>;

const AwardSkillBadgeOutputSchema = z.object({
  badgeName: z.string().describe('The name of the skill badge, e.g., "Python Looping" or "JavaScript Promises".'),
  badgeDescription: z.string().describe('A brief description of the achievement.'),
  badgeIcon: z.string().describe('A relevant icon name from the lucide-react library, e.g., "Repeat" or "Code".'),
});
export type AwardSkillBadgeOutput = z.infer<typeof AwardSkillBadgeOutputSchema>;

export async function awardSkillBadge(input: AwardSkillBadgeInput): Promise<AwardSkillBadgeOutput> {
  return awardSkillBadgeFlow(input);
}

const awardSkillBadgePrompt = ai.definePrompt({
  name: 'awardSkillBadgePrompt',
  input: { schema: AwardSkillBadgeInputSchema },
  output: { schema: AwardSkillBadgeOutputSchema },
  prompt: `You are a senior software engineer acting as a code mentor. Analyze the provided code and identify a single, specific, non-trivial programming concept demonstrated within it. Your task is to award a skill badge for this concept.

  Guidelines:
  1.  **Identify a Core Concept:** Look for concepts like asynchronous operations, advanced data structures, error handling, functional programming patterns, etc. Avoid overly simple concepts like "basic syntax" or "variable declaration."
  2.  **Create a Badge Name:** The name should be concise and professional (e.g., "Python Async/Await", "JS Array Manipulation", "Go Concurrency").
  3.  **Write a Description:** The description should clearly state what the user demonstrated.
  4.  **Suggest an Icon:** Choose a relevant and existing icon name from the 'lucide-react' icon library. Examples: 'Repeat' for loops, 'GitMerge' for promises, 'ShieldCheck' for error handling, 'Code' for general use. Ensure the icon exists.

  Code to analyze:
  {{code}}
  `,
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
