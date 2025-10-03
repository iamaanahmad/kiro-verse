import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AssessmentCreator } from '../AssessmentCreator';
import { CustomAssessment } from '@/types/employer';

// Mock the employer service
jest.mock('@/lib/employer/employer-service', () => ({
  employerService: {
    createCustomAssessment: jest.fn()
  }
}));

// Mock the AI flow
jest.mock('@/ai/flows/generate-assessment-challenge', () => ({
  generateCodingChallenge: jest.fn()
}));

const mockAssessment: CustomAssessment = {
  assessmentId: 'test-assessment-1',
  title: 'JavaScript Developer Assessment',
  description: 'Test JavaScript and React skills',
  createdBy: 'employer-1',
  companyName: 'Test Company',
  targetSkills: [
    {
      skillId: 'javascript',
      skillName: 'JavaScript',
      minimumLevel: 6,
      weight: 0.7,
      isRequired: true
    },
    {
      skillId: 'react',
      skillName: 'React',
      minimumLevel: 5,
      weight: 0.3,
      isRequired: false
    }
  ],
  difficultyLevel: 'intermediate',
  estimatedDuration: 90,
  timeLimit: 120,
  challenges: [],
  evaluationCriteria: [
    {
      criteriaId: 'code-quality',
      name: 'Code Quality',
      description: 'Assess code readability and structure',
      weight: 0.4,
      maxScore: 100,
      evaluationType: 'ai_assisted',
      rubric: []
    }
  ],
  passingScore: 75,
  useAIEvaluation: true,
  customInstructions: 'Focus on modern JavaScript practices',
  status: 'draft',
  participantCount: 0,
  averageScore: 0,
  completionRate: 0,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01')
};

