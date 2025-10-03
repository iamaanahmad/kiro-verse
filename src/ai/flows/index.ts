/**
 * @fileOverview Export all AI flows for easy importing
 */

// Core AI flows
export { sendChatMessage } from './send-chat-message';
export { getCodeFeedback } from './get-code-feedback';
export { awardSkillBadge } from './award-skill-badge';
export { generateBadgeIcon } from './generate-badge-icon';

// Challenge and assessment flows
export { generateCodingChallenge } from './generate-coding-challenge';
export { generateAssessmentChallenge } from './generate-assessment-challenge';

// Collaboration flows
export { collaborativeSessionMentor } from './collaborative-session-mentor';

// Advanced personalization flows
export { generatePersonalizedChallenge } from './generate-personalized-challenge';
export { peerMentorshipFacilitator } from './peer-mentorship-facilitator';
export { learningPathOptimizer } from './learning-path-optimizer';
export { skillBenchmarkAnalyzer } from './skill-benchmark-analyzer';

// Type exports
export type { SendChatMessageInput, SendChatMessageOutput } from './send-chat-message';
export type { GetCodeFeedbackInput, GetCodeFeedbackOutput } from './get-code-feedback';
export type { AwardSkillBadgeInput, AwardSkillBadgeOutput } from './award-skill-badge';
export type { GenerateBadgeIconInput, GenerateBadgeIconOutput } from './generate-badge-icon';
export type { GenerateCodingChallengeInput, GenerateCodingChallengeOutput } from './generate-coding-challenge';
export type { GenerateAssessmentChallengeInput, GenerateAssessmentChallengeOutput } from './generate-assessment-challenge';
export type { CollaborativeSessionMentorInput, CollaborativeSessionMentorOutput } from './collaborative-session-mentor';
export type { GeneratePersonalizedChallengeInput, GeneratePersonalizedChallengeOutput } from './generate-personalized-challenge';
export type { PeerMentorshipFacilitatorInput, PeerMentorshipFacilitatorOutput } from './peer-mentorship-facilitator';
export type { LearningPathOptimizerInput, LearningPathOptimizerOutput } from './learning-path-optimizer';
export type { SkillBenchmarkAnalyzerInput, SkillBenchmarkAnalyzerOutput } from './skill-benchmark-analyzer';