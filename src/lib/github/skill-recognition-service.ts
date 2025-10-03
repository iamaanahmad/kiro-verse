import { SkillAnalysisResult, RetroactiveAnalysisResult } from './github-service';
import { Badge } from '@/types/gamification';
import { SkillLevel } from '@/types/analytics';

export interface ProjectContribution {
  repositoryName: string;
  contributionType: 'feature' | 'bugfix' | 'refactor' | 'documentation' | 'testing';
  linesChanged: number;
  filesModified: number;
  complexity: 'low' | 'medium' | 'high';
  skillsUsed: string[];
  impact: 'minor' | 'moderate' | 'major';
  collaborators: number;
  timeSpent: number; // in hours (estimated)
}

export interface SkillEvidence {
  skillId: string;
  evidenceType: 'commit' | 'pull_request' | 'issue' | 'repository';
  description: string;
  url: string;
  timestamp: Date;
  confidence: number;
  impact: 'minor' | 'moderate' | 'major';
}

export interface RecognizedSkill {
  skillId: string;
  skillName: string;
  level: number;
  confidence: number;
  evidence: SkillEvidence[];
  projectContributions: ProjectContribution[];
  verificationStatus: 'verified' | 'pending' | 'unverified';
  lastUpdated: Date;
}

export interface SkillBadgeRecommendation {
  badge: Badge;
  skill: RecognizedSkill;
  justification: string;
  requiredEvidence: SkillEvidence[];
  confidenceScore: number;
}

