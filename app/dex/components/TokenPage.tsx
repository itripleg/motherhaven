import React from "react";
import { TokenHeader } from "./TokenHeader";
import { TokenPriceCharts } from "./TokenPriceCharts";
import { TokenTradeCard } from "./TokenTradeCard";
import { ChatComponent } from "./ChatComponent";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import { TokenData } from "@/types";
import { ConnectButton } from "@/components/ConnectButton";
import { useDisconnect } from "wagmi";
import BondingCurve from "@/components/bonding-curve";

interface TokenPageProps {
  tokenData: TokenData | null;
  price: number;
  tokenState: number;
  isConnected: boolean;
  loading: boolean;
  address?: string;
}

export default function TokenPage({
  tokenData,
  price,
  tokenState,
  isConnected,
  loading,
  address,
}: TokenPageProps) {
  const { disconnect } = useDisconnect();

  const UserSection = () => (
    <div className="flex items-center w-full gap-2 justify-between z-40">
      <span className="text-sm text-muted-foreground">
        Logged in as{" "}
        {isConnected
          ? `${address?.slice(0, 6)}...${address?.slice(-4)}`
          : "Guest"}
      </span>
      {isConnected ? (
        <Button size="sm" onClick={() => disconnect()}>
          Disconnect
        </Button>
      ) : (
        <ConnectButton />
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="container mx-auto pt-20 p-4">
        <UserSection />
        <div className="flex justify-center items-center h-[80vh]">
          <div className="animate-pulse">Loading token details...</div>
        </div>
      </div>
    );
  }

  if (!tokenData) {
    return (
      <div className="container mx-auto pt-20 p-4">
        <UserSection />
        <div className="flex justify-center items-center h-[80vh]">
          Token or Pair Not Found. We can&apos;t seem to find the token
          you&apos;re looking for.
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto pt-20 p-4">
      <div className="flex justify-between items-center mb-4">
        <UserSection />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content Area (3 columns on desktop) */}
        <div className="lg:col-span-3 space-y-6">
          {/* Charts Section */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 ">
            <div className="xl:col-span-2">
              <TokenHeader
                tokenData={tokenData}
                price={price}
                tokenState={tokenState}
              />
            </div>
            <div className="xl:col-span-2">
              <TokenPriceCharts tokenData={tokenData} price={price} />
            </div>
          </div>

          {/* Trade Card Section */}
          <div className="w-full">
            <TokenTradeCard tokenData={tokenData} isConnected={isConnected} />
          </div>
        </div>

        {/* Right Sidebar (1 column on desktop) */}
        <div className="hidden lg:flex lg:flex-col gap-6">
          <div className="sticky top-24 space-y-6">
            <ChatComponent
              tokenAddress={tokenData.address}
              creatorAddress={tokenData.creator}
            />
            <BondingCurve />
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
            {/* <div className="h-full space-y-6"> */}
            <ChatComponent tokenAddress={tokenData.address} />
            <BondingCurve />
            {/* </div> */}
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
