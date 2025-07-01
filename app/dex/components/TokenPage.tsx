"use client";
import React from "react";
import { TokenHeaderStyled as TokenHeader } from "./TokenHeaderStyled";
import { TokenPriceCharts } from "./TokenPriceCharts";
import { TokenTradeCard } from "./TokenTradeCard";
import { ChatComponent } from "./ChatComponent";
import { MobileChatModal } from "./MobileChatModal";
import RecentTrades from "./RecentTrades";
// FINAL-HOOKS: Updated to use consolidated final-hooks
import { useTokenData } from "@/final-hooks/useTokenData";
import { TradesProvider } from "@/contexts/TradesContext";
import { DebugTokenLoading } from "./DebugTokenLoading";
import { Address } from "viem";
import { useAccount } from "wagmi";

interface TokenPageProps {
  tokenAddress: string;
}

export default function TokenPage({ tokenAddress }: TokenPageProps) {
  const { isConnected } = useAccount();

  // FINAL-HOOKS: Use unified token data hook that combines Firestore + contract data
  const { token, isLoading, error } = useTokenData(tokenAddress as Address);

  if (isLoading) {
    return (
      <div className="container mx-auto pt-20 p-4">
        <div className="animate-pulse space-y-6">
          <div className="h-64 bg-gray-700 rounded-lg" />
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3 space-y-6">
              <div className="h-96 bg-gray-700 rounded-lg" />
              <div className="h-48 bg-gray-700 rounded-lg" />
            </div>
            <div className="hidden lg:block h-[600px] bg-gray-700 rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !token) {
    return (
      <div className="container mx-auto pt-20 p-4">
        <div className="flex flex-col justify-center items-center h-[80vh] text-center">
          <h2 className="text-2xl font-bold text-red-500 mb-2">
            Error Loading Token
          </h2>
          <p className="text-gray-400">
            {error ||
              "The token could not be found. Please check the address and try again."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <TradesProvider>
      <div className="container mx-auto pt-20 p-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content Area (3 columns on desktop) */}
          <div className="lg:col-span-3 space-y-6">
            {/* <DebugTokenLoading tokenAddress={tokenAddress} /> */}
            <TokenHeader address={token.address} />
            <TokenPriceCharts address={token.address} />
            <TokenTradeCard
              address={tokenAddress}
              tokenData={token}
              isConnected={isConnected}
            />
          </div>

          {/* Right Sidebar (1 column on desktop) */}
          <div className="hidden lg:flex lg:flex-col gap-6">
            <div className="sticky top-24 space-y-6 h-fit">
              <div className="h-[500px]">
                <ChatComponent
                  tokenAddress={token.address}
                  creatorAddress={token.creator}
                />
              </div>
              <RecentTrades tokenAddress={token.address} />
            </div>
          </div>
        </div>

        {/* Mobile Chat Modal - Only shows on mobile */}
        <div className="lg:hidden">
          <MobileChatModal
            tokenAddress={token.address}
            creatorAddress={token.creator}
          />
        </div>
      </div>
    </TradesProvider>
  );
}
