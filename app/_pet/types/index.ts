// pet/types/index.ts

import { type Address } from "viem";

// =================================================================
//                         Simplified Enums
// =================================================================

// Keep for UI compatibility, but simplified contract only uses DOG
export enum PetType {
  DOG = 0,
  CAT = 1,
  ROBOT = 2,
  DRAGON = 3,
  ALIEN = 4,
}

// Keep for UI, but simplified contract doesn't track mood
export enum PetMood {
  ECSTATIC = 0,
  HAPPY = 1,
  CONTENT = 2,
  SAD = 3,
  DEPRESSED = 4,
  MISERABLE = 5,
}

// Keep for UI, but simplified contract doesn't track actions
export enum PetActionType {
  SLEEPING = 0,
  PLAYING = 1,
  EATING = 2,
  EXPLORING = 3,
  RESTING = 4,
  SOCIALIZING = 5,
  DREAMING = 6,
  EXERCISING = 7,
}

// =================================================================
//                   Simplified Pet Interfaces
// =================================================================

// This matches our simplified contract getPetStatus() return
export interface SimplePetStatus {
  name: string;
  health: number; // 0-100
  isAlive: boolean;
  lastFed: number; // timestamp in seconds
  totalFeedings: number;
}

// Extended interface for UI compatibility (adds mock values for UI)
export interface PetStatus {
  name: string;
  petType: PetType; // Always DOG in simplified version
  health: number; // 0-100
  happiness: number; // Mock value for UI
  energy: number; // Mock value for UI
  age: number; // Mock value for UI
  isAlive: boolean;
  mood: PetMood; // Mock value for UI
  action: PetActionType; // Mock value for UI
  message: string; // Mock message for UI
  lastFed: number; // timestamp in seconds
  totalFeedings: number; // Real from contract
}

// Simplified stats (most values are mocked for UI)
export interface PetStats {
  totalFeedings: number; // Real from contract
  totalBurnedTokens: string; // Mock value
  totalFeeders: number; // Mock value
  longestSurvival: number; // Mock value
  currentAge: number; // Mock value
  deathCount: number; // Mock value
}

// Simplified user stats
export interface UserStats {
  hasEverFed: boolean; // Derived from feedingCount > 0
  feedingCount: number; // Real from contract
}

// Simplified token interface (empty for now)
export interface SupportedToken {
  address: Address;
  name: string;
  feedingPower: string;
  minBurnAmount: string;
  isSupported: boolean;
}

// =================================================================
//                Simplified Contract Event Interfaces
// =================================================================

export interface PetFedEvent {
  feeder: Address;
  amount: bigint;
  newHealth: number;
  timestamp: number;
}

export interface PetDeathEvent {
  timestamp: number;
  message: string;
}

export interface PetRevivedEvent {
  reviver: Address;
  timestamp: number;
}

// =================================================================
//                Component Props Interfaces (Updated)
// =================================================================

export interface PetHeaderProps {
  petName: string;
  petType: PetType;
  isAlive: boolean;
  lastUpdate: Date | null;
  onRefresh: () => Promise<void>; // Fixed return type
  isRefreshing: boolean;
  // New simplified props
  currentHealth?: number;
  timeSinceLastFed?: string;
}

export interface PetStatusCardProps {
  petStatus: PetStatus;
  userStats: UserStats | null;
  onRevive: () => Promise<void>;
  isConnected: boolean;
  isWritePending: boolean;
  revivalCost?: string;
  // New simplified props
  onUpdateHealth?: () => Promise<void>;
  currentHealth?: number | null;
  timeSinceLastFed?: number | null;
  formatTimeSince?: (seconds: number) => string;
}

export interface CommunityStatsProps {
  petStats: PetStats | null;
  userStats: UserStats | null;
  // New prop to indicate simplified mode
  isSimplified?: boolean;
}

export interface FeedingSectionProps {
  petName: string;
  petIsAlive: boolean;
  supportedTokens: SupportedToken[];
  onFeed: (tokenAddress: Address, amount: string) => Promise<void>;
  isConnected: boolean;
  isWritePending: boolean;
  // New simplified props
  isSimplified?: boolean;
  contractAddress?: string;
}

export interface LoadingStateProps {
  message?: string;
}

export interface ErrorStateProps {
  error: string;
  onRetry: () => void;
}

// =================================================================
//                Simplified Hook Return Type
// =================================================================

export interface UsePetContractReturn {
  // Core simplified data
  petStatus: SimplePetStatus | null;
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
  updatePetHealth: () => Promise<void>;
  isWritePending: boolean;

  // Helpers
  formatTimeSince: (seconds: number) => string;

  // Contract info
  contractAddress: string;
}

