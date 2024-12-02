# Motherhaven

## Overview

Motherhaven is an experimental platform designed to explore and test innovative concepts in gaming, economics, governance, and social interaction through cutting-edge technology.

## Project Goals

The primary objective is to create a central location for radical technological experimentation, pushing the boundaries of interdisciplinary digital interactions.

## Tech Stack

### Core Technologies
- **Backend**: Node.js
- **Frontend**: Next.js (React)
- **Language**: TypeScript
- **Animation**: Framer Motion
- **UI Components**: Shadcn
- **Web3 Integration**: Wagmi
- **3D Rendering**: Three.js

### Blockchain
- **Smart Contracts**: Solidity
- **Blockchain**: Avalanche (Fuji Testnet)
- **Future Considerations**: Potential expansion to Polkadot, Solana

### Database
- **Current**: Google Firebase
- **Goal**: Database Agnostic Architecture

### AI Integration
- **Current Status**: Planned for future milestones
- **Approach**: LLM Agnostic Implementation

## Prerequisites

- Node.js
- Yarn package manager

## Getting Started

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   yarn
   ```
3. Start the development server:
   ```bash
   yarn dev
   ```

4. Access the application at `http://localhost:3000`

## Current Development Status

### Authentication
- Currently using Kinde Auth
- Planned transition to Wagmi-based authentication

### Core Functionality
- Token Factory (`/dex/factory`): Create custom tokens
- Decentralized Exchange (`/dex/[tokenAddress]`): Buy and sell tokens

### Economic Model
- Linear Bonding Curve
- Token pricing mechanism
- Liquidity pool creation upon reaching funding goal

## Development Challenges

### Active Technical Hurdles
- Optimize bonding curve economics
- Potential transition to exponential curve
- Ensure accurate liquidity pool deployment
- Implement real-time token price tracking (potential TradingView integration)

### Upcoming Implementations
- IPFS integration for token image storage
- NFT data storage and management
- Licensing considerations for data persistence

## Future Roadmap
- Expanded blockchain compatibility
- Advanced AI integrations
- Enhanced economic and governance models

## Licensing
*(Specific license to be determined)*

## Contributing

### Prerequisites for Contribution

#### Wallet Setup
1. Install [MetaMask](https://metamask.io/) browser extension
2. Configure Avalanche Fuji Testnet in MetaMask:

**Network Details:**
- **Network Name:** Avalanche Testnet C-Chain
- **Network URL:** `https://api.avax-test.network/ext/bc/C/rpc`
- **Chain ID:** 43113
- **Currency Symbol:** AVAX
- **Block Explorer URL:** `https://subnets-test.avax.network/`

#### Obtaining Test AVAX
- Use Avalanche Fuji Testnet Faucet
- Contributor network tokens available upon request

### How to Contribute

#### Development Opportunities
- Optimize bonding curve economics
- Implement advanced wallet connectors
- Develop real-time token price tracking
- Create comprehensive testing suite
- Enhance UI/UX for token creation and trading

#### Testing
1. Connect MetaMask to Avalanche Fuji Testnet
2. Access DEX at [motherhaven.netlify.app/dex](https://motherhaven.netlify.app/dex)
3. Explore token creation, buying, selling, and transferring
4. Document and report any discovered issues or potential improvements

## Contact
*(Contact information to be added)*
