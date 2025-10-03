/**
 * @fileOverview Resource Suggestion System for automatic learning resource recommendations
 * 
 * This system implements intelligent resource suggestions that:
 * - Automatically identifies struggling concepts and suggests relevant resources
 * - Personalizes resource recommendations based on learning style and preferences
 * - Tracks resource effectiveness and user engagement
 * - Integrates with external learning platforms and documentation
 */

import {
  ResourceSuggestion,
  LearningStyle,
  PersonalizationMetrics,
  AdaptationContext
} from '@/types/personalization';
import {
  UserProgress,
  SkillLevel,
  LearningInsight
} from '@/types/analytics';
import { PersonalizationDataService } from '@/lib/firebase/personalization';
import { UserProgressService, LearningInsightsService } from '@/lib/firebase/analytics';

export interface ResourceContext {
  userId: string;
  strugglingAreas: string[];
  skillLevels: Map<string, SkillLevel>;
  recentInsights: LearningInsight[];
  learningGoals: string[];
  timeAvailable: number; // in minutes
  preferredResourceTypes: string[];
  currentProject?: string;
}

export interface ResourceDatabase {
  [skillArea: string]: {
    [difficulty: string]: ResourceItem[];
  };
}

export interface ResourceItem {
  id: string;
  title: string;
  description: string;
  url: string;
  type: 'documentation' | 'tutorial' | 'course' | 'practice_problem' | 'tool' | 'library';
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  estimatedTime: number;
  tags: string[];
  rating: number;
  completionRate: number;
  prerequisites: string[];
  learningObjectives: string[];
  format: 'text' | 'video' | 'interactive' | 'hands_on';
  provider: string;
  lastUpdated: Date;
  popularity: number;
}

