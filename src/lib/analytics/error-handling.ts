/**
 * @fileOverview Analytics System Error Handling and Recovery
 * 
 * This module provides comprehensive error handling for the analytics system including:
 * - Graceful degradation for analytics processing failures
 * - Retry mechanisms for failed AI analysis operations
 * - Fallback systems for when advanced features are unavailable
 * - Comprehensive error logging and monitoring
 */

import { AnalyticsData, UserProgress, LearningInsight, SkillLevel } from '@/types/analytics';
import { UserProgressService, AnalyticsDataService, LearningInsightsService } from '@/lib/firebase/analytics';

export interface ErrorContext {
  operation: string;
  userId?: string;
  sessionId?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

export interface FallbackData {
  userProgress: UserProgress | null;
  analyticsData: AnalyticsData | null;
  learningInsights: LearningInsight[];
  skillLevels: SkillLevel[];
}

export class AnalyticsError extends Error {
  public readonly code: string;
  public readonly context: ErrorContext;
  public readonly recoverable: boolean;
  public readonly severity: 'low' | 'medium' | 'high' | 'critical';

  constructor(
    message: string,
    code: string,
    context: ErrorContext,
    recoverable: boolean = true,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ) {
    super(message);
    this.name = 'AnalyticsError';
    this.code = code;
    this.context = context;
    this.recoverable = recoverable;
    this.severity = severity;
  }
}

export class AnalyticsErrorHandler {
  private static readonly DEFAULT_RETRY_CONFIG: RetryConfig = {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2
  };

  private static readonly ERROR_CODES = {
    AI_ANALYSIS_FAILED: 'AI_ANALYSIS_FAILED',
    DATABASE_ERROR: 'DATABASE_ERROR',
    SKILL_CALCULATION_ERROR: 'SKILL_CALCULATION_ERROR',
    INSIGHT_GENERATION_ERROR: 'INSIGHT_GENERATION_ERROR',
    PROGRESS_UPDATE_ERROR: 'PROGRESS_UPDATE_ERROR',
    NETWORK_ERROR: 'NETWORK_ERROR',
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    TIMEOUT_ERROR: 'TIMEOUT_ERROR'
  } as const;

  /**
   * Handles analytics processing errors with graceful degradation
   */
  static async handleAnalyticsProcessingError(
    error: Error,
    context: ErrorContext,
    fallbackData?: Partial<FallbackData>
  ): Promise<AnalyticsData> {
    const analyticsError = this.createAnalyticsError(error, context);
    
    // Log the error
    await this.logError(analyticsError);

    // Attempt recovery based on error type
    if (analyticsError.recoverable) {
      try {
        return await this.attemptRecovery(analyticsError, fallbackData);
      } catch (recoveryError) {
        console.error('Recovery attempt failed:', recoveryError);
      }
    }

    // Return fallback analytics data
    return this.createFallbackAnalyticsData(context, fallbackData);
  }

  /**
   * Implements retry mechanism with exponential backoff
   */
  static async withRetry<T>(
    operation: () => Promise<T>,
    context: ErrorContext,
    config: Partial<RetryConfig> = {}
  ): Promise<T> {
    const retryConfig = { ...this.DEFAULT_RETRY_CONFIG, ...config };
    let lastError: Error;

    for (let attempt = 1; attempt <= retryConfig.maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        // Log retry attempt
        console.warn(`Retry attempt ${attempt}/${retryConfig.maxAttempts} failed:`, {
          operation: context.operation,
          error: error instanceof Error ? error.message : String(error),
          attempt
        });

        // Don't retry on the last attempt
        if (attempt === retryConfig.maxAttempts) {
          break;
        }

        // Calculate delay with exponential backoff
        const delay = Math.min(
          retryConfig.baseDelay * Math.pow(retryConfig.backoffMultiplier, attempt - 1),
          retryConfig.maxDelay
        );

        // Add jitter to prevent thundering herd
        const jitteredDelay = delay + Math.random() * 1000;
        
        await this.sleep(jitteredDelay);
      }
    }

