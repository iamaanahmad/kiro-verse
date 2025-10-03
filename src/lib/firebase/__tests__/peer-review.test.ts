import { PeerReviewService } from '../peer-review';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs,
  collection
} from 'firebase/firestore';
import { PeerReview, PeerReviewRequest, ReviewerProfile } from '@/types/peer-review';

// Mock Firebase
jest.mock('firebase/firestore');
jest.mock('../config', () => ({
  db: {}
}));

const mockDoc = doc as jest.MockedFunction<typeof doc>;
const mockGetDoc = getDoc as jest.MockedFunction<typeof getDoc>;
const mockSetDoc = setDoc as jest.MockedFunction<typeof setDoc>;
const mockUpdateDoc = updateDoc as jest.MockedFunction<typeof updateDoc>;
const mockQuery = query as jest.MockedFunction<typeof query>;
const mockWhere = where as jest.MockedFunction<typeof where>;
const mockOrderBy = orderBy as jest.MockedFunction<typeof orderBy>;
const mockLimit = limit as jest.MockedFunction<typeof limit>;
const mockGetDocs = getDocs as jest.MockedFunction<typeof getDocs>;
const mockCollection = collection as jest.MockedFunction<typeof collection>;

const mockPeerReview: PeerReview = {
  reviewId: 'review-1',
  reviewerId: 'reviewer-1',
  revieweeId: 'reviewee-1',
  codeSubmissionId: 'code-1',
  type: 'code_review',
  status: 'completed',
  overallRating: 4,
  feedback: {
    strengths: ['Good structure'],
    improvementAreas: ['Add tests'],
    codeQuality: {
      readability: 4,
      efficiency: 3,
      maintainability: 4,
      testability: 2,
      comments: ['Well organized']
    },
    bestPractices: {
      followsConventions: true,
      properErrorHandling: false,
      securityConsiderations: true,
      performanceOptimizations: false,
      comments: ['Good conventions']
    },
    generalComments: 'Good work overall',
    encouragement: 'Keep improving!'
  },
  suggestions: [],
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  completedAt: new Date('2024-01-01'),
  isAnonymous: false,
  visibility: 'community'
};

const mockReviewRequest: PeerReviewRequest = {
  requestId: 'request-1',
  requesterId: 'requester-1',
  codeSubmissionId: 'code-1',
  title: 'Review my code',
  description: 'Please review for best practices',
  skillLevel: 'intermediate',
  skillsRequested: ['JavaScript', 'React'],
  urgency: 'medium',
  estimatedReviewTime: 30,
  preferredReviewerLevel: 'any',
  isAnonymous: false,
  maxReviewers: 3,
  status: 'open',
  createdAt: new Date('2024-01-01'),
  expiresAt: new Date('2024-01-08'),
  assignedReviewers: [],
  completedReviews: []
};

