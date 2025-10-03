// Peer Review System Types for Advanced Learning Analytics

export interface PeerReview {
  reviewId: string;
  reviewerId: string;
  revieweeId: string;
  codeSubmissionId: string;
  sessionId?: string;
  type: 'code_review' | 'mentorship' | 'collaboration';
  status: 'pending' | 'in_progress' | 'completed' | 'declined';
  
  // Review content
  overallRating: number; // 1-5 scale
  feedback: PeerFeedback;
  suggestions: CodeSuggestion[];
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  isAnonymous: boolean;
  visibility: 'public' | 'private' | 'community';
  
  // AI integration
  aiEnhancedFeedback?: AIEnhancedFeedback;
  combinedInsights?: CombinedInsight[];
}

export interface PeerFeedback {
  strengths: string[];
  improvementAreas: string[];
  codeQuality: CodeQualityFeedback;
  bestPractices: BestPracticesFeedback;
  generalComments: string;
  encouragement: string;
}

export interface CodeQualityFeedback {
  readability: number; // 1-5 scale
  efficiency: number;
  maintainability: number;
  testability: number;
  comments: string[];
}

export interface BestPracticesFeedback {
  followsConventions: boolean;
  properErrorHandling: boolean;
  securityConsiderations: boolean;
  performanceOptimizations: boolean;
  comments: string[];
}

export interface CodeSuggestion {
  suggestionId: string;
  lineNumber?: number;
  originalCode?: string;
  suggestedCode: string;
  explanation: string;
  category: 'bug_fix' | 'optimization' | 'style' | 'best_practice' | 'security';
  priority: 'low' | 'medium' | 'high';
  isAccepted?: boolean;
  reviewerNote?: string;
}

export interface AIEnhancedFeedback {
  aiAnalysisId: string;
  peerFeedbackAlignment: number; // How well peer feedback aligns with AI analysis (0-1)
  additionalInsights: string[];
  conflictingOpinions: ConflictingOpinion[];
  synthesizedRecommendations: string[];
  confidenceScore: number;
}

export interface ConflictingOpinion {
  topic: string;
  peerOpinion: string;
  aiOpinion: string;
  explanation: string;
  recommendedApproach: string;
}

export interface CombinedInsight {
  insightId: string;
  type: 'strength' | 'improvement' | 'learning_opportunity';
  title: string;
  description: string;
  sources: ('peer' | 'ai')[];
  actionableSteps: string[];
  priority: 'low' | 'medium' | 'high';
  skillsTargeted: string[];
}

export interface PeerReviewRequest {
  requestId: string;
  requesterId: string;
  codeSubmissionId: string;
  title: string;
  description: string;
  skillLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  skillsRequested: string[];
  urgency: 'low' | 'medium' | 'high';
  estimatedReviewTime: number; // in minutes
  
  // Matching criteria
  preferredReviewerLevel: 'peer' | 'mentor' | 'expert' | 'any';
  isAnonymous: boolean;
  maxReviewers: number;
  
  // Status and timing
  status: 'open' | 'assigned' | 'in_review' | 'completed' | 'expired';
  createdAt: Date;
  expiresAt: Date;
  assignedReviewers: string[];
  completedReviews: string[];
}

export interface ReviewerProfile {
  userId: string;
  username: string;
  skillLevels: Map<string, number>;
  reviewStats: ReviewerStats;
  preferences: ReviewerPreferences;
  availability: ReviewerAvailability;
  reputation: ReviewerReputation;
}

export interface ReviewerStats {
  totalReviewsCompleted: number;
  averageRating: number;
  averageResponseTime: number; // in hours
  specialties: string[];
  reviewsThisMonth: number;
  helpfulnessScore: number; // Based on reviewee feedback
}

export interface ReviewerPreferences {
  skillsToReview: string[];
  maxReviewsPerWeek: number;
  preferredReviewTypes: ('code_review' | 'mentorship' | 'collaboration')[];
  anonymousReviewsOnly: boolean;
  mentorshipAvailable: boolean;
  collaborationInterest: boolean;
}

export interface ReviewerAvailability {
  isAvailable: boolean;
  timeZone: string;
  availableHours: TimeSlot[];
  responseTimeCommitment: number; // in hours
  currentLoad: number; // number of active reviews
}

export interface TimeSlot {
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  startHour: number; // 0-23
  endHour: number; // 0-23
}

export interface ReviewerReputation {
  level: 'novice' | 'contributor' | 'mentor' | 'expert' | 'master';
  points: number;
  badges: ReviewerBadge[];
  endorsements: Endorsement[];
  communityRank?: number;
}

export interface ReviewerBadge {
  badgeId: string;
  name: string;
  description: string;
  iconUrl: string;
  earnedAt: Date;
  category: 'quality' | 'quantity' | 'specialty' | 'community' | 'mentorship';
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
}

