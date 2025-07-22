'use server';

/**
 * @fileOverview An AI agent to provide code feedback using Gemini 2.0 Flash.
 *
 * - getCodeFeedback - A function that handles the code feedback process.
 * - GetCodeFeedbackInput - The input type for the getCodeFeedback function.
 * - GetCodeFeedbackOutput - The return type for the getCodeFeedback function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GetCodeFeedbackInputSchema = z.object({
  code: z.string().describe('The code to be reviewed.'),
});
export type GetCodeFeedbackInput = z.infer<typeof GetCodeFeedbackInputSchema>;

const GetCodeFeedbackOutputSchema = z.object({
  feedback: z.string().describe('The AI-generated feedback for the provided code.'),
});
export type GetCodeFeedbackOutput = z.infer<typeof GetCodeFeedbackOutputSchema>;

export async function getCodeFeedback(input: GetCodeFeedbackInput): Promise<GetCodeFeedbackOutput> {
  return getCodeFeedbackFlow(input);
}

const getCodeFeedbackPrompt = ai.definePrompt({
  name: 'getCodeFeedbackPrompt',
  input: { schema: GetCodeFeedbackInputSchema },
  output: { schema: GetCodeFeedbackOutputSchema },
  prompt: `You are Kiro, an AI code mentor. Review the following code and provide feedback on code quality, identify errors, and suggest improvements.\n\nCode:\n\n{{code}}`,
});

const getCodeFeedbackFlow = ai.defineFlow(
  {
    name: 'getCodeFeedbackFlow',
    inputSchema: GetCodeFeedbackInputSchema,
    outputSchema: GetCodeFeedbackOutputSchema,
  },
  async input => {
    const { output } = await getCodeFeedbackPrompt(input);
    return output!;
  }
);
