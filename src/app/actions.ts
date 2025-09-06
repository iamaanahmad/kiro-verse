"use server";

import { getCodeFeedback as getCodeFeedbackFlow } from '@/ai/flows/get-code-feedback';
import { sendChatMessage as sendChatMessageFlow } from '@/ai/flows/send-chat-message';
import { awardSkillBadge as awardSkillBadgeFlow } from '@/ai/flows/award-skill-badge';
import { generateBadgeIcon as generateBadgeIconFlow } from '@/ai/flows/generate-badge-icon';
import { adminDb } from '@/lib/firebase/admin';
import type { Badge } from '@/types';
import { FieldValue } from 'firebase-admin/firestore';
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
    const userDoc = await adminDb.collection('users').doc(userId).get();
    if (userDoc.exists) {
      return (userDoc.data()?.badges || []).sort((a: Badge, b: Badge) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }
    return [];
  } catch (error) {
    console.error('Error fetching badges:', error);
    return [];
  }
}

export async function getDemoMode(userId: string): Promise<boolean> {
  try {
    const userDoc = await adminDb.collection('users').doc(userId).get();
    if (userDoc.exists) {
      return userDoc.data()?.demoMode ?? true; // Default to demo mode
    }
    return true;
  } catch (error) {
    console.error('Error fetching demo mode:', error);
    return true; // Default to demo mode on error
  }
}

export async function setDemoMode(userId: string, demoMode: boolean): Promise<{ success: boolean; error?: string }> {
  try {
    if (!userId) {
      return { success: false, error: 'User not authenticated.' };
    }

    const userRef = adminDb.collection('users').doc(userId);
    await userRef.set({
      demoMode: demoMode,
      updatedAt: new Date().toISOString()
    }, { merge: true });

    console.log(`Demo mode set to ${demoMode} for user ${userId}`);
    return { success: true };
  } catch (error) {
    console.error('Error setting demo mode:', error);
    return { success: false, error: 'Failed to update demo mode setting.' };
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

      // Save to Firestore
      const userRef = adminDb.collection('users').doc(userId);
      await userRef.set({
          badges: FieldValue.arrayUnion(newBadge)
      }, { merge: true });

      console.log(`Mock badge created successfully: ${newBadge.name} with tx: ${mockTxHash}`);
      return { success: true, txHash: mockTxHash, badge: newBadge };
    }

    // Production Mode: Real blockchain minting
    console.log('Production mode: Attempting real blockchain minting');
    
    if (!process.env.SEPOLIA_RPC_URL || !process.env.SERVER_WALLET_PRIVATE_KEY || !process.env.NFT_CONTRACT_ADDRESS) {
      console.error("Missing required environment variables for blockchain minting.");
      return { success: false, error: "Blockchain configuration missing. Please set up environment variables for real minting." };
    }

    // 1. Set up blockchain provider and wallet with timeout
    const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL, {
      name: 'sepolia',
      chainId: 11155111
    });
    
    // Test connection first with shorter timeout
    try {
      await Promise.race([
        provider.getBlockNumber(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('RPC timeout')), 5000))
      ]);
      console.log('Blockchain connection successful');
    } catch (connectionError) {
      console.error('RPC connection failed:', connectionError);
      throw new Error('Blockchain network is currently unavailable. Please try again later or switch to demo mode.');
    }

    const wallet = new ethers.Wallet(process.env.SERVER_WALLET_PRIVATE_KEY, provider);
    const nftContract = new ethers.Contract(process.env.NFT_CONTRACT_ADDRESS, nftContractAbi, wallet);

    // 2. Create metadata for the NFT
    const tokenMetadata = {
      name: badgeDetails.name,
      description: badgeDetails.description,
      image: badgeDetails.icon,
      attributes: [
        { "trait_type": "Skill", "value": "Programming" },
        { "trait_type": "Awarded To", "value": userId },
        { "trait_type": "Platform", "value": "KiroVerse" },
        { "trait_type": "Minted At", "value": new Date().toISOString() }
      ]
    };
    const tokenURI = `data:application/json;base64,${Buffer.from(JSON.stringify(tokenMetadata)).toString('base64')}`;
    
    // 3. Mint the NFT on the Sepolia testnet with shorter timeout
    console.log('Sending transaction to blockchain...');
    const tx = await Promise.race([
      nftContract.mintBadge(wallet.address, tokenURI, {
        gasLimit: 300000,
        gasPrice: ethers.parseUnits('20', 'gwei')
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

    // 5. Save the badge details to Firestore with the real transaction hash
    const userRef = adminDb.collection('users').doc(userId);
    const newBadge: Badge = {
      id: `${badgeDetails.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
      name: badgeDetails.name,
      description: badgeDetails.description,
      icon: badgeDetails.icon,
      txHash: realTxHash,
      date: new Date().toISOString(),
    };

    await userRef.set({
        badges: FieldValue.arrayUnion(newBadge)
    }, { merge: true });

    console.log(`Real blockchain badge minted successfully: ${newBadge.name} with tx: ${realTxHash}`);
    return { success: true, txHash: realTxHash, badge: newBadge };

  } catch (error) {
    console.error('Error minting badge:', error);
    let errorMessage = "An unknown error occurred during minting.";
    
    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        errorMessage = "Blockchain network is slow. Automatically switching to demo mode for this badge.";
        
        // Auto-fallback to demo mode
        console.log('Auto-fallback: Creating demo badge due to blockchain timeout');
        const mockTxHash = `0x${Math.random().toString(16).substr(2, 64)}`;
        const fallbackBadge: Badge = {
          id: `${badgeDetails.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
          name: badgeDetails.name,
          description: badgeDetails.description,
          icon: badgeDetails.icon,
          txHash: mockTxHash,
          date: new Date().toISOString(),
        };

        try {
          const userRef = adminDb.collection('users').doc(userId);
          await userRef.set({
              badges: FieldValue.arrayUnion(fallbackBadge)
          }, { merge: true });
          
          return { success: true, txHash: mockTxHash, badge: fallbackBadge };
        } catch (dbError) {
          console.error('Fallback demo badge creation failed:', dbError);
        }
        
      } else if (error.message.includes('insufficient funds')) {
        errorMessage = "Insufficient funds for gas fees. Please contact support or use demo mode.";
      } else if (error.message.includes('nonce')) {
        errorMessage = "Transaction nonce error. Please try again in a moment.";
      } else {
        errorMessage = error.message;
      }
    }
    
    return { success: false, error: `Failed to mint badge: ${errorMessage}` };
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
        const mintResult = await mintSkillBadgeAction(userId, {
            name: badgeName,
            description: badgeDescription,
            icon: iconDataUri,
        }, demoMode);

        console.log('Badge creation result:', mintResult);
        return mintResult;

    } catch (error) {
        console.error('Error in awardSkillBadgeAction:', error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during the process.";
        return { success: false, error: `Failed to award badge: ${errorMessage}` };
    }
}
