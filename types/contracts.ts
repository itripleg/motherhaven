// types/contracts.ts
import { Abi, Address } from "viem";

// Import directly from Remix-generated metadata files
import TokenFactoryMetadata from "@/contracts/artifacts/GrandFactory_metadata.json";
import TokenMetadata from "@/contracts/artifacts/BurnToken_metadata.json";
import YmirMetadata from "@/contracts/artifacts/Ymir_metadata.json";

// Extract ABIs from metadata
export const FACTORY_ABI = TokenFactoryMetadata.output.abi as Abi;
export const TOKEN_ABI = TokenMetadata.output.abi as Abi;
export const MANAGER_ABI = YmirMetadata.output.abi as Abi;

// Address configuration
export const ADDRESSES = {
  MAINNET: {
    FACTORY: "0x0000000000000000000000000000000000000000" as Address,
  },
  TESTNET: {
    FACTORY: process.env.NEXT_PUBLIC_TESTNET_FACTORY_ADDRESS as Address,
  },
} as const;

export const FACTORY_ADDRESS: Address =
  process.env.NEXT_PUBLIC_NETWORK === "testnet"
    ? ADDRESSES.TESTNET.FACTORY
    : ADDRESSES.MAINNET.FACTORY;

// Additional constants
export const FAUCET_ADDRESS = "0x0B50C987D357a8000FCD88f7eC6D35A88775AfD2";

// Network info
export const CURRENT_NETWORK = process.env.NEXT_PUBLIC_NETWORK || "testnet";
export const IS_TESTNET = CURRENT_NETWORK === "testnet";

// =================================================================
//                    FACTORY CONSTANTS
// =================================================================
// These are immutable constants from the GrandFactory contract
// Updated to match your deployed contract's actual values

export const FACTORY_CONSTANTS = {
  // Core constants (match contract exactly)
  DECIMALS: "1000000000000000000", // 10^18
  MAX_SUPPLY: "1000000000000000000000000000", // 1 billion * 10^18
  INITIAL_PRICE: "0.00001", // 0.00001 ether
  MIN_PURCHASE: "0.00001", // INITIAL_PRICE
  MAX_PURCHASE: "50", // 50 ether
  MAX_WALLET_PERCENTAGE: 5, // 5%
  PRICE_RATE: "2000", // Bonding curve steepness
  TRADING_FEE: 30, // 30 basis points (0.3%)

  // NEW: Auto-resume functionality
  AUTO_RESUME_TIME: 10800, // 3 hours in seconds (3 * 60 * 60)

  // Derived values for convenience
  DEFAULT_FUNDING_GOAL: "25", // 25 ether (can be changed by owner)
} as const;

// Type for factory constants
export type FactoryConstants = typeof FACTORY_CONSTANTS;

// Helper functions
export function getContractAddresses(): Record<string, Address> {
  return {
    factory: FACTORY_ADDRESS,
    faucet: FAUCET_ADDRESS,
  };
}

export function validateNetwork(): boolean {
  const network = process.env.NEXT_PUBLIC_NETWORK;
  return network === "testnet" || network === "mainnet";
}

// Extract events for easy access
export const FACTORY_EVENTS = FACTORY_ABI.filter(
  (item: any) => item.type === "event"
);
export const TOKEN_EVENTS = TOKEN_ABI.filter(
  (item: any) => item.type === "event"
);
export const MANAGER_EVENTS = MANAGER_ABI.filter(
  (item: any) => item.type === "event"
);

// Helper functions for new contract features
export function getAutoResumeTime(): number {
  return FACTORY_CONSTANTS.AUTO_RESUME_TIME;
}

export function calculateAutoResumeTimestamp(
  goalReachedTimestamp: number
): number {
  return goalReachedTimestamp + FACTORY_CONSTANTS.AUTO_RESUME_TIME;
}
