'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Award, 
  Users, 
  MessageSquare, 
  Star, 
  TrendingUp,
  Calendar,
  Target,
  Heart,
  Trophy,
  Zap
} from 'lucide-react';
import { 
  CommunityContribution, 
  ReviewAnalytics,
  ReviewerProfile
} from '@/types/peer-review';
import { PeerReviewService } from '@/lib/firebase/peer-review';
import { LoadingSpinner } from '@/components/LoadingSpinner';

interface CommunityContributionsProps {
  userId: string;
}

export function CommunityContributions({ userId }: CommunityContributionsProps) {
  const [contributions, setContributions] = useState<CommunityContribution[]>([]);
  const [analytics, setAnalytics] = useState<ReviewAnalytics | null>(null);
  const [profile, setProfile] = useState<ReviewerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'contributions' | 'achievements'>('overview');

  useEffect(() => {
    loadCommunityData();
  }, [userId]);

  const loadCommunityData = async () => {
    try {
      setLoading(true);
      const [userContributions, reviewAnalytics, reviewerProfile] = await Promise.all([
        PeerReviewService.getUserContributions(userId),
        PeerReviewService.getReviewAnalytics(userId),
        PeerReviewService.getReviewerProfile(userId)
      ]);

      setContributions(userContributions);
      setAnalytics(reviewAnalytics);
      setProfile(reviewerProfile);
    } catch (error) {
      console.error('Error loading community data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getContributionIcon = (type: string) => {
    switch (type) {
      case 'review': return <MessageSquare className="h-4 w-4" />;
      case 'mentorship': return <Users className="h-4 w-4" />;
      case 'collaboration': return <Zap className="h-4 w-4" />;
      case 'knowledge_sharing': return <Star className="h-4 w-4" />;
      default: return <Award className="h-4 w-4" />;
    }
  };

  const getContributionColor = (type: string) => {
    switch (type) {
      case 'review': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'mentorship': return 'bg-green-100 text-green-800 border-green-200';
      case 'collaboration': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'knowledge_sharing': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getBadgeRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white';
      case 'epic': return 'bg-gradient-to-r from-purple-500 to-pink-500 text-white';
      case 'rare': return 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white';
      case 'uncommon': return 'bg-gradient-to-r from-green-500 to-emerald-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-muted p-1 rounded-lg">
        {[
          { id: 'overview', label: 'Overview', icon: TrendingUp },
          { id: 'contributions', label: 'Contributions', icon: MessageSquare },
          { id: 'achievements', label: 'Achievements', icon: Trophy }
        ].map(({ id, label, icon: Icon }) => (
          <Button
            key={id}
            variant={activeTab === id ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab(id as typeof activeTab)}
            className="flex-1"
          >
            <Icon className="h-4 w-4 mr-2" />
            {label}
          </Button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">{analytics?.totalReviews || 0}</p>
                    <p className="text-xs text-muted-foreground">Total Reviews</p>
                  </div>
                  <MessageSquare className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">{analytics?.averageRating.toFixed(1) || '0.0'}</p>
                    <p className="text-xs text-muted-foreground">Avg Rating</p>
                  </div>
                  <Star className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">{contributions.length}</p>
                    <p className="text-xs text-muted-foreground">Contributions</p>
                  </div>
                  <Heart className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">{profile?.reputation.points || 0}</p>
                    <p className="text-xs text-muted-foreground">Reputation</p>
                  </div>
                  <Award className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {contributions.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Contributions Yet</h3>
                  <p className="text-muted-foreground">
                    Start participating in peer reviews to build your community presence
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {contributions.slice(0, 5).map((contribution) => (
                    <div key={contribution.contributionId} className="flex items-center space-x-3 p-3 bg-muted rounded-lg">
                      <div className={`p-2 rounded ${getContributionColor(contribution.type)}`}>
                        {getContributionIcon(contribution.type)}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{contribution.title}</h4>
                        <p className="text-xs text-muted-foreground">{contribution.description}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {contribution.type.replace('_', ' ')}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {contribution.createdAt.toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center text-sm">
                          <Heart className="h-3 w-3 mr-1 text-red-500" />
                          {contribution.impact.helpfulnessVotes}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          +{contribution.recognition.points} pts
                        </div>
                      </div>
                    </div>
                  ))}
                  {contributions.length > 5 && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setActiveTab('contributions')}
                      className="w-full"
                    >
                      View All Contributions
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Skills Impact */}
          {analytics?.skillImprovements && analytics.skillImprovements.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="h-5 w-5 mr-2" />
                  Skills You've Helped Improve
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {analytics.skillImprovements.map((skill, index) => (
                    <Badge key={index} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Contributions Tab */}
      {activeTab === 'contributions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">All Contributions</h3>
            <Badge variant="secondary">{contributions.length} total</Badge>
          </div>
          
          {contributions.length === 0 ? (
            <Card className="p-6 text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Contributions Yet</h3>
              <p className="text-muted-foreground">
                Start by reviewing code or helping other developers to build your contribution history
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {contributions.map((contribution) => (
                <Card key={contribution.contributionId}>
                  <CardContent className="pt-6">
                    <div className="flex items-start space-x-4">
                      <div className={`p-3 rounded-lg ${getContributionColor(contribution.type)}`}>
                        {getContributionIcon(contribution.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold">{contribution.title}</h4>
                          <Badge variant="outline">
                            {contribution.type.replace('_', ' ')}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground mb-3">{contribution.description}</p>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Helpfulness</p>
                            <div className="flex items-center">
                              <Heart className="h-4 w-4 mr-1 text-red-500" />
                              {contribution.impact.helpfulnessVotes}
                            </div>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Learners Helped</p>
                            <div className="flex items-center">
                              <Users className="h-4 w-4 mr-1 text-blue-500" />
                              {contribution.impact.learnersBenefited}
                            </div>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Points Earned</p>
                            <div className="flex items-center">
                              <Award className="h-4 w-4 mr-1 text-purple-500" />
                              {contribution.recognition.points}
                            </div>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Date</p>
                            <p className="font-medium">
                              {contribution.createdAt.toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        {contribution.impact.skillsImproved.length > 0 && (
                          <div className="mt-3">
                            <p className="text-sm text-muted-foreground mb-1">Skills Improved:</p>
                            <div className="flex flex-wrap gap-1">
                              {contribution.impact.skillsImproved.map((skill, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Achievements Tab */}
      {activeTab === 'achievements' && (
        <div className="space-y-6">
          {/* Reputation Level */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Trophy className="h-5 w-5 mr-2" />
                Reputation Level
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold capitalize">
                    {profile?.reputation.level || 'Novice'}
                  </h3>
                  <p className="text-muted-foreground">
                    {profile?.reputation.points || 0} reputation points
                  </p>
                </div>
                <div className="text-right">
                  {profile?.reputation.communityRank && (
                    <div>
                      <p className="text-sm text-muted-foreground">Community Rank</p>
                      <p className="text-lg font-bold">#{profile.reputation.communityRank}</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Badges */}
          <Card>
            <CardHeader>
              <CardTitle>Earned Badges</CardTitle>
            </CardHeader>
            <CardContent>
              {!profile?.reputation.badges || profile.reputation.badges.length === 0 ? (
                <div className="text-center py-8">
                  <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Badges Yet</h3>
                  <p className="text-muted-foreground">
                    Complete reviews and help the community to earn your first badge
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {profile.reputation.badges.map((badge) => (
                    <div key={badge.badgeId} className="flex items-center space-x-3 p-4 border rounded-lg">
                      <div className={`p-3 rounded-full ${getBadgeRarityColor(badge.rarity)}`}>
                        <Award className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-semibold">{badge.name}</h4>
                          <Badge variant="outline" className={getBadgeRarityColor(badge.rarity)}>
                            {badge.rarity}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {badge.description}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Earned {badge.earnedAt.toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Endorsements */}
          {profile?.reputation.endorsements && profile.reputation.endorsements.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Skill Endorsements</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {profile.reputation.endorsements.map((endorsement) => (
                    <div key={endorsement.endorsementId} className="p-3 bg-muted rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Badge variant="secondary">{endorsement.skillEndorsed}</Badge>
                          {endorsement.isVerified && (
                            <Badge variant="outline" className="text-green-600 border-green-600">
                              Verified
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {endorsement.createdAt.toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm">{endorsement.comment}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        — {endorsement.endorserName}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}