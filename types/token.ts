// Core type for Ethereum addresses with validation
type Address = `0x${string}`;

// every token
enum TokenState {
  NOT_CREATED = 0,
  TRADING = 1,
  HALTED = 2,
  RESUMED = 3,
}

// Basic token statistics that we track
interface TokenStats {
  totalSupply: string;
  currentPrice: string;
  volumeETH: string;
  tradeCount: number;
  uniqueHolders: number;
}

// Main token data structure combining essential fields
interface Token {
  // Basic token information
  address: Address;
  burnManager: Address;
  creator: Address;
  state: TokenState;
  name: string;
  symbol: string;
  imageUrl: string;
  totalSupply: string;
  // Metadata
  createdAt: string;
  transactionHash: string;
}

// Event types for tracking token activities
interface TokenEvent {
  token: Address;
  timestamp: string;
  blockNumber: number;
  transactionHash: string;
}

interface TradeEvent extends TokenEvent {
  trader: Address;
  amount: string;
  price: string;
  fee: string;
  type: "buy" | "sell";
}

interface StateChangeEvent extends TokenEvent {
  newState: TokenState;
  reason?: string;
}

export type {
  Address,
  Token,
  TokenStats,
  TokenEvent,
  TradeEvent,
  StateChangeEvent,
};

export { TokenState };
