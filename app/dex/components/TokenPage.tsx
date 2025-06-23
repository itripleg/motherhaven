"use client";
import React from "react";
import { TokenHeader } from "./TokenHeader";
import { TokenPriceCharts } from "./TokenPriceCharts";
import { TokenTradeCard } from "./TokenTradeCard";
import { ChatComponent } from "./ChatComponent";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import { ConnectButton } from "@/components/ConnectButton";
import { useDisconnect } from "wagmi";
import RecentTrades from "./RecentTrades";
import { useToken } from "@/contexts/TokenContext";
import { TradesProvider } from "@/contexts/TradesContext";

interface TokenPageProps {
  tokenAddress: string;
}

export default function TokenPage({ tokenAddress }: TokenPageProps) {
  const { token, loading, error } = useToken(tokenAddress);
  const { disconnect } = useDisconnect();

  console.log("TokenPage render:", {
    tokenAddress,
    hasToken: !!token,
    loading,
    error,
    tokenData: token,
  });

  if (loading) {
    console.log("TokenPage: Showing loading skeleton");
    return (
      <div className="container mx-auto pt-20 p-4">
        <div className="animate-pulse space-y-6">
          <div className="h-64 bg-gray-200/20 rounded-lg" />
          <div className="h-96 bg-gray-200/20 rounded-lg" />
        </div>
        <div className="text-center mt-4 text-gray-500">
          Loading token data... (Address: {tokenAddress})
        </div>
      </div>
    );
  }

  if (error || !token) {
    console.log("TokenPage: Showing error state", { error, hasToken: !!token });
    return (
      <div className="container mx-auto pt-20 p-4">
        <div className="flex justify-center items-center h-[80vh] text-red-500">
          {error ||
            "Token not found. We can't seem to find the token you're looking for."}
        </div>
      </div>
    );
  }

  console.log("TokenPage: Rendering main content");

  return (
    <div className="container mx-auto pt-20 p-4">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content Area (3 columns on desktop) */}
        <div className="lg:col-span-3 space-y-6">
          {/* Charts Section */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="xl:col-span-2">
              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <h3 className="text-blue-500">DEBUG: Token Header Loading</h3>
                <pre className="text-xs mt-2">
                  {JSON.stringify(
                    {
                      address: token.address,
                      name: token.name,
                      symbol: token.symbol,
                    },
                    null,
                    2
                  )}
                </pre>
              </div>
              <TokenHeader address={token.address} />
            </div>
            <div className="xl:col-span-2">
              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg mb-4">
                <h3 className="text-green-500">DEBUG: Charts Loading</h3>
              </div>
              <TradesProvider>
                <TokenPriceCharts address={token.address} />
              </TradesProvider>
            </div>
          </div>

          {/* Trade Card Section */}
          <div className="w-full">
            <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg mb-4">
              <h3 className="text-purple-500">DEBUG: Trade Card Loading</h3>
            </div>
            <TokenTradeCard
              address={tokenAddress}
              // @ts-expect-error temporary so we can build
              tokenData={token}
              isConnected={false}
            />
          </div>
        </div>

        {/* Right Sidebar (1 column on desktop) */}
        <div className="hidden lg:flex lg:flex-col gap-6">
          <div className="sticky top-24 space-y-6">
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <h3 className="text-yellow-500">DEBUG: Chat Loading</h3>
            </div>
            <ChatComponent
              tokenAddress={token.address}
              creatorAddress={token.creator}
            />
            <div className="p-4 bg-pink-500/10 border border-pink-500/20 rounded-lg">
              <h3 className="text-pink-500">DEBUG: Recent Trades Loading</h3>
            </div>
            <RecentTrades tokenAddress={token.address} />
          </div>
        </div>

        {/* Mobile Chat Button */}
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="default"
              size="icon"
              className="fixed bottom-4 right-4 lg:hidden z-40"
            >
              <MessageCircle className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[90%] sm:w-[440px]">
            {/* <ChatComponent 
              tokenAddress={token.address}
              creatorAddress={token.creator}
            /> */}
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
