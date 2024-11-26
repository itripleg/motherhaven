// wagmi-config.ts

import { http, createConfig } from "wagmi";
import { avalancheFuji } from "wagmi/chains";
import { injected } from "wagmi/connectors";
import { metaMask } from "wagmi/connectors";

const avalancheFujiTransport = {
  43113: http("https://api.avax-test.network/ext/bc/C/rpc"),
};

export const config = createConfig({
  chains: [avalancheFuji],
  connectors: [metaMask()],
  transports: avalancheFujiTransport,
  // transports: { [avalancheFuji.id]: http() },
});
