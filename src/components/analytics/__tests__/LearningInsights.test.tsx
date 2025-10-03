import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi } from 'vitest';
import LearningInsights from '../LearningInsights';
import { LearningInsight } from '@/types/analytics';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { beforeEach } from 'node:test';
import { describe } from 'node:test';

// Mock the analytics services
vi.mock('@/lib/firebase/analytics', () => ({
  LearningInsightsService: {
    markInsightAsRead: vi.fn(),
  },
}));

const mockInsights: LearningInsight[] = [
  {
    id: 'insight-1',
    userId: 'user-1',
    type: 'strength',
    category: 'Code Quality',
    title: 'Excellent Code Structure',
    description: 'Your code demonstrates excellent structure and organization.',
    actionableSteps: ['Continue applying these practices', 'Share knowledge with peers'],
    confidenceScore: 0.9,
    priority: 'medium',
    isRead: false,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: 'insight-2',
    userId: 'user-1',
    type: 'improvement_area',
    category: 'Performance',
    title: 'Optimize Algorithm Efficiency',
    description: 'Consider using more efficient algorithms for better performance.',
    actionableSteps: ['Review algorithm complexity', 'Use appropriate data structures'],
    confidenceScore: 0.8,
    priority: 'high',
    isRead: true,
    createdAt: new Date('2024-01-02'),
  },
];

describe('LearningInsights', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders insights correctly', () => {
    render(<LearningInsights insights={mockInsights} />);
    
    expect(screen.getByText('Learning Insights')).toBeInTheDocument();
    expect(screen.getByText('Excellent Code Structure')).toBeInTheDocument();
    expect(screen.getByText('Optimize Algorithm Efficiency')).toBeInTheDocument();
  });

  it('shows empty state when no insights', () => {
    render(<LearningInsights insights={[]} />);
    
    expect(screen.getByText('No insights yet')).toBeInTheDocument();
    expect(screen.getByText('Keep coding to receive personalized learning insights!')).toBeInTheDocument();
  });

  it('displays unread count badge', () => {
    render(<LearningInsights insights={mockInsights} />);
    
    expect(screen.getByText('1 new')).toBeInTheDocument();
  });

  it('shows high priority badge', () => {
    render(<LearningInsights insights={mockInsights} />);
    
    expect(screen.getByText('1 high priority')).toBeInTheDocument();
  });

  it('renders with detailed view', () => {
    render(<LearningInsights insights={mockInsights} detailed={true} />);
    
    // Should show filter tabs in detailed view
    expect(screen.getByText('All')).toBeInTheDocument();
    expect(screen.getByText('Unread')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'High Priority' })).toBeInTheDocument();
  });

  it('limits items when maxItems is set', () => {
    const manyInsights = Array.from({ length: 10 }, (_, i) => ({
      ...mockInsights[0],
      id: `insight-${i}`,
      title: `Insight ${i}`,
    }));

    render(<LearningInsights insights={manyInsights} maxItems={3} />);
    
    // Should only show 3 insights
    expect(screen.getByText('Insight 0')).toBeInTheDocument();
    expect(screen.getByText('Insight 1')).toBeInTheDocument();
    expect(screen.getByText('Insight 2')).toBeInTheDocument();
    expect(screen.queryByText('Insight 3')).not.toBeInTheDocument();
  });
});