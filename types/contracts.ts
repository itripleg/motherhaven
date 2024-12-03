import tokenFactoryMetadata from "@/contracts/token-factory/artifacts/TokenFactory_metadata.json";
import tokenMetadata from "@/contracts/token-factory/artifacts/Token_metadata.json";
import factoryABI from "@/contracts/token-factory/BigBoss_abi.json";
import { Abi } from "viem";

// Helper type for Ethereum addresses
export type Address = `0x${string}`;

export const ADDRESSES = {
  MAINNET: {
    FACTORY: "0x0000000000000000000000000000000000000000" as Address, // placeholder
  },
  TESTNET: {
    FACTORY: "0x56aec6B1D4Ea8Ee0B35B526e216aDd6e8268b1eA" as Address,
  },
} as const;

// Ensure the returned address is properly typed for viem
export const FACTORY_ADDRESS: Address =
  process.env.NEXT_PUBLIC_NETWORK === "testnet"
    ? ADDRESSES.TESTNET.FACTORY
    : ADDRESSES.MAINNET.FACTORY;

export const FACTORY_ABI = factoryABI as Abi;
export const TOKEN_ABI = tokenMetadata.output.abi as Abi;
