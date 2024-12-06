import tokenABI from "@/contracts/new-factory/Token_abi.json";
import factoryABI from "@/contracts/new-factory/Factory_abi.json";
import { Abi, Address } from "viem";

// Helper type for Ethereum addresses
// export type Address = `0x${string}`;

export const ADDRESSES = {
  MAINNET: {
    FACTORY: "0x0000000000000000000000000000000000000000" as Address, // placeholder
  },
  TESTNET: {
    // FACTORY: "0x56aec6B1D4Ea8Ee0B35B526e216aDd6e8268b1eA" as Address,
    FACTORY: "0x5e9994a88e9F46890DA8f61Bf0e8cEc02d96d2A6" as Address,
  },
} as const;

// Ensure the returned address is properly typed for viem
export const FACTORY_ADDRESS: Address =
  process.env.NEXT_PUBLIC_NETWORK === "testnet"
    ? ADDRESSES.TESTNET.FACTORY
    : ADDRESSES.MAINNET.FACTORY;

export const FACTORY_ABI = factoryABI as Abi;
export const TOKEN_ABI = tokenABI as Abi;
