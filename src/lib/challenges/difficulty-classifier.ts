// Challenge Difficulty Classification System

import { SkillLevel } from '@/types/analytics';

export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export interface DifficultyMetrics {
  conceptComplexity: number; // 1-10 scale
  codeLength: number; // Expected lines of code
  algorithmicComplexity: number; // 1-10 scale
  prerequisiteCount: number; // Number of required skills
  timeComplexity: string; // Big O notation
  domainSpecificity: number; // 1-10 scale (1 = general, 10 = highly specialized)
}

export interface DifficultyClassification {
  level: DifficultyLevel;
  score: number; // 0-100
  reasoning: string[];
  recommendedSkillLevel: number;
  estimatedDuration: number; // in minutes
}

export class ChallengeDifficultyClassifier {
  private static readonly DIFFICULTY_THRESHOLDS = {
    beginner: { min: 0, max: 25 },
    intermediate: { min: 25, max: 50 },
    advanced: { min: 50, max: 75 },
    expert: { min: 75, max: 100 }
  };

  private static readonly COMPLEXITY_WEIGHTS = {
    conceptComplexity: 0.25,
    codeLength: 0.15,
    algorithmicComplexity: 0.30,
    prerequisiteCount: 0.15,
    timeComplexity: 0.10,
    domainSpecificity: 0.05
  };

  /**
   * Classifies challenge difficulty based on various metrics
   */
  static classifyDifficulty(metrics: DifficultyMetrics): DifficultyClassification {
    const score = this.calculateDifficultyScore(metrics);
    const level = this.scoreToDifficultyLevel(score);
    const reasoning = this.generateReasoning(metrics, score);
    const recommendedSkillLevel = this.scoreToSkillLevel(score);
    const estimatedDuration = this.estimateDuration(metrics, level);

    return {
      level,
      score,
      reasoning,
      recommendedSkillLevel,
      estimatedDuration
    };
  }

  /**
   * Determines if a user is ready for a challenge based on their skill levels
   */
  static isUserReadyForChallenge(
    userSkills: Map<string, SkillLevel>,
    challengeSkills: string[],
    challengeDifficulty: DifficultyLevel
  ): { ready: boolean; missingSkills: string[]; recommendations: string[] } {
    const missingSkills: string[] = [];
    const recommendations: string[] = [];
    
    const requiredLevel = this.difficultyToMinimumSkillLevel(challengeDifficulty);
    
    for (const skillId of challengeSkills) {
      const userSkill = userSkills.get(skillId);
      
      if (!userSkill) {
        missingSkills.push(skillId);
        recommendations.push(`Learn the basics of ${skillId} before attempting this challenge`);
      } else if (userSkill.currentLevel < requiredLevel) {
        recommendations.push(
          `Improve your ${skillId} skills to level ${requiredLevel} (currently level ${userSkill.currentLevel})`
        );
      }
    }

    const ready = missingSkills.length === 0 && recommendations.length === 0;
    
    if (!ready && recommendations.length === 0) {
      recommendations.push('Complete some easier challenges in the required skill areas first');
    }

    return { ready, missingSkills, recommendations };
  }

  /**
   * Suggests appropriate difficulty level based on user's skill profile
   */
  static suggestDifficultyForUser(
    userSkills: Map<string, SkillLevel>,
    targetSkills: string[]
  ): DifficultyLevel {
    if (userSkills.size === 0) return 'beginner';

    const relevantSkills = targetSkills
      .map(skillId => userSkills.get(skillId))
      .filter(skill => skill !== undefined) as SkillLevel[];

    if (relevantSkills.length === 0) return 'beginner';

    const averageLevel = relevantSkills.reduce((sum, skill) => sum + skill.currentLevel, 0) / relevantSkills.length;
    const maxLevel = Math.max(...relevantSkills.map(skill => skill.currentLevel));

    // Consider both average and maximum skill levels
    const effectiveLevel = (averageLevel * 0.7) + (maxLevel * 0.3);

    if (effectiveLevel < 2) return 'beginner';
    if (effectiveLevel < 4) return 'intermediate';
    if (effectiveLevel < 7) return 'advanced';
    return 'expert';
  }

  /**
   * Adapts challenge difficulty based on user performance history
   */
  static adaptDifficultyBasedOnPerformance(
    currentDifficulty: DifficultyLevel,
    recentScores: number[],
    successRate: number
  ): DifficultyLevel {
    if (recentScores.length < 3) return currentDifficulty;

    const averageScore = recentScores.reduce((sum, score) => sum + score, 0) / recentScores.length;
    
    // High performance indicators
    if (averageScore > 85 && successRate > 0.8) {
      return this.increaseDifficulty(currentDifficulty);
    }
    
    // Low performance indicators
    if (averageScore < 50 && successRate < 0.4) {
      return this.decreaseDifficulty(currentDifficulty);
    }

    return currentDifficulty;
  }

