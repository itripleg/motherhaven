"use client";
import React from "react";
import { Card } from "@/components/ui/card";
import RechartsLineChart from "./charts/RechartsLineChart";
import { useToken } from "@/contexts/TokenContext";
import { useTokenTrades } from "@/new-hooks/useTokenTrades";
import { Address } from "viem";
import { TVChart } from "./charts/TVChart"; // Assuming you have this component for the TradingView chart

interface TokenPriceChartsProps {
  address: string;
}

/**
 * A container component responsible for fetching all data related to a token's
 * price history and passing it to the appropriate chart components.
 */
export function TokenPriceCharts({ address }: TokenPriceChartsProps) {
  // 1. Fetch static token metadata (name, symbol, initialPrice, etc.)
  // This hook gets a fully hydrated token object.
  const {
    token,
    loading: tokenLoading,
    error: tokenError,
  } = useToken(address as Address);

  // 2. Fetch the real-time and historical list of trades.
  const {
    trades,
    loading: tradesLoading,
    error: tradesError,
  } = useTokenTrades(address as Address);

  // Combine loading and error states from both hooks for a unified display
  const isLoading = tokenLoading || tradesLoading;
  const error = tokenError || tradesError;

  // Render loading state while data is being fetched.
  if (isLoading) {
    return (
      <Card className="h-[400px] p-6 flex justify-center items-center">
        <p className="text-muted-foreground animate-pulse">
          Loading Chart Data...
        </p>
      </Card>
    );
  }

  // Render an error state if either hook fails.
  if (error) {
    return (
      <Card className="h-[400px] p-6 flex justify-center items-center">
        <p className="text-red-500">Error: {error}</p>
      </Card>
    );
  }

  // Render a "not found" state if loading is complete but no token data exists.
  if (!token) {
    return (
      <Card className="h-[400px] p-6 flex justify-center items-center">
        <p className="text-muted-foreground">Token data not available.</p>
      </Card>
    );
  }

  // 3. Pass the clean, processed data to the child chart components.
  return (
    <div className="grid gap-4 md:grid-cols-1">
      {/* This is where you would place your TradingView Chart component.
        It can also consume the `trades` array.
        <Card className="p-6">
          <TVChart trades={trades} />
        </Card>
      */}
      <Card className="h-[400px] p-6">
        <RechartsLineChart
          trades={trades}
          loading={isLoading}
          token={token} // Pass the entire token object down
        />
      </Card>
    </div>
  );
}
