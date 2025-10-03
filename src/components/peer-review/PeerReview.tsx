'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Star, 
  MessageSquare, 
  Users, 
  Award, 
  Clock, 
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import { PeerReview as PeerReviewType, PeerReviewRequest, ReviewerProfile } from '@/types/peer-review';
import { PeerReviewService } from '@/lib/firebase/peer-review';
import { useAuth } from '@/hooks/useAuth';
import { PeerReviewForm } from './PeerReviewForm';
import { ReviewRequestForm } from './ReviewRequestForm';
import { ReviewerProfileCard } from './ReviewerProfileCard';
import { CommunityContributions } from './CommunityContributions';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { EnhancedToast } from '@/components/EnhancedToast';

interface PeerReviewProps {
  codeSubmissionId?: string;
  sessionId?: string;
  initialTab?: 'reviews' | 'requests' | 'community' | 'profile';
}

export function PeerReview({ 
  codeSubmissionId, 
  sessionId, 
  initialTab = 'reviews' 
}: PeerReviewProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [reviews, setReviews] = useState<PeerReviewType[]>([]);
  const [reviewRequests, setReviewRequests] = useState<PeerReviewRequest[]>([]);
  const [reviewerProfile, setReviewerProfile] = useState<ReviewerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<PeerReviewRequest | null>(null);

  useEffect(() => {
    if (user) {
      loadPeerReviewData();
    }
  }, [user]);

  const loadPeerReviewData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // Load user's reviews (both given and received)
      const [receivedReviews, givenReviews, openRequests, profile] = await Promise.all([
        PeerReviewService.getReviewsForUser(user.uid, 'reviewee'),
        PeerReviewService.getReviewsForUser(user.uid, 'reviewer'),
        PeerReviewService.getOpenReviewRequests(),
        PeerReviewService.getReviewerProfile(user.uid)
      ]);

      setReviews([...receivedReviews, ...givenReviews]);
      setReviewRequests(openRequests);
      setReviewerProfile(profile);
    } catch (err) {
      console.error('Error loading peer review data:', err);
      setError('Failed to load peer review data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReviewSubmitted = async (review: PeerReviewType) => {
    try {
      await PeerReviewService.createPeerReview(review);
      setShowReviewForm(false);
      setSelectedRequest(null);
      await loadPeerReviewData();
      
      EnhancedToast({
        title: "Review Submitted",
        description: "Your peer review has been submitted successfully.",
        type: "success"
      });
    } catch (err) {
      console.error('Error submitting review:', err);
      EnhancedToast({
        title: "Submission Failed",
        description: "Failed to submit your review. Please try again.",
        type: "error"
      });
    }
  };

  const handleRequestSubmitted = async (request: PeerReviewRequest) => {
    try {
      await PeerReviewService.createReviewRequest(request);
      setShowRequestForm(false);
      await loadPeerReviewData();
      
      EnhancedToast({
        title: "Review Request Created",
        description: "Your review request has been posted to the community.",
        type: "success"
      });
    } catch (err) {
      console.error('Error creating review request:', err);
      EnhancedToast({
        title: "Request Failed",
        description: "Failed to create your review request. Please try again.",
        type: "error"
      });
    }
  };

  const handleAcceptReviewRequest = (request: PeerReviewRequest) => {
    setSelectedRequest(request);
    setShowReviewForm(true);
  };

  const renderReviewCard = (review: PeerReviewType) => {
    const isReviewer = review.reviewerId === user?.uid;
    const displayName = isReviewer ? 'You reviewed' : 'Review from';
    const otherUserId = isReviewer ? review.revieweeId : review.reviewerId;

    return (
      <Card key={review.reviewId} className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback>
                  {otherUserId.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{displayName}</p>
                <p className="text-xs text-muted-foreground">
                  {review.createdAt.toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < review.overallRating
                        ? 'text-yellow-400 fill-current'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <Badge variant={review.status === 'completed' ? 'default' : 'secondary'}>
                {review.status}
              </Badge>
              {review.isAnonymous && (
                <Badge variant="outline" className="text-xs">
                  <EyeOff className="h-3 w-3 mr-1" />
                  Anonymous
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {review.feedback.strengths.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-green-700 mb-1">Strengths</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {review.feedback.strengths.map((strength, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                      {strength}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {review.feedback.improvementAreas.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-orange-700 mb-1">Areas for Improvement</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {review.feedback.improvementAreas.map((area, index) => (
                    <li key={index} className="flex items-start">
                      <AlertCircle className="h-3 w-3 text-orange-500 mt-0.5 mr-2 flex-shrink-0" />
                      {area}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {review.feedback.generalComments && (
              <div>
                <h4 className="text-sm font-medium mb-1">General Comments</h4>
                <p className="text-sm text-muted-foreground">{review.feedback.generalComments}</p>
              </div>
            )}

            {review.suggestions.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Code Suggestions</h4>
                <div className="space-y-2">
                  {review.suggestions.slice(0, 3).map((suggestion, index) => (
                    <div key={index} className="bg-muted p-2 rounded text-sm">
                      <Badge variant="outline" className="mb-1 text-xs">
                        {suggestion.category}
                      </Badge>
                      <p className="text-muted-foreground">{suggestion.explanation}</p>
                    </div>
                  ))}
                  {review.suggestions.length > 3 && (
                    <p className="text-xs text-muted-foreground">
                      +{review.suggestions.length - 3} more suggestions
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderRequestCard = (request: PeerReviewRequest) => {
    const canReview = user?.uid !== request.requesterId && 
                     !request.assignedReviewers.includes(user?.uid || '');

    return (
      <Card key={request.requestId} className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">{request.title}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {request.description}
              </p>
            </div>
            <Badge variant={request.urgency === 'high' ? 'destructive' : 'secondary'}>
              {request.urgency} priority
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                {request.estimatedReviewTime}min
              </div>
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-1" />
                {request.assignedReviewers.length}/{request.maxReviewers}
              </div>
              <Badge variant="outline">{request.skillLevel}</Badge>
            </div>
            {canReview && (
              <Button 
                size="sm" 
                onClick={() => handleAcceptReviewRequest(request)}
              >
                Accept Review
              </Button>
            )}
          </div>
          <div className="mt-3">
            <div className="flex flex-wrap gap-1">
              {request.skillsRequested.map((skill, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Error Loading Peer Reviews</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={loadPeerReviewData}>Try Again</Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Peer Review System</h2>
          <p className="text-muted-foreground">
            Collaborate with the community to improve your coding skills
          </p>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={() => setShowRequestForm(true)}
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Request Review
          </Button>
          {codeSubmissionId && (
            <Button onClick={() => setShowReviewForm(true)}>
              <Star className="h-4 w-4 mr-2" />
              Give Review
            </Button>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="reviews">My Reviews</TabsTrigger>
          <TabsTrigger value="requests">Open Requests</TabsTrigger>
          <TabsTrigger value="community">Community</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
        </TabsList>

        <TabsContent value="reviews" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Your Reviews</h3>
            <Badge variant="secondary">{reviews.length} total</Badge>
          </div>
          
          {reviews.length === 0 ? (
            <Card className="p-6 text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Reviews Yet</h3>
              <p className="text-muted-foreground mb-4">
                Start by requesting a review or reviewing others' code
              </p>
              <Button onClick={() => setShowRequestForm(true)}>
                Request Your First Review
              </Button>
            </Card>
          ) : (
            <div className="space-y-4">
              {reviews.map(renderReviewCard)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="requests" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Open Review Requests</h3>
            <Badge variant="secondary">{reviewRequests.length} available</Badge>
          </div>
          
          {reviewRequests.length === 0 ? (
            <Card className="p-6 text-center">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Open Requests</h3>
              <p className="text-muted-foreground">
                Check back later for new review requests from the community
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {reviewRequests.map(renderRequestCard)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="community">
          <CommunityContributions userId={user?.uid || ''} />
        </TabsContent>

        <TabsContent value="profile">
          <ReviewerProfileCard 
            profile={reviewerProfile} 
            userId={user?.uid || ''} 
            onProfileUpdated={loadPeerReviewData}
          />
        </TabsContent>
      </Tabs>

      {/* Review Form Modal */}
      {showReviewForm && (
        <PeerReviewForm
          codeSubmissionId={codeSubmissionId}
          sessionId={sessionId}
          reviewRequest={selectedRequest}
          onSubmit={handleReviewSubmitted}
          onCancel={() => {
            setShowReviewForm(false);
            setSelectedRequest(null);
          }}
        />
      )}

      {/* Request Form Modal */}
      {showRequestForm && (
        <ReviewRequestForm
          codeSubmissionId={codeSubmissionId}
          onSubmit={handleRequestSubmitted}
          onCancel={() => setShowRequestForm(false)}
        />
      )}
    </div>
  );
}