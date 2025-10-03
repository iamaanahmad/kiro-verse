import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { genkit } from 'genkit';
import { gemini20FlashExp } from '@genkit-ai/googleai';

const FeedbackRequestSchema = z.object({
  code: z.string().describe('The code to analyze'),
  language: z.string().describe('Programming language of the code'),
  context: z.object({
    fileName: z.string().optional(),
    projectType: z.string().optional(),
    framework: z.string().optional(),
  }).optional(),
  userId: z.string().describe('User ID for personalization'),
  apiKey: z.string().describe('IDE plugin API key'),
});

const FeedbackResponseSchema = z.object({
  feedback: z.string().describe('AI-generated feedback for the code'),
  suggestions: z.array(z.string()).describe('Specific improvement suggestions'),
  skillsUsed: z.array(z.string()).describe('Programming skills demonstrated'),
  codeQuality: z.object({
    score: z.number().min(1).max(10),
    areas: z.array(z.string()),
  }).describe('Code quality assessment'),
  learningInsights: z.array(z.string()).describe('Learning insights and recommendations'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = FeedbackRequestSchema.parse(body);

    // Validate API key (in a real implementation, this would check against a database)
    if (!isValidApiKey(validatedData.apiKey, validatedData.userId)) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      );
    }

    // Generate AI feedback using Genkit
    const generateFeedback = genkit({
      name: 'generateIDEFeedback',
      model: gemini20FlashExp,
      inputSchema: z.object({
        code: z.string(),
        language: z.string(),
        context: z.object({
          fileName: z.string().optional(),
          projectType: z.string().optional(),
          framework: z.string().optional(),
        }).optional(),
      }),
      outputSchema: FeedbackResponseSchema,
    });

    const result = await generateFeedback({
      code: validatedData.code,
      language: validatedData.language,
      context: validatedData.context,
    });

    // Log the feedback request for analytics
    await logFeedbackRequest(validatedData.userId, {
      language: validatedData.language,
      codeLength: validatedData.code.length,
      skillsIdentified: result.skillsUsed,
      qualityScore: result.codeQuality.score,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error generating IDE feedback:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function isValidApiKey(apiKey: string, userId: string): boolean {
  // In a real implementation, this would validate against a database
  // For now, we'll use a simple format check
  return apiKey.startsWith(`kiro_${userId}_`) && apiKey.length > 20;
}

async function logFeedbackRequest(userId: string, metadata: {
  language: string;
  codeLength: number;
  skillsIdentified: string[];
  qualityScore: number;
}) {
  // In a real implementation, this would log to Firebase or another analytics service
  console.log('IDE Feedback Request:', { userId, ...metadata });
}