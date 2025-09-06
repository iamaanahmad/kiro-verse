# KiroVerse Project Context

## Project Overview

KiroVerse is an AI-powered interactive learning environment that functions as a personal "code-dojo" for developers. The platform combines AI mentorship, blockchain credentials, and transparent development processes to create a unique educational experience.

## Core Features

### AI-Powered Mentorship
- Real-time code analysis and feedback using Google's Genkit framework
- Conversational AI chat with Socratic teaching methodology
- Context-aware responses that guide learning rather than just providing answers

### Blockchain Credentials
- Real NFT skill badges minted on Sepolia testnet
- Verifiable credentials that cannot be faked
- Permanent record of developer achievements on the blockchain

### Transparent Development
- "Behind the Scenes" view showing AI's requirements, design, and tasks
- Educational approach that demystifies the development process
- Spec-driven development made visible to users

## Technical Architecture

### Frontend Stack
- Next.js 15 with App Router
- TypeScript for type safety
- Tailwind CSS + ShadCN UI for modern, accessible design
- React 18 with modern hooks and patterns

### AI Integration
- Google Genkit for AI flow orchestration
- Gemini 2.0 Flash for code analysis and chat
- Gemini 2.0 Flash Preview Image Generation for badge icons
- Structured input/output with Zod validation

### Blockchain Integration
- Ethers.js for Ethereum interaction
- Sepolia testnet for NFT minting
- ERC-721 smart contract for skill badges
- Server-side wallet for secure transactions

### Backend Services
- Firebase for authentication and data storage
- Next.js server actions for API layer
- Environment-based configuration for security

## Development Principles

### Spec-Driven Development
- All major features should have comprehensive specs (requirements, design, tasks)
- Transparent development process that users can learn from
- Educational value in showing how software is built

### AI-First Approach
- Leverage AI for core functionality, not just as an add-on
- Use structured AI flows with proper error handling
- Focus on educational AI that teaches rather than just answers

### User-Centric Design
- Prioritize learning experience over feature complexity
- Provide clear feedback and guidance at every step
- Ensure accessibility and inclusive design

### Security and Privacy
- Protect user code and data
- Secure blockchain interactions
- Follow best practices for authentication and authorization

## Code Quality Standards

### TypeScript Usage
- Strict type checking enabled
- Proper interface definitions for all data structures
- Use Zod for runtime validation where needed

### Component Architecture
- Reusable components with clear props interfaces
- Proper separation of concerns
- Accessibility features (ARIA labels, keyboard navigation)

### Error Handling
- Comprehensive error boundaries
- User-friendly error messages
- Graceful degradation when services are unavailable

### Performance
- Optimize AI response times (target < 10 seconds)
- Efficient state management
- Proper loading states and user feedback