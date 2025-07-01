// app/debug/trade/page.tsx

"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { RefreshCw, Calculator, ArrowRightLeft, BarChart3 } from "lucide-react";
import { isAddress } from "viem";
import { useAccount } from "wagmi";
import { useToken } from "@/contexts/TokenContext";

// Import streamlined components
import { StreamlinedStatusCard } from "./components/StreamlinedStatusCard";
import { StreamlinedTradingComponent } from "./components/StreamlinedTradingComponent";
import { StreamlinedChartComponent } from "./components/StreamlinedChartComponent";
import { DebugPriceComparison } from "./components/DebugPriceComparison";

export default function DebugTradePage() {
  const [mounted, setMounted] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const searchParams = useSearchParams();
  const testToken = searchParams.get("token") || "";
  const isValidToken = testToken && isAddress(testToken);
  const { address: userAddress, isConnected } = useAccount();

  // Token data
  const {
    token: tokenData,
    loading: tokenLoading,
    error: tokenError,
  } = useToken(testToken);
  const tokenExists = !!(isValidToken && tokenData && !tokenError);

  useEffect(() => {
    setMounted(true);
  }, []);

  const forceRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  if (!mounted) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <Calculator className="h-12 w-12 mx-auto text-muted-foreground animate-pulse mb-4" />
          <p className="text-muted-foreground">Loading trade debugger...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Calculator className="h-8 w-8 text-green-500" />
            Trade Debug & Testing
          </h1>
          <p className="text-muted-foreground mt-2">
            Streamlined interface for testing trade calculations and
            functionality
          </p>
        </div>

        <Button onClick={forceRefresh} variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh All
        </Button>
      </div>

      {/* Status Overview - Now streamlined */}
      <StreamlinedStatusCard
        tokenAddress={testToken}
        tokenData={tokenData}
        userAddress={userAddress}
        isConnected={isConnected}
        tokenExists={tokenExists}
        refreshKey={refreshKey}
      />

      {/* Main Content - Two Column Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Left Column: Trading Interface */}
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5 text-purple-500" />
            <h2 className="text-xl font-bold">Live Trading & Calculations</h2>
          </div>

          <StreamlinedTradingComponent
            token={testToken}
            tokenExists={tokenExists}
            userAddress={userAddress}
            isConnected={isConnected}
            refreshKey={refreshKey}
          />
        </div>

        {/* Right Column: Chart & Data */}
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-orange-500" />
            <h2 className="text-xl font-bold">Price Chart & Trade History</h2>
          </div>

          <StreamlinedChartComponent
            token={tokenData}
            tokenExists={tokenExists}
            refreshKey={refreshKey}
          />
        </div>
      </div>

      {/* Debug Price Comparison - Full Width */}
      <div className="space-y-6">
        <Separator />
        <div className="flex items-center gap-2">
          <Calculator className="h-5 w-5 text-red-500" />
          <h2 className="text-xl font-bold">Debug: Price Source Analysis</h2>
        </div>

        <DebugPriceComparison
          token={testToken}
          tokenExists={tokenExists}
          refreshKey={refreshKey}
        />
      </div>
    </div>
  );
}
