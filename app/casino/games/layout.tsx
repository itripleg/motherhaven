"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { config } from "@/wagmi";
import { Profile } from "../profile";
import WagmiContext from "@/contexts/WagmiContext";

const queryClient = new QueryClient();

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div>{children}</div>
    // <WagmiProvider config={config}>
    //   <QueryClientProvider client={queryClient}>
    //     {/* <Profile /> */}
    //     {children}
    //   </QueryClientProvider>
    // </WagmiProvider>
    // <WagmiContext>{children}</WagmiContext>
  );
}
