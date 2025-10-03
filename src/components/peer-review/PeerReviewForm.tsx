'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { 
  Star, 
  Plus, 
  X, 
  Code, 
  Lightbulb, 
  Shield, 
  Zap,
  CheckCircle
} from 'lucide-react';
import { 
  PeerReview, 
  PeerReviewRequest, 
  CodeSuggestion, 
  PeerFeedback,
  CodeQualityFeedback,
  BestPracticesFeedback
} from '@/types/peer-review';
import { useAuth } from '@/hooks/useAuth';

interface PeerReviewFormProps {
  codeSubmissionId?: string;
  sessionId?: string;
  reviewRequest?: PeerReviewRequest | null;
  onSubmit: (review: PeerReview) => void;
  onCancel: () => void;
}

export function PeerReviewForm({
  codeSubmissionId,
  sessionId,
  reviewRequest,
  onSubmit,
  onCancel
}: PeerReviewFormProps) {
  const { user } = useAuth();
  const [overallRating, setOverallRating] = useState(3);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [visibility, setVisibility] = useState<'public' | 'private' | 'community'>('community');
  
  // Feedback state
  const [strengths, setStrengths] = useState<string[]>(['']);
  const [improvementAreas, setImprovementAreas] = useState<string[]>(['']);
  const [generalComments, setGeneralComments] = useState('');
  const [encouragement, setEncouragement] = useState('');
  
  // Code quality ratings
  const [readability, setReadability] = useState(3);
  const [efficiency, setEfficiency] = useState(3);
  const [maintainability, setMaintainability] = useState(3);
  const [testability, setTestability] = useState(3);
  const [qualityComments, setQualityComments] = useState<string[]>(['']);
  
  // Best practices
  const [followsConventions, setFollowsConventions] = useState(true);
  const [properErrorHandling, setProperErrorHandling] = useState(true);
  const [securityConsiderations, setSecurityConsiderations] = useState(true);
  const [performanceOptimizations, setPerformanceOptimizations] = useState(true);
  const [practiceComments, setPracticeComments] = useState<string[]>(['']);
  
  // Code suggestions
  const [suggestions, setSuggestions] = useState<CodeSuggestion[]>([]);
  const [newSuggestion, setNewSuggestion] = useState({
    suggestedCode: '',
    explanation: '',
    category: 'improvement' as CodeSuggestion['category'],
    priority: 'medium' as CodeSuggestion['priority']
  });

  const addStrength = () => setStrengths([...strengths, '']);
  const removeStrength = (index: number) => setStrengths(strengths.filter((_, i) => i !== index));
  const updateStrength = (index: number, value: string) => {
    const updated = [...strengths];
    updated[index] = value;
    setStrengths(updated);
  };

  const addImprovementArea = () => setImprovementAreas([...improvementAreas, '']);
  const removeImprovementArea = (index: number) => setImprovementAreas(improvementAreas.filter((_, i) => i !== index));
  const updateImprovementArea = (index: number, value: string) => {
    const updated = [...improvementAreas];
    updated[index] = value;
    setImprovementAreas(updated);
  };

  const addQualityComment = () => setQualityComments([...qualityComments, '']);
  const removeQualityComment = (index: number) => setQualityComments(qualityComments.filter((_, i) => i !== index));
  const updateQualityComment = (index: number, value: string) => {
    const updated = [...qualityComments];
    updated[index] = value;
    setQualityComments(updated);
  };

  const addPracticeComment = () => setPracticeComments([...practiceComments, '']);
  const removePracticeComment = (index: number) => setPracticeComments(practiceComments.filter((_, i) => i !== index));
  const updatePracticeComment = (index: number, value: string) => {
    const updated = [...practiceComments];
    updated[index] = value;
    setPracticeComments(updated);
  };

  const addSuggestion = () => {
    if (newSuggestion.suggestedCode && newSuggestion.explanation) {
      const suggestion: CodeSuggestion = {
        suggestionId: `suggestion_${Date.now()}`,
        suggestedCode: newSuggestion.suggestedCode,
        explanation: newSuggestion.explanation,
        category: newSuggestion.category,
        priority: newSuggestion.priority
      };
      setSuggestions([...suggestions, suggestion]);
      setNewSuggestion({
        suggestedCode: '',
        explanation: '',
        category: 'improvement',
        priority: 'medium'
      });
    }
  };

  const removeSuggestion = (index: number) => {
    setSuggestions(suggestions.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!user) return;

    const feedback: PeerFeedback = {
      strengths: strengths.filter(s => s.trim()),
      improvementAreas: improvementAreas.filter(a => a.trim()),
      codeQuality: {
        readability,
        efficiency,
        maintainability,
        testability,
        comments: qualityComments.filter(c => c.trim())
      },
      bestPractices: {
        followsConventions,
        properErrorHandling,
        securityConsiderations,
        performanceOptimizations,
        comments: practiceComments.filter(c => c.trim())
      },
      generalComments,
      encouragement
    };

    const review: PeerReview = {
      reviewId: `review_${Date.now()}_${user.uid}`,
      reviewerId: user.uid,
      revieweeId: reviewRequest?.requesterId || 'unknown',
      codeSubmissionId: codeSubmissionId || reviewRequest?.codeSubmissionId || '',
      sessionId,
      type: 'code_review',
      status: 'completed',
      overallRating,
      feedback,
      suggestions,
      createdAt: new Date(),
      updatedAt: new Date(),
      completedAt: new Date(),
      isAnonymous,
      visibility
    };

    onSubmit(review);
  };

  const isFormValid = () => {
    return strengths.some(s => s.trim()) || 
           improvementAreas.some(a => a.trim()) || 
           generalComments.trim();
  };

  return (
    <Dialog open onOpenChange={onCancel}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Provide Peer Review</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Overall Rating */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Star className="h-5 w-5 mr-2" />
                Overall Rating
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <Star
                      key={rating}
                      className={`h-6 w-6 cursor-pointer ${
                        rating <= overallRating
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300'
                      }`}
                      onClick={() => setOverallRating(rating)}
                    />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">
                  {overallRating}/5 stars
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Strengths */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
                Strengths
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {strengths.map((strength, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Input
                    placeholder="What did they do well?"
                    value={strength}
                    onChange={(e) => updateStrength(index, e.target.value)}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeStrength(index)}
                    disabled={strengths.length === 1}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" onClick={addStrength}>
                <Plus className="h-4 w-4 mr-2" />
                Add Strength
              </Button>
            </CardContent>
          </Card>

          {/* Improvement Areas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Lightbulb className="h-5 w-5 mr-2 text-orange-500" />
                Areas for Improvement
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {improvementAreas.map((area, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Input
                    placeholder="What could be improved?"
                    value={area}
                    onChange={(e) => updateImprovementArea(index, e.target.value)}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeImprovementArea(index)}
                    disabled={improvementAreas.length === 1}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" onClick={addImprovementArea}>
                <Plus className="h-4 w-4 mr-2" />
                Add Improvement Area
              </Button>
            </CardContent>
          </Card>

          {/* Code Quality Ratings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Code className="h-5 w-5 mr-2" />
                Code Quality Assessment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Readability ({readability}/5)</Label>
                  <Slider
                    value={[readability]}
                    onValueChange={(value) => setReadability(value[0])}
                    max={5}
                    min={1}
                    step={1}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>Efficiency ({efficiency}/5)</Label>
                  <Slider
                    value={[efficiency]}
                    onValueChange={(value) => setEfficiency(value[0])}
                    max={5}
                    min={1}
                    step={1}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>Maintainability ({maintainability}/5)</Label>
                  <Slider
                    value={[maintainability]}
                    onValueChange={(value) => setMaintainability(value[0])}
                    max={5}
                    min={1}
                    step={1}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>Testability ({testability}/5)</Label>
                  <Slider
                    value={[testability]}
                    onValueChange={(value) => setTestability(value[0])}
                    max={5}
                    min={1}
                    step={1}
                    className="mt-2"
                  />
                </div>
              </div>
              
              <div className="space-y-3">
                <Label>Quality Comments</Label>
                {qualityComments.map((comment, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Input
                      placeholder="Additional quality observations..."
                      value={comment}
                      onChange={(e) => updateQualityComment(index, e.target.value)}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeQualityComment(index)}
                      disabled={qualityComments.length === 1}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button variant="outline" onClick={addQualityComment}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Comment
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Best Practices */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Shield className="h-5 w-5 mr-2" />
                Best Practices
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <Label>Follows Conventions</Label>
                  <Switch
                    checked={followsConventions}
                    onCheckedChange={setFollowsConventions}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Proper Error Handling</Label>
                  <Switch
                    checked={properErrorHandling}
                    onCheckedChange={setProperErrorHandling}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Security Considerations</Label>
                  <Switch
                    checked={securityConsiderations}
                    onCheckedChange={setSecurityConsiderations}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Performance Optimizations</Label>
                  <Switch
                    checked={performanceOptimizations}
                    onCheckedChange={setPerformanceOptimizations}
                  />
                </div>
              </div>
              
              <div className="space-y-3">
                <Label>Practice Comments</Label>
                {practiceComments.map((comment, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Input
                      placeholder="Best practice observations..."
                      value={comment}
                      onChange={(e) => updatePracticeComment(index, e.target.value)}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removePracticeComment(index)}
                      disabled={practiceComments.length === 1}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button variant="outline" onClick={addPracticeComment}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Comment
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Code Suggestions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Zap className="h-5 w-5 mr-2" />
                Code Suggestions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {suggestions.map((suggestion, index) => (
                <div key={index} className="border rounded p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">{suggestion.category}</Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeSuggestion(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-sm">{suggestion.explanation}</p>
                  <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                    {suggestion.suggestedCode}
                  </pre>
                </div>
              ))}
              
              <div className="border rounded p-3 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>Category</Label>
                    <select
                      className="w-full p-2 border rounded"
                      value={newSuggestion.category}
                      onChange={(e) => setNewSuggestion({
                        ...newSuggestion,
                        category: e.target.value as CodeSuggestion['category']
                      })}
                    >
                      <option value="bug_fix">Bug Fix</option>
                      <option value="optimization">Optimization</option>
                      <option value="style">Style</option>
                      <option value="best_practice">Best Practice</option>
                      <option value="security">Security</option>
                    </select>
                  </div>
                  <div>
                    <Label>Priority</Label>
                    <select
                      className="w-full p-2 border rounded"
                      value={newSuggestion.priority}
                      onChange={(e) => setNewSuggestion({
                        ...newSuggestion,
                        priority: e.target.value as CodeSuggestion['priority']
                      })}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>
                <div>
                  <Label>Explanation</Label>
                  <Textarea
                    placeholder="Explain your suggestion..."
                    value={newSuggestion.explanation}
                    onChange={(e) => setNewSuggestion({
                      ...newSuggestion,
                      explanation: e.target.value
                    })}
                  />
                </div>
                <div>
                  <Label>Suggested Code</Label>
                  <Textarea
                    placeholder="Provide your code suggestion..."
                    value={newSuggestion.suggestedCode}
                    onChange={(e) => setNewSuggestion({
                      ...newSuggestion,
                      suggestedCode: e.target.value
                    })}
                    className="font-mono text-sm"
                  />
                </div>
                <Button onClick={addSuggestion}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Suggestion
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* General Comments and Encouragement */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Feedback</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>General Comments</Label>
                <Textarea
                  placeholder="Any additional observations or feedback..."
                  value={generalComments}
                  onChange={(e) => setGeneralComments(e.target.value)}
                />
              </div>
              <div>
                <Label>Encouragement</Label>
                <Textarea
                  placeholder="Positive words of encouragement..."
                  value={encouragement}
                  onChange={(e) => setEncouragement(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Review Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Review Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Anonymous Review</Label>
                <Switch
                  checked={isAnonymous}
                  onCheckedChange={setIsAnonymous}
                />
              </div>
              <div>
                <Label>Visibility</Label>
                <select
                  className="w-full p-2 border rounded mt-1"
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value as typeof visibility)}
                >
                  <option value="community">Community (visible to all)</option>
                  <option value="private">Private (only reviewee)</option>
                  <option value="public">Public (searchable)</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={!isFormValid()}
            >
              Submit Review
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}