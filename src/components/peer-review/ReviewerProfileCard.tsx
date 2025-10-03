'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { 
  User, 
  Star, 
  Clock, 
  Award, 
  Settings, 
  Plus, 
  X,
  Edit,
  Save,
  Cancel
} from 'lucide-react';
import { 
  ReviewerProfile, 
  ReviewerStats, 
  ReviewerPreferences, 
  ReviewerAvailability,
  ReviewerReputation,
  PeerReviewSettings
} from '@/types/peer-review';
import { PeerReviewService } from '@/lib/firebase/peer-review';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { EnhancedToast } from '@/components/EnhancedToast';

interface ReviewerProfileCardProps {
  profile: ReviewerProfile | null;
  userId: string;
  onProfileUpdated: () => void;
}

const SKILL_CATEGORIES = [
  'JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'Java',
  'C++', 'Go', 'Rust', 'SQL', 'System Design', 'Algorithm Design',
  'Testing', 'Security', 'Performance', 'Code Review'
];

export function ReviewerProfileCard({ 
  profile, 
  userId, 
  onProfileUpdated 
}: ReviewerProfileCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<PeerReviewSettings | null>(null);
  
  // Profile editing state
  const [username, setUsername] = useState('');
  const [skillLevels, setSkillLevels] = useState<Map<string, number>>(new Map());
  const [newSkill, setNewSkill] = useState('');
  const [preferences, setPreferences] = useState<ReviewerPreferences>({
    skillsToReview: [],
    maxReviewsPerWeek: 5,
    preferredReviewTypes: ['code_review'],
    anonymousReviewsOnly: false,
    mentorshipAvailable: false,
    collaborationInterest: false
  });
  const [availability, setAvailability] = useState<ReviewerAvailability>({
    isAvailable: true,
    timeZone: 'UTC',
    availableHours: [],
    responseTimeCommitment: 24,
    currentLoad: 0
  });

  useEffect(() => {
    if (profile) {
      setUsername(profile.username);
      setSkillLevels(new Map(profile.skillLevels));
      setPreferences(profile.preferences);
      setAvailability(profile.availability);
    }
    loadSettings();
  }, [profile, userId]);

  const loadSettings = async () => {
    try {
      const userSettings = await PeerReviewService.getPeerReviewSettings(userId);
      setSettings(userSettings);
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setLoading(true);
      
      const updatedProfile: ReviewerProfile = {
        userId,
        username,
        skillLevels,
        reviewStats: profile?.reviewStats || {
          totalReviewsCompleted: 0,
          averageRating: 0,
          averageResponseTime: 24,
          specialties: [],
          reviewsThisMonth: 0,
          helpfulnessScore: 0
        },
        preferences,
        availability,
        reputation: profile?.reputation || {
          level: 'novice',
          points: 0,
          badges: [],
          endorsements: []
        }
      };

      await PeerReviewService.createOrUpdateReviewerProfile(updatedProfile);
      setIsEditing(false);
      onProfileUpdated();
      
      EnhancedToast({
        title: "Profile Updated",
        description: "Your reviewer profile has been updated successfully.",
        type: "success"
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      EnhancedToast({
        title: "Update Failed",
        description: "Failed to update your profile. Please try again.",
        type: "error"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!settings) return;
    
    try {
      setLoading(true);
      const updatedSettings: PeerReviewSettings = {
        ...settings,
        updatedAt: new Date()
      };
      
      await PeerReviewService.updatePeerReviewSettings(updatedSettings);
      
      EnhancedToast({
        title: "Settings Updated",
        description: "Your peer review settings have been updated.",
        type: "success"
      });
    } catch (error) {
      console.error('Error updating settings:', error);
      EnhancedToast({
        title: "Update Failed",
        description: "Failed to update settings. Please try again.",
        type: "error"
      });
    } finally {
      setLoading(false);
    }
  };

  const addSkill = (skill: string) => {
    if (!skillLevels.has(skill)) {
      const newSkillLevels = new Map(skillLevels);
      newSkillLevels.set(skill, 3);
      setSkillLevels(newSkillLevels);
    }
  };

  const removeSkill = (skill: string) => {
    const newSkillLevels = new Map(skillLevels);
    newSkillLevels.delete(skill);
    setSkillLevels(newSkillLevels);
  };

  const updateSkillLevel = (skill: string, level: number) => {
    const newSkillLevels = new Map(skillLevels);
    newSkillLevels.set(skill, level);
    setSkillLevels(newSkillLevels);
  };

  const addCustomSkill = () => {
    if (newSkill.trim() && !skillLevels.has(newSkill.trim())) {
      addSkill(newSkill.trim());
      setNewSkill('');
    }
  };

  const getReputationColor = (level: string) => {
    switch (level) {
      case 'master': return 'text-purple-600 bg-purple-100';
      case 'expert': return 'text-blue-600 bg-blue-100';
      case 'mentor': return 'text-green-600 bg-green-100';
      case 'contributor': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (!profile && !isEditing) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Create Your Reviewer Profile</h3>
          <p className="text-muted-foreground mb-4">
            Set up your profile to start participating in peer reviews
          </p>
          <Button onClick={() => setIsEditing(true)}>
            Create Profile
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <User className="h-5 w-5 mr-2" />
              Reviewer Profile
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
              disabled={loading}
            >
              {isEditing ? (
                <>
                  <Cancel className="h-4 w-4 mr-2" />
                  Cancel
                </>
              ) : (
                <>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isEditing ? (
            <div className="space-y-4">
              <div>
                <Label>Username</Label>
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Your display name"
                />
              </div>
              
              <div>
                <Label>Skills & Expertise Levels</Label>
                <div className="space-y-3 mt-2">
                  {Array.from(skillLevels.entries()).map(([skill, level]) => (
                    <div key={skill} className="flex items-center space-x-3">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">{skill}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeSkill(skill)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Slider
                            value={[level]}
                            onValueChange={(value) => updateSkillLevel(skill, value[0])}
                            max={5}
                            min={1}
                            step={1}
                            className="flex-1"
                          />
                          <span className="text-sm text-muted-foreground w-8">
                            {level}/5
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <div className="border-t pt-3">
                    <div className="flex flex-wrap gap-2 mb-3">
                      {SKILL_CATEGORIES.filter(skill => !skillLevels.has(skill)).map((skill) => (
                        <Badge
                          key={skill}
                          variant="outline"
                          className="cursor-pointer hover:bg-blue-50"
                          onClick={() => addSkill(skill)}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          {skill}
                        </Badge>
                      ))}
                    </div>
                    
                    <div className="flex space-x-2">
                      <Input
                        placeholder="Add custom skill..."
                        value={newSkill}
                        onChange={(e) => setNewSkill(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addCustomSkill()}
                      />
                      <Button
                        variant="outline"
                        onClick={addCustomSkill}
                        disabled={!newSkill.trim()}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <Label>Review Preferences</Label>
                <div className="space-y-3 mt-2">
                  <div>
                    <Label className="text-sm">Max Reviews Per Week: {preferences.maxReviewsPerWeek}</Label>
                    <Slider
                      value={[preferences.maxReviewsPerWeek]}
                      onValueChange={(value) => setPreferences({
                        ...preferences,
                        maxReviewsPerWeek: value[0]
                      })}
                      max={20}
                      min={1}
                      step={1}
                      className="mt-1"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Available for Mentorship</Label>
                    <Switch
                      checked={preferences.mentorshipAvailable}
                      onCheckedChange={(checked) => setPreferences({
                        ...preferences,
                        mentorshipAvailable: checked
                      })}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Interested in Collaboration</Label>
                    <Switch
                      checked={preferences.collaborationInterest}
                      onCheckedChange={(checked) => setPreferences({
                        ...preferences,
                        collaborationInterest: checked
                      })}
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label>Availability</Label>
                <div className="space-y-3 mt-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Currently Available</Label>
                    <Switch
                      checked={availability.isAvailable}
                      onCheckedChange={(checked) => setAvailability({
                        ...availability,
                        isAvailable: checked
                      })}
                    />
                  </div>
                  
                  <div>
                    <Label className="text-sm">Response Time Commitment: {availability.responseTimeCommitment} hours</Label>
                    <Slider
                      value={[availability.responseTimeCommitment]}
                      onValueChange={(value) => setAvailability({
                        ...availability,
                        responseTimeCommitment: value[0]
                      })}
                      max={72}
                      min={1}
                      step={1}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              <Button onClick={handleSaveProfile} disabled={loading}>
                {loading ? <LoadingSpinner /> : <Save className="h-4 w-4 mr-2" />}
                Save Profile
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{profile?.username || 'Anonymous'}</h3>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge className={getReputationColor(profile?.reputation.level || 'novice')}>
                      {profile?.reputation.level || 'Novice'}
                    </Badge>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Award className="h-4 w-4 mr-1" />
                      {profile?.reputation.points || 0} points
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center text-sm">
                    <Star className="h-4 w-4 mr-1 text-yellow-400" />
                    {profile?.reviewStats.averageRating.toFixed(1) || '0.0'}
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Clock className="h-4 w-4 mr-1" />
                    {profile?.reviewStats.averageResponseTime || 0}h avg
                  </div>
                </div>
              </div>

              {profile?.skillLevels && profile.skillLevels.size > 0 && (
                <div>
                  <Label className="text-sm font-medium">Skills & Expertise</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {Array.from(profile.skillLevels.entries()).map(([skill, level]) => (
                      <Badge key={skill} variant="secondary" className="text-xs">
                        {skill} ({level}/5)
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-xs text-muted-foreground">Reviews Completed</Label>
                  <p className="font-medium">{profile?.reviewStats.totalReviewsCompleted || 0}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">This Month</Label>
                  <p className="font-medium">{profile?.reviewStats.reviewsThisMonth || 0}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Helpfulness Score</Label>
                  <p className="font-medium">{profile?.reviewStats.helpfulnessScore.toFixed(1) || '0.0'}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Current Load</Label>
                  <p className="font-medium">{profile?.availability.currentLoad || 0} active</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Settings */}
      {settings && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="h-5 w-5 mr-2" />
              Privacy & Notification Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Profile Visibility</Label>
                <select
                  className="text-sm border rounded px-2 py-1"
                  value={settings.profileVisibility}
                  onChange={(e) => setSettings({
                    ...settings,
                    profileVisibility: e.target.value as typeof settings.profileVisibility
                  })}
                >
                  <option value="public">Public</option>
                  <option value="community">Community</option>
                  <option value="private">Private</option>
                </select>
              </div>
              
              <div className="flex items-center justify-between">
                <Label className="text-sm">Email Notifications</Label>
                <Switch
                  checked={settings.emailNotifications}
                  onCheckedChange={(checked) => setSettings({
                    ...settings,
                    emailNotifications: checked
                  })}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label className="text-sm">Allow Anonymous Reviews</Label>
                <Switch
                  checked={settings.allowAnonymousReviews}
                  onCheckedChange={(checked) => setSettings({
                    ...settings,
                    allowAnonymousReviews: checked
                  })}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label className="text-sm">Auto-Accept Reviews</Label>
                <Switch
                  checked={settings.autoAcceptReviews}
                  onCheckedChange={(checked) => setSettings({
                    ...settings,
                    autoAcceptReviews: checked
                  })}
                />
              </div>
            </div>
            
            <Button onClick={handleSaveSettings} disabled={loading} size="sm">
              {loading ? <LoadingSpinner /> : 'Save Settings'}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}