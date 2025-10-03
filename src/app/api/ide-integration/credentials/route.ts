import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

const CredentialsRequestSchema = z.object({
  userId: z.string().describe('User ID to fetch credentials for'),
  apiKey: z.string().describe('IDE plugin API key'),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const apiKey = searchParams.get('apiKey');

    if (!userId || !apiKey) {
      return NextResponse.json(
        { error: 'Missing userId or apiKey' },
        { status: 400 }
      );
    }

    const validatedData = CredentialsRequestSchema.parse({ userId, apiKey });

    // Validate API key
    if (!isValidApiKey(validatedData.apiKey, validatedData.userId)) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      );
    }

    // Fetch user's badges from Firebase
    const badgesQuery = query(
      collection(db, 'badges'),
      where('userId', '==', userId)
    );
    
    const badgesSnapshot = await getDocs(badgesQuery);
    const badges = badgesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Fetch user's skill levels
    const skillsQuery = query(
      collection(db, 'user_progress'),
      where('userId', '==', userId)
    );
    
    const skillsSnapshot = await getDocs(skillsQuery);
    const skills = skillsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({
      badges: badges.map(badge => ({
        id: badge.id,
        name: badge.name,
        description: badge.description,
        skillCategory: badge.skillCategory,
        rarity: badge.rarity,
        issuedAt: badge.issuedAt,
        verificationUrl: badge.verificationUrl,
      })),
      skills: skills.map(skill => ({
        skillId: skill.skillId,
        skillName: skill.skillName,
        level: skill.currentLevel,
        experiencePoints: skill.experiencePoints,
        lastUpdated: skill.lastUpdated,
      })),
      profileUrl: `${process.env.NEXT_PUBLIC_APP_URL}/profile/${userId}`,
    });
  } catch (error) {
    console.error('Error fetching credentials:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function isValidApiKey(apiKey: string, userId: string): boolean {
  // In a real implementation, this would validate against a database
  return apiKey.startsWith(`kiro_${userId}_`) && apiKey.length > 20;
}