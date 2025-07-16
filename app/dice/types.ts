// app/dice/types.ts

import { Address } from "viem";

// Contract ABI Types
export const DICE_ABI = [
  {
    inputs: [],
    name: "buyIn",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint32", name: "_lowBet", type: "uint32" },
      { internalType: "uint32", name: "_highBet", type: "uint32" },
      { internalType: "uint256", name: "_betAmount", type: "uint256" },
    ],
    name: "roll",
    outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "getCurrentRoll",
    outputs: [
      { internalType: "uint32", name: "_lowBet", type: "uint32" },
      { internalType: "uint32", name: "_highBet", type: "uint32" },
      { internalType: "uint256", name: "_betAmount", type: "uint256" },
      { internalType: "uint256", name: "_rollResult", type: "uint256" },
      { internalType: "uint256", name: "_payout", type: "uint256" },
      { internalType: "bool", name: "_winner", type: "bool" },
      { internalType: "bool", name: "_rollInProgress", type: "bool" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "user", type: "address" }],
    name: "getUserBalance",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint32", name: "_lowBet", type: "uint32" },
      { internalType: "uint32", name: "_highBet", type: "uint32" },
    ],
    name: "getWinProbability",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint32", name: "_lowBet", type: "uint32" },
      { internalType: "uint32", name: "_highBet", type: "uint32" },
      { internalType: "uint256", name: "_betAmount", type: "uint256" },
    ],
    name: "calculatePayout",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [],
    name: "totalRolls",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getContractBalance",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getLinkBalance",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "resetRoll",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "amount", type: "uint256" }],
    name: "withdrawDicePoints",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "emergencyWithdraw",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "emergencyWithdrawLink",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "_lowBet",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "_highBet",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "_betAmount",
        type: "uint256",
      },
    ],
    name: "diceRolled",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "_rollResult",
        type: "uint256",
      },
    ],
    name: "diceLanded",
    type: "event",
  },
] as const;

// Contract Address - Replace with your deployed contract address
export const DICE_CONTRACT_ADDRESS: Address =
  "0xbd8638f1AEBa53A263D252dB11F62Ba93076cC2e";

// Game Types
export interface DiceRoll {
  id: string;
  timestamp: Date;
  betRange: [number, number];
  betAmount: string;
  rollResult: number;
  payout: string;
  isWin: boolean;
  transactionHash: string;
  gasUsed: string;
  blockNumber?: number;
  player?: Address;
}

export interface CurrentRoll {
  lowBet: number;
  highBet: number;
  betAmount: string;
  rollResult: number;
  payout: string;
  winner: boolean;
  rollInProgress: boolean;
}

export interface UserStats {
  totalBets: number;
  totalWins: number;
  totalLosses: number;
  totalWagered: string;
  totalWon: string;
  winRate: number;
  averageBet: string;
  biggestWin: string;
  longestStreak: number;
  currentStreak: number;
  lastPlayedAt?: Date;
}

export interface GlobalStats {
  totalPlayers: number;
  totalRolls: number;
  totalVolume: string;
  averageWinRate: number;
  totalPayout: string;
  contractBalance: string;
  linkBalance: string;
  lastRollAt?: Date;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
  unlockedAt?: Date;
  requirement: {
    type:
      | "rolls"
      | "wins"
      | "streak"
      | "bet_amount"
      | "total_wagered"
      | "win_rate";
    value: number;
  };
}

// UI Component Props
export interface BuyInModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface DiceRulesProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface StatCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ComponentType<any>;
  trend?: "up" | "down" | "neutral";
  color?: "primary" | "green" | "red" | "blue" | "yellow";
}

// Filter Types
export type RollFilter = "all" | "wins" | "losses";
export type DateFilter = "all" | "today" | "week" | "month";
export type SortField = "timestamp" | "betAmount" | "payout" | "rollResult";
export type SortDirection = "asc" | "desc";

// Dice Game State
export interface DiceGameState {
  isRolling: boolean;
  currentRoll: CurrentRoll | null;
  userBalance: string;
  contractBalance: string;
  linkBalance: string;
  totalRolls: number;
  lastRollResult: number | null;
  error: string | null;
  isConnected: boolean;
  userAddress: Address | null;
}

// Contract Read/Write Hooks Return Types
export interface UseContractReadResult<T> {
  data: T | undefined;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<any>;
}

