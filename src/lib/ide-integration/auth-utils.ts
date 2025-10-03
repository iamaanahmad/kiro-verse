import crypto from 'crypto';

/**
 * Generate a secure API key for IDE plugin integration
 */
export function generateApiKey(userId: string): string {
  const timestamp = Date.now().toString(36);
  const randomBytes = crypto.randomBytes(16).toString('hex');
  const userHash = crypto.createHash('sha256').update(userId).digest('hex').substring(0, 8);
  
  return `kiro_${userId}_${timestamp}_${userHash}_${randomBytes}`;
}

/**
 * Hash an API key for secure storage
 */
export function hashApiKey(apiKey: string): string {
  return crypto.createHash('sha256').update(apiKey).digest('hex');
}

/**
 * Validate API key format
 */
export function isValidApiKeyFormat(apiKey: string): boolean {
  const pattern = /^kiro_[a-zA-Z0-9]+_[a-z0-9]+_[a-f0-9]{8}_[a-f0-9]{32}$/;
  return pattern.test(apiKey);
}

/**
 * Extract user ID from API key
 */
export function extractUserIdFromApiKey(apiKey: string): string | null {
  if (!isValidApiKeyFormat(apiKey)) {
    return null;
  }
  
  const parts = apiKey.split('_');
  return parts.length >= 2 ? parts[1] : null;
}

/**
 * Generate plugin SDK token for documentation access
 */
export function generateSDKToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Validate request signature for webhook security
 */
export function validateRequestSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  );
}

/**
 * Rate limiting utilities
 */
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  
  constructor(
    private maxRequests: number = 100,
    private windowMs: number = 60000 // 1 minute
  ) {}
  
  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    if (!this.requests.has(identifier)) {
      this.requests.set(identifier, []);
    }
    
    const userRequests = this.requests.get(identifier)!;
    
    // Remove old requests outside the window
    const validRequests = userRequests.filter(time => time > windowStart);
    
    if (validRequests.length >= this.maxRequests) {
      return false;
    }
    
    // Add current request
    validRequests.push(now);
    this.requests.set(identifier, validRequests);
    
    return true;
  }
  
  getRemainingRequests(identifier: string): number {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    if (!this.requests.has(identifier)) {
      return this.maxRequests;
    }
    
    const userRequests = this.requests.get(identifier)!;
    const validRequests = userRequests.filter(time => time > windowStart);
    
    return Math.max(0, this.maxRequests - validRequests.length);
  }
}

/**
 * Plugin capability validation
 */
export interface PluginCapabilities {
  feedback: boolean;
  credentials: boolean;
  realTimeAnalysis: boolean;
  badgeNotifications: boolean;
}

export function validatePluginCapabilities(
  requestedCapabilities: string[],
  allowedCapabilities: PluginCapabilities
): string[] {
  const validCapabilities: string[] = [];
  
  for (const capability of requestedCapabilities) {
    if (capability in allowedCapabilities && allowedCapabilities[capability as keyof PluginCapabilities]) {
      validCapabilities.push(capability);
    }
  }
  
  return validCapabilities;
}

/**
 * Security headers for API responses
 */
export function getSecurityHeaders(): Record<string, string> {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Content-Security-Policy': "default-src 'self'",
  };
}