// =================================================================
//                    Constants (Unchanged for UI)
// =================================================================

export const PET_TYPE_NAMES: Record<PetType, string> = {
  [PetType.DOG]: "Dog",
  [PetType.CAT]: "Cat",
  [PetType.ROBOT]: "Robot",
  [PetType.DRAGON]: "Dragon",
  [PetType.ALIEN]: "Alien",
};

export const PET_TYPE_EMOJIS: Record<PetType, string> = {
  [PetType.DOG]: "🐕",
  [PetType.CAT]: "🐱",
  [PetType.ROBOT]: "🤖",
  [PetType.DRAGON]: "🐉",
  [PetType.ALIEN]: "👽",
};

export const PET_MOOD_NAMES: Record<PetMood, string> = {
  [PetMood.ECSTATIC]: "Ecstatic",
  [PetMood.HAPPY]: "Happy",
  [PetMood.CONTENT]: "Content",
  [PetMood.SAD]: "Sad",
  [PetMood.DEPRESSED]: "Depressed",
  [PetMood.MISERABLE]: "Miserable",
};

export const PET_MOOD_COLORS: Record<PetMood, string> = {
  [PetMood.ECSTATIC]: "text-purple-400",
  [PetMood.HAPPY]: "text-green-400",
  [PetMood.CONTENT]: "text-blue-400",
  [PetMood.SAD]: "text-yellow-400",
  [PetMood.DEPRESSED]: "text-orange-400",
  [PetMood.MISERABLE]: "text-red-400",
};

export const PET_ACTION_NAMES: Record<PetActionType, string> = {
  [PetActionType.SLEEPING]: "Sleeping",
  [PetActionType.PLAYING]: "Playing",
  [PetActionType.EATING]: "Eating",
  [PetActionType.EXPLORING]: "Exploring",
  [PetActionType.RESTING]: "Resting",
  [PetActionType.SOCIALIZING]: "Socializing",
  [PetActionType.DREAMING]: "Dreaming",
  [PetActionType.EXERCISING]: "Exercising",
};

export const PET_ACTION_COLORS: Record<PetActionType, string> = {
  [PetActionType.SLEEPING]: "text-indigo-400",
  [PetActionType.PLAYING]: "text-green-400",
  [PetActionType.EATING]: "text-yellow-400",
  [PetActionType.EXPLORING]: "text-blue-400",
  [PetActionType.RESTING]: "text-purple-400",
  [PetActionType.SOCIALIZING]: "text-pink-400",
  [PetActionType.DREAMING]: "text-violet-400",
  [PetActionType.EXERCISING]: "text-orange-400",
};

// =================================================================
//                    Health Status Helpers (Unchanged)
// =================================================================

export const getHealthStatus = (
  health: number
): {
  status: "critical" | "low" | "medium" | "good" | "excellent";
  color: string;
  gradient: string;
} => {
  if (health >= 90) {
    return {
      status: "excellent",
      color: "text-green-400",
      gradient: "from-green-500 to-emerald-400",
    };
  } else if (health >= 70) {
    return {
      status: "good",
      color: "text-lime-400",
      gradient: "from-lime-500 to-green-400",
    };
  } else if (health >= 50) {
    return {
      status: "medium",
      color: "text-yellow-400",
      gradient: "from-yellow-500 to-orange-400",
    };
  } else if (health >= 30) {
    return {
      status: "low",
      color: "text-orange-400",
      gradient: "from-orange-500 to-red-400",
    };
  } else {
    return {
      status: "critical",
      color: "text-red-400",
      gradient: "from-red-500 to-red-600",
    };
  }
};

// =================================================================
//                Time Formatting Helpers (Simplified)
// =================================================================

export const formatAge = (ageInHours: number): string => {
  const days = Math.floor(ageInHours / 24);
  const hours = ageInHours % 24;

  if (days > 0) {
    return `${days}d ${hours}h`;
  }
  return `${hours}h`;
};

export const getTimeSinceLastFed = (lastFed: number): string => {
  if (!lastFed) return "Never";
  const timeDiff = Date.now() / 1000 - lastFed; // lastFed is in seconds
  const hours = Math.floor(timeDiff / 3600);
  const minutes = Math.floor((timeDiff % 3600) / 60);

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
//                Helper Type Guards (Keep for compatibility)
// =================================================================

export function isPetType(value: any): value is PetType {
  return typeof value === "number" && value >= 0 && value <= 4;
}

export function isPetMood(value: any): value is PetMood {
  return typeof value === "number" && value >= 0 && value <= 5;
}

export function isPetActionType(value: any): value is PetActionType {
  return typeof value === "number" && value >= 0 && value <= 7;
}
