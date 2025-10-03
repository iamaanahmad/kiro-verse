# KiroVerse IDE Plugin Integration Guide

## Overview

The KiroVerse IDE Plugin Integration Framework allows developers to integrate KiroVerse's AI-powered learning analytics and feedback system directly into their development environment. This guide provides comprehensive documentation for building IDE plugins that connect to KiroVerse.

## Features

- **Real-time AI Feedback**: Get instant code analysis and suggestions as you type
- **Skill Tracking**: Automatic skill progression tracking based on your coding patterns
- **Badge Integration**: Display and earn KiroVerse badges directly in your IDE
- **Learning Insights**: Personalized learning recommendations based on your code
- **Credential Verification**: Show verified skills and achievements in your development workflow

## Getting Started

### 1. Authentication

First, you need to obtain an API key for your plugin:

```javascript
// Request API key
const response = await fetch('https://kiroverse.com/api/ide-integration/auth', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    userId: 'your-user-id',
    pluginName: 'Your IDE Plugin',
    pluginVersion: '1.0.0',
  }),
});

const { apiKey } = await response.json();
```

### 2. SDK Installation

Install the KiroVerse SDK in your plugin project:

```bash
npm install @kiroverse/ide-sdk
```

### 3. Basic Setup

```javascript
import { KiroVerseSDK } from '@kiroverse/ide-sdk';

const sdk = new KiroVerseSDK({
  apiKey: 'your-api-key',
  userId: 'your-user-id',
  enableRealtime: true,
  enableNotifications: true,
});

// Initialize the SDK
await sdk.initialize();
```

## API Reference

### Code Analysis

Get AI feedback for code snippets:

```javascript
const feedback = await sdk.getCodeFeedback({
  code: 'function hello() { console.log("Hello, World!"); }',
  language: 'javascript',
  fileName: 'hello.js',
  projectType: 'web',
  framework: 'nodejs',
});

console.log(feedback);
// {
//   feedback: "Good function structure. Consider adding JSDoc comments.",
//   suggestions: ["Add parameter validation", "Use const for function declaration"],
//   skillsUsed: ["javascript", "functions"],
//   codeQuality: { score: 7, areas: ["documentation", "best-practices"] },
//   learningInsights: ["Practice writing documentation for better code maintainability"]
// }
```

### User Credentials

Fetch user's badges and skills:

```javascript
const credentials = await sdk.getUserCredentials();

console.log(credentials);
// {
//   badges: [
//     {
//       id: "badge-123",
//       name: "JavaScript Expert",
//       description: "Demonstrated advanced JavaScript skills",
//       skillCategory: "javascript",
//       rarity: "epic",
//       issuedAt: "2023-12-01T00:00:00Z",
//       verificationUrl: "https://sepolia.etherscan.io/tx/0x..."
//     }
//   ],
//   skills: [
//     {
//       skillId: "javascript",
//       skillName: "JavaScript",
//       level: 4,
//       experiencePoints: 1250,
//       lastUpdated: "2023-12-01T00:00:00Z"
//     }
//   ],
//   profileUrl: "https://kiroverse.com/profile/user-123"
// }
```

### Real-time Events

Subscribe to real-time events:

```javascript
// Subscribe to specific events
sdk.subscribeToEvents(['skill_update', 'badge_earned', 'code_analysis']);

// Listen for events
sdk.on('badge_earned', (data) => {
  showNotification(`New badge earned: ${data.badge.name}`);
});

sdk.on('skill_update', (data) => {
  updateSkillDisplay(data.skill);
});

sdk.on('feedback', (data) => {
  showInlineFeedback(data.feedback);
});
```

### Real-time Code Analysis

Request real-time analysis:

```javascript
// Request analysis with callback
sdk.requestRealtimeAnalysis({
  code: getCurrentCode(),
  language: getCurrentLanguage(),
  fileName: getCurrentFileName(),
}, 'analysis-123');

// Listen for results
sdk.on('analysis_result', (data) => {
  if (data.requestId === 'analysis-123') {
    displayFeedback(data.analysis);
  }
});
```

## Plugin Examples

### VS Code Extension

```javascript
// extension.js
const vscode = require('vscode');
const { KiroVerseSDK } = require('@kiroverse/ide-sdk');

let sdk;

function activate(context) {
  // Initialize SDK
  sdk = new KiroVerseSDK({
    apiKey: vscode.workspace.getConfiguration('kiroverse').get('apiKey'),
    userId: vscode.workspace.getConfiguration('kiroverse').get('userId'),
  });

  sdk.initialize();

  // Register command for manual analysis
  const analyzeCommand = vscode.commands.registerCommand('kiroverse.analyze', async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    const code = editor.document.getText();
    const language = editor.document.languageId;
    const fileName = editor.document.fileName;

    try {
      const feedback = await sdk.getCodeFeedback({ code, language, fileName });
      
      // Show feedback in information message
      vscode.window.showInformationMessage(feedback.feedback);
      
      // Add suggestions as diagnostics
      const diagnostics = feedback.suggestions.map(suggestion => 
        new vscode.Diagnostic(
          new vscode.Range(0, 0, 0, 0),
          suggestion,
          vscode.DiagnosticSeverity.Information
        )
      );
      
      vscode.languages.createDiagnosticCollection('kiroverse').set(
        editor.document.uri,
        diagnostics
      );
    } catch (error) {
      vscode.window.showErrorMessage(`KiroVerse error: ${error.message}`);
    }
  });

  context.subscriptions.push(analyzeCommand);

  // Auto-analysis on save
  const onSave = vscode.workspace.onDidSaveTextDocument(async (document) => {
    if (vscode.workspace.getConfiguration('kiroverse').get('autoAnalyze')) {
      // Trigger analysis
      sdk.requestRealtimeAnalysis({
        code: document.getText(),
        language: document.languageId,
        fileName: document.fileName,
      });
    }
  });

  context.subscriptions.push(onSave);
}

function deactivate() {
  if (sdk) {
    sdk.disconnect();
  }
}

module.exports = { activate, deactivate };
```

