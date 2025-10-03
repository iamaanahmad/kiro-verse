// Personalization Engine Types for Advanced Learning Analytics System

export interface LearningPattern {
  patternId: string;
  userId: string;
  patternType: 'coding_style' | 'learning_pace' | 'skill_preference' | 'feedback_response' | 'challenge_preference';
  description: string;
  confidence: number;
  evidence: PatternEvidence[];
  detectedAt: Date;
  lastUpdated: Date;
}

export interface PatternEvidence {
  evidenceType: 'code_submission' | 'challenge_completion' | 'feedback_interaction' | 'time_spent';
  sessionId: string;
  timestamp: Date;
  data: Record<string, any>;
  weight: number;
}

export interface LearningStyle {
  userId: string;
  preferredFeedbackType: 'detailed' | 'concise' | 'visual' | 'example_based';
  learningPace: 'fast' | 'moderate' | 'slow' | 'variable';
  skillFocus: 'breadth' | 'depth' | 'balanced';
  challengePreference: 'incremental' | 'challenging' | 'mixed';
  interactionStyle: 'independent' | 'collaborative' | 'mentorship_seeking';
  motivationFactors: MotivationFactor[];
  adaptationHistory: AdaptationRecord[];
  lastUpdated: Date;
}

export interface MotivationFactor {
  factor: 'achievement' | 'competition' | 'learning' | 'recognition' | 'skill_building';
  strength: number; // 0-1 scale
  evidence: string[];
}

export interface AdaptationRecord {
  adaptationId: string;
  timestamp: Date;
  adaptationType: 'feedback_style' | 'challenge_difficulty' | 'resource_suggestion' | 'pace_adjustment';
  previousValue: string;
  newValue: string;
  reason: string;
  effectiveness?: number; // Measured after adaptation
}

export interface PersonalizedRecommendation {
  recommendationId: string;
  userId: string;
  type: 'resource' | 'challenge' | 'skill_focus' | 'learning_path' | 'peer_connection';
  title: string;
  description: string;
  reasoning: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  targetSkills: string[];
  estimatedTimeInvestment: number; // in minutes
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  personalizedContent: PersonalizedContent;
  expiresAt?: Date;
  isAccepted?: boolean;
  acceptedAt?: Date;
  completedAt?: Date;
  effectiveness?: number;
  createdAt: Date;
}

export interface PersonalizedContent {
  contentType: 'challenge' | 'tutorial' | 'exercise' | 'project' | 'reading' | 'video';
  content: string;
  metadata: Record<string, any>;
  adaptations: ContentAdaptation[];
}

export interface ContentAdaptation {
  adaptationType: 'difficulty' | 'style' | 'pace' | 'examples' | 'explanations';
  originalValue: string;
  adaptedValue: string;
  reason: string;
}

export interface AdaptiveFeedback {
  feedbackId: string;
  userId: string;
  originalFeedback: string;
  adaptedFeedback: string;
  adaptations: FeedbackAdaptation[];
  deliveryStyle: 'immediate' | 'delayed' | 'progressive' | 'on_demand';
  tone: 'encouraging' | 'direct' | 'analytical' | 'conversational';
  detailLevel: 'high' | 'medium' | 'low';
  includesExamples: boolean;
  includesNextSteps: boolean;
  timestamp: Date;
}

export interface FeedbackAdaptation {
  adaptationType: 'tone' | 'detail_level' | 'examples' | 'structure' | 'timing';
  reason: string;
  confidence: number;
}

export interface ResourceSuggestion {
  suggestionId: string;
  userId: string;
  resourceType: 'documentation' | 'tutorial' | 'course' | 'practice_problem' | 'tool' | 'library';
  title: string;
  description: string;
  url?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  estimatedTime: number; // in minutes
  skillsAddressed: string[];
  personalizedReason: string;
  relevanceScore: number;
  urgency: 'low' | 'medium' | 'high';
  createdAt: Date;
  viewedAt?: Date;
  completedAt?: Date;
  userRating?: number;
}

export interface ChallengeRecommendation {
  recommendationId: string;
  userId: string;
  challengeId?: string; // If existing challenge
  customChallenge?: CustomChallenge; // If generated challenge
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  skillsTargeted: string[];
  personalizedAspects: PersonalizationAspect[];
  estimatedDuration: number;
  reasoning: string;
  confidenceScore: number;
  createdAt: Date;
  acceptedAt?: Date;
  completedAt?: Date;
  userFeedback?: ChallengeUserFeedback;
}

