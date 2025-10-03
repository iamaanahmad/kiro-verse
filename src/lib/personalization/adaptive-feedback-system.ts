/**
 * @fileOverview Adaptive Feedback System for personalized learning experiences
 * 
 * This system implements intelligent feedback adaptation that:
 * - Adjusts feedback tone, detail, and timing based on user preferences
 * - Learns from user responses to improve future adaptations
 * - Provides contextual feedback delivery based on learning patterns
 * - Integrates with existing AI flows while maintaining personalization
 */

import {
  AdaptiveFeedback,
  LearningStyle,
  PersonalizationMetrics,
  AdaptationContext,
  FeedbackAdaptation
} from '@/types/personalization';
import {
  AIAnalysisResult,
  UserProgress,
  LearningInsight
} from '@/types/analytics';
import { PersonalizationEngine } from './personalization-engine';
import { PersonalizationDataService } from '@/lib/firebase/personalization';
import { UserProgressService } from '@/lib/firebase/analytics';

export interface FeedbackContext {
  userId: string;
  codeSubmission: string;
  originalAIResponse: string;
  userSkillLevel: number;
  recentPerformance: number[];
  strugglingAreas: string[];
  excellingAreas: string[];
  sessionContext: 'first_time' | 'returning' | 'struggling' | 'excelling';
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  deviceType: 'mobile' | 'desktop' | 'tablet';
}

export interface FeedbackDeliveryOptions {
  enablePersonalization: boolean;
  forceImmediate: boolean;
  includeEncouragement: boolean;
  includeNextSteps: boolean;
  maxLength?: number;
  preferredTone?: 'encouraging' | 'direct' | 'analytical' | 'conversational';
}

export class AdaptiveFeedbackSystem {
  private static readonly FEEDBACK_TEMPLATES = {
    encouraging: {
      prefix: "Great work! ",
      suffix: " Keep up the excellent progress!",
      improvementPhrase: "Here's how you can make it even better:"
    },
    direct: {
      prefix: "",
      suffix: "",
      improvementPhrase: "Areas for improvement:"
    },
    analytical: {
      prefix: "Analysis: ",
      suffix: " This demonstrates solid understanding of the concepts.",
      improvementPhrase: "Technical considerations:"
    },
    conversational: {
      prefix: "Nice! ",
      suffix: " What do you think about trying this approach?",
      improvementPhrase: "You might want to consider:"
    }
  };

  private static readonly TIMING_DELAYS = {
    immediate: 0,
    delayed: 3000,
    progressive: 1500,
    on_demand: 0
  };

  /**
   * Generates adaptive feedback based on user's learning style and context
   */
  static async generateAdaptiveFeedback(
    context: FeedbackContext,
    options: FeedbackDeliveryOptions = { enablePersonalization: true, forceImmediate: false, includeEncouragement: true, includeNextSteps: true }
  ): Promise<AdaptiveFeedback> {
    try {
      if (!options.enablePersonalization) {
        return this.createBasicFeedback(context);
      }

      const [learningStyle, userProgress, metrics] = await Promise.all([
        PersonalizationDataService.getLearningStyle(context.userId),
        UserProgressService.getUserProgress(context.userId),
        PersonalizationDataService.getPersonalizationMetrics(context.userId)
      ]);

      const adaptationContext: AdaptationContext = {
        userId: context.userId,
        currentSkillLevel: context.userSkillLevel,
        recentPerformance: context.recentPerformance,
        strugglingAreas: context.strugglingAreas,
        excellingAreas: context.excellingAreas,
        timeSpentLearning: this.calculateTimeSpentLearning(userProgress),
        preferredLearningTime: this.inferPreferredLearningTime(context.timeOfDay),
        lastInteractionTime: new Date()
      };

      return await PersonalizationEngine.generateAdaptiveFeedback(
        context.userId,
        context.originalAIResponse,
        adaptationContext
      );
    } catch (error) {
      console.error('Error generating adaptive feedback:', error);
      return this.createBasicFeedback(context);
    }
  }

