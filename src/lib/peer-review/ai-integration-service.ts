// AI Integration Service for Peer Review System
// Combines peer feedback with AI analysis for enhanced learning insights

import { 
  PeerReview, 
  AIEnhancedFeedback, 
  CombinedInsight, 
  ConflictingOpinion 
} from '@/types/peer-review';
import { AnalyticsData, LearningInsight } from '@/types/analytics';
import { generateObject } from 'ai';
import { gemini2Flash } from '@/ai/models';
import { z } from 'zod';

// Schema for AI analysis of peer feedback
const AIFeedbackAnalysisSchema = z.object({
  peerFeedbackAlignment: z.number().min(0).max(1).describe('How well peer feedback aligns with AI analysis (0-1)'),
  additionalInsights: z.array(z.string()).describe('Additional insights not covered by peer feedback'),
  conflictingOpinions: z.array(z.object({
    topic: z.string().describe('The topic where opinions differ'),
    peerOpinion: z.string().describe('What the peer reviewer said'),
    aiOpinion: z.string().describe('What the AI analysis suggests'),
    explanation: z.string().describe('Why there might be a difference'),
    recommendedApproach: z.string().describe('The recommended approach to resolve the conflict')
  })).describe('Areas where peer and AI opinions differ'),
  synthesizedRecommendations: z.array(z.string()).describe('Combined recommendations from both peer and AI feedback'),
  confidenceScore: z.number().min(0).max(1).describe('Confidence in the combined analysis')
});

const CombinedInsightSchema = z.object({
  insights: z.array(z.object({
    type: z.enum(['strength', 'improvement', 'learning_opportunity']).describe('Type of insight'),
    title: z.string().describe('Brief title for the insight'),
    description: z.string().describe('Detailed description of the insight'),
    sources: z.array(z.enum(['peer', 'ai'])).describe('Whether this insight comes from peer review, AI, or both'),
    actionableSteps: z.array(z.string()).describe('Specific steps the developer can take'),
    priority: z.enum(['low', 'medium', 'high']).describe('Priority level for addressing this insight'),
    skillsTargeted: z.array(z.string()).describe('Skills that this insight helps improve')
  }))
});

export class AIIntegrationService {
  /**
   * Enhances peer review with AI analysis
   */
  static async enhancePeerReviewWithAI(
    peerReview: PeerReview,
    codeContent: string,
    aiAnalysis?: AnalyticsData
  ): Promise<AIEnhancedFeedback> {
    try {
      const prompt = this.buildAIEnhancementPrompt(peerReview, codeContent, aiAnalysis);
      
      const { object: analysis } = await generateObject({
        model: gemini2Flash,
        schema: AIFeedbackAnalysisSchema,
        prompt
      });

      return {
        aiAnalysisId: `ai_enhanced_${Date.now()}`,
        peerFeedbackAlignment: analysis.peerFeedbackAlignment,
        additionalInsights: analysis.additionalInsights,
        conflictingOpinions: analysis.conflictingOpinions,
        synthesizedRecommendations: analysis.synthesizedRecommendations,
        confidenceScore: analysis.confidenceScore
      };
    } catch (error) {
      console.error('Error enhancing peer review with AI:', error);
      throw error;
    }
  }

  /**
   * Generates combined insights from peer and AI feedback
   */
  static async generateCombinedInsights(
    peerReview: PeerReview,
    aiEnhancedFeedback: AIEnhancedFeedback,
    codeContent: string
  ): Promise<CombinedInsight[]> {
    try {
      const prompt = this.buildCombinedInsightsPrompt(peerReview, aiEnhancedFeedback, codeContent);
      
      const { object: result } = await generateObject({
        model: gemini2Flash,
        schema: CombinedInsightSchema,
        prompt
      });

      return result.insights.map((insight, index) => ({
        insightId: `combined_${Date.now()}_${index}`,
        ...insight
      }));
    } catch (error) {
      console.error('Error generating combined insights:', error);
      throw error;
    }
  }