export interface CustomChallenge {
  title: string;
  description: string;
  prompt: string;
  expectedApproach: string[];
  evaluationCriteria: string[];
  hints: string[];
  testCases: TestCase[];
  learningObjectives: string[];
}

export interface TestCase {
  input: string;
  expectedOutput: string;
  isHidden: boolean;
  weight: number;
  description?: string;
}

export interface PersonalizationAspect {
  aspect: 'difficulty_curve' | 'problem_domain' | 'coding_style' | 'time_constraint' | 'collaboration';
  value: string;
  reason: string;
}

export interface ChallengeUserFeedback {
  difficulty: 'too_easy' | 'just_right' | 'too_hard';
  engagement: 'boring' | 'interesting' | 'exciting';
  clarity: 'confusing' | 'clear' | 'very_clear';
  relevance: 'not_relevant' | 'somewhat_relevant' | 'very_relevant';
  comments?: string;
  rating: number; // 1-5 scale
}

export interface PersonalizationMetrics {
  userId: string;
  adaptationAccuracy: number; // How often adaptations improve outcomes
  recommendationAcceptanceRate: number;
  learningVelocityImprovement: number;
  engagementScore: number;
  satisfactionScore: number;
  skillProgressionRate: number;
  retentionRate: number;
  lastCalculated: Date;
}

export interface PersonalizationConfig {
  enableAdaptiveFeedback: boolean;
  enableResourceSuggestions: boolean;
  enableChallengeRecommendations: boolean;
  enableLearningPathOptimization: boolean;
  adaptationSensitivity: 'low' | 'medium' | 'high';
  minDataPointsForAdaptation: number;
  maxRecommendationsPerDay: number;
  feedbackDelay: number; // in milliseconds
  experimentalFeatures: string[];
}

// Database document interfaces for Firestore
export interface LearningPatternDocument {
  patternId: string;
  userId: string;
  patternType: 'coding_style' | 'learning_pace' | 'skill_preference' | 'feedback_response' | 'challenge_preference';
  description: string;
  confidence: number;
  evidence: PatternEvidence[];
  detectedAt: string;
  lastUpdated: string;
}

export interface LearningStyleDocument {
  userId: string;
  preferredFeedbackType: 'detailed' | 'concise' | 'visual' | 'example_based';
  learningPace: 'fast' | 'moderate' | 'slow' | 'variable';
  skillFocus: 'breadth' | 'depth' | 'balanced';
  challengePreference: 'incremental' | 'challenging' | 'mixed';
  interactionStyle: 'independent' | 'collaborative' | 'mentorship_seeking';
  motivationFactors: MotivationFactor[];
  adaptationHistory: AdaptationRecord[];
  lastUpdated: string;
}

export interface PersonalizedRecommendationDocument {
  recommendationId: string;
  userId: string;
  type: 'resource' | 'challenge' | 'skill_focus' | 'learning_path' | 'peer_connection';
  title: string;
  description: string;
  reasoning: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  targetSkills: string[];
  estimatedTimeInvestment: number;
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  personalizedContent: PersonalizedContent;
  expiresAt?: string;
  isAccepted?: boolean;
  acceptedAt?: string;
  completedAt?: string;
  effectiveness?: number;
  createdAt: string;
}

export interface ResourceSuggestionDocument {
  suggestionId: string;
  userId: string;
  resourceType: 'documentation' | 'tutorial' | 'course' | 'practice_problem' | 'tool' | 'library';
  title: string;
  description: string;
  url?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  estimatedTime: number;
  skillsAddressed: string[];
  personalizedReason: string;
  relevanceScore: number;
  urgency: 'low' | 'medium' | 'high';
  createdAt: string;
  viewedAt?: string;
  completedAt?: string;
  userRating?: number;
}

export interface ChallengeRecommendationDocument {
  recommendationId: string;
  userId: string;
  challengeId?: string;
  customChallenge?: CustomChallenge;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  skillsTargeted: string[];
  personalizedAspects: PersonalizationAspect[];
  estimatedDuration: number;
  reasoning: string;
  confidenceScore: number;
  createdAt: string;
  acceptedAt?: string;
  completedAt?: string;
  userFeedback?: ChallengeUserFeedback;
}