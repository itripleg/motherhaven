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
  43113: http(ALCHEMY_RPC_URL),
};

// Create wagmi config
export const config = createConfig({
  chains: [avalancheFuji],
  connectors: [metaMask()],
  transports: avalancheFujiTransport,
});

// Create and export a public client instance using viem directly
export const publicClient = createPublicClient({
  chain: avalancheFuji,
  transport: viemHttp(ALCHEMY_RPC_URL),
});
