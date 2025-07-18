// types/vanity.ts - Updated to match current usage
import { Address } from "viem";

// =================================================================
//                        ENUMS
// =================================================================

export enum VanityNameValidationError {
  TOO_SHORT = "TOO_SHORT",
  TOO_LONG = "TOO_LONG",
  INVALID_CHARACTERS = "INVALID_CHARACTERS",
  ALREADY_TAKEN = "ALREADY_TAKEN",
  PROFANITY = "PROFANITY",
  RESERVED = "RESERVED",
}

// =================================================================
//                    VANITY NAME INTERFACES
// =================================================================

/**
 * Represents a single vanity name change in history
 */
export interface VanityNameHistoryEntry {
  name: string;
  changedAt: string; // ISO timestamp
  requestId: number;
  burnAmount: string; // Token amount with decimals (as string)
  tokenAddress: Address;
  transactionHash: string;
}

/**
 * Vanity name data structure within user document
 */
export interface VanityNameData {
  current: string; // Current display name (empty string if no vanity name)
  history: VanityNameHistoryEntry[];
  totalChanges: number;
  lastChanged: string | null; // ISO timestamp or null if never changed
}

/**
 * Document structure for vanity_names collection
 */
export interface VanityNameDocument {
  name: string; // Lowercase for uniqueness
  displayName: string; // Original case for display
  owner: Address; // User address (lowercase)
  claimedAt: string; // ISO timestamp
  transactionHash: string;
  blockNumber: number;
  isActive: boolean; // For soft deletion
}

// =================================================================
//                    STATS AND LEADERBOARD
// =================================================================

/**
 * Vanity name statistics for the stats page
 */
export interface VanityNameStats {
  totalNames: number;
  totalRequests: number;
  pendingRequests: number;
  confirmedRequests: number;
  rejectedRequests: number;
  activeUsers: number;
  popularNames: Array<{
    name: string;
    changeCount: number;
  }>;
}

/**
 * Vanity name leaderboard entry
 */
export interface VanityNameLeaderboardEntry {
  rank: number;
  user: Address;
  vanityName: string;
  displayName: string;
  totalChanges: number;
  totalBurned: string;
  lastChanged: string;
  claimedAt: string;
  badges: string[];
  isCurrentUser?: boolean;
}

/**
 * User burn info from contract
 */
export interface UserBurnInfo {
  totalBurned: string;
  totalSpent: string;
  availableBalance: string;
  possibleNameChanges: number;
}

// =================================================================
//                    VALIDATION
// =================================================================

/**
 * Validation result for vanity names
 */
export interface VanityNameValidationResult {
  isValid: boolean;
  error?: VanityNameValidationError;
  message?: string;
}

// =================================================================
//                    API TYPES
// =================================================================

/**
 * Request to check if vanity name is available
 */
export interface CheckVanityNameAvailabilityRequest {
  name: string;
}

/**
 * Response for vanity name availability check
 */
export interface CheckVanityNameAvailabilityResponse {
  available: boolean;
  reason?: VanityNameValidationError;
  message?: string;
}

// =================================================================
//                    CONSTANTS
// =================================================================

export const VANITY_NAME_CONSTANTS = {
  MIN_LENGTH: 3,
  MAX_LENGTH: 32,
  ALLOWED_CHARACTERS: /^[a-zA-Z0-9_]+$/,
  COLLECTION_NAMES: {
    USERS: "users",
    VANITY_NAMES: "vanity_names",
  },
  RESERVED_NAMES: [
    "admin",
    "moderator",
    "support",
    "official",
    "team",
    "bot",
    "system",
    "null",
    "undefined",
    "anonymous",
    "guest",
    "user",
    "test",
    "demo",
  ],
} as const;

// =================================================================
//                    ERROR TYPES
// =================================================================

/**
 * Vanity name specific errors
 */
export class VanityNameError extends Error {
  constructor(
    message: string,
    public code: VanityNameValidationError,
    public details?: any
  ) {
    super(message);
    this.name = "VanityNameError";
  }
}

// =================================================================
//                    TYPE GUARDS
// =================================================================

/**
 * Type guard for valid vanity name
 */
export function isValidVanityName(name: string): boolean {
  return (
    name.length >= VANITY_NAME_CONSTANTS.MIN_LENGTH &&
    name.length <= VANITY_NAME_CONSTANTS.MAX_LENGTH &&
    VANITY_NAME_CONSTANTS.ALLOWED_CHARACTERS.test(name)
  );
}

// =================================================================
//                    DEFAULT EXPORT
// =================================================================

const VanityNameTypes = {
  VanityNameValidationError,
  VanityNameError,
  VANITY_NAME_CONSTANTS,
} as const;

export default VanityNameTypes;
