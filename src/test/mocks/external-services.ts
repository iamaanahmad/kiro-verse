/**
 * @fileOverview Mock services for external integrations testing
 */

import { vi } from 'vitest';

// Mock Firebase services
export const mockFirebaseServices = {
  auth: {
    currentUser: {
      uid: 'test-user-123',
      email: 'test@example.com',
      displayName: 'Test User'
    },
    signInWithEmailAndPassword: vi.fn(),
    signOut: vi.fn(),
    onAuthStateChanged: vi.fn()
  },
  
  firestore: {
    collection: vi.fn(),
    doc: vi.fn(),
    addDoc: vi.fn(),
    getDoc: vi.fn(),
    getDocs: vi.fn(),
    updateDoc: vi.fn(),
    deleteDoc: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
    orderBy: vi.fn(),
    limit: vi.fn(),
    runTransaction: vi.fn()
  }
};

// Mock AI services
export const mockAIServices = {
  genkit: {
    getCodeFeedback: vi.fn().mockResolvedValue({
      analysisId: 'mock-analysis-123',
      codeQuality: 85,
      efficiency: 78,
      creativity: 82,
      bestPractices: 90,
      suggestions: ['Consider adding error handling'],
      detectedSkills: ['JavaScript', 'React'],
      improvementAreas: ['Error Handling'],
      processingTime: 1200
    }),
    
    generateCodingChallenge: vi.fn().mockResolvedValue({
      challengeId: 'mock-challenge-456',
      title: 'Array Manipulation Challenge',
      description: 'Implement array sorting functions',
      difficulty: 'intermediate',
      prompt: 'Sort the given array',
      testCases: [
        { input: '[3,1,4]', expectedOutput: '[1,3,4]', isHidden: false }
      ],
      hints: ['Use built-in sort methods'],
      estimatedDuration: 30
    }),
    
    awardSkillBadge: vi.fn().mockResolvedValue({
      badgeId: 'mock-badge-789',
      badgeName: 'JavaScript Expert',
      description: 'Demonstrates advanced JavaScript skills',
      rarity: 'rare',
      verificationStatus: 'pending'
    })
  }
};

// Mock Blockchain services
export const mockBlockchainServices = {
  ethers: {
    Contract: vi.fn().mockImplementation(() => ({
      mint: vi.fn().mockResolvedValue({
        hash: '0x1234567890abcdef',
        wait: vi.fn().mockResolvedValue({
          transactionHash: '0x1234567890abcdef',
          blockNumber: 12345678,
          gasUsed: { toString: () => '150000' }
        })
      }),
      
      ownerOf: vi.fn().mockResolvedValue('0x742d35Cc6634C0532925a3b8D4C9db96DfB3f681'),
      
      tokenURI: vi.fn().mockResolvedValue('https://api.kiroverse.com/metadata/123'),
      
      balanceOf: vi.fn().mockResolvedValue(5)
    })),
    
    JsonRpcProvider: vi.fn().mockImplementation(() => ({
      getNetwork: vi.fn().mockResolvedValue({ chainId: 11155111 }),
      getBlockNumber: vi.fn().mockResolvedValue(12345678),
      getTransaction: vi.fn().mockResolvedValue({
        hash: '0x1234567890abcdef',
        blockNumber: 12345678,
        from: '0x742d35Cc6634C0532925a3b8D4C9db96DfB3f681'
      })
    })),
    
    Wallet: vi.fn().mockImplementation(() => ({
      address: '0x742d35Cc6634C0532925a3b8D4C9db96DfB3f681',
      connect: vi.fn().mockReturnThis()
    }))
  }
};

// Mock GitHub API services
export const mockGitHubServices = {
  octokit: {
    rest: {
      repos: {
        listForAuthenticatedUser: vi.fn().mockResolvedValue({
          data: [
            {
              id: 123456,
              name: 'test-repo',
              full_name: 'testuser/test-repo',
              language: 'JavaScript',
              created_at: '2024-01-01T00:00:00Z',
              updated_at: '2024-01-15T10:30:00Z',
              size: 1024,
              stargazers_count: 5
            }
          ]
        }),
        
        getContent: vi.fn().mockResolvedValue({
          data: {
            content: Buffer.from('console.log("Hello World");').toString('base64'),
            encoding: 'base64'
          }
        }),
        
        listCommits: vi.fn().mockResolvedValue({
          data: [
            {
              sha: 'abc123def456',
              commit: {
                message: 'Add new feature',
                author: {
                  name: 'Test User',
                  email: 'test@example.com',
                  date: '2024-01-15T10:30:00Z'
                }
              },
              stats: {
                additions: 50,
                deletions: 10,
                total: 60
              }
            }
          ]
        })
      },
      
      users: {
        getAuthenticated: vi.fn().mockResolvedValue({
          data: {
            id: 12345,
            login: 'testuser',
            name: 'Test User',
            email: 'test@example.com',
            public_repos: 10,
            followers: 25,
            following: 15
          }
        })
      }
    }
  }
};

