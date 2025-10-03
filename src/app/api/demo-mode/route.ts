import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

// In-memory mock database for demo purposes when Firebase admin is not available
const mockUserData: Record<string, { demoMode: boolean }> = {};

const mockDb = {
  getDemoMode: (userId: string): boolean => {
    if (!mockUserData[userId]) {
      mockUserData[userId] = { demoMode: true };
    }
    return mockUserData[userId].demoMode;
  },
  
  setDemoMode: (userId: string, demoMode: boolean): void => {
    if (!mockUserData[userId]) {
      mockUserData[userId] = { demoMode: true };
    }
    mockUserData[userId].demoMode = demoMode;
  }
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    let demoMode = true;

    try {
      // Try Firebase first, fallback to mock DB
      if (adminDb && typeof adminDb.collection === 'function') {
        const userDoc = await adminDb.collection('users').doc(userId).get();
        if (userDoc.exists) {
          demoMode = userDoc.data()?.demoMode ?? true;
        }
      } else {
        // Use mock database
        console.log('Using mock database for getDemoMode');
        demoMode = mockDb.getDemoMode(userId);
      }
    } catch (error) {
      console.error('Error fetching demo mode, using mock database:', error);
      demoMode = mockDb.getDemoMode(userId);
    }

    return NextResponse.json({ demoMode });
  } catch (error) {
    console.error('Error in demo-mode GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, demoMode } = body;

    if (!userId || typeof demoMode !== 'boolean') {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
    }

    try {
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
      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('Error setting demo mode, using mock database:', error);
      mockDb.setDemoMode(userId, demoMode);
      console.log(`Demo mode set to ${demoMode} for user ${userId} (mock DB)`);
      return NextResponse.json({ success: true });
    }
  } catch (error) {
    console.error('Error in demo-mode POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}