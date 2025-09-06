'use server';

/**
 * @fileOverview A Genkit flow to generate a unique icon for a skill badge.
 *
 * - generateBadgeIcon - A function that generates an image based on a badge name.
 * - GenerateBadgeIconInput - The input type for the generateBadgeIcon function.
 * - GenerateBadgeIconOutput - The return type for the generateBadgeIcon function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateBadgeIconInputSchema = z.object({
  badgeName: z.string().describe('The name of the skill badge, e.g., "JavaScript Promises".'),
});
export type GenerateBadgeIconInput = z.infer<typeof GenerateBadgeIconInputSchema>;

const GenerateBadgeIconOutputSchema = z.object({
  iconDataUri: z.string().describe('The generated image for the badge as a data URI.'),
});
export type GenerateBadgeIconOutput = z.infer<typeof GenerateBadgeIconOutputSchema>;

export async function generateBadgeIcon(input: GenerateBadgeIconInput): Promise<GenerateBadgeIconOutput> {
  return generateBadgeIconFlow(input);
}

const generateBadgeIconFlow = ai.defineFlow(
  {
    name: 'generateBadgeIconFlow',
    inputSchema: GenerateBadgeIconInputSchema,
    outputSchema: GenerateBadgeIconOutputSchema,
  },
  async ({ badgeName }) => {
    const { media } = await ai.generate({
      model: 'googleai/gemini-2.0-flash-preview-image-generation',
      prompt: `Generate a vector-style, minimalist, circular icon for a software engineering skill badge. The badge is for "${badgeName}". The icon should be simple, symbolic, and suitable for a small badge. Use a dark, futuristic theme with vibrant accent colors.`,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    if (!media || !media.url) {
      throw new Error('Failed to generate badge icon.');
    }

    return { iconDataUri: media.url };
  }
);
