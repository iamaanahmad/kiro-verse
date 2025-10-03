/**
 * @fileOverview SkillProgressTracker service for analyzing code submissions and tracking skill improvements
 * 
 * This service implements the core skill progression tracking system that:
 * - Analyzes code submissions for skill demonstration
 * - Calculates skill level improvements based on code quality metrics
 * - Tracks learning velocity and progress trends
 * - Integrates with existing AI flows for comprehensive analysis
 */

import { 
  UserProgress, 
  SkillLevel, 
  AnalyticsData, 
  CodeSubmission, 
  AIAnalysisResult, 
  SkillImprovement, 
  LearningInsight,
  CodeMetrics,
  ProgressPoint,
  TrendData
} from '@/types/analytics';
import { UserProgressService, AnalyticsDataService, LearningInsightsService, AnalyticsUtils } from '@/lib/firebase/analytics';
import { sendChatMessage } from '@/ai/flows/send-chat-message';
import { awardSkillBadge } from '@/ai/flows/award-skill-badge';
import { AnalyticsErrorHandler, withErrorHandling, ErrorContext } from './error-handling';

export interface SkillAnalysisResult {
  detectedSkills: string[];
  codeQuality: number;
  efficiency: number;
  creativity: number;
  bestPractices: number;
  suggestions: string[];
  improvementAreas: string[];
}

export interface ProgressTrackingOptions {
  enableRealTimeAnalysis?: boolean;
  generateInsights?: boolean;
  updateBenchmarks?: boolean;
  trackLearningVelocity?: boolean;
}

export class SkillProgressTracker {
  private static readonly SKILL_CATEGORIES = {
    'JavaScript': ['promises', 'async-await', 'closures', 'prototypes', 'es6-features'],
    'TypeScript': ['interfaces', 'generics', 'type-guards', 'decorators', 'advanced-types'],
    'React': ['hooks', 'components', 'state-management', 'lifecycle', 'context'],
    'Node.js': ['modules', 'streams', 'events', 'file-system', 'http'],
    'Database': ['queries', 'optimization', 'transactions', 'modeling', 'indexing'],
    'Testing': ['unit-tests', 'integration-tests', 'mocking', 'tdd', 'coverage'],
    'Security': ['authentication', 'authorization', 'encryption', 'validation', 'sanitization'],
    'Performance': ['optimization', 'caching', 'profiling', 'memory-management', 'algorithms']
  };

  private static readonly EXPERIENCE_THRESHOLDS = {
    beginner: 0,
    intermediate: 100,
    advanced: 500,
    expert: 1500
  };

