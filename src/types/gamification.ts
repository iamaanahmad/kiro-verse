// Gamification Data Models for Points and Badge System

export interface PointsCalculation {
  basePoints: number;
  qualityBonus: number;
  efficiencyBonus: number;
  creativityBonus: number;
  bestPracticesBonus: number;
  difficultyMultiplier: number;
  totalPoints: number;
  breakdown: PointsBreakdown[];
}

export interface PointsBreakdown {
  category: string;
  points: number;
  description: string;
  multiplier?: number;
}

export interface BadgeAward {
  badgeId: string;
  badgeName: string;
  badgeType: BadgeType;
  rarity: BadgeRarity;
  description: string;
  iconUrl?: string;
  criteria: BadgeCriteria;
  awardedAt: Date;
  verificationStatus: 'verified' | 'pending' | 'unverified';
  blockchainTxHash?: string;
  metadata: BadgeMetadata;
}

export interface BadgeType {
  category: 'skill' | 'achievement' | 'milestone' | 'special' | 'community';
  subcategory: string;
  skillArea?: string;
}

export interface BadgeRarity {
  level: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  rarityScore: number; // 1-100, higher = rarer
  estimatedHolders: number;
  globalPercentage: number;
}

export interface BadgeCriteria {
  minimumSkillLevel?: number;
  requiredPoints?: number;
  codeQualityThreshold?: number;
  specificSkills?: string[];
  challengeCompletion?: boolean;
  peerReviewScore?: number;
  timeConstraints?: TimeConstraint;
  specialConditions?: string[];
}

export interface TimeConstraint {
  type: 'within_timeframe' | 'consecutive_days' | 'single_session';
  duration?: number; // in minutes/hours/days
  startDate?: Date;
  endDate?: Date;
}

export interface BadgeMetadata {
  skillsValidated: string[];
  codeQualityScore: number;
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  evidenceHash?: string;
  issuerSignature?: string;
  validationCriteria: ValidationCriteria[];
}

export interface ValidationCriteria {
  criterion: string;
  value: number | string | boolean;
  threshold?: number;
  passed: boolean;
}

export interface AchievementProgress {
  achievementId: string;
  userId: string;
  currentProgress: number;
  targetProgress: number;
  progressPercentage: number;
  milestones: Milestone[];
  isCompleted: boolean;
  estimatedCompletion?: Date;
  lastUpdated: Date;
}

export interface Milestone {
  milestoneId: string;
  name: string;
  description: string;
  targetValue: number;
  currentValue: number;
  isCompleted: boolean;
  completedAt?: Date;
  reward?: MilestoneReward;
}

export interface MilestoneReward {
  type: 'points' | 'badge' | 'title' | 'unlock';
  value: number | string;
  description: string;
}

export interface SpecialBadge extends BadgeAward {
  eventId?: string;
  limitedEdition: boolean;
  serialNumber?: number;
  totalMinted?: number;
  expirationDate?: Date;
  transferable: boolean;
}

export interface CommunityBadge extends BadgeAward {
  contributionType: 'peer_review' | 'mentorship' | 'content_creation' | 'bug_report' | 'feature_suggestion';
  impactScore: number;
  communityVotes?: number;
  endorsements: string[]; // User IDs who endorsed this contribution
}

// Points calculation configuration
export interface PointsConfig {
  basePointsRange: { min: number; max: number };
  qualityBonusMultiplier: number;
  efficiencyBonusMultiplier: number;
  creativityBonusMultiplier: number;
  bestPracticesBonusMultiplier: number;
  difficultyMultipliers: {
    beginner: number;
    intermediate: number;
    advanced: number;
    expert: number;
  };
  rarityBonuses: {
    common: number;
    uncommon: number;
    rare: number;
    epic: number;
    legendary: number;
  };
}

// Badge rarity calculation
export interface RarityCalculation {
  baseRarity: number;
  difficultyBonus: number;
  qualityBonus: number;
  timeBonus: number;
  communityBonus: number;
  finalRarity: number;
  rarityLevel: BadgeRarity['level'];
}