  /**
   * Adapts feedback delivery timing based on user preferences and context
   */
  static async scheduleAdaptiveFeedback(
    feedback: AdaptiveFeedback,
    context: FeedbackContext,
    options: FeedbackDeliveryOptions
  ): Promise<{
    feedback: AdaptiveFeedback;
    deliveryDelay: number;
    deliveryMethod: 'immediate' | 'notification' | 'email' | 'in_app';
  }> {
    try {
      if (options.forceImmediate) {
        return {
          feedback,
          deliveryDelay: 0,
          deliveryMethod: 'immediate'
        };
      }

      const learningStyle = await PersonalizationDataService.getLearningStyle(context.userId);
      
      let deliveryDelay = this.TIMING_DELAYS[feedback.deliveryStyle];
      let deliveryMethod: 'immediate' | 'notification' | 'email' | 'in_app' = 'immediate';

      // Adapt timing based on context and learning style
      if (context.sessionContext === 'struggling' && learningStyle?.learningPace === 'slow') {
        deliveryDelay = Math.max(deliveryDelay, 5000); // Give more time to process
        deliveryMethod = 'in_app';
      }

      if (context.sessionContext === 'excelling' && learningStyle?.learningPace === 'fast') {
        deliveryDelay = Math.min(deliveryDelay, 1000); // Faster feedback for quick learners
      }

      // Adjust for device type
      if (context.deviceType === 'mobile') {
        deliveryDelay += 1000; // Slightly longer for mobile users
      }

      // Adjust for time of day
      if (context.timeOfDay === 'night' || context.timeOfDay === 'evening') {
        deliveryMethod = 'in_app'; // Less intrusive during evening hours
      }

      return {
        feedback,
        deliveryDelay,
        deliveryMethod
      };
    } catch (error) {
      console.error('Error scheduling adaptive feedback:', error);
      return {
        feedback,
        deliveryDelay: 0,
        deliveryMethod: 'immediate'
      };
    }
  }

  /**
   * Processes user feedback on the adaptive feedback to improve future adaptations
   */
  static async processFeedbackResponse(
    feedbackId: string,
    userId: string,
    userResponse: {
      helpful: boolean;
      tooLong?: boolean;
      tooShort?: boolean;
      wrongTone?: boolean;
      preferredTone?: 'encouraging' | 'direct' | 'analytical' | 'conversational';
      comments?: string;
      rating: number; // 1-5 scale
    }
  ): Promise<void> {
    try {
      // Update personalization metrics
      await PersonalizationEngine.updatePersonalizationMetrics(userId, {
        feedbackEffective: userResponse.helpful,
        userSatisfaction: userResponse.rating
      });

      // Update learning style based on feedback
      const learningStyle = await PersonalizationDataService.getLearningStyle(userId);
      if (learningStyle) {
        const adaptations = [];

        if (userResponse.tooLong) {
          learningStyle.preferredFeedbackType = 'concise';
          adaptations.push({
            adaptationId: `adapt_${Date.now()}`,
            timestamp: new Date(),
            adaptationType: 'feedback_style' as const,
            previousValue: learningStyle.preferredFeedbackType,
            newValue: 'concise',
            reason: 'User indicated feedback was too long'
          });
        }

        if (userResponse.tooShort) {
          learningStyle.preferredFeedbackType = 'detailed';
          adaptations.push({
            adaptationId: `adapt_${Date.now()}`,
            timestamp: new Date(),
            adaptationType: 'feedback_style' as const,
            previousValue: learningStyle.preferredFeedbackType,
            newValue: 'detailed',
            reason: 'User indicated feedback was too short'
          });
        }

        if (userResponse.preferredTone) {
          // Map preferred tone to feedback type
          const toneMapping = {
            encouraging: 'detailed',
            direct: 'concise',
            analytical: 'detailed',
            conversational: 'example_based'
          };
          
          const newFeedbackType = toneMapping[userResponse.preferredTone] as 'detailed' | 'concise' | 'visual' | 'example_based';
          learningStyle.preferredFeedbackType = newFeedbackType;
          
          adaptations.push({
            adaptationId: `adapt_${Date.now()}`,
            timestamp: new Date(),
            adaptationType: 'feedback_style' as const,
            previousValue: learningStyle.preferredFeedbackType,
            newValue: newFeedbackType,
            reason: `User preferred ${userResponse.preferredTone} tone`
          });
        }

        learningStyle.adaptationHistory.push(...adaptations);
        learningStyle.lastUpdated = new Date();

        await PersonalizationDataService.saveLearningStyle(learningStyle);
      }

      // Log feedback for analysis
      console.log(`Feedback response processed for user ${userId}:`, {
        feedbackId,
        helpful: userResponse.helpful,
        rating: userResponse.rating,
        adaptationsMade: learningStyle?.adaptationHistory.length || 0
      });
    } catch (error) {
      console.error('Error processing feedback response:', error);
      throw error;
    }
  }

  /**
   * Generates contextual encouragement based on user's current state
   */
  static generateContextualEncouragement(
    context: FeedbackContext,
    learningStyle: LearningStyle | null
  ): string {
    const encouragements = {
      struggling: [
        "Learning takes time, and you're making progress!",
        "Every expert was once a beginner. Keep going!",
        "You're building important skills with each attempt.",
        "Challenges help us grow. You've got this!"
      ],
      first_time: [
        "Welcome! Great job taking the first step.",
        "Nice start! You're on the right track.",
        "Excellent beginning! Keep exploring.",
        "Good work getting started!"
      ],
      returning: [
        "Welcome back! Ready to continue learning?",
        "Great to see you again! Let's build on your progress.",
        "Nice to have you back! Your consistency is paying off.",
        "Welcome back! Your dedication is impressive."
      ],
      excelling: [
        "Excellent work! You're really mastering this.",
        "Outstanding! Your skills are clearly advancing.",
        "Impressive progress! You're becoming quite skilled.",
        "Fantastic! Your hard work is really showing."
      ]
    };

    const contextEncouragements = encouragements[context.sessionContext] || encouragements.returning;
    const randomIndex = Math.floor(Math.random() * contextEncouragements.length);
    
    return contextEncouragements[randomIndex];
  }

