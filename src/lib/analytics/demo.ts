/**
 * @fileOverview Demonstration script for the skill progression tracking system
 * 
 * This script shows how to use the SkillProgressTracker to analyze code
 * and track skill improvements. It's intended for testing and demonstration purposes.
 */

import { SkillProgressTracker } from './skill-progress-tracker';
import type { AnalyticsData, UserProgress } from '@/types/analytics';

/**
 * Demo function that shows the complete skill progression workflow
 */
export async function demonstrateSkillTracking() {
  console.log('🚀 Starting Skill Progression Tracking Demo...\n');

  // Sample code submissions for demonstration
  const codeSubmissions = [
    {
      code: `
        async function fetchUserData(userId) {
          try {
            const response = await fetch(\`/api/users/\${userId}\`);
            if (!response.ok) {
              throw new Error('Failed to fetch user data');
            }
            return await response.json();
          } catch (error) {
            console.error('Error fetching user data:', error);
            throw error;
          }
        }
      `,
      context: 'Async JavaScript function with error handling',
      description: 'Basic async/await with error handling'
    },
    {
      code: `
        import React, { useState, useEffect, useCallback } from 'react';

        function UserProfile({ userId }) {
          const [user, setUser] = useState(null);
          const [loading, setLoading] = useState(true);

          const fetchUser = useCallback(async () => {
            try {
              setLoading(true);
              const response = await fetch(\`/api/users/\${userId}\`);
              const userData = await response.json();
              setUser(userData);
            } catch (error) {
              console.error('Failed to fetch user:', error);
            } finally {
              setLoading(false);
            }
          }, [userId]);

          useEffect(() => {
            fetchUser();
          }, [fetchUser]);

          if (loading) return <div>Loading...</div>;
          if (!user) return <div>User not found</div>;

          return (
            <div>
              <h1>{user.name}</h1>
              <p>{user.email}</p>
            </div>
          );
        }

        export default UserProfile;
      `,
      context: 'React component with hooks and performance optimization',
      description: 'Advanced React component with hooks'
    },
    {
      code: `
        class DataProcessor {
          constructor(config) {
            this.config = { ...config };
            this.cache = new Map();
          }

          async processData(data) {
            const cacheKey = this.generateCacheKey(data);
            
            if (this.cache.has(cacheKey)) {
              return this.cache.get(cacheKey);
            }

            try {
              const processed = await this.transform(data);
              const validated = this.validate(processed);
              
              this.cache.set(cacheKey, validated);
              return validated;
            } catch (error) {
              console.error('Data processing failed:', error);
              throw new Error(\`Processing failed: \${error.message}\`);
            }
          }

          generateCacheKey(data) {
            return btoa(JSON.stringify(data));
          }

          async transform(data) {
            return data.map(item => ({
              ...item,
              processed: true,
              timestamp: Date.now()
            }));
          }

          validate(data) {
            return data.filter(item => item && typeof item === 'object');
          }
        }
      `,
      context: 'Advanced JavaScript class with caching and error handling',
      description: 'Complex class-based architecture'
    }
  ];

  const userId = 'demo-user-123';
  const results: AnalyticsData[] = [];

  try {
    // Process each code submission
    for (let i = 0; i < codeSubmissions.length; i++) {
      const submission = codeSubmissions[i];
      
      console.log(`📝 Analyzing submission ${i + 1}: ${submission.description}`);
      console.log(`Code length: ${submission.code.trim().split('\n').length} lines`);
      
      // Analyze the code submission
      const result = await SkillProgressTracker.analyzeCodeSubmission(
        userId,
        submission.code,
        submission.context,
        {
          enableRealTimeAnalysis: true,
          generateInsights: true,
          updateBenchmarks: true,
          trackLearningVelocity: true
        }
      );

      results.push(result);

      // Display results
      console.log(`✅ Analysis completed in ${result.aiAnalysis.processingTime}ms`);
      console.log(`🎯 Detected skills: ${result.aiAnalysis.detectedSkills.join(', ')}`);
      console.log(`📊 Code quality: ${result.aiAnalysis.codeQuality}/100`);
      console.log(`⚡ Efficiency: ${result.aiAnalysis.efficiency}/100`);
      console.log(`🎨 Creativity: ${result.aiAnalysis.creativity}/100`);
      console.log(`✨ Best practices: ${result.aiAnalysis.bestPractices}/100`);
      
      if (result.skillImprovements.length > 0) {
        console.log(`🚀 Skill improvements:`);
        result.skillImprovements.forEach(improvement => {
          console.log(`  - ${improvement.skillId}: ${improvement.improvementType} (${improvement.previousLevel} → ${improvement.newLevel})`);
        });
      }

      if (result.learningInsights.length > 0) {
        console.log(`💡 Learning insights:`);
        result.learningInsights.forEach(insight => {
          console.log(`  - ${insight.type}: ${insight.title}`);
          console.log(`    ${insight.description}`);
        });
      }

      console.log('─'.repeat(60));
    }

    // Summary
    console.log('\n📈 SKILL PROGRESSION SUMMARY');
    console.log('═'.repeat(60));
    
    const allSkills = new Set<string>();
    const allImprovements = results.flatMap(r => r.skillImprovements);
    
    allImprovements.forEach(improvement => {
      allSkills.add(improvement.skillId);
    });

    console.log(`👤 User: ${userId}`);
    console.log(`📝 Code submissions analyzed: ${results.length}`);
    console.log(`🎯 Unique skills detected: ${allSkills.size}`);
    console.log(`🚀 Total skill improvements: ${allImprovements.length}`);
    
    const levelUps = allImprovements.filter(imp => imp.improvementType === 'level_up');
    console.log(`⬆️  Level ups: ${levelUps.length}`);
    
    const experienceGains = allImprovements.filter(imp => imp.improvementType === 'experience_gain');
    console.log(`💪 Experience gains: ${experienceGains.length}`);

    console.log('\n🏆 Skills by level:');
    const skillLevels = new Map<string, number>();
    allImprovements.forEach(improvement => {
      skillLevels.set(improvement.skillId, improvement.newLevel);
    });

    Array.from(skillLevels.entries())
      .sort(([,a], [,b]) => b - a)
      .forEach(([skill, level]) => {
        const stars = '⭐'.repeat(level);
        console.log(`  ${skill}: Level ${level} ${stars}`);
      });

    console.log('\n✅ Demo completed successfully!');
    return results;

  } catch (error) {
    console.error('❌ Demo failed:', error);
    throw error;
  }
}