export class ResourceSuggestionSystem {
  private static readonly RESOURCE_DATABASE: ResourceDatabase = {
    'JavaScript': {
      'beginner': [
        {
          id: 'js_basics_mdn',
          title: 'JavaScript Basics - MDN',
          description: 'Comprehensive guide to JavaScript fundamentals',
          url: 'https://developer.mozilla.org/en-US/docs/Learn/JavaScript/First_steps',
          type: 'documentation',
          difficulty: 'beginner',
          estimatedTime: 120,
          tags: ['fundamentals', 'syntax', 'variables'],
          rating: 4.8,
          completionRate: 0.85,
          prerequisites: [],
          learningObjectives: ['Variables', 'Functions', 'Control Flow'],
          format: 'text',
          provider: 'MDN',
          lastUpdated: new Date('2024-01-01'),
          popularity: 0.95
        },
        {
          id: 'js_interactive_codecademy',
          title: 'Interactive JavaScript Course',
          description: 'Hands-on JavaScript learning with immediate feedback',
          url: 'https://www.codecademy.com/learn/introduction-to-javascript',
          type: 'course',
          difficulty: 'beginner',
          estimatedTime: 300,
          tags: ['interactive', 'hands-on', 'projects'],
          rating: 4.6,
          completionRate: 0.78,
          prerequisites: [],
          learningObjectives: ['ES6 Features', 'DOM Manipulation', 'Event Handling'],
          format: 'interactive',
          provider: 'Codecademy',
          lastUpdated: new Date('2024-02-15'),
          popularity: 0.88
        }
      ],
      'intermediate': [
        {
          id: 'js_async_guide',
          title: 'Mastering Asynchronous JavaScript',
          description: 'Deep dive into promises, async/await, and event loops',
          url: 'https://javascript.info/async',
          type: 'tutorial',
          difficulty: 'intermediate',
          estimatedTime: 180,
          tags: ['async', 'promises', 'event-loop'],
          rating: 4.9,
          completionRate: 0.72,
          prerequisites: ['JavaScript Basics'],
          learningObjectives: ['Promises', 'Async/Await', 'Error Handling'],
          format: 'text',
          provider: 'JavaScript.info',
          lastUpdated: new Date('2024-03-01'),
          popularity: 0.82
        }
      ],
      'advanced': [
        {
          id: 'js_performance_optimization',
          title: 'JavaScript Performance Optimization',
          description: 'Advanced techniques for optimizing JavaScript applications',
          url: 'https://web.dev/fast/',
          type: 'documentation',
          difficulty: 'advanced',
          estimatedTime: 240,
          tags: ['performance', 'optimization', 'profiling'],
          rating: 4.7,
          completionRate: 0.65,
          prerequisites: ['Intermediate JavaScript', 'Browser APIs'],
          learningObjectives: ['Performance Profiling', 'Memory Management', 'Bundle Optimization'],
          format: 'text',
          provider: 'Web.dev',
          lastUpdated: new Date('2024-01-20'),
          popularity: 0.75
        }
      ]
    },
    'React': {
      'beginner': [
        {
          id: 'react_official_tutorial',
          title: 'React Official Tutorial',
          description: 'Learn React from the official documentation',
          url: 'https://react.dev/learn',
          type: 'tutorial',
          difficulty: 'beginner',
          estimatedTime: 200,
          tags: ['components', 'jsx', 'state'],
          rating: 4.8,
          completionRate: 0.80,
          prerequisites: ['JavaScript Basics'],
          learningObjectives: ['Components', 'Props', 'State Management'],
          format: 'interactive',
          provider: 'React Team',
          lastUpdated: new Date('2024-02-01'),
          popularity: 0.92
        }
      ],
      'intermediate': [
        {
          id: 'react_hooks_guide',
          title: 'Complete Guide to React Hooks',
          description: 'Master React Hooks with practical examples',
          url: 'https://overreacted.io/a-complete-guide-to-useeffect/',
          type: 'tutorial',
          difficulty: 'intermediate',
          estimatedTime: 150,
          tags: ['hooks', 'useEffect', 'useState'],
          rating: 4.9,
          completionRate: 0.75,
          prerequisites: ['React Basics'],
          learningObjectives: ['useState', 'useEffect', 'Custom Hooks'],
          format: 'text',
          provider: 'Dan Abramov',
          lastUpdated: new Date('2024-01-15'),
          popularity: 0.85
        }
      ]
    },
    'algorithms': {
      'beginner': [
        {
          id: 'algo_visualizer',
          title: 'Algorithm Visualizer',
          description: 'Interactive visualizations of common algorithms',
          url: 'https://algorithm-visualizer.org/',
          type: 'tool',
          difficulty: 'beginner',
          estimatedTime: 60,
          tags: ['visualization', 'sorting', 'searching'],
          rating: 4.7,
          completionRate: 0.88,
          prerequisites: [],
          learningObjectives: ['Algorithm Understanding', 'Complexity Analysis'],
          format: 'interactive',
          provider: 'Algorithm Visualizer',
          lastUpdated: new Date('2024-01-10'),
          popularity: 0.78
        }
      ],
      'intermediate': [
        {
          id: 'leetcode_patterns',
          title: 'LeetCode Patterns Guide',
          description: 'Common patterns for solving coding interview problems',
          url: 'https://leetcode.com/explore/',
          type: 'practice_problem',
          difficulty: 'intermediate',
          estimatedTime: 300,
          tags: ['patterns', 'interview-prep', 'problem-solving'],
          rating: 4.6,
          completionRate: 0.65,
          prerequisites: ['Basic Algorithms'],
          learningObjectives: ['Problem Patterns', 'Optimization Techniques'],
          format: 'hands_on',
          provider: 'LeetCode',
          lastUpdated: new Date('2024-02-20'),
          popularity: 0.90
        }
      ]
    },
    'testing': {
      'beginner': [
        {
          id: 'jest_getting_started',
          title: 'Getting Started with Jest',
          description: 'Learn unit testing with Jest framework',
          url: 'https://jestjs.io/docs/getting-started',
          type: 'documentation',
          difficulty: 'beginner',
          estimatedTime: 90,
          tags: ['unit-testing', 'jest', 'mocking'],
          rating: 4.5,
          completionRate: 0.82,
          prerequisites: ['JavaScript Basics'],
          learningObjectives: ['Unit Testing', 'Test Structure', 'Mocking'],
          format: 'text',
          provider: 'Jest',
          lastUpdated: new Date('2024-01-25'),
          popularity: 0.80
        }
      ]
    }
  };

  private static readonly RESOURCE_WEIGHTS = {
    rating: 0.3,
    completionRate: 0.25,
    popularity: 0.2,
    recency: 0.15,
    personalFit: 0.1
  };

