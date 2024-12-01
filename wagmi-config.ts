// wagmi-config.ts

import { http, createConfig } from "wagmi";
import { avalancheFuji } from "wagmi/chains";
import { injected } from "wagmi/connectors";
import { metaMask } from "wagmi/connectors";

const avalancheFujiTransport = {
  // Infura Fuji
  //   43113: http(
  //     // "https://avalanche-fuji.infura.io/v3/65db5a8299cf4c3b9cc7a3975a706f4d"
  //     "https://avax-mainnet.g.alchemy.com/v2/7NBTdVMFlqXaf5D-r-0kb73aehWeZ1Aj"
  //   ),
  // };
  // TODO: use .env
  // Alchemy Fuji
  43113: http(
    "https://avax-fuji.g.alchemy.com/v2/7NBTdVMFlqXaf5D-r-0kb73aehWeZ1Aj"
  ),
};

export const config = createConfig({
  chains: [avalancheFuji],
  connectors: [metaMask()],
  transports: avalancheFujiTransport,
  // transports: { [avalancheFuji.id]: http() },
});
