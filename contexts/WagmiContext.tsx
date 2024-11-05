"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
<<<<<<< HEAD
import { WagmiProvider } from "wagmi";
import { config } from "@/wagmi-config";
=======
import { WagmiProvider } from "wagmi"; // Use WagmiProvider now
import { wagmiConfig } from "@/wagmi-config";
>>>>>>> 52897a74d11fd383a4b6861308d9ae4dca563bdb

const queryClient = new QueryClient();

export default function WagmiContext({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
