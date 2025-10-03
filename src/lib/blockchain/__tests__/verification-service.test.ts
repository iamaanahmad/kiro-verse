import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BlockchainVerificationService } from '../verification-service';
import type { BadgeMetadata } from '@/types';

// Mock ethers
vi.mock('ethers', () => ({
  ethers: {
    JsonRpcProvider: vi.fn().mockImplementation(() => ({
      getBlockNumber: vi.fn().mockResolvedValue(12345678),
      getBalance: vi.fn().mockResolvedValue(BigInt('1000000000000000000')), // 1 ETH
      getFeeData: vi.fn().mockResolvedValue({
        gasPrice: BigInt('20000000000') // 20 gwei
      }),
      getTransactionReceipt: vi.fn().mockResolvedValue({
        hash: '0x1234567890abcdef',
        blockNumber: 12345678,
        gasUsed: BigInt('150000'),
        logs: [{
          topics: ['0x...', '0x...', '0x...', '0x...'],
          data: '0x...'
        }]
      })
    })),
    Wallet: vi.fn().mockImplementation(() => ({
      address: '0x742d35Cc6634C0532925a3b8D4C9db96C4b5Da5e'
    })),
    Contract: vi.fn().mockImplementation(() => ({
      mintSkillBadgeWithMetadata: vi.fn().mockResolvedValue({
        hash: '0x1234567890abcdef',
        wait: vi.fn().mockResolvedValue({
          hash: '0x1234567890abcdef',
          blockNumber: 12345678,
          gasUsed: BigInt('150000'),
          logs: [{
            topics: ['0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'],
            data: '0x0000000000000000000000000000000000000000000000000000000000000001'
          }]
        })
      }),
      totalSupply: vi.fn().mockResolvedValue(BigInt('1247')),
      ownerOf: vi.fn().mockResolvedValue('0x742d35Cc6634C0532925a3b8D4C9db96C4b5Da5e'),
      tokenURI: vi.fn().mockResolvedValue('KiroVerse-JavaScript-L3'),
      getTokenMetadata: vi.fn().mockResolvedValue(JSON.stringify({
        name: 'JavaScript Mastery',
        skill_level: 3,
        rarity: 'rare'
      })),
      interface: {
        parseLog: vi.fn().mockReturnValue({
          name: 'Transfer',
          args: {
            tokenId: BigInt('1')
          }
        })
      }
    })),
    formatEther: vi.fn().mockReturnValue('1.0'),
    parseEther: vi.fn().mockReturnValue(BigInt('1000000000000000000')),
    parseUnits: vi.fn().mockReturnValue(BigInt('20000000000')),
    keccak256: vi.fn().mockReturnValue('0x1234567890abcdef'),
    toUtf8Bytes: vi.fn().mockReturnValue(new Uint8Array())
  }
}));

// Mock environment variables
const mockEnv = {
  SEPOLIA_RPC_URL: 'https://sepolia.infura.io/v3/test',
  SERVER_WALLET_PRIVATE_KEY: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12',
  NFT_CONTRACT_ADDRESS: '0x742d35Cc6634C0532925a3b8D4C9db96C4b5Da5e',
  SERVER_WALLET_ADDRESS: '0x742d35Cc6634C0532925a3b8D4C9db96C4b5Da5e'
};

