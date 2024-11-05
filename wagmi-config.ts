<<<<<<< HEAD
// wagmi-config.ts

=======
>>>>>>> 52897a74d11fd383a4b6861308d9ae4dca563bdb
import { http, createConfig } from "wagmi";
import { avalancheFuji } from "wagmi/chains";
import { injected } from "wagmi/connectors";

<<<<<<< HEAD
const avalancheFujiTransport = {
  43113: http("https://api.avax-test.network/ext/bc/C/rpc"),
};

export const config = createConfig({
  chains: [avalancheFuji],
  connectors: [injected(), injected()],
  transports: avalancheFujiTransport,
  // transports: { [avalancheFuji.id]: http() },
=======
export const wagmiConfig = createConfig({
  chains: [avalancheFuji],
  connectors: [injected()],
  transports: {
    [avalancheFuji.id]: http(),
  },
>>>>>>> 52897a74d11fd383a4b6861308d9ae4dca563bdb
});
