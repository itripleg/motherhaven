// wagmi-config.ts

import { http, createConfig } from "wagmi";
import { avalancheFuji } from "wagmi/chains";
import { injected } from "wagmi/connectors";
import { metaMask } from "wagmi/connectors";

const avalancheFujiTransport = {
  // 43113: http("https://api.avax-test.network/ext/bc/C/rpc"),
  43113: http(
    "https://avalanche-fuji.infura.io/v3/65db5a8299cf4c3b9cc7a3975a706f4d"
  ),
};

export const config = createConfig({
  chains: [avalancheFuji],
  connectors: [metaMask()],
  transports: avalancheFujiTransport,
  // transports: { [avalancheFuji.id]: http() },
});
