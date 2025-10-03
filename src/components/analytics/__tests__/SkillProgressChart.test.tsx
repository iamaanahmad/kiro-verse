import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import SkillProgressChart from '../SkillProgressChart';
import { SkillLevel } from '@/types/analytics';

const mockSkillLevels: SkillLevel[] = [
  {
    skillId: 'javascript',
    skillName: 'JavaScript',
    currentLevel: 3,
    experiencePoints: 250,
    competencyAreas: [],
    industryBenchmark: {
      industryAverage: 50,
      experienceLevel: 'intermediate',
      percentile: 75,
      lastUpdated: new Date(),
    },
    verificationStatus: 'verified',
    progressHistory: [
      {
        timestamp: new Date('2024-01-01'),
        level: 1,
        experiencePoints: 50,
      },
      {
        timestamp: new Date('2024-01-15'),
        level: 2,
        experiencePoints: 150,
      },
      {
        timestamp: new Date('2024-02-01'),
        level: 3,
        experiencePoints: 250,
      },
    ],
    trendDirection: 'improving',
    lastUpdated: new Date(),
  },
  {
    skillId: 'react',
    skillName: 'React',
    currentLevel: 2,
    experiencePoints: 120,
    competencyAreas: [],
    industryBenchmark: {
      industryAverage: 45,
      experienceLevel: 'beginner',
      percentile: 60,
      lastUpdated: new Date(),
    },
    verificationStatus: 'pending',
    progressHistory: [
      {
        timestamp: new Date('2024-01-10'),
        level: 1,
        experiencePoints: 30,
      },
      {
        timestamp: new Date('2024-01-25'),
        level: 2,
        experiencePoints: 120,
      },
    ],
    trendDirection: 'stable',
    lastUpdated: new Date(),
  },
];

describe('SkillProgressChart', () => {
  it('renders chart with skill data', () => {
    render(<SkillProgressChart skillLevels={mockSkillLevels} />);
    
    expect(screen.getByText('Skill Progression')).toBeInTheDocument();
    expect(screen.getByText('JavaScript')).toBeInTheDocument();
    expect(screen.getByText('React')).toBeInTheDocument();
  });

  it('shows empty state when no skills', () => {
    render(<SkillProgressChart skillLevels={[]} />);
    
    expect(screen.getByText('No skill data available yet')).toBeInTheDocument();
    expect(screen.getByText('Start coding to see your skill progression!')).toBeInTheDocument();
  });

  it('renders with custom title', () => {
    const customTitle = 'My Custom Chart Title';
    render(<SkillProgressChart skillLevels={mockSkillLevels} title={customTitle} />);
    
    expect(screen.getByText(customTitle)).toBeInTheDocument();
  });

  it('displays skill badges with trend indicators', () => {
    render(<SkillProgressChart skillLevels={mockSkillLevels} showTrends={true} />);
    
    // Should show skill names as badges
    expect(screen.getByText('JavaScript')).toBeInTheDocument();
    expect(screen.getByText('React')).toBeInTheDocument();
  });

  it('shows time range selector', () => {
    render(<SkillProgressChart skillLevels={mockSkillLevels} />);
    
    // Should have time range options
    expect(screen.getByDisplayValue('30d')).toBeInTheDocument();
  });

  it('shows view type selector', () => {
    render(<SkillProgressChart skillLevels={mockSkillLevels} />);
    
    // Should have view type options
    expect(screen.getByDisplayValue('Level')).toBeInTheDocument();
  });

  it('displays skill legend with current levels', () => {
    render(<SkillProgressChart skillLevels={mockSkillLevels} />);
    
    // Should show current levels in legend
    expect(screen.getByText('L3')).toBeInTheDocument(); // JavaScript level 3
    expect(screen.getByText('L2')).toBeInTheDocument(); // React level 2
  });
});