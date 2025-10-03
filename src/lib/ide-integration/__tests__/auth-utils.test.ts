import { describe, it, expect, beforeEach } from 'vitest';
import {
  generateApiKey,
  hashApiKey,
  isValidApiKeyFormat,
  extractUserIdFromApiKey,
  RateLimiter,
  validatePluginCapabilities,
} from '../auth-utils';

describe('Auth Utils', () => {
  describe('generateApiKey', () => {
    it('should generate a valid API key format', () => {
      const userId = 'testuser123';
      const apiKey = generateApiKey(userId);

      expect(apiKey).toMatch(/^kiro_testuser123_[a-z0-9]+_[a-f0-9]{8}_[a-f0-9]{32}$/);
      expect(apiKey.length).toBeGreaterThan(50);
    });

    it('should generate unique API keys', () => {
      const userId = 'testuser';
      const key1 = generateApiKey(userId);
      const key2 = generateApiKey(userId);

      expect(key1).not.toBe(key2);
    });
  });

  describe('hashApiKey', () => {
    it('should hash API key consistently', () => {
      const apiKey = 'test-api-key';
      const hash1 = hashApiKey(apiKey);
      const hash2 = hashApiKey(apiKey);

      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64); // SHA-256 hex length
    });

    it('should produce different hashes for different keys', () => {
      const hash1 = hashApiKey('key1');
      const hash2 = hashApiKey('key2');

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('isValidApiKeyFormat', () => {
    it('should validate correct API key format', () => {
      const validKey = 'kiro_user123_abc123_12345678_abcdef1234567890abcdef1234567890abcdef12';
      expect(isValidApiKeyFormat(validKey)).toBe(true);
    });

    it('should reject invalid API key formats', () => {
      const invalidKeys = [
        'invalid-key',
        'kiro_user_short',
        'wrong_prefix_user_abc_12345678_abcdef1234567890abcdef1234567890abcdef12',
        'kiro_user_abc_1234567_abcdef1234567890abcdef1234567890abcdef12', // short hash
      ];

      invalidKeys.forEach(key => {
        expect(isValidApiKeyFormat(key)).toBe(false);
      });
    });
  });

  describe('extractUserIdFromApiKey', () => {
    it('should extract user ID from valid API key', () => {
      const apiKey = 'kiro_testuser123_abc123_12345678_abcdef1234567890abcdef1234567890abcdef12';
      const userId = extractUserIdFromApiKey(apiKey);

      expect(userId).toBe('testuser123');
    });

    it('should return null for invalid API key', () => {
      const invalidKey = 'invalid-key';
      const userId = extractUserIdFromApiKey(invalidKey);

      expect(userId).toBeNull();
    });
  });

  describe('RateLimiter', () => {
    let rateLimiter: RateLimiter;

    beforeEach(() => {
      rateLimiter = new RateLimiter(5, 1000); // 5 requests per second
    });

    it('should allow requests within limit', () => {
      const identifier = 'test-user';

      for (let i = 0; i < 5; i++) {
        expect(rateLimiter.isAllowed(identifier)).toBe(true);
      }
    });

    it('should reject requests exceeding limit', () => {
      const identifier = 'test-user';

      // Use up the limit
      for (let i = 0; i < 5; i++) {
        rateLimiter.isAllowed(identifier);
      }

      // Next request should be rejected
      expect(rateLimiter.isAllowed(identifier)).toBe(false);
    });

    it('should track remaining requests correctly', () => {
      const identifier = 'test-user';

      expect(rateLimiter.getRemainingRequests(identifier)).toBe(5);

      rateLimiter.isAllowed(identifier);
      expect(rateLimiter.getRemainingRequests(identifier)).toBe(4);

      rateLimiter.isAllowed(identifier);
      expect(rateLimiter.getRemainingRequests(identifier)).toBe(3);
    });

    it('should handle multiple users independently', () => {
      const user1 = 'user1';
      const user2 = 'user2';

      // User1 uses up their limit
      for (let i = 0; i < 5; i++) {
        rateLimiter.isAllowed(user1);
      }

      // User2 should still have full limit
      expect(rateLimiter.getRemainingRequests(user2)).toBe(5);
      expect(rateLimiter.isAllowed(user2)).toBe(true);
    });
  });

  describe('validatePluginCapabilities', () => {
    it('should validate allowed capabilities', () => {
      const allowedCapabilities = {
        feedback: true,
        credentials: true,
        realTimeAnalysis: false,
        badgeNotifications: true,
      };

      const requestedCapabilities = ['feedback', 'credentials', 'badgeNotifications'];
      const validCapabilities = validatePluginCapabilities(requestedCapabilities, allowedCapabilities);

      expect(validCapabilities).toEqual(['feedback', 'credentials', 'badgeNotifications']);
    });

    it('should filter out disallowed capabilities', () => {
      const allowedCapabilities = {
        feedback: true,
        credentials: false,
        realTimeAnalysis: false,
        badgeNotifications: true,
      };

      const requestedCapabilities = ['feedback', 'credentials', 'realTimeAnalysis'];
      const validCapabilities = validatePluginCapabilities(requestedCapabilities, allowedCapabilities);

      expect(validCapabilities).toEqual(['feedback']);
    });

    it('should handle empty requests', () => {
      const allowedCapabilities = {
        feedback: true,
        credentials: true,
        realTimeAnalysis: true,
        badgeNotifications: true,
      };

      const validCapabilities = validatePluginCapabilities([], allowedCapabilities);

      expect(validCapabilities).toEqual([]);
    });
  });
});