/**
 * Helper function to display code metrics in a readable format
 */
export function displayCodeMetrics(metrics: any) {
  console.log('📊 Code Metrics:');
  console.log(`  Lines of Code: ${metrics.linesOfCode}`);
  console.log(`  Complexity: ${metrics.complexity}`);
  console.log(`  Maintainability: ${metrics.maintainability.toFixed(1)}`);
  console.log(`  Test Coverage: ${metrics.testCoverage}%`);
  console.log(`  Performance Score: ${metrics.performance}/100`);
  console.log(`  Security Score: ${metrics.security}/100`);
}

/**
 * Helper function to display user progress in a readable format
 */
export function displayUserProgress(progress: UserProgress) {
  console.log(`👤 User Progress for ${progress.userId}:`);
  console.log(`📈 Learning Velocity: ${progress.learningVelocity.toFixed(2)}`);
  console.log(`📊 Code Quality Trend: ${progress.codeQualityTrend.direction} (${progress.codeQualityTrend.changePercentage}%)`);
  console.log(`🎯 Skills: ${progress.skillLevels.size}`);
  console.log(`🏆 Challenges Completed: ${progress.challengesCompleted.length}`);
  console.log(`🤝 Peer Interactions: ${progress.peerInteractions.length}`);
  console.log(`📅 Last Analysis: ${progress.lastAnalysisDate.toLocaleDateString()}`);
}

// Export for use in other modules
export { SkillProgressTracker };