  private static calculateDifficultyScore(metrics: DifficultyMetrics): number {
    let score = 0;

    // Concept complexity (1-10 -> 0-100)
    score += (metrics.conceptComplexity / 10) * 100 * this.COMPLEXITY_WEIGHTS.conceptComplexity;

    // Code length (normalize based on typical ranges)
    const codeLengthScore = Math.min(metrics.codeLength / 200, 1) * 100;
    score += codeLengthScore * this.COMPLEXITY_WEIGHTS.codeLength;

    // Algorithmic complexity (1-10 -> 0-100)
    score += (metrics.algorithmicComplexity / 10) * 100 * this.COMPLEXITY_WEIGHTS.algorithmicComplexity;

    // Prerequisite count (normalize based on typical ranges)
    const prerequisiteScore = Math.min(metrics.prerequisiteCount / 10, 1) * 100;
    score += prerequisiteScore * this.COMPLEXITY_WEIGHTS.prerequisiteCount;

    // Time complexity scoring
    const timeComplexityScore = this.timeComplexityToScore(metrics.timeComplexity);
    score += timeComplexityScore * this.COMPLEXITY_WEIGHTS.timeComplexity;

    // Domain specificity (1-10 -> 0-100)
    score += (metrics.domainSpecificity / 10) * 100 * this.COMPLEXITY_WEIGHTS.domainSpecificity;

    return Math.min(Math.max(score, 0), 100);
  }

  private static timeComplexityToScore(timeComplexity: string): number {
    const complexityMap: { [key: string]: number } = {
      'O(1)': 10,
      'O(log n)': 20,
      'O(n)': 40,
      'O(n log n)': 60,
      'O(n²)': 80,
      'O(n³)': 90,
      'O(2^n)': 100,
      'O(n!)': 100
    };

    return complexityMap[timeComplexity] || 50;
  }

  private static scoreToDifficultyLevel(score: number): DifficultyLevel {
    if (score <= this.DIFFICULTY_THRESHOLDS.beginner.max) return 'beginner';
    if (score <= this.DIFFICULTY_THRESHOLDS.intermediate.max) return 'intermediate';
    if (score <= this.DIFFICULTY_THRESHOLDS.advanced.max) return 'advanced';
    return 'expert';
  }

  private static scoreToSkillLevel(score: number): number {
    // Map 0-100 score to 1-10 skill level
    return Math.ceil((score / 100) * 10);
  }

  private static difficultyToMinimumSkillLevel(difficulty: DifficultyLevel): number {
    const levelMap: { [key in DifficultyLevel]: number } = {
      beginner: 1,
      intermediate: 3,
      advanced: 6,
      expert: 8
    };
    return levelMap[difficulty];
  }

  private static estimateDuration(metrics: DifficultyMetrics, level: DifficultyLevel): number {
    const baseDuration = {
      beginner: 15,
      intermediate: 30,
      advanced: 60,
      expert: 120
    }[level];

    // Adjust based on code length and complexity
    const complexityMultiplier = 1 + (metrics.conceptComplexity / 20);
    const lengthMultiplier = 1 + (metrics.codeLength / 400);

    return Math.round(baseDuration * complexityMultiplier * lengthMultiplier);
  }

  private static generateReasoning(metrics: DifficultyMetrics, score: number): string[] {
    const reasoning: string[] = [];

    if (metrics.conceptComplexity >= 7) {
      reasoning.push('High conceptual complexity requiring advanced understanding');
    }

    if (metrics.algorithmicComplexity >= 7) {
      reasoning.push('Complex algorithms and data structures required');
    }

    if (metrics.prerequisiteCount >= 5) {
      reasoning.push('Multiple prerequisite skills needed');
    }

    if (metrics.codeLength > 100) {
      reasoning.push('Substantial implementation required');
    }

    if (metrics.domainSpecificity >= 7) {
      reasoning.push('Specialized domain knowledge required');
    }

    if (reasoning.length === 0) {
      reasoning.push('Straightforward implementation with basic concepts');
    }

    return reasoning;
  }

  private static increaseDifficulty(current: DifficultyLevel): DifficultyLevel {
    const levels: DifficultyLevel[] = ['beginner', 'intermediate', 'advanced', 'expert'];
    const currentIndex = levels.indexOf(current);
    return currentIndex < levels.length - 1 ? levels[currentIndex + 1] : current;
  }

  private static decreaseDifficulty(current: DifficultyLevel): DifficultyLevel {
    const levels: DifficultyLevel[] = ['beginner', 'intermediate', 'advanced', 'expert'];
    const currentIndex = levels.indexOf(current);
    return currentIndex > 0 ? levels[currentIndex - 1] : current;
  }
}