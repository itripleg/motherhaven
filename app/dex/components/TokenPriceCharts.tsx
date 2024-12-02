"use client";
import React from "react";
import { Card } from "@/components/ui/card";
import TokenPriceChart from "./charts/RechartsBarChart";
import RechartsLineChart from "./charts/RechartsLineChart";
import { TokenData } from "@/types";
import { useTokenTrades } from "@/hooks/token/useTokenTrades";

interface TokenPriceChartsProps {
  tokenData: TokenData;
  price: number;
}

export function TokenPriceCharts({ tokenData, price }: TokenPriceChartsProps) {
  const { trades, loading, error } = useTokenTrades(tokenData.address);

  if (error) {
    return (
      <div className="text-red-500 text-center p-4">
        Error loading trade data: {error}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-1">
      <Card className="h-[400px] p-6">
        <TokenPriceChart
          trades={trades}
          loading={loading}
          currentPrice={String(price)}
          tokenSymbol={tokenData.symbol}
        />
      </Card>
      <Card className="h-[400px] p-6">
        <RechartsLineChart
          trades={trades}
          loading={loading}
          currentPrice={String(price)}
          tokenSymbol={tokenData.symbol}
        />
      </Card>
    </div>
  );
}
