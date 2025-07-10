// app/dex/components/TokenPriceCharts.tsx
"use client";
import React from "react";
import { Card } from "@/components/ui/card";
import RechartsLineChart from "./RechartsLineChart";
// FINAL-HOOKS: Updated to use consolidated final-hooks
import { useTokenData } from "@/final-hooks/useTokenData";
import { useTrades } from "@/final-hooks/useTrades";
import { Address } from "viem";

interface TokenPriceChartsProps {
  address: string;
}

export function TokenPriceCharts({ address }: TokenPriceChartsProps) {
  // FINAL-HOOKS: Use unified token data hook that combines Firestore + contract data
  const {
    token,
    isLoading: tokenLoading,
    error: tokenError,
  } = useTokenData(address as Address);

  // FINAL-HOOKS: Use consolidated trades hook with enhanced analytics
  const {
    trades,
    loading: tradesLoading,
    error: tradesError,
  } = useTrades(address as Address);

  const loading = tokenLoading || tradesLoading;
  const error = tokenError || tradesError;

  if (error) {
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

  // FINAL-HOOKS: Component is now much simpler - let the chart handle its own analytics
  return (
    <div className="grid gap-4 md:grid-cols-1 ">
      {/* Chart with built-in analytics */}{" "}
      {/* Let chart control its own height */}
      <RechartsLineChart trades={trades} loading={loading} token={token} />
      {/* Optional: Add TradingView chart if available */}
      {/* 
      <Card className="h-[400px] p-6">
        <TVChart 
          trades={trades}
          token={token}
          analytics={analytics}
        />
      </Card>
      */}
    </div>
  );
}
