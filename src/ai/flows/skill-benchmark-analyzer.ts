'use server';

/**
 * @fileOverview AI flow for analyzing user skills against industry benchmarks
 *
 * This flow provides comprehensive skill analysis that:
 * - Compares user skills against industry standards and peer benchmarks
 * - Identifies market readiness and competitive positioning
 * - Provides career guidance and job opportunity suggestions
 * - Analyzes skill gaps for specific roles or career paths
 * - Generates actionable insights for professional development
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { PersonalizationDataService } from '@/lib/firebase/personalization';
import { UserProgressService } from '@/lib/firebase/analytics';
import { BenchmarkService } from '@/lib/benchmark/benchmark-service';
import type { 
  LearningStyle, 
  PersonalizedRecommendation 
} from '@/types/personalization';
import type { 
  UserProgress,
  SkillLevel,
  BenchmarkComparison 
} from '@/types/analytics';

const SkillBenchmarkAnalyzerInputSchema = z.object({
  userId: z.string().describe('The user ID for skill benchmark analysis.'),
  analysisType: z.enum(['comprehensive', 'role_specific', 'career_path', 'market_readiness']).optional().default('comprehensive').describe('Type of benchmark analysis to perform.'),
  targetRole: z.string().optional().describe('Specific job role to analyze against (e.g., "Senior Frontend Developer").'),
  targetCompany: z.string().optional().describe('Specific company or company type to benchmark against.'),
  careerPath: z.string().optional().describe('Career path to analyze (e.g., "Full Stack Developer", "DevOps Engineer").'),
  experienceLevel: z.enum(['entry', 'mid', 'senior', 'lead', 'principal']).optional().describe('Target experience level for comparison.'),
  includeMarketTrends: z.boolean().optional().default(true).describe('Whether to include current market trends in analysis.'),
  includeSalaryInsights: z.boolean().optional().default(false).describe('Whether to include salary and compensation insights.'),
  focusAreas: z.array(z.string()).optional().describe('Specific skill areas to focus the analysis on.'),
  geographicRegion: z.string().optional().default('global').describe('Geographic region for market analysis.'),
});
export type SkillBenchmarkAnalyzerInput = z.infer<typeof SkillBenchmarkAnalyzerInputSchema>;

const SkillBenchmarkAnalyzerOutputSchema = z.object({
  benchmarkAnalysis: z.object({
    analysisId: z.string().describe('Unique identifier for this analysis.'),
    analysisType: z.string().describe('Type of analysis performed.'),
    analysisDate: z.string().describe('When the analysis was performed.'),
    overallScore: z.number().min(0).max(100).describe('Overall skill score compared to benchmarks.'),
    marketReadiness: z.enum(['not_ready', 'entry_level', 'competitive', 'highly_competitive', 'expert_level']).describe('Market readiness assessment.'),
    competitivePosition: z.string().describe('Description of competitive positioning.'),
  }),
  skillComparisons: z.array(z.object({
    skillName: z.string().describe('Name of the skill.'),
    userLevel: z.number().describe('User\'s current level in this skill.'),
    industryAverage: z.number().describe('Industry average for this skill.'),
    peerAverage: z.number().describe('Peer group average.'),
    targetRoleRequirement: z.number().optional().describe('Required level for target role.'),
    percentile: z.number().describe('User\'s percentile ranking.'),
    gap: z.number().describe('Gap from target level (negative means exceeds target).'),
    priority: z.enum(['critical', 'high', 'medium', 'low']).describe('Priority for improvement.'),
    marketDemand: z.enum(['very_high', 'high', 'medium', 'low']).describe('Market demand for this skill.'),
    trendDirection: z.enum(['growing', 'stable', 'declining']).describe('Market trend for this skill.'),
  })).describe('Detailed comparison for each skill.'),
  careerInsights: z.object({
    readyRoles: z.array(z.object({
      title: z.string().describe('Job title.'),
      matchPercentage: z.number().describe('How well user matches this role.'),
      missingSkills: z.array(z.string()).describe('Skills needed for this role.'),
      salaryRange: z.string().optional().describe('Typical salary range.'),
    })).describe('Roles the user is ready for now.'),
    stretchRoles: z.array(z.object({
      title: z.string().describe('Job title.'),
      timeToReadiness: z.string().describe('Estimated time to become ready.'),
      keySkillGaps: z.array(z.string()).describe('Most important skills to develop.'),
      developmentPath: z.string().describe('Recommended development approach.'),
    })).describe('Roles the user could target with additional development.'),
    careerProgression: z.array(z.object({
      stage: z.string().describe('Career stage.'),
      timeframe: z.string().describe('Estimated timeframe.'),
      requiredSkills: z.array(z.string()).describe('Skills needed for this stage.'),
      milestones: z.array(z.string()).describe('Key milestones to achieve.'),
    })).describe('Suggested career progression path.'),
  }),
  marketAnalysis: z.object({
    industryTrends: z.array(z.object({
      trend: z.string().describe('Market trend description.'),
      impact: z.enum(['positive', 'neutral', 'negative']).describe('Impact on user\'s profile.'),
      recommendation: z.string().describe('How to respond to this trend.'),
    })).describe('Relevant industry trends.'),
    emergingSkills: z.array(z.object({
      skill: z.string().describe('Emerging skill name.'),
      growthRate: z.string().describe('How fast this skill is growing in demand.'),
      relevance: z.string().describe('Why this skill is relevant to the user.'),
      learningPriority: z.enum(['immediate', 'short_term', 'medium_term', 'long_term']).describe('When to start learning this skill.'),
    })).describe('Emerging skills to consider.'),
    competitiveAdvantages: z.array(z.string()).describe('User\'s current competitive advantages.'),
    marketOpportunities: z.array(z.string()).describe('Market opportunities aligned with user\'s skills.'),
  }),
  actionableRecommendations: z.array(z.object({
    category: z.enum(['skill_development', 'career_move', 'networking', 'certification', 'project_experience']).describe('Type of recommendation.'),
    title: z.string().describe('Recommendation title.'),
    description: z.string().describe('Detailed recommendation.'),
    priority: z.enum(['immediate', 'high', 'medium', 'low']).describe('Priority level.'),
    timeframe: z.string().describe('Suggested timeframe for action.'),
    expectedImpact: z.string().describe('Expected impact on career/skills.'),
    resources: z.array(z.string()).optional().describe('Suggested resources or next steps.'),
  })).describe('Specific actionable recommendations.'),
});
export type SkillBenchmarkAnalyzerOutput = z.infer<typeof SkillBenchmarkAnalyzerOutputSchema>;

export const skillBenchmarkAnalyzer = ai.defineFlow(
  {
    name: 'skillBenchmarkAnalyzer',
    inputSchema: SkillBenchmarkAnalyzerInputSchema,
    outputSchema: SkillBenchmarkAnalyzerOutputSchema,
  },
  async (input): Promise<SkillBenchmarkAnalyzerOutput> => {
    try {
      // Get user data for benchmark analysis
      const [userProgress, learningStyle, benchmarkData] = await Promise.all([
        UserProgressService.getUserProgress(input.userId),
        PersonalizationDataService.getLearningStyle(input.userId),
        BenchmarkService.getUserBenchmarkData(input.userId)
      ]);

      if (!userProgress) {
        throw new Error(`User progress not found for user ${input.userId}`);
      }

      // Analyze user skills against benchmarks
      const skillComparisons = await analyzeSkillBenchmarks(
        userProgress,
        input.targetRole,
        input.experienceLevel,
        input.focusAreas
      );

      // Generate comprehensive analysis using AI
      const analysisPrompt = buildBenchmarkAnalysisPrompt(
        input,
        userProgress,
        skillComparisons,
        benchmarkData
      );

      const aiResponse = await ai.generate({
        model: 'gemini-2.0-flash-exp',
        prompt: analysisPrompt,
        config: {
          temperature: 0.6,
          maxOutputTokens: 3500,
        },
      });

      // Parse AI response and create structured analysis
      const analysisData = parseBenchmarkAnalysis(aiResponse.text, input, skillComparisons);

      // Generate market analysis and trends
      const marketAnalysis = await generateMarketAnalysis(
        userProgress,
        skillComparisons,
        input.geographicRegion || 'global'
      );

      // Create actionable recommendations
      const recommendations = generateActionableRecommendations(
        skillComparisons,
        analysisData.careerInsights,
        marketAnalysis,
        learningStyle
      );

      // Save analysis results
      await saveBenchmarkAnalysis(input.userId, analysisData, skillComparisons, recommendations);

      return {
        benchmarkAnalysis: analysisData.benchmarkAnalysis,
        skillComparisons,
        careerInsights: analysisData.careerInsights,
        marketAnalysis,
        actionableRecommendations: recommendations
      };

    } catch (error) {
      console.error('Error analyzing skill benchmarks:', error);
      throw new Error(`Failed to analyze skill benchmarks: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
);

// Helper functions

async function analyzeSkillBenchmarks(
  userProgress: UserProgress,
  targetRole?: string,
  experienceLevel?: string,
  focusAreas?: string[]
): Promise<any[]> {
  const skillLevels = Array.from(userProgress.skillLevels.values());
  const comparisons = [];

  for (const skill of skillLevels) {
    // Get benchmark data for this skill
    const benchmarkData = await getBenchmarkDataForSkill(skill.skillName, targetRole, experienceLevel);
    
    const comparison = {
      skillName: skill.skillName,
      userLevel: skill.currentLevel,
      industryAverage: benchmarkData.industryAverage,
      peerAverage: benchmarkData.peerAverage,
      targetRoleRequirement: benchmarkData.targetRoleRequirement,
      percentile: calculatePercentile(skill.currentLevel, benchmarkData),
      gap: benchmarkData.targetRoleRequirement ? 
        skill.currentLevel - benchmarkData.targetRoleRequirement : 0,
      priority: determinePriority(skill, benchmarkData, focusAreas),
      marketDemand: benchmarkData.marketDemand,
      trendDirection: benchmarkData.trendDirection
    };

    comparisons.push(comparison);
  }

  return comparisons.sort((a, b) => {
    const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });
}

async function getBenchmarkDataForSkill(
  skillName: string,
  targetRole?: string,
  experienceLevel?: string
): Promise<any> {
  // This would typically fetch from a comprehensive benchmark database
  // For now, return mock data based on common industry standards
  const mockBenchmarks: Record<string, any> = {
    'JavaScript': {
      industryAverage: 2.8,
      peerAverage: 2.5,
      targetRoleRequirement: targetRole?.includes('Senior') ? 4 : 3,
      marketDemand: 'very_high',
      trendDirection: 'stable'
    },
    'React': {
      industryAverage: 2.6,
      peerAverage: 2.3,
      targetRoleRequirement: targetRole?.includes('Frontend') ? 3.5 : 2.5,
      marketDemand: 'very_high',
      trendDirection: 'growing'
    },
    'Node.js': {
      industryAverage: 2.4,
      peerAverage: 2.1,
      targetRoleRequirement: targetRole?.includes('Backend') ? 3.5 : 2,
      marketDemand: 'high',
      trendDirection: 'stable'
    },
    'TypeScript': {
      industryAverage: 2.2,
      peerAverage: 1.9,
      targetRoleRequirement: 2.5,
      marketDemand: 'very_high',
      trendDirection: 'growing'
    },
    'Testing': {
      industryAverage: 2.0,
      peerAverage: 1.7,
      targetRoleRequirement: experienceLevel === 'senior' ? 3.5 : 2.5,
      marketDemand: 'high',
      trendDirection: 'growing'
    }
  };

  return mockBenchmarks[skillName] || {
    industryAverage: 2.0,
    peerAverage: 1.8,
    targetRoleRequirement: 2.5,
    marketDemand: 'medium',
    trendDirection: 'stable'
  };
}

function calculatePercentile(userLevel: number, benchmarkData: any): number {
  // Simplified percentile calculation
  const industryAvg = benchmarkData.industryAverage;
  const standardDeviation = 0.8; // Assumed standard deviation
  
  // Calculate z-score and convert to percentile
  const zScore = (userLevel - industryAvg) / standardDeviation;
  const percentile = Math.round(50 + (zScore * 15)); // Rough conversion
  
  return Math.max(1, Math.min(99, percentile));
}

function determinePriority(
  skill: SkillLevel,
  benchmarkData: any,
  focusAreas?: string[]
): 'critical' | 'high' | 'medium' | 'low' {
  // High priority if in focus areas
  if (focusAreas?.includes(skill.skillName)) {
    return 'critical';
  }

  // Critical if significantly below target role requirement
  if (benchmarkData.targetRoleRequirement && 
      skill.currentLevel < benchmarkData.targetRoleRequirement - 1) {
    return 'critical';
  }

  // High priority if below industry average and high market demand
  if (skill.currentLevel < benchmarkData.industryAverage && 
      benchmarkData.marketDemand === 'very_high') {
    return 'high';
  }

  // Medium priority if below peer average
  if (skill.currentLevel < benchmarkData.peerAverage) {
    return 'medium';
  }

  return 'low';
}

function buildBenchmarkAnalysisPrompt(
  input: SkillBenchmarkAnalyzerInput,
  userProgress: UserProgress,
  skillComparisons: any[],
  benchmarkData: any
): string {
  const skillSummary = skillComparisons
    .map(s => `${s.skillName}: Level ${s.userLevel} (${s.percentile}th percentile)`)
    .join(', ');

  const criticalGaps = skillComparisons
    .filter(s => s.priority === 'critical')
    .map(s => s.skillName)
    .join(', ');

  const strengths = skillComparisons
    .filter(s => s.percentile > 75)
    .map(s => s.skillName)
    .join(', ');

  return `Analyze the following developer's skill profile against industry benchmarks:

User Profile:
- Skills: ${skillSummary}
- Learning Velocity: ${userProgress.learningVelocity.toFixed(2)}
- Code Quality Trend: ${userProgress.codeQualityTrend.direction}
- Analysis Type: ${input.analysisType}
- Target Role: ${input.targetRole || 'General development roles'}
- Experience Level: ${input.experienceLevel || 'Not specified'}

Critical Skill Gaps: ${criticalGaps || 'None identified'}
Key Strengths: ${strengths || 'Building foundational skills'}

Requirements:
1. Assess overall market readiness and competitive position
2. Identify roles the user is ready for now
3. Suggest stretch roles with development paths
4. Provide career progression recommendations
5. Consider current market trends and demands
6. Focus on actionable insights and specific next steps

The analysis should be realistic, encouraging, and provide clear direction for professional development.`;
}

function parseBenchmarkAnalysis(aiText: string, input: SkillBenchmarkAnalyzerInput, skillComparisons: any[]): any {
  // Simplified parsing - in reality, you'd use more sophisticated NLP
  const analysisId = `analysis_${input.userId}_${Date.now()}`;
  
  // Calculate overall score based on skill comparisons
  const overallScore = Math.round(
    skillComparisons.reduce((sum, skill) => sum + skill.percentile, 0) / skillComparisons.length
  );

  // Determine market readiness
  const marketReadiness = determineMarketReadiness(overallScore, skillComparisons);

  return {
    benchmarkAnalysis: {
      analysisId,
      analysisType: input.analysisType || 'comprehensive',
      analysisDate: new Date().toISOString(),
      overallScore,
      marketReadiness,
      competitivePosition: generateCompetitivePosition(overallScore, skillComparisons)
    },
    careerInsights: generateCareerInsights(skillComparisons, input.targetRole, input.experienceLevel)
  };
}

function determineMarketReadiness(
  overallScore: number,
  skillComparisons: any[]
): 'not_ready' | 'entry_level' | 'competitive' | 'highly_competitive' | 'expert_level' {
  const criticalGaps = skillComparisons.filter(s => s.priority === 'critical').length;
  
  if (criticalGaps > 2) return 'not_ready';
  if (overallScore < 40) return 'entry_level';
  if (overallScore < 60) return 'competitive';
  if (overallScore < 80) return 'highly_competitive';
  return 'expert_level';
}

function generateCompetitivePosition(overallScore: number, skillComparisons: any[]): string {
  const strengths = skillComparisons.filter(s => s.percentile > 75).length;
  const weaknesses = skillComparisons.filter(s => s.percentile < 25).length;

  if (strengths > weaknesses) {
    return `Strong competitive position with ${strengths} standout skills. Well-positioned for ${overallScore > 70 ? 'senior' : 'mid-level'} roles.`;
  } else if (weaknesses > strengths) {
    return `Developing competitive position with ${weaknesses} areas needing improvement. Focus on skill development for better market positioning.`;
  } else {
    return `Balanced skill profile with solid foundation. Good positioning for current level with clear growth opportunities.`;
  }
}

function generateCareerInsights(
  skillComparisons: any[],
  targetRole?: string,
  experienceLevel?: string
): any {
  const strongSkills = skillComparisons.filter(s => s.percentile > 60).map(s => s.skillName);
  const developingSkills = skillComparisons.filter(s => s.percentile < 40).map(s => s.skillName);

  const readyRoles = [
    {
      title: 'Frontend Developer',
      matchPercentage: strongSkills.includes('React') || strongSkills.includes('JavaScript') ? 85 : 65,
      missingSkills: developingSkills.filter(s => ['React', 'JavaScript', 'CSS'].includes(s)),
      salaryRange: '$60,000 - $90,000'
    },
    {
      title: 'Full Stack Developer',
      matchPercentage: strongSkills.length >= 3 ? 75 : 55,
      missingSkills: developingSkills.filter(s => ['Node.js', 'Database', 'API'].includes(s)),
      salaryRange: '$70,000 - $110,000'
    }
  ].filter(role => role.matchPercentage >= 60);

  const stretchRoles = [
    {
      title: 'Senior Frontend Developer',
      timeToReadiness: '6-12 months',
      keySkillGaps: ['Advanced React', 'Performance Optimization', 'Team Leadership'],
      developmentPath: 'Focus on advanced concepts, lead projects, mentor others'
    },
    {
      title: 'Technical Lead',
      timeToReadiness: '1-2 years',
      keySkillGaps: ['Architecture Design', 'Team Management', 'Strategic Planning'],
      developmentPath: 'Develop leadership skills, gain architecture experience, build business acumen'
    }
  ];

  const careerProgression = [
    {
      stage: 'Current Level Mastery',
      timeframe: '3-6 months',
      requiredSkills: developingSkills.slice(0, 2),
      milestones: ['Complete skill gaps', 'Build portfolio projects', 'Gain practical experience']
    },
    {
      stage: 'Mid-Level Advancement',
      timeframe: '6-18 months',
      requiredSkills: ['Advanced Technical Skills', 'Problem Solving', 'Code Review'],
      milestones: ['Lead small projects', 'Mentor junior developers', 'Contribute to architecture decisions']
    },
    {
      stage: 'Senior Level Transition',
      timeframe: '1-3 years',
      requiredSkills: ['System Design', 'Leadership', 'Strategic Thinking'],
      milestones: ['Design complex systems', 'Lead teams', 'Drive technical decisions']
    }
  ];

  return {
    readyRoles,
    stretchRoles,
    careerProgression
  };
}

async function generateMarketAnalysis(
  userProgress: UserProgress,
  skillComparisons: any[],
  region: string
): Promise<any> {
  // Mock market analysis - in reality, this would use real market data
  const industryTrends = [
    {
      trend: 'Increased demand for TypeScript skills',
      impact: skillComparisons.find(s => s.skillName === 'TypeScript')?.userLevel > 2 ? 'positive' : 'neutral',
      recommendation: 'Consider investing time in TypeScript to stay competitive'
    },
    {
      trend: 'Growing emphasis on testing and quality assurance',
      impact: skillComparisons.find(s => s.skillName === 'Testing')?.userLevel > 2 ? 'positive' : 'negative',
      recommendation: 'Strengthen testing skills to meet market expectations'
    },
    {
      trend: 'Remote work increasing demand for collaboration skills',
      impact: 'positive',
      recommendation: 'Develop remote collaboration and communication skills'
    }
  ];

  const emergingSkills = [
    {
      skill: 'AI/ML Integration',
      growthRate: '300% year-over-year',
      relevance: 'Increasingly important for all developers to understand AI tools',
      learningPriority: 'medium_term'
    },
    {
      skill: 'Cloud Architecture',
      growthRate: '150% year-over-year',
      relevance: 'Essential for scalable application development',
      learningPriority: 'short_term'
    },
    {
      skill: 'DevOps Practices',
      growthRate: '120% year-over-year',
      relevance: 'Critical for modern development workflows',
      learningPriority: 'short_term'
    }
  ];

  const competitiveAdvantages = skillComparisons
    .filter(s => s.percentile > 80)
    .map(s => `Strong ${s.skillName} skills (${s.percentile}th percentile)`);

  const marketOpportunities = [
    'High demand for full-stack developers in fintech',
    'Growing opportunities in e-commerce and digital transformation',
    'Increasing need for developers with strong testing skills',
    'Remote-first companies expanding globally'
  ];

  return {
    industryTrends,
    emergingSkills,
    competitiveAdvantages,
    marketOpportunities
  };
}

function generateActionableRecommendations(
  skillComparisons: any[],
  careerInsights: any,
  marketAnalysis: any,
  learningStyle: LearningStyle | null
): any[] {
  const recommendations = [];

  // Skill development recommendations
  const criticalSkills = skillComparisons.filter(s => s.priority === 'critical');
  if (criticalSkills.length > 0) {
    recommendations.push({
      category: 'skill_development',
      title: `Address Critical Skill Gaps`,
      description: `Focus on developing ${criticalSkills.map(s => s.skillName).join(', ')} to meet market requirements`,
      priority: 'immediate',
      timeframe: '1-3 months',
      expectedImpact: 'Significantly improve job market competitiveness',
      resources: ['Online courses', 'Practice projects', 'Mentorship']
    });
  }

  // Career move recommendations
  if (careerInsights.readyRoles.length > 0) {
    const topRole = careerInsights.readyRoles[0];
    recommendations.push({
      category: 'career_move',
      title: `Consider Applying for ${topRole.title} Roles`,
      description: `You have ${topRole.matchPercentage}% match for ${topRole.title} positions`,
      priority: 'high',
      timeframe: '1-2 months',
      expectedImpact: 'Advance career to next level',
      resources: ['Job boards', 'Networking events', 'Portfolio optimization']
    });
  }

  // Emerging skill recommendations
  const highPriorityEmergingSkills = marketAnalysis.emergingSkills.filter(
    (s: any) => s.learningPriority === 'short_term'
  );
  if (highPriorityEmergingSkills.length > 0) {
    recommendations.push({
      category: 'skill_development',
      title: 'Learn Emerging High-Demand Skills',
      description: `Consider learning ${highPriorityEmergingSkills.map((s: any) => s.skill).join(', ')} to stay ahead of market trends`,
      priority: 'medium',
      timeframe: '3-6 months',
      expectedImpact: 'Position yourself for future opportunities',
      resources: ['Industry courses', 'Certification programs', 'Hands-on projects']
    });
  }

  // Certification recommendations
  const strongSkills = skillComparisons.filter(s => s.percentile > 70);
  if (strongSkills.length > 0) {
    recommendations.push({
      category: 'certification',
      title: 'Get Certified in Your Strong Skills',
      description: `Consider certifications in ${strongSkills[0].skillName} to validate your expertise`,
      priority: 'medium',
      timeframe: '2-4 months',
      expectedImpact: 'Increase credibility and market value',
      resources: ['Official certification programs', 'Practice exams', 'Study groups']
    });
  }

  return recommendations;
}

async function saveBenchmarkAnalysis(
  userId: string,
  analysisData: any,
  skillComparisons: any[],
  recommendations: any[]
): Promise<void> {
  try {
    // Save the benchmark analysis as a personalized recommendation
    const analysisRecommendation: PersonalizedRecommendation = {
      recommendationId: `benchmark_analysis_${userId}_${Date.now()}`,
      userId,
      type: 'skill_focus',
      title: 'Skill Benchmark Analysis Results',
      description: `Comprehensive analysis of your skills against industry benchmarks. Overall score: ${analysisData.benchmarkAnalysis.overallScore}/100`,
      reasoning: 'Based on current market data and industry standards',
      priority: 'high',
      category: 'Career Development',
      targetSkills: skillComparisons.map(s => s.skillName),
      estimatedTimeInvestment: 60,
      difficultyLevel: 'intermediate',
      personalizedContent: {
        contentType: 'analysis',
        content: JSON.stringify(analysisData),
        metadata: {
          overallScore: analysisData.benchmarkAnalysis.overallScore,
          marketReadiness: analysisData.benchmarkAnalysis.marketReadiness,
          skillCount: skillComparisons.length
        },
        adaptations: []
      },
      createdAt: new Date()
    };

    await PersonalizationDataService.savePersonalizedRecommendation(analysisRecommendation);

    // Save individual recommendations
    for (const rec of recommendations) {
      const recommendation: PersonalizedRecommendation = {
        recommendationId: `benchmark_rec_${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        type: rec.category === 'skill_development' ? 'skill_focus' : 'resource',
        title: rec.title,
        description: rec.description,
        reasoning: `Based on benchmark analysis: ${rec.expectedImpact}`,
        priority: rec.priority === 'immediate' ? 'high' : rec.priority,
        category: 'Benchmark Recommendation',
        targetSkills: [],
        estimatedTimeInvestment: 120,
        difficultyLevel: 'intermediate',
        personalizedContent: {
          contentType: 'recommendation',
          content: rec.description,
          metadata: { 
            category: rec.category,
            timeframe: rec.timeframe,
            expectedImpact: rec.expectedImpact
          },
          adaptations: []
        },
        createdAt: new Date()
      };

      await PersonalizationDataService.savePersonalizedRecommendation(recommendation);
    }
  } catch (error) {
    console.error('Error saving benchmark analysis:', error);
    // Don't throw error as this is not critical for the main flow
  }
}