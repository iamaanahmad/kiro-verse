export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  txHash: string;
  date: string;
  icon: string; // Can be a lucide-react icon name OR a base64 data URI for generated images
  // Enhanced metadata for blockchain verification
  metadata?: BadgeMetadata;
  verificationStatus?: 'verified' | 'pending' | 'unverified';
  blockchainData?: BlockchainVerificationData;
}

export interface BadgeMetadata {
  skillProgression: {
    skillLevel: number;
    experiencePoints: number;
    previousLevel?: number;
    isLevelUp: boolean;
    competencyAreas: string[];
    industryBenchmark?: {
      percentile: number;
      experienceLevel: string;
    };
  };
  achievementDetails: {
    codeQuality: number;
    efficiency: number;
    creativity: number;
    bestPractices: number;
    complexity: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    detectedSkills: string[];
    improvementAreas: string[];
    strengths: string[];
  };
  verificationData: {
    issuedAt: string;
    issuerId: string;
    verificationMethod: 'ai_analysis' | 'peer_review' | 'assessment' | 'project_analysis';
    evidenceHash?: string;
    witnessSignatures?: string[];
  };
  rarity: {
    level: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
    totalIssued: number;
    globalRank?: number;
    rarityScore: number;
  };
  employerInfo?: {
    jobRelevance: string[];
    marketValue: number;
    demandLevel: 'low' | 'medium' | 'high' | 'critical';
    salaryImpact?: number;
  };
}

export interface BlockchainVerificationData {
  contractAddress: string;
  tokenId?: string;
  network: 'sepolia' | 'mainnet' | 'polygon';
  blockNumber?: number;
  gasUsed?: number;
  confirmations: number;
  verificationUrl: string;
  ipfsHash?: string;
  onChainMetadata?: string;
}

// Export analytics types
export * from './analytics';
