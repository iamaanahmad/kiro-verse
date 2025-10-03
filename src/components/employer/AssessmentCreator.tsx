'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { 
  Plus, 
  Trash2, 
  Save, 
  Eye, 
  Wand2, 
  Clock, 
  Target, 
  CheckCircle,
  AlertCircle,
  Code,
  Play
} from 'lucide-react';
import { 
  CustomAssessment, 
  AssessmentChallenge, 
  EvaluationCriteria, 
  TestCase,
  SkillRequirement,
  AIEvaluationCriteria
} from '@/types/employer';
import { employerService } from '@/lib/employer/employer-service';

interface AssessmentCreatorProps {
  employerId: string;
  existingAssessment?: CustomAssessment;
  onSave?: (assessment: CustomAssessment) => void;
  onCancel?: () => void;
}

export function AssessmentCreator({ 
  employerId, 
  existingAssessment, 
  onSave, 
  onCancel 
}: AssessmentCreatorProps) {
  const [assessment, setAssessment] = useState<Partial<CustomAssessment>>({
    title: '',
    description: '',
    createdBy: employerId,
    companyName: '',
    targetSkills: [],
    difficultyLevel: 'intermediate',
    estimatedDuration: 60,
    timeLimit: undefined,
    challenges: [],
    evaluationCriteria: [],
    passingScore: 70,
    useAIEvaluation: true,
    customInstructions: '',
    status: 'draft'
  });

  const [currentStep, setCurrentStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const steps = [
    { id: 'basic', title: 'Basic Info', icon: Target },
    { id: 'skills', title: 'Skills & Requirements', icon: CheckCircle },
    { id: 'challenges', title: 'Challenges', icon: Code },
    { id: 'evaluation', title: 'Evaluation', icon: Eye },
    { id: 'review', title: 'Review & Publish', icon: Play }
  ];

  useEffect(() => {
    if (existingAssessment) {
      setAssessment(existingAssessment);
    }
  }, [existingAssessment]);

  const validateCurrentStep = (): boolean => {
    const errors: string[] = [];

    switch (currentStep) {
      case 0: // Basic Info
        if (!assessment.title?.trim()) errors.push('Title is required');
        if (!assessment.description?.trim()) errors.push('Description is required');
        if (!assessment.companyName?.trim()) errors.push('Company name is required');
        if (!assessment.estimatedDuration || assessment.estimatedDuration < 5) {
          errors.push('Estimated duration must be at least 5 minutes');
        }
        break;

      case 1: // Skills & Requirements
        if (!assessment.targetSkills?.length) {
          errors.push('At least one target skill is required');
        }
        break;

      case 2: // Challenges
        if (!assessment.challenges?.length) {
          errors.push('At least one challenge is required');
        }
        assessment.challenges?.forEach((challenge, index) => {
          if (!challenge.title?.trim()) {
            errors.push(`Challenge ${index + 1}: Title is required`);
          }
          if (!challenge.prompt?.trim()) {
            errors.push(`Challenge ${index + 1}: Prompt is required`);
          }
          if (!challenge.testCases?.length) {
            errors.push(`Challenge ${index + 1}: At least one test case is required`);
          }
        });
        break;

      case 3: // Evaluation
        if (!assessment.evaluationCriteria?.length) {
          errors.push('At least one evaluation criteria is required');
        }
        if (!assessment.passingScore || assessment.passingScore < 0 || assessment.passingScore > 100) {
          errors.push('Passing score must be between 0 and 100');
        }
        break;
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleNext = () => {
    if (validateCurrentStep() && currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSave = async (publish: boolean = false) => {
    try {
      setSaving(true);
      
      if (!validateCurrentStep()) {
        return;
      }

      const assessmentData = {
        ...assessment,
        status: publish ? 'active' : 'draft',
        publishedAt: publish ? new Date() : undefined
      } as Omit<CustomAssessment, 'assessmentId' | 'createdAt' | 'updatedAt'>;

      const savedAssessment = await employerService.createCustomAssessment(assessmentData);
      
      onSave?.(savedAssessment);
    } catch (error) {
      console.error('Failed to save assessment:', error);
      setValidationErrors(['Failed to save assessment. Please try again.']);
    } finally {
      setSaving(false);
    }
  };

  const generateAIChallenge = async () => {
    try {
      setGenerating(true);
      
      // TODO: Integrate with AI challenge generation flow
      const mockChallenge: AssessmentChallenge = {
        challengeId: `challenge_${Date.now()}`,
        title: 'Array Manipulation Challenge',
        description: 'Test array manipulation and algorithm skills',
        prompt: 'Write a function that finds the two numbers in an array that sum to a target value.',
        difficulty: assessment.difficultyLevel || 'intermediate',
        skillsTargeted: assessment.targetSkills?.map(s => s.skillId) || [],
        timeLimit: 30,
        starterCode: `function twoSum(nums, target) {
  // Your code here
}`,
        testCases: [
          {
            testId: 'test1',
            input: '[2, 7, 11, 15], 9',
            expectedOutput: '[0, 1]',
            isHidden: false,
            weight: 1,
            description: 'Basic case with solution at beginning'
          },
          {
            testId: 'test2',
            input: '[3, 2, 4], 6',
            expectedOutput: '[1, 2]',
            isHidden: false,
            weight: 1,
            description: 'Solution not at beginning'
          }
        ],
        expectedApproach: 'Use hash map for O(n) solution',
        hints: [
          'Consider using a hash map to store seen numbers',
          'Think about the complement of each number'
        ],
        maxScore: 100,
        weight: 1,
        evaluationMethod: 'ai_assisted',
        aiEvaluationCriteria: [
          {
            aspect: 'efficiency',
            weight: 0.3,
            description: 'Time and space complexity',
            evaluationPrompt: 'Evaluate the time and space complexity of the solution'
          },
          {
            aspect: 'code_quality',
            weight: 0.4,
            description: 'Code readability and structure',
            evaluationPrompt: 'Assess code readability, naming, and structure'
          },
          {
            aspect: 'correctness',
            weight: 0.3,
            description: 'Correctness of the solution',
            evaluationPrompt: 'Verify the solution handles all test cases correctly'
          }
        ]
      };

      setAssessment(prev => ({
        ...prev,
        challenges: [...(prev.challenges || []), mockChallenge]
      }));
    } catch (error) {
      console.error('Failed to generate AI challenge:', error);
      setValidationErrors(['Failed to generate challenge. Please try again.']);
    } finally {
      setGenerating(false);
    }
  };

  const addSkillRequirement = () => {
    const newSkill: SkillRequirement = {
      skillId: '',
      skillName: '',
      minimumLevel: 5,
      weight: 1,
      isRequired: true
    };

    setAssessment(prev => ({
      ...prev,
      targetSkills: [...(prev.targetSkills || []), newSkill]
    }));
  };

  const updateSkillRequirement = (index: number, updates: Partial<SkillRequirement>) => {
    setAssessment(prev => ({
      ...prev,
      targetSkills: prev.targetSkills?.map((skill, i) => 
        i === index ? { ...skill, ...updates } : skill
      )
    }));
  };

  const removeSkillRequirement = (index: number) => {
    setAssessment(prev => ({
      ...prev,
      targetSkills: prev.targetSkills?.filter((_, i) => i !== index)
    }));
  };

  const addEvaluationCriteria = () => {
    const newCriteria: EvaluationCriteria = {
      criteriaId: `criteria_${Date.now()}`,
      name: '',
      description: '',
      weight: 1,
      maxScore: 100,
      evaluationType: 'ai_assisted',
      rubric: []
    };

    setAssessment(prev => ({
      ...prev,
      evaluationCriteria: [...(prev.evaluationCriteria || []), newCriteria]
    }));
  };

  const updateEvaluationCriteria = (index: number, updates: Partial<EvaluationCriteria>) => {
    setAssessment(prev => ({
      ...prev,
      evaluationCriteria: prev.evaluationCriteria?.map((criteria, i) => 
        i === index ? { ...criteria, ...updates } : criteria
      )
    }));
  };

  const removeEvaluationCriteria = (index: number) => {
    setAssessment(prev => ({
      ...prev,
      evaluationCriteria: prev.evaluationCriteria?.filter((_, i) => i !== index)
    }));
  };

  const renderBasicInfoStep = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="title">Assessment Title *</Label>
          <Input
            id="title"
            value={assessment.title || ''}
            onChange={(e) => setAssessment(prev => ({ ...prev, title: e.target.value }))}
            placeholder="e.g., Senior JavaScript Developer Assessment"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="companyName">Company Name *</Label>
          <Input
            id="companyName"
            value={assessment.companyName || ''}
            onChange={(e) => setAssessment(prev => ({ ...prev, companyName: e.target.value }))}
            placeholder="Your company name"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description *</Label>
        <Textarea
          id="description"
          value={assessment.description || ''}
          onChange={(e) => setAssessment(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Describe what this assessment evaluates and its purpose..."
          rows={4}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="difficulty">Difficulty Level</Label>
          <select
            id="difficulty"
            value={assessment.difficultyLevel || 'intermediate'}
            onChange={(e) => setAssessment(prev => ({ 
              ...prev, 
              difficultyLevel: e.target.value as any 
            }))}
            className="w-full px-3 py-2 border rounded-md"
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
            <option value="expert">Expert</option>
            <option value="mixed">Mixed</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="estimatedDuration">Estimated Duration (minutes) *</Label>
          <Input
            id="estimatedDuration"
            type="number"
            min="5"
            max="480"
            value={assessment.estimatedDuration || 60}
            onChange={(e) => setAssessment(prev => ({ 
              ...prev, 
              estimatedDuration: parseInt(e.target.value) || 60 
            }))}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="timeLimit">Time Limit (minutes)</Label>
          <Input
            id="timeLimit"
            type="number"
            min="5"
            max="480"
            value={assessment.timeLimit || ''}
            onChange={(e) => setAssessment(prev => ({ 
              ...prev, 
              timeLimit: e.target.value ? parseInt(e.target.value) : undefined 
            }))}
            placeholder="Optional"
          />
        </div>
      </div>
    </div>
  );

  const renderSkillsStep = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Target Skills</h3>
        <Button onClick={addSkillRequirement} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Skill
        </Button>
      </div>

      <div className="space-y-4">
        {assessment.targetSkills?.map((skill, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div className="space-y-2">
                  <Label>Skill Name *</Label>
                  <Input
                    value={skill.skillName}
                    onChange={(e) => updateSkillRequirement(index, { 
                      skillName: e.target.value,
                      skillId: e.target.value.toLowerCase().replace(/\s+/g, '-')
                    })}
                    placeholder="e.g., JavaScript"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Minimum Level (1-10)</Label>
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    value={skill.minimumLevel}
                    onChange={(e) => updateSkillRequirement(index, { 
                      minimumLevel: parseInt(e.target.value) || 1 
                    })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Weight (0-1)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="1"
                    step="0.1"
                    value={skill.weight}
                    onChange={(e) => updateSkillRequirement(index, { 
                      weight: parseFloat(e.target.value) || 1 
                    })}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={skill.isRequired}
                    onCheckedChange={(checked) => updateSkillRequirement(index, { 
                      isRequired: checked 
                    })}
                  />
                  <Label>Required</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeSkillRequirement(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {!assessment.targetSkills?.length && (
          <div className="text-center py-8 text-gray-500">
            <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No skills added yet. Click "Add Skill" to get started.</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderChallengesStep = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Coding Challenges</h3>
        <div className="space-x-2">
          <Button onClick={generateAIChallenge} disabled={generating} size="sm">
            <Wand2 className="h-4 w-4 mr-2" />
            {generating ? 'Generating...' : 'AI Generate'}
          </Button>
          <Button onClick={() => {/* TODO: Add manual challenge */}} variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Manual
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {assessment.challenges?.map((challenge, index) => (
          <Card key={challenge.challengeId}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{challenge.title}</CardTitle>
                  <CardDescription>{challenge.description}</CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline">{challenge.difficulty}</Badge>
                  <Badge variant="secondary">
                    <Clock className="h-3 w-3 mr-1" />
                    {challenge.timeLimit}m
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label>Prompt</Label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-md text-sm">
                    {challenge.prompt}
                  </div>
                </div>

                {challenge.starterCode && (
                  <div>
                    <Label>Starter Code</Label>
                    <div className="mt-1 p-3 bg-gray-900 text-green-400 rounded-md text-sm font-mono">
                      <pre>{challenge.starterCode}</pre>
                    </div>
                  </div>
                )}

                <div>
                  <Label>Test Cases ({challenge.testCases.length})</Label>
                  <div className="mt-1 space-y-2">
                    {challenge.testCases.slice(0, 2).map((testCase, testIndex) => (
                      <div key={testCase.testId} className="p-2 bg-gray-50 rounded text-sm">
                        <div className="font-medium">Input: {testCase.input}</div>
                        <div className="text-gray-600">Expected: {testCase.expectedOutput}</div>
                      </div>
                    ))}
                    {challenge.testCases.length > 2 && (
                      <div className="text-sm text-gray-500">
                        +{challenge.testCases.length - 2} more test cases
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {!assessment.challenges?.length && (
          <div className="text-center py-8 text-gray-500">
            <Code className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No challenges added yet. Use AI generation or add manually.</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderEvaluationStep = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="passingScore">Passing Score (%) *</Label>
          <Input
            id="passingScore"
            type="number"
            min="0"
            max="100"
            value={assessment.passingScore || 70}
            onChange={(e) => setAssessment(prev => ({ 
              ...prev, 
              passingScore: parseInt(e.target.value) || 70 
            }))}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Switch
              checked={assessment.useAIEvaluation || false}
              onCheckedChange={(checked) => setAssessment(prev => ({ 
                ...prev, 
                useAIEvaluation: checked 
              }))}
            />
            <Label>Use AI-Assisted Evaluation</Label>
          </div>
        </div>
      </div>

      {assessment.useAIEvaluation && (
        <div className="space-y-2">
          <Label htmlFor="customInstructions">Custom AI Instructions</Label>
          <Textarea
            id="customInstructions"
            value={assessment.customInstructions || ''}
            onChange={(e) => setAssessment(prev => ({ 
              ...prev, 
              customInstructions: e.target.value 
            }))}
            placeholder="Provide specific instructions for AI evaluation..."
            rows={3}
          />
        </div>
      )}

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h4 className="font-semibold">Evaluation Criteria</h4>
          <Button onClick={addEvaluationCriteria} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Criteria
          </Button>
        </div>

        {assessment.evaluationCriteria?.map((criteria, index) => (
          <Card key={criteria.criteriaId}>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div className="space-y-2">
                  <Label>Criteria Name *</Label>
                  <Input
                    value={criteria.name}
                    onChange={(e) => updateEvaluationCriteria(index, { 
                      name: e.target.value 
                    })}
                    placeholder="e.g., Code Quality"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Weight (0-1)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="1"
                    step="0.1"
                    value={criteria.weight}
                    onChange={(e) => updateEvaluationCriteria(index, { 
                      weight: parseFloat(e.target.value) || 1 
                    })}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeEvaluationCriteria(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={criteria.description}
                  onChange={(e) => updateEvaluationCriteria(index, { 
                    description: e.target.value 
                  })}
                  placeholder="Describe what this criteria evaluates..."
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderReviewStep = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Assessment Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Title</Label>
              <p className="text-sm text-gray-600">{assessment.title}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Difficulty</Label>
              <Badge variant="outline">{assessment.difficultyLevel}</Badge>
            </div>
            <div>
              <Label className="text-sm font-medium">Duration</Label>
              <p className="text-sm text-gray-600">{assessment.estimatedDuration} minutes</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Passing Score</Label>
              <p className="text-sm text-gray-600">{assessment.passingScore}%</p>
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium">Target Skills ({assessment.targetSkills?.length || 0})</Label>
            <div className="flex flex-wrap gap-2 mt-1">
              {assessment.targetSkills?.map((skill, index) => (
                <Badge key={index} variant="secondary">
                  {skill.skillName} (Level {skill.minimumLevel}+)
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium">Challenges ({assessment.challenges?.length || 0})</Label>
            <div className="space-y-2 mt-1">
              {assessment.challenges?.map((challenge, index) => (
                <div key={challenge.challengeId} className="p-2 bg-gray-50 rounded text-sm">
                  <div className="font-medium">{challenge.title}</div>
                  <div className="text-gray-600">{challenge.description}</div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {validationErrors.length > 0 && (
        <Card className="border-red-200">
          <CardContent className="p-4">
            <div className="flex items-start space-x-2">
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
              <div>
                <h4 className="font-medium text-red-800">Validation Errors</h4>
                <ul className="mt-1 text-sm text-red-600 list-disc list-inside">
                  {validationErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">
            {existingAssessment ? 'Edit Assessment' : 'Create Assessment'}
          </h1>
          <p className="text-gray-600">
            Design custom coding assessments with AI-powered evaluation
          </p>
        </div>
        <div className="space-x-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={() => handleSave(false)} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Draft'}
          </Button>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = index === currentStep;
          const isCompleted = index < currentStep;
          
          return (
            <div key={step.id} className="flex items-center">
              <div className={`
                flex items-center justify-center w-10 h-10 rounded-full border-2 
                ${isActive ? 'border-blue-500 bg-blue-500 text-white' : 
                  isCompleted ? 'border-green-500 bg-green-500 text-white' : 
                  'border-gray-300 bg-white text-gray-400'}
              `}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="ml-2 hidden sm:block">
                <div className={`text-sm font-medium ${isActive ? 'text-blue-600' : 'text-gray-500'}`}>
                  {step.title}
                </div>
              </div>
              {index < steps.length - 1 && (
                <div className={`w-12 h-0.5 mx-4 ${isCompleted ? 'bg-green-500' : 'bg-gray-300'}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Progress Bar */}
      <Progress value={(currentStep / (steps.length - 1)) * 100} className="w-full" />

      {/* Step Content */}
      <Card>
        <CardContent className="p-6">
          {currentStep === 0 && renderBasicInfoStep()}
          {currentStep === 1 && renderSkillsStep()}
          {currentStep === 2 && renderChallengesStep()}
          {currentStep === 3 && renderEvaluationStep()}
          {currentStep === 4 && renderReviewStep()}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={handlePrevious} 
          disabled={currentStep === 0}
        >
          Previous
        </Button>
        
        <div className="space-x-2">
          {currentStep === steps.length - 1 ? (
            <Button onClick={() => handleSave(true)} disabled={saving}>
              <Play className="h-4 w-4 mr-2" />
              {saving ? 'Publishing...' : 'Publish Assessment'}
            </Button>
          ) : (
            <Button onClick={handleNext}>
              Next
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}