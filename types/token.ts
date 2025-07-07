// types/token.ts - Updated Token interface
import { Address } from "viem";

export enum TokenState {
  NOT_CREATED = 0,
  TRADING = 1,
  GOAL_REACHED = 2,
  HALTED = 3,
  RESUMED = 4,
}

export interface ImagePosition {
  x: number; // -100 to 100 (percentage)
  y: number; // -100 to 100 (percentage)
  scale: number; // 0.5 to 3
  rotation: number; // -180 to 180 degrees
  fit?: "cover" | "contain" | "fill"; // Image fit mode
}

export interface PositionHistoryEntry {
  position: ImagePosition;
  updatedAt: string;
  updatedBy: string;
}

export interface Trade {
  blockNumber: number;
  ethAmount: string;
  pricePerToken: string;
  timestamp: string; // We will handle this string format in the chart
  token: Address;
  tokenAmount: string; // This is the missing property
  trader: Address;
  transactionHash: string;
  type: "buy" | "sell";
  fee?: string; // Optional fee property
}

// Import TokenStatistics from database.ts to avoid duplication
export interface TokenStatistics {
  totalSupply: string;
  currentPrice: string;
  volumeETH: string;
  tradeCount: number;
  uniqueHolders: number;
  priceChange24h?: number;
  highPrice24h?: string;
  lowPrice24h?: string;
  lastTradeTimestamp?: string;
}

export interface Token {
  // Basic token information from Token contract
  address: `0x${string}`;
  name: string;
  symbol: string;
  imageUrl: string;
  description?: string; // ✅ NOW OPTIONAL - can be populated from frontend or left empty

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
  initialPrice: string; // 0.00001 ether
  minPurchase: string; // INITIAL_PRICE
  maxPurchase: string; // 50 ether
  maxWalletPercentage: number; // 5
  priceRate: string; // 2000
  tradingFee: number; // 30 (0.3%)

  // Current state
  currentState: TokenState; // Updated to match database field name
  lastPrice: string;

  // NEW: Auto-resume tracking
  goalReachedTimestamp?: string; // When goal was reached (ISO string)
  haltedAt?: string; // When trading was halted
  resumedAt?: string; // When trading was manually resumed
  autoResumedAt?: string; // When trading was automatically resumed
  actualResumeTimestamp?: string; // Timestamp from contract event

  // On-chain stats
  totalSupply: string;

  // Metadata from creation event
  createdAt: string;
  blockNumber: number;
  transactionHash: string;

  // Image positioning and metadata
  imagePosition?: ImagePosition; // Position data for token header display
  lastUpdated?: string; // When image position was last updated
  updatedBy?: string; // Who last updated the image position
  positionHistory?: PositionHistoryEntry[]; // History of position changes (last 10)

  // Trade history
  lastTrade?: Trade;

  // Statistics
  statistics?: TokenStatistics;
}

// Interface for purchase option in token creation
export interface PurchaseOption {
  enabled: boolean;
  amount: string; // ETH amount
  minTokensOut: string; // Minimum tokens expected
}

// Interface for token creation form - UPDATED to make fields optional
export interface TokenCreationInfo {
  name: string;
  ticker: string;
  description?: string; // ✅ NOW OPTIONAL - can be added later from token page
  image: File | null;
  imagePosition?: ImagePosition; // ✅ NOW OPTIONAL - can be configured later from token page
  burnManager?: `0x${string}`;
  purchase: PurchaseOption; // Purchase option for creation
}

// Interface for image metadata stored in Firebase
export interface TokenImageMetadata {
  imageUrl: string;
  imagePosition: ImagePosition;
  uploadedAt: number;
  originalFilename: string;
  fileSize?: number;
  mimeType?: string;
  createdBy: string;
}

// Interface for token updates (analytics/logging)
export interface TokenUpdateLog {
  tokenAddress: string;
  updateType: "image_position" | "metadata" | "other";
  oldPosition?: ImagePosition | null;
  newPosition?: ImagePosition;
  updatedBy: string;
  timestamp: string;
  userAgent?: string;
  ipAddress?: string; // Optional for analytics
}

// Type guards remain the same
export const isValidImagePosition = (
  position: any
): position is ImagePosition => {
  return (
    typeof position === "object" &&
    position !== null &&
    typeof position.x === "number" &&
    typeof position.y === "number" &&
    typeof position.scale === "number" &&
    typeof position.rotation === "number" &&
    position.x >= -100 &&
    position.x <= 100 &&
    position.y >= -100 &&
    position.y <= 100 &&
    position.scale >= 0.5 &&
    position.scale <= 3 &&
    position.rotation >= -180 &&
    position.rotation <= 180 &&
    (!position.fit || ["cover", "contain", "fill"].includes(position.fit))
  );
};

