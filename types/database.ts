//@types/database.ts

import { Timestamp } from "firebase/firestore";
import { TokenState } from "./enums";

// Basic token interface for grid display
export interface Token {
  id: string;
  name: string;
  symbol: string;
  address: string;
  currentPrice: number;
  createdAt: Date;
  imageUrl?: string;
}

export interface TokenStatistics {
  totalSupply: string; // From contract totalSupply()
  currentPrice: string; // From getCurrentPrice()
  volumeETH: string; // Calculated from TokensPurchased and TokensSold events
  tradeCount: number; // Count of trades from events
  uniqueHolders: number; // Count unique addresses from events
  priceChange24h?: number; // Calculate from price history
  highPrice24h?: string; // Track highest price in 24h
  lowPrice24h?: string; // Track lowest price in 24h
  lastTradeTimestamp?: string; // Last trade event timestamp
}

export interface TokenTrade {
  timestamp: string;
  type: "buy" | "sell";
  price: string;
  amount: string;
  ethAmount: string;
  trader: string;
}

export interface TokenData {
  // Basic Info (from contract creation)
  id: string;
  name: string;
  symbol: string;
  address: string;
  description?: string;
  imageUrl?: string;
  creator: string;

  // Creation Info
  createdAt: string;
  creationBlock: number;
  transactionHash: string;

  // Current State
  currentState: TokenState;
  fundingGoal: string; // From contract _fundingGoals
  collateral: string; // From contract collateral mapping

  // Statistics
  statistics: TokenStatistics;

  // Trading Info
  lastTrade?: TokenTrade; // Most recent trade details
  price?: number;

  // Additional Metrics (derived)
  marketCap?: string; // currentPrice * totalSupply
  tradingVolume24h?: string; // Sum of trades in last 24h
  buyPressure24h?: number; // Ratio of buys to sells in 24h
  timeToGoal?: number; // Estimated time to reach funding goal
  initialPrice: string; // From contract _initialPrice
  maxSupply: string; // From contract _maxSupply
  priceRate: string; // From contract _priceRate
  tradeCooldown: number; // From contract _tradeCooldown
  maxWalletPercentage: number; // From contract _maxWalletPercentage
  liquidity?: number; // Calculated from contract _liquidity
}