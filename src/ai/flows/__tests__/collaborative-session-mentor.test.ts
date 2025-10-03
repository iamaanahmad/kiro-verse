import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  analyzeCollaborativeSession 
} from '../collaborative-session-mentor';

// Mock AI genkit
vi.mock('@/ai/genkit', () => ({
  ai: {
    defineFlow: vi.fn((config, handler) => handler),
    generate: vi.fn()
  }
}));

describe('Collaborative Session Mentor AI Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('analyzeCollaborativeSession', () => {
    const mockInput = {
      sessionId: 'test-session-id',
      currentCode: 'function hello() { console.log("Hello World"); }',
      codeHistory: [
        {
          entryId: 'entry-1',
          timestamp: '2024-01-01T10:00:00Z',
          userId: 'user-1',
          username: 'Alice',
          operation: 'insert' as const,
          newContent: 'function hello() {',
          description: 'Added function declaration'
        }
      ],
      participants: [
        {
          userId: 'user-1',
          username: 'Alice',
          role: 'host' as const,
          skillLevel: 'intermediate',
          isActive: true
        }
      ],
      sessionContext: {
        skillLevel: 'mixed' as const,
        focusAreas: ['javascript', 'functions'],
        duration: 45,
        aiMentorEnabled: true
      },
      triggerType: 'code_change' as const
    };

    it('should analyze session and provide suggestions and insights', async () => {
      const { ai } = await import('@/ai/genkit');
      vi.mocked(ai.generate).mockResolvedValue({ 
        output: 'Analysis complete with suggestions and insights' 
      });

      const result = await analyzeCollaborativeSession(mockInput);

      expect(result).toHaveProperty('suggestions');
      expect(result).toHaveProperty('insights');
      expect(result).toHaveProperty('collaborationFeedback');

      expect(result.suggestions).toBeInstanceOf(Array);
      expect(result.insights).toBeInstanceOf(Array);
      expect(result.collaborationFeedback).toHaveProperty('teamDynamics');
      expect(result.collaborationFeedback).toHaveProperty('codeQualityTrend');
    });

    it('should handle analysis errors gracefully', async () => {
      const { ai } = await import('@/ai/genkit');
      vi.mocked(ai.generate).mockRejectedValue(new Error('AI service unavailable'));

      await expect(analyzeCollaborativeSession(mockInput)).rejects.toThrow('AI service unavailable');
    });
  });
});