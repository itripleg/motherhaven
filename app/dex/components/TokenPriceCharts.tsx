"use client";
import React from "react";
import { Card } from "@/components/ui/card";
import TokenPriceChart from "./charts/RechartsBarChart";
import RechartsLineChart from "./charts/RechartsLineChart";
import { useToken } from "@/contexts/TokenContext";
import { useTokenContractState } from "@/contexts/TokenContext";
import { useTokenTrades } from "@/new-hooks/useTokenTrades";
import { Address } from "viem";
import { SimplePriceChart } from "./charts/SimplePriceChart";
import { TVChart } from "./charts/TVChart";

interface TokenPriceChartsProps {
  address: string;
}

export function TokenPriceCharts({ address }: TokenPriceChartsProps) {
  const { token, loading: tokenLoading, error: tokenError } = useToken(address);
  const { currentPrice } = useTokenContractState(address as Address);
  const {
    trades,
    loading: tradesLoading,
    error: tradesError,
  } = useTokenTrades(address as Address);

  // Combine loading states
  const loading = tokenLoading || tradesLoading;
  const error = tokenError || tradesError;

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

  return (
    <div className="grid gap-4 md:grid-cols-1">
      <Card className="p-6 hidden">
        {/* <SimplePriceChart trades={trades} /> */}
        <TVChart trades={trades} />
        {/* <TokenPriceChart
          trades={trades}
          loading={loading}
          currentPrice={currentPrice}
          tokenSymbol={token.symbol}
        /> */}
      </Card>
      <Card className="h-[400px] p-6">
        <RechartsLineChart
          // @ts-expect-error some type error
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
