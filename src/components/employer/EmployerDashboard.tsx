'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { 
  Search, 
  Filter, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  ExternalLink, 
  Shield, 
  Award,
  BarChart3,
  Users,
  Clock,
  Star
} from 'lucide-react';
import { CandidateProfile, EmployerDashboardData, BlockchainCredential } from '@/types/employer';
import { SkillLevel } from '@/types/analytics';

interface EmployerDashboardProps {
  employerId: string;
  onCandidateSelect?: (candidate: CandidateProfile) => void;
  onCreateAssessment?: () => void;
}

export function EmployerDashboard({ 
  employerId, 
  onCandidateSelect, 
  onCreateAssessment 
}: EmployerDashboardProps) {
  const [dashboardData, setDashboardData] = useState<EmployerDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSkillFilter, setSelectedSkillFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'score' | 'activity' | 'verification'>('score');

  useEffect(() => {
    loadDashboardData();
  }, [employerId]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      const mockData: EmployerDashboardData = {
        employerId,
        companyName: 'TechCorp Inc.',
        candidateProfiles: generateMockCandidates(),
        customAssessments: [],
        assessmentResults: [],
        industryBenchmarks: [],
        dashboardMetrics: {
          totalCandidatesViewed: 45,
          totalAssessmentsCreated: 3,
          totalAssessmentCompletions: 28,
          averageCandidateScore: 78.5,
          topPerformingSkills: ['JavaScript', 'React', 'TypeScript'],
          assessmentCompletionRate: 85.2,
          candidateEngagementRate: 92.1,
          lastUpdated: new Date()
        },
        recentActivity: []
      };
      setDashboardData(mockData);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateMockCandidates = (): CandidateProfile[] => {
    return [
      {
        userId: '1',
        username: 'alex_dev',
        displayName: 'Alex Johnson',
        email: 'alex@example.com',
        avatarUrl: undefined,
        skillLevels: [
          {
            skillId: 'javascript',
            skillName: 'JavaScript',
            currentLevel: 8,
            experiencePoints: 2400,
            competencyAreas: [],
            industryBenchmark: { industryAverage: 6.5, experienceLevel: 'mid', percentile: 85, lastUpdated: new Date() },
            verificationStatus: 'verified',
            progressHistory: [],
            trendDirection: 'improving',
            lastUpdated: new Date()
          },
          {
            skillId: 'react',
            skillName: 'React',
            currentLevel: 7,
            experiencePoints: 1800,
            competencyAreas: [],
            industryBenchmark: { industryAverage: 5.8, experienceLevel: 'mid', percentile: 78, lastUpdated: new Date() },
            verificationStatus: 'verified',
            progressHistory: [],
            trendDirection: 'improving',
            lastUpdated: new Date()
          }
        ],
        overallProgress: {} as any,
        learningVelocity: 85,
        codeQualityTrend: {
          direction: 'improving',
          changePercentage: 15.2,
          timeframe: '30 days'
        },
        verifiedBadges: [
          {
            badgeId: 'js-expert',
            badgeName: 'JavaScript Expert',
            badgeType: { category: 'skill', subcategory: 'frontend', skillArea: 'javascript' },
            rarity: { level: 'rare', rarityScore: 75, estimatedHolders: 150, globalPercentage: 2.1 },
            description: 'Demonstrated advanced JavaScript proficiency',
            criteria: { minimumSkillLevel: 7, codeQualityThreshold: 80 },
            awardedAt: new Date('2024-01-15'),
            verificationStatus: 'verified',
            blockchainTxHash: '0x123...abc',
            metadata: {
              skillsValidated: ['javascript', 'es6', 'async-programming'],
              codeQualityScore: 88,
              difficultyLevel: 'advanced',
              evidenceHash: 'hash123',
              issuerSignature: 'sig123',
              validationCriteria: []
            },
            verificationLevel: 'blockchain_verified',
            verificationDate: new Date('2024-01-15'),
            skillEvidence: []
          }
        ],
        blockchainCredentials: [
          {
            credentialId: 'cred-1',
            badgeId: 'js-expert',
            transactionHash: '0x123...abc',
            blockNumber: 12345,
            contractAddress: '0xabc...123',
            tokenId: '1',
            mintedAt: new Date('2024-01-15'),
            verificationUrl: 'https://sepolia.etherscan.io/tx/0x123...abc',
            metadata: {
              skillsValidated: ['javascript', 'es6', 'async-programming'],
              assessmentScore: 88,
              difficultyLevel: 'advanced',
              issuerSignature: 'sig123'
            },
            isValid: true,
            lastVerified: new Date()
          }
        ],
        assessmentResults: [],
        industryBenchmarks: [],
        marketReadiness: {} as any,
        peerComparisons: [],
        recentActivity: {
          totalSessions: 45,
          totalCodeSubmissions: 128,
          averageSessionDuration: 35,
          lastActiveDate: new Date(),
          streakDays: 12,
          weeklyActivity: [],
          skillFocus: []
        },
        learningInsights: [],
        portfolioProjects: [],
        profileVisibility: {
          isPublic: true,
          showRealName: true,
          showContactInfo: false,
          showDetailedAnalytics: true,
          showBenchmarkComparisons: true,
          allowEmployerContact: true,
          visibleToEmployers: true
        },
        lastUpdated: new Date(),
        createdAt: new Date('2023-06-01')
      }
    ];
  };

  const filteredCandidates = dashboardData?.candidateProfiles.filter(candidate => {
    const matchesSearch = candidate.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         candidate.username.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSkill = selectedSkillFilter === 'all' || 
                        candidate.skillLevels.some(skill => skill.skillId === selectedSkillFilter);
    
    return matchesSearch && matchesSkill;
  }) || [];

  const sortedCandidates = [...filteredCandidates].sort((a, b) => {
    switch (sortBy) {
      case 'score':
        const avgScoreA = a.skillLevels.reduce((sum, skill) => sum + skill.currentLevel, 0) / a.skillLevels.length;
        const avgScoreB = b.skillLevels.reduce((sum, skill) => sum + skill.currentLevel, 0) / b.skillLevels.length;
        return avgScoreB - avgScoreA;
      case 'activity':
        return b.recentActivity.lastActiveDate.getTime() - a.recentActivity.lastActiveDate.getTime();
      case 'verification':
        const verifiedBadgesA = a.verifiedBadges.filter(badge => badge.verificationStatus === 'verified').length;
        const verifiedBadgesB = b.verifiedBadges.filter(badge => badge.verificationStatus === 'verified').length;
        return verifiedBadgesB - verifiedBadgesA;
      default:
        return 0;
    }
  });

  const getTrendIcon = (direction: 'improving' | 'stable' | 'declining') => {
    switch (direction) {
      case 'improving':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'declining':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getVerificationBadge = (credential: BlockchainCredential) => (
    <Badge variant="outline" className="text-xs">
      <Shield className="h-3 w-3 mr-1" />
      Verified
    </Badge>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Failed to load dashboard data</p>
        <Button onClick={loadDashboardData} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Employer Dashboard</h1>
          <p className="text-gray-600">{dashboardData.companyName}</p>
        </div>
        <Button onClick={onCreateAssessment}>
          Create Assessment
        </Button>
      </div>

      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Candidates Viewed</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.dashboardMetrics.totalCandidatesViewed}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assessments Created</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.dashboardMetrics.totalAssessmentsCreated}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.dashboardMetrics.assessmentCompletionRate.toFixed(1)}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.dashboardMetrics.averageCandidateScore.toFixed(1)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="candidates" className="space-y-4">
        <TabsList>
          <TabsTrigger value="candidates">Candidates</TabsTrigger>
          <TabsTrigger value="assessments">Assessments</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="candidates" className="space-y-4">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search candidates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={selectedSkillFilter}
              onChange={(e) => setSelectedSkillFilter(e.target.value)}
              className="px-3 py-2 border rounded-md"
            >
              <option value="all">All Skills</option>
              <option value="javascript">JavaScript</option>
              <option value="react">React</option>
              <option value="typescript">TypeScript</option>
              <option value="python">Python</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border rounded-md"
            >
              <option value="score">Sort by Score</option>
              <option value="activity">Sort by Activity</option>
              <option value="verification">Sort by Verification</option>
            </select>
          </div>

          {/* Candidates List */}
          <div className="grid gap-4">
            {sortedCandidates.map((candidate) => (
              <CandidateCard
                key={candidate.userId}
                candidate={candidate}
                onSelect={() => onCandidateSelect?.(candidate)}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="assessments">
          <Card>
            <CardHeader>
              <CardTitle>Custom Assessments</CardTitle>
              <CardDescription>
                Manage your custom coding assessments and view results
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">No assessments created yet</p>
                <Button onClick={onCreateAssessment}>
                  Create Your First Assessment
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Analytics Overview</CardTitle>
              <CardDescription>
                Detailed insights into candidate performance and trends
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-gray-500">Analytics dashboard coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface CandidateCardProps {
  candidate: CandidateProfile;
  onSelect: () => void;
}

function CandidateCard({ candidate, onSelect }: CandidateCardProps) {
  const averageSkillLevel = candidate.skillLevels.reduce((sum, skill) => sum + skill.currentLevel, 0) / candidate.skillLevels.length;
  const verifiedBadgesCount = candidate.verifiedBadges.filter(badge => badge.verificationStatus === 'verified').length;

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={onSelect}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={candidate.avatarUrl} />
              <AvatarFallback>
                {candidate.displayName?.split(' ').map(n => n[0]).join('') || candidate.username.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <h3 className="font-semibold">{candidate.displayName || candidate.username}</h3>
                {verifiedBadgesCount > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    <Shield className="h-3 w-3 mr-1" />
                    {verifiedBadgesCount} Verified
                  </Badge>
                )}
              </div>
              <p className="text-sm text-gray-600">@{candidate.username}</p>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <span>Learning Velocity: {candidate.learningVelocity}%</span>
                {getTrendIcon(candidate.codeQualityTrend.direction)}
                <span>{candidate.codeQualityTrend.changePercentage.toFixed(1)}% (30d)</span>
              </div>
            </div>
          </div>

          <div className="text-right space-y-2">
            <div className="text-2xl font-bold">{averageSkillLevel.toFixed(1)}</div>
            <p className="text-xs text-gray-500">Avg Skill Level</p>
            <Button variant="outline" size="sm">
              View Profile
              <ExternalLink className="h-3 w-3 ml-1" />
            </Button>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {/* Top Skills */}
          <div>
            <p className="text-sm font-medium mb-2">Top Skills</p>
            <div className="flex flex-wrap gap-2">
              {candidate.skillLevels.slice(0, 4).map((skill) => (
                <div key={skill.skillId} className="flex items-center space-x-2">
                  <Badge variant="outline" className="text-xs">
                    {skill.skillName}
                  </Badge>
                  <div className="flex items-center space-x-1">
                    <Progress value={(skill.currentLevel / 10) * 100} className="w-12 h-2" />
                    <span className="text-xs text-gray-500">{skill.currentLevel}/10</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Blockchain Credentials */}
          {candidate.blockchainCredentials.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Blockchain Credentials</p>
              <div className="flex flex-wrap gap-2">
                {candidate.blockchainCredentials.slice(0, 3).map((credential) => (
                  <a
                    key={credential.credentialId}
                    href={credential.verificationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-800"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Shield className="h-3 w-3" />
                    <span>Verify on Blockchain</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Recent Activity */}
          <div className="flex justify-between text-xs text-gray-500">
            <span>Last active: {candidate.recentActivity.lastActiveDate.toLocaleDateString()}</span>
            <span>{candidate.recentActivity.totalSessions} sessions • {candidate.recentActivity.streakDays} day streak</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}