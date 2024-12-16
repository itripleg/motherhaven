// types/contracts.ts
import { Abi, Address } from "viem";
import tokenABI from "@/contracts/nu-nu/VettedToken_abi.json";
import factoryABI from "@/contracts/nu-nu/VettedFactory_abi.json";
import managerABI from "@/contracts/new-factory/Manager_abi.json";

export const ADDRESSES = {
  MAINNET: {
    FACTORY: "0x0000000000000000000000000000000000000000" as Address,
  },
  TESTNET: {
    Factory: process.env.NEXT_PUBLIC_TESTNET_FACTORY_ADDRESS as Address,
  },
} as const;

export const FACTORY_ADDRESS: Address =
  process.env.NEXT_PUBLIC_NETWORK === "testnet"
    ? ADDRESSES.TESTNET.Factory
    : ADDRESSES.MAINNET.FACTORY;

export const FACTORY_ABI = factoryABI as Abi;
export const TOKEN_ABI = tokenABI as Abi;
export const MANAGER_ABI = managerABI as Abi;
