'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge as UIBadge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, 
  CheckCircle, 
  ExternalLink, 
  Award, 
  Clock,
  User,
  Building,
  FileText,
  Download,
  Copy,
  AlertTriangle,
  Star,
  TrendingUp
} from 'lucide-react';
import type { AssessmentResult, AssessmentVerificationBadge } from '@/lib/blockchain/assessment-verification';

interface AssessmentVerificationPanelProps {
  className?: string;
}

interface VerificationResult {
  success: boolean;
  verificationBadge?: AssessmentVerificationBadge;
  txHash?: string;
  employerTools?: any;
  error?: string;
}

export function AssessmentVerificationPanel({ className }: AssessmentVerificationPanelProps) {
  const [activeTab, setActiveTab] = useState('create');
  const [isProcessing, setIsProcessing] = useState(false);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  
  // Form state for creating assessment verification
  const [assessmentData, setAssessmentData] = useState({
    candidateId: '',
    candidateName: '',
    assessmentTitle: 'Full Stack Developer Assessment',
    companyName: '',
    jobRole: '',
    totalScore: 85,
    maxScore: 100,
    timeSpent: 120,
    skills: [
      { name: 'JavaScript', score: 88, level: 'advanced' },
      { name: 'React', score: 82, level: 'intermediate' },
      { name: 'Node.js', score: 85, level: 'advanced' }
    ]
  });

  // Form state for verifying existing assessment
  const [verificationData, setVerificationData] = useState({
    txHash: '',
    assessmentId: ''
  });

  const [verificationCheck, setVerificationCheck] = useState<any>(null);

  const handleCreateVerification = async () => {
    if (!assessmentData.candidateId || !assessmentData.companyName) {
      alert('Please fill in all required fields');
      return;
    }

    setIsProcessing(true);
    setVerificationResult(null);

    try {
      // Create mock assessment result
      const assessmentResult: AssessmentResult = {
        assessmentId: `assessment-${Date.now()}`,
        userId: assessmentData.candidateId,
        employerId: `employer-${Date.now()}`,
        completedAt: new Date().toISOString(),
        totalScore: assessmentData.totalScore,
        maxScore: assessmentData.maxScore,
        percentageScore: Math.round((assessmentData.totalScore / assessmentData.maxScore) * 100),
        performanceLevel: assessmentData.totalScore >= 90 ? 'exceptional' :
                         assessmentData.totalScore >= 80 ? 'exceeds_expectations' :
                         assessmentData.totalScore >= 70 ? 'meets_expectations' : 'below_expectations',
        skillsAssessed: assessmentData.skills.map(skill => ({
          skillName: skill.name,
          score: skill.score,
          maxScore: 100,
          level: skill.level as 'beginner' | 'intermediate' | 'advanced' | 'expert',
          feedback: `Demonstrated ${skill.level} level proficiency in ${skill.name}`
        })),
        timeSpent: assessmentData.timeSpent,
        codeSubmissions: [
          {
            questionId: 'q1',
            code: '// Sample code submission',
            language: 'javascript',
            score: assessmentData.totalScore,
            feedback: ['Clean implementation', 'Good practices'],
            testsPassed: Math.floor(assessmentData.totalScore / 10),
            totalTests: 10
          }
        ],
        aiAnalysis: {
          overallQuality: assessmentData.totalScore,
          problemSolvingApproach: 'Systematic and well-structured approach to problem solving',
          codeOrganization: assessmentData.totalScore + 2,
          algorithmicThinking: assessmentData.totalScore - 3,
          bestPracticesAdherence: assessmentData.totalScore + 1,
          creativityScore: assessmentData.totalScore - 5,
          strengths: ['Clean code structure', 'Good error handling', 'Modern best practices'],
          improvementAreas: ['Algorithm optimization', 'Performance considerations'],
          recommendedNextSteps: ['Practice advanced algorithms', 'Learn performance optimization']
        }
      };

      const employerInfo = {
        companyName: assessmentData.companyName,
        assessmentTitle: assessmentData.assessmentTitle,
        jobRole: assessmentData.jobRole,
        industry: 'Technology'
      };

      // Call API to create verification
      const response = await fetch('/api/assessment/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assessmentResult,
          employerInfo
        })
      });

      const result = await response.json();

      if (result.success) {
        setVerificationResult(result);
      } else {
        setVerificationResult({
          success: false,
          error: result.error || 'Verification failed'
        });
      }

    } catch (error) {
      console.error('Assessment verification failed:', error);
      setVerificationResult({
        success: false,
        error: error instanceof Error ? error.message : 'Verification failed'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleVerifyExisting = async () => {
    if (!verificationData.txHash || !verificationData.assessmentId) {
      alert('Please provide both transaction hash and assessment ID');
      return;
    }

    setIsProcessing(true);
    setVerificationCheck(null);

    try {
      const response = await fetch(
        `/api/assessment/verify?txHash=${verificationData.txHash}&assessmentId=${verificationData.assessmentId}`
      );

      const result = await response.json();
      setVerificationCheck(result);

    } catch (error) {
      console.error('Verification check failed:', error);
      setVerificationCheck({
        isValid: false,
        error: error instanceof Error ? error.message : 'Verification check failed'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const downloadReport = () => {
    if (!verificationResult?.employerTools) return;

    const report = {
      verificationDate: new Date().toISOString(),
      verificationBadge: verificationResult.verificationBadge,
      employerTools: verificationResult.employerTools
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `assessment-verification-report-${Date.now()}.json`;
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
            Assessment Blockchain Verification
          </CardTitle>
          <CardDescription>
            Create tamper-proof verification badges for assessment results and verify existing credentials
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="create">Create Verification</TabsTrigger>
          <TabsTrigger value="verify">Verify Existing</TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Create Assessment Verification</CardTitle>
              <CardDescription>
                Generate a blockchain-verified badge for assessment completion
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="candidateId">Candidate ID *</Label>
                  <Input
                    id="candidateId"
                    value={assessmentData.candidateId}
                    onChange={(e) => setAssessmentData(prev => ({ ...prev, candidateId: e.target.value }))}
                    placeholder="candidate-123"
                  />
                </div>
                <div>
                  <Label htmlFor="candidateName">Candidate Name</Label>
                  <Input
                    id="candidateName"
                    value={assessmentData.candidateName}
                    onChange={(e) => setAssessmentData(prev => ({ ...prev, candidateName: e.target.value }))}
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <Label htmlFor="companyName">Company Name *</Label>
                  <Input
                    id="companyName"
                    value={assessmentData.companyName}
                    onChange={(e) => setAssessmentData(prev => ({ ...prev, companyName: e.target.value }))}
                    placeholder="TechCorp Inc."
                  />
                </div>
                <div>
                  <Label htmlFor="jobRole">Job Role</Label>
                  <Input
                    id="jobRole"
                    value={assessmentData.jobRole}
                    onChange={(e) => setAssessmentData(prev => ({ ...prev, jobRole: e.target.value }))}
                    placeholder="Senior Frontend Developer"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="assessmentTitle">Assessment Title</Label>
                <Input
                  id="assessmentTitle"
                  value={assessmentData.assessmentTitle}
                  onChange={(e) => setAssessmentData(prev => ({ ...prev, assessmentTitle: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="totalScore">Total Score</Label>
                  <Input
                    id="totalScore"
                    type="number"
                    value={assessmentData.totalScore}
                    onChange={(e) => setAssessmentData(prev => ({ ...prev, totalScore: parseInt(e.target.value) }))}
                    min="0"
                    max="100"
                  />
                </div>
                <div>
                  <Label htmlFor="maxScore">Max Score</Label>
                  <Input
                    id="maxScore"
                    type="number"
                    value={assessmentData.maxScore}
                    onChange={(e) => setAssessmentData(prev => ({ ...prev, maxScore: parseInt(e.target.value) }))}
                    min="1"
                  />
                </div>
                <div>
                  <Label htmlFor="timeSpent">Time Spent (minutes)</Label>
                  <Input
                    id="timeSpent"
                    type="number"
                    value={assessmentData.timeSpent}
                    onChange={(e) => setAssessmentData(prev => ({ ...prev, timeSpent: parseInt(e.target.value) }))}
                    min="1"
                  />
                </div>
              </div>

              <div>
                <Label>Skills Assessed</Label>
                <div className="space-y-2 mt-2">
                  {assessmentData.skills.map((skill, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 border rounded">
                      <Input
                        value={skill.name}
                        onChange={(e) => {
                          const newSkills = [...assessmentData.skills];
                          newSkills[index].name = e.target.value;
                          setAssessmentData(prev => ({ ...prev, skills: newSkills }));
                        }}
                        placeholder="Skill name"
                        className="flex-1"
                      />
                      <Input
                        type="number"
                        value={skill.score}
                        onChange={(e) => {
                          const newSkills = [...assessmentData.skills];
                          newSkills[index].score = parseInt(e.target.value);
                          setAssessmentData(prev => ({ ...prev, skills: newSkills }));
                        }}
                        min="0"
                        max="100"
                        className="w-20"
                      />
                      <select
                        value={skill.level}
                        onChange={(e) => {
                          const newSkills = [...assessmentData.skills];
                          newSkills[index].level = e.target.value;
                          setAssessmentData(prev => ({ ...prev, skills: newSkills }));
                        }}
                        className="px-2 py-1 border rounded"
                      >
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                        <option value="expert">Expert</option>
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              <Button
                onClick={handleCreateVerification}
                disabled={isProcessing}
                className="w-full"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating Verification...
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4 mr-2" />
                    Create Blockchain Verification
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {verificationResult && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {verificationResult.success ? (
                    <>
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      Verification Created Successfully
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                      Verification Failed
                    </>
                  )}
                </CardTitle>
                {verificationResult.success && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(verificationResult.txHash || '')}
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copy TX Hash
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={downloadReport}
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Download Report
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                {!verificationResult.success ? (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      {verificationResult.error}
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Badge Name</Label>
                        <p className="font-semibold">{verificationResult.verificationBadge?.name}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Performance Level</Label>
                        <UIBadge variant="secondary" className="capitalize">
                          {verificationResult.verificationBadge?.assessmentData.performanceLevel.replace('_', ' ')}
                        </UIBadge>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Transaction Hash</Label>
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded block truncate">
                          {verificationResult.txHash}
                        </code>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Valid Until</Label>
                        <p className="text-sm">
                          {verificationResult.verificationBadge?.assessmentData.validUntil ? 
                            new Date(verificationResult.verificationBadge.assessmentData.validUntil).toLocaleDateString() : 
                            'Permanent'
                          }
                        </p>
                      </div>
                    </div>

                    {verificationResult.employerTools && (
                      <div className="space-y-4">
                        <h4 className="font-semibold">Employer Verification Tools</h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <Card>
                            <CardContent className="pt-6">
                              <div className="text-center">
                                <div className="text-2xl font-bold text-blue-600">
                                  {verificationResult.employerTools.skillBreakdown?.overallScore}%
                                </div>
                                <p className="text-sm text-gray-600">Overall Score</p>
                              </div>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="pt-6">
                              <div className="text-center">
                                <div className="text-2xl font-bold text-green-600">
                                  {verificationResult.employerTools.skillBreakdown?.timeEfficiency}
                                </div>
                                <p className="text-sm text-gray-600">Time Efficiency</p>
                              </div>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="pt-6">
                              <div className="text-center">
                                <div className="text-2xl font-bold text-purple-600">
                                  {verificationResult.employerTools.performanceAnalysis?.codeQuality}%
                                </div>
                                <p className="text-sm text-gray-600">Code Quality</p>
                              </div>
                            </CardContent>
                          </Card>
                        </div>

                        <div>
                          <h5 className="font-medium mb-2">Hiring Recommendation</h5>
                          <div className="p-3 bg-blue-50 rounded-lg">
                            <p className="text-sm text-blue-800">
                              {verificationResult.employerTools.recommendationSummary?.hiringRecommendation}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="verify" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Verify Existing Assessment</CardTitle>
              <CardDescription>
                Verify the authenticity of an existing assessment verification badge
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="txHash">Transaction Hash</Label>
                <Input
                  id="txHash"
                  value={verificationData.txHash}
                  onChange={(e) => setVerificationData(prev => ({ ...prev, txHash: e.target.value }))}
                  placeholder="0x..."
                />
              </div>
              <div>
                <Label htmlFor="assessmentId">Assessment ID</Label>
                <Input
                  id="assessmentId"
                  value={verificationData.assessmentId}
                  onChange={(e) => setVerificationData(prev => ({ ...prev, assessmentId: e.target.value }))}
                  placeholder="assessment-123"
                />
              </div>
              <Button
                onClick={handleVerifyExisting}
                disabled={isProcessing}
                className="w-full"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Verifying...
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4 mr-2" />
                    Verify Assessment
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {verificationCheck && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {verificationCheck.isValid ? (
                    <>
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      Assessment Verified
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                      Verification Failed
                    </>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!verificationCheck.isValid ? (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      {verificationCheck.error}
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="text-sm font-medium text-green-800">
                        This assessment is verified on the blockchain and tamper-proof
                      </span>
                    </div>

                    {verificationCheck.assessmentData && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Assessment ID</Label>
                          <p className="font-semibold">{verificationCheck.assessmentData.assessmentId}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Employer ID</Label>
                          <p className="font-semibold">{verificationCheck.assessmentData.employerId}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Performance Level</Label>
                          <UIBadge variant="secondary" className="capitalize">
                            {verificationCheck.assessmentData.performanceLevel?.replace('_', ' ')}
                          </UIBadge>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Blockchain Verified</Label>
                          <p className="text-green-600 font-semibold">
                            {verificationCheck.verificationDetails?.blockchainVerified ? 'Yes' : 'No'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default AssessmentVerificationPanel;