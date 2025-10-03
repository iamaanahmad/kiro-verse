'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge as UIBadge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  CheckCircle, 
  ExternalLink, 
  Search, 
  Award, 
  TrendingUp,
  Clock,
  Star,
  AlertTriangle,
  Copy,
  Download
} from 'lucide-react';
import type { Badge, BadgeMetadata } from '@/types';
import { blockchainVerificationService } from '@/lib/blockchain/verification-service';
import { assessmentVerificationService } from '@/lib/blockchain/assessment-verification';

interface EmployerVerificationInterfaceProps {
  className?: string;
}

interface VerificationResult {
  isValid: boolean;
  badge?: Badge;
  skillSummary?: any;
  authenticity?: any;
  marketRelevance?: any;
  error?: string;
}

export function EmployerVerificationInterface({ className }: EmployerVerificationInterfaceProps) {
  const [txHash, setTxHash] = useState('');
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [activeTab, setActiveTab] = useState('verify');

  const handleVerification = async () => {
    if (!txHash.trim()) return;

    setIsVerifying(true);
    setVerificationResult(null);

    try {
      // Verify the badge on blockchain
      const blockchainResult = await blockchainVerificationService.verifyBadge(txHash);
      
      if (!blockchainResult.isValid) {
        setVerificationResult({
          isValid: false,
          error: blockchainResult.error || 'Invalid transaction hash'
        });
        return;
      }

      // Create mock badge for demonstration (in real implementation, this would come from database)
      const mockBadge: Badge = {
        id: 'verified-badge',
        name: 'JavaScript Mastery',
        description: 'Demonstrated advanced JavaScript skills including async/await, closures, and modern ES6+ features',
        txHash: txHash,
        date: new Date().toISOString(),
        icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iNTAiIGN5PSI1MCIgcj0iNDAiIGZpbGw9IiNmNTlmMGIiLz48dGV4dCB4PSI1MCIgeT0iNTUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyMCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkpTPC90ZXh0Pjwvc3ZnPg==',
        verificationStatus: 'verified',
        metadata: {
          skillProgression: {
            skillLevel: 3,
            experiencePoints: 750,
            previousLevel: 2,
            isLevelUp: true,
            competencyAreas: ['Async Programming', 'ES6+ Features', 'DOM Manipulation', 'Error Handling'],
            industryBenchmark: {
              percentile: 85,
              experienceLevel: 'Senior'
            }
          },
          achievementDetails: {
            codeQuality: 88,
            efficiency: 82,
            creativity: 90,
            bestPractices: 85,
            complexity: 'advanced',
            detectedSkills: ['JavaScript', 'Async/Await', 'Promises', 'ES6+', 'Error Handling'],
            improvementAreas: ['Performance Optimization', 'Testing Practices'],
            strengths: ['Clean Code Structure', 'Modern JavaScript Usage', 'Problem Solving']
          },
          verificationData: {
            issuedAt: new Date().toISOString(),
            issuerId: 'kiroverse-ai',
            verificationMethod: 'ai_analysis',
            evidenceHash: '0x1234567890abcdef',
            witnessSignatures: ['KiroVerse AI Mentor']
          },
          rarity: {
            level: 'rare',
            totalIssued: 1247,
            globalRank: 156,
            rarityScore: 87.5
          },
          employerInfo: {
            jobRelevance: ['Frontend Developer', 'Full Stack Developer', 'JavaScript Developer'],
            marketValue: 85,
            demandLevel: 'high',
            salaryImpact: 15
          }
        },
        blockchainData: {
          contractAddress: '0x742d35Cc6634C0532925a3b8D4C9db96C4b5Da5e',
          tokenId: blockchainResult.tokenId,
          network: 'sepolia',
          blockNumber: 12345678,
          gasUsed: 150000,
          confirmations: 25,
          verificationUrl: `https://sepolia.etherscan.io/tx/${txHash}`,
          onChainMetadata: JSON.stringify({
            name: 'JavaScript Mastery',
            skill_level: 3,
            rarity: 'rare',
            verified: true
          })
        }
      };

      // Create employer verification data
      const employerData = await blockchainVerificationService.createEmployerVerificationData(mockBadge);

      setVerificationResult({
        isValid: true,
        badge: mockBadge,
        ...employerData
      });

    } catch (error) {
      console.error('Verification failed:', error);
      setVerificationResult({
        isValid: false,
        error: error instanceof Error ? error.message : 'Verification failed'
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const downloadReport = () => {
    if (!verificationResult?.badge) return;

    const report = {
      verificationDate: new Date().toISOString(),
      badge: verificationResult.badge,
      skillSummary: verificationResult.skillSummary,
      authenticity: verificationResult.authenticity,
      marketRelevance: verificationResult.marketRelevance
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `verification-report-${verificationResult.badge.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            Blockchain Credential Verification
          </CardTitle>
          <CardDescription>
            Verify the authenticity and details of KiroVerse skill badges using blockchain technology
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Enter transaction hash (0x...)"
              value={txHash}
              onChange={(e) => setTxHash(e.target.value)}
              className="flex-1"
            />
            <Button 
              onClick={handleVerification}
              disabled={isVerifying || !txHash.trim()}
              className="flex items-center gap-2"
            >
              {isVerifying ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Verifying...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  Verify
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {verificationResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {verificationResult.isValid ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Verification Successful
                </>
              ) : (
                <>
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  Verification Failed
                </>
              )}
            </CardTitle>
            {verificationResult.isValid && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(verificationResult.verificationUrl || '')}
                  className="flex items-center gap-1"
                >
                  <Copy className="h-3 w-3" />
                  Copy Link
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadReport}
                  className="flex items-center gap-1"
                >
                  <Download className="h-3 w-3" />
                  Download Report
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {!verificationResult.isValid ? (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {verificationResult.error}
                </AlertDescription>
              </Alert>
            ) : (
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="skills">Skills</TabsTrigger>
                  <TabsTrigger value="authenticity">Authenticity</TabsTrigger>
                  <TabsTrigger value="market">Market Value</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Badge Information</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center gap-3">
                          <img 
                            src={verificationResult.badge?.icon} 
                            alt="Badge" 
                            className="w-12 h-12 rounded-full"
                          />
                          <div>
                            <h3 className="font-semibold">{verificationResult.badge?.name}</h3>
                            <p className="text-sm text-gray-600">{verificationResult.badge?.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <UIBadge variant="secondary">
                            Level {verificationResult.skillSummary?.skillLevel}
                          </UIBadge>
                          <UIBadge 
                            variant={verificationResult.badge?.metadata?.rarity?.level === 'rare' ? 'default' : 'secondary'}
                          >
                            {verificationResult.badge?.metadata?.rarity?.level}
                          </UIBadge>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Quick Stats</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Experience Points</span>
                          <span className="font-semibold">{verificationResult.skillSummary?.experiencePoints}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Industry Percentile</span>
                          <span className="font-semibold">{verificationResult.skillSummary?.industryBenchmark?.percentile}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Competency Areas</span>
                          <span className="font-semibold">{verificationResult.skillSummary?.competencyAreas?.length || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Issued</span>
                          <span className="font-semibold">
                            {new Date(verificationResult.badge?.date || '').toLocaleDateString()}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="skills" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Award className="h-5 w-5" />
                        Skill Assessment
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-600">Code Quality</label>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full" 
                                style={{ width: `${verificationResult.badge?.metadata?.achievementDetails.codeQuality}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-semibold">
                              {verificationResult.badge?.metadata?.achievementDetails.codeQuality}%
                            </span>
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">Efficiency</label>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-green-600 h-2 rounded-full" 
                                style={{ width: `${verificationResult.badge?.metadata?.achievementDetails.efficiency}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-semibold">
                              {verificationResult.badge?.metadata?.achievementDetails.efficiency}%
                            </span>
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">Creativity</label>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-purple-600 h-2 rounded-full" 
                                style={{ width: `${verificationResult.badge?.metadata?.achievementDetails.creativity}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-semibold">
                              {verificationResult.badge?.metadata?.achievementDetails.creativity}%
                            </span>
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">Best Practices</label>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-orange-600 h-2 rounded-full" 
                                style={{ width: `${verificationResult.badge?.metadata?.achievementDetails.bestPractices}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-semibold">
                              {verificationResult.badge?.metadata?.achievementDetails.bestPractices}%
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-semibold text-green-700 mb-2">Strengths</h4>
                          <ul className="space-y-1">
                            {verificationResult.badge?.metadata?.achievementDetails.strengths.map((strength, index) => (
                              <li key={index} className="text-sm flex items-center gap-2">
                                <CheckCircle className="h-3 w-3 text-green-600" />
                                {strength}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-semibold text-orange-700 mb-2">Growth Areas</h4>
                          <ul className="space-y-1">
                            {verificationResult.badge?.metadata?.achievementDetails.improvementAreas.map((area, index) => (
                              <li key={index} className="text-sm flex items-center gap-2">
                                <TrendingUp className="h-3 w-3 text-orange-600" />
                                {area}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="authenticity" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
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
                                {verificationResult.authenticity?.transactionHash}
                              </code>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(verificationResult.authenticity?.transactionHash)}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-600">Contract Address</label>
                            <div className="flex items-center gap-2">
                              <code className="text-xs bg-gray-100 px-2 py-1 rounded flex-1 truncate">
                                {verificationResult.authenticity?.contractAddress}
                              </code>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(verificationResult.authenticity?.contractAddress)}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-600">Token ID</label>
                            <p className="text-sm">{verificationResult.authenticity?.tokenId}</p>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <label className="text-sm font-medium text-gray-600">Network</label>
                            <UIBadge variant="outline">{verificationResult.authenticity?.network}</UIBadge>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-600">Verification Method</label>
                            <p className="text-sm capitalize">{verificationResult.authenticity?.verificationMethod?.replace('_', ' ')}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-600">Issued Date</label>
                            <p className="text-sm">{new Date(verificationResult.authenticity?.issuedAt).toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span className="text-sm font-medium text-green-800">
                          This credential is verified on the blockchain and cannot be falsified
                        </span>
                      </div>

                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => window.open(verificationResult.verificationUrl, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View on Blockchain Explorer
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="market" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Market Relevance
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card>
                          <CardContent className="pt-6">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-blue-600">
                                {verificationResult.marketRelevance?.marketValue}
                              </div>
                              <p className="text-sm text-gray-600">Market Value Score</p>
                            </div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="pt-6">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-green-600 capitalize">
                                {verificationResult.marketRelevance?.demandLevel}
                              </div>
                              <p className="text-sm text-gray-600">Demand Level</p>
                            </div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="pt-6">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-purple-600">
                                +{verificationResult.marketRelevance?.salaryImpact}%
                              </div>
                              <p className="text-sm text-gray-600">Salary Impact</p>
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2">Relevant Job Roles</h4>
                        <div className="flex flex-wrap gap-2">
                          {verificationResult.marketRelevance?.jobRelevance?.map((role: string, index: number) => (
                            <UIBadge key={index} variant="secondary">
                              {role}
                            </UIBadge>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-semibold mb-2">Rarity Information</h4>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Rarity Level</span>
                              <UIBadge variant="outline" className="capitalize">
                                {verificationResult.marketRelevance?.rarity?.level}
                              </UIBadge>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Total Issued</span>
                              <span className="text-sm font-semibold">
                                {verificationResult.marketRelevance?.rarity?.totalIssued?.toLocaleString()}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Rarity Score</span>
                              <span className="text-sm font-semibold">
                                {verificationResult.marketRelevance?.rarity?.rarityScore}/100
                              </span>
                            </div>
                          </div>
                        </div>
                        <div>
                          <h4 className="font-semibold mb-2">Hiring Recommendation</h4>
                          <div className="p-3 bg-blue-50 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <Star className="h-4 w-4 text-blue-600" />
                              <span className="text-sm font-medium text-blue-800">
                                Recommended for Senior Roles
                              </span>
                            </div>
                            <p className="text-xs text-blue-700">
                              This candidate demonstrates advanced skills and would be suitable for senior-level positions.
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default EmployerVerificationInterface;