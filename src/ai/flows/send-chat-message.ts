'use server';

/**
 * @fileOverview An AI agent to handle conversational chat with code context.
 *
 * - sendChatMessage - A function that handles chat interactions with code context.
 * - SendChatMessageInput - The input type for the sendChatMessage function.
 * - SendChatMessageOutput - The return type for the sendChatMessage function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SendChatMessageInputSchema = z.object({
  code: z.string().describe('The code context for the conversation.'),
  query: z.string().describe('The user\'s question or message.'),
});
export type SendChatMessageInput = z.infer<typeof SendChatMessageInputSchema>;

const SendChatMessageOutputSchema = z.object({
  aiResponse: z.string().describe('The AI mentor\'s response to the user\'s query.'),
});
export type SendChatMessageOutput = z.infer<typeof SendChatMessageOutputSchema>;

export async function sendChatMessage(input: SendChatMessageInput): Promise<SendChatMessageOutput> {
  return sendChatMessageFlow(input);
}

const sendChatMessagePrompt = ai.definePrompt({
  name: 'sendChatMessagePrompt',
  input: { schema: SendChatMessageInputSchema },
  output: { schema: SendChatMessageOutputSchema },
  prompt: `You are Kiro, an AI code mentor who uses the Socratic method to guide learning. You help developers understand their code through thoughtful questions and explanations.

Guidelines:
- Use a conversational, encouraging tone
- Ask guiding questions to help the user discover answers
- Provide explanations that build understanding
- Reference the provided code context when relevant
- Focus on teaching principles, not just giving direct answers
- Encourage best practices and clean code

Code Context:
{{code}}

User's Question:
{{query}}

Respond as Kiro, the helpful AI mentor:`,
});

const sendChatMessageFlow = ai.defineFlow(
  {
    name: 'sendChatMessageFlow',
    inputSchema: SendChatMessageInputSchema,
    outputSchema: SendChatMessageOutputSchema,
  },
  async input => {
    const { output } = await sendChatMessagePrompt(input);
    return output!;
  }
);