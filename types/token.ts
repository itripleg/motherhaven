import { Address } from 'viem';

export enum TokenState {
  NOT_CREATED = 0,
  TRADING = 1,
  HALTED = 2,
  RESUMED = 3,
}

export interface TokenStats {
  totalSupply: string;
  currentPrice: string;
  volumeETH: string;
  tradeCount: number;
  uniqueHolders: number;
  volumeETH24h: string;
  priceChange24h: number;
  highPrice24h: string;
  lowPrice24h: string;
  buyPressure24h: number;
}

export interface TokenTrade {
  timestamp: string;
  type: "buy" | "sell";
  price: string;
  amount: string;
  ethAmount: string;
  trader: Address;
}

export interface Token {
  address: Address;
  name: string;
  symbol: string;
  imageUrl: string;
  description?: string;
  creator: Address;
  burnManager: Address;
  fundingGoal: string;
  initialPrice: string;
  maxSupply: string;
  state: TokenState;
  collateral: string;
  createdAt: string;
  blockNumber: number;
  transactionHash: string;
  stats: TokenStats;
  lastTrade?: TokenTrade;
}