  /**
   * Analyzes peer feedback quality and provides suggestions for improvement
   */
  static async analyzePeerFeedbackQuality(peerReview: PeerReview): Promise<{
    qualityScore: number;
    strengths: string[];
    improvementSuggestions: string[];
    helpfulnessIndicators: string[];
  }> {
    try {
      const qualityAnalysisSchema = z.object({
        qualityScore: z.number().min(0).max(1).describe('Overall quality score of the peer feedback'),
        strengths: z.array(z.string()).describe('What makes this feedback valuable'),
        improvementSuggestions: z.array(z.string()).describe('How the feedback could be improved'),
        helpfulnessIndicators: z.array(z.string()).describe('Specific elements that make this feedback helpful')
      });

      const prompt = `
        Analyze the quality of this peer review feedback:

        Overall Rating: ${peerReview.overallRating}/5
        
        Strengths mentioned:
        ${peerReview.feedback.strengths.map(s => `- ${s}`).join('\n')}
        
        Improvement areas:
        ${peerReview.feedback.improvementAreas.map(a => `- ${a}`).join('\n')}
        
        Code quality ratings:
        - Readability: ${peerReview.feedback.codeQuality.readability}/5
        - Efficiency: ${peerReview.feedback.codeQuality.efficiency}/5
        - Maintainability: ${peerReview.feedback.codeQuality.maintainability}/5
        - Testability: ${peerReview.feedback.codeQuality.testability}/5
        
        General comments: ${peerReview.feedback.generalComments}
        Encouragement: ${peerReview.feedback.encouragement}
        
        Number of code suggestions: ${peerReview.suggestions.length}

        Evaluate the quality, constructiveness, and helpfulness of this feedback.
        Consider specificity, actionability, balance between positive and constructive feedback,
        and overall educational value.
      `;

      const { object: analysis } = await generateObject({
        model: gemini2Flash,
        schema: qualityAnalysisSchema,
        prompt
      });

      return analysis;
    } catch (error) {
      console.error('Error analyzing peer feedback quality:', error);
      throw error;
    }
  }

  /**
   * Suggests improvements for peer reviewers based on their review history
   */
  static async generateReviewerImprovementSuggestions(
    reviewHistory: PeerReview[],
    reviewerSkills: string[]
  ): Promise<{
    overallFeedback: string;
    specificSuggestions: string[];
    skillDevelopmentAreas: string[];
    mentorshipOpportunities: string[];
  }> {
    try {
      const improvementSchema = z.object({
        overallFeedback: z.string().describe('Overall assessment of reviewing skills'),
        specificSuggestions: z.array(z.string()).describe('Specific ways to improve review quality'),
        skillDevelopmentAreas: z.array(z.string()).describe('Technical skills to develop for better reviews'),
        mentorshipOpportunities: z.array(z.string()).describe('Areas where they could mentor others')
      });

      const recentReviews = reviewHistory.slice(0, 10);
      const avgRating = recentReviews.reduce((sum, r) => sum + r.overallRating, 0) / recentReviews.length;
      const totalSuggestions = recentReviews.reduce((sum, r) => sum + r.suggestions.length, 0);

      const prompt = `
        Analyze this reviewer's performance and provide improvement suggestions:

        Reviewer Skills: ${reviewerSkills.join(', ')}
        Total Reviews: ${reviewHistory.length}
        Recent Reviews Analyzed: ${recentReviews.length}
        Average Rating Given: ${avgRating.toFixed(1)}/5
        Total Code Suggestions Made: ${totalSuggestions}

        Recent Review Patterns:
        ${recentReviews.map((review, index) => `
        Review ${index + 1}:
        - Rating: ${review.overallRating}/5
        - Strengths mentioned: ${review.feedback.strengths.length}
        - Improvements suggested: ${review.feedback.improvementAreas.length}
        - Code suggestions: ${review.suggestions.length}
        - Has encouragement: ${review.feedback.encouragement ? 'Yes' : 'No'}
        `).join('\n')}

        Provide constructive feedback to help this reviewer improve their peer review skills,
        become more helpful to the community, and identify areas where they could mentor others.
      `;

      const { object: suggestions } = await generateObject({
        model: gemini2Flash,
        schema: improvementSchema,
        prompt
      });

      return suggestions;
    } catch (error) {
      console.error('Error generating reviewer improvement suggestions:', error);
      throw error;
    }
  }