export interface UseContractWriteResult {
  writeContract: (args: any) => void;
  data: string | undefined;
  error: Error | null;
  isPending: boolean;
  isSuccess: boolean;
}

// Event Types
export interface DiceRolledEvent {
  lowBet: bigint;
  highBet: bigint;
  betAmount: bigint;
  player: Address;
  transactionHash: string;
  blockNumber: number;
  timestamp: Date;
}

export interface DiceLandedEvent {
  rollResult: bigint;
  player: Address;
  payout: bigint;
  isWin: boolean;
  transactionHash: string;
  blockNumber: number;
  timestamp: Date;
}

// Utility Types
export interface BetRange {
  min: number;
  max: number;
}

export interface PayoutCalculation {
  winChance: number;
  multiplier: number;
  estimatedPayout: string;
}

// Constants
export const DICE_CONSTANTS = {
  MIN_BET_RANGE: 11,
  MAX_BET_RANGE: 100,
  MIN_BET_AMOUNT: "0.001",
  MAX_BET_AMOUNT: "100",
  ROLL_TIMEOUT: 300000, // 5 minutes in milliseconds
  REFRESH_INTERVAL: 5000, // 5 seconds
  PAGINATION_SIZE: 10,
  ACHIEVEMENT_REQUIREMENTS: {
    FIRST_ROLL: 1,
    LUCKY_STREAK: 5,
    HIGH_ROLLER: 1,
    RISK_TAKER: 20, // Range size
    CONSISTENT_PLAYER: 100,
    BIG_WINNER: 10,
  },
} as const;

// Validation Schemas
export interface BetValidation {
  isValid: boolean;
  errors: string[];
}

export function validateBetRange(range: [number, number]): BetValidation {
  const errors: string[] = [];

  if (range[0] < DICE_CONSTANTS.MIN_BET_RANGE) {
    errors.push(`Minimum bet range is ${DICE_CONSTANTS.MIN_BET_RANGE}`);
  }

  if (range[1] > DICE_CONSTANTS.MAX_BET_RANGE) {
    errors.push(`Maximum bet range is ${DICE_CONSTANTS.MAX_BET_RANGE}`);
  }

  if (range[0] >= range[1]) {
    errors.push("Low bet must be less than high bet");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function validateBetAmount(amount: string): BetValidation {
  const errors: string[] = [];
  const numAmount = parseFloat(amount);

  if (isNaN(numAmount) || numAmount <= 0) {
    errors.push("Bet amount must be a positive number");
  }

  if (numAmount < parseFloat(DICE_CONSTANTS.MIN_BET_AMOUNT)) {
    errors.push(`Minimum bet amount is ${DICE_CONSTANTS.MIN_BET_AMOUNT} DICE`);
  }

  if (numAmount > parseFloat(DICE_CONSTANTS.MAX_BET_AMOUNT)) {
    errors.push(`Maximum bet amount is ${DICE_CONSTANTS.MAX_BET_AMOUNT} DICE`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Utility Functions
export function calculateWinChance(range: [number, number]): number {
  return range[1] - range[0] + 1;
}

export function calculateMultiplier(range: [number, number]): number {
  const winChance = calculateWinChance(range);
  return 100 / winChance;
}

export function calculatePayout(
  range: [number, number],
  betAmount: string
): string {
  const multiplier = calculateMultiplier(range);
  const payout = parseFloat(betAmount) * multiplier;
  return payout.toFixed(6);
}

export function formatDiceAmount(
  amount: string | number,
  decimals: number = 6
): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (num >= 1000000) return (num / 1000000).toFixed(2) + "M";
  if (num >= 1000) return (num / 1000).toFixed(2) + "K";
  return num.toFixed(decimals);
}

export function getDiceIconIndex(rollResult: number): number {
  if (rollResult <= 16) return 0;
  if (rollResult <= 33) return 1;
  if (rollResult <= 50) return 2;
  if (rollResult <= 66) return 3;
  if (rollResult <= 83) return 4;
  return 5;
}

export function isRollWin(
  rollResult: number,
  betRange: [number, number]
): boolean {
  return rollResult >= betRange[0] && rollResult <= betRange[1];
}

export function formatTransactionHash(hash: string): string {
  return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
}

export function getExplorerUrl(
  hash: string,
  type: "tx" | "address" = "tx"
): string {
  const baseUrl = "https://testnet.snowtrace.io";
  return `${baseUrl}/${type}/${hash}`;
}
