/**
 * Enhanced Blockchain Verification Service
 * Handles NFT badge minting with detailed metadata and verification
 */

import { ethers } from 'ethers';
import type { Badge, BadgeMetadata, BlockchainVerificationData } from '@/types';

// Enhanced KiroVerse Skill Badges contract ABI with metadata support
const ENHANCED_NFT_CONTRACT_ABI = [
  "function mintSkillBadgeWithMetadata(address to, string memory tokenURI, string memory skillName, string memory metadataJSON) public returns (uint256)",
  "function mintSkillBadge(address to, string memory tokenURI, string memory skillName) public returns (uint256)",
  "function mint(address to, string memory tokenURI) public returns (uint256)",
  "function safeMint(address to, string memory tokenURI) public returns (uint256)",
  "function name() public view returns (string)",
  "function symbol() public view returns (string)",
  "function totalSupply() public view returns (uint256)",
  "function getTokenSkill(uint256 tokenId) public view returns (string)",
  "function getTokenMetadata(uint256 tokenId) public view returns (string)",
  "function balanceOf(address owner) public view returns (uint256)",
  "function tokenURI(uint256 tokenId) public view returns (string)",
  "function ownerOf(uint256 tokenId) public view returns (address)"
];

export interface EnhancedMintingOptions {
  includeMetadata: boolean;
  generateIPFS: boolean;
  enableVerification: boolean;
  rarityCalculation: boolean;
}

export interface MintingResult {
  success: boolean;
  txHash?: string;
  tokenId?: string;
  verificationUrl?: string;
  ipfsHash?: string;
  error?: string;
  badge?: Badge;
}

export class BlockchainVerificationService {
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private contract: ethers.Contract;
  private contractAddress: string;

  constructor() {
    const rpcUrl = process.env.SEPOLIA_RPC_URL;
    const privateKey = process.env.SERVER_WALLET_PRIVATE_KEY;
    this.contractAddress = process.env.NFT_CONTRACT_ADDRESS || '';

    if (!rpcUrl || !privateKey || !this.contractAddress) {
      throw new Error('Missing blockchain configuration');
    }

    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.wallet = new ethers.Wallet(privateKey, this.provider);
    this.contract = new ethers.Contract(this.contractAddress, ENHANCED_NFT_CONTRACT_ABI, this.wallet);
  }