export const isValidToken = (token: any): token is Token => {
  return (
    typeof token === "object" &&
    token !== null &&
    typeof token.address === "string" &&
    typeof token.name === "string" &&
    typeof token.symbol === "string" &&
    typeof token.creator === "string" &&
    (!token.imagePosition || isValidImagePosition(token.imagePosition))
  );
};

// Default values
export const DEFAULT_IMAGE_POSITION: ImagePosition = {
  x: 0,
  y: 0,
  scale: 1,
  rotation: 0,
  fit: "cover",
};

export const DEFAULT_PURCHASE_OPTION: PurchaseOption = {
  enabled: false,
  amount: "",
  minTokensOut: "0",
};

export const createImagePosition = (
  x: number = 0,
  y: number = 0,
  scale: number = 1,
  rotation: number = 0,
  fit: "cover" | "contain" | "fill" = "cover"
): ImagePosition => ({
  x: Math.max(-100, Math.min(100, x)),
  y: Math.max(-100, Math.min(100, y)),
  scale: Math.max(0.5, Math.min(3, scale)),
  rotation: Math.max(-180, Math.min(180, rotation)),
  fit,
});

export const clampImagePosition = (
  position: Partial<ImagePosition>
): ImagePosition => ({
  x: Math.max(-100, Math.min(100, position.x ?? 0)),
  y: Math.max(-100, Math.min(100, position.y ?? 0)),
  scale: Math.max(0.5, Math.min(3, position.scale ?? 1)),
  rotation: Math.max(-180, Math.min(180, position.rotation ?? 0)),
  fit: position.fit ?? "cover",
});

// CSS style generator for image positioning
export const getImagePositionStyle = (position?: ImagePosition) => {
  if (!position) {
    return {
      backgroundSize: "cover",
      backgroundPosition: "center",
      transform: "none",
    };
  }

  const { x, y, scale, rotation, fit = "cover" } = position;

  const baseStyle = {
    backgroundRepeat: "no-repeat" as const,
    transform: `rotate(${rotation}deg)`,
    transformOrigin: "center center" as const,
    transition: "all 0.2s ease-out" as const,
  };

  if (fit === "fill") {
    return {
      ...baseStyle,
      backgroundSize: "100% 100%",
      backgroundPosition: "center",
    };
  }

  if (fit === "contain") {
    return {
      ...baseStyle,
      backgroundSize: `${100 * scale}% auto`,
      backgroundPosition: `${50 + x}% ${50 + y}%`,
    };
  }

  // Default to "cover"
  return {
    ...baseStyle,
    backgroundSize: `${100 * scale}% ${100 * scale}%`,
    backgroundPosition: `${50 + x}% ${50 + y}%`,
  };
};

// Helper to check if user can edit token
export const canEditToken = (token: Token, userAddress?: string): boolean => {
  return !!(
    userAddress &&
    token.creator &&
    userAddress.toLowerCase() === token.creator.toLowerCase()
  );
};

// NEW: Helper functions for auto-resume functionality
export const getTimeUntilAutoResume = (
  goalReachedTimestamp?: string
): number => {
  if (!goalReachedTimestamp) return 0;

  const goalTime = new Date(goalReachedTimestamp).getTime();
  const resumeTime = goalTime + 3 * 60 * 60 * 1000; // 3 hours in milliseconds
  const now = Date.now();

  return Math.max(0, resumeTime - now);
};

export const isAutoResumeReady = (goalReachedTimestamp?: string): boolean => {
  return getTimeUntilAutoResume(goalReachedTimestamp) === 0;
};

export const formatTimeUntilResume = (
  goalReachedTimestamp?: string
): string => {
  const timeRemaining = getTimeUntilAutoResume(goalReachedTimestamp);
  if (timeRemaining === 0) return "Ready to resume";

  const hours = Math.floor(timeRemaining / (60 * 60 * 1000));
  const minutes = Math.floor((timeRemaining % (60 * 60 * 1000)) / (60 * 1000));
  const seconds = Math.floor((timeRemaining % (60 * 1000)) / 1000);

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  } else {
    return `${seconds}s`;
  }
};
