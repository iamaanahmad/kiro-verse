---
name: "Badge Generation Hook"
description: "Automatically generates and mints skill badges when code demonstrates specific programming skills"
trigger: "manual"
category: "AI & Blockchain"
---

# Badge Generation Agent Hook

## Overview

This agent hook demonstrates KiroVerse's unique capability to automatically detect programming skills in user code and mint verifiable NFT badges on the blockchain. It showcases the integration between AI analysis, multimodal image generation, and blockchain technology.

## Trigger Conditions

**Manual Trigger:** Users can click "Analyze for Skills" button after submitting code
**Automatic Trigger:** Could be configured to run after positive code feedback (future enhancement)

## Hook Workflow

### Step 1: Skill Detection
- Analyze submitted code using `awardSkillBadgeFlow`
- Identify specific programming skills demonstrated (e.g., "JavaScript Promises", "React Hooks", "Error Handling")
- Validate that the skill is genuinely demonstrated in the code

### Step 2: Badge Icon Generation
- Trigger `generateBadgeIconFlow` with the detected skill name
- Use Gemini 2.0 Flash Preview Image Generation to create unique vector-style icon
- Generate dark, futuristic theme with vibrant accent colors
- Return data URI for the generated badge image

### Step 3: Blockchain Minting
- Connect to Sepolia testnet using ethers.js
- Interact with deployed ERC-721 smart contract
- Mint NFT badge with metadata including skill name and icon
- Return transaction hash for verification on Etherscan

### Step 4: User Notification
- Display success message with badge details
- Show transaction hash with link to blockchain explorer
- Update user profile with new badge
- Store badge metadata in Firestore

## Implementation Details

### Genkit Flows Used
```typescript
// Primary flow for skill detection
awardSkillBadgeFlow: {
  input: { code: string }
  output: { skillName: string, shouldAward: boolean }
}

// Multimodal flow for icon generation
generateBadgeIconFlow: {
  input: { badgeName: string }
  output: { iconDataUri: string }
}
```

### Agent Hook Chaining
```
Code Analysis → Skill Detection → Icon Generation → Blockchain Minting → User Notification
```

### Error Handling
- Graceful fallback if AI skill detection fails
- Retry logic for blockchain transactions
- User-friendly error messages for network issues
- Logging for debugging and monitoring

## Educational Value

This hook demonstrates several advanced concepts:
- **AI Agent Orchestration:** Multiple AI flows working together
- **Multimodal AI:** Text-to-image generation for badge icons
- **Blockchain Integration:** Real NFT minting with verifiable credentials
- **Async Workflows:** Complex multi-step processes with proper error handling

## Security Considerations

- Server-side wallet management for secure blockchain transactions
- Input validation to prevent malicious code analysis
- Rate limiting to prevent badge farming
- Proper error handling to avoid exposing sensitive information

## Future Enhancements

- Automatic skill detection without manual trigger
- Skill progression tracking (beginner → intermediate → advanced)
- Badge rarity system based on skill complexity
- Integration with professional development platforms