import '@testing-library/jest-dom';
import { vi } from 'vitest';
import React from 'react';

// Polyfill ResizeObserver for tests
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock React components that might not exist
vi.mock('@/components/AnalyticsDashboard', () => ({
  AnalyticsDashboard: ({ userId }: { userId: string }) => 
    React.createElement('div', { 'data-testid': 'analytics-dashboard' }, 
      `Analytics Dashboard for ${userId}`
    )
}));

vi.mock('@/components/gamification/CompetitionManager', () => ({
  CompetitionManager: (props: any) => 
    React.createElement('div', { 'data-testid': 'competition-manager' }, 
      'Competition Manager'
    )
}));

vi.mock('@/components/gamification/Leaderboard', () => ({
  Leaderboard: (props: any) => 
    React.createElement('div', { 'data-testid': 'leaderboard' }, 
      'Leaderboard'
    )
}));

vi.mock('@/components/collaborative-session/CollaborativeSession', () => ({
  CollaborativeSession: (props: any) => 
    React.createElement('div', { 'data-testid': 'collaborative-session' }, 
      'Collaborative Session'
    )
}));

vi.mock('@/components/peer-review/PeerReview', () => ({
  PeerReview: (props: any) => 
    React.createElement('div', { 'data-testid': 'peer-review' }, 
      'Peer Review'
    )
}));

// Mock Firebase
vi.mock('@/lib/firebase/config', () => ({
  db: {},
  auth: {},
}));

vi.mock('@/lib/firebase/admin', () => ({
  adminDb: {},
}));

// Mock the skill progress tracker
vi.mock('@/lib/analytics/skill-progress-tracker', () => ({
  SkillProgressTracker: {
    analyzeCodeSubmission: vi.fn(),
  },
}));