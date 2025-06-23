"use client";
import React from "react";
import { Card } from "@/components/ui/card";
import RechartsLineChart from "./charts/RechartsLineChart";
import { useToken } from "@/contexts/TokenContext";
<<<<<<< HEAD
import { useTokenTrades } from "@/new-hooks/useTokenTrades";
import { Address } from "viem";
import { TVChart } from "./charts/TVChart"; // Assuming you have this component for the TradingView chart
=======
// We no longer need useTokenContractState for the price here
import { useTokenTrades } from "@/new-hooks/useTokenTrades";
import { Address } from "viem";
import { TVChart } from "./charts/TVChart";
>>>>>>> main

interface TokenPriceChartsProps {
  address: string;
}

/**
 * A container component responsible for fetching all data related to a token's
 * price history and passing it to the appropriate chart components.
 */
export function TokenPriceCharts({ address }: TokenPriceChartsProps) {
<<<<<<< HEAD
  // 1. Fetch static token metadata (name, symbol, initialPrice, etc.)
  // This hook gets a fully hydrated token object.
  const {
    token,
    loading: tokenLoading,
    error: tokenError,
  } = useToken(address as Address);

  // 2. Fetch the real-time and historical list of trades.
=======
  // We only need token metadata and the trade history
  const { token, loading: tokenLoading, error: tokenError } = useToken(address);
>>>>>>> main
  const {
    trades,
    loading: tradesLoading,
    error: tradesError,
  } = useTokenTrades(address as Address);

<<<<<<< HEAD
  // Combine loading and error states from both hooks for a unified display
  const isLoading = tokenLoading || tradesLoading;
=======
  const loading = tokenLoading || tradesLoading;
>>>>>>> main
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
<<<<<<< HEAD
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
=======
    return <div className="text-red-500 text-center p-4">Error: {error}</div>;
  }

  if (loading && !token) {
    return (
      <div className="text-muted-foreground text-center p-4">
        Loading Chart Data...
      </div>
    );
  }

  if (!token) {
    return null;
  }

  // The component is now much simpler. It just passes the trades down.
  return (
    <div className="grid gap-4 md:grid-cols-1">
      {/* ... other charts ... */}
      <Card className="h-[400px] p-6">
        <RechartsLineChart
          trades={trades}
          loading={loading}
          token={token} // Pass the entire token object
>>>>>>> main
        />
      </Card>
    </div>
  );
}