  /**
   * Adapts feedback complexity based on user's cognitive load
   */
  static adaptFeedbackComplexity(
    originalFeedback: string,
    context: FeedbackContext,
    learningStyle: LearningStyle | null
  ): string {
    // If user is struggling or it's late, simplify feedback
    if (context.sessionContext === 'struggling' || 
        context.timeOfDay === 'night' || 
        context.deviceType === 'mobile') {
      return this.simplifyFeedback(originalFeedback);
    }

    // If user is excelling and prefers detailed feedback, enhance it
    if (context.sessionContext === 'excelling' && 
        learningStyle?.preferredFeedbackType === 'detailed') {
      return this.enhanceFeedback(originalFeedback, context);
    }

    return originalFeedback;
  }

  /**
   * Creates personalized next steps based on user's learning pattern
   */
  static generatePersonalizedNextSteps(
    context: FeedbackContext,
    learningStyle: LearningStyle | null
  ): string[] {
    const nextSteps: string[] = [];

    if (context.strugglingAreas.length > 0) {
      const area = context.strugglingAreas[0];
      nextSteps.push(`Focus on strengthening your ${area} skills with targeted practice`);
      
      if (learningStyle?.learningPace === 'slow') {
        nextSteps.push(`Take your time to understand each concept before moving forward`);
      } else {
        nextSteps.push(`Try a few more examples to reinforce your understanding`);
      }
    }

    if (context.excellingAreas.length > 0) {
      const area = context.excellingAreas[0];
      nextSteps.push(`Consider exploring advanced ${area} concepts or helping others learn`);
      nextSteps.push(`Look for opportunities to apply your ${area} skills in real projects`);
    }

    // Add learning style specific suggestions
    if (learningStyle?.interactionStyle === 'collaborative') {
      nextSteps.push(`Consider joining a study group or finding a coding partner`);
    }

    if (learningStyle?.skillFocus === 'breadth') {
      nextSteps.push(`Explore related technologies to broaden your skill set`);
    } else if (learningStyle?.skillFocus === 'depth') {
      nextSteps.push(`Dive deeper into the advanced aspects of this topic`);
    }

    return nextSteps.slice(0, 3); // Limit to 3 next steps
  }

  // Private helper methods

  private static createBasicFeedback(context: FeedbackContext): AdaptiveFeedback {
    return {
      feedbackId: `feedback_${Date.now()}`,
      userId: context.userId,
      originalFeedback: context.originalAIResponse,
      adaptedFeedback: context.originalAIResponse,
      adaptations: [],
      deliveryStyle: 'immediate',
      tone: 'conversational',
      detailLevel: 'medium',
      includesExamples: false,
      includesNextSteps: true,
      timestamp: new Date()
    };
  }

  private static calculateTimeSpentLearning(userProgress: UserProgress | null): number {
    if (!userProgress) return 0;
    
    const daysSinceStart = (Date.now() - userProgress.createdAt.getTime()) / (1000 * 60 * 60 * 24);
    return Math.max(1, daysSinceStart);
  }

  private static inferPreferredLearningTime(currentTime: string): string[] {
    // This would typically be learned from user behavior patterns
    const timePreferences = {
      morning: ['morning', 'afternoon'],
      afternoon: ['afternoon', 'evening'],
      evening: ['evening', 'night'],
      night: ['night', 'morning']
    };
    
    return timePreferences[currentTime as keyof typeof timePreferences] || ['afternoon'];
  }

  private static simplifyFeedback(feedback: string): string {
    // Split into sentences and keep only the most important ones
    const sentences = feedback.split('.').filter(s => s.trim().length > 0);
    
    // Keep first sentence (usually main point) and any sentence with "improve" or "consider"
    const importantSentences = sentences.filter((sentence, index) => 
      index === 0 || 
      sentence.toLowerCase().includes('improve') || 
      sentence.toLowerCase().includes('consider') ||
      sentence.toLowerCase().includes('try')
    );
    
    return importantSentences.slice(0, 2).join('. ') + '.';
  }

  private static enhanceFeedback(feedback: string, context: FeedbackContext): string {
    let enhanced = feedback;
    
    // Add technical details for excelling users
    if (context.sessionContext === 'excelling') {
      enhanced += '\n\nTechnical insight: Consider exploring design patterns, performance optimization, or advanced language features that could enhance this solution further.';
    }
    
    // Add examples if helpful
    if (context.excellingAreas.length > 0) {
      enhanced += `\n\nGiven your strength in ${context.excellingAreas[0]}, you might also explore how this concept applies in more complex scenarios.`;
    }
    
    return enhanced;
  }
}