    // All retries failed, throw the last error
    throw this.createAnalyticsError(lastError, {
      ...context,
      metadata: { ...context.metadata, retriesExhausted: true }
    });
  }

  /**
   * Provides fallback analytics data when primary systems fail
   */
  static async getFallbackAnalyticsData(userId: string): Promise<FallbackData> {
    try {
      // Try to get cached or basic data
      const [userProgress, recentAnalytics] = await Promise.allSettled([
        this.getCachedUserProgress(userId),
        this.getBasicAnalyticsData(userId)
      ]);

      return {
        userProgress: userProgress.status === 'fulfilled' ? userProgress.value : null,
        analyticsData: recentAnalytics.status === 'fulfilled' ? recentAnalytics.value : null,
        learningInsights: [],
        skillLevels: []
      };
    } catch (error) {
      console.error('Failed to get fallback data:', error);
      return {
        userProgress: null,
        analyticsData: null,
        learningInsights: [],
        skillLevels: []
      };
    }
  }

  /**
   * Handles AI analysis failures with fallback processing
   */
  static async handleAIAnalysisFailure(
    code: string,
    context: ErrorContext
  ): Promise<any> {
    try {
      // Attempt basic code analysis without AI
      const basicAnalysis = await this.performBasicCodeAnalysis(code);
      
      // Log degraded service
      await this.logError(new AnalyticsError(
        'AI analysis unavailable, using basic analysis',
        this.ERROR_CODES.AI_ANALYSIS_FAILED,
        context,
        true,
        'medium'
      ));

      return {
        aiResponse: `Basic analysis completed. AI analysis temporarily unavailable.`,
        analysisQuality: 'basic',
        fallbackUsed: true,
        basicMetrics: basicAnalysis
      };
    } catch (fallbackError) {
      console.error('Fallback analysis also failed:', fallbackError);
      
      return {
        aiResponse: 'Analysis temporarily unavailable. Please try again later.',
        analysisQuality: 'unavailable',
        fallbackUsed: true,
        error: true
      };
    }
  }

  /**
   * Handles database operation failures with retry and fallback
   */
  static async handleDatabaseError<T>(
    operation: () => Promise<T>,
    context: ErrorContext,
    fallbackValue?: T
  ): Promise<T> {
    try {
      return await this.withRetry(operation, context, {
        maxAttempts: 2,
        baseDelay: 500
      });
    } catch (error) {
      const dbError = new AnalyticsError(
        `Database operation failed: ${error instanceof Error ? error.message : String(error)}`,
        this.ERROR_CODES.DATABASE_ERROR,
        context,
        true,
        'high'
      );

      await this.logError(dbError);

      if (fallbackValue !== undefined) {
        return fallbackValue;
      }

      throw dbError;
    }
  }

  /**
   * Validates analytics data and handles validation errors
   */
  static validateAnalyticsData(data: any, context: ErrorContext): void {
    const errors: string[] = [];

    if (!data) {
      errors.push('Analytics data is null or undefined');
    }

    if (data && typeof data.userId !== 'string') {
      errors.push('Invalid or missing userId');
    }

    if (data && !data.timestamp) {
      errors.push('Missing timestamp');
    }

    if (errors.length > 0) {
      throw new AnalyticsError(
        `Validation failed: ${errors.join(', ')}`,
        this.ERROR_CODES.VALIDATION_ERROR,
        context,
        false,
        'medium'
      );
    }
  }

