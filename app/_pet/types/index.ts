// pet/types/index.ts

import { type Address } from "viem";

// =================================================================
//                         Enums
// =================================================================

export enum PetType {
  DOG = 0,
  CAT = 1,
  ROBOT = 2,
  DRAGON = 3,
  ALIEN = 4,
}

export enum PetMood {
  ECSTATIC = 0, // 90-100 happiness
  HAPPY = 1, // 70-89 happiness
  CONTENT = 2, // 50-69 happiness
  SAD = 3, // 30-49 happiness
  DEPRESSED = 4, // 10-29 happiness
  MISERABLE = 5, // 0-9 happiness
}

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
//                      Core Pet Interfaces
// =================================================================

export interface PetStatus {
  name: string;
  petType: PetType;
  health: number; // 0-100
  happiness: number; // 0-100
  energy: number; // 0-100
  age: number; // in hours
  isAlive: boolean;
  mood: PetMood;
  action: PetActionType;
  message: string; // Current pet message
  lastFed: number; // timestamp in seconds
}

export interface PetStats {
  totalFeedings: number;
  totalBurnedTokens: string; // formatted as string for display
  totalFeeders: number;
  longestSurvival: number; // in hours
  currentAge: number; // in hours
  deathCount: number;
}

export interface UserStats {
  hasEverFed: boolean;
  feedingCount: number;
}

export interface SupportedToken {
  address: Address;
  name: string; // Display name (e.g., "Dog Food", "Cat Treats")
  feedingPower: string; // How much health/happiness per token (formatted)
  minBurnAmount: string; // Minimum tokens required (formatted)
  isSupported: boolean;
}

export interface PetPreview {
  health: number;
  happiness: number;
  energy: number;
  wouldBeAlive: boolean;
}

// =================================================================
//                    Contract Event Interfaces
// =================================================================

export interface PetFedEvent {
  feeder: Address;
  token: Address;
  amount: bigint;
  healthGained: number;
  happinessGained: number;
  timestamp: number;
}

export interface PetActionEvent {
  actionType: PetActionType;
  message: string;
  timestamp: number;
  newHealth: number;
  newHappiness: number;
  newEnergy: number;
}

export interface PetDeathEvent {
  deathTimestamp: number;
  finalHealth: number;
  lastWords: string;
}

export interface PetRevivedEvent {
  reviver: Address;
  revivalCost: bigint;
  timestamp: number;
}

// =================================================================
//                    Component Props Interfaces
// =================================================================

export interface PetHeaderProps {
  petName: string;
  petType: PetType;
  isAlive: boolean;
  lastUpdate: Date | null;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export interface PetStatusCardProps {
  petStatus: PetStatus;
  userStats: UserStats | null;
  onRevive: () => Promise<void>;
  isConnected: boolean;
  isWritePending: boolean;
  revivalCost?: string;
}

export interface CommunityStatsProps {
  petStats: PetStats | null;
  userStats: UserStats | null;
}

export interface FeedingSectionProps {
  petName: string;
  petIsAlive: boolean;
  supportedTokens: SupportedToken[];
  onFeed: (tokenAddress: Address, amount: string) => Promise<void>;
  isConnected: boolean;
  isWritePending: boolean;
}

export interface LoadingStateProps {
  message?: string;
}

export interface ErrorStateProps {
  error: string;
  onRetry: () => void;
}

// =================================================================
//                      Utility Types
// =================================================================

export interface PetTheme {
  primaryColor: string;
  secondaryColor: string;
  emoji: string;
  name: string;
}

export interface StatBarProps {
  label: string;
  value: number;
  maxValue: number;
  color: "health" | "happiness" | "energy";
  icon: React.ComponentType<{ className?: string }>;
}

export interface TimeDisplayProps {
  timestamp: number;
  format?: "relative" | "absolute" | "duration";
}

// =================================================================
//                    Hook Return Types
// =================================================================

export interface UsePetContractReturn {
  // Core data
  petStatus: PetStatus | null;
  petStats: PetStats | null;
  userStats: UserStats | null;
  supportedTokens: SupportedToken[];
  revivalCost: string;

  // Loading states
  isLoading: boolean;
  error: string | null;
  lastUpdate: Date | null;

  // Actions
  refreshData: () => Promise<void>;
  feedPet: (tokenAddress: Address, amount: string) => Promise<void>;
  revivePet: () => Promise<void>;
  isWritePending: boolean;

  // Helpers
  getPetTypeName: (type: PetType) => string;
  getMoodName: (mood: PetMood) => string;
  getActionName: (action: PetActionType) => string;
  formatAge: (ageInHours: number) => string;
  getTimeSinceLastFed: (lastFed: number) => string;

  // Contract info
  contractAddress: Address;
}

// =================================================================
//                    Helper Type Guards
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

// =================================================================
//                    Constants
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
//                    Health Status Helpers
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
//                    Time Formatting Helpers
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
