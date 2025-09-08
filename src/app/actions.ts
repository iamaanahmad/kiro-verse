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

// A simple ABI for our NFT contract's mint function
const nftContractAbi = [
  "function mintBadge(address to, string memory tokenURI) public returns (uint256)"
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
  query: string
): Promise<string> {
  try {
    console.log('Processing chat message, query length:', query.length);
    const result = await Promise.race([
      sendChatMessageFlow({ code, query }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Chat timeout')), 30000))
    ]);
    console.log('Chat response generated successfully');
    return result.aiResponse;
  } catch (error) {
    console.error('Chat error:', error);
    return "Sorry, I'm having trouble responding right now. The AI service might be temporarily unavailable. Please try again later.";
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
  badgeDetails: Omit<Badge, 'id' | 'txHash' | 'date'>, 
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
    
    // Check wallet balance
    try {
      const balance = await wallet.provider.getBalance(wallet.address);
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
    
    const tx = await Promise.race([
      nftContract.mintBadge(wallet.address, tokenURI, {
        gasLimit: 150000, // Reduced gas limit
        gasPrice: gasPrice
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Transaction timeout')), 15000))
    ]);
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

export async function awardSkillBadgeAction(userId: string, code: string, demoMode: boolean = true): Promise<{ success: boolean; txHash?: string; error?: string; badge?: Badge }> {
    if (!userId) {
        return { success: false, error: 'User not authenticated.' };
    }
    if (!code.trim()) {
        return { success: false, error: 'Cannot award badge for empty code.' };
    }

    try {
        console.log('Starting badge award process for user:', userId);
        
        // 1. Get badge details from AI with timeout
        let aiResult;
        try {
            aiResult = await Promise.race([
                awardSkillBadgeFlow({ code }),
                new Promise((_, reject) => setTimeout(() => reject(new Error('AI analysis timeout')), 30000))
            ]);
            console.log('AI analysis completed:', aiResult);
        } catch (aiError) {
            console.error('AI analysis failed:', aiError);
            // Fallback to a generic badge if AI fails
            aiResult = {
                badgeName: "Code Analysis",
                badgeDescription: "Demonstrated coding skills through code submission"
            };
        }
        
        const { badgeName, badgeDescription } = aiResult;
        
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
        console.log('Creating badge with details:', { badgeName, badgeDescription, demoMode });
        console.log('Demo mode check - demoMode parameter:', demoMode, typeof demoMode);
        
        if (demoMode) {
            // Use simple demo badge creation
            const demoResult = await createDemoBadge(userId, badgeName, badgeDescription, iconDataUri);
            return demoResult;
        } else {
            // Try real blockchain minting with fallback
            const mintResult = await mintSkillBadgeAction(userId, {
                name: badgeName,
                description: badgeDescription,
                icon: iconDataUri,
            }, demoMode);

            console.log('Badge creation result:', mintResult);
            return mintResult;
        }

    } catch (error) {
        console.error('Error in awardSkillBadgeAction:', error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during the process.";
        return { success: false, error: `Failed to award badge: ${errorMessage}` };
    }
}
