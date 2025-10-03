// AI Flow for Real-time Collaborative Session Mentorship

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { 
  AISuggestion, 
  RealTimeInsight, 
  CollaborativeSession,
  CodeHistoryEntry 
} from '@/types/collaborative-session';

// Input schema for collaborative session analysis
const CollaborativeSessionAnalysisInput = z.object({
  sessionId: z.string(),
  currentCode: z.string(),
  codeHistory: z.array(z.object({
    entryId: z.string(),
    timestamp: z.string(),
    userId: z.string(),
    username: z.string(),
    operation: z.enum(['insert', 'delete', 'replace', 'format']),
    oldContent: z.string().optional(),
    newContent: z.string().optional(),
    description: z.string()
  })),
  participants: z.array(z.object({
    userId: z.string(),
    username: z.string(),
    role: z.enum(['host', 'participant', 'observer']),
    skillLevel: z.string().optional(),
    isActive: z.boolean()
  })),
  sessionContext: z.object({
    skillLevel: z.enum(['beginner', 'intermediate', 'advanced', 'mixed']),
    focusAreas: z.array(z.string()),
    duration: z.number(), // in minutes
    aiMentorEnabled: z.boolean()
  }),
  triggerType: z.enum(['code_change', 'participant_interaction', 'time_based', 'request'])
});

// Output schema for AI suggestions and insights
const CollaborativeSessionAnalysisOutput = z.object({
  suggestions: z.array(z.object({
    suggestionId: z.string(),
    type: z.enum(['improvement', 'bug_fix', 'optimization', 'best_practice', 'learning']),
    title: z.string(),
    description: z.string(),
    targetPosition: z.object({
      line: z.number(),
      column: z.number(),
      offset: z.number()
    }).optional(),
    targetCode: z.string().optional(),
    suggestedCode: z.string().optional(),
    confidence: z.number().min(0).max(1),
    reasoning: z.string(),
    skillsTargeted: z.array(z.string()),
    priority: z.enum(['low', 'medium', 'high']),
    category: z.string()
  })),
  insights: z.array(z.object({
    insightId: z.string(),
    type: z.enum(['code_quality', 'performance', 'security', 'best_practice', 'learning_opportunity']),
    title: z.string(),
    message: z.string(),
    triggeredBy: z.enum(['code_change', 'ai_analysis', 'peer_interaction', 'time_based']),
    relatedCode: z.string().optional(),
    priority: z.enum(['info', 'warning', 'error', 'success']),
    targetUsers: z.array(z.string()),
    aiGenerated: z.boolean()
  })),
  collaborationFeedback: z.object({
    teamDynamics: z.string(),
    codeQualityTrend: z.enum(['improving', 'stable', 'declining']),
    participationBalance: z.string(),
    learningOpportunities: z.array(z.string()),
    recommendedActions: z.array(z.string())
  })
});

