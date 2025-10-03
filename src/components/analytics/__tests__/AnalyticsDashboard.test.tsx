import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi } from 'vitest';
import AnalyticsDashboard from '../../AnalyticsDashboard';
import { it } from 'node:test';
import { it } from 'node:test';
import { beforeEach } from 'node:test';
import { describe } from 'node:test';

// Mock the analytics services
vi.mock('@/lib/firebase/analytics', () => ({
  UserProgressService: {
    getUserProgress: vi.fn(),
  },
  LearningInsightsService: {
    getUserLearningInsights: vi.fn(),
    markInsightAsRead: vi.fn(),
  },
}));

// Mock the child components to avoid complex dependencies
vi.mock('../SkillProgressChart', () => ({
  default: function MockSkillProgressChart() {
    return <div data-testid="skill-progress-chart">Skill Progress Chart</div>;
  },
}));

vi.mock('../LearningInsights', () => ({
  default: function MockLearningInsights() {
    return <div data-testid="learning-insights">Learning Insights</div>;
  },
}));

describe('AnalyticsDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    const { container } = render(<AnalyticsDashboard userId="test-user" />);
    
    // Should show loading skeletons
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders with correct props', () => {
    const { container } = render(<AnalyticsDashboard userId="test-user" className="test-class" />);
    
    expect(container.firstChild).toHaveClass('test-class');
  });
});