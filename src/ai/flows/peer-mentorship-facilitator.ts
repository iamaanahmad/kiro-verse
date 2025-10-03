'use server';

/**
 * @fileOverview AI flow for facilitating peer mentorship and collaborative learning
 *
 * This flow enables intelligent peer matching and mentorship facilitation that:
 * - Matches users with complementary skills and learning goals
 * - Facilitates productive peer learning sessions
 * - Provides AI-guided mentorship suggestions
 * - Tracks and optimizes peer interaction outcomes
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { PersonalizationDataService } from '@/lib/firebase/personalization';
import { UserProgressService } from '@/lib/firebase/analytics';
import { PeerReviewService } from '@/lib/firebase/peer-review';
import type { 
  LearningStyle, 
  PersonalizationMetrics 
} from '@/types/personalization';
import type { 
  UserProgress,
  PeerInteraction 
} from '@/types/analytics';

const PeerMentorshipFacilitatorInputSchema = z.object({
  userId: z.string().describe('The user ID seeking mentorship or wanting to mentor.'),
  sessionType: z.enum(['seeking_help', 'offering_help', 'collaborative_session', 'peer_review']).describe('Type of peer interaction desired.'),
  skillAreas: z.array(z.string()).optional().describe('Specific skill areas for the session. If not provided, will be determined from user progress.'),
  sessionDuration: z.number().optional().default(30).describe('Desired session duration in minutes.'),
  experienceLevel: z.enum(['beginner', 'intermediate', 'advanced', 'expert']).optional().describe('User\'s experience level. If not provided, will be determined from progress.'),
  learningGoals: z.array(z.string()).optional().describe('Specific learning goals for the session.'),
  preferredInteractionStyle: z.enum(['structured', 'casual', 'problem_solving', 'code_review']).optional().describe('Preferred style of interaction.'),
  includeAIGuidance: z.boolean().optional().default(true).describe('Whether to include AI guidance during the session.'),
  matchingCriteria: z.object({
    skillComplementarity: z.boolean().optional().default(true).describe('Match based on complementary skills.'),
    learningStyleCompatibility: z.boolean().optional().default(true).describe('Consider learning style compatibility.'),
    availabilityAlignment: z.boolean().optional().default(true).describe('Match based on availability.'),
    experienceLevelDifference: z.number().optional().default(1).describe('Maximum experience level difference for matching.'),
  }).optional().describe('Criteria for peer matching.'),
});
export type PeerMentorshipFacilitatorInput = z.infer<typeof PeerMentorshipFacilitatorInputSchema>;

const PeerMentorshipFacilitatorOutputSchema = z.object({
  sessionPlan: z.object({
    sessionId: z.string().describe('Unique session identifier.'),
    sessionType: z.string().describe('Type of peer interaction.'),
    duration: z.number().describe('Planned session duration in minutes.'),
    structure: z.array(z.object({
      phase: z.string().describe('Session phase name.'),
      duration: z.number().describe('Phase duration in minutes.'),
      activities: z.array(z.string()).describe('Activities for this phase.'),
      aiGuidance: z.string().optional().describe('AI guidance for this phase.'),
    })).describe('Structured session plan with phases and activities.'),
    learningObjectives: z.array(z.string()).describe('What participants should achieve.'),
    successMetrics: z.array(z.string()).describe('How to measure session success.'),
  }),
  peerMatching: z.object({
    recommendedPeers: z.array(z.object({
      peerId: z.string().describe('Peer user ID.'),
      matchScore: z.number().min(0).max(1).describe('Compatibility score.'),
      matchingReasons: z.array(z.string()).describe('Why this peer is a good match.'),
      complementarySkills: z.array(z.string()).describe('Skills this peer can help with.'),
      sharedInterests: z.array(z.string()).describe('Common learning interests.'),
      availabilityOverlap: z.string().describe('When both users are typically available.'),
    })).describe('List of recommended peer matches.'),
    matchingStrategy: z.string().describe('Strategy used for peer matching.'),
    alternativeOptions: z.array(z.string()).describe('Alternative ways to find peers if no matches.'),
  }),
  aiMentorshipGuidance: z.object({
    sessionFacilitation: z.array(z.object({
      trigger: z.string().describe('When to provide this guidance.'),
      guidance: z.string().describe('What guidance to provide.'),
      type: z.enum(['encouragement', 'direction', 'clarification', 'summary']).describe('Type of guidance.'),
    })).describe('AI guidance throughout the session.'),
    conversationStarters: z.array(z.string()).describe('Suggested conversation starters.'),
    problemSolvingPrompts: z.array(z.string()).describe('Prompts to guide problem-solving.'),
    reflectionQuestions: z.array(z.string()).describe('Questions for session reflection.'),
  }),
  adaptiveElements: z.object({
    personalizedApproach: z.string().describe('Approach tailored to user\'s learning style.'),
    communicationStyle: z.string().describe('Recommended communication style.'),
    feedbackMechanism: z.string().describe('How feedback should be exchanged.'),
    progressTracking: z.string().describe('How to track learning progress.'),
  }),
});
export type PeerMentorshipFacilitatorOutput = z.infer<typeof PeerMentorshipFacilitatorOutputSchema>;

export const peerMentorshipFacilitator = ai.defineFlow(
  {
    name: 'peerMentorshipFacilitator',
    inputSchema: PeerMentorshipFacilitatorInputSchema,
    outputSchema: PeerMentorshipFacilitatorOutputSchema,
  },
  async (input): Promise<PeerMentorshipFacilitatorOutput> => {
    try {
      // Get user data for personalization
      const [userProgress, learningStyle, metrics] = await Promise.all([
        UserProgressService.getUserProgress(input.userId),
        PersonalizationDataService.getLearningStyle(input.userId),
        PersonalizationDataService.getPersonalizationMetrics(input.userId)
      ]);

      if (!userProgress) {
        throw new Error(`User progress not found for user ${input.userId}`);
      }

      // Determine user's experience level and skill areas
      const experienceLevel = input.experienceLevel || determineExperienceLevel(userProgress);
      const skillAreas = input.skillAreas || extractPrimarySkills(userProgress);

      // Find potential peer matches
      const peerMatches = await findPeerMatches(
        input.userId,
        userProgress,
        learningStyle,
        input.sessionType,
        input.matchingCriteria || {}
      );

      // Generate session plan using AI
      const sessionPlanPrompt = buildSessionPlanPrompt(
        input,
        userProgress,
        learningStyle,
        experienceLevel,
        skillAreas
      );

      const aiResponse = await ai.generate({
        model: 'gemini-2.0-flash-exp',
        prompt: sessionPlanPrompt,
        config: {
          temperature: 0.6,
          maxOutputTokens: 1500,
        },
      });

      // Parse AI response and create structured session plan
      const sessionPlan = parseSessionPlan(aiResponse.text, input, skillAreas);

      // Generate AI mentorship guidance
      const mentorshipGuidance = generateMentorshipGuidance(
        input.sessionType,
        learningStyle,
        experienceLevel,
        skillAreas
      );

      // Create adaptive elements based on user preferences
      const adaptiveElements = createAdaptiveElements(learningStyle, input.sessionType);

      return {
        sessionPlan,
        peerMatching: {
          recommendedPeers: peerMatches,
          matchingStrategy: determineMatchingStrategy(input.sessionType, input.matchingCriteria),
          alternativeOptions: generateAlternativeOptions(input.sessionType)
        },
        aiMentorshipGuidance: mentorshipGuidance,
        adaptiveElements
      };

    } catch (error) {
      console.error('Error facilitating peer mentorship:', error);
      throw new Error(`Failed to facilitate peer mentorship: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
);

// Helper functions

function determineExperienceLevel(userProgress: UserProgress): 'beginner' | 'intermediate' | 'advanced' | 'expert' {
  const skillLevels = Array.from(userProgress.skillLevels.values());
  if (skillLevels.length === 0) return 'beginner';

  const avgLevel = skillLevels.reduce((sum, skill) => sum + skill.currentLevel, 0) / skillLevels.length;
  
  if (avgLevel >= 3.5) return 'expert';
  if (avgLevel >= 2.5) return 'advanced';
  if (avgLevel >= 1.5) return 'intermediate';
  return 'beginner';
}

function extractPrimarySkills(userProgress: UserProgress): string[] {
  return Array.from(userProgress.skillLevels.values())
    .sort((a, b) => b.experiencePoints - a.experiencePoints)
    .slice(0, 3)
    .map(skill => skill.skillName);
}

async function findPeerMatches(
  userId: string,
  userProgress: UserProgress,
  learningStyle: LearningStyle | null,
  sessionType: string,
  matchingCriteria: any
): Promise<any[]> {
  // This is a simplified implementation - in reality, you'd query a database of users
  // For now, return mock peer matches
  const mockPeers = [
    {
      peerId: 'peer-1',
      matchScore: 0.85,
      matchingReasons: [
        'Complementary JavaScript and React skills',
        'Similar learning pace',
        'Available during your preferred times'
      ],
      complementarySkills: ['React', 'Node.js'],
      sharedInterests: ['Web Development', 'Best Practices'],
      availabilityOverlap: 'Evenings and weekends'
    },
    {
      peerId: 'peer-2',
      matchScore: 0.78,
      matchingReasons: [
        'Strong in areas you\'re learning',
        'Collaborative learning style',
        'Similar experience level'
      ],
      complementarySkills: ['Testing', 'Algorithms'],
      sharedInterests: ['Code Quality', 'Problem Solving'],
      availabilityOverlap: 'Weekday afternoons'
    }
  ];

  // Filter based on session type and matching criteria
  return mockPeers.filter(peer => {
    if (sessionType === 'seeking_help') {
      return peer.matchScore > 0.7;
    }
    if (sessionType === 'offering_help') {
      return peer.matchScore > 0.6;
    }
    return peer.matchScore > 0.75;
  });
}

function buildSessionPlanPrompt(
  input: PeerMentorshipFacilitatorInput,
  userProgress: UserProgress,
  learningStyle: LearningStyle | null,
  experienceLevel: string,
  skillAreas: string[]
): string {
  const learningStyleText = learningStyle ? 
    `Learning style: ${learningStyle.preferredFeedbackType} feedback, ${learningStyle.learningPace} pace, ${learningStyle.interactionStyle} interaction` :
    'Learning style: Not specified';

  return `Create a structured peer mentorship session plan for:

User Profile:
- Experience level: ${experienceLevel}
- Skill areas: ${skillAreas.join(', ')}
- ${learningStyleText}
- Session type: ${input.sessionType}
- Duration: ${input.sessionDuration} minutes
- Preferred style: ${input.preferredInteractionStyle || 'flexible'}

Requirements:
1. Create a structured session with 3-4 phases
2. Include specific activities for each phase
3. Provide clear learning objectives
4. Include success metrics
5. Consider the user's learning style and preferences
6. Make it engaging and productive

The session should facilitate effective peer learning and knowledge sharing.`;
}

function parseSessionPlan(aiText: string, input: PeerMentorshipFacilitatorInput, skillAreas: string[]): any {
  // Simplified parsing - in reality, you'd use more sophisticated NLP
  const sessionId = `session_${input.userId}_${Date.now()}`;
  
  // Create a structured session plan based on session type
  const phases = createSessionPhases(input.sessionType, input.sessionDuration || 30);
  
  return {
    sessionId,
    sessionType: input.sessionType,
    duration: input.sessionDuration || 30,
    structure: phases,
    learningObjectives: [
      `Improve understanding of ${skillAreas.join(' and ')}`,
      'Practice collaborative problem-solving',
      'Exchange knowledge and best practices',
      'Build peer learning relationships'
    ],
    successMetrics: [
      'Both participants learn something new',
      'Clear action items identified',
      'Positive feedback exchanged',
      'Follow-up session planned if beneficial'
    ]
  };
}

function createSessionPhases(sessionType: string, duration: number): any[] {
  const basePhases = [
    {
      phase: 'Introduction & Goal Setting',
      duration: Math.round(duration * 0.15),
      activities: [
        'Introductions and background sharing',
        'Clarify session goals and expectations',
        'Establish communication preferences'
      ],
      aiGuidance: 'Help participants feel comfortable and aligned on objectives'
    },
    {
      phase: 'Main Learning Activity',
      duration: Math.round(duration * 0.6),
      activities: [],
      aiGuidance: 'Facilitate knowledge exchange and problem-solving'
    },
    {
      phase: 'Reflection & Next Steps',
      duration: Math.round(duration * 0.25),
      activities: [
        'Reflect on what was learned',
        'Identify key takeaways',
        'Plan follow-up actions',
        'Exchange contact information if desired'
      ],
      aiGuidance: 'Ensure learning is consolidated and next steps are clear'
    }
  ];

  // Customize main activity based on session type
  switch (sessionType) {
    case 'seeking_help':
      basePhases[1].activities = [
        'Present specific problem or challenge',
        'Receive guidance and suggestions',
        'Work through solution together',
        'Ask clarifying questions'
      ];
      break;
    
    case 'offering_help':
      basePhases[1].activities = [
        'Understand peer\'s learning needs',
        'Share knowledge and experience',
        'Provide guidance and examples',
        'Answer questions and clarify concepts'
      ];
      break;
    
    case 'collaborative_session':
      basePhases[1].activities = [
        'Work on shared coding challenge',
        'Exchange different approaches',
        'Collaborate on solution design',
        'Review and improve code together'
      ];
      break;
    
    case 'peer_review':
      basePhases[1].activities = [
        'Review each other\'s code',
        'Provide constructive feedback',
        'Discuss best practices',
        'Suggest improvements'
      ];
      break;
  }

  return basePhases;
}

function generateMentorshipGuidance(
  sessionType: string,
  learningStyle: LearningStyle | null,
  experienceLevel: string,
  skillAreas: string[]
): any {
  const baseGuidance = [
    {
      trigger: 'Session start',
      guidance: 'Welcome participants and help them establish rapport',
      type: 'encouragement' as const
    },
    {
      trigger: 'When discussion stalls',
      guidance: 'Suggest specific questions or activities to re-engage participants',
      type: 'direction' as const
    },
    {
      trigger: 'When confusion arises',
      guidance: 'Help clarify concepts and ensure mutual understanding',
      type: 'clarification' as const
    },
    {
      trigger: 'Session end',
      guidance: 'Summarize key learnings and encourage continued collaboration',
      type: 'summary' as const
    }
  ];

  const conversationStarters = [
    `What's your experience with ${skillAreas[0]}?`,
    'What specific challenge are you working on?',
    'What approach would you take to solve this?',
    'Have you encountered similar problems before?'
  ];

  const problemSolvingPrompts = [
    'Let\'s break this problem down into smaller parts',
    'What are the key requirements we need to address?',
    'What different approaches could we consider?',
    'How can we test our solution?'
  ];

  const reflectionQuestions = [
    'What was the most valuable thing you learned today?',
    'What would you do differently next time?',
    'How will you apply what you learned?',
    'What questions do you still have?'
  ];

  return {
    sessionFacilitation: baseGuidance,
    conversationStarters,
    problemSolvingPrompts,
    reflectionQuestions
  };
}

function createAdaptiveElements(learningStyle: LearningStyle | null, sessionType: string): any {
  const defaultElements = {
    personalizedApproach: 'Balanced approach with structured guidance',
    communicationStyle: 'Clear and supportive',
    feedbackMechanism: 'Real-time verbal feedback',
    progressTracking: 'Session notes and action items'
  };

  if (!learningStyle) return defaultElements;

  return {
    personalizedApproach: learningStyle.interactionStyle === 'collaborative' ? 
      'Highly interactive with shared problem-solving' :
      'Structured with clear roles and responsibilities',
    
    communicationStyle: learningStyle.preferredFeedbackType === 'detailed' ?
      'Thorough explanations with examples' :
      learningStyle.preferredFeedbackType === 'concise' ?
      'Clear and to-the-point' :
      'Visual demonstrations and examples',
    
    feedbackMechanism: learningStyle.preferredFeedbackType === 'detailed' ?
      'Comprehensive written and verbal feedback' :
      'Quick verbal feedback with key points',
    
    progressTracking: learningStyle.learningPace === 'fast' ?
      'Milestone-based progress tracking' :
      'Step-by-step progress documentation'
  };
}

function determineMatchingStrategy(sessionType: string, matchingCriteria: any): string {
  if (sessionType === 'seeking_help') {
    return 'Match with more experienced peers who have complementary skills';
  }
  if (sessionType === 'offering_help') {
    return 'Match with less experienced peers who need help in your strong areas';
  }
  if (sessionType === 'collaborative_session') {
    return 'Match with peers of similar experience level with complementary skills';
  }
  return 'Match based on skill complementarity and learning style compatibility';
}

function generateAlternativeOptions(sessionType: string): string[] {
  const baseOptions = [
    'Join a study group or learning community',
    'Participate in online coding forums',
    'Attend virtual meetups or workshops'
  ];

  if (sessionType === 'seeking_help') {
    return [
      ...baseOptions,
      'Post questions in developer communities',
      'Schedule office hours with mentors',
      'Use AI-powered learning assistants'
    ];
  }

  if (sessionType === 'offering_help') {
    return [
      ...baseOptions,
      'Volunteer as a mentor in coding bootcamps',
      'Answer questions in Stack Overflow',
      'Create educational content or tutorials'
    ];
  }

  return baseOptions;
}