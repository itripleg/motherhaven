"use client";
import React from "react";
import { Card } from "@/components/ui/card";
import TokenPriceChart from "./charts/RechartsBarChart";
import RechartsLineChart from "./charts/RechartsLineChart";
import { useToken } from "@/contexts/TokenContext";
import { useTrades } from "@/contexts/TradesContext";

interface TokenPriceChartsProps {
  address: string;
}

export function TokenPriceCharts({ address }: TokenPriceChartsProps) {
  const { token, loading: tokenLoading, error: tokenError } = useToken(address);
  const {
    trades,
    loading: tradesLoading,
    error: tradesError,
  } = useTrades(address);

  // Combine loading states
  const loading = tokenLoading || tradesLoading;
  const error = tokenError || tradesError;

  console.log("Received token into TokenPriceCharts:", token);

  if (error) {
    return (
      <div className="text-red-500 text-center p-4">
        Error loading data: {error}
      </div>
    );
  }

  if (!token) {
    return (
      <div className="text-muted-foreground text-center p-4">
        Loading token data...
      </div>
    );
  }

  const currentPrice = token.stats?.currentPrice || "0";

  return (
    <div className="grid gap-4 md:grid-cols-1">
      <Card className="h-[400px] p-6">
        <TokenPriceChart
          trades={trades}
          loading={loading}
          currentPrice={currentPrice}
          tokenSymbol={token.symbol}
        />
      </Card>
      <Card className="h-[400px] p-6">
        <RechartsLineChart
          trades={trades}
          loading={loading}
          currentPrice={currentPrice}
          tokenSymbol={token.symbol}
          tokenAddress={address}
        />
      </Card>
    </div>
  );
}