  /**
   * Builds prompt for AI enhancement of peer review
   */
  private static buildAIEnhancementPrompt(
    peerReview: PeerReview,
    codeContent: string,
    aiAnalysis?: AnalyticsData
  ): string {
    return `
      You are an AI mentor analyzing peer review feedback to enhance learning outcomes.
      
      CODE BEING REVIEWED:
      \`\`\`
      ${codeContent}
      \`\`\`

      PEER REVIEW FEEDBACK:
      Overall Rating: ${peerReview.overallRating}/5
      
      Strengths:
      ${peerReview.feedback.strengths.map(s => `- ${s}`).join('\n')}
      
      Areas for Improvement:
      ${peerReview.feedback.improvementAreas.map(a => `- ${a}`).join('\n')}
      
      Code Quality Assessment:
      - Readability: ${peerReview.feedback.codeQuality.readability}/5
      - Efficiency: ${peerReview.feedback.codeQuality.efficiency}/5
      - Maintainability: ${peerReview.feedback.codeQuality.maintainability}/5
      - Testability: ${peerReview.feedback.codeQuality.testability}/5
      
      General Comments: ${peerReview.feedback.generalComments}
      
      Code Suggestions: ${peerReview.suggestions.length} suggestions provided

      ${aiAnalysis ? `
      PREVIOUS AI ANALYSIS:
      ${aiAnalysis.learningInsights.map(insight => `- ${insight.description}`).join('\n')}
      ` : ''}

      Your task:
      1. Assess how well the peer feedback aligns with technical best practices
      2. Identify any important insights the peer reviewer might have missed
      3. Note any conflicting opinions between peer and AI analysis (if available)
      4. Synthesize the best recommendations from both sources
      5. Provide a confidence score for the combined analysis

      Focus on educational value and helping the developer improve their skills.
    `;
  }

  /**
   * Builds prompt for generating combined insights
   */
  private static buildCombinedInsightsPrompt(
    peerReview: PeerReview,
    aiEnhancedFeedback: AIEnhancedFeedback,
    codeContent: string
  ): string {
    return `
      Create actionable learning insights by combining peer review feedback with AI analysis.

      PEER FEEDBACK SUMMARY:
      - Overall Rating: ${peerReview.overallRating}/5
      - Key Strengths: ${peerReview.feedback.strengths.join(', ')}
      - Improvement Areas: ${peerReview.feedback.improvementAreas.join(', ')}
      - Code Suggestions: ${peerReview.suggestions.length}

      AI ENHANCEMENT RESULTS:
      - Alignment Score: ${aiEnhancedFeedback.peerFeedbackAlignment}
      - Additional Insights: ${aiEnhancedFeedback.additionalInsights.join(', ')}
      - Synthesized Recommendations: ${aiEnhancedFeedback.synthesizedRecommendations.join(', ')}
      - Confidence: ${aiEnhancedFeedback.confidenceScore}

      CONFLICTING OPINIONS:
      ${aiEnhancedFeedback.conflictingOpinions.map(conflict => 
        `- ${conflict.topic}: Peer says "${conflict.peerOpinion}" vs AI suggests "${conflict.aiOpinion}"`
      ).join('\n')}

      Generate comprehensive insights that:
      1. Highlight the developer's strengths (from both peer and AI feedback)
      2. Identify clear improvement opportunities with specific actions
      3. Suggest learning opportunities for skill development
      4. Prioritize insights based on impact and feasibility
      5. Target specific skills for development

      Each insight should be actionable, specific, and educational.
      Focus on helping the developer grow their skills systematically.
    `;
  }

  /**
   * Updates community contribution tracking when peer reviews are enhanced with AI
   */
  static async trackAIEnhancedContribution(
    reviewerId: string,
    peerReview: PeerReview,
    aiEnhancedFeedback: AIEnhancedFeedback
  ): Promise<void> {
    try {
      // Calculate contribution impact based on AI enhancement
      const impactScore = this.calculateContributionImpact(peerReview, aiEnhancedFeedback);
      
      // This would integrate with the existing community contribution system
      // For now, we'll log the enhanced contribution
      console.log('AI-Enhanced Peer Review Contribution:', {
        reviewerId,
        reviewId: peerReview.reviewId,
        impactScore,
        alignmentScore: aiEnhancedFeedback.peerFeedbackAlignment,
        confidenceScore: aiEnhancedFeedback.confidenceScore
      });
    } catch (error) {
      console.error('Error tracking AI-enhanced contribution:', error);
    }
  }

  /**
   * Calculates the impact score of a peer review contribution
   */
  private static calculateContributionImpact(
    peerReview: PeerReview,
    aiEnhancedFeedback: AIEnhancedFeedback
  ): number {
    let score = 0;
    
    // Base score from peer review quality
    score += peerReview.feedback.strengths.length * 2;
    score += peerReview.feedback.improvementAreas.length * 3;
    score += peerReview.suggestions.length * 5;
    
    // Bonus for comprehensive feedback
    if (peerReview.feedback.generalComments.length > 50) score += 5;
    if (peerReview.feedback.encouragement.length > 20) score += 3;
    
    // AI alignment bonus
    score += aiEnhancedFeedback.peerFeedbackAlignment * 10;
    score += aiEnhancedFeedback.confidenceScore * 5;
    
    // Penalty for conflicting opinions (indicates potential inaccuracy)
    score -= aiEnhancedFeedback.conflictingOpinions.length * 2;
    
    return Math.max(0, Math.min(100, score));
  }
}