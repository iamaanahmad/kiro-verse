# Analytics Database Schema Documentation

## Overview

The Analytics Database Schema provides comprehensive data models and database operations for the Advanced Learning Analytics & Gamification System in KiroVerse. This system tracks user progress, analyzes learning patterns, and provides personalized insights.

## Collections

### 1. User Progress (`userProgress`)

Stores comprehensive user learning progress and skill development data.

**Document Structure:**
```typescript
{
  userId: string;                    // Primary key - user identifier
  skillLevels: {                     // Map of skill ID to skill level data
    [skillId: string]: SkillLevel;
  };
  learningVelocity: number;          // Rate of learning progress (0-1)
  codeQualityTrend: TrendData;       // Overall code quality improvement trend
  challengesCompleted: Challenge[];   // Array of completed challenges
  peerInteractions: PeerInteraction[]; // Peer review and mentorship data
  lastAnalysisDate: string;          // ISO timestamp of last analysis
  createdAt: string;                 // ISO timestamp of creation
  updatedAt: string;                 // ISO timestamp of last update
}
```

**Indexes:**
- `userId` (ascending) + `updatedAt` (descending)

### 2. Analytics Data (`analyticsData`)

Stores detailed analytics for each code submission and AI analysis session.

**Document Structure:**
```typescript
{
  sessionId: string;                 // Unique session identifier
  userId: string;                    // User who submitted the code
  codeSubmission: CodeSubmission;    // Code and metadata
  aiAnalysis: AIAnalysisResult;      // AI analysis results
  skillImprovements: SkillImprovement[]; // Detected skill improvements
  learningInsights: LearningInsight[]; // Generated learning insights
  benchmarkComparisons: BenchmarkComparison[]; // Industry/peer comparisons
  timestamp: string;                 // ISO timestamp of analysis
  processingStatus: 'pending' | 'completed' | 'failed';
}
```

**Indexes:**
- `userId` (ascending) + `timestamp` (descending)
- `sessionId` (ascending)

### 3. Learning Insights (`learningInsights`)

Stores personalized learning recommendations and insights for users.

**Document Structure:**
```typescript
{
  id: string;                        // Unique insight identifier
  userId: string;                    // Target user
  type: 'strength' | 'improvement_area' | 'recommendation';
  category: string;                  // Insight category (e.g., 'code-quality')
  title: string;                     // Brief insight title
  description: string;               // Detailed description
  actionableSteps: string[];         // Specific action items
  confidenceScore: number;           // AI confidence (0-1)
  priority: 'low' | 'medium' | 'high';
  isRead: boolean;                   // User has viewed the insight
  createdAt: string;                 // ISO timestamp of creation
  expiresAt?: string;                // Optional expiration timestamp
}
```

**Indexes:**
- `userId` (ascending) + `createdAt` (descending)
- `userId` (ascending) + `isRead` (ascending) + `createdAt` (descending)
- `expiresAt` (ascending) - for cleanup operations

### 4. Challenges (`challenges`)

Stores coding challenges and competition data.

**Document Structure:**
```typescript
{
  challengeId: string;               // Unique challenge identifier
  title: string;                     // Challenge title
  description: string;               // Challenge description
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  skillsTargeted: string[];          // Skills this challenge tests
  timeLimit?: number;                // Optional time limit in minutes
  evaluationCriteria: EvaluationCriteria[]; // Scoring criteria
  createdBy: 'ai' | 'community' | 'employer';
  isActive: boolean;                 // Challenge is available
  completedAt?: string;              // User completion timestamp
  score?: number;                    // User's score (0-100)
  ranking?: number;                  // User's ranking in challenge
}
```

**Indexes:**
- `isActive` (ascending) + `difficulty` (ascending)

### 5. Benchmarks (`benchmarks`)

Stores industry and peer benchmark data for skill comparisons.

**Document Structure:**
```typescript
{
  benchmarkId: string;               // Unique benchmark identifier
  skillId: string;                   // Associated skill
  industryAverage: number;           // Industry average score
  experienceLevel: string;           // Target experience level
  dataSource: string;                // Source of benchmark data
  sampleSize: number;                // Number of data points
  lastUpdated: string;               // ISO timestamp of last update
  metadata: {                        // Additional benchmark metadata
    region?: string;
    jobRoles?: string[];
    companies?: string[];
  };
}
```

## Data Models

### Core Types

#### SkillLevel
Represents a user's proficiency in a specific skill area.

