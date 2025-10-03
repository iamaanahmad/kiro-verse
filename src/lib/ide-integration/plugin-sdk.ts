/**
 * KiroVerse IDE Plugin SDK
 * 
 * This SDK provides a standardized interface for IDE plugins to integrate
 * with the KiroVerse learning analytics and feedback system.
 */

export interface KiroVerseConfig {
  apiKey: string;
  userId: string;
  baseUrl?: string;
  realtimeUrl?: string;
  enableRealtime?: boolean;
  enableNotifications?: boolean;
}

export interface CodeAnalysisRequest {
  code: string;
  language: string;
  fileName?: string;
  projectType?: string;
  framework?: string;
}

export interface CodeAnalysisResponse {
  feedback: string;
  suggestions: string[];
  skillsUsed: string[];
  codeQuality: {
    score: number;
    areas: string[];
  };
  learningInsights: string[];
}

export interface UserCredentials {
  badges: Array<{
    id: string;
    name: string;
    description: string;
    skillCategory: string;
    rarity: string;
    issuedAt: string;
    verificationUrl: string;
  }>;
  skills: Array<{
    skillId: string;
    skillName: string;
    level: number;
    experiencePoints: number;
    lastUpdated: string;
  }>;
  profileUrl: string;
}

export interface RealtimeEvent {
  type: 'code_analysis' | 'skill_update' | 'badge_earned' | 'suggestion';
  data: any;
  timestamp: string;
}

export class KiroVerseSDK {
  private config: Required<KiroVerseConfig>;
  private ws: WebSocket | null = null;
  private eventListeners: Map<string, Function[]> = new Map();

  constructor(config: KiroVerseConfig) {
    this.config = {
      baseUrl: 'https://kiroverse.com/api',
      realtimeUrl: 'wss://kiroverse.com/ws',
      enableRealtime: true,
      enableNotifications: true,
      ...config,
    };
  }

  /**
   * Initialize the SDK and establish connections
   */
  async initialize(): Promise<void> {
    // Validate API key
    await this.validateApiKey();

    // Connect to realtime service if enabled
    if (this.config.enableRealtime) {
      await this.connectRealtime();
    }
  }

  /**
   * Get AI feedback for code
   */
  async getCodeFeedback(request: CodeAnalysisRequest): Promise<CodeAnalysisResponse> {
    const response = await fetch(`${this.config.baseUrl}/ide-integration/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        ...request,
        userId: this.config.userId,
        apiKey: this.config.apiKey,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to get feedback: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get user credentials and badges
   */
  async getUserCredentials(): Promise<UserCredentials> {
    const response = await fetch(
      `${this.config.baseUrl}/ide-integration/credentials?userId=${this.config.userId}&apiKey=${this.config.apiKey}`,
      {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get credentials: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Connect to realtime feedback service
   */
  private async connectRealtime(): Promise<void> {
    return new Promise((resolve, reject) => {
      const wsUrl = `${this.config.realtimeUrl}?userId=${this.config.userId}&apiKey=${this.config.apiKey}`;
      
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('Connected to KiroVerse realtime service');
        resolve();
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.handleRealtimeMessage(message);
        } catch (error) {
          console.error('Error parsing realtime message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        reject(error);
      };

      this.ws.onclose = () => {
        console.log('Disconnected from KiroVerse realtime service');
        // Attempt to reconnect after 5 seconds
        setTimeout(() => {
          if (this.config.enableRealtime) {
            this.connectRealtime();
          }
        }, 5000);
      };
    });
  }

  /**
   * Handle realtime messages
   */
  private handleRealtimeMessage(message: any): void {
    switch (message.type) {
      case 'connection_established':
        this.emit('connected', message.data);
        break;
      case 'feedback':
        this.emit('feedback', message.data);
        break;
      case 'code_analysis_result':
        this.emit('analysis_result', message.data);
        break;
      case 'error':
        this.emit('error', message.data);
        break;
      default:
        console.log('Unknown message type:', message.type);
    }
  }

  /**
   * Subscribe to realtime events
   */
  subscribeToEvents(events: string[]): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'subscribe',
        events,
      }));
    }
  }

  /**
   * Request realtime code analysis
   */
  requestRealtimeAnalysis(request: CodeAnalysisRequest, requestId?: string): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'code_analysis_request',
        requestId: requestId || Date.now().toString(),
        ...request,
      }));
    }
  }

  /**
   * Add event listener
   */
  on(event: string, listener: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(listener);
  }

  /**
   * Remove event listener
   */
  off(event: string, listener: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Emit event to listeners
   */
  private emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          console.error('Error in event listener:', error);
        }
      });
    }
  }

  /**
   * Validate API key
   */
  private async validateApiKey(): Promise<void> {
    const response = await fetch(`${this.config.baseUrl}/ide-integration/auth/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        apiKey: this.config.apiKey,
        userId: this.config.userId,
      }),
    });

    if (!response.ok) {
      throw new Error('Invalid API key');
    }
  }

  /**
   * Disconnect from all services
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.eventListeners.clear();
  }

  /**
   * Get SDK status
   */
  getStatus(): {
    connected: boolean;
    realtimeConnected: boolean;
    apiKeyValid: boolean;
  } {
    return {
      connected: true,
      realtimeConnected: this.ws?.readyState === WebSocket.OPEN,
      apiKeyValid: true, // Would be determined by last validation
    };
  }
}

/**
 * Utility functions for plugin developers
 */
export class KiroVerseUtils {
  /**
   * Detect programming language from file extension
   */
  static detectLanguage(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    const languageMap: Record<string, string> = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'py': 'python',
      'java': 'java',
      'cpp': 'cpp',
      'c': 'c',
      'cs': 'csharp',
      'php': 'php',
      'rb': 'ruby',
      'go': 'go',
      'rs': 'rust',
      'swift': 'swift',
      'kt': 'kotlin',
      'scala': 'scala',
    };

    return languageMap[extension || ''] || 'unknown';
  }

  /**
   * Detect project framework from file patterns
   */
  static detectFramework(files: string[]): string {
    if (files.some(f => f.includes('package.json'))) {
      if (files.some(f => f.includes('next.config'))) return 'nextjs';
      if (files.some(f => f.includes('react'))) return 'react';
      return 'nodejs';
    }
    
    if (files.some(f => f.includes('requirements.txt') || f.includes('setup.py'))) {
      if (files.some(f => f.includes('django'))) return 'django';
      if (files.some(f => f.includes('flask'))) return 'flask';
      return 'python';
    }

    return 'unknown';
  }

  /**
   * Format code quality score for display
   */
  static formatQualityScore(score: number): string {
    if (score >= 9) return 'Excellent';
    if (score >= 7) return 'Good';
    if (score >= 5) return 'Fair';
    return 'Needs Improvement';
  }

  /**
   * Generate plugin configuration template
   */
  static generateConfigTemplate(pluginName: string): string {
    return JSON.stringify({
      name: pluginName,
      version: '1.0.0',
      kiroverse: {
        apiKey: 'YOUR_API_KEY_HERE',
        userId: 'YOUR_USER_ID_HERE',
        enableRealtime: true,
        enableNotifications: true,
      },
    }, null, 2);
  }
}