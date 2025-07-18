// @/wagmi-config.ts
import { http, createConfig } from "wagmi";
import { avalancheFuji } from "wagmi/chains";
import { metaMask } from "wagmi/connectors";
import { createPublicClient, http as viemHttp } from "viem";

// Alchemy RPC URL - Should be moved to environment variables
const ALCHEMY_RPC_URL =
  "https://avax-fuji.g.alchemy.com/v2/7NBTdVMFlqXaf5D-r-0kb73aehWeZ1Aj";

// Create the transport configuration
const avalancheFujiTransport = {
  43113: http(ALCHEMY_RPC_URL, {
    batch: {
      batchSize: 1000,
      wait: 150,
    },
  }),
};

// Create wagmi config with optimized polling
export const config = createConfig({
  chains: [avalancheFuji],
  connectors: [metaMask()],
  transports: avalancheFujiTransport,
  pollingInterval: 4000, // Default 4 seconds for better responsiveness
  syncConnectedChain: true, // Enable automatic chain sync for Brave compatibility
});

// Create and export a public client instance using viem directly
export const publicClient = createPublicClient({
  chain: avalancheFuji,
  transport: viemHttp(ALCHEMY_RPC_URL),
  pollingInterval: 30000, // 30 seconds
});
