/**
 * @fileOverview Integration tests for the skill progression tracking system
 * 
 * These tests verify that the complete system works together correctly,
 * from code analysis through skill progression tracking to database storage.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { analyzeAndTrackProgress, getUserSkillProgress, getUserLearningInsights } from '../index';
import { UserProgressService, AnalyticsDataService, LearningInsightsService } from '@/lib/firebase/analytics';
import { sendChatMessage } from '@/ai/flows/send-chat-message';
import { awardSkillBadge } from '@/ai/flows/award-skill-badge';

// Mock external dependencies
vi.mock('@/lib/firebase/analytics');
vi.mock('@/ai/flows/send-chat-message');
vi.mock('@/ai/flows/award-skill-badge');

const mockUserProgressService = UserProgressService as any;
const mockAnalyticsDataService = AnalyticsDataService as any;
const mockLearningInsightsService = LearningInsightsService as any;

describe('Analytics Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mock responses
    vi.mocked(sendChatMessage).mockResolvedValue({
      aiResponse: 'This code demonstrates excellent quality (90/100) with good efficiency (85/100). The creativity score is 80/100 and best practices score is 88/100. I suggest adding more comprehensive error handling and consider using TypeScript for better type safety.'
    });
    
    vi.mocked(awardSkillBadge).mockResolvedValue({
      badgeName: 'React Hooks',
      badgeDescription: 'Demonstrates proficiency with React Hooks including useState and useEffect'
    });
    
    mockAnalyticsDataService.saveAnalyticsData.mockResolvedValue('analytics-id');
    mockLearningInsightsService.saveLearningInsight.mockResolvedValue('insight-id');
  });

  describe('Complete Skill Progression Workflow', () => {
    it('should analyze code, track progression, and store results for new user', async () => {
      // Setup: New user with no existing progress
      mockUserProgressService.getUserProgress.mockResolvedValue(null);
      mockUserProgressService.createUserProgress.mockResolvedValue(undefined);

      const sampleReactCode = `
        import React, { useState, useEffect } from 'react';

        function UserProfile({ userId }) {
          const [user, setUser] = useState(null);
          const [loading, setLoading] = useState(true);

          useEffect(() => {
            async function fetchUser() {
              try {
                const response = await fetch(\`/api/users/\${userId}\`);
                const userData = await response.json();
                setUser(userData);
              } catch (error) {
                console.error('Failed to fetch user:', error);
              } finally {
                setLoading(false);
              }
            }
            
            fetchUser();
          }, [userId]);

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
      `;

      // Execute: Analyze the code submission
      const result = await analyzeAndTrackProgress(
        'user123',
        sampleReactCode,
        'React component with hooks'
      );

      // Verify: Analytics data was created correctly
      expect(result).toBeDefined();
      expect(result.userId).toBe('user123');
      expect(result.processingStatus).toBe('completed');
      expect(result.aiAnalysis.detectedSkills).toContain('React Hooks');
      expect(result.skillImprovements.length).toBeGreaterThan(0);
      expect(result.learningInsights.length).toBeGreaterThan(0);

      // Verify: Database operations were called
      expect(mockAnalyticsDataService.saveAnalyticsData).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user123',
          processingStatus: 'completed'
        })
      );
      
      expect(mockUserProgressService.createUserProgress).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user123'
        })
      );

      // Verify: Learning insights were saved
      expect(mockLearningInsightsService.saveLearningInsight).toHaveBeenCalled();
    });

    it('should update existing user progress correctly', async () => {
      // Setup: Existing user with some progress
      const existingProgress = {
        userId: 'user456',
        skillLevels: new Map([
          ['React Hooks', {
            skillId: 'React Hooks',
            skillName: 'React Hooks',
            currentLevel: 1,
            experiencePoints: 75,
            competencyAreas: [],
            industryBenchmark: {
              industryAverage: 50,
              experienceLevel: 'beginner',
              percentile: 60,
              lastUpdated: new Date()
            },
            verificationStatus: 'pending',
            progressHistory: [],
            trendDirection: 'improving',
            lastUpdated: new Date()
          }]
        ]),
        learningVelocity: 0.8,
        codeQualityTrend: {
          direction: 'improving',
          changePercentage: 15,
          timeframe: '30d',
          dataPoints: 5
        },
        challengesCompleted: [],
        peerInteractions: [],
        lastAnalysisDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000)
      };

      mockUserProgressService.getUserProgress.mockResolvedValue(existingProgress);
      mockUserProgressService.updateUserProgress.mockResolvedValue(undefined);

      const advancedReactCode = `
        import React, { useState, useEffect, useCallback, useMemo } from 'react';

        function OptimizedUserList({ users, onUserSelect }) {
          const [searchTerm, setSearchTerm] = useState('');
          const [sortBy, setSortBy] = useState('name');

          const filteredUsers = useMemo(() => {
            return users
              .filter(user => 
                user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.email.toLowerCase().includes(searchTerm.toLowerCase())
              )
              .sort((a, b) => a[sortBy].localeCompare(b[sortBy]));
          }, [users, searchTerm, sortBy]);

          const handleUserClick = useCallback((user) => {
            onUserSelect(user);
          }, [onUserSelect]);

          return (
            <div>
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="name">Name</option>
                <option value="email">Email</option>
              </select>
              <ul>
                {filteredUsers.map(user => (
                  <li key={user.id} onClick={() => handleUserClick(user)}>
                    {user.name} - {user.email}
                  </li>
                ))}
              </ul>
            </div>
          );
        }

        export default OptimizedUserList;
      `;

      // Execute: Analyze more advanced code
      const result = await analyzeAndTrackProgress(
        'user456',
        advancedReactCode,
        'Optimized React component with performance hooks'
      );

      // Verify: Skill level should have improved
      expect(result.skillImprovements).toContainEqual(
        expect.objectContaining({
          skillId: 'React Hooks',
          improvementType: expect.stringMatching(/level_up|experience_gain/)
        })
      );

      // Verify: Existing progress was updated, not created
      expect(mockUserProgressService.updateUserProgress).toHaveBeenCalled();
      expect(mockUserProgressService.createUserProgress).not.toHaveBeenCalled();
    });

    it('should handle skill level progression correctly', async () => {
      // Setup: User close to leveling up
      const nearLevelUpProgress = {
        userId: 'user789',
        skillLevels: new Map([
          ['JavaScript', {
            skillId: 'JavaScript',
            skillName: 'JavaScript',
            currentLevel: 1,
            experiencePoints: 95, // Close to level 2 threshold (100)
            competencyAreas: [],
            industryBenchmark: {
              industryAverage: 50,
              experienceLevel: 'beginner',
              percentile: 70,
              lastUpdated: new Date()
            },
            verificationStatus: 'pending',
            progressHistory: [],
            trendDirection: 'improving',
            lastUpdated: new Date()
          }]
        ]),
        learningVelocity: 1.2,
        codeQualityTrend: {
          direction: 'improving',
          changePercentage: 20,
          timeframe: '30d',
          dataPoints: 8
        },
        challengesCompleted: [],
        peerInteractions: [],
        lastAnalysisDate: new Date(),
        createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        updatedAt: new Date()
      };

      mockUserProgressService.getUserProgress.mockResolvedValue(nearLevelUpProgress);
      mockUserProgressService.updateUserProgress.mockResolvedValue(undefined);

      // Mock badge response for JavaScript
      vi.mocked(awardSkillBadge).mockResolvedValue({
        badgeName: 'JavaScript',
        badgeDescription: 'Demonstrates advanced JavaScript programming skills'
      });

      const javascriptCode = `
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
      `;

      // Execute: Analyze code that should trigger level up
      const result = await analyzeAndTrackProgress(
        'user789',
        javascriptCode,
        'Advanced JavaScript class with error handling'
      );

      // Verify: Level up occurred
      const levelUpImprovement = result.skillImprovements.find(
        imp => imp.skillId === 'JavaScript' && imp.improvementType === 'level_up'
      );
      
      expect(levelUpImprovement).toBeDefined();
      expect(levelUpImprovement?.newLevel).toBe(2);
      expect(levelUpImprovement?.previousLevel).toBe(1);
    });
  });

  describe('Convenience Functions', () => {
    it('should retrieve user skill progress correctly', async () => {
      const mockProgress = {
        userId: 'user123',
        skillLevels: new Map(),
        learningVelocity: 1.5,
        codeQualityTrend: {
          direction: 'improving',
          changePercentage: 25,
          timeframe: '30d',
          dataPoints: 10
        },
        challengesCompleted: [],
        peerInteractions: [],
        lastAnalysisDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockUserProgressService.getUserProgress.mockResolvedValue(mockProgress);

      const result = await getUserSkillProgress('user123');

      expect(result).toEqual(mockProgress);
      expect(mockUserProgressService.getUserProgress).toHaveBeenCalledWith('user123');
    });

    it('should retrieve user learning insights correctly', async () => {
      const mockInsights = [
        {
          id: 'insight1',
          userId: 'user123',
          type: 'strength',
          category: 'Code Quality',
          title: 'Excellent Code Structure',
          description: 'Your code demonstrates excellent organization and readability.',
          actionableSteps: ['Continue this approach', 'Share knowledge with peers'],
          confidenceScore: 0.95,
          priority: 'medium',
          isRead: false,
          createdAt: new Date()
        }
      ];

      mockLearningInsightsService.getUserLearningInsights.mockResolvedValue(mockInsights);

      const result = await getUserLearningInsights('user123', true);

      expect(result).toEqual(mockInsights);
      expect(mockLearningInsightsService.getUserLearningInsights).toHaveBeenCalledWith('user123', true);
    });
  });

  describe('Error Handling', () => {
    it('should handle database failures gracefully', async () => {
      mockUserProgressService.getUserProgress.mockRejectedValue(
        new Error('Database connection failed')
      );

      await expect(
        analyzeAndTrackProgress('user123', 'const x = 1;')
      ).rejects.toThrow('Database connection failed');

      // Should still attempt to save failed analytics record
      expect(mockAnalyticsDataService.saveAnalyticsData).toHaveBeenCalledWith(
        expect.objectContaining({
          processingStatus: 'failed'
        })
      );
    });

    it('should handle AI service failures gracefully', async () => {
      vi.mocked(sendChatMessage).mockRejectedValue(new Error('AI service timeout'));
      
      await expect(
        analyzeAndTrackProgress('user123', 'const x = 1;')
      ).rejects.toThrow('AI service timeout');
    });
  });
});