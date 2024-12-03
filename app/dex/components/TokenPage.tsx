// components/TokenPage.tsx
import React from "react";
import { TokenHeader } from "./TokenHeader";
import { TokenPriceCharts } from "./TokenPriceCharts";
import { TokenTradeCard } from "./TokenTradeCard";
import { ChatComponent } from "./ChatComponent";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import { TokenData } from "@/types";
import { useDisconnect } from "wagmi";
import BondingCurve from "@/components/bonding-curve";
import RecentTrades from "./RecentTrades";
import { useTokenContext } from "@/contexts/TokenContext";

interface TokenPageProps {
  tokenData: TokenData | null; // Made nullable
  isConnected: boolean;
  loading: boolean;
  address: string;
}

export function TokenPage({
  tokenData,
  isConnected,
  loading,
  address,
}: TokenPageProps) {
  const { disconnect } = useDisconnect();
  const { contractState, metrics } = useTokenContext();

  if (loading || !tokenData) {
    return (
      <div className="container mx-auto pt-20 p-4">
        <div className="flex justify-center items-center h-[80vh]">
          {loading ? "Loading token information..." : "Token not found"}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto pt-20 p-4">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content Area */}
        <div className="lg:col-span-3 space-y-6">
          {/* Token Info and Charts Section */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="xl:col-span-2">
              <TokenHeader tokenData={tokenData} />
            </div>
            <div className="xl:col-span-2">
              <TokenPriceCharts
                tokenData={tokenData}
                price={Number(contractState.currentPrice)}
              />
            </div>
          </div>

          {/* Trading Section */}
          <div className="w-full">
            <TokenTradeCard tokenData={tokenData} isConnected={isConnected} />
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="hidden lg:flex lg:flex-col gap-6">
          <div className="sticky top-24 space-y-6">
            <ChatComponent
              tokenAddress={tokenData.address}
              creatorAddress={tokenData.creator}
            />
            <RecentTrades tokenAddress={address} />
          </div>
        </div>

        {/* Mobile Chat Sheet */}
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
            <ChatComponent
              tokenAddress={tokenData.address}
              creatorAddress={tokenData.creator}
            />
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