  /**
   * Analyzes a code submission and updates user skill progression
   */
  static async analyzeCodeSubmission(
    userId: string,
    code: string,
    context: string = '',
    options: ProgressTrackingOptions = {}
  ): Promise<AnalyticsData> {
    const sessionId = AnalyticsUtils.generateSessionId();
    const errorContext: ErrorContext = {
      operation: 'analyzeCodeSubmission',
      userId,
      sessionId,
      timestamp: new Date(),
      metadata: { codeLength: code.length, options }
    };
    
    try {
      // Create code submission record with error handling
      const codeSubmission: CodeSubmission = await AnalyticsErrorHandler.withTimeout(
        async () => ({
          submissionId: `sub_${Date.now()}`,
          code,
          language: this.detectLanguage(code),
          context,
          metrics: await this.calculateCodeMetrics(code),
          timestamp: new Date()
        }),
        10000, // 10 second timeout
        errorContext
      );

      // Perform AI analysis with retry and fallback
      const aiAnalysis = await AnalyticsErrorHandler.withRetry(
        () => this.performAIAnalysis(code, context, userId),
        errorContext,
        { maxAttempts: 2, baseDelay: 1000 }
      );
      
      // Calculate skill improvements with error handling
      const skillImprovements = await AnalyticsErrorHandler.handleDatabaseError(
        () => this.calculateSkillImprovements(userId, aiAnalysis),
        errorContext,
        [] // fallback to empty array
      );
      
      // Generate learning insights with graceful degradation
      let learningInsights: LearningInsight[] = [];
      if (options.generateInsights !== false) {
        try {
          learningInsights = await AnalyticsErrorHandler.withTimeout(
            () => this.generateLearningInsights(userId, aiAnalysis, skillImprovements),
            5000, // 5 second timeout for insights
            errorContext
          );
        } catch (insightError) {
          console.warn('Failed to generate learning insights, continuing without them:', insightError);
          learningInsights = [];
        }
      }

      // Create analytics data record
      const analyticsData: AnalyticsData = {
        sessionId,
        userId,
        codeSubmission,
        aiAnalysis,
        skillImprovements,
        learningInsights,
        benchmarkComparisons: [], // Will be populated by benchmark system
        timestamp: new Date(),
        processingStatus: 'completed'
      };

      // Validate analytics data
      AnalyticsErrorHandler.validateAnalyticsData(analyticsData, errorContext);

      // Save analytics data with retry
      await AnalyticsErrorHandler.handleDatabaseError(
        () => AnalyticsDataService.saveAnalyticsData(analyticsData),
        errorContext
      );

      // Update user progress with error handling
      if (options.enableRealTimeAnalysis !== false) {
        try {
          await AnalyticsErrorHandler.withRetry(
            () => this.updateUserProgress(userId, skillImprovements, analyticsData),
            errorContext,
            { maxAttempts: 2 }
          );
        } catch (progressError) {
          console.warn('Failed to update user progress, analytics saved but progress not updated:', progressError);
        }
      }

      // Save learning insights with error handling
      for (const insight of learningInsights) {
        try {
          await AnalyticsErrorHandler.handleDatabaseError(
            () => LearningInsightsService.saveLearningInsight(insight),
            errorContext
          );
        } catch (insightError) {
          console.warn('Failed to save learning insight:', insightError);
        }
      }

      return analyticsData;
    } catch (error) {
      // Handle the error using the error handler
      return await AnalyticsErrorHandler.handleAnalyticsProcessingError(
        error as Error,
        errorContext,
        { analyticsData: null }
      );
    }
  }

  /**
   * Performs comprehensive AI analysis of code submission with fallback
   */
  private static async performAIAnalysis(code: string, context: string, userId?: string): Promise<AIAnalysisResult> {
    const startTime = Date.now();
    const errorContext: ErrorContext = {
      operation: 'performAIAnalysis',
      userId,
      timestamp: new Date(),
      metadata: { codeLength: code.length }
    };
    
    try {
      // Use existing AI flows for analysis with proper parameters
      const chatResponse = await sendChatMessage({
        code,
        query: `Analyze this code for quality, efficiency, creativity, and best practices. Provide specific suggestions for improvement and identify demonstrated programming skills.`,
        enableAnalytics: false, // Prevent circular analytics calls
        userId
      });

      const badgeResponse = await awardSkillBadge({ 
        code,
        enableAnalytics: false, // Prevent circular analytics calls
        userId
      });

      // Parse AI response to extract metrics
      const analysis = this.parseAIResponse(chatResponse.aiResponse, badgeResponse);
      
      return {
        analysisId: `analysis_${Date.now()}`,
        codeQuality: analysis.codeQuality,
        efficiency: analysis.efficiency,
        creativity: analysis.creativity,
        bestPractices: analysis.bestPractices,
        suggestions: analysis.suggestions,
        detectedSkills: analysis.detectedSkills,
        improvementAreas: analysis.improvementAreas,
        processingTime: Date.now() - startTime
      };
    } catch (error) {
      console.warn('AI analysis failed, attempting fallback:', error);
      
      // Use fallback analysis
      const fallbackResponse = await AnalyticsErrorHandler.handleAIAnalysisFailure(code, errorContext);
      
      return {
        analysisId: `analysis_fallback_${Date.now()}`,
        codeQuality: fallbackResponse.basicMetrics?.estimatedQuality || 50,
        efficiency: 50,
        creativity: 50,
        bestPractices: fallbackResponse.basicMetrics?.hasComments ? 70 : 50,
        suggestions: ['AI analysis temporarily unavailable. Basic analysis completed.'],
        detectedSkills: this.detectSkillsFromCode(code),
        improvementAreas: ['Consider adding more comments', 'Review code structure'],
        processingTime: Date.now() - startTime
      };
    }
  }