### IntelliJ IDEA Plugin

```kotlin
// KiroVersePlugin.kt
import com.intellij.openapi.components.Service
import com.intellij.openapi.project.Project
import kotlinx.coroutines.*

@Service
class KiroVerseService(private val project: Project) {
    private var sdk: KiroVerseSDK? = null
    
    suspend fun initialize() {
        val settings = KiroVerseSettings.getInstance()
        
        sdk = KiroVerseSDK(
            apiKey = settings.apiKey,
            userId = settings.userId,
            enableRealtime = true
        )
        
        sdk?.initialize()
        
        // Set up event listeners
        sdk?.on("badge_earned") { data ->
            showBadgeNotification(data)
        }
    }
    
    suspend fun analyzeCode(code: String, language: String, fileName: String): CodeAnalysisResponse? {
        return sdk?.getCodeFeedback(
            CodeAnalysisRequest(
                code = code,
                language = language,
                fileName = fileName
            )
        )
    }
    
    private fun showBadgeNotification(data: Any) {
        // Show notification in IDE
        NotificationGroupManager.getInstance()
            .getNotificationGroup("KiroVerse")
            .createNotification("New badge earned!", NotificationType.INFORMATION)
            .notify(project)
    }
}
```

## Configuration

### Plugin Configuration File

Create a `kiroverse.json` configuration file:

```json
{
  "apiKey": "kiro_user123_abc_def456_789...",
  "userId": "user123",
  "baseUrl": "https://kiroverse.com/api",
  "realtimeUrl": "wss://kiroverse.com/ws",
  "settings": {
    "enableRealtime": true,
    "enableNotifications": true,
    "autoAnalyze": true,
    "showBadges": true,
    "feedbackLevel": "detailed"
  },
  "ui": {
    "showSkillProgress": true,
    "showQualityScore": true,
    "inlineFeedback": true,
    "notificationPosition": "bottom-right"
  }
}
```

### Environment Variables

```bash
KIROVERSE_API_KEY=your-api-key
KIROVERSE_USER_ID=your-user-id
KIROVERSE_BASE_URL=https://kiroverse.com/api
KIROVERSE_REALTIME_URL=wss://kiroverse.com/ws
```

## Error Handling

```javascript
try {
  const feedback = await sdk.getCodeFeedback(request);
  // Handle success
} catch (error) {
  if (error.status === 401) {
    // Invalid API key
    showAuthError();
  } else if (error.status === 429) {
    // Rate limit exceeded
    showRateLimitError();
  } else {
    // Other errors
    showGenericError(error.message);
  }
}
```

## Rate Limits

- **Code Analysis**: 100 requests per minute per user
- **Credential Fetching**: 10 requests per minute per user
- **Real-time Connections**: 5 concurrent connections per user

## Security Best Practices

1. **Store API keys securely**: Use your IDE's secure storage mechanisms
2. **Validate user input**: Always validate code before sending to API
3. **Handle errors gracefully**: Provide meaningful error messages to users
4. **Respect rate limits**: Implement proper rate limiting in your plugin
5. **Use HTTPS**: Always use secure connections for API calls

## Testing

### Unit Tests

```javascript
// test/sdk.test.js
import { KiroVerseSDK } from '@kiroverse/ide-sdk';

describe('KiroVerseSDK', () => {
  let sdk;

  beforeEach(() => {
    sdk = new KiroVerseSDK({
      apiKey: 'test-api-key',
      userId: 'test-user',
      baseUrl: 'http://localhost:3000/api',
    });
  });

  test('should analyze code successfully', async () => {
    const feedback = await sdk.getCodeFeedback({
      code: 'console.log("hello");',
      language: 'javascript',
    });

    expect(feedback).toHaveProperty('feedback');
    expect(feedback).toHaveProperty('suggestions');
    expect(feedback.codeQuality.score).toBeGreaterThan(0);
  });
});
```

### Integration Tests

```javascript
// test/integration.test.js
describe('IDE Integration', () => {
  test('should connect to realtime service', async () => {
    const sdk = new KiroVerseSDK(config);
    await sdk.initialize();
    
    expect(sdk.getStatus().realtimeConnected).toBe(true);
  });
});
```

## Troubleshooting

### Common Issues

1. **Connection Failed**: Check API key and network connectivity
2. **Invalid Response**: Verify request format and required fields
3. **Rate Limit Exceeded**: Implement exponential backoff
4. **WebSocket Disconnection**: Handle reconnection logic

### Debug Mode

Enable debug logging:

```javascript
const sdk = new KiroVerseSDK({
  ...config,
  debug: true,
});
```

## Support

- **Documentation**: [https://docs.kiroverse.com](https://docs.kiroverse.com)
- **API Reference**: [https://api.kiroverse.com/docs](https://api.kiroverse.com/docs)
- **GitHub Issues**: [https://github.com/kiroverse/ide-plugins](https://github.com/kiroverse/ide-plugins)
- **Discord Community**: [https://discord.gg/kiroverse](https://discord.gg/kiroverse)

## License

The KiroVerse IDE Plugin SDK is licensed under the MIT License. See [LICENSE](LICENSE) for details.