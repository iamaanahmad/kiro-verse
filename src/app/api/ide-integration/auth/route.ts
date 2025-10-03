import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { generateApiKey, hashApiKey } from '@/lib/ide-integration/auth-utils';

const AuthRequestSchema = z.object({
  userId: z.string().describe('User ID requesting API key'),
  pluginName: z.string().describe('Name of the IDE plugin'),
  pluginVersion: z.string().describe('Version of the IDE plugin'),
});

const RevokeRequestSchema = z.object({
  userId: z.string().describe('User ID revoking API key'),
  apiKey: z.string().describe('API key to revoke'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = AuthRequestSchema.parse(body);

    // Generate new API key
    const apiKey = generateApiKey(validatedData.userId);
    const hashedKey = hashApiKey(apiKey);

    // Store API key in Firebase
    const apiKeyDoc = {
      userId: validatedData.userId,
      hashedKey,
      pluginName: validatedData.pluginName,
      pluginVersion: validatedData.pluginVersion,
      createdAt: new Date(),
      lastUsed: null,
      isActive: true,
      permissions: ['feedback', 'credentials'],
    };

    await setDoc(doc(db, 'ide_api_keys', apiKey.substring(0, 16)), apiKeyDoc);

    return NextResponse.json({
      apiKey,
      permissions: apiKeyDoc.permissions,
      expiresAt: null, // API keys don't expire by default
      message: 'API key generated successfully',
    });
  } catch (error) {
    console.error('Error generating API key:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = RevokeRequestSchema.parse(body);

    // Find and revoke the API key
    const keyId = validatedData.apiKey.substring(0, 16);
    const keyDoc = await getDoc(doc(db, 'ide_api_keys', keyId));

    if (!keyDoc.exists()) {
      return NextResponse.json(
        { error: 'API key not found' },
        { status: 404 }
      );
    }

    const keyData = keyDoc.data();
    if (keyData.userId !== validatedData.userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Deactivate the API key
    await updateDoc(doc(db, 'ide_api_keys', keyId), {
      isActive: false,
      revokedAt: new Date(),
    });

    return NextResponse.json({
      message: 'API key revoked successfully',
    });
  } catch (error) {
    console.error('Error revoking API key:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}