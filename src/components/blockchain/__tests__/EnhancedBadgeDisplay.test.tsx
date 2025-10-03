/**
 * @fileOverview Unit tests for EnhancedBadgeDisplay component
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { EnhancedBadgeDisplay } from '../EnhancedBadgeDisplay';

// Mock the verification service
vi.mock('@/lib/blockchain/verification-service', () => ({
  VerificationService: {
    verifyBadgeOnBlockchain: vi.fn(),
    getBadgeMetadata: vi.fn(),
    getVerificationStatus: vi.fn()
  }
}));

import { VerificationService } from '@/lib/blockchain/verification-service';

const mockVerificationService = vi.mocked(VerificationService);

const mockBadge = {
  badgeId: 'badge-123',
  badgeName: 'JavaScript Expert',
  badgeType: {
    category: 'skill',
    subcategory: 'javascript'
  },
  description: 'Demonstrates advanced JavaScript programming skills',
  iconUrl: '/badges/javascript-expert.svg',
  rarity: {
    level: 'rare',
    score: 75,
    baseRarity: 70,
    qualityBonus: 5,
    timeBonus: 0,
    finalRarity: 75
  },
  awardedAt: new Date('2024-01-15T10:30:00Z'),
  awardedTo: 'user-123',
  verificationStatus: 'verified' as const,
  blockchainTxHash: '0x1234567890abcdef',
  tokenId: 42,
  contractAddress: '0xabcdef1234567890',
  metadata: {
    skillsValidated: ['JavaScript', 'ES6', 'Async Programming'],
    validationCriteria: [
      { criterion: 'Code Quality', value: 85, threshold: 80, passed: true },
      { criterion: 'Skill Level', value: 4, threshold: 3, passed: true }
    ],
    aiAnalysisId: 'analysis-456',
    challengeId: 'challenge-789'
  },
  transferable: false,
  limitedEdition: false
};

const mockVerificationData = {
  isValid: true,
  onChainData: {
    tokenId: 42,
    owner: '0x742d35Cc6634C0532925a3b8D4C9db96DfB3f681',
    mintedAt: new Date('2024-01-15T10:30:00Z'),
    metadata: {
      name: 'JavaScript Expert',
      description: 'Demonstrates advanced JavaScript programming skills',
      attributes: [
        { trait_type: 'Skill', value: 'JavaScript' },
        { trait_type: 'Level', value: '4' },
        { trait_type: 'Rarity', value: 'Rare' }
      ]
    }
  },
  verificationTimestamp: new Date('2024-01-15T10:31:00Z'),
  blockNumber: 12345678,
  gasUsed: 150000
};

describe('EnhancedBadgeDisplay', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mocks
    mockVerificationService.verifyBadgeOnBlockchain.mockResolvedValue(mockVerificationData);
    mockVerificationService.getBadgeMetadata.mockResolvedValue(mockBadge.metadata);
    mockVerificationService.getVerificationStatus.mockResolvedValue({
      status: 'verified',
      lastChecked: new Date(),
      blockchainData: mockVerificationData.onChainData
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render badge with basic information', () => {
      render(<EnhancedBadgeDisplay badge={mockBadge} />);
      
      expect(screen.getByText('JavaScript Expert')).toBeInTheDocument();
      expect(screen.getByText('Demonstrates advanced JavaScript programming skills')).toBeInTheDocument();
      expect(screen.getByText('Rare')).toBeInTheDocument();
      expect(screen.getByAltText('JavaScript Expert badge')).toBeInTheDocument();
    });

    it('should show verification status badge', () => {
      render(<EnhancedBadgeDisplay badge={mockBadge} />);
      
      expect(screen.getByText('Verified')).toBeInTheDocument();
      expect(screen.getByText('Blockchain Verified')).toBeInTheDocument();
    });

    it('should display rarity level with appropriate styling', () => {
      render(<EnhancedBadgeDisplay badge={mockBadge} />);
      
      const rarityBadge = screen.getByText('Rare');
      expect(rarityBadge).toHaveClass('bg-purple-100');
    });

    it('should show awarded date', () => {
      render(<EnhancedBadgeDisplay badge={mockBadge} />);
      
      expect(screen.getByText(/Awarded on/)).toBeInTheDocument();
      expect(screen.getByText(/Jan 15, 2024/)).toBeInTheDocument();
    });
  });

  describe('Verification Details', () => {
    it('should show verification button', () => {
      render(<EnhancedBadgeDisplay badge={mockBadge} showVerification={true} />);
      
      expect(screen.getByText('Verify on Blockchain')).toBeInTheDocument();
    });

    it('should display verification details when clicked', async () => {
      render(<EnhancedBadgeDisplay badge={mockBadge} showVerification={true} />);
      
      fireEvent.click(screen.getByText('Verify on Blockchain'));
      
      await waitFor(() => {
        expect(screen.getByText('Blockchain Verification')).toBeInTheDocument();
        expect(screen.getByText('Token ID: 42')).toBeInTheDocument();
        expect(screen.getByText(/0x1234567890abcdef/)).toBeInTheDocument();
      });
    });

    it('should call verification service when verifying', async () => {
      render(<EnhancedBadgeDisplay badge={mockBadge} showVerification={true} />);
      
      fireEvent.click(screen.getByText('Verify on Blockchain'));
      
      await waitFor(() => {
        expect(mockVerificationService.verifyBadgeOnBlockchain).toHaveBeenCalledWith(
          mockBadge.contractAddress,
          mockBadge.tokenId
        );
      });
    });

    it('should show verification loading state', async () => {
      mockVerificationService.verifyBadgeOnBlockchain.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 1000))
      );
      
      render(<EnhancedBadgeDisplay badge={mockBadge} showVerification={true} />);
      
      fireEvent.click(screen.getByText('Verify on Blockchain'));
      
      expect(screen.getByText('Verifying...')).toBeInTheDocument();
    });

    it('should handle verification errors', async () => {
      mockVerificationService.verifyBadgeOnBlockchain.mockRejectedValue(
        new Error('Blockchain connection failed')
      );
      
      render(<EnhancedBadgeDisplay badge={mockBadge} showVerification={true} />);
      
      fireEvent.click(screen.getByText('Verify on Blockchain'));
      
      await waitFor(() => {
        expect(screen.getByText('Verification failed')).toBeInTheDocument();
        expect(screen.getByText('Blockchain connection failed')).toBeInTheDocument();
      });
    });
  });

  describe('Badge Metadata', () => {
    it('should display skills validated', () => {
      render(<EnhancedBadgeDisplay badge={mockBadge} showDetails={true} />);
      
      expect(screen.getByText('Skills Validated')).toBeInTheDocument();
      expect(screen.getByText('JavaScript')).toBeInTheDocument();
      expect(screen.getByText('ES6')).toBeInTheDocument();
      expect(screen.getByText('Async Programming')).toBeInTheDocument();
    });

    it('should show validation criteria', () => {
      render(<EnhancedBadgeDisplay badge={mockBadge} showDetails={true} />);
      
      expect(screen.getByText('Validation Criteria')).toBeInTheDocument();
      expect(screen.getByText('Code Quality: 85/80 ✓')).toBeInTheDocument();
      expect(screen.getByText('Skill Level: 4/3 ✓')).toBeInTheDocument();
    });

    it('should display rarity breakdown', () => {
      render(<EnhancedBadgeDisplay badge={mockBadge} showDetails={true} />);
      
      expect(screen.getByText('Rarity Score: 75')).toBeInTheDocument();
      expect(screen.getByText('Base: 70')).toBeInTheDocument();
      expect(screen.getByText('Quality Bonus: +5')).toBeInTheDocument();
    });

    it('should show limited edition information when applicable', () => {
      const limitedBadge = {
        ...mockBadge,
        limitedEdition: true,
        serialNumber: 42,
        totalMinted: 100
      };
      
      render(<EnhancedBadgeDisplay badge={limitedBadge} showDetails={true} />);
      
      expect(screen.getByText('Limited Edition')).toBeInTheDocument();
      expect(screen.getByText('#42 of 100')).toBeInTheDocument();
    });
  });

  describe('Interactive Features', () => {
    it('should expand/collapse details section', () => {
      render(<EnhancedBadgeDisplay badge={mockBadge} />);
      
      const detailsButton = screen.getByText('Show Details');
      fireEvent.click(detailsButton);
      
      expect(screen.getByText('Skills Validated')).toBeInTheDocument();
      
      fireEvent.click(screen.getByText('Hide Details'));
      
      expect(screen.queryByText('Skills Validated')).not.toBeInTheDocument();
    });

    it('should copy verification link to clipboard', async () => {
      const mockClipboard = {
        writeText: vi.fn().mockResolvedValue(undefined)
      };
      Object.assign(navigator, { clipboard: mockClipboard });
      
      render(<EnhancedBadgeDisplay badge={mockBadge} showVerification={true} />);
      
      fireEvent.click(screen.getByText('Verify on Blockchain'));
      
      await waitFor(() => {
        const copyButton = screen.getByText('Copy Link');
        fireEvent.click(copyButton);
      });
      
      expect(mockClipboard.writeText).toHaveBeenCalledWith(
        expect.stringContaining('etherscan.io')
      );
    });

    it('should open blockchain explorer in new tab', async () => {
      const mockOpen = vi.fn();
      Object.assign(window, { open: mockOpen });
      
      render(<EnhancedBadgeDisplay badge={mockBadge} showVerification={true} />);
      
      fireEvent.click(screen.getByText('Verify on Blockchain'));
      
      await waitFor(() => {
        const explorerButton = screen.getByText('View on Explorer');
        fireEvent.click(explorerButton);
      });
      
      expect(mockOpen).toHaveBeenCalledWith(
        expect.stringContaining('etherscan.io'),
        '_blank'
      );
    });
  });

  describe('Different Badge States', () => {
    it('should handle pending verification status', () => {
      const pendingBadge = {
        ...mockBadge,
        verificationStatus: 'pending' as const,
        blockchainTxHash: undefined,
        tokenId: undefined
      };
      
      render(<EnhancedBadgeDisplay badge={pendingBadge} />);
      
      expect(screen.getByText('Pending')).toBeInTheDocument();
      expect(screen.getByText('Verification Pending')).toBeInTheDocument();
    });

    it('should handle failed verification status', () => {
      const failedBadge = {
        ...mockBadge,
        verificationStatus: 'failed' as const
      };
      
      render(<EnhancedBadgeDisplay badge={failedBadge} />);
      
      expect(screen.getByText('Failed')).toBeInTheDocument();
      expect(screen.getByText('Verification Failed')).toBeInTheDocument();
    });

    it('should handle different rarity levels', () => {
      const legendaryBadge = {
        ...mockBadge,
        rarity: {
          ...mockBadge.rarity,
          level: 'legendary' as const
        }
      };
      
      render(<EnhancedBadgeDisplay badge={legendaryBadge} />);
      
      const rarityBadge = screen.getByText('Legendary');
      expect(rarityBadge).toHaveClass('bg-yellow-100');
    });

    it('should show transferable status', () => {
      const transferableBadge = {
        ...mockBadge,
        transferable: true
      };
      
      render(<EnhancedBadgeDisplay badge={transferableBadge} showDetails={true} />);
      
      expect(screen.getByText('Transferable')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('should adapt layout for mobile screens', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 400,
      });
      
      render(<EnhancedBadgeDisplay badge={mockBadge} />);
      
      // Should stack elements vertically on mobile
      const container = document.querySelector('.flex-col');
      expect(container).toBeInTheDocument();
    });

    it('should show compact view when specified', () => {
      render(<EnhancedBadgeDisplay badge={mockBadge} compact={true} />);
      
      // Should show minimal information in compact mode
      expect(screen.getByText('JavaScript Expert')).toBeInTheDocument();
      expect(screen.queryByText('Demonstrates advanced')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<EnhancedBadgeDisplay badge={mockBadge} />);
      
      const badgeImage = screen.getByAltText('JavaScript Expert badge');
      expect(badgeImage).toHaveAttribute('alt', 'JavaScript Expert badge');
      
      const verificationStatus = screen.getByLabelText('Verification status');
      expect(verificationStatus).toBeInTheDocument();
    });

    it('should support keyboard navigation', () => {
      render(<EnhancedBadgeDisplay badge={mockBadge} showVerification={true} />);
      
      const verifyButton = screen.getByText('Verify on Blockchain');
      verifyButton.focus();
      expect(document.activeElement).toBe(verifyButton);
      
      // Should be able to activate with Enter key
      fireEvent.keyDown(verifyButton, { key: 'Enter' });
      expect(mockVerificationService.verifyBadgeOnBlockchain).toHaveBeenCalled();
    });

    it('should have proper heading hierarchy', () => {
      render(<EnhancedBadgeDisplay badge={mockBadge} showDetails={true} />);
      
      expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();
    });

    it('should provide screen reader friendly verification status', () => {
      render(<EnhancedBadgeDisplay badge={mockBadge} />);
      
      const statusElement = screen.getByText('Verified');
      expect(statusElement).toHaveAttribute('aria-label', expect.stringContaining('verified'));
    });
  });
});