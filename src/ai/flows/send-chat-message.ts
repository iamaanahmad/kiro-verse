'use server';

/**
 * @fileOverview An AI agent to send chat messages to Kiro (simulated via Gemini) and receive helpful answers about code.
 *
 * - sendChatMessage - A function that handles sending chat messages and receiving responses.
 * - SendChatMessageInput - The input type for the sendChatMessage function.
 * - SendChatMessageOutput - The return type for the sendChatMessage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SendChatMessageInputSchema = z.object({
  code: z.string().describe('The code content to analyze.'),
  query: z.string().describe('The user query or message about the code.'),
});
export type SendChatMessageInput = z.infer<typeof SendChatMessageInputSchema>;

const SendChatMessageOutputSchema = z.object({
  aiResponse: z.string().describe('The AI response to the user query.'),
});
export type SendChatMessageOutput = z.infer<typeof SendChatMessageOutputSchema>;

export async function sendChatMessage(input: SendChatMessageInput): Promise<SendChatMessageOutput> {
  return sendChatMessageFlow(input);
}

const prompt = ai.definePrompt({
  name: 'sendChatMessagePrompt',
  input: {schema: SendChatMessageInputSchema},
  output: {schema: SendChatMessageOutputSchema},
  prompt: `You are Kiro, an AI code mentor. A user has provided the following code and asked a question. Use the code to provide a helpful answer to the question. Only respond to the question, do not write any extra text.

Code:
{{code}}

Question:
{{query}}`,
});

const sendChatMessageFlow = ai.defineFlow(
  {
    name: 'sendChatMessageFlow',
    inputSchema: SendChatMessageInputSchema,
    outputSchema: SendChatMessageOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
