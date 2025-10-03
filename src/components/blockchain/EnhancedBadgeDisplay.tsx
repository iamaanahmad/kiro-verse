'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge as UIBadge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, 
  ExternalLink, 
  Award, 
  TrendingUp,
  Star,
  Copy,
  CheckCircle,
  Clock,
  Target,
  Zap,
  Brain,
  Code,
  Trophy
} from 'lucide-react';
import type { Badge } from '@/types';

interface EnhancedBadgeDisplayProps {
  badge: Badge;
  showFullDetails?: boolean;
  className?: string;
}

export function EnhancedBadgeDisplay({ 
  badge, 
  showFullDetails = false, 
  className 
}: EnhancedBadgeDisplayProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [showDetails, setShowDetails] = useState(showFullDetails);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getRarityColor = (rarity?: string) => {
    switch (rarity) {
      case 'legendary': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'epic': return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'rare': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'uncommon': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (!showDetails) {
    return (
      <Card className={`hover:shadow-lg transition-shadow ${className}`}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <img 
              src={badge.icon} 
              alt={badge.name}
              className="w-12 h-12 rounded-full flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold truncate">{badge.name}</h3>
                {badge.verificationStatus === 'verified' && (
                  <Shield className="h-4 w-4 text-green-600" />
                )}
              </div>
              <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                {badge.description}
              </p>
              <div className="flex items-center gap-2 mb-2">
                {badge.metadata?.skillProgression && (
                  <UIBadge variant="secondary" className="text-xs">
                    Level {badge.metadata.skillProgression.skillLevel}
                  </UIBadge>
                )}
                {badge.metadata?.rarity && (
                  <UIBadge 
                    variant="outline" 
                    className={`text-xs ${getRarityColor(badge.metadata.rarity.level)}`}
                  >
                    {badge.metadata.rarity.level}
                  </UIBadge>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  {new Date(badge.date).toLocaleDateString()}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDetails(true)}
                  className="text-xs"
                >
                  View Details
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${className}`}>
      <CardHeader>
        <div className="flex items-start gap-4">
          <img 
            src={badge.icon} 
            alt={badge.name}
            className="w-16 h-16 rounded-full"
          />
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              {badge.name}
              {badge.verificationStatus === 'verified' && (
                <Shield className="h-5 w-5 text-green-600" />
              )}
            </CardTitle>
            <CardDescription className="mt-1">
              {badge.description}
            </CardDescription>
            <div className="flex items-center gap-2 mt-3">
              {badge.metadata?.skillProgression && (
                <UIBadge variant="secondary">
                  Level {badge.metadata.skillProgression.skillLevel}
                </UIBadge>
              )}
              {badge.metadata?.rarity && (
                <UIBadge 
                  variant="outline" 
                  className={getRarityColor(badge.metadata.rarity.level)}
                >
                  {badge.metadata.rarity.level}
                </UIBadge>
              )}
              {badge.metadata?.achievementDetails.complexity && (
                <UIBadge variant="outline" className="capitalize">
                  {badge.metadata.achievementDetails.complexity}
                </UIBadge>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDetails(false)}
          >
            ×
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="skills">Skills</TabsTrigger>
            <TabsTrigger value="verification">Verification</TabsTrigger>
            <TabsTrigger value="market">Market</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Trophy className="h-4 w-4" />
                    Achievement Stats
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {badge.metadata?.skillProgression && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Experience Points</span>
                        <span className="font-semibold">
                          {badge.metadata.skillProgression.experiencePoints.toLocaleString()}
                        </span>
                      </div>
                      {badge.metadata.skillProgression.isLevelUp && (
                        <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
                          <TrendingUp className="h-4 w-4 text-green-600" />
                          <span className="text-sm text-green-800">Level Up Achievement!</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Competency Areas</span>
                        <span className="font-semibold">
                          {badge.metadata.skillProgression.competencyAreas.length}
                        </span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Earned Date</span>
                    <span className="font-semibold">
                      {new Date(badge.date).toLocaleDateString()}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Star className="h-4 w-4" />
                    Rarity & Value
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {badge.metadata?.rarity && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Rarity Level</span>
                        <UIBadge 
                          variant="outline" 
                          className={getRarityColor(badge.metadata.rarity.level)}
                        >
                          {badge.metadata.rarity.level}
                        </UIBadge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Rarity Score</span>
                        <span className="font-semibold">
                          {badge.metadata.rarity.rarityScore}/100
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Total Issued</span>
                        <span className="font-semibold">
                          {badge.metadata.rarity.totalIssued.toLocaleString()}
                        </span>
                      </div>
                      {badge.metadata.rarity.globalRank && (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Global Rank</span>
                          <span className="font-semibold">
                            #{badge.metadata.rarity.globalRank}
                          </span>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {badge.metadata?.skillProgression.competencyAreas && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Competency Areas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {badge.metadata.skillProgression.competencyAreas.map((area, index) => (
                      <UIBadge key={index} variant="secondary">
                        {area}
                      </UIBadge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="skills" className="space-y-4">
            {badge.metadata?.achievementDetails && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Code className="h-4 w-4" />
                    Skill Assessment
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">Code Quality</span>
                          <span className={`text-sm font-semibold ${getPerformanceColor(badge.metadata.achievementDetails.codeQuality)}`}>
                            {badge.metadata.achievementDetails.codeQuality}%
                          </span>
                        </div>
                        <Progress value={badge.metadata.achievementDetails.codeQuality} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">Efficiency</span>
                          <span className={`text-sm font-semibold ${getPerformanceColor(badge.metadata.achievementDetails.efficiency)}`}>
                            {badge.metadata.achievementDetails.efficiency}%
                          </span>
                        </div>
                        <Progress value={badge.metadata.achievementDetails.efficiency} className="h-2" />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">Creativity</span>
                          <span className={`text-sm font-semibold ${getPerformanceColor(badge.metadata.achievementDetails.creativity)}`}>
                            {badge.metadata.achievementDetails.creativity}%
                          </span>
                        </div>
                        <Progress value={badge.metadata.achievementDetails.creativity} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">Best Practices</span>
                          <span className={`text-sm font-semibold ${getPerformanceColor(badge.metadata.achievementDetails.bestPractices)}`}>
                            {badge.metadata.achievementDetails.bestPractices}%
                          </span>
                        </div>
                        <Progress value={badge.metadata.achievementDetails.bestPractices} className="h-2" />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold text-green-700 mb-2 flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        Strengths
                      </h4>
                      <ul className="space-y-1">
                        {badge.metadata.achievementDetails.strengths.map((strength, index) => (
                          <li key={index} className="text-sm flex items-center gap-2">
                            <div className="w-1 h-1 bg-green-600 rounded-full"></div>
                            {strength}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-orange-700 mb-2 flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        Growth Areas
                      </h4>
                      <ul className="space-y-1">
                        {badge.metadata.achievementDetails.improvementAreas.map((area, index) => (
                          <li key={index} className="text-sm flex items-center gap-2">
                            <div className="w-1 h-1 bg-orange-600 rounded-full"></div>
                            {area}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Detected Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {badge.metadata.achievementDetails.detectedSkills.map((skill, index) => (
                        <UIBadge key={index} variant="outline">
                          {skill}
                        </UIBadge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="verification" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Blockchain Verification
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Transaction Hash</label>
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded flex-1 truncate">
                          {badge.txHash}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(badge.txHash)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    {badge.blockchainData?.contractAddress && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Contract Address</label>
                        <div className="flex items-center gap-2">
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded flex-1 truncate">
                            {badge.blockchainData.contractAddress}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(badge.blockchainData.contractAddress)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    )}
                    {badge.blockchainData?.tokenId && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Token ID</label>
                        <p className="text-sm">{badge.blockchainData.tokenId}</p>
                      </div>
                    )}
                  </div>
                  <div className="space-y-3">
                    {badge.blockchainData?.network && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Network</label>
                        <UIBadge variant="outline" className="capitalize">
                          {badge.blockchainData.network}
                        </UIBadge>
                      </div>
                    )}
                    {badge.metadata?.verificationData && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Verification Method</label>
                        <p className="text-sm capitalize">
                          {badge.metadata.verificationData.verificationMethod.replace('_', ' ')}
                        </p>
                      </div>
                    )}
                    {badge.blockchainData?.confirmations && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Confirmations</label>
                        <p className="text-sm">{badge.blockchainData.confirmations}</p>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium text-green-800">
                    Verified on blockchain - Cannot be falsified
                  </span>
                </div>

                {badge.blockchainData?.verificationUrl && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => window.open(badge.blockchainData.verificationUrl, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View on Blockchain Explorer
                  </Button>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="market" className="space-y-4">
            {badge.metadata?.employerInfo && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Market Value & Relevance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">
                            {badge.metadata.employerInfo.marketValue}
                          </div>
                          <p className="text-sm text-gray-600">Market Value</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600 capitalize">
                            {badge.metadata.employerInfo.demandLevel}
                          </div>
                          <p className="text-sm text-gray-600">Demand Level</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-purple-600">
                            {badge.metadata.employerInfo.salaryImpact ? `+${badge.metadata.employerInfo.salaryImpact}%` : 'N/A'}
                          </div>
                          <p className="text-sm text-gray-600">Salary Impact</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Job Relevance</h4>
                    <div className="flex flex-wrap gap-2">
                      {badge.metadata.employerInfo.jobRelevance.map((role, index) => (
                        <UIBadge key={index} variant="secondary">
                          {role}
                        </UIBadge>
                      ))}
                    </div>
                  </div>

                  {badge.metadata.skillProgression.industryBenchmark && (
                    <div>
                      <h4 className="font-semibold mb-2">Industry Benchmark</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-sm text-gray-600">Percentile Rank</span>
                          <div className="text-lg font-semibold">
                            {badge.metadata.skillProgression.industryBenchmark.percentile}%
                          </div>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600">Experience Level</span>
                          <div className="text-lg font-semibold">
                            {badge.metadata.skillProgression.industryBenchmark.experienceLevel}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default EnhancedBadgeDisplay;