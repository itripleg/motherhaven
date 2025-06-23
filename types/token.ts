// /types/token.ts
export enum TokenState {
  NOT_CREATED = 0,
  TRADING = 1,
  GOAL_REACHED = 2,
  HALTED = 3,
  RESUMED = 4,
}

export interface Trade {
  timestamp: number;
  type: "buy" | "sell";
  amount: string;
  ethAmount: string;
  trader: `0x${string}`;
}

export interface Token {
  // Basic token information from Token contract
  address: `0x${string}`;
  name: string;
  symbol: string;
  imageUrl: string;
  description: string;

  // Contract parameters from Token contract
  creator: `0x${string}`;
  burnManager: `0x${string}`;

  // Factory contract state
  fundingGoal: string;
  collateral: string;
  virtualSupply: string;

  // Factory constants (immutable)
  decimals: string; // 10 ** 18
  maxSupply: string; // (10 ** 9) * DECIMALS
  initialMint: string; // (MAX_SUPPLY * 20) / 100
  initialPrice: string; // 0.00001 ether
  minPurchase: string; // INITIAL_PRICE
  maxPurchase: string; // 50 ether
  maxWalletPercentage: number; // 5
  priceRate: string; // 2000
  tradingFee: number; // 30 (0.3%)

  // Current state
  state: TokenState;
  currentPrice: string; // Calculated from contract

  // On-chain stats
  totalSupply: string;

  // Metadata from creation event
  createdAt: string;
  blockNumber: number;
  transactionHash: string;

  // Trade history
  lastTrade?: Trade;
}