  /**
   * Handles timeout errors for long-running operations
   */
  static async withTimeout<T>(
    operation: () => Promise<T>,
    timeoutMs: number,
    context: ErrorContext
  ): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new AnalyticsError(
          `Operation timed out after ${timeoutMs}ms`,
          this.ERROR_CODES.TIMEOUT_ERROR,
          context,
          true,
          'medium'
        ));
      }, timeoutMs);
    });

    return Promise.race([operation(), timeoutPromise]);
  }

  /**
   * Creates circuit breaker for failing services
   */
  static createCircuitBreaker(
    serviceName: string,
    failureThreshold: number = 5,
    resetTimeoutMs: number = 60000
  ) {
    let failures = 0;
    let lastFailureTime = 0;
    let state: 'closed' | 'open' | 'half-open' = 'closed';

    return async <T>(operation: () => Promise<T>): Promise<T> => {
      const now = Date.now();

      // Check if we should reset the circuit breaker
      if (state === 'open' && now - lastFailureTime > resetTimeoutMs) {
        state = 'half-open';
        failures = 0;
      }

      // If circuit is open, fail fast
      if (state === 'open') {
        throw new AnalyticsError(
          `Circuit breaker is open for ${serviceName}`,
          'CIRCUIT_BREAKER_OPEN',
          {
            operation: serviceName,
            timestamp: new Date(),
            metadata: { state, failures, lastFailureTime }
          },
          true,
          'medium'
        );
      }

      try {
        const result = await operation();
        
        // Success - reset failure count
        if (state === 'half-open') {
          state = 'closed';
        }
        failures = 0;
        
        return result;
      } catch (error) {
        failures++;
        lastFailureTime = now;

        // Open circuit if threshold reached
        if (failures >= failureThreshold) {
          state = 'open';
        }

        throw error;
      }
    };
  }

  // Private helper methods

  private static createAnalyticsError(error: Error, context: ErrorContext): AnalyticsError {
    // Determine error code based on error type and message
    let code = 'UNKNOWN_ERROR';
    let severity: 'low' | 'medium' | 'high' | 'critical' = 'medium';

    if (error.message.includes('network') || error.message.includes('fetch')) {
      code = this.ERROR_CODES.NETWORK_ERROR;
      severity = 'medium';
    } else if (error.message.includes('timeout')) {
      code = this.ERROR_CODES.TIMEOUT_ERROR;
      severity = 'medium';
    } else if (error.message.includes('database') || error.message.includes('firestore')) {
      code = this.ERROR_CODES.DATABASE_ERROR;
      severity = 'high';
    } else if (error.message.includes('AI') || error.message.includes('analysis')) {
      code = this.ERROR_CODES.AI_ANALYSIS_FAILED;
      severity = 'medium';
    }

    return new AnalyticsError(
      error.message,
      code,
      context,
      true,
      severity
    );
  }

  private static async attemptRecovery(
    error: AnalyticsError,
    fallbackData?: Partial<FallbackData>
  ): Promise<AnalyticsData> {
    switch (error.code) {
      case this.ERROR_CODES.AI_ANALYSIS_FAILED:
        return this.recoverFromAIFailure(error, fallbackData);
      
      case this.ERROR_CODES.DATABASE_ERROR:
        return this.recoverFromDatabaseFailure(error, fallbackData);
      
      default:
        throw error;
    }
  }

  private static async recoverFromAIFailure(
    error: AnalyticsError,
    fallbackData?: Partial<FallbackData>
  ): Promise<AnalyticsData> {
    // Create minimal analytics data without AI analysis
    return this.createFallbackAnalyticsData(error.context, fallbackData);
  }

  private static async recoverFromDatabaseFailure(
    error: AnalyticsError,
    fallbackData?: Partial<FallbackData>
  ): Promise<AnalyticsData> {
    // Try alternative storage or return cached data
    return this.createFallbackAnalyticsData(error.context, fallbackData);
  }

  private static createFallbackAnalyticsData(
    context: ErrorContext,
    fallbackData?: Partial<FallbackData>
  ): AnalyticsData {
    return {
      sessionId: context.sessionId || `fallback_${Date.now()}`,
      userId: context.userId || 'unknown',
      codeSubmission: {
        submissionId: `fallback_${Date.now()}`,
        code: '',
        language: 'unknown',
        context: 'Fallback data due to processing error',
        metrics: {
          linesOfCode: 0,
          complexity: 0,
          maintainability: 0
        },
        timestamp: new Date()
      },
      aiAnalysis: {
        analysisId: `fallback_${Date.now()}`,
        codeQuality: 0,
        efficiency: 0,
        creativity: 0,
        bestPractices: 0,
        suggestions: ['Analysis temporarily unavailable'],
        detectedSkills: [],
        improvementAreas: [],
        processingTime: 0
      },
      skillImprovements: [],
      learningInsights: [],
      benchmarkComparisons: [],
      timestamp: new Date(),
      processingStatus: 'failed'
    };
  }

  private static async getCachedUserProgress(userId: string): Promise<UserProgress | null> {
    try {
      // Try to get from cache or local storage
      return await UserProgressService.getUserProgress(userId);
    } catch (error) {
      console.warn('Failed to get cached user progress:', error);
      return null;
    }
  }

  private static async getBasicAnalyticsData(userId: string): Promise<AnalyticsData | null> {
    try {
      const recentData = await AnalyticsDataService.getAnalyticsData(userId, 1);
      return recentData.length > 0 ? recentData[0] : null;
    } catch (error) {
      console.warn('Failed to get basic analytics data:', error);
      return null;
    }
  }

  private static async performBasicCodeAnalysis(code: string): Promise<any> {
    // Basic static analysis without AI
    const lines = code.split('\n').filter(line => line.trim().length > 0);
    const functions = (code.match(/function\s+\w+|const\s+\w+\s*=/g) || []).length;
    const complexity = (code.match(/if|for|while|switch/g) || []).length + 1;

    return {
      linesOfCode: lines.length,
      functionCount: functions,
      cyclomaticComplexity: complexity,
      hasTests: code.includes('test(') || code.includes('it('),
      hasComments: code.includes('//') || code.includes('/*'),
      estimatedQuality: Math.min(100, Math.max(0, 70 - complexity * 2 + (functions > 0 ? 10 : 0)))
    };
  }

  private static async logError(error: AnalyticsError): Promise<void> {
    try {
      // Log to console for development
      console.error('Analytics Error:', {
        message: error.message,
        code: error.code,
        severity: error.severity,
        context: error.context,
        recoverable: error.recoverable,
        timestamp: new Date().toISOString()
      });

      // In production, you would send this to your logging service
      // await loggingService.logError(error);
    } catch (loggingError) {
      console.error('Failed to log error:', loggingError);
    }
  }

  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Decorator for automatic error handling and retry
 */
