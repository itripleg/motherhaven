// types/vanity.ts
// TypeScript types for Vanity Name System

import { Address } from "viem";

// =================================================================
//                        ENUMS
// =================================================================

export enum VanityRequestStatus {
  PENDING = "pending",
  CONFIRMED = "confirmed",
  REJECTED = "rejected",
}

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
 * Document structure for vanityNames collection
 */
export interface VanityNameDocument {
  name: string; // Lowercase for uniqueness
  displayName: string; // Original case for display
  owner: Address; // User address (lowercase)
  claimedAt: string; // ISO timestamp
  requestId: number;
  burnAmount: string; // Token amount with decimals
  tokenAddress: Address;
  transactionHash: string;
  isActive: boolean; // For soft deletion
}

/**
 * Document structure for vanityRequests collection
 */
export interface VanityRequestDocument {
  requestId: number;
  user: Address; // User address (lowercase)
  oldName: string; // Previous vanity name (empty if first time)
  newName: string; // Requested new name
  burnAmount: string; // Token amount with decimals
  tokenAddress: Address;
  status: VanityRequestStatus;
  rejectionReason: string; // Only populated if rejected
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
  transactionHash: string; // Original burn transaction
  blockNumber: number;

  // Webhook processing metadata
  webhookProcessed: boolean;
  webhookProcessedAt: string | null; // ISO timestamp
  confirmationTxHash: string | null; // TX hash when confirmed on contract
  confirmationBlockNumber: number | null;
}

// =================================================================
//                    UPDATED USER INTERFACE
// =================================================================

/**
 * Existing token creation data
 */
export interface CreatedToken {
  address: Address;
  fundingGoal: string;
  imageUrl: string;
  name: string;
  symbol: string;
  timestamp: string; // ISO timestamp
}

/**
 * Existing theme color data
 */
export interface ThemeColor {
  cssVar: string;
  description: string;
  hue: number;
  label: string;
  lightness: number;
  name: string;
  saturation: number;
}

/**
 * Existing theme data
 */
export interface ThemeData {
  colors: ThemeColor[];
  lastUpdated: string; // ISO timestamp
}

/**
 * Updated user document with vanity name support
 */
export interface UserDocument {
  address: Address; // User address (lowercase)
  createdTokens: CreatedToken[];
  lastActive: string; // ISO timestamp
  theme: ThemeData;

  // NEW: Vanity name data
  vanityName: VanityNameData;
}

// =================================================================
//                    CONTRACT EVENT TYPES
// =================================================================

/**
 * VanityNameRequested event from contract
 */
export interface VanityNameRequestedEvent {
  user: Address;
  oldName: string;
  newName: string;
  burnAmount: bigint;
  token: Address;
  timestamp: bigint;
  requestId: bigint;
}

/**
 * VanityNameConfirmed event from contract
 */
export interface VanityNameConfirmedEvent {
  user: Address;
  vanityName: string;
  requestId: bigint;
  timestamp: bigint;
}

/**
 * VanityNameRejected event from contract
 */
export interface VanityNameRejectedEvent {
  user: Address;
  requestedName: string;
  requestId: bigint;
  reason: string;
  timestamp: bigint;
}

/**
 * Parsed event data for webhook processing
 */
export interface ParsedVanityEvent {
  eventName:
    | "VanityNameRequested"
    | "VanityNameConfirmed"
    | "VanityNameRejected";
  args:
    | VanityNameRequestedEvent
    | VanityNameConfirmedEvent
    | VanityNameRejectedEvent;
  transactionHash: string;
  blockNumber: number;
  timestamp: string; // ISO timestamp
}

// =================================================================
//                    API REQUEST/RESPONSE TYPES
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
  suggestion?: string; // Alternative name if not available
}

/**
 * Request to get user by vanity name
 */
export interface GetUserByVanityNameRequest {
  name: string;
}

/**
 * Response for user lookup by vanity name
 */
export interface GetUserByVanityNameResponse {
  user: Address | null;
  displayName: string | null;
  claimedAt: string | null;
}

/**
 * Request to get user's vanity name history
 */
export interface GetVanityNameHistoryRequest {
  userAddress: Address;
}

/**
 * Response for vanity name history
 */
export interface GetVanityNameHistoryResponse {
  current: string;
  history: VanityNameHistoryEntry[];
  totalChanges: number;
  lastChanged: string | null;
}

/**
 * Request to search vanity names
 */
export interface SearchVanityNamesRequest {
  query: string;
  limit?: number;
}

/**
 * Response for vanity name search
 */
export interface SearchVanityNamesResponse {
  results: Array<{
    name: string;
    displayName: string;
    owner: Address;
    claimedAt: string;
  }>;
  hasMore: boolean;
}

/**
 * Request to get pending vanity requests (admin only)
 */
export interface GetPendingVanityRequestsRequest {
  limit?: number;
  offset?: number;
}

/**
 * Response for pending vanity requests
 */
export interface GetPendingVanityRequestsResponse {
  requests: VanityRequestDocument[];
  total: number;
  hasMore: boolean;
}

