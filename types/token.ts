// every token
enum TokenState {
  NOT_CREATED = 0,
  TRADING = 1,
  HALTED = 2,
  RESUMED = 3,
}

// types/token.ts

type Address = `0x${string}`;

enum TokenState {
  Active = 1,
  Paused = 2,
  Liquidated = 3,
}

interface TokenStats {
  totalSupply: string;
  currentPrice: string;
  volumeETH: string;
  tradeCount: number;
  uniqueHolders: number;

  // 24h metrics
  volumeETH24h: string;
  priceChange24h: number;
  highPrice24h: string;
  lowPrice24h: string;
  buyPressure24h: number;
}

interface TokenTrade {
  timestamp: string;
  type: "buy" | "sell";
  price: string;
  amount: string;
  ethAmount: string;
  trader: Address;
}

interface Token {
  // Basic token information
  address: Address;
  name: string;
  symbol: string;
  imageUrl: string;
  description?: string;

  // Contract parameters
  creator: Address;
  burnManager: Address;
  fundingGoal: string;
  initialPrice: string;
  maxSupply: string;
  priceRate: string;
  tradeCooldown: number;
  maxWalletPercentage: number;

  // Current state
  state: TokenState;
  collateral: string;

  // Metadata
  createdAt: string;
  blockNumber: number;
  transactionHash: string;

  // Statistics
  stats: TokenStats;

  // Latest trade
  lastTrade?: TokenTrade;
}

export type { Address, Token, TokenStats, TokenTrade };

export { TokenState };
