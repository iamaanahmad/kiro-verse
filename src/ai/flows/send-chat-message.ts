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
import { SkillProgressTracker } from '@/lib/analytics/skill-progress-tracker';
import { LearningInsightsService } from '@/lib/firebase/analytics';
import type { LearningInsight } from '@/types/analytics';

const SendChatMessageInputSchema = z.object({
  code: z.string().describe('The code context for the conversation.'),
  query: z.string().describe('The user\'s question or message.'),
  userId: z.string().optional().describe('The user ID for analytics tracking.'),
  enableAnalytics: z.boolean().optional().default(true).describe('Whether to collect analytics data from this conversation.'),
});
export type SendChatMessageInput = z.infer<typeof SendChatMessageInputSchema>;

const SendChatMessageOutputSchema = z.object({
  aiResponse: z.string().describe('The AI mentor\'s response to the user\'s query.'),
  detectedSkills: z.array(z.string()).optional().describe('Skills detected in the conversation.'),
  learningInsights: z.array(z.object({
    type: z.enum(['strength', 'improvement_area', 'recommendation']),
    category: z.string(),
    title: z.string(),
    description: z.string(),
    actionableSteps: z.array(z.string()),
    priority: z.enum(['low', 'medium', 'high']),
  })).optional().describe('Generated learning insights from the conversation.'),
  analyticsSessionId: z.string().optional().describe('Session ID for analytics tracking.'),
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

Analytics Enhancement:
- Identify programming skills demonstrated in the code or discussed in the conversation
- Detect learning patterns and areas where the user shows strength or needs improvement
- Generate actionable learning insights based on the conversation context
- Consider the user's question type (debugging, learning concept, code review, etc.)

Code Context:
{{code}}

User's Question:
{{query}}

Respond as Kiro, the helpful AI mentor. If analytics are enabled, also identify skills and generate learning insights:`,
});

const sendChatMessageFlow = ai.defineFlow(
  {
    name: 'sendChatMessageFlow',
    inputSchema: SendChatMessageInputSchema,
    outputSchema: SendChatMessageOutputSchema,
  },
  async input => {
    const { code, query, userId, enableAnalytics } = input;
    
    // Get AI response with enhanced analytics context
    const { output } = await sendChatMessagePrompt(input);
    
    // If analytics are enabled and userId is provided, collect analytics data
    if (enableAnalytics && userId && code.trim()) {
      try {
        // Analyze the conversation for learning patterns and skill detection
        const analyticsData = await SkillProgressTracker.analyzeCodeSubmission(
          userId,
          code,
          `Chat conversation: ${query}`,
          {
            enableRealTimeAnalysis: true,
            generateInsights: true,
            updateBenchmarks: false,
            trackLearningVelocity: true
          }
        );

        // Generate conversation-specific insights
        const conversationInsights = await generateConversationInsights(
          userId,
          query,
          code,
          output!.aiResponse
        );

        // Save conversation insights
        for (const insight of conversationInsights) {
          await LearningInsightsService.saveLearningInsight(insight);
        }

        // Return enhanced response with analytics data
        return {
          ...output!,
          detectedSkills: analyticsData.aiAnalysis.detectedSkills,
          learningInsights: conversationInsights.map(insight => ({
            type: insight.type,
            category: insight.category,
            title: insight.title,
            description: insight.description,
            actionableSteps: insight.actionableSteps,
            priority: insight.priority,
          })),
          analyticsSessionId: analyticsData.sessionId,
        };
      } catch (error) {
        console.error('Error collecting chat analytics:', error);
        // Return basic response if analytics fail
        return output!;
      }
    }
    
    return output!;
  }
);

/**
 * Generates learning insights specific to chat conversations
 */
async function generateConversationInsights(
  userId: string,
  query: string,
  code: string,
  aiResponse: string
): Promise<LearningInsight[]> {
  const insights: LearningInsight[] = [];
  const timestamp = new Date();
  
  // Analyze question type and generate relevant insights
  const questionType = analyzeQuestionType(query);
  const codeComplexity = analyzeCodeComplexity(code);
  const responseQuality = analyzeResponseEngagement(aiResponse);
  
  // Generate insights based on conversation patterns
  switch (questionType) {
    case 'debugging':
      insights.push({
        id: `insight_${Date.now()}_debug`,
        userId,
        type: 'recommendation',
        category: 'Debugging Skills',
        title: 'Developing Debugging Expertise',
        description: 'You\'re actively working on debugging skills by asking targeted questions about code issues.',
        actionableSteps: [
          'Practice systematic debugging approaches',
          'Learn to use browser developer tools effectively',
          'Study common error patterns and their solutions'
        ],
        confidenceScore: 0.8,
        priority: 'medium',
        isRead: false,
        createdAt: timestamp
      });
      break;
      
    case 'concept-learning':
      insights.push({
        id: `insight_${Date.now()}_concept`,
        userId,
        type: 'strength',
        category: 'Learning Approach',
        title: 'Strong Conceptual Learning',
        description: 'You\'re asking great questions to understand programming concepts deeply.',
        actionableSteps: [
          'Continue exploring related concepts',
          'Try implementing the concepts in different contexts',
          'Share your learning with others to reinforce understanding'
        ],
        confidenceScore: 0.85,
        priority: 'medium',
        isRead: false,
        createdAt: timestamp
      });
      break;
      
    case 'code-review':
      if (codeComplexity === 'high') {
        insights.push({
          id: `insight_${Date.now()}_complex`,
          userId,
          type: 'strength',
          category: 'Code Complexity',
          title: 'Handling Complex Code',
          description: 'You\'re working with complex code structures, showing advanced problem-solving skills.',
          actionableSteps: [
            'Consider breaking complex code into smaller functions',
            'Add comprehensive comments for complex logic',
            'Explore design patterns that could simplify the structure'
          ],
          confidenceScore: 0.9,
          priority: 'high',
          isRead: false,
          createdAt: timestamp
        });
      }
      break;
      
    case 'best-practices':
      insights.push({
        id: `insight_${Date.now()}_practices`,
        userId,
        type: 'recommendation',
        category: 'Code Quality',
        title: 'Focus on Best Practices',
        description: 'Your questions show interest in writing high-quality, maintainable code.',
        actionableSteps: [
          'Study established coding standards for your language',
          'Practice code refactoring techniques',
          'Learn about SOLID principles and clean code practices'
        ],
        confidenceScore: 0.75,
        priority: 'medium',
        isRead: false,
        createdAt: timestamp
      });
      break;
  }
  
  // Add engagement-based insights
  if (responseQuality === 'high-engagement') {
    insights.push({
      id: `insight_${Date.now()}_engagement`,
      userId,
      type: 'strength',
      category: 'Learning Engagement',
      title: 'Active Learning Approach',
      description: 'Your questions demonstrate deep engagement with the learning process.',
      actionableSteps: [
        'Continue asking thoughtful questions',
        'Experiment with the concepts discussed',
        'Consider teaching others to reinforce your learning'
      ],
      confidenceScore: 0.8,
      priority: 'low',
      isRead: false,
      createdAt: timestamp
    });
  }
  
  return insights;
}

/**
 * Analyzes the type of question being asked
 */
function analyzeQuestionType(query: string): 'debugging' | 'concept-learning' | 'code-review' | 'best-practices' | 'general' {
  const lowerQuery = query.toLowerCase();
  
  if (lowerQuery.includes('error') || lowerQuery.includes('bug') || lowerQuery.includes('not working') || lowerQuery.includes('fix')) {
    return 'debugging';
  }
  
  if (lowerQuery.includes('how does') || lowerQuery.includes('what is') || lowerQuery.includes('explain') || lowerQuery.includes('understand')) {
    return 'concept-learning';
  }
  
  if (lowerQuery.includes('review') || lowerQuery.includes('feedback') || lowerQuery.includes('improve') || lowerQuery.includes('better')) {
    return 'code-review';
  }
  
  if (lowerQuery.includes('best practice') || lowerQuery.includes('should i') || lowerQuery.includes('recommended') || lowerQuery.includes('standard')) {
    return 'best-practices';
  }
  
  return 'general';
}

/**
 * Analyzes code complexity level
 */
function analyzeCodeComplexity(code: string): 'low' | 'medium' | 'high' {
  // Ensure code is a string and handle edge cases
  if (!code || typeof code !== 'string') {
    return 'low';
  }
  
  const lines = code.split('\n').filter(line => line.trim().length > 0);
  const hasNestedStructures = /\{[\s\S]*\{[\s\S]*\}[\s\S]*\}/.test(code);
  const hasAsyncPatterns = code.includes('async') || code.includes('await') || code.includes('Promise');
  const hasComplexLogic = (code.match(/if|else|while|for|switch/g) || []).length > 3;
  
  if (lines.length > 50 || (hasNestedStructures && hasAsyncPatterns && hasComplexLogic)) {
    return 'high';
  }
  
  if (lines.length > 20 || hasNestedStructures || hasAsyncPatterns || hasComplexLogic) {
    return 'medium';
  }
  
  return 'low';
}

/**
 * Analyzes the quality of engagement based on AI response
 */
function analyzeResponseEngagement(aiResponse: string): 'high-engagement' | 'medium-engagement' | 'low-engagement' {
  // Ensure aiResponse is a string and handle edge cases
  if (!aiResponse || typeof aiResponse !== 'string') {
    return 'low-engagement';
  }
  
  const hasQuestions = (aiResponse.match(/\?/g) || []).length > 0;
  const hasExamples = aiResponse.includes('example') || aiResponse.includes('for instance');
  const hasEncouragement = aiResponse.includes('great') || aiResponse.includes('good') || aiResponse.includes('excellent');
  const responseLength = aiResponse.length;
  
  if (hasQuestions && hasExamples && responseLength > 200) {
    return 'high-engagement';
  }
  
  if ((hasQuestions || hasExamples || hasEncouragement) && responseLength > 100) {
    return 'medium-engagement';
  }
  
  return 'low-engagement';
}