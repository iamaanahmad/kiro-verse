import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { KiroVerseSDK, KiroVerseUtils } from '../plugin-sdk';

// Mock fetch
global.fetch = vi.fn();

// Mock WebSocket
global.WebSocket = vi.fn().mockImplementation(() => ({
  readyState: 1, // OPEN
  send: vi.fn(),
  close: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  onopen: null,
  onmessage: null,
  onerror: null,
  onclose: null,
}));

describe('KiroVerseSDK', () => {
  let sdk: KiroVerseSDK;
  let mockFetch: any;

  beforeEach(() => {
    mockFetch = global.fetch as any;
    mockFetch.mockClear();

    sdk = new KiroVerseSDK({
      apiKey: 'test-api-key',
      userId: 'test-user',
      baseUrl: 'http://localhost:3000/api',
      realtimeUrl: 'ws://localhost:8080',
      enableRealtime: false, // Disable for most tests
    });
  });

  afterEach(() => {
    sdk.disconnect();
  });

  describe('getCodeFeedback', () => {
    it('should get code feedback successfully', async () => {
      const mockResponse = {
        feedback: 'Good code structure',
        suggestions: ['Add error handling'],
        skillsUsed: ['javascript'],
        codeQuality: { score: 8, areas: ['readability'] },
        learningInsights: ['Practice error handling'],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await sdk.getCodeFeedback({
        code: 'console.log("hello");',
        language: 'javascript',
        fileName: 'test.js',
      });

      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/ide-integration/feedback',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-api-key',
          }),
        })
      );
    });

    it('should handle API errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Unauthorized',
      });

      await expect(sdk.getCodeFeedback({
        code: 'test',
        language: 'javascript',
      })).rejects.toThrow('Failed to get feedback: Unauthorized');
    });
  });

  describe('getUserCredentials', () => {
    it('should get user credentials successfully', async () => {
      const mockCredentials = {
        badges: [
          {
            id: 'badge-1',
            name: 'JavaScript Expert',
            description: 'Advanced JavaScript skills',
            skillCategory: 'javascript',
            rarity: 'epic',
            issuedAt: '2023-12-01T00:00:00Z',
            verificationUrl: 'https://example.com/verify',
          },
        ],
        skills: [
          {
            skillId: 'javascript',
            skillName: 'JavaScript',
            level: 4,
            experiencePoints: 1200,
            lastUpdated: '2023-12-01T00:00:00Z',
          },
        ],
        profileUrl: 'https://kiroverse.com/profile/test-user',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockCredentials),
      });

      const result = await sdk.getUserCredentials();

      expect(result).toEqual(mockCredentials);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/ide-integration/credentials?userId=test-user&apiKey=test-api-key',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-api-key',
          }),
        })
      );
    });
  });

  describe('event handling', () => {
    it('should add and remove event listeners', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();

      sdk.on('test-event', listener1);
      sdk.on('test-event', listener2);

      // Emit event
      (sdk as any).emit('test-event', { data: 'test' });

      expect(listener1).toHaveBeenCalledWith({ data: 'test' });
      expect(listener2).toHaveBeenCalledWith({ data: 'test' });

      // Remove listener
      sdk.off('test-event', listener1);
      (sdk as any).emit('test-event', { data: 'test2' });

      expect(listener1).toHaveBeenCalledTimes(1); // Not called again
      expect(listener2).toHaveBeenCalledWith({ data: 'test2' });
    });

    it('should handle listener errors gracefully', () => {
      const errorListener = vi.fn().mockImplementation(() => {
        throw new Error('Listener error');
      });
      const normalListener = vi.fn();

      sdk.on('test-event', errorListener);
      sdk.on('test-event', normalListener);

      // Should not throw
      expect(() => {
        (sdk as any).emit('test-event', { data: 'test' });
      }).not.toThrow();

      expect(normalListener).toHaveBeenCalled();
    });
  });

  describe('status', () => {
    it('should return correct status', () => {
      const status = sdk.getStatus();

      expect(status).toEqual({
        connected: true,
        realtimeConnected: false,
        apiKeyValid: true,
      });
    });
  });
});

describe('KiroVerseUtils', () => {
  describe('detectLanguage', () => {
    it('should detect language from file extension', () => {
      expect(KiroVerseUtils.detectLanguage('test.js')).toBe('javascript');
      expect(KiroVerseUtils.detectLanguage('component.tsx')).toBe('typescript');
      expect(KiroVerseUtils.detectLanguage('script.py')).toBe('python');
      expect(KiroVerseUtils.detectLanguage('Main.java')).toBe('java');
      expect(KiroVerseUtils.detectLanguage('unknown.xyz')).toBe('unknown');
    });

    it('should handle files without extensions', () => {
      expect(KiroVerseUtils.detectLanguage('README')).toBe('unknown');
      expect(KiroVerseUtils.detectLanguage('')).toBe('unknown');
    });
  });

  describe('detectFramework', () => {
    it('should detect Node.js frameworks', () => {
      expect(KiroVerseUtils.detectFramework(['package.json', 'next.config.js'])).toBe('nextjs');
      expect(KiroVerseUtils.detectFramework(['package.json', 'src/App.jsx'])).toBe('react');
      expect(KiroVerseUtils.detectFramework(['package.json', 'index.js'])).toBe('nodejs');
    });

    it('should detect Python frameworks', () => {
      expect(KiroVerseUtils.detectFramework(['requirements.txt', 'manage.py'])).toBe('django');
      expect(KiroVerseUtils.detectFramework(['setup.py', 'app.py'])).toBe('flask');
      expect(KiroVerseUtils.detectFramework(['requirements.txt', 'main.py'])).toBe('python');
    });

    it('should return unknown for unrecognized patterns', () => {
      expect(KiroVerseUtils.detectFramework(['random.txt', 'other.file'])).toBe('unknown');
      expect(KiroVerseUtils.detectFramework([])).toBe('unknown');
    });
  });

  describe('formatQualityScore', () => {
    it('should format quality scores correctly', () => {
      expect(KiroVerseUtils.formatQualityScore(10)).toBe('Excellent');
      expect(KiroVerseUtils.formatQualityScore(9)).toBe('Excellent');
      expect(KiroVerseUtils.formatQualityScore(8)).toBe('Good');
      expect(KiroVerseUtils.formatQualityScore(7)).toBe('Good');
      expect(KiroVerseUtils.formatQualityScore(6)).toBe('Fair');
      expect(KiroVerseUtils.formatQualityScore(5)).toBe('Fair');
      expect(KiroVerseUtils.formatQualityScore(4)).toBe('Needs Improvement');
      expect(KiroVerseUtils.formatQualityScore(1)).toBe('Needs Improvement');
    });
  });

  describe('generateConfigTemplate', () => {
    it('should generate valid config template', () => {
      const template = KiroVerseUtils.generateConfigTemplate('My IDE Plugin');
      const config = JSON.parse(template);

      expect(config).toEqual({
        name: 'My IDE Plugin',
        version: '1.0.0',
        kiroverse: {
          apiKey: 'YOUR_API_KEY_HERE',
          userId: 'YOUR_USER_ID_HERE',
          enableRealtime: true,
          enableNotifications: true,
        },
      });
    });
  });
});