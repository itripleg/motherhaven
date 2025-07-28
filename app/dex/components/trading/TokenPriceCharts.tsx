// app/dex/components/TokenPriceCharts.tsx
"use client";
import React from "react";
import { useTokenData } from "@/final-hooks/useTokenData";
import { useTrades } from "@/final-hooks/useTrades";
import { Address } from "viem";
import { TokenChart } from "./chart/TokenChart";

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

  return (
    <div className="grid gap-4 md:grid-cols-1 ">
      <TokenChart token={token} />
    </div>
  );
}
