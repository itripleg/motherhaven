import { Address } from "viem";
import { TokenState } from "./enums";

// Core contract state - these values are directly readable from the contract
export interface TokenContractState {
  currentPrice: string; // From getCurrentPrice()
  collateral: string; // Contract's ETH balance from collateral mapping
  state: TokenState; // From tokens mapping
  totalSupply: string; // From ERC20 totalSupply()
}

// Derived statistics - calculated from event history and stored in Firebase
export interface TokenMetrics {
  // Trade metrics
  volumeETH24h: string; // Sum of ETH volume in last 24h
  tradeCount24h: number; // Number of trades in last 24h
  priceChange24h: number; // Percentage price change in 24h
  highPrice24h: string; // Highest trade price in 24h
  lowPrice24h: string; // Lowest trade price in 24h

  // Historical aggregates
  totalVolumeETH: string; // All-time ETH volume
  totalTradeCount: number; // All-time number of trades
  uniqueHolders: number; // Count of addresses with positive balance

  // Market metrics
  marketCap: string; // currentPrice * totalSupply
  buyPressure24h: number; // Ratio of buys to sells in 24h (0-1)

  // Time-based metrics
  lastTradeTimestamp: string;
  timeToGoal?: number; // Estimated time to reach funding goal based on volume
}

// Complete token data structure combining contract and derived data
export interface TokenData {
  // Immutable data (set at creation)
  id: string;
  address: Address;
  name: string;
  symbol: string;
  creator: Address;
  description?: string;
  imageUrl?: string;
  initialPrice: string; // From contract _initialPrice
  maxSupply: string; // From contract _maxSupply
  priceRate: string; // From contract _priceRate
  tradeCooldown: number; // From contract _tradeCooldown
  maxWalletPercentage: number;

  // Creation metadata
  createdAt: string;
  creationBlock: number;
  transactionHash: string;

  // Current contract state
  contractState: TokenContractState;

  // Calculated metrics
  metrics: TokenMetrics;

  // Latest trade info
  lastTrade?: {
    timestamp: string;
    type: "buy" | "sell";
    price: string;
    amount: string;
    ethAmount: string;
    trader: Address;
  };
}
