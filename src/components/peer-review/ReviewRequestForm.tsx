'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { 
  MessageSquare, 
  Clock, 
  Users, 
  Plus, 
  X,
  AlertCircle
} from 'lucide-react';
import { PeerReviewRequest } from '@/types/peer-review';
import { useAuth } from '@/hooks/useAuth';

interface ReviewRequestFormProps {
  codeSubmissionId?: string;
  onSubmit: (request: PeerReviewRequest) => void;
  onCancel: () => void;
}

const COMMON_SKILLS = [
  'JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'Java',
  'C++', 'Go', 'Rust', 'SQL', 'MongoDB', 'PostgreSQL', 'Redis',
  'Docker', 'Kubernetes', 'AWS', 'Azure', 'GCP', 'Git', 'Testing',
  'Algorithm Design', 'System Design', 'Security', 'Performance',
  'Code Review', 'Debugging', 'Refactoring', 'Clean Code'
];

export function ReviewRequestForm({
  codeSubmissionId,
  onSubmit,
  onCancel
}: ReviewRequestFormProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [skillLevel, setSkillLevel] = useState<'beginner' | 'intermediate' | 'advanced' | 'expert'>('intermediate');
  const [skillsRequested, setSkillsRequested] = useState<string[]>([]);
  const [customSkill, setCustomSkill] = useState('');
  const [urgency, setUrgency] = useState<'low' | 'medium' | 'high'>('medium');
  const [estimatedReviewTime, setEstimatedReviewTime] = useState(30);
  const [preferredReviewerLevel, setPreferredReviewerLevel] = useState<'peer' | 'mentor' | 'expert' | 'any'>('any');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [maxReviewers, setMaxReviewers] = useState(3);

  const addSkill = (skill: string) => {
    if (!skillsRequested.includes(skill)) {
      setSkillsRequested([...skillsRequested, skill]);
    }
  };

  const removeSkill = (skill: string) => {
    setSkillsRequested(skillsRequested.filter(s => s !== skill));
  };

  const addCustomSkill = () => {
    if (customSkill.trim() && !skillsRequested.includes(customSkill.trim())) {
      setSkillsRequested([...skillsRequested, customSkill.trim()]);
      setCustomSkill('');
    }
  };

  const handleSubmit = () => {
    if (!user || !title.trim() || !description.trim() || skillsRequested.length === 0) {
      return;
    }

    const request: PeerReviewRequest = {
      requestId: `request_${Date.now()}_${user.uid}`,
      requesterId: user.uid,
      codeSubmissionId: codeSubmissionId || '',
      title: title.trim(),
      description: description.trim(),
      skillLevel,
      skillsRequested,
      urgency,
      estimatedReviewTime,
      preferredReviewerLevel,
      isAnonymous,
      maxReviewers,
      status: 'open',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      assignedReviewers: [],
      completedReviews: []
    };

    onSubmit(request);
  };

  const isFormValid = () => {
    return title.trim() && 
           description.trim() && 
           skillsRequested.length > 0 &&
           estimatedReviewTime > 0 &&
           maxReviewers > 0;
  };

  const getUrgencyColor = (level: string) => {
    switch (level) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSkillLevelColor = (level: string) => {
    switch (level) {
      case 'expert': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'advanced': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'intermediate': return 'bg-green-100 text-green-800 border-green-200';
      case 'beginner': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Dialog open onOpenChange={onCancel}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <MessageSquare className="h-5 w-5 mr-2" />
            Request Peer Review
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div>
                <Label htmlFor="title">Review Title *</Label>
                <Input
                  id="title"
                  placeholder="Brief title for your review request..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Describe what you'd like reviewed and any specific areas of focus..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1"
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Skills and Level */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div>
                <Label>Your Skill Level</Label>
                <div className="flex space-x-2 mt-2">
                  {(['beginner', 'intermediate', 'advanced', 'expert'] as const).map((level) => (
                    <Button
                      key={level}
                      variant={skillLevel === level ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSkillLevel(level)}
                      className={skillLevel === level ? getSkillLevelColor(level) : ''}
                    >
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label>Skills to Review *</Label>
                <div className="mt-2 space-y-3">
                  {/* Selected Skills */}
                  {skillsRequested.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {skillsRequested.map((skill) => (
                        <Badge
                          key={skill}
                          variant="secondary"
                          className="cursor-pointer hover:bg-red-100"
                          onClick={() => removeSkill(skill)}
                        >
                          {skill}
                          <X className="h-3 w-3 ml-1" />
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Common Skills */}
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Common Skills:</p>
                    <div className="flex flex-wrap gap-2">
                      {COMMON_SKILLS.filter(skill => !skillsRequested.includes(skill)).map((skill) => (
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
                  </div>

                  {/* Custom Skill Input */}
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Add custom skill..."
                      value={customSkill}
                      onChange={(e) => setCustomSkill(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addCustomSkill()}
                    />
                    <Button
                      variant="outline"
                      onClick={addCustomSkill}
                      disabled={!customSkill.trim()}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Review Preferences */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div>
                <Label>Urgency Level</Label>
                <div className="flex space-x-2 mt-2">
                  {(['low', 'medium', 'high'] as const).map((level) => (
                    <Button
                      key={level}
                      variant={urgency === level ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setUrgency(level)}
                      className={urgency === level ? getUrgencyColor(level) : ''}
                    >
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label>Estimated Review Time: {estimatedReviewTime} minutes</Label>
                <Slider
                  value={[estimatedReviewTime]}
                  onValueChange={(value) => setEstimatedReviewTime(value[0])}
                  max={120}
                  min={15}
                  step={15}
                  className="mt-2"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>15 min</span>
                  <span>2 hours</span>
                </div>
              </div>

              <div>
                <Label>Preferred Reviewer Level</Label>
                <select
                  className="w-full p-2 border rounded mt-1"
                  value={preferredReviewerLevel}
                  onChange={(e) => setPreferredReviewerLevel(e.target.value as typeof preferredReviewerLevel)}
                >
                  <option value="any">Any Level</option>
                  <option value="peer">Peer Level</option>
                  <option value="mentor">Mentor Level</option>
                  <option value="expert">Expert Level</option>
                </select>
              </div>

              <div>
                <Label>Maximum Reviewers: {maxReviewers}</Label>
                <Slider
                  value={[maxReviewers]}
                  onValueChange={(value) => setMaxReviewers(value[0])}
                  max={5}
                  min={1}
                  step={1}
                  className="mt-2"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>1 reviewer</span>
                  <span>5 reviewers</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Privacy Settings */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Anonymous Request</Label>
                  <p className="text-sm text-muted-foreground">
                    Hide your identity from reviewers
                  </p>
                </div>
                <Switch
                  checked={isAnonymous}
                  onCheckedChange={setIsAnonymous}
                />
              </div>
            </CardContent>
          </Card>

          {/* Preview */}
          <Card>
            <CardContent className="pt-6">
              <Label className="text-base font-semibold">Request Preview</Label>
              <div className="mt-3 p-4 bg-muted rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">{title || 'Your Review Title'}</h4>
                  <Badge className={getUrgencyColor(urgency)}>
                    {urgency} priority
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {description || 'Your description will appear here...'}
                </p>
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    {estimatedReviewTime}min
                  </div>
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-1" />
                    0/{maxReviewers}
                  </div>
                  <Badge variant="outline" className={getSkillLevelColor(skillLevel)}>
                    {skillLevel}
                  </Badge>
                </div>
                {skillsRequested.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {skillsRequested.map((skill) => (
                      <Badge key={skill} variant="outline" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Validation Messages */}
          {!isFormValid() && (
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="pt-6">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="h-5 w-5 text-orange-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-orange-800">
                      Please complete the following:
                    </p>
                    <ul className="text-sm text-orange-700 mt-1 space-y-1">
                      {!title.trim() && <li>• Add a review title</li>}
                      {!description.trim() && <li>• Add a description</li>}
                      {skillsRequested.length === 0 && <li>• Select at least one skill</li>}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={!isFormValid()}
            >
              Create Request
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}