// Mock IDE integration services
export const mockIDEServices = {
  vscode: {
    window: {
      showInformationMessage: vi.fn(),
      showErrorMessage: vi.fn(),
      showWarningMessage: vi.fn(),
      createOutputChannel: vi.fn().mockReturnValue({
        appendLine: vi.fn(),
        show: vi.fn(),
        clear: vi.fn()
      })
    },
    
    workspace: {
      getConfiguration: vi.fn().mockReturnValue({
        get: vi.fn().mockReturnValue(true),
        update: vi.fn()
      }),
      
      onDidSaveTextDocument: vi.fn(),
      onDidChangeTextDocument: vi.fn()
    },
    
    languages: {
      registerCodeActionsProvider: vi.fn(),
      registerHoverProvider: vi.fn(),
      registerCompletionItemProvider: vi.fn()
    }
  }
};

// Mock WebSocket services for real-time features
export const mockWebSocketServices = {
  WebSocket: vi.fn().mockImplementation(() => ({
    send: vi.fn(),
    close: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    readyState: 1, // OPEN
    CONNECTING: 0,
    OPEN: 1,
    CLOSING: 2,
    CLOSED: 3
  }))
};

// Mock performance monitoring services
export const mockPerformanceServices = {
  performance: {
    now: vi.fn().mockReturnValue(Date.now()),
    mark: vi.fn(),
    measure: vi.fn(),
    getEntriesByType: vi.fn().mockReturnValue([]),
    clearMarks: vi.fn(),
    clearMeasures: vi.fn()
  }
};

// Utility function to setup all mocks
export function setupMockServices() {
  // Setup Firebase mocks
  vi.mock('firebase/auth', () => mockFirebaseServices.auth);
  vi.mock('firebase/firestore', () => mockFirebaseServices.firestore);
  
  // Setup AI service mocks
  vi.mock('@/ai/flows/get-code-feedback', () => ({
    getCodeFeedback: mockAIServices.genkit.getCodeFeedback
  }));
  
  vi.mock('@/ai/flows/generate-coding-challenge', () => ({
    generateCodingChallenge: mockAIServices.genkit.generateCodingChallenge
  }));
  
  vi.mock('@/ai/flows/award-skill-badge', () => ({
    awardSkillBadge: mockAIServices.genkit.awardSkillBadge
  }));
  
  // Setup blockchain mocks
  vi.mock('ethers', () => mockBlockchainServices.ethers);
  
  // Setup GitHub API mocks
  vi.mock('@octokit/rest', () => ({
    Octokit: vi.fn().mockImplementation(() => mockGitHubServices.octokit)
  }));
  
  // Setup WebSocket mocks
  global.WebSocket = mockWebSocketServices.WebSocket as any;
  
  // Setup performance mocks
  global.performance = mockPerformanceServices.performance as any;
}

// Utility function to reset all mocks
export function resetMockServices() {
  Object.values(mockFirebaseServices.auth).forEach(mock => {
    if (typeof mock === 'function') mock.mockReset();
  });
  
  Object.values(mockFirebaseServices.firestore).forEach(mock => {
    if (typeof mock === 'function') mock.mockReset();
  });
  
  Object.values(mockAIServices.genkit).forEach(mock => {
    if (typeof mock === 'function') mock.mockReset();
  });
  
  Object.values(mockBlockchainServices.ethers).forEach(mock => {
    if (typeof mock === 'function') mock.mockReset();
  });
  
  // Reset nested GitHub mocks
  const resetNestedMocks = (obj: any) => {
    Object.values(obj).forEach(value => {
      if (typeof value === 'function') {
        value.mockReset();
      } else if (typeof value === 'object' && value !== null) {
        resetNestedMocks(value);
      }
    });
  };
  
  resetNestedMocks(mockGitHubServices.octokit);
}

// Test data factories
export const createMockUser = (overrides = {}) => ({
  uid: 'test-user-123',
  email: 'test@example.com',
  displayName: 'Test User',
  photoURL: 'https://example.com/avatar.jpg',
  emailVerified: true,
  ...overrides
});

export const createMockChallenge = (overrides = {}) => ({
  challengeId: 'challenge-123',
  title: 'Test Challenge',
  description: 'A test coding challenge',
  difficulty: 'intermediate' as const,
  skillsTargeted: ['javascript', 'algorithms'],
  timeLimit: 30,
  isActive: true,
  createdAt: new Date('2024-01-15T10:00:00Z'),
  ...overrides
});

export const createMockBadge = (overrides = {}) => ({
  badgeId: 'badge-123',
  badgeName: 'Test Badge',
  description: 'A test skill badge',
  rarity: { level: 'common' as const, score: 50 },
  verificationStatus: 'verified' as const,
  awardedAt: new Date('2024-01-15T10:30:00Z'),
  ...overrides
});

export const createMockAnalytics = (overrides = {}) => ({
  analysisId: 'analysis-123',
  codeQuality: 85,
  efficiency: 78,
  creativity: 82,
  bestPractices: 90,
  detectedSkills: ['JavaScript', 'React'],
  processingTime: 1200,
  ...overrides
});