// =================================================================
//                    WEBHOOK PAYLOAD TYPES
// =================================================================

/**
 * Alchemy webhook payload structure
 */
export interface AlchemyWebhookPayload {
  webhookId: string;
  id: string;
  createdAt: string;
  type: string;
  event: {
    network: string;
    activity: Array<{
      fromAddress: string;
      toAddress: string;
      blockNum: string;
      hash: string;
      value: number;
      typeTraceAddress: string;
      functionName: string;
      log: {
        address: string;
        topics: string[];
        data: string;
        blockNumber: string;
        transactionHash: string;
        transactionIndex: string;
        blockHash: string;
        logIndex: string;
        removed: boolean;
      };
    }>;
  };
}

/**
 * Processed webhook data for vanity name events
 */
export interface ProcessedVanityWebhook {
  requestId: number;
  eventType:
    | "VanityNameRequested"
    | "VanityNameConfirmed"
    | "VanityNameRejected";
  user: Address;
  transactionHash: string;
  blockNumber: number;
  timestamp: string;

  // Event-specific data
  oldName?: string;
  newName?: string;
  burnAmount?: string;
  tokenAddress?: Address;
  rejectionReason?: string;
}

// =================================================================
//                    VALIDATION HELPERS
// =================================================================

/**
 * Validation result for vanity names
 */
export interface VanityNameValidationResult {
  isValid: boolean;
  error?: VanityNameValidationError;
  message?: string;
}

/**
 * Configuration for vanity name validation
 */
export interface VanityNameConfig {
  minLength: number;
  maxLength: number;
  allowedCharacters: RegExp;
  reservedNames: string[];
  profanityFilter: boolean;
}

// =================================================================
//                    UTILITY TYPES
// =================================================================

/**
 * Options for vanity name operations
 */
export interface VanityNameOptions {
  skipValidation?: boolean;
  allowDuplicates?: boolean;
  adminOverride?: boolean;
}

/**
 * Vanity name statistics
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
  user: Address;
  currentName: string;
  totalChanges: number;
  lastChanged: string;
  rank: number;
}

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

/**
 * Webhook processing errors
 */
export class WebhookProcessingError extends Error {
  constructor(
    message: string,
    public webhookId: string,
    public transactionHash?: string,
    public blockNumber?: number
  ) {
    super(message);
    this.name = "WebhookProcessingError";
  }
}

// =================================================================
//                    TYPE GUARDS
// =================================================================

/**
 * Type guard for VanityNameRequestedEvent
 */
export function isVanityNameRequestedEvent(
  event: any
): event is VanityNameRequestedEvent {
  return (
    event &&
    typeof event.user === "string" &&
    typeof event.oldName === "string" &&
    typeof event.newName === "string" &&
    typeof event.burnAmount === "bigint" &&
    typeof event.token === "string" &&
    typeof event.timestamp === "bigint" &&
    typeof event.requestId === "bigint"
  );
}

/**
 * Type guard for VanityNameConfirmedEvent
 */
export function isVanityNameConfirmedEvent(
  event: any
): event is VanityNameConfirmedEvent {
  return (
    event &&
    typeof event.user === "string" &&
    typeof event.vanityName === "string" &&
    typeof event.requestId === "bigint" &&
    typeof event.timestamp === "bigint"
  );
}

/**
 * Type guard for VanityNameRejectedEvent
 */
export function isVanityNameRejectedEvent(
  event: any
): event is VanityNameRejectedEvent {
  return (
    event &&
    typeof event.user === "string" &&
    typeof event.requestedName === "string" &&
    typeof event.requestId === "bigint" &&
    typeof event.reason === "string" &&
    typeof event.timestamp === "bigint"
  );
}

/**
 * Type guard for valid vanity name
 */
export function isValidVanityName(name: string): boolean {
  const MIN_LENGTH = 3;
  const MAX_LENGTH = 32;
  const ALLOWED_CHARACTERS = /^[a-zA-Z0-9_]+$/;

  return (
    name.length >= MIN_LENGTH &&
    name.length <= MAX_LENGTH &&
    ALLOWED_CHARACTERS.test(name)
  );
}

// =================================================================
//                    CONSTANTS
// =================================================================

export const VANITY_NAME_CONSTANTS = {
  MIN_LENGTH: 3,
  MAX_LENGTH: 32,
  ALLOWED_CHARACTERS: /^[a-zA-Z0-9_]+$/,
  BURN_COST: "1000000000000000000000", // 1000 tokens with 18 decimals
  COLLECTION_NAMES: {
    USERS: "users",
    VANITY_NAMES: "vanityNames",
    VANITY_REQUESTS: "vanityRequests",
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
//                    DEFAULT EXPORT
// =================================================================

const VanityNameTypes = {
  VanityRequestStatus,
  VanityNameValidationError,
  VanityNameError,
  WebhookProcessingError,
  VANITY_NAME_CONSTANTS,
} as const;

export default VanityNameTypes;