  /**
   * Parses AI response to extract structured analysis data
   */
  private static parseAIResponse(chatResponse: string, badgeResponse: any): SkillAnalysisResult {
    // Extract metrics from AI response using pattern matching and heuristics
    const codeQuality = this.extractMetricFromResponse(chatResponse, 'quality') || 70;
    const efficiency = this.extractMetricFromResponse(chatResponse, 'efficiency') || 70;
    const creativity = this.extractMetricFromResponse(chatResponse, 'creativity') || 60;
    const bestPractices = this.extractMetricFromResponse(chatResponse, 'best practices') || 70;

    // Extract suggestions and improvement areas
    const suggestions = this.extractSuggestions(chatResponse);
    const improvementAreas = this.extractImprovementAreas(chatResponse);
    
    // Combine detected skills from badge analysis and response parsing
    const detectedSkills = [
      badgeResponse.badgeName,
      ...this.extractSkillsFromResponse(chatResponse)
    ].filter(Boolean);

    return {
      detectedSkills,
      codeQuality,
      efficiency,
      creativity,
      bestPractices,
      suggestions,
      improvementAreas
    };
  }

  /**
   * Calculates skill level improvements based on AI analysis
   */
  private static async calculateSkillImprovements(
    userId: string, 
    aiAnalysis: AIAnalysisResult
  ): Promise<SkillImprovement[]> {
    const improvements: SkillImprovement[] = [];
    const userProgress = await UserProgressService.getUserProgress(userId);
    
    for (const skillId of aiAnalysis.detectedSkills) {
      const currentSkill = userProgress?.skillLevels.get(skillId);
      const experienceGain = this.calculateExperienceGain(aiAnalysis, skillId);
      
      if (currentSkill) {
        const newExperience = currentSkill.experiencePoints + experienceGain;
        const newLevel = this.calculateLevelFromExperience(newExperience);
        
        if (newLevel > currentSkill.currentLevel) {
          improvements.push({
            skillId,
            previousLevel: currentSkill.currentLevel,
            newLevel,
            improvementType: 'level_up',
            evidence: [`Demonstrated ${skillId} in code analysis`],
            timestamp: new Date()
          });
        } else if (experienceGain > 0) {
          improvements.push({
            skillId,
            previousLevel: currentSkill.currentLevel,
            newLevel: currentSkill.currentLevel,
            improvementType: 'experience_gain',
            evidence: [`Gained ${experienceGain} experience in ${skillId}`],
            timestamp: new Date()
          });
        }
      } else {
        // New skill detected
        improvements.push({
          skillId,
          previousLevel: 0,
          newLevel: 1,
          improvementType: 'level_up',
          evidence: [`First demonstration of ${skillId}`],
          timestamp: new Date()
        });
      }
    }
    
    return improvements;
  }

