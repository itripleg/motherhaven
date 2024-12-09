// components/TokenPage.tsx
import React from "react";
import { TokenHeader } from "./TokenHeader";
import { TokenPriceCharts } from "./TokenPriceCharts";
import { TokenTradeCard } from "./TokenTradeCard";
import { ChatComponent } from "./ChatComponent";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import { useDisconnect } from "wagmi";
import RecentTrades from "./RecentTrades";
import { useToken } from "@/contexts/TokenContext";

// Only include static/immutable data that won't change
interface TokenMetadata {
  address: `0x${string}`;
  name: string;
  symbol: string;
  creator: string;
  imageUrl: string;
  fundingGoal: string;
  burnManager: string;
  createdAt: string;
  blockNumber: number;
}

interface TokenPageProps {
  metadata: TokenMetadata | null;
  isConnected: boolean;
}

export function TokenPage({ metadata, isConnected }: TokenPageProps) {
  const { disconnect } = useDisconnect();
  const { price, collateral, loading, error } = useToken();

  if (loading) {
    return (
      <div className="container mx-auto pt-20 p-4">
        <div className="flex justify-center items-center h-[80vh]">
          Loading...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto pt-20 p-4">
        <div className="flex justify-center items-center h-[80vh]">
          Error: {error}
        </div>
      </div>
    );
  }

  if (!metadata) {
    return (
      <div className="container mx-auto pt-20 p-4">
        <div className="flex justify-center items-center h-[80vh]">
          Token Not Found
        </div>
      </div>
    );
  }

  // Combine metadata with real-time data
  const tokenData = {
    ...metadata,
    contractState: {
      currentPrice: price,
      collateral,
    },
  };

  return (
    <div className="container mx-auto pt-20 p-4">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="xl:col-span-2">
              <TokenHeader tokenData={tokenData} />
            </div>
            <div className="xl:col-span-2">
              <TokenPriceCharts tokenData={tokenData} price={Number(price)} />
            </div>
          </div>

          <div className="w-full">
            <TokenTradeCard tokenData={tokenData} isConnected={isConnected} />
          </div>
        </div>

        <div className="hidden lg:flex lg:flex-col gap-6">
          <div className="sticky top-24 space-y-6">
            <ChatComponent
              tokenAddress={metadata.address}
              creatorAddress={metadata.creator}
            />
            <RecentTrades tokenAddress={metadata.address} />
          </div>
        </div>

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
              tokenAddress={metadata.address}
              creatorAddress={metadata.creator}
            />
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
