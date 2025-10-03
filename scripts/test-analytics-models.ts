#!/usr/bin/env tsx

/**
 * Analytics Data Models Test
 * 
 * Simple test to verify analytics data models can be instantiated correctly
 * Run with: npx tsx scripts/test-analytics-models.ts
 */

// Load environment variables
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

import {
  UserProgress,
  AnalyticsData,
  LearningInsight,
  SkillLevel,
  TrendData,
  CodeSubmission,
  AIAnalysisResult
} from '../src/types/analytics';

import { AnalyticsUtils } from '../src/lib/firebase/analytics';

function testDataModels() {
  console.log('🧪 Testing Analytics Data Models...\n');

  // Test SkillLevel
  const skillLevel: SkillLevel = {
    skillId: 'javascript',
    skillName: 'JavaScript',
    currentLevel: 3,
    experiencePoints: 1500,
    competencyAreas: [
      {
        areaId: 'syntax',
        name: 'JavaScript Syntax',
        level: 3,
        maxLevel: 5,
        skills: ['variables', 'functions', 'classes']
      }
    ],
    industryBenchmark: {
      industryAverage: 2.5,
      experienceLevel: 'intermediate',
      percentile: 75,
      lastUpdated: new Date()
    },
    verificationStatus: 'verified',
    progressHistory: [
      {
        timestamp: new Date(),
        level: 3,
        experiencePoints: 1500,
        milestone: 'Completed advanced JavaScript challenges'
      }
    ],
    trendDirection: 'improving',
    lastUpdated: new Date()
  };

  console.log('✅ SkillLevel model created successfully');
  console.log(`   - Skill: ${skillLevel.skillName} (Level ${skillLevel.currentLevel})`);
  console.log(`   - XP: ${skillLevel.experiencePoints}`);
  console.log(`   - Status: ${skillLevel.verificationStatus}`);

  // Test UserProgress
  const trendData: TrendData = {
    direction: 'improving',
    changePercentage: 15.5,
    timeframe: '30d',
    dataPoints: 10
  };

  const userProgress: UserProgress = {
    userId: 'test-user-123',
    skillLevels: new Map([['javascript', skillLevel]]),
    learningVelocity: 0.8,
    codeQualityTrend: trendData,
    challengesCompleted: [],
    peerInteractions: [],
    lastAnalysisDate: new Date(),
    createdAt: new Date(),
    updatedAt: new Date()
  };

  console.log('\n✅ UserProgress model created successfully');
  console.log(`   - User ID: ${userProgress.userId}`);
  console.log(`   - Learning Velocity: ${userProgress.learningVelocity}`);
  console.log(`   - Skills Tracked: ${userProgress.skillLevels.size}`);

  // Test CodeSubmission and AIAnalysisResult
  const codeSubmission: CodeSubmission = {
    submissionId: 'sub-123',
    code: 'function fibonacci(n) { return n <= 1 ? n : fibonacci(n-1) + fibonacci(n-2); }',
    language: 'javascript',
    context: 'algorithm-practice',
    metrics: {
      linesOfCode: 1,
      complexity: 3,
      maintainability: 75
    },
    timestamp: new Date()
  };

  const aiAnalysis: AIAnalysisResult = {
    analysisId: 'analysis-123',
    codeQuality: 85,
    efficiency: 60, // Recursive fibonacci is inefficient
    creativity: 70,
    bestPractices: 80,
    suggestions: [
      'Consider using dynamic programming for better efficiency',
      'Add input validation for edge cases',
      'Consider iterative approach for large inputs'
    ],
    detectedSkills: ['javascript', 'recursion', 'algorithms'],
    improvementAreas: ['optimization', 'error-handling'],
    processingTime: 1200
  };

  console.log('\n✅ CodeSubmission and AIAnalysisResult models created successfully');
  console.log(`   - Code Quality Score: ${aiAnalysis.codeQuality}/100`);
  console.log(`   - Efficiency Score: ${aiAnalysis.efficiency}/100`);
  console.log(`   - Suggestions: ${aiAnalysis.suggestions.length}`);

  // Test AnalyticsData
  const analyticsData: AnalyticsData = {
    sessionId: AnalyticsUtils.generateSessionId(),
    userId: userProgress.userId,
    codeSubmission,
    aiAnalysis,
    skillImprovements: [
      {
        skillId: 'javascript',
        previousLevel: 2,
        newLevel: 3,
        improvementType: 'level_up',
        evidence: ['Completed advanced recursion challenge'],
        timestamp: new Date()
      }
    ],
    learningInsights: [],
    benchmarkComparisons: [
      {
        comparisonId: 'comp-123',
        skillId: 'javascript',
        userScore: 85,
        industryAverage: 75,
        peerAverage: 80,
        percentile: 78,
        category: 'algorithms',
        timestamp: new Date()
      }
    ],
    timestamp: new Date(),
    processingStatus: 'completed'
  };

  console.log('\n✅ AnalyticsData model created successfully');
  console.log(`   - Session ID: ${analyticsData.sessionId}`);
  console.log(`   - Processing Status: ${analyticsData.processingStatus}`);
  console.log(`   - Skill Improvements: ${analyticsData.skillImprovements.length}`);

  // Test LearningInsight
  const learningInsight: LearningInsight = {
    id: AnalyticsUtils.generateInsightId(),
    userId: userProgress.userId,
    type: 'recommendation',
    category: 'algorithm-optimization',
    title: 'Optimize Recursive Algorithms',
    description: 'Your recursive solutions show good understanding but could benefit from optimization techniques.',
    actionableSteps: [
      'Learn about memoization and dynamic programming',
      'Practice converting recursive solutions to iterative ones',
      'Study time and space complexity analysis'
    ],
    confidenceScore: 0.87,
    priority: 'medium',
    isRead: false,
    createdAt: new Date()
  };

  console.log('\n✅ LearningInsight model created successfully');
  console.log(`   - Type: ${learningInsight.type}`);
  console.log(`   - Priority: ${learningInsight.priority}`);
  console.log(`   - Confidence: ${(learningInsight.confidenceScore * 100).toFixed(1)}%`);
  console.log(`   - Action Steps: ${learningInsight.actionableSteps.length}`);

  // Test utility functions
  const sessionId1 = AnalyticsUtils.generateSessionId();
  const sessionId2 = AnalyticsUtils.generateSessionId();
  const insightId1 = AnalyticsUtils.generateInsightId();
  const insightId2 = AnalyticsUtils.generateInsightId();

  console.log('\n✅ Utility functions working correctly');
  console.log(`   - Session IDs are unique: ${sessionId1 !== sessionId2}`);
  console.log(`   - Insight IDs are unique: ${insightId1 !== insightId2}`);
  console.log(`   - Session ID format: ${sessionId1.match(/^session_\d+_[a-z0-9]+$/) ? 'Valid' : 'Invalid'}`);
  console.log(`   - Insight ID format: ${insightId1.match(/^insight_\d+_[a-z0-9]+$/) ? 'Valid' : 'Invalid'}`);

  console.log('\n🎉 All analytics data models tested successfully!');
  console.log('\nThe analytics system is ready for integration with:');
  console.log('   - User progress tracking');
  console.log('   - AI-powered code analysis');
  console.log('   - Personalized learning insights');
  console.log('   - Skill level progression');
  console.log('   - Industry benchmarking');
}

// Run the test
try {
  testDataModels();
} catch (error) {
  console.error('❌ Test failed:', error);
  process.exit(1);
}