// Achievement tracking
export interface Achievement {
  achievementId: string;
  name: string;
  description: string;
  category: 'progression' | 'mastery' | 'consistency' | 'innovation' | 'community';
  difficulty: 'easy' | 'medium' | 'hard' | 'extreme';
  requirements: AchievementRequirement[];
  rewards: AchievementReward[];
  isHidden: boolean;
  unlockConditions?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AchievementRequirement {
  type: 'skill_level' | 'points_earned' | 'badges_collected' | 'challenges_completed' | 'peer_reviews' | 'consecutive_days';
  target: number;
  skillId?: string;
  timeframe?: number; // in days
  additionalCriteria?: Record<string, any>;
}

export interface AchievementReward {
  type: 'points' | 'badge' | 'title' | 'unlock' | 'multiplier';
  value: number | string;
  duration?: number; // for temporary rewards
  description: string;
}

// Leaderboard and competition types
export interface LeaderboardEntry {
  userId: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  totalPoints: number;
  rank: number;
  previousRank?: number;
  rankChange: 'up' | 'down' | 'same' | 'new';
  badgeCount: number;
  rareBadgeCount: number;
  skillLevels: Record<string, number>;
  lastActivity: Date;
  isAnonymized: boolean;
}

export interface Competition {
  competitionId: string;
  title: string;
  description: string;
  type: 'daily' | 'weekly' | 'monthly' | 'special' | 'seasonal';
  category: 'skill_based' | 'challenge_based' | 'community_based' | 'innovation';
  startDate: Date;
  endDate: Date;
  registrationDeadline?: Date;
  maxParticipants?: number;
  entryFee?: number; // in points
  prizes: CompetitionPrize[];
  rules: CompetitionRule[];
  participants: CompetitionParticipant[];
  leaderboard: LeaderboardEntry[];
  status: 'upcoming' | 'registration_open' | 'active' | 'completed' | 'cancelled';
  createdBy: string;
  sponsoredBy?: string;
  metadata: CompetitionMetadata;
}

export interface CompetitionPrize {
  rank: number | string; // e.g., 1, "top_10", "participation"
  title: string;
  description: string;
  type: 'points' | 'badge' | 'nft' | 'title' | 'recognition' | 'unlock';
  value: number | string;
  rarity?: BadgeRarity['level'];
  limitedEdition?: boolean;
}

export interface CompetitionRule {
  ruleId: string;
  description: string;
  category: 'eligibility' | 'scoring' | 'conduct' | 'submission';
  isRequired: boolean;
  penalty?: string;
}

export interface CompetitionParticipant {
  userId: string;
  username: string;
  registeredAt: Date;
  currentScore: number;
  currentRank: number;
  submissionsCount: number;
  lastSubmissionAt?: Date;
  qualificationStatus: 'qualified' | 'disqualified' | 'pending';
  achievements: string[]; // Achievement IDs earned during competition
}

export interface CompetitionMetadata {
  totalParticipants: number;
  averageScore: number;
  topScore: number;
  submissionsCount: number;
  skillsTargeted: string[];
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert' | 'mixed';
  estimatedDuration: number; // in minutes
}

// Database document interfaces for Firestore
export interface BadgeAwardDocument {
  badgeId: string;
  badgeName: string;
  badgeType: BadgeType;
  rarity: BadgeRarity;
  description: string;
  iconUrl?: string;
  criteria: BadgeCriteria;
  awardedAt: string; // ISO string
  verificationStatus: 'verified' | 'pending' | 'unverified';
  blockchainTxHash?: string;
  metadata: BadgeMetadata;
}

export interface AchievementProgressDocument {
  achievementId: string;
  userId: string;
  currentProgress: number;
  targetProgress: number;
  progressPercentage: number;
  milestones: Milestone[];
  isCompleted: boolean;
  estimatedCompletion?: string; // ISO string
  lastUpdated: string; // ISO string
}

export interface CompetitionDocument {
  competitionId: string;
  title: string;
  description: string;
  type: 'daily' | 'weekly' | 'monthly' | 'special' | 'seasonal';
  category: 'skill_based' | 'challenge_based' | 'community_based' | 'innovation';
  startDate: string; // ISO string
  endDate: string; // ISO string
  registrationDeadline?: string; // ISO string
  maxParticipants?: number;
  entryFee?: number;
  prizes: CompetitionPrize[];
  rules: CompetitionRule[];
  participants: CompetitionParticipant[];
  leaderboard: LeaderboardEntry[];
  status: 'upcoming' | 'registration_open' | 'active' | 'completed' | 'cancelled';
  createdBy: string;
  sponsoredBy?: string;
  metadata: CompetitionMetadata;
}