  /**
   * Generates personalized resource suggestions for struggling areas
   */
  static async generateResourceSuggestions(
    context: ResourceContext
  ): Promise<ResourceSuggestion[]> {
    try {
      const [learningStyle, metrics] = await Promise.all([
        PersonalizationDataService.getLearningStyle(context.userId),
        PersonalizationDataService.getPersonalizationMetrics(context.userId)
      ]);

      const suggestions: ResourceSuggestion[] = [];

      for (const area of context.strugglingAreas) {
        const areaSuggestions = await this.generateSuggestionsForArea(
          area,
          context,
          learningStyle,
          metrics
        );
        suggestions.push(...areaSuggestions);
      }

      // Sort by relevance and personalization score
      const sortedSuggestions = suggestions
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, 8); // Limit to 8 suggestions

      // Save suggestions to database
      for (const suggestion of sortedSuggestions) {
        await PersonalizationDataService.saveResourceSuggestion(suggestion);
      }

      return sortedSuggestions;
    } catch (error) {
      console.error('Error generating resource suggestions:', error);
      throw error;
    }
  }

  /**
   * Updates resource suggestion effectiveness based on user interaction
   */
  static async trackResourceUsage(
    suggestionId: string,
    userId: string,
    interaction: {
      viewed: boolean;
      clicked: boolean;
      completed: boolean;
      timeSpent: number; // in minutes
      helpful: boolean;
      rating?: number; // 1-5 scale
      feedback?: string;
    }
  ): Promise<void> {
    try {
      const updates: any = {};

      if (interaction.viewed) {
        updates.viewedAt = new Date();
      }

      if (interaction.completed) {
        updates.completedAt = new Date();
      }

      if (interaction.rating) {
        updates.userRating = interaction.rating;
      }

      await PersonalizationDataService.updateResourceSuggestionStatus(suggestionId, updates);

      // Update personalization metrics
      const metrics = await PersonalizationDataService.getPersonalizationMetrics(userId);
      if (metrics) {
        const updatedMetrics = {
          ...metrics,
          engagementScore: interaction.clicked ? Math.min(1.0, metrics.engagementScore + 0.05) : metrics.engagementScore,
          satisfactionScore: interaction.rating ? (metrics.satisfactionScore + interaction.rating / 5) / 2 : metrics.satisfactionScore,
          lastCalculated: new Date()
        };
        await PersonalizationDataService.savePersonalizationMetrics(updatedMetrics);
      }

      // Learn from user behavior to improve future suggestions
      await this.updateResourcePreferences(userId, suggestionId, interaction);
    } catch (error) {
      console.error('Error tracking resource usage:', error);
      throw error;
    }
  }

  /**
   * Gets contextual resource recommendations based on current code or project
   */
  static async getContextualRecommendations(
    userId: string,
    codeContext: string,
    projectType?: string
  ): Promise<ResourceSuggestion[]> {
    try {
      const detectedSkills = this.analyzeCodeForSkills(codeContext);
      const strugglingAreas = await this.identifyStrugglingAreasFromCode(userId, detectedSkills);

      if (strugglingAreas.length === 0) {
        return [];
      }

      const context: ResourceContext = {
        userId,
        strugglingAreas,
        skillLevels: new Map(),
        recentInsights: [],
        learningGoals: [],
        timeAvailable: 30, // Default 30 minutes
        preferredResourceTypes: ['tutorial', 'documentation'],
        currentProject: projectType
      };

      return await this.generateResourceSuggestions(context);
    } catch (error) {
      console.error('Error getting contextual recommendations:', error);
      return [];
    }
  }

  /**
   * Generates emergency learning resources for critical skill gaps
   */
  static async generateEmergencyResources(
    userId: string,
    criticalAreas: string[],
    urgencyLevel: 'high' | 'critical'
  ): Promise<ResourceSuggestion[]> {
    try {
      const learningStyle = await PersonalizationDataService.getLearningStyle(userId);
      const suggestions: ResourceSuggestion[] = [];

      for (const area of criticalAreas) {
        const resources = this.getResourcesForArea(area, 'beginner');
        
        // Prioritize quick, high-impact resources
        const quickResources = resources
          .filter(r => r.estimatedTime <= 60 && r.rating >= 4.5)
          .slice(0, 2);

        for (const resource of quickResources) {
          const suggestion: ResourceSuggestion = {
            suggestionId: `emergency_${userId}_${area}_${Date.now()}`,
            userId,
            resourceType: resource.type,
            title: `🚨 ${resource.title}`,
            description: `Emergency resource: ${resource.description}`,
            url: resource.url,
            difficulty: resource.difficulty,
            estimatedTime: resource.estimatedTime,
            skillsAddressed: [area],
            personalizedReason: `Critical skill gap identified in ${area}. This resource provides quick, essential knowledge.`,
            relevanceScore: 0.95,
            urgency: urgencyLevel,
            createdAt: new Date()
          };

          suggestions.push(suggestion);
        }
      }

      return suggestions;
    } catch (error) {
      console.error('Error generating emergency resources:', error);
      throw error;
    }
  }

  // Private helper methods

  private static async generateSuggestionsForArea(
    area: string,
    context: ResourceContext,
    learningStyle: LearningStyle | null,
    metrics: PersonalizationMetrics | null
  ): Promise<ResourceSuggestion[]> {
    const suggestions: ResourceSuggestion[] = [];
    const skillLevel = context.skillLevels.get(area);
    const difficulty = this.determineDifficultyLevel(skillLevel?.currentLevel || 1);
    
    const resources = this.getResourcesForArea(area, difficulty);
    const filteredResources = this.filterResourcesByPreferences(resources, learningStyle, context);
    
    for (const resource of filteredResources.slice(0, 3)) {
      const relevanceScore = this.calculateRelevanceScore(resource, context, learningStyle, metrics);
      
      const suggestion: ResourceSuggestion = {
        suggestionId: `resource_${context.userId}_${area}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: context.userId,
        resourceType: resource.type,
        title: resource.title,
        description: resource.description,
        url: resource.url,
        difficulty: resource.difficulty,
        estimatedTime: this.adjustTimeEstimate(resource.estimatedTime, learningStyle),
        skillsAddressed: [area],
        personalizedReason: this.generatePersonalizedReason(resource, area, learningStyle, context),
        relevanceScore,
        urgency: this.determineUrgency(area, context),
        createdAt: new Date()
      };

      suggestions.push(suggestion);
    }

    return suggestions;
  }

  private static getResourcesForArea(
    area: string,
    difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  ): ResourceItem[] {
    const areaResources = this.RESOURCE_DATABASE[area];
    if (!areaResources) {
      return [];
    }

    const difficultyResources = areaResources[difficulty] || [];
    
    // Also include resources from adjacent difficulty levels
    const adjacentDifficulties = this.getAdjacentDifficulties(difficulty);
    for (const adjDiff of adjacentDifficulties) {
      if (areaResources[adjDiff]) {
        difficultyResources.push(...areaResources[adjDiff].slice(0, 1));
      }
    }

    return difficultyResources;
  }

  private static filterResourcesByPreferences(
    resources: ResourceItem[],
    learningStyle: LearningStyle | null,
    context: ResourceContext
  ): ResourceItem[] {
    let filtered = [...resources];

    // Filter by preferred resource types
    if (context.preferredResourceTypes.length > 0) {
      filtered = filtered.filter(r => 
        context.preferredResourceTypes.includes(r.type) ||
        r.rating >= 4.8 // Always include highly rated resources
      );
    }

    // Filter by time availability
    filtered = filtered.filter(r => r.estimatedTime <= context.timeAvailable * 1.5);

    // Filter by learning style preferences
    if (learningStyle) {
      if (learningStyle.preferredFeedbackType === 'visual') {
        filtered = filtered.filter(r => 
          r.format === 'video' || 
          r.format === 'interactive' ||
          r.type === 'tool'
        );
      }

      if (learningStyle.interactionStyle === 'collaborative') {
        // Prefer resources that support community interaction
        filtered = filtered.filter(r => 
          r.provider === 'Codecademy' || 
          r.provider === 'LeetCode' ||
          r.rating >= 4.7
        );
      }
    }

    return filtered;
  }

  private static calculateRelevanceScore(
    resource: ResourceItem,
    context: ResourceContext,
    learningStyle: LearningStyle | null,
    metrics: PersonalizationMetrics | null
  ): number {
    let score = 0;

    // Base score from resource quality
    score += resource.rating / 5 * this.RESOURCE_WEIGHTS.rating;
    score += resource.completionRate * this.RESOURCE_WEIGHTS.completionRate;
    score += resource.popularity * this.RESOURCE_WEIGHTS.popularity;

    // Recency score (newer resources get slight boost)
    const daysSinceUpdate = (Date.now() - resource.lastUpdated.getTime()) / (1000 * 60 * 60 * 24);
    const recencyScore = Math.max(0, 1 - daysSinceUpdate / 365);
    score += recencyScore * this.RESOURCE_WEIGHTS.recency;

    // Personal fit score
    let personalFit = 0.5; // Base fit

    if (learningStyle) {
      // Adjust based on learning style
      if (learningStyle.preferredFeedbackType === 'detailed' && resource.format === 'text') {
        personalFit += 0.2;
      }
      if (learningStyle.preferredFeedbackType === 'visual' && resource.format === 'video') {
        personalFit += 0.2;
      }
      if (learningStyle.interactionStyle === 'independent' && resource.type === 'documentation') {
        personalFit += 0.1;
      }
    }

    // Adjust based on time availability
    if (resource.estimatedTime <= context.timeAvailable) {
      personalFit += 0.1;
    }

    score += personalFit * this.RESOURCE_WEIGHTS.personalFit;

    return Math.min(1, Math.max(0, score));
  }

  private static generatePersonalizedReason(
    resource: ResourceItem,
    area: string,
    learningStyle: LearningStyle | null,
    context: ResourceContext
  ): string {
    let reason = `You're working on improving your ${area} skills. `;

    if (learningStyle) {
      if (learningStyle.learningPace === 'fast') {
        reason += `This ${resource.type} matches your fast learning pace. `;
      } else if (learningStyle.learningPace === 'slow') {
        reason += `This ${resource.type} allows you to learn at your preferred steady pace. `;
      }

      if (learningStyle.preferredFeedbackType === 'detailed' && resource.format === 'text') {
        reason += `The detailed explanations align with your learning preference. `;
      }
    }

    if (resource.estimatedTime <= 60) {
      reason += `It's a quick resource that fits into your schedule. `;
    }

    if (resource.rating >= 4.7) {
      reason += `It's highly rated by other learners. `;
    }

    return reason.trim();
  }

  private static determineUrgency(
    area: string,
    context: ResourceContext
  ): 'low' | 'medium' | 'high' {
    const criticalAreas = ['security', 'performance', 'testing'];
    
    if (criticalAreas.includes(area.toLowerCase())) {
      return 'high';
    }

    if (context.strugglingAreas.length > 3) {
      return 'high';
    }

    if (context.strugglingAreas.length > 1) {
      return 'medium';
    }

    return 'low';
  }

  private static determineDifficultyLevel(skillLevel: number): 'beginner' | 'intermediate' | 'advanced' | 'expert' {
    if (skillLevel >= 4) return 'expert';
    if (skillLevel >= 3) return 'advanced';
    if (skillLevel >= 2) return 'intermediate';
    return 'beginner';
  }

  private static getAdjacentDifficulties(
    difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  ): string[] {
    const difficultyMap = {
      'beginner': ['intermediate'],
      'intermediate': ['beginner', 'advanced'],
      'advanced': ['intermediate', 'expert'],
      'expert': ['advanced']
    };

    return difficultyMap[difficulty] || [];
  }

  private static adjustTimeEstimate(
    baseTime: number,
    learningStyle: LearningStyle | null
  ): number {
    if (!learningStyle) return baseTime;

    if (learningStyle.learningPace === 'fast') {
      return Math.round(baseTime * 0.8);
    }
    if (learningStyle.learningPace === 'slow') {
      return Math.round(baseTime * 1.3);
    }

    return baseTime;
  }

  private static analyzeCodeForSkills(code: string): string[] {
    const skills: string[] = [];
    
    if (code.includes('React') || code.includes('jsx')) skills.push('React');
    if (code.includes('async') || code.includes('await')) skills.push('JavaScript');
    if (code.includes('test(') || code.includes('expect(')) skills.push('testing');
    if (code.includes('algorithm') || code.includes('sort')) skills.push('algorithms');
    
    return skills;
  }

  private static async identifyStrugglingAreasFromCode(
    userId: string,
    detectedSkills: string[]
  ): Promise<string[]> {
    try {
      const userProgress = await UserProgressService.getUserProgress(userId);
      if (!userProgress) return detectedSkills;

      const strugglingAreas: string[] = [];
      
      for (const skill of detectedSkills) {
        const skillLevel = userProgress.skillLevels.get(skill);
        if (!skillLevel || skillLevel.currentLevel < 2) {
          strugglingAreas.push(skill);
        }
      }

      return strugglingAreas;
    } catch (error) {
      console.error('Error identifying struggling areas:', error);
      return detectedSkills;
    }
  }

  private static async updateResourcePreferences(
    userId: string,
    suggestionId: string,
    interaction: any
  ): Promise<void> {
    try {
      // This would update user preferences based on resource interaction patterns
      // For now, we'll just log the interaction for future ML model training
      console.log(`Resource interaction logged for user ${userId}:`, {
        suggestionId,
        helpful: interaction.helpful,
        timeSpent: interaction.timeSpent,
        completed: interaction.completed
      });
    } catch (error) {
      console.error('Error updating resource preferences:', error);
    }
  }
}