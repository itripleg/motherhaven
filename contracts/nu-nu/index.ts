// contracts/nu-nu/index.ts - Simple direct imports

import { Address } from "viem";

// Direct imports from Remix-generated metadata
import TokenFactoryMetadata from "./artifacts/TokenFactory_metadata.json";
import TokenMetadata from "./artifacts/Token_metadata.json";
import YmirMetadata from "./artifacts/Ymir_metadata.json";

// Extract ABIs directly from metadata
export const FACTORY_ABI = TokenFactoryMetadata.output.abi;
export const TOKEN_ABI = TokenMetadata.output.abi;
export const MANAGER_ABI = YmirMetadata.output.abi;

// Extract just the events for webhook usage
export const FACTORY_EVENTS = FACTORY_ABI.filter(
  (item: any) => item.type === "event"
);
export const TOKEN_EVENTS = TOKEN_ABI.filter(
  (item: any) => item.type === "event"
);
export const MANAGER_EVENTS = MANAGER_ABI.filter(
  (item: any) => item.type === "event"
);

// Address configuration from environment
export const ADDRESSES = {
  TESTNET: {
    FACTORY: process.env.NEXT_PUBLIC_TESTNET_FACTORY_ADDRESS as Address,
  },
  MAINNET: {
    FACTORY: "0x0000000000000000000000000000000000000000" as Address,
  },
} as const;

// Dynamic address selection
export const FACTORY_ADDRESS: Address =
  process.env.NEXT_PUBLIC_NETWORK === "testnet"
    ? ADDRESSES.TESTNET.FACTORY
    : ADDRESSES.MAINNET.FACTORY;

// Current network info
export const CURRENT_NETWORK = process.env.NEXT_PUBLIC_NETWORK || "testnet";
export const IS_TESTNET = CURRENT_NETWORK === "testnet";

// Webhook configuration - make sure it's exported
export const WEBHOOK_CONFIG = {
  FACTORY_ADDRESS,
  FACTORY_EVENTS,
  NETWORK: CURRENT_NETWORK,
} as const;

// Export as default too for easier importing
export default WEBHOOK_CONFIG;
