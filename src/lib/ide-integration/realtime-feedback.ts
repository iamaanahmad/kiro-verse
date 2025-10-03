import { EventEmitter } from 'events';
import WebSocket from 'ws';

export interface FeedbackEvent {
  type: 'code_analysis' | 'skill_update' | 'badge_earned' | 'suggestion';
  userId: string;
  data: any;
  timestamp: Date;
}

export interface RealtimeFeedbackConfig {
  port?: number;
  maxConnections?: number;
  heartbeatInterval?: number;
  authTimeout?: number;
}

export class RealtimeFeedbackService extends EventEmitter {
  private wss: WebSocket.Server | null = null;
  private connections: Map<string, WebSocket> = new Map();
  private config: Required<RealtimeFeedbackConfig>;

  constructor(config: RealtimeFeedbackConfig = {}) {
    super();
    this.config = {
      port: config.port || 8080,
      maxConnections: config.maxConnections || 100,
      heartbeatInterval: config.heartbeatInterval || 30000,
      authTimeout: config.authTimeout || 10000,
    };
  }

  /**
   * Start the WebSocket server for real-time feedback
   */
  start(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.wss = new WebSocket.Server({ 
          port: this.config.port,
          maxPayload: 1024 * 1024, // 1MB max payload
        });

        this.wss.on('connection', (ws, request) => {
          this.handleConnection(ws, request);
        });

        this.wss.on('listening', () => {
          console.log(`Realtime feedback server listening on port ${this.config.port}`);
          resolve();
        });

        this.wss.on('error', (error) => {
          console.error('WebSocket server error:', error);
          reject(error);
        });

        // Start heartbeat interval
        this.startHeartbeat();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Stop the WebSocket server
   */
  stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.wss) {
        this.wss.close(() => {
          console.log('Realtime feedback server stopped');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  /**
   * Handle new WebSocket connection
   */
  private handleConnection(ws: WebSocket, request: any): void {
    const url = new URL(request.url, `http://${request.headers.host}`);
    const apiKey = url.searchParams.get('apiKey');
    const userId = url.searchParams.get('userId');

    if (!apiKey || !userId) {
      ws.close(1008, 'Missing authentication parameters');
      return;
    }

    // Validate API key (in production, this would check against database)
    if (!this.isValidApiKey(apiKey, userId)) {
      ws.close(1008, 'Invalid API key');
      return;
    }

    if (this.connections.size >= this.config.maxConnections) {
      ws.close(1013, 'Server overloaded');
      return;
    }

    // Store connection
    const connectionId = `${userId}_${Date.now()}`;
    this.connections.set(connectionId, ws);

    // Set up connection handlers
    ws.on('message', (message) => {
      this.handleMessage(connectionId, userId, message);
    });

    ws.on('close', () => {
      this.connections.delete(connectionId);
      console.log(`Connection closed: ${connectionId}`);
    });

    ws.on('error', (error) => {
      console.error(`Connection error for ${connectionId}:`, error);
      this.connections.delete(connectionId);
    });

    // Send welcome message
    this.sendToConnection(connectionId, {
      type: 'connection_established',
      data: {
        connectionId,
        serverTime: new Date().toISOString(),
        capabilities: ['code_analysis', 'skill_updates', 'badge_notifications'],
      },
    });

    console.log(`New connection established: ${connectionId}`);
  }

  /**
   * Handle incoming messages from IDE plugins
   */
  private handleMessage(connectionId: string, userId: string, message: WebSocket.Data): void {
    try {
      const data = JSON.parse(message.toString());
      
      switch (data.type) {
        case 'code_analysis_request':
          this.handleCodeAnalysisRequest(connectionId, userId, data);
          break;
        case 'ping':
          this.sendToConnection(connectionId, { type: 'pong', timestamp: Date.now() });
          break;
        case 'subscribe':
          this.handleSubscription(connectionId, userId, data);
          break;
        default:
          console.warn(`Unknown message type: ${data.type}`);
      }
    } catch (error) {
      console.error('Error handling message:', error);
      this.sendToConnection(connectionId, {
        type: 'error',
        data: { message: 'Invalid message format' },
      });
    }
  }

  /**
   * Handle code analysis requests
   */
  private async handleCodeAnalysisRequest(
    connectionId: string, 
    userId: string, 
    data: any
  ): Promise<void> {
    try {
      // This would integrate with the existing AI feedback system
      const analysis = await this.analyzeCode(data.code, data.language, data.context);
      
      this.sendToConnection(connectionId, {
        type: 'code_analysis_result',
        data: {
          requestId: data.requestId,
          analysis,
          timestamp: new Date().toISOString(),
        },
      });

      // Emit event for other systems to handle
      this.emit('code_analyzed', {
        userId,
        code: data.code,
        language: data.language,
        analysis,
      });
    } catch (error) {
      console.error('Error analyzing code:', error);
      this.sendToConnection(connectionId, {
        type: 'error',
        data: {
          requestId: data.requestId,
          message: 'Failed to analyze code',
        },
      });
    }
  }

  /**
   * Handle subscription requests
   */
  private handleSubscription(connectionId: string, userId: string, data: any): void {
    const ws = this.connections.get(connectionId);
    if (!ws) return;

    // Store subscription preferences on the WebSocket object
    (ws as any).subscriptions = data.events || [];
    
    this.sendToConnection(connectionId, {
      type: 'subscription_confirmed',
      data: {
        events: (ws as any).subscriptions,
      },
    });
  }

  /**
   * Send feedback to specific user
   */
  sendFeedbackToUser(userId: string, feedback: FeedbackEvent): void {
    const userConnections = Array.from(this.connections.entries())
      .filter(([id]) => id.startsWith(userId));

    for (const [connectionId, ws] of userConnections) {
      const subscriptions = (ws as any).subscriptions || [];
      
      if (subscriptions.length === 0 || subscriptions.includes(feedback.type)) {
        this.sendToConnection(connectionId, {
          type: 'feedback',
          data: feedback,
        });
      }
    }
  }

  /**
   * Broadcast feedback to all connected users
   */
  broadcastFeedback(feedback: FeedbackEvent): void {
    for (const [connectionId, ws] of this.connections) {
      const subscriptions = (ws as any).subscriptions || [];
      
      if (subscriptions.length === 0 || subscriptions.includes(feedback.type)) {
        this.sendToConnection(connectionId, {
          type: 'broadcast',
          data: feedback,
        });
      }
    }
  }

  /**
   * Send message to specific connection
   */
  private sendToConnection(connectionId: string, message: any): void {
    const ws = this.connections.get(connectionId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  /**
   * Start heartbeat to keep connections alive
   */
  private startHeartbeat(): void {
    setInterval(() => {
      for (const [connectionId, ws] of this.connections) {
        if (ws.readyState === WebSocket.OPEN) {
          ws.ping();
        } else {
          this.connections.delete(connectionId);
        }
      }
    }, this.config.heartbeatInterval);
  }

  /**
   * Validate API key (placeholder implementation)
   */
  private isValidApiKey(apiKey: string, userId: string): boolean {
    // In production, this would validate against the database
    return apiKey.startsWith(`kiro_${userId}_`) && apiKey.length > 20;
  }

  /**
   * Analyze code (placeholder implementation)
   */
  private async analyzeCode(code: string, language: string, context: any): Promise<any> {
    // This would integrate with the existing Genkit AI flows
    return {
      feedback: 'Code analysis completed',
      suggestions: ['Consider adding error handling', 'Use more descriptive variable names'],
      skillsUsed: [language.toLowerCase()],
      codeQuality: {
        score: Math.floor(Math.random() * 5) + 6, // Random score 6-10
        areas: ['readability', 'maintainability'],
      },
    };
  }

  /**
   * Get connection statistics
   */
  getStats(): {
    totalConnections: number;
    connectionsByUser: Record<string, number>;
    uptime: number;
  } {
    const connectionsByUser: Record<string, number> = {};
    
    for (const connectionId of this.connections.keys()) {
      const userId = connectionId.split('_')[0];
      connectionsByUser[userId] = (connectionsByUser[userId] || 0) + 1;
    }

    return {
      totalConnections: this.connections.size,
      connectionsByUser,
      uptime: process.uptime(),
    };
  }
}