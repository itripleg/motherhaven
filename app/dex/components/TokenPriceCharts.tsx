"use client";
import React from "react";
import { useToken } from "@/contexts/TokenContext";
import { useTokenTrades } from "@/new-hooks/useTokenTrades";
import { Address } from "viem";
import { ChartSwitcher } from "./charts/ChartSwitcher";

interface TokenPriceChartsProps {
  address: string;
}

export function TokenPriceCharts({ address }: TokenPriceChartsProps) {
  // Get token metadata and trade history
  const { token, loading: tokenLoading, error: tokenError } = useToken(address);
  const {
    trades,
    loading: tradesLoading,
    error: tradesError,
  } = useTokenTrades(address as Address);

  const loading = tokenLoading || tradesLoading;
  const error = tokenError || tradesError;

  if (error) {
    return (
      <div className="p-6 text-center">
        <div className="text-red-500 mb-2">Error loading chart data</div>
        <div className="text-sm text-muted-foreground">{error}</div>
      </div>
    );
  }

  if (loading && !token) {
    return (
      <div className="p-6 text-center">
        <div className="text-muted-foreground">Loading chart data...</div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="p-6 text-center">
        <div className="text-muted-foreground">No token data available</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Chart Switcher */}
      <ChartSwitcher trades={trades} token={token} loading={loading} />

      {/* Additional charts or analytics can go here */}
      {/* For example, volume charts, market depth, etc. */}
    </div>
  );
}