describe('PeerReviewService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createPeerReview', () => {
    it('should create a peer review successfully', async () => {
      mockDoc.mockReturnValue({} as any);
      mockSetDoc.mockResolvedValue(undefined);

      const result = await PeerReviewService.createPeerReview(mockPeerReview);

      expect(result).toBe(mockPeerReview.reviewId);
      expect(mockSetDoc).toHaveBeenCalledWith(
        {},
        expect.objectContaining({
          reviewId: mockPeerReview.reviewId,
          reviewerId: mockPeerReview.reviewerId,
          revieweeId: mockPeerReview.revieweeId
        })
      );
    });

    it('should handle creation errors', async () => {
      mockDoc.mockReturnValue({} as any);
      mockSetDoc.mockRejectedValue(new Error('Firestore error'));

      await expect(PeerReviewService.createPeerReview(mockPeerReview))
        .rejects.toThrow('Firestore error');
    });
  });

  describe('getPeerReview', () => {
    it('should retrieve a peer review successfully', async () => {
      const mockDocSnap = {
        exists: () => true,
        data: () => ({
          ...mockPeerReview,
          createdAt: mockPeerReview.createdAt.toISOString(),
          updatedAt: mockPeerReview.updatedAt.toISOString(),
          completedAt: mockPeerReview.completedAt?.toISOString()
        })
      };

      mockDoc.mockReturnValue({} as any);
      mockGetDoc.mockResolvedValue(mockDocSnap as any);

      const result = await PeerReviewService.getPeerReview('review-1');

      expect(result).toEqual(expect.objectContaining({
        reviewId: mockPeerReview.reviewId,
        reviewerId: mockPeerReview.reviewerId
      }));
      expect(result?.createdAt).toBeInstanceOf(Date);
    });

    it('should return null when review does not exist', async () => {
      const mockDocSnap = {
        exists: () => false
      };

      mockDoc.mockReturnValue({} as any);
      mockGetDoc.mockResolvedValue(mockDocSnap as any);

      const result = await PeerReviewService.getPeerReview('nonexistent');

      expect(result).toBeNull();
    });

    it('should handle retrieval errors', async () => {
      mockDoc.mockReturnValue({} as any);
      mockGetDoc.mockRejectedValue(new Error('Firestore error'));

      await expect(PeerReviewService.getPeerReview('review-1'))
        .rejects.toThrow('Firestore error');
    });
  });

  describe('updatePeerReview', () => {
    it('should update a peer review successfully', async () => {
      mockDoc.mockReturnValue({} as any);
      mockUpdateDoc.mockResolvedValue(undefined);

      const updates = { status: 'completed' as const, updatedAt: new Date() };
      await PeerReviewService.updatePeerReview('review-1', updates);

      expect(mockUpdateDoc).toHaveBeenCalledWith(
        {},
        expect.objectContaining({
          status: 'completed',
          updatedAt: expect.any(String)
        })
      );
    });

    it('should handle update errors', async () => {
      mockDoc.mockReturnValue({} as any);
      mockUpdateDoc.mockRejectedValue(new Error('Firestore error'));

      await expect(PeerReviewService.updatePeerReview('review-1', {}))
        .rejects.toThrow('Firestore error');
    });
  });

  describe('getReviewsForUser', () => {
    it('should retrieve reviews for a user as reviewee', async () => {
      const mockQuerySnapshot = {
        forEach: jest.fn((callback) => {
          callback({
            data: () => ({
              ...mockPeerReview,
              createdAt: mockPeerReview.createdAt.toISOString(),
              updatedAt: mockPeerReview.updatedAt.toISOString(),
              completedAt: mockPeerReview.completedAt?.toISOString()
            })
          });
        })
      };

      mockCollection.mockReturnValue({} as any);
      mockQuery.mockReturnValue({} as any);
      mockWhere.mockReturnValue({} as any);
      mockOrderBy.mockReturnValue({} as any);
      mockLimit.mockReturnValue({} as any);
      mockGetDocs.mockResolvedValue(mockQuerySnapshot as any);

      const result = await PeerReviewService.getReviewsForUser('user-1', 'reviewee');

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(expect.objectContaining({
        reviewId: mockPeerReview.reviewId
      }));
    });

    it('should retrieve reviews for a user as reviewer', async () => {
      const mockQuerySnapshot = {
        forEach: jest.fn()
      };

      mockCollection.mockReturnValue({} as any);
      mockQuery.mockReturnValue({} as any);
      mockWhere.mockReturnValue({} as any);
      mockOrderBy.mockReturnValue({} as any);
      mockLimit.mockReturnValue({} as any);
      mockGetDocs.mockResolvedValue(mockQuerySnapshot as any);

      const result = await PeerReviewService.getReviewsForUser('user-1', 'reviewer');

      expect(result).toHaveLength(0);
      expect(mockWhere).toHaveBeenCalledWith('reviewerId', '==', 'user-1');
    });

    it('should handle query errors', async () => {
      mockCollection.mockReturnValue({} as any);
      mockQuery.mockReturnValue({} as any);
      mockWhere.mockReturnValue({} as any);
      mockOrderBy.mockReturnValue({} as any);
      mockLimit.mockReturnValue({} as any);
      mockGetDocs.mockRejectedValue(new Error('Firestore error'));

      await expect(PeerReviewService.getReviewsForUser('user-1'))
        .rejects.toThrow('Firestore error');
    });
  });

  describe('createReviewRequest', () => {
    it('should create a review request successfully', async () => {
      mockDoc.mockReturnValue({} as any);
      mockSetDoc.mockResolvedValue(undefined);

      const result = await PeerReviewService.createReviewRequest(mockReviewRequest);

      expect(result).toBe(mockReviewRequest.requestId);
      expect(mockSetDoc).toHaveBeenCalledWith(
        {},
        expect.objectContaining({
          requestId: mockReviewRequest.requestId,
          requesterId: mockReviewRequest.requesterId,
          title: mockReviewRequest.title
        })
      );
    });
  });

  describe('getOpenReviewRequests', () => {
    it('should retrieve open review requests', async () => {
      const mockQuerySnapshot = {
        forEach: jest.fn((callback) => {
          callback({
            data: () => ({
              ...mockReviewRequest,
              createdAt: mockReviewRequest.createdAt.toISOString(),
              expiresAt: mockReviewRequest.expiresAt.toISOString()
            })
          });
        })
      };

      mockCollection.mockReturnValue({} as any);
      mockQuery.mockReturnValue({} as any);
      mockWhere.mockReturnValue({} as any);
      mockOrderBy.mockReturnValue({} as any);
      mockLimit.mockReturnValue({} as any);
      mockGetDocs.mockResolvedValue(mockQuerySnapshot as any);

      const result = await PeerReviewService.getOpenReviewRequests();

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(expect.objectContaining({
        requestId: mockReviewRequest.requestId,
        status: 'open'
      }));
    });

    it('should filter by skills when provided', async () => {
      const mockQuerySnapshot = {
        forEach: jest.fn((callback) => {
          callback({
            data: () => ({
              ...mockReviewRequest,
              skillsRequested: ['JavaScript'],
              createdAt: mockReviewRequest.createdAt.toISOString(),
              expiresAt: mockReviewRequest.expiresAt.toISOString()
            })
          });
        })
      };

      mockCollection.mockReturnValue({} as any);
      mockQuery.mockReturnValue({} as any);
      mockWhere.mockReturnValue({} as any);
      mockOrderBy.mockReturnValue({} as any);
      mockLimit.mockReturnValue({} as any);
      mockGetDocs.mockResolvedValue(mockQuerySnapshot as any);

      const result = await PeerReviewService.getOpenReviewRequests(['JavaScript']);

      expect(result).toHaveLength(1);
    });
  });

  describe('findPotentialReviewers', () => {
    it('should find potential reviewers for a request', async () => {
      const mockReviewerProfile: ReviewerProfile = {
        userId: 'reviewer-1',
        username: 'TestReviewer',
        skillLevels: new Map([['JavaScript', 4], ['React', 3]]),
        reviewStats: {
          totalReviewsCompleted: 10,
          averageRating: 4.5,
          averageResponseTime: 12,
          specialties: ['JavaScript'],
          reviewsThisMonth: 3,
          helpfulnessScore: 4.2
        },
        preferences: {
          skillsToReview: ['JavaScript', 'React'],
          maxReviewsPerWeek: 5,
          preferredReviewTypes: ['code_review'],
          anonymousReviewsOnly: false,
          mentorshipAvailable: true,
          collaborationInterest: false
        },
        availability: {
          isAvailable: true,
          timeZone: 'UTC',
          availableHours: [],
          responseTimeCommitment: 24,
          currentLoad: 2
        },
        reputation: {
          level: 'mentor',
          points: 150,
          badges: [],
          endorsements: []
        }
      };

      const mockQuerySnapshot = {
        forEach: jest.fn((callback) => {
          callback({
            data: () => ({
              ...mockReviewerProfile,
              skillLevels: Object.fromEntries(mockReviewerProfile.skillLevels)
            })
          });
        })
      };

      mockCollection.mockReturnValue({} as any);
      mockQuery.mockReturnValue({} as any);
      mockWhere.mockReturnValue({} as any);
      mockLimit.mockReturnValue({} as any);
      mockGetDocs.mockResolvedValue(mockQuerySnapshot as any);

      const result = await PeerReviewService.findPotentialReviewers(mockReviewRequest);

      expect(result.potentialReviewers).toHaveLength(1);
      expect(result.recommendedReviewers).toHaveLength(1);
      expect(result.matchingScore).toBeGreaterThan(0);
    });
  });

  describe('getReviewAnalytics', () => {
    it('should calculate review analytics for a user', async () => {
      // Mock getReviewsForUser to return reviews
      const mockReviews = [mockPeerReview];
      jest.spyOn(PeerReviewService, 'getReviewsForUser').mockResolvedValue(mockReviews);

      const result = await PeerReviewService.getReviewAnalytics('user-1');

      expect(result.totalReviews).toBe(1);
      expect(result.averageRating).toBe(4);
      expect(result.skillImprovements).toContain('Add tests');
      expect(result.mostHelpfulFeedback).toContain('Good structure');
    });

    it('should handle empty review history', async () => {
      jest.spyOn(PeerReviewService, 'getReviewsForUser').mockResolvedValue([]);

      const result = await PeerReviewService.getReviewAnalytics('user-1');

      expect(result.totalReviews).toBe(0);
      expect(result.averageRating).toBe(0);
      expect(result.skillImprovements).toHaveLength(0);
    });
  });
});