```typescript
interface SkillLevel {
  skillId: string;                   // Unique skill identifier
  skillName: string;                 // Human-readable skill name
  currentLevel: number;              // Current skill level (1-10)
  experiencePoints: number;          // Total XP earned in this skill
  competencyAreas: CompetencyArea[]; // Sub-skills and competencies
  industryBenchmark: BenchmarkScore; // Industry comparison data
  verificationStatus: 'verified' | 'pending' | 'unverified';
  progressHistory: ProgressPoint[];  // Historical progress data
  trendDirection: 'improving' | 'stable' | 'declining';
  lastUpdated: Date;                 // Last skill update timestamp
}
```

#### CodeSubmission
Represents a code submission for analysis.

```typescript
interface CodeSubmission {
  submissionId: string;              // Unique submission identifier
  code: string;                      // The submitted code
  language: string;                  // Programming language
  context: string;                   // Submission context (practice, challenge, etc.)
  metrics: CodeMetrics;              // Basic code metrics
  timestamp: Date;                   // Submission timestamp
}
```

#### AIAnalysisResult
Results from AI analysis of code submissions.

```typescript
interface AIAnalysisResult {
  analysisId: string;                // Unique analysis identifier
  codeQuality: number;               // Overall quality score (0-100)
  efficiency: number;                // Efficiency score (0-100)
  creativity: number;                // Creativity score (0-100)
  bestPractices: number;             // Best practices adherence (0-100)
  suggestions: string[];             // Improvement suggestions
  detectedSkills: string[];          // Skills demonstrated in code
  improvementAreas: string[];        // Areas needing improvement
  processingTime: number;            // Analysis processing time (ms)
}
```

## Database Operations

### UserProgressService

Manages user progress data with methods for:
- `getUserProgress(userId)` - Retrieve user's complete progress
- `createUserProgress(userProgress)` - Create new user progress record
- `updateUserProgress(userId, updates)` - Update user progress data
- `updateSkillLevel(userId, skillLevel)` - Update specific skill level

### AnalyticsDataService

Handles analytics data storage and retrieval:
- `saveAnalyticsData(analyticsData)` - Store new analytics session
- `getAnalyticsData(userId, limit)` - Get user's analytics history
- `getAnalyticsDataBySession(sessionId)` - Get specific session data

### LearningInsightsService

Manages learning insights and recommendations:
- `saveLearningInsight(insight)` - Store new learning insight
- `getUserLearningInsights(userId, unreadOnly, limit)` - Get user insights
- `markInsightAsRead(insightId)` - Mark insight as read
- `deleteExpiredInsights()` - Clean up expired insights

### AnalyticsUtils

Utility functions for analytics operations:
- `generateSessionId()` - Generate unique session identifier
- `generateInsightId()` - Generate unique insight identifier
- `batchUpdateUserProgress(updates)` - Batch update multiple users
- `cleanupOldAnalyticsData(daysToKeep)` - Archive old analytics data

## Security Rules

The database uses Firestore security rules to ensure data privacy:

- Users can only access their own progress and analytics data
- Challenges and benchmarks are readable by all authenticated users
- Write access is restricted based on data ownership and user roles

## Migration and Setup

### Running Migrations

```bash
# Run the analytics database migration
npx tsx scripts/run-analytics-migration.ts migrate

# Check migration status
npx tsx scripts/run-analytics-migration.ts status
```

### Required Indexes

The following composite indexes should be created in Firebase Console:

1. **userProgress**: `userId` (ASC) + `updatedAt` (DESC)
2. **analyticsData**: `userId` (ASC) + `timestamp` (DESC)
3. **analyticsData**: `sessionId` (ASC)
4. **learningInsights**: `userId` (ASC) + `createdAt` (DESC)
5. **learningInsights**: `userId` (ASC) + `isRead` (ASC) + `createdAt` (DESC)
6. **learningInsights**: `expiresAt` (ASC)
7. **challenges**: `isActive` (ASC) + `difficulty` (ASC)

### Environment Variables

Ensure the following Firebase configuration is set:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
FIREBASE_ADMIN_PROJECT_ID=your_project_id
FIREBASE_ADMIN_CLIENT_EMAIL=your_service_account_email
FIREBASE_ADMIN_PRIVATE_KEY=your_private_key
```

## Performance Considerations

### Caching Strategy

- User progress data is cached for 5 minutes
- Analytics data uses pagination with 50 items per page
- Learning insights are cached until marked as read

### Data Retention

- Analytics data is retained for 90 days by default
- Learning insights expire after 30 days unless marked as permanent
- User progress data is retained indefinitely

### Query Optimization

- All queries use appropriate indexes
- Batch operations are used for bulk updates
- Pagination is implemented for large result sets

## Testing

Run the analytics tests with:

```bash
npm test src/lib/firebase/__tests__/analytics.test.ts
```

The test suite covers:
- Data model validation
- Database operation interfaces
- Utility function behavior
- Error handling scenarios