  /**
   * Mint an enhanced NFT badge with detailed metadata
   */
  async mintEnhancedBadge(
    recipientAddress: string,
    badgeDetails: Omit<Badge, 'id' | 'txHash' | 'date' | 'verificationStatus' | 'blockchainData'>,
    metadata: BadgeMetadata,
    options: EnhancedMintingOptions = {
      includeMetadata: true,
      generateIPFS: false,
      enableVerification: true,
      rarityCalculation: true
    }
  ): Promise<MintingResult> {
    try {
      // 1. Validate blockchain connection
      await this.validateConnection();

      // 2. Calculate rarity if enabled
      if (options.rarityCalculation) {
        metadata.rarity = await this.calculateBadgeRarity(badgeDetails.name, metadata);
      }

      // 3. Create comprehensive token URI with metadata
      const tokenURI = await this.createEnhancedTokenURI(badgeDetails, metadata, options);

      // 4. Prepare metadata JSON for on-chain storage
      const metadataJSON = JSON.stringify({
        name: badgeDetails.name,
        description: badgeDetails.description,
        image: badgeDetails.icon,
        attributes: this.formatMetadataAttributes(metadata),
        skill_progression: metadata.skillProgression,
        achievement_details: metadata.achievementDetails,
        verification_data: metadata.verificationData,
        rarity: metadata.rarity,
        employer_info: metadata.employerInfo
      });

      // 5. Estimate gas and get current gas price
      const gasEstimate = await this.estimateGas(recipientAddress, tokenURI, badgeDetails.name, metadataJSON);
      const gasPrice = await this.getOptimalGasPrice();

      // 6. Mint the NFT with enhanced metadata
      let tx: ethers.ContractTransactionResponse;
      
      try {
        // Try enhanced minting function first
        tx = await this.contract.mintSkillBadgeWithMetadata(
          recipientAddress,
          tokenURI,
          badgeDetails.name,
          metadataJSON,
          {
            gasLimit: gasEstimate,
            gasPrice: gasPrice
          }
        );
        console.log('Enhanced minting successful:', tx.hash);
      } catch (enhancedError) {
        console.log('Enhanced minting failed, falling back to standard minting:', enhancedError);
        
        // Fallback to standard minting
        tx = await this.contract.mintSkillBadge(
          recipientAddress,
          tokenURI,
          badgeDetails.name,
          {
            gasLimit: Math.floor(gasEstimate * 0.8), // Reduce gas for simpler function
            gasPrice: gasPrice
          }
        );
        console.log('Standard minting successful:', tx.hash);
      }

      // 7. Wait for confirmation
      const receipt = await tx.wait(1);
      if (!receipt) {
        throw new Error('Transaction failed to confirm');
      }

      // 8. Extract token ID from logs
      const tokenId = await this.extractTokenIdFromReceipt(receipt);

      // 9. Create verification data
      const blockchainData: BlockchainVerificationData = {
        contractAddress: this.contractAddress,
        tokenId: tokenId?.toString(),
        network: 'sepolia',
        blockNumber: receipt.blockNumber,
        gasUsed: Number(receipt.gasUsed),
        confirmations: 1,
        verificationUrl: this.createVerificationUrl(receipt.hash, tokenId),
        onChainMetadata: options.includeMetadata ? metadataJSON : undefined
      };

      // 10. Create enhanced badge object
      const enhancedBadge: Badge = {
        ...badgeDetails,
        id: `${badgeDetails.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
        txHash: receipt.hash,
        date: new Date().toISOString(),
        metadata,
        verificationStatus: 'verified',
        blockchainData
      };

      return {
        success: true,
        txHash: receipt.hash,
        tokenId: tokenId?.toString(),
        verificationUrl: blockchainData.verificationUrl,
        badge: enhancedBadge
      };

    } catch (error) {
      console.error('Enhanced badge minting failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown minting error'
      };
    }
  }

  /**
   * Verify an existing badge on the blockchain
   */
  async verifyBadge(txHash: string): Promise<{
    isValid: boolean;
    tokenId?: string;
    owner?: string;
    metadata?: any;
    error?: string;
  }> {
    try {
      // Get transaction receipt
      const receipt = await this.provider.getTransactionReceipt(txHash);
      if (!receipt) {
        return { isValid: false, error: 'Transaction not found' };
      }

      // Extract token ID
      const tokenId = await this.extractTokenIdFromReceipt(receipt);
      if (!tokenId) {
        return { isValid: false, error: 'Token ID not found in transaction' };
      }

      // Verify ownership and get metadata
      const owner = await this.contract.ownerOf(tokenId);
      const tokenURI = await this.contract.tokenURI(tokenId);
      
      let onChainMetadata;
      try {
        onChainMetadata = await this.contract.getTokenMetadata(tokenId);
      } catch {
        // Metadata function might not exist on older contracts
        onChainMetadata = null;
      }

      return {
        isValid: true,
        tokenId: tokenId.toString(),
        owner,
        metadata: {
          tokenURI,
          onChainMetadata: onChainMetadata ? JSON.parse(onChainMetadata) : null
        }
      };

    } catch (error) {
      console.error('Badge verification failed:', error);
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Verification failed'
      };
    }
  }

  /**
   * Create employer-friendly verification interface
   */
  async createEmployerVerificationData(badge: Badge): Promise<{
    verificationUrl: string;
    skillSummary: any;
    authenticity: any;
    marketRelevance: any;
  }> {
    const verificationUrl = badge.blockchainData?.verificationUrl || 
      this.createVerificationUrl(badge.txHash);

    const skillSummary = {
      skillName: badge.name,
      skillLevel: badge.metadata?.skillProgression.skillLevel || 1,
      experiencePoints: badge.metadata?.skillProgression.experiencePoints || 0,
      competencyAreas: badge.metadata?.skillProgression.competencyAreas || [],
      industryBenchmark: badge.metadata?.skillProgression.industryBenchmark
    };

    const authenticity = {
      blockchainVerified: badge.verificationStatus === 'verified',
      transactionHash: badge.txHash,
      contractAddress: badge.blockchainData?.contractAddress,
      tokenId: badge.blockchainData?.tokenId,
      network: badge.blockchainData?.network || 'sepolia',
      issuedAt: badge.date,
      verificationMethod: badge.metadata?.verificationData.verificationMethod || 'ai_analysis'
    };

    const marketRelevance = {
      jobRelevance: badge.metadata?.employerInfo?.jobRelevance || [],
      marketValue: badge.metadata?.employerInfo?.marketValue || 0,
      demandLevel: badge.metadata?.employerInfo?.demandLevel || 'medium',
      salaryImpact: badge.metadata?.employerInfo?.salaryImpact,
      rarity: badge.metadata?.rarity
    };

    return {
      verificationUrl,
      skillSummary,
      authenticity,
      marketRelevance
    };
  }

  // Private helper methods

  private async validateConnection(): Promise<void> {
    const blockNumber = await Promise.race([
      this.provider.getBlockNumber(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout')), 10000)
      )
    ]);
    
    const balance = await this.provider.getBalance(this.wallet.address);
    if (balance < ethers.parseEther('0.001')) {
      throw new Error(`Insufficient funds: ${ethers.formatEther(balance)} ETH`);
    }

    console.log(`Blockchain connection validated. Block: ${blockNumber}, Balance: ${ethers.formatEther(balance)} ETH`);
  }

  private async calculateBadgeRarity(
    badgeName: string, 
    metadata: BadgeMetadata
  ): Promise<BadgeMetadata['rarity']> {
    try {
      // Get total supply to calculate rarity
      const totalSupply = await this.contract.totalSupply();
      
      // Calculate rarity score based on skill level and achievement details
      const skillLevelMultiplier = metadata.skillProgression.skillLevel * 25;
      const qualityScore = (
        metadata.achievementDetails.codeQuality +
        metadata.achievementDetails.efficiency +
        metadata.achievementDetails.creativity +
        metadata.achievementDetails.bestPractices
      ) / 4;
      
      const rarityScore = skillLevelMultiplier + qualityScore;
      
      // Determine rarity level
      let level: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
      if (rarityScore >= 95) level = 'legendary';
      else if (rarityScore >= 85) level = 'epic';
      else if (rarityScore >= 75) level = 'rare';
      else if (rarityScore >= 60) level = 'uncommon';
      else level = 'common';

      return {
        level,
        totalIssued: Number(totalSupply),
        rarityScore,
        globalRank: undefined // Would need additional tracking
      };
    } catch (error) {
      console.error('Rarity calculation failed:', error);
      return {
        level: 'common',
        totalIssued: 0,
        rarityScore: 50
      };
    }
  }

  private async createEnhancedTokenURI(
    badgeDetails: any,
    metadata: BadgeMetadata,
    options: EnhancedMintingOptions
  ): Promise<string> {
    if (options.generateIPFS) {
      // TODO: Implement IPFS storage for comprehensive metadata
      return `ipfs://QmHash/${badgeDetails.name}`;
    }
    
    // Create a comprehensive but compact token URI
    const compactMetadata = {
      name: badgeDetails.name,
      skill_level: metadata.skillProgression.skillLevel,
      rarity: metadata.rarity?.level || 'common',
      verified: true
    };
    
    return `KiroVerse-${badgeDetails.name.substring(0, 15).replace(/\s+/g, '-')}-L${metadata.skillProgression.skillLevel}`;
  }

  private formatMetadataAttributes(metadata: BadgeMetadata): any[] {
    return [
      { trait_type: 'Skill Level', value: metadata.skillProgression.skillLevel },
      { trait_type: 'Experience Points', value: metadata.skillProgression.experiencePoints },
      { trait_type: 'Code Quality', value: metadata.achievementDetails.codeQuality },
      { trait_type: 'Efficiency', value: metadata.achievementDetails.efficiency },
      { trait_type: 'Creativity', value: metadata.achievementDetails.creativity },
      { trait_type: 'Best Practices', value: metadata.achievementDetails.bestPractices },
      { trait_type: 'Complexity', value: metadata.achievementDetails.complexity },
      { trait_type: 'Rarity', value: metadata.rarity?.level || 'common' },
      { trait_type: 'Verification Method', value: metadata.verificationData.verificationMethod }
    ];
  }

  private async estimateGas(
    to: string, 
    tokenURI: string, 
    skillName: string, 
    metadataJSON: string
  ): Promise<bigint> {
    try {
      const estimate = await this.contract.mintSkillBadgeWithMetadata.estimateGas(
        to, tokenURI, skillName, metadataJSON
      );
      return estimate + (estimate / 10n); // Add 10% buffer
    } catch {
      // Fallback estimate for standard minting
      return 350000n;
    }
  }

  private async getOptimalGasPrice(): Promise<bigint> {
    try {
      const feeData = await this.provider.getFeeData();
      const gasPrice = feeData.gasPrice;
      
      if (!gasPrice || gasPrice < ethers.parseUnits('1', 'gwei')) {
        return ethers.parseUnits('20', 'gwei');
      }
      
      return gasPrice;
    } catch {
      return ethers.parseUnits('20', 'gwei');
    }
  }

  private async extractTokenIdFromReceipt(receipt: ethers.TransactionReceipt): Promise<bigint | null> {
    try {
      // Look for Transfer event logs
      for (const log of receipt.logs) {
        try {
          const parsedLog = this.contract.interface.parseLog({
            topics: log.topics,
            data: log.data
          });
          
          if (parsedLog?.name === 'Transfer' && parsedLog.args.tokenId) {
            return parsedLog.args.tokenId;
          }
        } catch {
          // Continue to next log if parsing fails
        }
      }
      
      // Fallback: try to get from total supply
      const totalSupply = await this.contract.totalSupply();
      return totalSupply > 0n ? totalSupply - 1n : null;
    } catch (error) {
      console.error('Failed to extract token ID:', error);
      return null;
    }
  }

  private createVerificationUrl(txHash: string, tokenId?: bigint): string {
    const baseUrl = 'https://sepolia.etherscan.io';
    if (tokenId) {
      return `${baseUrl}/token/${this.contractAddress}?a=${tokenId}`;
    }
    return `${baseUrl}/tx/${txHash}`;
  }
}

// Export singleton instance factory
let _blockchainVerificationService: BlockchainVerificationService | null = null;

export const blockchainVerificationService = {
  get instance(): BlockchainVerificationService {
    if (!_blockchainVerificationService) {
      _blockchainVerificationService = new BlockchainVerificationService();
    }
    return _blockchainVerificationService;
  },
  
  // For testing purposes
  reset(): void {
    _blockchainVerificationService = null;
  },

  // Delegate methods
  async mintEnhancedBadge(...args: Parameters<BlockchainVerificationService['mintEnhancedBadge']>) {
    return this.instance.mintEnhancedBadge(...args);
  },

  async verifyBadge(...args: Parameters<BlockchainVerificationService['verifyBadge']>) {
    return this.instance.verifyBadge(...args);
  },

  async createEmployerVerificationData(...args: Parameters<BlockchainVerificationService['createEmployerVerificationData']>) {
    return this.instance.createEmployerVerificationData(...args);
  }
};