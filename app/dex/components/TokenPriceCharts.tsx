"use client";
import React from "react";
import { Card } from "@/components/ui/card";
import RechartsLineChart from "./charts/RechartsLineChart";
// FINAL-HOOKS: Updated to use consolidated final-hooks
import { useTokenData } from "@/final-hooks/useTokenData";
import { useTrades } from "@/final-hooks/useTrades";
import { Address } from "viem";
import { TVChart } from "./charts/TVChart";

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
    analytics,
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

  // FINAL-HOOKS: Component is now even simpler with enhanced data
  return (
    <div className="grid gap-4 md:grid-cols-1">
      {/* Enhanced chart with final-hooks data and analytics */}
      <Card className="h-[400px] p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Price Chart</h3>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>Trades: {analytics.tradeCount}</span>
            <span>Volume: {analytics.totalVolume} AVAX</span>
            <span>
              Buy Pressure: {(analytics.buyPressure * 100).toFixed(1)}%
            </span>
          </div>
        </div>
        <RechartsLineChart
          trades={trades}
          loading={loading}
          token={token} // Pass the entire token object with real-time data
        />
      </Card>

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