export interface Endorsement {
  endorsementId: string;
  endorserId: string;
  endorserName: string;
  skillEndorsed: string;
  comment: string;
  createdAt: Date;
  isVerified: boolean;
}

export interface CommunityContribution {
  contributionId: string;
  userId: string;
  type: 'review' | 'mentorship' | 'collaboration' | 'knowledge_sharing';
  title: string;
  description: string;
  impact: CommunityImpact;
  recognition: ContributionRecognition;
  createdAt: Date;
}

export interface CommunityImpact {
  helpfulnessVotes: number;
  learnersBenefited: number;
  skillsImproved: string[];
  followUpEngagement: number;
  communityReach: number;
}

export interface ContributionRecognition {
  points: number;
  badges: string[];
  publicRecognition: boolean;
  featuredContribution: boolean;
  mentorshipOpportunities: number;
}

export interface PeerReviewSettings {
  userId: string;
  
  // Privacy settings
  profileVisibility: 'public' | 'community' | 'private';
  allowAnonymousReviews: boolean;
  showRealName: boolean;
  shareContactInfo: boolean;
  
  // Notification preferences
  emailNotifications: boolean;
  pushNotifications: boolean;
  reviewRequestNotifications: boolean;
  mentorshipRequestNotifications: boolean;
  
  // Review preferences
  autoAcceptReviews: boolean;
  preferredReviewLength: 'quick' | 'detailed' | 'comprehensive';
  feedbackStyle: 'direct' | 'encouraging' | 'balanced';
  
  // Matching preferences
  skillLevelMatching: 'similar' | 'higher' | 'mixed' | 'any';
  languagePreferences: string[];
  timeZoneMatching: boolean;
  
  updatedAt: Date;
}

// Database document interfaces for Firestore
export interface PeerReviewDocument {
  reviewId: string;
  reviewerId: string;
  revieweeId: string;
  codeSubmissionId: string;
  sessionId?: string;
  type: 'code_review' | 'mentorship' | 'collaboration';
  status: 'pending' | 'in_progress' | 'completed' | 'declined';
  overallRating: number;
  feedback: PeerFeedback;
  suggestions: CodeSuggestion[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  isAnonymous: boolean;
  visibility: 'public' | 'private' | 'community';
  aiEnhancedFeedback?: AIEnhancedFeedback;
  combinedInsights?: CombinedInsight[];
}

export interface PeerReviewRequestDocument {
  requestId: string;
  requesterId: string;
  codeSubmissionId: string;
  title: string;
  description: string;
  skillLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  skillsRequested: string[];
  urgency: 'low' | 'medium' | 'high';
  estimatedReviewTime: number;
  preferredReviewerLevel: 'peer' | 'mentor' | 'expert' | 'any';
  isAnonymous: boolean;
  maxReviewers: number;
  status: 'open' | 'assigned' | 'in_review' | 'completed' | 'expired';
  createdAt: string;
  expiresAt: string;
  assignedReviewers: string[];
  completedReviews: string[];
}

export interface ReviewerProfileDocument {
  userId: string;
  username: string;
  skillLevels: { [skillId: string]: number };
  reviewStats: ReviewerStats;
  preferences: ReviewerPreferences;
  availability: ReviewerAvailability;
  reputation: ReviewerReputation;
}

export interface CommunityContributionDocument {
  contributionId: string;
  userId: string;
  type: 'review' | 'mentorship' | 'collaboration' | 'knowledge_sharing';
  title: string;
  description: string;
  impact: CommunityImpact;
  recognition: ContributionRecognition;
  createdAt: string;
}

export interface PeerReviewSettingsDocument {
  userId: string;
  profileVisibility: 'public' | 'community' | 'private';
  allowAnonymousReviews: boolean;
  showRealName: boolean;
  shareContactInfo: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  reviewRequestNotifications: boolean;
  mentorshipRequestNotifications: boolean;
  autoAcceptReviews: boolean;
  preferredReviewLength: 'quick' | 'detailed' | 'comprehensive';
  feedbackStyle: 'direct' | 'encouraging' | 'balanced';
  skillLevelMatching: 'similar' | 'higher' | 'mixed' | 'any';
  languagePreferences: string[];
  timeZoneMatching: boolean;
  updatedAt: string;
}

// API Response types
export interface PeerReviewMatchResult {
  potentialReviewers: ReviewerProfile[];
  matchingScore: number;
  estimatedResponseTime: number;
  recommendedReviewers: ReviewerProfile[];
}

export interface ReviewAnalytics {
  totalReviews: number;
  averageRating: number;
  skillImprovements: string[];
  mostHelpfulFeedback: string[];
  reviewTrends: ReviewTrend[];
  peerComparisons: PeerComparison[];
}

export interface ReviewTrend {
  period: string;
  reviewCount: number;
  averageRating: number;
  skillsImproved: string[];
}

export interface PeerComparison {
  skillId: string;
  userLevel: number;
  peerAverage: number;
  percentile: number;
  improvementSuggestions: string[];
}