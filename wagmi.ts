// wagmiConfig.ts
import { createConfig } from "@wagmi/core";
import { metaMask } from "@wagmi/connectors";
import { custom } from "viem";

// Define the Fuji Avalanche Testnet chain
const avalancheFuji = {
  id: 43113,
  name: "Avalanche Fuji C-Chain",
  network: "avalanche-fuji",
  nativeCurrency: {
    name: "Avalanche",
    symbol: "AVAX",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://api.avax-test.network/ext/bc/C/rpc"],
    },
  },
  blockExplorers: {
    default: {
      name: "SnowTrace",
      url: "https://testnet.snowtrace.io/",
    },
  },
};

// Set up MetaMask connector and wagmi config
export const wagmiConfig = createConfig({
  connectors: [
    metaMask({
      chains: [avalancheFuji], // Add the chains you want to support
    }),
  ],
  publicClient: custom({ url: "https://api.avax-test.network/ext/bc/C/rpc" }), // Fuji RPC
});
