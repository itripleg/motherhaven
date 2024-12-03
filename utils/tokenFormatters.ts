// utils/tokenFormatters.ts
import {
  TokenData,
  TokenState,
  TokenContractState,
  TokenMetrics,
} from "@/types";
import { Address } from "viem";

interface RawFirestoreData {
  // Basic info
  address: string;
  name: string;
  symbol: string;
  creator: string;
  description?: string;
  imageUrl?: string;
  fundingGoal: string;

  // Contract info
  initialPrice?: string;
  maxSupply?: string;
  priceRate?: string;
  tradeCooldown?: number;
  maxWalletPercentage?: number;

  // Creation info
  createdAt: string;
  creationBlock?: number;
  transactionHash?: string;

  // Current state
  currentState?: string | number;
  collateral?: string | number;

  // Statistics
  statistics?: {
    currentPrice?: string;
    totalSupply?: string;
    volumeETH?: string | number;
    tradeCount?: number;
    uniqueHolders?: number;
  };

  // Last trade
  lastTrade?: {
    timestamp: string;
    type: "buy" | "sell";
    price: string;
    amount: string;
    ethAmount: string;
    trader: string;
  };
}

function parseTokenState(state: string | number | undefined): TokenState {
  if (typeof state === "string") {
    return (
      TokenState[state as keyof typeof TokenState] || TokenState.NOT_CREATED
    );
  }
  if (typeof state === "number") {
    return state as TokenState;
  }
  return TokenState.NOT_CREATED;
}

export function formatFirestoreData(
  docId: string,
  data: RawFirestoreData,
  realtimeStats?: {
    currentPrice?: string;
    collateral?: string;
    tokenState?: TokenState;
  }
): TokenData {
  // Format contract state
  const contractState: TokenContractState = {
    currentPrice:
      realtimeStats?.currentPrice || data.statistics?.currentPrice || "0",
    collateral: String(realtimeStats?.collateral || data.collateral || "0"),
    state: realtimeStats?.tokenState || parseTokenState(data.currentState),
    totalSupply: data.statistics?.totalSupply || "0",
  };

  // Format metrics
  const metrics: TokenMetrics = {
    volumeETH24h: String(data.statistics?.volumeETH || "0"),
    tradeCount24h: data.statistics?.tradeCount || 0,
    priceChange24h: 0, // Calculate if available
    highPrice24h: "0", // Add when available
    lowPrice24h: "0", // Add when available
    totalVolumeETH: String(data.statistics?.volumeETH || "0"),
    totalTradeCount: data.statistics?.tradeCount || 0,
    uniqueHolders: data.statistics?.uniqueHolders || 0,
    marketCap: "0", // Calculate based on price and supply
    buyPressure24h: 0, // Calculate from recent trades
    lastTradeTimestamp: data.lastTrade?.timestamp || "",
    timeToGoal: undefined, // Calculate based on volume trend
  };

  const tokenData: TokenData = {
    id: docId,
    address: data.address as Address,
    name: data.name,
    symbol: data.symbol,
    creator: data.creator as Address,
    description: data.description,
    imageUrl: data.imageUrl,
    initialPrice: data.initialPrice || "0",
    maxSupply: data.maxSupply || "0",
    priceRate: data.priceRate || "0",
    tradeCooldown: data.tradeCooldown || 0,
    maxWalletPercentage: data.maxWalletPercentage || 0,
    createdAt: data.createdAt,
    creationBlock: data.creationBlock || 0,
    transactionHash: data.transactionHash || "",
    contractState,
    metrics,
    lastTrade: data.lastTrade
      ? {
          ...data.lastTrade,
          trader: data.lastTrade.trader as Address,
        }
      : undefined,
  };

  return tokenData;
}