export function withErrorHandling(
  retryConfig?: Partial<RetryConfig>,
  timeoutMs?: number
) {
  return function (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor
  ) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const context: ErrorContext = {
        operation: `${target.constructor.name}.${propertyName}`,
        timestamp: new Date(),
        metadata: { args: args.length }
      };

      try {
        const operation = () => method.apply(this, args);
        
        if (timeoutMs) {
          return await AnalyticsErrorHandler.withTimeout(operation, timeoutMs, context);
        }
        
        if (retryConfig) {
          return await AnalyticsErrorHandler.withRetry(operation, context, retryConfig);
        }
        
        return await operation();
      } catch (error) {
        throw AnalyticsErrorHandler.createAnalyticsError(error as Error, context);
      }
    };

    return descriptor;
  };
}

/**
 * Higher-order component for error boundary with analytics error handling
 */
export function withAnalyticsErrorBoundary<P extends object>(
  Component: React.ComponentType<P>
): React.ComponentType<P> {
  return function AnalyticsErrorBoundaryWrapper(props: P) {
    const handleError = async (error: Error, errorInfo: React.ErrorInfo) => {
      const context: ErrorContext = {
        operation: 'React Component Render',
        timestamp: new Date(),
        metadata: {
          componentName: Component.displayName || Component.name,
          errorInfo
        }
      };

      await AnalyticsErrorHandler.logError(
        new AnalyticsError(
          error.message,
          'COMPONENT_ERROR',
          context,
          true,
          'medium'
        )
      );
    };

    return React.createElement(
      class extends React.Component<P, { hasError: boolean }> {
        constructor(props: P) {
          super(props);
          this.state = { hasError: false };
        }

        static getDerivedStateFromError() {
          return { hasError: true };
        }

        componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
          handleError(error, errorInfo);
        }

        render() {
          if (this.state.hasError) {
            return React.createElement('div', {
              className: 'p-4 text-center text-muted-foreground'
            }, 'Analytics component temporarily unavailable');
          }

          return React.createElement(Component, this.props);
        }
      }
    );
  };
}