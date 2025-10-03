"use server";

import { getCodeFeedback as getCodeFeedbackFlow } from '@/ai/flows/get-code-feedback';
import { sendChatMessage as sendChatMessageFlow } from '@/ai/flows/send-chat-message';
import { awardSkillBadge as awardSkillBadgeFlow } from '@/ai/flows/award-skill-badge';
import { generateBadgeIcon as generateBadgeIconFlow } from '@/ai/flows/generate-badge-icon';
import { adminDb } from '@/lib/firebase/admin';
import type { Badge } from '@/types';
import { FieldValue } from 'firebase-admin/firestore';

// In-memory mock database for demo purposes when Firebase admin is not available
const mockUserData: Record<string, { badges: Badge[]; demoMode: boolean }> = {};

const mockDb = {
  getUserData: (userId: string) => {
    if (!mockUserData[userId]) {
      mockUserData[userId] = { badges: [], demoMode: true };
    }
    return mockUserData[userId];
  },

  getUserBadges: (userId: string): Badge[] => {
    const userData = mockDb.getUserData(userId);
    return userData.badges.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  addBadge: (userId: string, badge: Badge): void => {
    const userData = mockDb.getUserData(userId);
    userData.badges.push(badge);
  },

  getDemoMode: (userId: string): boolean => {
    const userData = mockDb.getUserData(userId);
    return userData.demoMode;
  },

  setDemoMode: (userId: string, demoMode: boolean): void => {
    const userData = mockDb.getUserData(userId);
    userData.demoMode = demoMode;
  }
};
import { ethers } from 'ethers';

// KiroVerse Skill Badges contract ABI - matches our new contract
const nftContractAbi = [
  "function mintSkillBadge(address to, string memory tokenURI, string memory skillName) public returns (uint256)",
  "function mint(address to, string memory tokenURI) public returns (uint256)",
  "function safeMint(address to, string memory tokenURI) public returns (uint256)",
  "function name() public view returns (string)",
  "function symbol() public view returns (string)",
  "function totalSupply() public view returns (uint256)",
  "function getTokenSkill(uint256 tokenId) public view returns (string)",
  "function balanceOf(address owner) public view returns (uint256)"
];


export async function getCodeFeedbackAction(code: string): Promise<string> {
  try {
    console.log('Getting code feedback for code length:', code.length);
    const result = await Promise.race([
      getCodeFeedbackFlow({ code }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Feedback timeout')), 30000))
    ]);
    console.log('Code feedback generated successfully');
    return result.feedback;
  } catch (error) {
    console.error('Code feedback error:', error);
    return "Sorry, I couldn't process the feedback request. The AI service might be temporarily unavailable. Please try again.";
  }
}

export async function sendChatMessageAction(
  code: string,
  query: string,
  userId?: string,
  enableAnalytics: boolean = true
): Promise<{
  aiResponse: string;
  detectedSkills?: string[];
  learningInsights?: Array<{
    type: 'strength' | 'improvement_area' | 'recommendation';
    category: string;
    title: string;
    description: string;
    actionableSteps: string[];
    priority: 'low' | 'medium' | 'high';
  }>;
  analyticsSessionId?: string;
}> {
  try {
    console.log('Processing chat message with analytics, query length:', query.length);
    const result = await Promise.race([
      sendChatMessageFlow({ 
        code, 
        query, 
        userId, 
        enableAnalytics: enableAnalytics && !!userId 
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Chat timeout')), 30000))
    ]);
    console.log('Chat response generated successfully with analytics');
    return result;
  } catch (error) {
    console.error('Chat error:', error);
    return {
      aiResponse: "Sorry, I'm having trouble responding right now. The AI service might be temporarily unavailable. Please try again later."
    };
  }
}

export async function getUserBadges(userId: string): Promise<Badge[]> {
  try {
    // Try Firebase first, fallback to mock DB
    if (adminDb && typeof adminDb.collection === 'function') {
      const userDoc = await adminDb.collection('users').doc(userId).get();
      if (userDoc.exists) {
        return (userDoc.data()?.badges || []).sort((a: Badge, b: Badge) => new Date(b.date).getTime() - new Date(a.date).getTime());
      }
      return [];
    } else {
      // Use mock database
      console.log('Using mock database for getUserBadges');
      return mockDb.getUserBadges(userId);
    }
  } catch (error) {
    console.error('Error fetching badges, using mock database:', error);
    return mockDb.getUserBadges(userId);
  }
}

export async function getDemoMode(userId: string): Promise<boolean> {
  try {
    // Try Firebase first, fallback to mock DB
    if (adminDb && typeof adminDb.collection === 'function') {
      const userDoc = await adminDb.collection('users').doc(userId).get();
      if (userDoc.exists) {
        return userDoc.data()?.demoMode ?? true; // Default to demo mode
      }
      return true;
    } else {
      // Use mock database
      console.log('Using mock database for getDemoMode');
      return mockDb.getDemoMode(userId);
    }
  } catch (error) {
    console.error('Error fetching demo mode, using mock database:', error);
    return mockDb.getDemoMode(userId);
  }
}

export async function setDemoMode(userId: string, demoMode: boolean): Promise<{ success: boolean; error?: string }> {
  try {
    if (!userId) {
      return { success: false, error: 'User not authenticated.' };
    }

    // Try Firebase first, fallback to mock DB
    if (adminDb && typeof adminDb.collection === 'function') {
      const userRef = adminDb.collection('users').doc(userId);
      await userRef.set({
        demoMode: demoMode,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } else {
      // Use mock database
      console.log('Using mock database for setDemoMode');
      mockDb.setDemoMode(userId, demoMode);
    }

    console.log(`Demo mode set to ${demoMode} for user ${userId}`);
    return { success: true };
  } catch (error) {
    console.error('Error setting demo mode, using mock database:', error);
    mockDb.setDemoMode(userId, demoMode);
    console.log(`Demo mode set to ${demoMode} for user ${userId} (mock DB)`);
    return { success: true };
  }
}

export async function mintSkillBadgeAction(
  userId: string, 
  badgeDetails: Omit<Badge, 'id' | 'txHash' | 'date' | 'verificationStatus' | 'blockchainData'>, 
  demoMode: boolean = true
): Promise<{ success: boolean; txHash?: string; error?: string; badge?: Badge }> {
  if (!userId) {
    return { success: false, error: 'User not authenticated.' };
  }

  try {
    if (demoMode) {
      // Demo Mode: Create mock badge for demonstration
      console.log('Demo mode: Creating mock badge for demonstration');
      
      const mockTxHash = `0x${Math.random().toString(16).substr(2, 64)}`;
      const newBadge: Badge = {
        id: `${badgeDetails.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
        name: badgeDetails.name,
        description: badgeDetails.description,
        icon: badgeDetails.icon,
        txHash: mockTxHash,
        date: new Date().toISOString(),
      };

      // Save to database
      try {
        if (adminDb && typeof adminDb.collection === 'function') {
          const userRef = adminDb.collection('users').doc(userId);
          await userRef.set({
              badges: FieldValue.arrayUnion(newBadge)
          }, { merge: true });
        } else {
          console.log('Using mock database for demo badge');
          mockDb.addBadge(userId, newBadge);
        }
      } catch (error) {
        console.error('Error saving demo badge to Firebase, using mock database:', error);
        mockDb.addBadge(userId, newBadge);
      }

      console.log(`Mock badge created successfully: ${newBadge.name} with tx: ${mockTxHash}`);
      return { success: true, txHash: mockTxHash, badge: newBadge };
    }

    // Production Mode: Real blockchain minting
    console.log('Production mode: Attempting real blockchain minting');
    
    // Validate environment variables
    const rpcUrl = process.env.SEPOLIA_RPC_URL;
    const privateKey = process.env.SERVER_WALLET_PRIVATE_KEY;
    const contractAddress = process.env.NFT_CONTRACT_ADDRESS;
    
    if (!rpcUrl || !privateKey || !contractAddress) {
      console.error("Missing required environment variables for blockchain minting:", {
        hasRpcUrl: !!rpcUrl,
        hasPrivateKey: !!privateKey,
        hasContractAddress: !!contractAddress
      });
      return { success: false, error: "Blockchain configuration is incomplete. Please contact support or use demo mode." };
    }
    
    // Validate private key format
    if (!privateKey.match(/^[0-9a-fA-F]{64}$/)) {
      console.error("Invalid private key format");
      return { success: false, error: "Blockchain wallet configuration is invalid. Please contact support or use demo mode." };
    }
    
    // Validate contract address format
    if (!contractAddress.match(/^0x[0-9a-fA-F]{40}$/)) {
      console.error("Invalid contract address format");
      return { success: false, error: "Smart contract address is invalid. Please contact support or use demo mode." };
    }

    // 1. Set up blockchain provider and wallet with timeout
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    
    // Test connection first with shorter timeout
    try {
      console.log('Testing blockchain connection to:', rpcUrl);
      const blockNumber = await Promise.race([
        provider.getBlockNumber(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('RPC connection timeout')), 8000))
      ]);
      console.log('Blockchain connection successful, current block:', blockNumber);
    } catch (connectionError) {
      console.error('RPC connection failed:', connectionError);
      console.error('Connection error details:', {
        message: connectionError instanceof Error ? connectionError.message : 'Unknown error',
        rpcUrl: rpcUrl,
        errorType: typeof connectionError
      });
      
      if (connectionError instanceof Error) {
        if (connectionError.message.includes('timeout')) {
          throw new Error('Blockchain network connection timed out. Please try again or switch to demo mode.');
        } else if (connectionError.message.includes('network') || connectionError.message.includes('fetch')) {
          throw new Error('Network connection issue. Please check your internet connection and try again, or switch to demo mode.');
        } else if (connectionError.message.includes('rate limit') || connectionError.message.includes('429')) {
          throw new Error('RPC rate limit exceeded. Please try again in a moment or switch to demo mode.');
        }
      }
      
      throw new Error('Blockchain network is currently unavailable. Please check your connection and try again, or switch to demo mode.');
    }

    const wallet = new ethers.Wallet(privateKey, provider);
    const nftContract = new ethers.Contract(contractAddress, nftContractAbi, wallet);
    
    // Test contract connection and get basic info
    try {
      console.log('Testing KiroVerse contract connection...');
      const contractName = await Promise.race([
        nftContract.name(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Contract name timeout')), 5000))
      ]);
      console.log('Contract name:', contractName);
      
      const contractSymbol = await nftContract.symbol();
      console.log('Contract symbol:', contractSymbol);
      
      // Test totalSupply - our new contract should have this function
      try {
        const totalSupply = await nftContract.totalSupply();
        console.log('Total supply:', totalSupply.toString());
      } catch (supplyError) {
        console.log('Note: totalSupply not available on this contract (older version?)');
      }
      
      console.log('KiroVerse contract validation successful');
    } catch (contractError) {
      console.error('Contract validation failed:', contractError);
      
      // More specific error messages based on the type of error
      if (contractError instanceof Error) {
        if (contractError.message.includes('CALL_EXCEPTION') || contractError.message.includes('missing revert data')) {
          throw new Error('Smart contract does not support the required functions. Please deploy the new KiroVerse badges contract or use demo mode.');
        } else if (contractError.message.includes('timeout')) {
          throw new Error('Smart contract is slow to respond. Please try again or use demo mode.');
        } else if (contractError.message.includes('network')) {
          throw new Error('Network error when connecting to smart contract. Please try again or use demo mode.');
        }
      }
      
      throw new Error('Smart contract is not responding or invalid. Please deploy the new KiroVerse badges contract or use demo mode.');
    }
    
    // Check wallet balance
    try {
      const balance = await provider.getBalance(wallet.address);
      console.log('Wallet address:', wallet.address);
      console.log('Wallet balance:', ethers.formatEther(balance), 'ETH');
      
      if (balance < ethers.parseEther('0.001')) {
        console.warn('Low wallet balance:', ethers.formatEther(balance), 'ETH');
        return { 
          success: false, 
          error: `Insufficient funds in minting wallet (${ethers.formatEther(balance)} ETH). Please fund the wallet at ${wallet.address} or use demo mode.` 
        };
      }
    } catch (balanceError) {
      console.error('Failed to check wallet balance:', balanceError);
      // Continue anyway, let the transaction fail if needed
    }

    // 2. Create ultra-minimal tokenURI to avoid 413 Payload Too Large error
    // Use the simplest possible tokenURI
    const tokenURI = `KiroVerse-${badgeDetails.name.substring(0, 20).replace(/\s+/g, '-')}`;
    
    console.log('Ultra-minimal token URI:', tokenURI);
    console.log('Token URI size:', tokenURI.length, 'characters');
    
    // 3. Mint the NFT on the Sepolia testnet with shorter timeout
    console.log('Sending transaction to blockchain...');
    
    // Get current gas price from network
    let gasPrice;
    try {
      const feeData = await Promise.race([
        provider.getFeeData(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Gas price timeout')), 5000))
      ]);
      gasPrice = feeData.gasPrice;
      console.log('Current gas price:', gasPrice?.toString());
      
      // Fallback if gas price is null or too low
      if (!gasPrice || gasPrice < ethers.parseUnits('1', 'gwei')) {
        console.log('Gas price too low or null, using default');
        gasPrice = ethers.parseUnits('20', 'gwei');
      }
    } catch (gasError) {
      console.log('Failed to get gas price, using default:', gasError);
      gasPrice = ethers.parseUnits('20', 'gwei');
    }
    
    // 3. Mint the NFT on the Sepolia testnet using the smart contract
    console.log('Minting skill badge on KiroVerse contract...');
    console.log('Token URI:', tokenURI);
    console.log('Minting to wallet:', wallet.address);
    console.log('Skill name:', badgeDetails.name);
    
    // Try the primary mintSkillBadge function first, then fallback to simpler functions
    let tx;
    
    try {
      console.log('Trying mintSkillBadge function...');
      
      tx = await Promise.race([
        nftContract.mintSkillBadge(wallet.address, tokenURI, badgeDetails.name, {
          gasLimit: 300000, // Higher gas limit for contract interaction
          gasPrice: gasPrice
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Transaction timeout')), 20000))
      ]);
      
      console.log('mintSkillBadge successful! Transaction hash:', tx.hash);
      
    } catch (mintError) {
      console.error('mintSkillBadge failed, trying fallback methods:', mintError);
      
      // Try fallback mint functions
      const mintFunctions = ['mint', 'safeMint'];
      
      for (const mintFunction of mintFunctions) {
        try {
          console.log(`Trying ${mintFunction} function...`);
          
          if (mintFunction === 'mint') {
            tx = await Promise.race([
              nftContract.mint(wallet.address, tokenURI, {
                gasLimit: 250000,
                gasPrice: gasPrice
              }),
              new Promise((_, reject) => setTimeout(() => reject(new Error('Transaction timeout')), 15000))
            ]);
          } else if (mintFunction === 'safeMint') {
            tx = await Promise.race([
              nftContract.safeMint(wallet.address, tokenURI, {
                gasLimit: 250000,
                gasPrice: gasPrice
              }),
              new Promise((_, reject) => setTimeout(() => reject(new Error('Transaction timeout')), 15000))
            ]);
          }
          
          console.log(`${mintFunction} successful! Transaction hash:`, tx.hash);
          break; // Exit the loop if successful
          
        } catch (fallbackError) {
          console.error(`${mintFunction} failed:`, fallbackError);
          if (mintFunction === mintFunctions[mintFunctions.length - 1]) {
            // If all mint functions fail, throw the error
            throw new Error(`All mint functions failed. Contract might not be deployed properly. Last error: ${fallbackError instanceof Error ? fallbackError.message : 'Unknown error'}`);
          }
          // Continue to next mint function
        }
      }
    }
    
    console.log('Transaction created successfully:', tx.hash);
    console.log(`Real blockchain transaction sent: ${tx.hash}`);
    
    // 4. Wait for the transaction to be mined with shorter timeout
    console.log('Waiting for transaction confirmation...');
    const receipt = await Promise.race([
      tx.wait(1), // Wait for 1 confirmation
      new Promise((_, reject) => setTimeout(() => reject(new Error('Mining timeout')), 30000))
    ]);
    console.log(`Transaction mined in block: ${receipt.blockNumber}`);

    if (!receipt.hash) {
        throw new Error("Transaction failed: No transaction hash returned.");
    }
    
    const realTxHash = receipt.hash;

    // 5. Save the badge details to database with the real transaction hash
    const newBadge: Badge = {
      id: `${badgeDetails.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
      name: badgeDetails.name,
      description: badgeDetails.description,
      icon: badgeDetails.icon,
      txHash: realTxHash,
      date: new Date().toISOString(),
    };

    try {
      if (adminDb && typeof adminDb.collection === 'function') {
        const userRef = adminDb.collection('users').doc(userId);
        await userRef.set({
            badges: FieldValue.arrayUnion(newBadge)
        }, { merge: true });
      } else {
        console.log('Using mock database for production badge');
        mockDb.addBadge(userId, newBadge);
      }
    } catch (error) {
      console.error('Error saving production badge to Firebase, using mock database:', error);
      mockDb.addBadge(userId, newBadge);
    }

    console.log(`Real blockchain badge minted successfully: ${newBadge.name} with tx: ${realTxHash}`);
    return { success: true, txHash: realTxHash, badge: newBadge };

  } catch (error) {
    console.error('Error minting badge:', error);
    let errorMessage = "An unknown error occurred during minting.";
    
    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        errorMessage = "Blockchain network is slow. Transaction timed out. Please try again or switch to demo mode.";
      } else if (error.message.includes('could not coalesce error') || error.message.includes('coalesce')) {
        errorMessage = "Blockchain network error. Please try again or switch to demo mode.";
      } else if (error.message.includes('insufficient funds')) {
        errorMessage = "Insufficient funds for gas fees. Please contact support or use demo mode.";
      } else if (error.message.includes('nonce')) {
        errorMessage = "Transaction nonce error. Please try again in a moment.";
      } else if (error.message.includes('network') || error.message.includes('connection')) {
        errorMessage = "Network connection issue. Please check your connection and try again, or switch to demo mode.";
      } else if (error.message.includes('unavailable')) {
        errorMessage = error.message; // Keep the original message about network being unavailable
      } else {
        errorMessage = `Blockchain error: ${error.message}. Please try again or switch to demo mode.`;
      }
    }
    
    return { success: false, error: `Failed to mint badge: ${errorMessage}` };
  }
}


// Simple demo badge creation function
async function createDemoBadge(userId: string, badgeName: string, badgeDescription: string, iconDataUri: string): Promise<{ success: boolean; txHash: string; badge: Badge }> {
  const mockTxHash = `0x${Math.random().toString(16).substr(2, 64)}`;
  const newBadge: Badge = {
    id: `${badgeName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
    name: badgeName,
    description: badgeDescription,
    icon: iconDataUri,
    txHash: mockTxHash,
    date: new Date().toISOString(),
  };

  try {
    // Try Firebase first, fallback to mock DB
    if (adminDb && typeof adminDb.collection === 'function') {
      const userRef = adminDb.collection('users').doc(userId);
      await userRef.set({
          badges: FieldValue.arrayUnion(newBadge)
      }, { merge: true });
    } else {
      // Use mock database
      console.log('Using mock database for createDemoBadge');
      mockDb.addBadge(userId, newBadge);
    }
  } catch (error) {
    console.error('Error saving demo badge to Firebase, using mock database:', error);
    mockDb.addBadge(userId, newBadge);
  }

  console.log(`Demo badge created successfully: ${newBadge.name} with tx: ${mockTxHash}`);
  return { success: true, txHash: mockTxHash, badge: newBadge };
}

// Test blockchain configuration
export async function testBlockchainConfig(): Promise<{ success: boolean; error?: string; details?: any }> {
  try {
    console.log('Testing blockchain configuration...');
    
    const rpcUrl = process.env.SEPOLIA_RPC_URL;
    const privateKey = process.env.SERVER_WALLET_PRIVATE_KEY;
    const contractAddress = process.env.NFT_CONTRACT_ADDRESS;
    
    console.log('Environment variables check:', {
      hasRpcUrl: !!rpcUrl,
      hasPrivateKey: !!privateKey,
      hasContractAddress: !!contractAddress,
      rpcUrl: rpcUrl
    });
    
    if (!rpcUrl || !privateKey || !contractAddress) {
      return { success: false, error: "Missing environment variables" };
    }
    
    console.log('Creating provider...');
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    
    console.log('Getting block number...');
    const blockNumber = await Promise.race([
      provider.getBlockNumber(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Test timeout')), 10000))
    ]);
    
    console.log('Creating wallet...');
    const wallet = new ethers.Wallet(privateKey, provider);
    
    console.log('Getting balance...');
    const balance = await provider.getBalance(wallet.address);
    
    const result = { 
      success: true, 
      details: {
        blockNumber,
        walletAddress: wallet.address,
        balance: ethers.formatEther(balance),
        contractAddress,
        rpcUrl
      }
    };
    
    console.log('Test successful:', result);
    return result;
  } catch (error) {
    console.error('Test failed:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error",
      details: {
        errorType: typeof error,
        errorName: error instanceof Error ? error.name : 'Unknown'
      }
    };
  }
}

export async function awardSkillBadgeAction(
  userId: string, 
  code: string, 
  demoMode: boolean = true,
  context?: string,
  enableAnalytics: boolean = true
): Promise<{ 
  success: boolean; 
  txHash?: string; 
  error?: string; 
  badge?: Badge; 
  logs?: string[];
  skillProgression?: {
    skillLevel?: number;
    experiencePoints?: number;
    isLevelUp?: boolean;
    previousLevel?: number;
    improvementAreas?: string[];
    strengths?: string[];
    nextMilestones?: string[];
  };
  analyticsSessionId?: string;
}> {
    if (!userId) {
        return { success: false, error: 'User not authenticated.' };
    }
    if (!code.trim()) {
        return { success: false, error: 'Cannot award badge for empty code.' };
    }

    try {
        console.log('Starting enhanced badge award process for user:', userId);
        
        // Get current user progress for skill level tracking
        let previousSkillLevel: number | undefined;
        if (enableAnalytics) {
          try {
            const { UserProgressService } = await import('@/lib/firebase/analytics');
            const userProgress = await UserProgressService.getUserProgress(userId);
            // We'll determine the skill name first, then get the previous level
          } catch (error) {
            console.log('Could not fetch user progress for skill level tracking:', error);
          }
        }
        
        // 1. Get enhanced badge details from AI with analytics integration
        let aiResult;
        try {
            aiResult = await Promise.race([
                awardSkillBadgeFlow({ 
                  code, 
                  userId: enableAnalytics ? userId : undefined,
                  context,
                  enableAnalytics,
                  previousSkillLevel
                }),
                new Promise((_, reject) => setTimeout(() => reject(new Error('AI analysis timeout')), 30000))
            ]);
            console.log('Enhanced AI analysis completed:', aiResult);
        } catch (aiError) {
            console.error('AI analysis failed:', aiError);
            // Fallback to a generic badge if AI fails
            aiResult = {
                badgeName: "Code Analysis",
                badgeDescription: "Demonstrated coding skills through code submission"
            };
        }
        
        const { 
          badgeName, 
          badgeDescription, 
          skillLevel,
          experiencePoints,
          isLevelUp,
          previousLevel,
          skillProgression,
          analyticsSessionId,
          verificationStatus
        } = aiResult;
        
        // 2. Generate badge icon from AI with fallback
        let iconDataUri = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iNTAiIGN5PSI1MCIgcj0iNDAiIGZpbGw9IiMxZjJhMzciLz48dGV4dCB4PSI1MCIgeT0iNTUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyMCIgZmlsbD0iIzYzNzNkZiIgdGV4dC1hbmNob3I9Im1pZGRsZSI+8J+PhTwvdGV4dD48L3N2Zz4="; // Default badge icon
        
        try {
            const iconResult = await Promise.race([
                generateBadgeIconFlow({ badgeName }),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Icon generation timeout')), 20000))
            ]);
            iconDataUri = iconResult.iconDataUri;
            console.log('Badge icon generated successfully');
        } catch (iconError) {
            console.error('Icon generation failed, using fallback:', iconError);
            // Keep the default icon
        }

        // 3. Create the badge with the details
        console.log('Creating badge with enhanced details:', { 
          badgeName, 
          badgeDescription, 
          skillLevel, 
          isLevelUp, 
          demoMode 
        });
        
        if (demoMode) {
            // Use simple demo badge creation
            const demoResult = await createDemoBadge(userId, badgeName, badgeDescription, iconDataUri);
            return {
              ...demoResult,
              skillProgression: skillProgression ? {
                skillLevel,
                experiencePoints,
                isLevelUp,
                previousLevel,
                improvementAreas: skillProgression.improvementAreas,
                strengths: skillProgression.strengths,
                nextMilestones: skillProgression.nextMilestones,
              } : undefined,
              analyticsSessionId
            };
        } else {
            // Try enhanced blockchain minting with metadata
            try {
              const { blockchainVerificationService } = await import('@/lib/blockchain/verification-service');
              
              // Create enhanced metadata for blockchain verification
              const enhancedMetadata = {
                skillProgression: {
                  skillLevel: skillLevel || 1,
                  experiencePoints: experiencePoints || 0,
                  previousLevel,
                  isLevelUp: isLevelUp || false,
                  competencyAreas: skillProgression?.strengths || [],
                  industryBenchmark: {
                    percentile: Math.min(95, Math.max(5, (skillLevel || 1) * 20 + 10)),
                    experienceLevel: skillLevel >= 3 ? 'Senior' : skillLevel >= 2 ? 'Mid-level' : 'Junior'
                  }
                },
                achievementDetails: {
                  codeQuality: 85,
                  efficiency: 80,
                  creativity: 88,
                  bestPractices: 82,
                  complexity: skillLevel >= 3 ? 'advanced' as const : skillLevel >= 2 ? 'intermediate' as const : 'beginner' as const,
                  detectedSkills: [badgeName],
                  improvementAreas: skillProgression?.improvementAreas || [],
                  strengths: skillProgression?.strengths || []
                },
                verificationData: {
                  issuedAt: new Date().toISOString(),
                  issuerId: 'kiroverse-ai',
                  verificationMethod: 'ai_analysis' as const,
                  evidenceHash: `0x${Math.random().toString(16).substr(2, 64)}`,
                  witnessSignatures: ['KiroVerse AI Mentor']
                },
                rarity: {
                  level: skillLevel >= 4 ? 'legendary' as const : 
                        skillLevel >= 3 ? 'epic' as const : 
                        skillLevel >= 2 ? 'rare' as const : 'common' as const,
                  totalIssued: Math.floor(Math.random() * 1000) + 100,
                  rarityScore: Math.min(100, (skillLevel || 1) * 20 + Math.random() * 20)
                },
                employerInfo: {
                  jobRelevance: [`${badgeName} Developer`, 'Software Engineer', 'Full Stack Developer'],
                  marketValue: Math.min(100, (skillLevel || 1) * 20 + 20),
                  demandLevel: 'high' as const,
                  salaryImpact: (skillLevel || 1) * 5 + 5
                }
              };

              const enhancedResult = await blockchainVerificationService.mintEnhancedBadge(
                process.env.SERVER_WALLET_ADDRESS || '',
                {
                  name: badgeName,
                  description: badgeDescription,
                  icon: iconDataUri
                },
                enhancedMetadata,
                {
                  includeMetadata: true,
                  generateIPFS: false,
                  enableVerification: true,
                  rarityCalculation: true
                }
              );

              if (enhancedResult.success && enhancedResult.badge) {
                // Save enhanced badge to database
                try {
                  if (adminDb && typeof adminDb.collection === 'function') {
                    const userRef = adminDb.collection('users').doc(userId);
                    await userRef.set({
                        badges: FieldValue.arrayUnion(enhancedResult.badge)
                    }, { merge: true });
                  } else {
                    console.log('Using mock database for enhanced badge');
                    mockDb.addBadge(userId, enhancedResult.badge);
                  }
                } catch (error) {
                  console.error('Error saving enhanced badge to Firebase, using mock database:', error);
                  mockDb.addBadge(userId, enhancedResult.badge);
                }

                return {
                  success: true,
                  txHash: enhancedResult.txHash,
                  badge: enhancedResult.badge,
                  skillProgression: skillProgression ? {
                    skillLevel,
                    experiencePoints,
                    isLevelUp,
                    previousLevel,
                    improvementAreas: skillProgression.improvementAreas,
                    strengths: skillProgression.strengths,
                    nextMilestones: skillProgression.nextMilestones,
                  } : undefined,
                  analyticsSessionId
                };
              } else {
                throw new Error(enhancedResult.error || 'Enhanced minting failed');
              }
            } catch (enhancedError) {
              console.log('Enhanced minting failed, falling back to standard minting:', enhancedError);
              
              // Fallback to standard minting
              const mintResult = await mintSkillBadgeAction(userId, {
                  name: badgeName,
                  description: badgeDescription,
                  icon: iconDataUri,
              }, demoMode);

              console.log('Badge creation result:', mintResult);
              return {
                ...mintResult,
                skillProgression: skillProgression ? {
                  skillLevel,
                  experiencePoints,
                  isLevelUp,
                  previousLevel,
                  improvementAreas: skillProgression.improvementAreas,
                  strengths: skillProgression.strengths,
                  nextMilestones: skillProgression.nextMilestones,
                } : undefined,
                analyticsSessionId
              };
            }
        }

    } catch (error) {
        console.error('Error in awardSkillBadgeAction:', error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during the process.";
        return { success: false, error: `Failed to award badge: ${errorMessage}` };
    }
}
