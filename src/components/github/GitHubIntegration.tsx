'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GitHubService } from '@/lib/github/github-service';
import { GitHubAIFeedbackService } from '@/lib/github/ai-feedback-service';
import { SkillRecognitionService } from '@/lib/github/skill-recognition-service';
import { GitHubIntegrationFirebaseService } from '@/lib/firebase/github-integration';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { EnhancedToast } from '@/components/EnhancedToast';

interface GitHubIntegrationProps {
  userId: string;
}

export function GitHubIntegration({ userId }: GitHubIntegrationProps) {
  const [githubUsername, setGithubUsername] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<any>(null);
  const [settings, setSettings] = useState({
    autoAnalysis: false,
    publicProfile: false,
    feedbackEnabled: true,
  });

  const githubService = new GitHubService();
  const aiService = new GitHubAIFeedbackService();
  const skillService = new SkillRecognitionService();
  const firebaseService = new GitHubIntegrationFirebaseService();

  useEffect(() => {
    loadGitHubIntegration();
  }, [userId]);

  const loadGitHubIntegration = async () => {
    try {
      const integration = await firebaseService.getGitHubIntegration(userId);
      if (integration) {
        setGithubUsername(integration.githubUsername);
        setIsConnected(true);
        setSettings(integration.settings);
        setAnalysisResults(integration.analysisResults);
      }
    } catch (error) {
      console.error('Error loading GitHub integration:', error);
    }
  };

  const connectGitHub = async () => {
    if (!githubUsername.trim()) {
      EnhancedToast.error('Please enter your GitHub username');
      return;
    }

    try {
      setIsAnalyzing(true);
      
      // Test connection by trying to get user repositories
      const testService = new GitHubService(accessToken || undefined);
      await testService.analyzeUserRepositories(githubUsername);

      // Save integration data
      await firebaseService.saveGitHubIntegration({
        userId,
        githubUsername,
        accessToken: accessToken || undefined,
        connectedAt: new Date(),
        repositoryFeedbacks: [],
        recognizedSkills: [],
        badgeRecommendations: [],
        settings,
      });

      setIsConnected(true);
      EnhancedToast.success('GitHub account connected successfully!');
    } catch (error) {
      console.error('Error connecting GitHub:', error);
      EnhancedToast.error('Failed to connect GitHub account. Please check your username and token.');
    } finally {
      setIsAnalyzing(false);
    }
  };  
const runAnalysis = async () => {
    if (!isConnected || !githubUsername) return;

    try {
      setIsAnalyzing(true);
      
      // Run retroactive analysis
      const service = new GitHubService(accessToken || undefined);
      const results = await service.analyzeUserRepositories(githubUsername);
      
      // Recognize skills from analysis
      const recognizedSkills = skillService.recognizeSkillsFromAnalysis(results);
      
      // Generate badge recommendations
      const badgeRecommendations = skillService.generateBadgeRecommendations(recognizedSkills);

      // Update Firebase with results
      await firebaseService.updateAnalysisResults(userId, results);
      await firebaseService.updateRecognizedSkills(userId, recognizedSkills);

      setAnalysisResults(results);
      EnhancedToast.success(`Analysis complete! Found ${results.skillsIdentified.length} skills and ${results.suggestedBadges.length} badge opportunities.`);
    } catch (error) {
      console.error('Error running analysis:', error);
      EnhancedToast.error('Failed to analyze repositories. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const updateSettings = async (key: keyof typeof settings, value: boolean) => {
    try {
      const newSettings = { ...settings, [key]: value };
      setSettings(newSettings);
      await firebaseService.updateSettings(userId, { [key]: value });
      EnhancedToast.success('Settings updated successfully');
    } catch (error) {
      console.error('Error updating settings:', error);
      EnhancedToast.error('Failed to update settings');
    }
  };

  const disconnectGitHub = async () => {
    try {
      await firebaseService.deleteGitHubIntegration(userId);
      setIsConnected(false);
      setGithubUsername('');
      setAccessToken('');
      setAnalysisResults(null);
      EnhancedToast.success('GitHub account disconnected');
    } catch (error) {
      console.error('Error disconnecting GitHub:', error);
      EnhancedToast.error('Failed to disconnect GitHub account');
    }
  };

  if (!isConnected) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            Connect GitHub Account
          </CardTitle>
          <CardDescription>
            Connect your GitHub account to analyze your repositories and earn skill badges based on your real project contributions.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">GitHub Username</Label>
            <Input
              id="username"
              placeholder="Enter your GitHub username"
              value={githubUsername}
              onChange={(e) => setGithubUsername(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="token">Personal Access Token (Optional)</Label>
            <Input
              id="token"
              type="password"
              placeholder="GitHub personal access token for private repos"
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              Optional: Provide a token to analyze private repositories. Public repos don't require a token.
            </p>
          </div>
          <Button 
            onClick={connectGitHub} 
            disabled={isAnalyzing || !githubUsername.trim()}
            className="w-full"
          >
            {isAnalyzing ? <LoadingSpinner size="sm" /> : 'Connect GitHub'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              GitHub Integration - {githubUsername}
            </span>
            <Button variant="outline" size="sm" onClick={disconnectGitHub}>
              Disconnect
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="analysis" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="analysis">Analysis</TabsTrigger>
              <TabsTrigger value="skills">Skills</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>        
    
            <TabsContent value="analysis" className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Repository Analysis</h3>
                  <p className="text-sm text-muted-foreground">
                    Analyze your GitHub repositories to identify skills and earn badges
                  </p>
                </div>
                <Button 
                  onClick={runAnalysis} 
                  disabled={isAnalyzing}
                >
                  {isAnalyzing ? <LoadingSpinner size="sm" /> : 'Run Analysis'}
                </Button>
              </div>

              {analysisResults && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold">{analysisResults.totalRepositories}</div>
                      <p className="text-xs text-muted-foreground">Repositories Analyzed</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold">{analysisResults.skillsIdentified.length}</div>
                      <p className="text-xs text-muted-foreground">Skills Identified</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold">{analysisResults.suggestedBadges.length}</div>
                      <p className="text-xs text-muted-foreground">Badge Opportunities</p>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>

            <TabsContent value="skills" className="space-y-4">
              {analysisResults?.skillsIdentified ? (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Identified Skills</h3>
                  <div className="grid gap-4">
                    {analysisResults.skillsIdentified.map((skill: any, index: number) => (
                      <Card key={index}>
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold">{skill.skillName}</h4>
                            <Badge variant={skill.level >= 3 ? 'default' : 'secondary'}>
                              Level {skill.level}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground mb-2">
                            Confidence: {(skill.confidence * 100).toFixed(1)}%
                          </div>
                          <div className="text-sm">
                            {skill.repositoryContributions} repository contributions
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Run an analysis to see your identified skills</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Auto Analysis</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically analyze new repositories and commits
                    </p>
                  </div>
                  <Switch
                    checked={settings.autoAnalysis}
                    onCheckedChange={(checked) => updateSettings('autoAnalysis', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Public Profile</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow others to see your GitHub-verified skills
                    </p>
                  </div>
                  <Switch
                    checked={settings.publicProfile}
                    onCheckedChange={(checked) => updateSettings('publicProfile', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>AI Feedback</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable AI feedback on your repositories and commits
                    </p>
                  </div>
                  <Switch
                    checked={settings.feedbackEnabled}
                    onCheckedChange={(checked) => updateSettings('feedbackEnabled', checked)}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}