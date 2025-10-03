import { NextRequest, NextResponse } from 'next/server';
import { assessmentVerificationService } from '@/lib/blockchain/assessment-verification';
import type { AssessmentResult } from '@/lib/blockchain/assessment-verification';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { assessmentResult, employerInfo } = body;

    if (!assessmentResult || !employerInfo) {
      return NextResponse.json(
        { error: 'Missing required fields: assessmentResult and employerInfo' },
        { status: 400 }
      );
    }

    // Validate assessment result structure
    const requiredFields = [
      'assessmentId', 'userId', 'employerId', 'completedAt', 
      'totalScore', 'maxScore', 'percentageScore', 'performanceLevel',
      'skillsAssessed', 'timeSpent', 'codeSubmissions', 'aiAnalysis'
    ];

    for (const field of requiredFields) {
      if (!(field in assessmentResult)) {
        return NextResponse.json(
          { error: `Missing required field in assessmentResult: ${field}` },
          { status: 400 }
        );
      }
    }

    // Verify assessment completion and mint blockchain badge
    const verificationResult = await assessmentVerificationService.verifyAssessmentCompletion(
      assessmentResult as AssessmentResult,
      employerInfo
    );

    if (!verificationResult.success) {
      return NextResponse.json(
        { error: verificationResult.error || 'Assessment verification failed' },
        { status: 500 }
      );
    }

    // Create employer verification tools
    const employerTools = await assessmentVerificationService.createEmployerVerificationTools(
      assessmentResult as AssessmentResult,
      verificationResult.verificationBadge!
    );

    return NextResponse.json({
      success: true,
      verificationBadge: verificationResult.verificationBadge,
      txHash: verificationResult.txHash,
      employerTools
    });

  } catch (error) {
    console.error('Assessment verification API error:', error);
    return NextResponse.json(
      { error: 'Internal server error during assessment verification' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const txHash = searchParams.get('txHash');
    const assessmentId = searchParams.get('assessmentId');

    if (!txHash || !assessmentId) {
      return NextResponse.json(
        { error: 'Missing required parameters: txHash and assessmentId' },
        { status: 400 }
      );
    }

    // Verify assessment authenticity
    const verificationResult = await assessmentVerificationService.verifyAssessmentAuthenticity(
      txHash,
      assessmentId
    );

    return NextResponse.json({
      isValid: verificationResult.isValid,
      assessmentData: verificationResult.assessmentData,
      verificationDetails: verificationResult.verificationDetails,
      error: verificationResult.error
    });

  } catch (error) {
    console.error('Assessment authenticity verification API error:', error);
    return NextResponse.json(
      { error: 'Internal server error during authenticity verification' },
      { status: 500 }
    );
  }
}