  /**
   * Updates user progress with new skill improvements
   */
  private static async updateUserProgress(
    userId: string,
    skillImprovements: SkillImprovement[],
    analyticsData: AnalyticsData
  ): Promise<void> {
    let userProgress = await UserProgressService.getUserProgress(userId);
    
    if (!userProgress) {
      // Create new user progress record
      userProgress = {
        userId,
        skillLevels: new Map(),
        learningVelocity: 0,
        codeQualityTrend: {
          direction: 'stable',
          changePercentage: 0,
          timeframe: '30d',
          dataPoints: 1
        },
        challengesCompleted: [],
        peerInteractions: [],
        lastAnalysisDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }

    // Update skill levels based on improvements
    for (const improvement of skillImprovements) {
      const existingSkill = userProgress.skillLevels.get(improvement.skillId);
      
      const updatedSkill: SkillLevel = {
        skillId: improvement.skillId,
        skillName: improvement.skillId,
        currentLevel: improvement.newLevel,
        experiencePoints: existingSkill ? 
          existingSkill.experiencePoints + this.calculateExperienceFromImprovement(improvement) :
          this.calculateExperienceFromLevel(improvement.newLevel),
        competencyAreas: existingSkill?.competencyAreas || [],
        industryBenchmark: existingSkill?.industryBenchmark || {
          industryAverage: 50,
          experienceLevel: 'beginner',
          percentile: 50,
          lastUpdated: new Date()
        },
        verificationStatus: 'pending',
        progressHistory: [
          ...(existingSkill?.progressHistory || []),
          {
            timestamp: new Date(),
            level: improvement.newLevel,
            experiencePoints: existingSkill ? 
              existingSkill.experiencePoints + this.calculateExperienceFromImprovement(improvement) :
              this.calculateExperienceFromLevel(improvement.newLevel),
            milestone: improvement.improvementType === 'level_up' ? `Level ${improvement.newLevel}` : undefined
          }
        ],
        trendDirection: this.calculateTrendDirection(existingSkill?.progressHistory || []),
        lastUpdated: new Date()
      };
      
      userProgress.skillLevels.set(improvement.skillId, updatedSkill);
    }

    // Update learning velocity and trends
    userProgress.learningVelocity = this.calculateLearningVelocity(userProgress);
    userProgress.codeQualityTrend = this.calculateCodeQualityTrend(analyticsData, userProgress);
    userProgress.lastAnalysisDate = new Date();
    userProgress.updatedAt = new Date();

    // Save updated progress
    if (userProgress.createdAt === userProgress.updatedAt) {
      await UserProgressService.createUserProgress(userProgress);
    } else {
      await UserProgressService.updateUserProgress(userId, userProgress);
    }
  }

  /**
   * Generates personalized learning insights based on analysis
   */
  private static async generateLearningInsights(
    userId: string,
    aiAnalysis: AIAnalysisResult,
    skillImprovements: SkillImprovement[]
  ): Promise<LearningInsight[]> {
    const insights: LearningInsight[] = [];
    
    // Generate strength insights
    if (aiAnalysis.codeQuality > 80) {
      insights.push({
        id: AnalyticsUtils.generateInsightId(),
        userId,
        type: 'strength',
        category: 'Code Quality',
        title: 'Excellent Code Quality',
        description: 'Your code demonstrates high quality standards with good structure and readability.',
        actionableSteps: ['Continue applying these practices', 'Consider mentoring others'],
        confidenceScore: 0.9,
        priority: 'medium',
        isRead: false,
        createdAt: new Date()
      });
    }

    // Generate improvement insights
    if (aiAnalysis.efficiency < 60) {
      insights.push({
        id: AnalyticsUtils.generateInsightId(),
        userId,
        type: 'improvement_area',
        category: 'Performance',
        title: 'Focus on Code Efficiency',
        description: 'Your code could benefit from performance optimizations and more efficient algorithms.',
        actionableSteps: [
          'Review algorithm complexity',
          'Consider using more efficient data structures',
          'Profile your code for bottlenecks'
        ],
        confidenceScore: 0.8,
        priority: 'high',
        isRead: false,
        createdAt: new Date()
      });
    }

    // Generate recommendation insights
    if (skillImprovements.length > 0) {
      const skillNames = skillImprovements.map(imp => imp.skillId).join(', ');
      insights.push({
        id: AnalyticsUtils.generateInsightId(),
        userId,
        type: 'recommendation',
        category: 'Skill Development',
        title: 'Continue Building These Skills',
        description: `You're making great progress in: ${skillNames}`,
        actionableSteps: [
          'Practice more advanced examples',
          'Explore related concepts',
          'Apply these skills in larger projects'
        ],
        confidenceScore: 0.85,
        priority: 'medium',
        isRead: false,
        createdAt: new Date()
      });
    }

    return insights;
  }

  // Helper methods for calculations and analysis

  private static detectLanguage(code: string): string {
    if (code.includes('import React') || code.includes('useState')) return 'JavaScript/React';
    if (code.includes('interface ') || code.includes(': string')) return 'TypeScript';
    if (code.includes('def ') || code.includes('import ')) return 'Python';
    if (code.includes('public class') || code.includes('System.out')) return 'Java';
    return 'JavaScript';
  }

  private static async calculateCodeMetrics(code: string): Promise<CodeMetrics> {
    const lines = code.split('\n').filter(line => line.trim().length > 0);
    const complexity = this.calculateCyclomaticComplexity(code);
    const maintainability = this.calculateMaintainabilityIndex(code, complexity);

    return {
      linesOfCode: lines.length,
      complexity,
      maintainability,
      testCoverage: this.estimateTestCoverage(code),
      performance: this.estimatePerformanceScore(code),
      security: this.estimateSecurityScore(code)
    };
  }

  private static calculateCyclomaticComplexity(code: string): number {
    const complexityKeywords = ['if', 'else', 'while', 'for', 'switch', 'case', 'catch', '&&', '||', '\\?'];
    let complexity = 1; // Base complexity
    
    for (const keyword of complexityKeywords) {
      // Escape special regex characters
      const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const matches = code.match(new RegExp(`\\b${escapedKeyword}\\b`, 'g'));
      if (matches) {
        complexity += matches.length;
      }
    }
    
    return Math.min(complexity, 50); // Cap at 50 for reasonable scoring
  }

  private static calculateMaintainabilityIndex(code: string, complexity: number): number {
    const linesOfCode = code.split('\n').length;
    const halsteadVolume = this.estimateHalsteadVolume(code);
    
    // Simplified maintainability index calculation
    const maintainabilityIndex = Math.max(0, 
      171 - 5.2 * Math.log(halsteadVolume) - 0.23 * complexity - 16.2 * Math.log(linesOfCode)
    );
    
    return Math.min(100, maintainabilityIndex);
  }

  private static estimateHalsteadVolume(code: string): number {
    const operators = code.match(/[+\-*/=<>!&|(){}[\];,.:]/g) || [];
    const operands = code.match(/\b[a-zA-Z_][a-zA-Z0-9_]*\b/g) || [];
    
    const uniqueOperators = new Set(operators).size;
    const uniqueOperands = new Set(operands).size;
    const totalOperators = operators.length;
    const totalOperands = operands.length;
    
    const vocabulary = uniqueOperators + uniqueOperands;
    const length = totalOperators + totalOperands;
    
    return length * Math.log2(vocabulary || 1);
  }

  private static estimateTestCoverage(code: string): number {
    const hasTests = code.includes('test(') || code.includes('it(') || code.includes('describe(');
    const hasAssertions = code.includes('expect(') || code.includes('assert');
    
    if (hasTests && hasAssertions) return 80;
    if (hasTests || hasAssertions) return 40;
    return 0;
  }

  private static estimatePerformanceScore(code: string): number {
    let score = 70; // Base score
    
    // Positive indicators
    if (code.includes('useMemo') || code.includes('useCallback')) score += 10;
    if (code.includes('async') && code.includes('await')) score += 5;
    
    // Negative indicators
    if (code.includes('for') && code.includes('for')) score -= 10; // Nested loops
    if (code.includes('document.getElementById')) score -= 5; // DOM queries in loops
    
    return Math.max(0, Math.min(100, score));
  }

  private static estimateSecurityScore(code: string): number {
    let score = 70; // Base score
    
    // Positive indicators
    if (code.includes('sanitize') || code.includes('validate')) score += 15;
    if (code.includes('try') && code.includes('catch')) score += 10;
    
    // Negative indicators
    if (code.includes('eval(') || code.includes('innerHTML')) score -= 20;
    if (code.includes('document.write')) score -= 15;
    
    return Math.max(0, Math.min(100, score));
  }

  private static extractMetricFromResponse(response: string, metric: string): number {
    // Simple pattern matching to extract numeric scores from AI response
    const patterns = [
      new RegExp(`${metric}[:\\s]*(\\d+)`, 'i'),
      new RegExp(`(\\d+)[\\s]*${metric}`, 'i'),
      new RegExp(`${metric}[^\\d]*(\\d+)`, 'i')
    ];
    
    for (const pattern of patterns) {
      const match = response.match(pattern);
      if (match) {
        return Math.min(100, Math.max(0, parseInt(match[1])));
      }
    }
    
    return 70; // Default score
  }

  private static extractSuggestions(response: string): string[] {
    const suggestions: string[] = [];
    const lines = response.split('\n');
    
    for (const line of lines) {
      if (line.includes('suggest') || line.includes('recommend') || line.includes('consider')) {
        suggestions.push(line.trim());
      }
    }
    
    return suggestions.slice(0, 5); // Limit to 5 suggestions
  }

  private static extractImprovementAreas(response: string): string[] {
    const areas: string[] = [];
    const lines = response.split('\n');
    
    for (const line of lines) {
      if (line.includes('improve') || line.includes('better') || line.includes('enhance')) {
        areas.push(line.trim());
      }
    }
    
    return areas.slice(0, 3); // Limit to 3 areas
  }

  private static extractSkillsFromResponse(response: string): string[] {
    const skills: string[] = [];
    
    for (const [category, categorySkills] of Object.entries(this.SKILL_CATEGORIES)) {
      if (response.toLowerCase().includes(category.toLowerCase())) {
        skills.push(category);
      }
      
      for (const skill of categorySkills) {
        if (response.toLowerCase().includes(skill.toLowerCase())) {
          skills.push(skill);
        }
      }
    }
    
    return [...new Set(skills)]; // Remove duplicates
  }

  private static calculateExperienceGain(aiAnalysis: AIAnalysisResult, skillId: string): number {
    const baseGain = 10;
    const qualityMultiplier = aiAnalysis.codeQuality / 100;
    const skillRelevance = aiAnalysis.detectedSkills.includes(skillId) ? 1.5 : 1.0;
    
    return Math.round(baseGain * qualityMultiplier * skillRelevance);
  }

  private static calculateLevelFromExperience(experience: number): number {
    if (experience >= this.EXPERIENCE_THRESHOLDS.expert) return 4;
    if (experience >= this.EXPERIENCE_THRESHOLDS.advanced) return 3;
    if (experience >= this.EXPERIENCE_THRESHOLDS.intermediate) return 2;
    return 1;
  }

  private static calculateExperienceFromImprovement(improvement: SkillImprovement): number {
    return improvement.improvementType === 'level_up' ? 50 : 10;
  }

  private static calculateExperienceFromLevel(level: number): number {
    const thresholds = Object.values(this.EXPERIENCE_THRESHOLDS);
    return thresholds[level - 1] || 0;
  }

  private static calculateTrendDirection(progressHistory: ProgressPoint[]): 'improving' | 'stable' | 'declining' {
    if (progressHistory.length < 2) return 'stable';
    
    const recent = progressHistory.slice(-3);
    const isImproving = recent.every((point, index) => 
      index === 0 || point.level >= recent[index - 1].level
    );
    
    if (isImproving && recent[recent.length - 1].level > recent[0].level) return 'improving';
    if (recent[recent.length - 1].level < recent[0].level) return 'declining';
    return 'stable';
  }

  private static calculateLearningVelocity(userProgress: UserProgress): number {
    const totalSkills = userProgress.skillLevels.size;
    const totalLevels = Array.from(userProgress.skillLevels.values())
      .reduce((sum, skill) => sum + skill.currentLevel, 0);
    
    const daysSinceCreation = Math.max(1, 
      (Date.now() - userProgress.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    return totalLevels / daysSinceCreation;
  }

  private static calculateCodeQualityTrend(analyticsData: AnalyticsData, userProgress: UserProgress): TrendData {
    // This would typically analyze historical data, but for now we'll use current analysis
    const currentQuality = analyticsData.aiAnalysis.codeQuality;
    
    return {
      direction: currentQuality > 70 ? 'improving' : currentQuality < 50 ? 'declining' : 'stable',
      changePercentage: 0, // Would be calculated from historical data
      timeframe: '30d',
      dataPoints: 1
    };
  }

  /**
   * Detects skills from code when AI analysis is unavailable
   */
  private static detectSkillsFromCode(code: string): string[] {
    const detectedSkills: string[] = [];
    
    // Basic pattern matching for skill detection
    if (code.includes('React') || code.includes('useState') || code.includes('useEffect')) {
      detectedSkills.push('React');
    }
    if (code.includes('async') || code.includes('await') || code.includes('Promise')) {
      detectedSkills.push('Asynchronous Programming');
    }
    if (code.includes('interface ') || code.includes(': string') || code.includes(': number')) {
      detectedSkills.push('TypeScript');
    }
    if (code.includes('test(') || code.includes('it(') || code.includes('describe(')) {
      detectedSkills.push('Testing');
    }
    if (code.includes('try') && code.includes('catch')) {
      detectedSkills.push('Error Handling');
    }
    
    return detectedSkills;
  }
}