describe('AssessmentCreator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the assessment creator with initial step', () => {
    render(<AssessmentCreator employerId="employer-1" />);

    expect(screen.getByText('Create Assessment')).toBeInTheDocument();
    expect(screen.getByText('Design custom coding assessments with AI-powered evaluation')).toBeInTheDocument();
    expect(screen.getByLabelText('Assessment Title *')).toBeInTheDocument();
    expect(screen.getByLabelText('Company Name *')).toBeInTheDocument();
  });

  it('loads existing assessment data when provided', () => {
    render(
      <AssessmentCreator 
        employerId="employer-1" 
        existingAssessment={mockAssessment}
      />
    );

    expect(screen.getByDisplayValue('JavaScript Developer Assessment')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Company')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test JavaScript and React skills')).toBeInTheDocument();
  });

  it('validates required fields in basic info step', async () => {
    render(<AssessmentCreator employerId="employer-1" />);

    // Try to proceed without filling required fields
    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText('Title is required')).toBeInTheDocument();
      expect(screen.getByText('Description is required')).toBeInTheDocument();
      expect(screen.getByText('Company name is required')).toBeInTheDocument();
    });
  });

  it('allows navigation between steps when validation passes', async () => {
    render(<AssessmentCreator employerId="employer-1" />);

    // Fill required fields
    fireEvent.change(screen.getByLabelText('Assessment Title *'), {
      target: { value: 'Test Assessment' }
    });
    fireEvent.change(screen.getByLabelText('Company Name *'), {
      target: { value: 'Test Company' }
    });
    fireEvent.change(screen.getByLabelText('Description *'), {
      target: { value: 'Test description' }
    });

    // Navigate to next step
    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText('Target Skills')).toBeInTheDocument();
      expect(screen.getByText('Add Skill')).toBeInTheDocument();
    });
  });

  it('allows adding and removing skill requirements', async () => {
    render(<AssessmentCreator employerId="employer-1" />);

    // Navigate to skills step
    fireEvent.change(screen.getByLabelText('Assessment Title *'), {
      target: { value: 'Test Assessment' }
    });
    fireEvent.change(screen.getByLabelText('Company Name *'), {
      target: { value: 'Test Company' }
    });
    fireEvent.change(screen.getByLabelText('Description *'), {
      target: { value: 'Test description' }
    });
    fireEvent.click(screen.getByText('Next'));

    await waitFor(() => {
      expect(screen.getByText('Add Skill')).toBeInTheDocument();
    });

    // Add a skill
    fireEvent.click(screen.getByText('Add Skill'));

    await waitFor(() => {
      expect(screen.getByPlaceholderText('e.g., JavaScript')).toBeInTheDocument();
    });

    // Fill skill details
    const skillNameInput = screen.getByPlaceholderText('e.g., JavaScript');
    fireEvent.change(skillNameInput, { target: { value: 'JavaScript' } });

    // Remove the skill
    const removeButton = screen.getByRole('button', { name: /trash/i });
    fireEvent.click(removeButton);

    await waitFor(() => {
      expect(screen.queryByDisplayValue('JavaScript')).not.toBeInTheDocument();
    });
  });

  it('generates AI challenge when requested', async () => {
    const { generateCodingChallenge } = require('@/ai/flows/generate-assessment-challenge');
    const mockChallenge = {
      challengeId: 'challenge-1',
      title: 'Array Manipulation',
      description: 'Test array skills',
      prompt: 'Solve the array problem',
      difficulty: 'intermediate',
      skillsTargeted: ['javascript'],
      timeLimit: 30,
      testCases: [],
      expectedApproach: 'Use loops',
      hints: ['Think about iteration'],
      maxScore: 100,
      weight: 1,
      evaluationMethod: 'ai_assisted',
      aiEvaluationCriteria: []
    };

    generateCodingChallenge.mockResolvedValue(mockChallenge);

    render(<AssessmentCreator employerId="employer-1" />);

    // Navigate to challenges step
    // ... (navigation code similar to above)

    // Click AI Generate button
    const generateButton = screen.getByText('AI Generate');
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(generateCodingChallenge).toHaveBeenCalled();
      expect(screen.getByText('Array Manipulation')).toBeInTheDocument();
    });
  });

  it('allows adding and removing evaluation criteria', async () => {
    render(<AssessmentCreator employerId="employer-1" />);

    // Navigate to evaluation step (skip validation for test)
    const steps = ['Next', 'Next', 'Next']; // Navigate through steps
    for (const step of steps) {
      // Fill minimum required data for each step
      if (screen.queryByLabelText('Assessment Title *')) {
        fireEvent.change(screen.getByLabelText('Assessment Title *'), {
          target: { value: 'Test' }
        });
        fireEvent.change(screen.getByLabelText('Company Name *'), {
          target: { value: 'Test' }
        });
        fireEvent.change(screen.getByLabelText('Description *'), {
          target: { value: 'Test' }
        });
      }
      
      fireEvent.click(screen.getByText(step));
      await waitFor(() => {}, { timeout: 1000 });
    }

    // Should be on evaluation step
    await waitFor(() => {
      expect(screen.getByText('Add Criteria')).toBeInTheDocument();
    });

    // Add evaluation criteria
    fireEvent.click(screen.getByText('Add Criteria'));

    await waitFor(() => {
      expect(screen.getByPlaceholderText('e.g., Code Quality')).toBeInTheDocument();
    });
  });

  it('saves assessment as draft', async () => {
    const { employerService } = require('@/lib/employer/employer-service');
    employerService.createCustomAssessment.mockResolvedValue(mockAssessment);

    const mockOnSave = jest.fn();
    render(
      <AssessmentCreator 
        employerId="employer-1" 
        onSave={mockOnSave}
      />
    );

    // Fill minimum required data
    fireEvent.change(screen.getByLabelText('Assessment Title *'), {
      target: { value: 'Test Assessment' }
    });
    fireEvent.change(screen.getByLabelText('Company Name *'), {
      target: { value: 'Test Company' }
    });
    fireEvent.change(screen.getByLabelText('Description *'), {
      target: { value: 'Test description' }
    });

    // Save as draft
    const saveButton = screen.getByText('Save Draft');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(employerService.createCustomAssessment).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Test Assessment',
          companyName: 'Test Company',
          description: 'Test description',
          status: 'draft'
        })
      );
      expect(mockOnSave).toHaveBeenCalledWith(mockAssessment);
    });
  });

  it('publishes assessment when completed', async () => {
    const { employerService } = require('@/lib/employer/employer-service');
    employerService.createCustomAssessment.mockResolvedValue({
      ...mockAssessment,
      status: 'active'
    });

    render(<AssessmentCreator employerId="employer-1" />);

    // Navigate to final step and fill required data
    // ... (navigation and data filling code)

    // Publish assessment
    const publishButton = screen.getByText('Publish Assessment');
    fireEvent.click(publishButton);

    await waitFor(() => {
      expect(employerService.createCustomAssessment).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'active'
        })
      );
    });
  });

  it('handles save errors gracefully', async () => {
    const { employerService } = require('@/lib/employer/employer-service');
    employerService.createCustomAssessment.mockRejectedValue(new Error('Save failed'));

    render(<AssessmentCreator employerId="employer-1" />);

    // Fill minimum data and try to save
    fireEvent.change(screen.getByLabelText('Assessment Title *'), {
      target: { value: 'Test Assessment' }
    });
    fireEvent.change(screen.getByLabelText('Company Name *'), {
      target: { value: 'Test Company' }
    });
    fireEvent.change(screen.getByLabelText('Description *'), {
      target: { value: 'Test description' }
    });

    const saveButton = screen.getByText('Save Draft');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Failed to save assessment. Please try again.')).toBeInTheDocument();
    });
  });

  it('calls onCancel when cancel button is clicked', () => {
    const mockOnCancel = jest.fn();
    render(
      <AssessmentCreator 
        employerId="employer-1" 
        onCancel={mockOnCancel}
      />
    );

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('updates difficulty level and time estimates', () => {
    render(<AssessmentCreator employerId="employer-1" />);

    const difficultySelect = screen.getByDisplayValue('Intermediate');
    fireEvent.change(difficultySelect, { target: { value: 'advanced' } });

    expect(screen.getByDisplayValue('Advanced')).toBeInTheDocument();
  });

  it('toggles AI evaluation settings', () => {
    render(<AssessmentCreator employerId="employer-1" />);

    // Navigate to evaluation step
    // ... (navigation code)

    // Toggle AI evaluation
    const aiToggle = screen.getByRole('switch');
    fireEvent.click(aiToggle);

    // Should show/hide AI-specific options
    expect(screen.queryByLabelText('Custom AI Instructions')).toBeInTheDocument();
  });

  it('displays progress correctly across steps', () => {
    render(<AssessmentCreator employerId="employer-1" />);

    // Check initial progress
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '0');

    // Navigate and check progress updates
    // ... (navigation code to test progress updates)
  });
});