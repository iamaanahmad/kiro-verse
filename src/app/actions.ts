"use server";

import { getCodeFeedback as getCodeFeedbackFlow } from '@/ai/flows/get-code-feedback';
import { sendChatMessage as sendChatMessageFlow } from '@/ai/flows/send-chat-message';
import { awardSkillBadge as awardSkillBadgeFlow } from '@/ai/flows/award-skill-badge';
import { generateBadgeIcon as generateBadgeIconFlow } from '@/ai/flows/generate-badge-icon';
import { adminDb } from '@/lib/firebase/admin';
import type { Badge } from '@/types';
import { FieldValue } from 'firebase-admin/firestore';

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

export async function mintSkillBadgeAction(userId: string, badgeDetails: Omit<Badge, 'id' | 'txHash' | 'date'>): Promise<{ success: boolean; txHash?: string; error?: string; badge?: Badge }> {
  if (!userId) {
    return { success: false, error: 'User not authenticated.' };
  }

  try {
    const userRef = adminDb.collection('users').doc(userId);
    const simulatedTxHash = `0x${[...Array(64)].map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`;

    const newBadge: Badge = {
      id: `${badgeDetails.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
      name: badgeDetails.name,
      description: badgeDetails.description,
      icon: badgeDetails.icon,
      txHash: simulatedTxHash,
      date: new Date().toISOString(),
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