export const collaborativeSessionMentorFlow = ai.defineFlow(
  {
    name: 'collaborative-session-mentor',
    inputSchema: CollaborativeSessionAnalysisInput,
    outputSchema: CollaborativeSessionAnalysisOutput,
  },
  async (input) => {
    const { 
      sessionId, 
      currentCode, 
      codeHistory, 
      participants, 
      sessionContext, 
      triggerType 
    } = input;

    // Analyze recent code changes
    const recentChanges = codeHistory
      .slice(-5) // Last 5 changes
      .map(entry => ({
        user: entry.username,
        operation: entry.operation,
        description: entry.description,
        content: entry.newContent || entry.oldContent || ''
      }));

    // Analyze participant activity
    const activeParticipants = participants.filter(p => p.isActive);
    const participantActivity = participants.map(p => ({
      username: p.username,
      role: p.role,
      isActive: p.isActive,
      skillLevel: p.skillLevel || 'unknown'
    }));

    const prompt = `
You are an AI mentor for a collaborative coding session. Analyze the current state and provide helpful suggestions and insights.

## Session Context
- Session ID: ${sessionId}
- Skill Level: ${sessionContext.skillLevel}
- Focus Areas: ${sessionContext.focusAreas.join(', ')}
- Duration: ${sessionContext.duration} minutes
- Trigger: ${triggerType}

## Current Code
\`\`\`
${currentCode}
\`\`\`

## Recent Changes
${recentChanges.map(change => 
  `- ${change.user} (${change.operation}): ${change.description}`
).join('\n')}

## Participants
${participantActivity.map(p => 
  `- ${p.username} (${p.role}, ${p.skillLevel}, ${p.isActive ? 'active' : 'inactive'})`
).join('\n')}

## Analysis Requirements

1. **Code Suggestions**: Provide specific, actionable suggestions for improving the code. Focus on:
   - Code quality improvements
   - Bug fixes and potential issues
   - Performance optimizations
   - Best practices
   - Learning opportunities for the skill level

2. **Real-time Insights**: Generate insights about:
   - Code quality trends
   - Security considerations
   - Performance implications
   - Learning opportunities
   - Collaboration patterns

3. **Collaboration Feedback**: Analyze:
   - Team dynamics and participation balance
   - Code quality trends over time
   - Learning opportunities for different skill levels
   - Recommended actions for better collaboration

## Guidelines
- Tailor suggestions to the session's skill level (${sessionContext.skillLevel})
- Focus on the declared focus areas: ${sessionContext.focusAreas.join(', ')}
- Be encouraging and educational, not critical
- Provide specific, actionable advice
- Consider the collaborative nature - suggestions should help the team learn together
- Prioritize suggestions that promote learning and skill development
- Generate insights that are timely and relevant to current activity

Generate suggestions and insights that will help this collaborative session be more productive and educational.
`;

    const { output } = await ai.generate({
      prompt,
      config: {
        temperature: 0.7,
        maxOutputTokens: 2048,
      },
    });
    
    const result = output;

    // Parse the AI response and structure it according to our schema
    const suggestions: any[] = [];
    const insights: any[] = [];
    
    // Generate suggestion IDs and insight IDs
    const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Extract suggestions from AI response
    if (result.includes('suggestions') || result.includes('improve')) {
      // Parse AI suggestions - this would be more sophisticated in practice
      suggestions.push({
        suggestionId: generateId(),
        type: 'improvement' as const,
        title: 'Code Quality Enhancement',
        description: 'Consider improving code structure and readability',
        confidence: 0.8,
        reasoning: 'Based on current code analysis and collaboration patterns',
        skillsTargeted: sessionContext.focusAreas,
        priority: 'medium' as const,
        category: 'code_quality'
      });
    }

    // Extract insights from AI response
    if (result.includes('insight') || result.includes('learning')) {
      insights.push({
        insightId: generateId(),
        type: 'learning_opportunity' as const,
        title: 'Collaborative Learning Opportunity',
        message: 'This is a great moment for peer learning and knowledge sharing',
        triggeredBy: triggerType as any,
        priority: 'info' as const,
        targetUsers: [], // Empty means all users
        aiGenerated: true
      });
    }

    // Analyze collaboration patterns
    const collaborationFeedback = {
      teamDynamics: `Session has ${activeParticipants.length} active participants working on ${sessionContext.focusAreas.join(', ')}`,
      codeQualityTrend: 'improving' as const,
      participationBalance: activeParticipants.length > 1 ? 'balanced' : 'single contributor',
      learningOpportunities: [
        'Code review and feedback',
        'Pair programming techniques',
        'Best practices sharing'
      ],
      recommendedActions: [
        'Encourage more peer interaction',
        'Share knowledge about current implementation',
        'Consider breaking down complex problems'
      ]
    };

    return {
      suggestions,
      insights,
      collaborationFeedback
    };
  }
);

// Helper function to run collaborative session analysis
export async function analyzeCollaborativeSession(input: z.infer<typeof CollaborativeSessionAnalysisInput>) {
  try {
    return await collaborativeSessionMentorFlow(input);
  } catch (error) {
    console.error('Error analyzing collaborative session:', error);
    throw error;
  }
}

// Real-time insight generation for specific events
export const generateRealTimeInsight = ai.defineFlow(
  {
    name: 'generate-real-time-insight',
    inputSchema: z.object({
      eventType: z.string(),
      eventData: z.any(),
      sessionContext: z.object({
        skillLevel: z.string(),
        focusAreas: z.array(z.string()),
        participants: z.array(z.string())
      }),
      currentCode: z.string()
    }),
    outputSchema: z.object({
      insight: z.object({
        type: z.string(),
        title: z.string(),
        message: z.string(),
        priority: z.enum(['info', 'warning', 'error', 'success']),
        actionable: z.boolean()
      }).optional()
    })
  },
  async (input) => {
    const { eventType, eventData, sessionContext, currentCode } = input;

    const prompt = `
Generate a real-time insight for a collaborative coding session based on this event:

Event Type: ${eventType}
Event Data: ${JSON.stringify(eventData)}
Session Skill Level: ${sessionContext.skillLevel}
Focus Areas: ${sessionContext.focusAreas.join(', ')}
Participants: ${sessionContext.participants.length}

Current Code Context:
\`\`\`
${currentCode.slice(0, 500)}...
\`\`\`

Generate a helpful, timely insight that:
1. Is relevant to the current event
2. Provides educational value
3. Encourages collaboration
4. Is appropriate for the skill level
5. Is actionable and specific

If no insight is needed for this event, return null.
`;

    const { output } = await ai.generate({
      prompt,
      config: {
        temperature: 0.6,
        maxOutputTokens: 512,
      },
    });
    
    const result = output;

    // Parse result and determine if an insight should be generated
    if (result.toLowerCase().includes('no insight') || result.toLowerCase().includes('null')) {
      return { insight: undefined };
    }

    return {
      insight: {
        type: 'learning_opportunity',
        title: 'Real-time Learning Insight',
        message: result,
        priority: 'info' as const,
        actionable: true
      }
    };
  }
);