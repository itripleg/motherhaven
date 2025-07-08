// pet/types/index.ts

import { type Address } from "viem";

// =================================================================
//                   Contract Data Interfaces (Real contract data only)
// =================================================================

// Matches your contract's getPetStatus() return exactly
export interface PetStatus {
  name: string;
  health: number; // 0-100
  isAlive: boolean;
  lastFed: number; // timestamp in seconds
  totalFeedings: number;
}

// Matches your contract's getPetInfo() return exactly
export interface ExtendedPetInfo {
  name: string;
  health: number; // 0-100
  isAlive: boolean;
  lastFed: number; // timestamp in seconds
  totalFeedings: number;
  deathCount: number;
  currentCaretaker: string; // address
}

// Matches your contract's getRevivalInfo() return exactly
export interface RevivalInfo {
  currentCost: bigint;
  nextCost: bigint;
  deathCount: number;
  maxCost: bigint;
}

// Real user stats from contract
export interface UserStats {
  feedingCount: number; // from getUserFeedingCount()
  hasEverFed: boolean; // derived from feedingCount > 0
}

// Real pet stats from contract
export interface PetStats {
  totalFeedings: number; // from getPetInfo()
  deathCount: number; // from getPetInfo()
  // Note: No totalBurnedTokens, totalFeeders, longestSurvival, currentAge in simplified contract
}

// =================================================================
//                Contract Event Interfaces
// =================================================================

export interface PetFedEvent {
  feeder: Address;
  amount: bigint;
  healthGained: number;
  newHealth: number;
  timestamp: number;
}

export interface PetDeathEvent {
  timestamp: number;
  message: string;
  deathCount: number;
}

export interface PetRevivedEvent {
  reviver: Address;
  newOwner: Address;
  revivalCost: bigint;
  timestamp: number;
  deathCount: number;
}

export interface PetRenamedEvent {
  owner: Address;
  oldName: string;
  newName: string;
  timestamp: number;
}

export interface PetCaretakerChangedEvent {
  previousCaretaker: Address;
  newCaretaker: Address;
}

// =================================================================
//                Component Props Interfaces
// =================================================================

export interface PetHeaderProps {
  petName: string;
  isAlive: boolean;
  currentHealth?: number;
  currentCaretaker?: string;
  deathCount?: number;
  revivalCost?: string;
  isUserCaretaker?: boolean;
  timeSinceLastFed?: number | null;
}

export interface PetStatusCardProps {
  extendedPetInfo: ExtendedPetInfo | null;
  revivalInfo: RevivalInfo | null;
  userStats: UserStats | null;
  onRevive: () => Promise<void>;
  onRenamePet?: (newName: string) => Promise<void>;
  onUpdateHealth?: () => Promise<void>;
  isConnected: boolean;
  isWritePending: boolean;
  isUserCaretaker: boolean;
  currentHealth?: number | null;
  timeSinceLastFed?: number | null;
  formatTimeSince?: (seconds: number) => string;
}

export interface CommunityStatsProps {
  petStats: PetStats | null;
  userStats: UserStats | null;
}

export interface FeedingSectionProps {
  petName: string;
  petIsAlive: boolean;
  isConnected: boolean;
  isWritePending: boolean;
  contractAddress?: string;
}

export interface LoadingStateProps {
  message?: string;
}

export interface ErrorStateProps {
  error: string;
  onRetry: () => Promise<void>;
}

// =================================================================
//                Hook Return Type
// =================================================================

export interface UsePetContractReturn {
  // Core contract data
  petStatus: PetStatus | null;
  extendedPetInfo: ExtendedPetInfo | null;
  revivalInfo: RevivalInfo | null;
  currentHealth: number | null;
  timeSinceLastFed: number | null;
  userFeedingCount: number | null;
  revivalCost: string;

  // Loading states
  isLoading: boolean;
  error: string | null;

  // Actions
  refreshData: () => Promise<void>;
  revivePet: () => Promise<void>;
  renamePet: (newName: string) => Promise<void>;
  updatePetHealth: () => Promise<void>;
  isWritePending: boolean;

  // Helpers
  formatTimeSince: (seconds: number) => string;
  isUserCaretaker: boolean;

  // Contract info
  contractAddress: string;
}

// =================================================================
//                    Health Status Helper
// =================================================================

export const getHealthStatus = (
  health: number
): {
  status: "critical" | "low" | "medium" | "good" | "excellent";
  color: string;
  urgency: "none" | "low" | "medium" | "high";
} => {
  if (health >= 80) {
    return {
      status: "excellent",
      color: "text-green-500",
      urgency: "none",
    };
  } else if (health >= 60) {
    return {
      status: "good",
      color: "text-lime-500",
      urgency: "none",
    };
  } else if (health >= 40) {
    return {
      status: "medium",
      color: "text-yellow-500",
      urgency: "low",
    };
  } else if (health >= 20) {
    return {
      status: "low",
      color: "text-orange-500",
      urgency: "medium",
    };
  } else {
    return {
      status: "critical",
      color: "text-red-500",
      urgency: "high",
    };
  }
};

// =================================================================
//                Time Formatting Helpers
// =================================================================

export const formatTimeSince = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m ago`;
  }
  return `${minutes}m ago`;
};

export const formatDuration = (seconds: number): string => {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
};

// =================================================================
//                Contract Configuration
// =================================================================

// CHOW Token Address
export const CHOW_TOKEN_ADDRESS =
  "0xd701634Bd3572Dd34b8C303D2590a29691a333d3" as Address;

// Pet Contract Address
export const PET_CONTRACT_ADDRESS =
  (process.env.NEXT_PUBLIC_PET_CONTRACT_ADDRESS as Address) ||
  ("0x2903AEf441d642144F4264898a199dF259dff53a" as Address);
