# Design Document

## Architecture Overview

The Blockchain Badge System integrates AI skill detection, multimodal image generation, and blockchain technology to create verifiable developer credentials. The system uses a multi-step workflow that analyzes code, generates unique badge artwork, and mints NFTs on the Sepolia testnet.

## System Components

### AI Skill Detection

**awardSkillBadgeFlow** (`src/ai/flows/award-skill-badge.ts`)
- Analyzes submitted code to identify demonstrated programming skills
- Uses Gemini 2.0 Flash with specialized prompts for skill recognition
- Returns structured output with skill name and confidence level
- Validates that skills are genuinely demonstrated, not just mentioned

**Skill Categories:**
- Language-specific skills (JavaScript, TypeScript, Python, etc.)
- Framework skills (React, Next.js, Express, etc.)
- Programming concepts (Async/Await, Error Handling, Design Patterns)
- Best practices (Code Quality, Testing, Documentation)

### Multimodal Badge Generation

**generateBadgeIconFlow** (`src/ai/flows/generate-badge-icon.ts`)
- Creates unique vector-style icons for each skill badge
- Uses Gemini 2.0 Flash Preview Image Generation model
- Generates consistent visual theme: dark, futuristic, minimalist
- Returns data URI for immediate use in UI and blockchain metadata

**Visual Design Principles:**
- Circular badge format for consistency
- Dark background with vibrant accent colors
- Symbolic representations of programming concepts
- Vector-style graphics suitable for small display sizes

### Blockchain Integration

**Smart Contract Interface**
- ERC-721 compliant NFT contract deployed on Sepolia testnet
- Supports metadata storage for badge information
- Implements proper access controls for minting
- Provides standard NFT functionality for compatibility

**Ethereum Integration** (`src/lib/blockchain/`)
- Ethers.js for blockchain interaction
- Server-side wallet management for secure transactions
- Environment-based configuration for network settings
- Transaction monitoring and error handling

### Data Storage

**Firebase Firestore Schema:**
```typescript
UserProfile: {
  uid: string
  badges: BadgeMetadata[]
  createdAt: timestamp
  updatedAt: timestamp
}

BadgeMetadata: {
  id: string
  skillName: string
  iconDataUri: string
  transactionHash: string
  contractAddress: string
  tokenId: number
  mintedAt: timestamp
  blockNumber: number
}
```

## Workflow Design

### Badge Minting Process

1. **Code Analysis Phase:**
   ```
   User Code → awardSkillBadgeFlow → Skill Detection → Validation
   ```

2. **Icon Generation Phase:**
   ```
   Skill Name → generateBadgeIconFlow → AI Image Generation → Data URI
   ```

3. **Blockchain Minting Phase:**
   ```
   Badge Data → Smart Contract → NFT Minting → Transaction Hash
   ```

4. **Data Persistence Phase:**
   ```
   Badge Metadata → Firestore → User Profile Update → UI Refresh
   ```

### Agent Hook Integration

The system uses Kiro's agent hooks to chain multiple AI flows:
```typescript
// Primary hook that orchestrates the entire process
badgeGenerationHook: {
  trigger: "manual" | "automatic"
  workflow: [
    awardSkillBadgeFlow,
    generateBadgeIconFlow,
    mintBadgeTransaction,
    updateUserProfile
  ]
}
```

## Security Architecture

### Server-Side Wallet Management

**Wallet Configuration:**
- Private key stored in environment variables
- Separate wallet for each environment (dev, staging, prod)
- Proper key rotation and backup procedures
- Rate limiting to prevent abuse

**Transaction Security:**
- Input validation for all blockchain operations
- Gas estimation and limit enforcement
- Transaction monitoring and retry logic
- Error handling without exposing sensitive data

### Skill Validation

**Anti-Gaming Measures:**
- Code complexity analysis to prevent trivial examples
- Skill demonstration validation (not just keyword matching)
- Rate limiting per user and per skill type
- Manual review flags for suspicious patterns

## Performance Considerations

### Response Time Optimization

**Target Performance:**
- Skill detection: < 5 seconds
- Icon generation: < 10 seconds
- Blockchain minting: < 30 seconds (network dependent)
- Total workflow: < 45 seconds

**Optimization Strategies:**
- Parallel execution of AI flows where possible
- Caching of generated icons for similar skills
- Efficient prompt engineering for faster AI responses
- Connection pooling for blockchain operations

### Scalability Design

**Horizontal Scaling:**
- Stateless AI flows for easy scaling
- Queue-based processing for high-volume periods
- Load balancing across multiple AI service instances
- Database sharding for user profile data

## Error Handling Strategy

### Blockchain Error Recovery

**Common Failure Scenarios:**
- Network congestion causing transaction delays
- Insufficient gas for transaction completion
- Smart contract interaction failures
- Wallet connectivity issues

**Recovery Mechanisms:**
- Automatic retry with exponential backoff
- Gas price adjustment for network conditions
- Fallback to alternative RPC endpoints
- User notification with clear next steps

### AI Service Failures

**Failure Modes:**
- AI model unavailability
- Rate limiting from AI service
- Invalid or unexpected AI responses
- Image generation failures

**Mitigation Strategies:**
- Graceful degradation to text-only badges
- Retry logic with different prompts
- Fallback to pre-generated badge templates
- Clear user communication about service status

## Integration Points

### Frontend Integration

**BadgesDisplay Component** (`src/components/BadgesDisplay.tsx`)
- Displays earned badges in user profile
- Shows badge icons, skill names, and verification links
- Provides sharing functionality for social proof
- Implements responsive design for mobile devices

**Badge Earning Flow:**
- Integrated into code feedback workflow
- Real-time notifications for new badges
- Progress tracking toward skill milestones
- Achievement celebration animations

### External Integrations

**Blockchain Explorers:**
- Direct links to Etherscan for transaction verification
- Badge metadata viewable on OpenSea and other NFT platforms
- Integration with Web3 wallets for badge collection
- Support for badge display in professional profiles