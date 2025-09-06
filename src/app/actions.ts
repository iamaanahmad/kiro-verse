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

export async function mintSkillBadgeAction(userId: string, badgeDetails: Omit<Badge, 'id' | 'txHash' | 'date'>): Promise<{ success: boolean; txHash?: string; error?: string; badge?: Badge }> {
  if (!userId) {
    return { success: false, error: 'User not authenticated.' };
  }
  
  if (!process.env.SEPOLIA_RPC_URL || !process.env.SERVER_WALLET_PRIVATE_KEY || !process.env.NFT_CONTRACT_ADDRESS) {
      console.error("Missing required environment variables for minting.");
      return { success: false, error: "Server configuration error: Minting service is not available." };
  }

  try {
    // For development/demo purposes, create a mock badge without blockchain interaction
    if (process.env.NODE_ENV === 'development' || !process.env.SEPOLIA_RPC_URL.includes('infura') && !process.env.SEPOLIA_RPC_URL.includes('alchemy')) {
      console.log('Development mode: Creating mock badge without blockchain interaction');
      
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

      return { success: true, txHash: mockTxHash, badge: newBadge };
    }

    // Production blockchain minting
    console.log('Production mode: Attempting blockchain minting');
    
    // 1. Set up blockchain provider and wallet with timeout
    const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL, undefined, {
      staticNetwork: true,
    });
    
    // Test connection first
    try {
      await Promise.race([
        provider.getBlockNumber(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('RPC timeout')), 10000))
      ]);
    } catch (connectionError) {
      console.error('RPC connection failed:', connectionError);
      throw new Error('Blockchain network is currently unavailable. Please try again later.');
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
        { "trait_type": "Awarded To", "value": userId }
      ]
    };
    const tokenURI = `data:application/json;base64,${Buffer.from(JSON.stringify(tokenMetadata)).toString('base64')}`;
    
    // 3. Mint the NFT on the Sepolia testnet with timeout
    const tx = await Promise.race([
      nftContract.mintBadge(wallet.address, tokenURI),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Transaction timeout')), 30000))
    ]);
    console.log(`Minting transaction sent: ${tx.hash}`);
    
    // 4. Wait for the transaction to be mined with timeout
    const receipt = await Promise.race([
      tx.wait(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Mining timeout')), 60000))
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

    return { success: true, txHash: realTxHash, badge: newBadge };

  } catch (error) {
    console.error('Error minting badge:', error);
    let errorMessage = "An unknown error occurred during minting.";
    
    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        errorMessage = "Blockchain network is slow. Badge minting timed out. Please try again.";
      } else if (error.message.includes('insufficient funds')) {
        errorMessage = "Insufficient funds for gas fees. Please contact support.";
      } else if (error.message.includes('nonce')) {
        errorMessage = "Transaction nonce error. Please try again in a moment.";
      } else {
        errorMessage = error.message;
      }
    }
    
    return { success: false, error: `Failed to mint badge: ${errorMessage}` };
  }
}


export async function awardSkillBadgeAction(userId: string, code: string): Promise<{ success: boolean; txHash?: string; error?: string; badge?: Badge }> {
    if (!userId) {
        return { success: false, error: 'User not authenticated.' };
    }
    if (!code.trim()) {
        return { success: false, error: 'Cannot award badge for empty code.' };
    }

    try {
        // 1. Get badge details from AI
        const aiResult = await awardSkillBadgeFlow({ code });
        const { badgeName, badgeDescription } = aiResult;
        
        // 2. Generate badge icon from AI
        const iconResult = await generateBadgeIconFlow({ badgeName });
        const { iconDataUri } = iconResult;

        // 3. Mint the badge with the dynamic details
        const mintResult = await mintSkillBadgeAction(userId, {
            name: badgeName,
            description: badgeDescription,
            icon: iconDataUri, // Use the generated image data URI
        });

        return mintResult;

    } catch (error) {
        console.error('Error in awardSkillBadgeAction:', error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during the process.";
        return { success: false, error: `Failed to award badge: ${errorMessage}` };
    }
}