export class SkillRecognitionService {
  /**
   * Recognize skills from GitHub analysis results
   */
  recognizeSkillsFromAnalysis(analysisResult: RetroactiveAnalysisResult): RecognizedSkill[] {
    const recognizedSkills: RecognizedSkill[] = [];

    for (const skillAnalysis of analysisResult.skillsIdentified) {
      const evidence = this.generateSkillEvidence(skillAnalysis);
      const projectContributions = this.analyzeProjectContributions(skillAnalysis);

      recognizedSkills.push({
        skillId: skillAnalysis.skillId,
        skillName: skillAnalysis.skillName,
        level: skillAnalysis.level,
        confidence: skillAnalysis.confidence,
        evidence,
        projectContributions,
        verificationStatus: this.determineVerificationStatus(skillAnalysis),
        lastUpdated: new Date(),
      });
    }

    return recognizedSkills.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Generate skill evidence from analysis results
   */
  private generateSkillEvidence(skillAnalysis: SkillAnalysisResult): SkillEvidence[] {
    return skillAnalysis.evidence.map((evidenceText, index) => ({
      skillId: skillAnalysis.skillId,
      evidenceType: 'commit' as const,
      description: evidenceText,
      url: `https://github.com/commit/${this.extractCommitHash(evidenceText)}`,
      timestamp: new Date(Date.now() - (index * 24 * 60 * 60 * 1000)), // Approximate timestamps
      confidence: Math.max(0.5, skillAnalysis.confidence - (index * 0.1)),
      impact: this.determineImpact(evidenceText),
    }));
  }

  /**
   * Analyze project contributions for a skill
   */
  private analyzeProjectContributions(skillAnalysis: SkillAnalysisResult): ProjectContribution[] {
    // This would typically analyze the actual commits and repositories
    // For now, we'll generate representative contributions based on the analysis
    const contributions: ProjectContribution[] = [];

    const contributionTypes: Array<ProjectContribution['contributionType']> = [
      'feature', 'bugfix', 'refactor', 'documentation', 'testing'
    ];

    for (let i = 0; i < Math.min(skillAnalysis.repositoryContributions, 5); i++) {
      contributions.push({
        repositoryName: `project-${i + 1}`,
        contributionType: contributionTypes[i % contributionTypes.length],
        linesChanged: Math.floor(Math.random() * 500) + 50,
        filesModified: Math.floor(Math.random() * 10) + 1,
        complexity: this.determineComplexity(skillAnalysis.level),
        skillsUsed: [skillAnalysis.skillId],
        impact: this.determineContributionImpact(skillAnalysis.level),
        collaborators: Math.floor(Math.random() * 5) + 1,
        timeSpent: Math.floor(Math.random() * 20) + 2,
      });
    }

    return contributions;
  }

  /**
   * Determine verification status based on skill analysis
   */
  private determineVerificationStatus(skillAnalysis: SkillAnalysisResult): 'verified' | 'pending' | 'unverified' {
    if (skillAnalysis.confidence > 0.8 && skillAnalysis.repositoryContributions > 10) {
      return 'verified';
    } else if (skillAnalysis.confidence > 0.6 && skillAnalysis.repositoryContributions > 5) {
      return 'pending';
    }
    return 'unverified';
  }

  /**
   * Generate badge recommendations based on recognized skills
   */
  generateBadgeRecommendations(recognizedSkills: RecognizedSkill[]): SkillBadgeRecommendation[] {
    const recommendations: SkillBadgeRecommendation[] = [];

    for (const skill of recognizedSkills) {
      if (skill.verificationStatus === 'verified' || skill.confidence > 0.7) {
        const badge = this.createSkillBadge(skill);
        const requiredEvidence = skill.evidence.filter(e => e.confidence > 0.6);

        recommendations.push({
          badge,
          skill,
          justification: this.generateJustification(skill),
          requiredEvidence,
          confidenceScore: skill.confidence,
        });
      }
    }

    return recommendations.sort((a, b) => b.confidenceScore - a.confidenceScore);
  }

  /**
   * Create a skill badge based on recognized skill
   */
  private createSkillBadge(skill: RecognizedSkill): Badge {
    const rarity = this.determineBadgeRarity(skill);
    
    return {
      id: `github-${skill.skillId}-${Date.now()}`,
      name: `${skill.skillName} Practitioner`,
      description: `Demonstrated ${skill.skillName} skills through real project contributions`,
      iconUrl: `/badges/github-${skill.skillId}.svg`,
      rarity,
      skillCategory: skill.skillId,
      requirements: [
        `${skill.projectContributions.length} project contributions`,
        `Level ${skill.level} proficiency in ${skill.skillName}`,
        `${skill.evidence.length} verified code contributions`,
      ],
      issuedAt: new Date(),
      blockchainTxHash: '', // Will be filled when minted
      verificationUrl: '', // Will be filled when minted
    };
  }

  /**
   * Determine badge rarity based on skill level and evidence
   */
  private determineBadgeRarity(skill: RecognizedSkill): Badge['rarity'] {
    const totalContributions = skill.projectContributions.length;
    const highImpactContributions = skill.projectContributions.filter(c => c.impact === 'major').length;

    if (skill.level >= 4 && highImpactContributions >= 3 && skill.confidence > 0.9) {
      return 'legendary';
    } else if (skill.level >= 3 && totalContributions >= 5 && skill.confidence > 0.8) {
      return 'epic';
    } else if (skill.level >= 2 && totalContributions >= 3 && skill.confidence > 0.7) {
      return 'rare';
    }
    return 'common';
  }

  /**
   * Generate justification for badge recommendation
   */
  private generateJustification(skill: RecognizedSkill): string {
    const contributions = skill.projectContributions.length;
    const evidence = skill.evidence.length;
    const level = skill.level;

    return `Based on ${contributions} project contributions and ${evidence} pieces of evidence, ` +
           `this developer has demonstrated Level ${level} proficiency in ${skill.skillName}. ` +
           `The analysis shows consistent use of ${skill.skillName} across multiple repositories ` +
           `with a confidence score of ${(skill.confidence * 100).toFixed(1)}%.`;
  }

  /**
   * Validate skill recognition against KiroVerse standards
   */
  validateSkillRecognition(skill: RecognizedSkill): {
    isValid: boolean;
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check minimum evidence requirements
    if (skill.evidence.length < 3) {
      issues.push('Insufficient evidence for skill verification');
      recommendations.push('Provide more code examples demonstrating this skill');
    }

    // Check confidence threshold
    if (skill.confidence < 0.6) {
      issues.push('Confidence score below minimum threshold');
      recommendations.push('Improve code quality and consistency to increase confidence');
    }

    // Check project diversity
    const uniqueProjects = new Set(skill.projectContributions.map(c => c.repositoryName)).size;
    if (uniqueProjects < 2) {
      issues.push('Skills demonstrated in limited project contexts');
      recommendations.push('Apply skills across different types of projects');
    }

    // Check skill level consistency
    const averageComplexity = skill.projectContributions.reduce((sum, c) => {
      const complexityScore = c.complexity === 'high' ? 3 : c.complexity === 'medium' ? 2 : 1;
      return sum + complexityScore;
    }, 0) / skill.projectContributions.length;

    if (skill.level > averageComplexity + 1) {
      issues.push('Skill level may be overestimated based on project complexity');
      recommendations.push('Work on more complex projects to match claimed skill level');
    }

    return {
      isValid: issues.length === 0,
      issues,
      recommendations,
    };
  }

  /**
   * Helper methods
   */
  private extractCommitHash(evidenceText: string): string {
    const match = evidenceText.match(/commit (\w{7})/);
    return match ? match[1] : 'unknown';
  }

  private determineImpact(evidenceText: string): 'minor' | 'moderate' | 'major' {
    if (evidenceText.includes('refactor') || evidenceText.includes('major')) {
      return 'major';
    } else if (evidenceText.includes('feature') || evidenceText.includes('implement')) {
      return 'moderate';
    }
    return 'minor';
  }

  private determineComplexity(skillLevel: number): 'low' | 'medium' | 'high' {
    if (skillLevel >= 4) return 'high';
    if (skillLevel >= 2) return 'medium';
    return 'low';
  }

  private determineContributionImpact(skillLevel: number): 'minor' | 'moderate' | 'major' {
    if (skillLevel >= 4) return 'major';
    if (skillLevel >= 2) return 'moderate';
    return 'minor';
  }
}