describe('BlockchainVerificationService', () => {
  let service: BlockchainVerificationService;

  beforeEach(() => {
    // Mock process.env
    vi.stubEnv('SEPOLIA_RPC_URL', mockEnv.SEPOLIA_RPC_URL);
    vi.stubEnv('SERVER_WALLET_PRIVATE_KEY', mockEnv.SERVER_WALLET_PRIVATE_KEY);
    vi.stubEnv('NFT_CONTRACT_ADDRESS', mockEnv.NFT_CONTRACT_ADDRESS);
    vi.stubEnv('SERVER_WALLET_ADDRESS', mockEnv.SERVER_WALLET_ADDRESS);
    
    // Reset singleton and create service instance
    const { blockchainVerificationService } = require('../verification-service');
    blockchainVerificationService.reset();
    service = new BlockchainVerificationService();
  });

  describe('mintEnhancedBadge', () => {
    it('should mint an enhanced badge with metadata', async () => {
      const badgeDetails = {
        name: 'JavaScript Mastery',
        description: 'Demonstrated advanced JavaScript skills',
        icon: 'data:image/svg+xml;base64,PHN2Zw=='
      };

      const metadata: BadgeMetadata = {
        skillProgression: {
          skillLevel: 3,
          experiencePoints: 750,
          previousLevel: 2,
          isLevelUp: true,
          competencyAreas: ['Async Programming', 'ES6+'],
          industryBenchmark: {
            percentile: 85,
            experienceLevel: 'Senior'
          }
        },
        achievementDetails: {
          codeQuality: 88,
          efficiency: 82,
          creativity: 90,
          bestPractices: 85,
          complexity: 'advanced',
          detectedSkills: ['JavaScript', 'Async/Await'],
          improvementAreas: ['Performance Optimization'],
          strengths: ['Clean Code Structure']
        },
        verificationData: {
          issuedAt: new Date().toISOString(),
          issuerId: 'kiroverse-ai',
          verificationMethod: 'ai_analysis',
          evidenceHash: '0x1234567890abcdef',
          witnessSignatures: ['KiroVerse AI Mentor']
        },
        rarity: {
          level: 'rare',
          totalIssued: 1247,
          rarityScore: 87.5
        },
        employerInfo: {
          jobRelevance: ['Frontend Developer', 'Full Stack Developer'],
          marketValue: 85,
          demandLevel: 'high',
          salaryImpact: 15
        }
      };

      const result = await service.mintEnhancedBadge(
        '0x742d35Cc6634C0532925a3b8D4C9db96C4b5Da5e',
        badgeDetails,
        metadata
      );

      expect(result.success).toBe(true);
      expect(result.txHash).toBe('0x1234567890abcdef');
      expect(result.tokenId).toBe('1');
      expect(result.badge).toBeDefined();
      expect(result.badge?.metadata).toEqual(metadata);
      expect(result.badge?.verificationStatus).toBe('verified');
      expect(result.badge?.blockchainData).toBeDefined();
    });

    it('should handle minting failures gracefully', async () => {
      // Mock a failure
      const mockContract = {
        mintSkillBadgeWithMetadata: vi.fn().mockRejectedValue(new Error('Gas estimation failed')),
        mintSkillBadge: vi.fn().mockRejectedValue(new Error('Transaction failed'))
      };

      // Override the contract mock
      vi.mocked(require('ethers').ethers.Contract).mockImplementation(() => mockContract);

      const badgeDetails = {
        name: 'Test Badge',
        description: 'Test description',
        icon: 'data:image/svg+xml;base64,PHN2Zw=='
      };

      const metadata: BadgeMetadata = {
        skillProgression: {
          skillLevel: 1,
          experiencePoints: 100,
          isLevelUp: false,
          competencyAreas: ['Basic Programming']
        },
        achievementDetails: {
          codeQuality: 70,
          efficiency: 65,
          creativity: 60,
          bestPractices: 68,
          complexity: 'beginner',
          detectedSkills: ['JavaScript'],
          improvementAreas: ['Code Organization'],
          strengths: ['Problem Solving']
        },
        verificationData: {
          issuedAt: new Date().toISOString(),
          issuerId: 'test',
          verificationMethod: 'ai_analysis'
        },
        rarity: {
          level: 'common',
          totalIssued: 5000,
          rarityScore: 45
        }
      };

      const result = await service.mintEnhancedBadge(
        '0x742d35Cc6634C0532925a3b8D4C9db96C4b5Da5e',
        badgeDetails,
        metadata
      );

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('verifyBadge', () => {
    it('should verify an existing badge', async () => {
      const txHash = '0x1234567890abcdef';

      const result = await service.verifyBadge(txHash);

      expect(result.isValid).toBe(true);
      expect(result.tokenId).toBe('1');
      expect(result.owner).toBe('0x742d35Cc6634C0532925a3b8D4C9db96C4b5Da5e');
      expect(result.metadata).toBeDefined();
    });

    it('should handle verification failures', async () => {
      // Mock provider to return null receipt
      const mockProvider = {
        getTransactionReceipt: vi.fn().mockResolvedValue(null)
      };

      vi.mocked(require('ethers').ethers.JsonRpcProvider).mockImplementation(() => mockProvider);

      const service = new BlockchainVerificationService();
      const result = await service.verifyBadge('0xinvalid');

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Transaction not found');
    });
  });

  describe('createEmployerVerificationData', () => {
    it('should create comprehensive employer verification data', async () => {
      const badge = {
        id: 'test-badge',
        name: 'JavaScript Mastery',
        description: 'Advanced JavaScript skills',
        txHash: '0x1234567890abcdef',
        date: new Date().toISOString(),
        icon: 'data:image/svg+xml;base64,PHN2Zw==',
        verificationStatus: 'verified' as const,
        metadata: {
          skillProgression: {
            skillLevel: 3,
            experiencePoints: 750,
            isLevelUp: true,
            competencyAreas: ['Async Programming', 'ES6+'],
            industryBenchmark: {
              percentile: 85,
              experienceLevel: 'Senior'
            }
          },
          achievementDetails: {
            codeQuality: 88,
            efficiency: 82,
            creativity: 90,
            bestPractices: 85,
            complexity: 'advanced' as const,
            detectedSkills: ['JavaScript', 'Async/Await'],
            improvementAreas: ['Performance Optimization'],
            strengths: ['Clean Code Structure']
          },
          verificationData: {
            issuedAt: new Date().toISOString(),
            issuerId: 'kiroverse-ai',
            verificationMethod: 'ai_analysis' as const
          },
          rarity: {
            level: 'rare' as const,
            totalIssued: 1247,
            rarityScore: 87.5
          },
          employerInfo: {
            jobRelevance: ['Frontend Developer', 'Full Stack Developer'],
            marketValue: 85,
            demandLevel: 'high' as const,
            salaryImpact: 15
          }
        },
        blockchainData: {
          contractAddress: '0x742d35Cc6634C0532925a3b8D4C9db96C4b5Da5e',
          tokenId: '1',
          network: 'sepolia' as const,
          blockNumber: 12345678,
          gasUsed: 150000,
          confirmations: 25,
          verificationUrl: 'https://sepolia.etherscan.io/tx/0x1234567890abcdef'
        }
      };

      const result = await service.createEmployerVerificationData(badge);

      expect(result.verificationUrl).toBeDefined();
      expect(result.skillSummary).toBeDefined();
      expect(result.skillSummary.skillName).toBe('JavaScript Mastery');
      expect(result.skillSummary.skillLevel).toBe(3);
      expect(result.authenticity).toBeDefined();
      expect(result.authenticity.blockchainVerified).toBe(true);
      expect(result.marketRelevance).toBeDefined();
      expect(result.marketRelevance.marketValue).toBe(85);
    });
  });
});

describe('Badge Rarity Calculation', () => {
  let service: BlockchainVerificationService;

  beforeEach(() => {
    vi.stubEnv('SEPOLIA_RPC_URL', mockEnv.SEPOLIA_RPC_URL);
    vi.stubEnv('SERVER_WALLET_PRIVATE_KEY', mockEnv.SERVER_WALLET_PRIVATE_KEY);
    vi.stubEnv('NFT_CONTRACT_ADDRESS', mockEnv.NFT_CONTRACT_ADDRESS);
    vi.stubEnv('SERVER_WALLET_ADDRESS', mockEnv.SERVER_WALLET_ADDRESS);
    
    // Reset singleton and create service instance
    const { blockchainVerificationService } = require('../verification-service');
    blockchainVerificationService.reset();
    service = new BlockchainVerificationService();
  });

  it('should calculate rarity correctly based on skill level and quality', async () => {
    const metadata: BadgeMetadata = {
      skillProgression: {
        skillLevel: 4, // Expert level
        experiencePoints: 1500,
        isLevelUp: true,
        competencyAreas: ['Advanced Patterns', 'Architecture']
      },
      achievementDetails: {
        codeQuality: 95,
        efficiency: 92,
        creativity: 98,
        bestPractices: 94,
        complexity: 'expert',
        detectedSkills: ['JavaScript', 'TypeScript', 'Design Patterns'],
        improvementAreas: [],
        strengths: ['Exceptional Code Quality', 'Innovative Solutions']
      },
      verificationData: {
        issuedAt: new Date().toISOString(),
        issuerId: 'kiroverse-ai',
        verificationMethod: 'ai_analysis'
      },
      rarity: {
        level: 'legendary',
        totalIssued: 50,
        rarityScore: 98.5
      }
    };

    const badgeDetails = {
      name: 'TypeScript Architecture Master',
      description: 'Exceptional TypeScript and software architecture skills',
      icon: 'data:image/svg+xml;base64,PHN2Zw=='
    };

    const result = await service.mintEnhancedBadge(
      '0x742d35Cc6634C0532925a3b8D4C9db96C4b5Da5e',
      badgeDetails,
      metadata,
      { includeMetadata: true, generateIPFS: false, enableVerification: true, rarityCalculation: true }
    );

    expect(result.success).toBe(true);
    expect(result.badge?.metadata?.rarity?.level).toBe('legendary');
    expect(result.badge?.metadata?.rarity?.rarityScore).toBeGreaterThan(95);
  });
});