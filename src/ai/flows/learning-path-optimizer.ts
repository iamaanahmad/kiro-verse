'use server';

/**
 * @fileOverview AI flow for optimizing learning paths based on user progress and goals
 *
 * This flow creates adaptive learning paths that:
 * - Analyze user's current skills and learning patterns
 * - Optimize learning sequence based on dependencies and user preferences
 * - Adapt to user's pace and learning style
 * - Provide personalized milestones and checkpoints
 * - Continuously adjust based on progress and feedback
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { PersonalizationDataService } from '@/lib/firebase/personalization';
import { UserProgressService } from '@/lib/firebase/analytics';
import type { 
  LearningStyle, 
  PersonalizedRecommendation,
  ResourceSuggestion 
} from '@/types/personalization';
import type { 
  UserProgress,
  SkillLevel,
  LearningInsight 
} from '@/types/analytics';

const LearningPathOptimizerInputSchema = z.object({
  userId: z.string().describe('The user ID for learning path optimization.'),
  learningGoals: z.array(z.string()).describe('User\'s learning goals and objectives.'),
  timeframe: z.enum(['1_week', '1_month', '3_months', '6_months', '1_year']).optional().default('3_months').describe('Desired timeframe to achieve goals.'),
  timeCommitment: z.number().optional().default(5).describe('Hours per week available for learning.'),
  prioritySkills: z.array(z.string()).optional().describe('Skills to prioritize in the learning path.'),
  currentProjects: z.array(z.string()).optional().describe('Current projects or contexts where learning will be applied.'),
  learningPreferences: z.object({
    preferredResourceTypes: z.array(z.enum(['tutorial', 'course', 'practice', 'project', 'reading', 'video'])).optional(),
    difficultyProgression: z.enum(['gradual', 'moderate', 'aggressive']).optional().default('moderate'),
    includeProjects: z.boolean().optional().default(true),
    includePeerLearning: z.boolean().optional().default(false),
  }).optional().describe('User preferences for learning approach.'),
  adaptationLevel: z.enum(['conservative', 'moderate', 'aggressive']).optional().default('moderate').describe('How aggressively to adapt the path based on progress.'),
});
export type LearningPathOptimizerInput = z.infer<typeof LearningPathOptimizerInputSchema>;

const LearningPathOptimizerOutputSchema = z.object({
  optimizedPath: z.object({
    pathId: z.string().describe('Unique identifier for the learning path.'),
    title: z.string().describe('Title of the learning path.'),
    description: z.string().describe('Description of what the path will achieve.'),
    totalDuration: z.number().describe('Estimated total duration in weeks.'),
    weeklyCommitment: z.number().describe('Required weekly time commitment in hours.'),
    difficultyProgression: z.string().describe('How difficulty increases throughout the path.'),
    adaptationStrategy: z.string().describe('How the path will adapt to user progress.'),
  }),
  learningPhases: z.array(z.object({
    phaseId: z.string().describe('Phase identifier.'),
    title: z.string().describe('Phase title.'),
    description: z.string().describe('What will be accomplished in this phase.'),
    duration: z.number().describe('Phase duration in weeks.'),
    prerequisites: z.array(z.string()).describe('Skills needed before starting this phase.'),
    learningObjectives: z.array(z.string()).describe('Specific objectives for this phase.'),
    skillsToAcquire: z.array(z.string()).describe('Skills that will be developed.'),
    milestones: z.array(z.object({
      milestone: z.string().describe('Milestone description.'),
      criteria: z.string().describe('How to know the milestone is achieved.'),
      estimatedWeek: z.number().describe('When this milestone should be reached.'),
    })).describe('Key milestones in this phase.'),
    resources: z.array(z.object({
      type: z.string().describe('Resource type.'),
      title: z.string().describe('Resource title.'),
      description: z.string().describe('Resource description.'),
      estimatedTime: z.number().describe('Time to complete in hours.'),
      priority: z.enum(['essential', 'recommended', 'optional']).describe('Resource priority.'),
      week: z.number().describe('Recommended week to use this resource.'),
    })).describe('Learning resources for this phase.'),
    projects: z.array(z.object({
      title: z.string().describe('Project title.'),
      description: z.string().describe('Project description.'),
      skills: z.array(z.string()).describe('Skills practiced in this project.'),
      estimatedTime: z.number().describe('Project duration in hours.'),
      difficulty: z.enum(['beginner', 'intermediate', 'advanced']).describe('Project difficulty.'),
    })).optional().describe('Hands-on projects for this phase.'),
  })).describe('Sequential learning phases.'),
  adaptiveElements: z.object({
    progressTracking: z.array(z.object({
      metric: z.string().describe('What to track.'),
      frequency: z.string().describe('How often to measure.'),
      adaptationTrigger: z.string().describe('When to adapt based on this metric.'),
    })).describe('How progress will be tracked and used for adaptation.'),
    personalizationFactors: z.array(z.string()).describe('Factors used to personalize the path.'),
    adaptationRules: z.array(z.object({
      condition: z.string().describe('When this rule applies.'),
      adaptation: z.string().describe('How the path will be modified.'),
      rationale: z.string().describe('Why this adaptation helps.'),
    })).describe('Rules for adapting the learning path.'),
  }),
  recommendations: z.array(z.object({
    type: z.enum(['resource', 'strategy', 'timeline', 'focus_area']).describe('Type of recommendation.'),
    title: z.string().describe('Recommendation title.'),
    description: z.string().describe('Detailed recommendation.'),
    reasoning: z.string().describe('Why this recommendation is made.'),
    priority: z.enum(['low', 'medium', 'high']).describe('Recommendation priority.'),
  })).describe('Additional recommendations for success.'),
});
export type LearningPathOptimizerOutput = z.infer<typeof LearningPathOptimizerOutputSchema>;

export const learningPathOptimizer = ai.defineFlow(
  {
    name: 'learningPathOptimizer',
    inputSchema: LearningPathOptimizerInputSchema,
    outputSchema: LearningPathOptimizerOutputSchema,
  },
  async (input): Promise<LearningPathOptimizerOutput> => {
    try {
      // Get user data for path optimization
      const [userProgress, learningStyle, recentInsights, patterns] = await Promise.all([
        UserProgressService.getUserProgress(input.userId),
        PersonalizationDataService.getLearningStyle(input.userId),
        PersonalizationDataService.getUserRecommendations(input.userId, undefined, false),
        PersonalizationDataService.getUserLearningPatterns(input.userId)
      ]);

      if (!userProgress) {
        throw new Error(`User progress not found for user ${input.userId}`);
      }

      // Analyze current skill state and gaps
      const skillAnalysis = analyzeCurrentSkills(userProgress, input.learningGoals);
      
      // Generate optimized learning path using AI
      const pathPrompt = buildLearningPathPrompt(
        input,
        userProgress,
        learningStyle,
        skillAnalysis,
        patterns
      );

      const aiResponse = await ai.generate({
        model: 'gemini-2.0-flash-exp',
        prompt: pathPrompt,
        config: {
          temperature: 0.7,
          maxOutputTokens: 3000,
        },
      });

      // Parse AI response and create structured learning path
      const pathData = parseLearningPath(aiResponse.text, input, skillAnalysis);

      // Create adaptive elements based on user characteristics
      const adaptiveElements = createAdaptiveElements(
        learningStyle,
        patterns,
        input.adaptationLevel || 'moderate'
      );

      // Generate personalized recommendations
      const recommendations = generatePathRecommendations(
        input,
        userProgress,
        learningStyle,
        skillAnalysis
      );

      // Save the optimized path as recommendations
      await savePathRecommendations(input.userId, pathData, recommendations);

      return {
        optimizedPath: pathData.optimizedPath,
        learningPhases: pathData.learningPhases,
        adaptiveElements,
        recommendations
      };

    } catch (error) {
      console.error('Error optimizing learning path:', error);
      throw new Error(`Failed to optimize learning path: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
);

// Helper functions

function analyzeCurrentSkills(userProgress: UserProgress, learningGoals: string[]): any {
  const skillLevels = Array.from(userProgress.skillLevels.values());
  
  // Identify skill gaps based on goals
  const skillGaps = learningGoals.filter(goal => {
    const relatedSkill = skillLevels.find(skill => 
      goal.toLowerCase().includes(skill.skillName.toLowerCase())
    );
    return !relatedSkill || relatedSkill.currentLevel < 2;
  });

  // Identify strengths to build upon
  const strengths = skillLevels
    .filter(skill => skill.currentLevel >= 3 && skill.trendDirection === 'improving')
    .map(skill => skill.skillName);

  // Identify areas needing improvement
  const improvementAreas = skillLevels
    .filter(skill => skill.currentLevel < 2 || skill.trendDirection === 'declining')
    .map(skill => skill.skillName);

  return {
    skillGaps,
    strengths,
    improvementAreas,
    averageLevel: skillLevels.length > 0 ? 
      skillLevels.reduce((sum, skill) => sum + skill.currentLevel, 0) / skillLevels.length : 1,
    learningVelocity: userProgress.learningVelocity
  };
}

function buildLearningPathPrompt(
  input: LearningPathOptimizerInput,
  userProgress: UserProgress,
  learningStyle: LearningStyle | null,
  skillAnalysis: any,
  patterns: any[]
): string {
  const goalsText = input.learningGoals.join(', ');
  const timeframeText = input.timeframe.replace('_', ' ');
  const strengthsText = skillAnalysis.strengths.join(', ') || 'None identified yet';
  const gapsText = skillAnalysis.skillGaps.join(', ') || 'None identified';
  
  const learningStyleText = learningStyle ? 
    `${learningStyle.preferredFeedbackType} feedback, ${learningStyle.learningPace} pace, ${learningStyle.skillFocus} focus` :
    'Not specified';

  const patternsText = patterns.length > 0 ? 
    patterns.map(p => `${p.patternType} (${Math.round(p.confidence * 100)}% confidence)`).join(', ') :
    'No patterns detected yet';

  return `Create an optimized learning path for a developer with the following profile:

Learning Goals: ${goalsText}
Timeframe: ${timeframeText}
Weekly Time Commitment: ${input.timeCommitment} hours
Current Strengths: ${strengthsText}
Skill Gaps: ${gapsText}
Average Skill Level: ${skillAnalysis.averageLevel.toFixed(1)}
Learning Velocity: ${userProgress.learningVelocity.toFixed(2)}
Learning Style: ${learningStyleText}
Detected Patterns: ${patternsText}

Requirements:
1. Create 3-5 sequential learning phases
2. Each phase should build on previous phases
3. Include specific milestones and success criteria
4. Recommend appropriate resources for each phase
5. Include hands-on projects to apply learning
6. Consider the user's time constraints and learning style
7. Provide clear progression from current level to goals
8. Make it achievable within the specified timeframe

The path should be personalized, practical, and engaging for this specific learner.`;
}

function parseLearningPath(aiText: string, input: LearningPathOptimizerInput, skillAnalysis: any): any {
  // Simplified parsing - in reality, you'd use more sophisticated NLP
  const pathId = `path_${input.userId}_${Date.now()}`;
  
  // Calculate total duration based on timeframe
  const timeframeWeeks = {
    '1_week': 1,
    '1_month': 4,
    '3_months': 12,
    '6_months': 24,
    '1_year': 48
  };

  const totalWeeks = timeframeWeeks[input.timeframe || '3_months'];
  const phaseDuration = Math.ceil(totalWeeks / 4); // 4 phases by default

  // Create structured learning phases
  const learningPhases = createLearningPhases(
    input,
    skillAnalysis,
    totalWeeks,
    phaseDuration
  );

  return {
    optimizedPath: {
      pathId,
      title: `Personalized Learning Path: ${input.learningGoals.join(' & ')}`,
      description: `A ${totalWeeks}-week learning path tailored to your goals, learning style, and current skill level.`,
      totalDuration: totalWeeks,
      weeklyCommitment: input.timeCommitment || 5,
      difficultyProgression: input.learningPreferences?.difficultyProgression || 'moderate',
      adaptationStrategy: 'Continuous adaptation based on progress, engagement, and learning velocity'
    },
    learningPhases
  };
}

function createLearningPhases(
  input: LearningPathOptimizerInput,
  skillAnalysis: any,
  totalWeeks: number,
  phaseDuration: number
): any[] {
  const phases = [];
  const goals = input.learningGoals;

  // Phase 1: Foundation Building
  phases.push({
    phaseId: `phase_1_${Date.now()}`,
    title: 'Foundation Building',
    description: 'Establish strong fundamentals and fill critical knowledge gaps',
    duration: phaseDuration,
    prerequisites: [],
    learningObjectives: [
      'Master fundamental concepts',
      'Build confidence with basic skills',
      'Establish good learning habits'
    ],
    skillsToAcquire: skillAnalysis.skillGaps.slice(0, 2),
    milestones: [
      {
        milestone: 'Complete foundational concepts',
        criteria: 'Pass basic assessments with 80% accuracy',
        estimatedWeek: Math.ceil(phaseDuration * 0.5)
      },
      {
        milestone: 'Build first practice project',
        criteria: 'Successfully implement learned concepts',
        estimatedWeek: phaseDuration
      }
    ],
    resources: generatePhaseResources('foundation', phaseDuration),
    projects: input.learningPreferences?.includeProjects ? [
      {
        title: 'Foundation Practice Project',
        description: 'Apply basic concepts in a simple project',
        skills: skillAnalysis.skillGaps.slice(0, 2),
        estimatedTime: 8,
        difficulty: 'beginner' as const
      }
    ] : undefined
  });

  // Phase 2: Skill Development
  phases.push({
    phaseId: `phase_2_${Date.now()}`,
    title: 'Skill Development',
    description: 'Develop intermediate skills and practical application abilities',
    duration: phaseDuration,
    prerequisites: skillAnalysis.skillGaps.slice(0, 2),
    learningObjectives: [
      'Develop intermediate proficiency',
      'Learn best practices and patterns',
      'Gain practical experience'
    ],
    skillsToAcquire: goals.slice(0, 2),
    milestones: [
      {
        milestone: 'Intermediate skill demonstration',
        criteria: 'Complete intermediate-level challenges',
        estimatedWeek: Math.ceil(phaseDuration * 0.6)
      },
      {
        milestone: 'Real-world application',
        criteria: 'Build project using learned skills',
        estimatedWeek: phaseDuration
      }
    ],
    resources: generatePhaseResources('intermediate', phaseDuration),
    projects: input.learningPreferences?.includeProjects ? [
      {
        title: 'Intermediate Application Project',
        description: 'Build a more complex application',
        skills: goals.slice(0, 2),
        estimatedTime: 12,
        difficulty: 'intermediate' as const
      }
    ] : undefined
  });

  // Phase 3: Advanced Application
  phases.push({
    phaseId: `phase_3_${Date.now()}`,
    title: 'Advanced Application',
    description: 'Master advanced concepts and build complex projects',
    duration: phaseDuration,
    prerequisites: goals.slice(0, 2),
    learningObjectives: [
      'Master advanced techniques',
      'Understand system design principles',
      'Build production-quality applications'
    ],
    skillsToAcquire: goals.slice(2),
    milestones: [
      {
        milestone: 'Advanced concept mastery',
        criteria: 'Demonstrate deep understanding',
        estimatedWeek: Math.ceil(phaseDuration * 0.7)
      },
      {
        milestone: 'Complex project completion',
        criteria: 'Build and deploy advanced project',
        estimatedWeek: phaseDuration
      }
    ],
    resources: generatePhaseResources('advanced', phaseDuration),
    projects: input.learningPreferences?.includeProjects ? [
      {
        title: 'Capstone Project',
        description: 'Comprehensive project demonstrating all learned skills',
        skills: goals,
        estimatedTime: 20,
        difficulty: 'advanced' as const
      }
    ] : undefined
  });

  // Phase 4: Mastery & Specialization
  if (totalWeeks > 12) {
    phases.push({
      phaseId: `phase_4_${Date.now()}`,
      title: 'Mastery & Specialization',
      description: 'Achieve mastery and explore specialized areas',
      duration: totalWeeks - (phaseDuration * 3),
      prerequisites: goals,
      learningObjectives: [
        'Achieve expert-level proficiency',
        'Explore specialized topics',
        'Contribute to community'
      ],
      skillsToAcquire: ['Advanced Architecture', 'Performance Optimization', 'Leadership'],
      milestones: [
        {
          milestone: 'Expert-level demonstration',
          criteria: 'Solve complex, open-ended problems',
          estimatedWeek: Math.ceil((totalWeeks - (phaseDuration * 3)) * 0.8)
        }
      ],
      resources: generatePhaseResources('expert', totalWeeks - (phaseDuration * 3)),
      projects: input.learningPreferences?.includeProjects ? [
        {
          title: 'Innovation Project',
          description: 'Create something new or contribute to open source',
          skills: [...goals, 'Innovation', 'Community Contribution'],
          estimatedTime: 30,
          difficulty: 'advanced' as const
        }
      ] : undefined
    });
  }

  return phases;
}

function generatePhaseResources(level: string, duration: number): any[] {
  const resourceTemplates = {
    foundation: [
      { type: 'tutorial', title: 'Interactive Fundamentals Course', priority: 'essential', time: 8 },
      { type: 'practice', title: 'Basic Exercises', priority: 'essential', time: 6 },
      { type: 'reading', title: 'Best Practices Guide', priority: 'recommended', time: 4 }
    ],
    intermediate: [
      { type: 'course', title: 'Intermediate Development Course', priority: 'essential', time: 12 },
      { type: 'project', title: 'Guided Project Tutorial', priority: 'essential', time: 10 },
      { type: 'video', title: 'Advanced Concepts Explained', priority: 'recommended', time: 6 }
    ],
    advanced: [
      { type: 'course', title: 'Advanced Architecture Course', priority: 'essential', time: 15 },
      { type: 'practice', title: 'Complex Problem Sets', priority: 'essential', time: 12 },
      { type: 'reading', title: 'Industry Case Studies', priority: 'recommended', time: 8 }
    ],
    expert: [
      { type: 'reading', title: 'Research Papers and Articles', priority: 'essential', time: 10 },
      { type: 'project', title: 'Open Source Contribution', priority: 'essential', time: 20 },
      { type: 'course', title: 'Specialized Certification', priority: 'optional', time: 15 }
    ]
  };

  const templates = resourceTemplates[level as keyof typeof resourceTemplates] || resourceTemplates.foundation;
  
  return templates.map((template, index) => ({
    ...template,
    description: `${template.title} for ${level} level learning`,
    estimatedTime: template.time,
    week: Math.ceil((index + 1) * duration / templates.length)
  }));
}

function createAdaptiveElements(
  learningStyle: LearningStyle | null,
  patterns: any[],
  adaptationLevel: string
): any {
  const progressTracking = [
    {
      metric: 'Skill level progression',
      frequency: 'Weekly',
      adaptationTrigger: 'If progress is 20% slower than expected'
    },
    {
      metric: 'Engagement and completion rates',
      frequency: 'Bi-weekly',
      adaptationTrigger: 'If completion rate drops below 70%'
    },
    {
      metric: 'Learning velocity',
      frequency: 'Monthly',
      adaptationTrigger: 'If velocity changes by more than 30%'
    }
  ];

  const personalizationFactors = [
    'Learning pace and style preferences',
    'Skill progression patterns',
    'Resource engagement patterns',
    'Time availability and consistency',
    'Challenge preference and difficulty tolerance'
  ];

  const adaptationRules = [
    {
      condition: 'User consistently completes tasks ahead of schedule',
      adaptation: 'Increase difficulty and reduce time estimates',
      rationale: 'Prevent boredom and maintain optimal challenge level'
    },
    {
      condition: 'User struggles with current difficulty level',
      adaptation: 'Provide additional foundational resources and extend timelines',
      rationale: 'Ensure solid understanding before progression'
    },
    {
      condition: 'User shows preference for specific resource types',
      adaptation: 'Prioritize preferred resource types in future recommendations',
      rationale: 'Optimize engagement and learning effectiveness'
    }
  ];

  if (learningStyle?.learningPace === 'fast') {
    adaptationRules.push({
      condition: 'Fast learner showing consistent progress',
      adaptation: 'Introduce advanced concepts earlier and add stretch goals',
      rationale: 'Maximize learning potential and prevent under-challenge'
    });
  }

  return {
    progressTracking,
    personalizationFactors,
    adaptationRules
  };
}

function generatePathRecommendations(
  input: LearningPathOptimizerInput,
  userProgress: UserProgress,
  learningStyle: LearningStyle | null,
  skillAnalysis: any
): any[] {
  const recommendations = [];

  // Resource type recommendation
  if (learningStyle?.preferredFeedbackType === 'visual') {
    recommendations.push({
      type: 'resource',
      title: 'Prioritize Visual Learning Resources',
      description: 'Focus on video tutorials, interactive demos, and visual documentation',
      reasoning: 'Your learning style indicates a preference for visual content',
      priority: 'high'
    });
  }

  // Timeline recommendation
  if (skillAnalysis.learningVelocity < 0.3) {
    recommendations.push({
      type: 'timeline',
      title: 'Consider Extended Timeline',
      description: 'Your current learning velocity suggests you might benefit from a more relaxed pace',
      reasoning: 'Avoiding overwhelm will lead to better long-term retention',
      priority: 'medium'
    });
  }

  // Strategy recommendation
  if (learningStyle?.interactionStyle === 'collaborative') {
    recommendations.push({
      type: 'strategy',
      title: 'Incorporate Peer Learning',
      description: 'Join study groups, find learning partners, or participate in coding communities',
      reasoning: 'Your collaborative learning style will benefit from peer interaction',
      priority: 'high'
    });
  }

  // Focus area recommendation
  if (skillAnalysis.strengths.length > 0) {
    recommendations.push({
      type: 'focus_area',
      title: 'Leverage Your Strengths',
      description: `Build on your existing strengths in ${skillAnalysis.strengths.join(', ')} to accelerate learning`,
      reasoning: 'Using existing knowledge as a foundation improves learning efficiency',
      priority: 'medium'
    });
  }

  return recommendations;
}

async function savePathRecommendations(
  userId: string,
  pathData: any,
  recommendations: any[]
): Promise<void> {
  try {
    // Save the learning path as a personalized recommendation
    const pathRecommendation: PersonalizedRecommendation = {
      recommendationId: `learning_path_${userId}_${Date.now()}`,
      userId,
      type: 'learning_path',
      title: pathData.optimizedPath.title,
      description: pathData.optimizedPath.description,
      reasoning: 'Optimized learning path based on your goals, skills, and learning style',
      priority: 'high',
      category: 'Learning Path',
      targetSkills: pathData.learningPhases.flatMap((phase: any) => phase.skillsToAcquire),
      estimatedTimeInvestment: pathData.optimizedPath.weeklyCommitment * pathData.optimizedPath.totalDuration * 60,
      difficultyLevel: 'intermediate',
      personalizedContent: {
        contentType: 'learning_path',
        content: JSON.stringify(pathData),
        metadata: {
          totalPhases: pathData.learningPhases.length,
          totalWeeks: pathData.optimizedPath.totalDuration,
          weeklyHours: pathData.optimizedPath.weeklyCommitment
        },
        adaptations: []
      },
      createdAt: new Date()
    };

    await PersonalizationDataService.savePersonalizedRecommendation(pathRecommendation);

    // Save individual recommendations
    for (const rec of recommendations) {
      const recommendation: PersonalizedRecommendation = {
        recommendationId: `path_rec_${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        type: rec.type,
        title: rec.title,
        description: rec.description,
        reasoning: rec.reasoning,
        priority: rec.priority,
        category: 'Learning Strategy',
        targetSkills: [],
        estimatedTimeInvestment: 30,
        difficultyLevel: 'beginner',
        personalizedContent: {
          contentType: 'recommendation',
          content: rec.description,
          metadata: { type: rec.type },
          adaptations: []
        },
        createdAt: new Date()
      };

      await PersonalizationDataService.savePersonalizedRecommendation(recommendation);
    }
  } catch (error) {
    console.error('Error saving path recommendations:', error);
    // Don't throw error as this is not critical for the main flow
  }
}