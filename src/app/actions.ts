"use server";

import { getCodeFeedback as getCodeFeedbackFlow } from '@/ai/flows/get-code-feedback';
import { sendChatMessage as sendChatMessageFlow } from '@/ai/flows/send-chat-message';
import { adminDb } from '@/lib/firebase/admin';
import type { Badge } from '@/types';
import { FieldValue } from 'firebase-admin/firestore';
import { User } from 'firebase/auth';

export async function getCodeFeedbackAction(code: string): Promise<string> {
  try {
    const result = await getCodeFeedbackFlow({ code });
    return result.feedback;
  } catch (error) {
    console.error(error);
    return "Sorry, I couldn't process the feedback request. Please try again.";
  }
}

export async function sendChatMessageAction(
  code: string,
  query: string
): Promise<string> {
  try {
    const result = await sendChatMessageFlow({ code, query });
    return result.aiResponse;
  } catch (error) {
    console.error(error);
    return "Sorry, I'm having trouble responding right now. Please try again later.";
  }
}

export async function getUserBadges(userId: string): Promise<Badge[]> {
  try {
    const userDoc = await adminDb.collection('users').doc(userId).get();
    if (userDoc.exists) {
      return (userDoc.data()?.badges || []) as Badge[];
    }
    return [];
  } catch (error) {
    console.error('Error fetching badges:', error);
    return [];
  }
}

export async function mintSkillBadgeAction(userId: string): Promise<{ success: boolean; txHash?: string; error?: string; badge?: Badge }> {
  if (!userId) {
    return { success: false, error: 'User not authenticated.' };
  }

  try {
    // In a real app, you'd verify the user's ID token here.
    // const decodedToken = await adminAuth.verifyIdToken(idToken);
    // const userId = decodedToken.uid;

    const userRef = adminDb.collection('users').doc(userId);

    // This is a simulated minting process.
    // In a real Web3 app, you would use ethers.js to interact with a smart contract.
    // e.g., const contract = new ethers.Contract(contractAddress, abi, signer);
    // const tx = await contract.mint(walletAddress, tokenId);
    // await tx.wait();
    // const txHash = tx.hash;

    const simulatedTxHash = `0x${[...Array(64)].map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`;

    const newBadge: Badge = {
      id: `python-basics-${Date.now()}`,
      name: 'Python Basics',
      description: 'Awarded for demonstrating foundational Python knowledge.',
      txHash: simulatedTxHash,
      date: new Date().toISOString(),
      icon: 'Code',
    };

    await userRef.set({
        badges: FieldValue.arrayUnion(newBadge)
    }, { merge: true });

    return { success: true, txHash: simulatedTxHash, badge: newBadge };
  } catch (error) {
    console.error('Error minting badge:', error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during minting.";
    return { success: false, error: `Failed to mint badge: ${errorMessage}` };
  }
}
