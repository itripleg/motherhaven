// app/debug/trade/components/DebugPriceComparison.tsx

"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Calculator,
  TrendingUp,
  TrendingDown,
  Eye,
} from "lucide-react";
import { parseEther, formatEther, Address } from "viem";
import { useReadContract } from "wagmi";
import { useFactoryContract } from "@/new-hooks/useFactoryContract";
import { useToken } from "@/contexts/TokenContext";
import { useTokenTrades } from "@/new-hooks/useTokenTrades";
import { useUnifiedTokenPrice } from "@/hooks/token/useUnifiedTokenPrice";
import { useRealtimeTokenPrice } from "@/hooks/token/useRealtimeTokenPrices";
import { useTokenStats } from "@/hooks/token/useTokenStats";
import { FACTORY_ADDRESS, FACTORY_ABI } from "@/types";
import { formatTokenPrice } from "@/utils/tokenPriceFormatter";

interface DebugPriceComparisonProps {
  token: string;
  tokenExists: boolean;
  refreshKey: number;
}

export function DebugPriceComparison({
  token,
  tokenExists,
  refreshKey,
}: DebugPriceComparisonProps) {
  const [testBuyAmount, setTestBuyAmount] = useState("1.0");
  const [testSellAmount, setTestSellAmount] = useState("1000");

  const tokenAddress = token as Address;

  // Get all our different price sources
  const { useCurrentPrice, formatValue } = useFactoryContract();
  const { token: tokenContextData } = useToken(token);
  const { trades } = useTokenTrades(tokenAddress);
  const unifiedPrice = useUnifiedTokenPrice(tokenAddress);
  const { price: realtimePrice } = useRealtimeTokenPrice(tokenAddress);
  const tokenStats = useTokenStats({ tokenAddress: token });

  // Factory contract direct reads
  const { data: factoryCurrentPrice } = useCurrentPrice(tokenAddress);

  // Test calculations
  const { data: buyTokensResult } = useReadContract({
    address: FACTORY_ADDRESS,
    abi: FACTORY_ABI,
    functionName: "calculateTokenAmount",
    args:
      tokenAddress && testBuyAmount
        ? [tokenAddress, parseEther(testBuyAmount)]
        : undefined,
    query: { enabled: Boolean(tokenAddress && testBuyAmount) },
  });

  const { data: sellAvaxResult } = useReadContract({
    address: FACTORY_ADDRESS,
    abi: FACTORY_ABI,
    functionName: "calculateSellPrice",
    args:
      tokenAddress && testSellAmount
        ? [tokenAddress, parseEther(testSellAmount)]
        : undefined,
    query: { enabled: Boolean(tokenAddress && testSellAmount) },
  });

  // Calculate derived prices
  const buyEffectivePrice =
    buyTokensResult && testBuyAmount
      ? Number(testBuyAmount) / Number(formatEther(buyTokensResult))
      : null;

  const sellEffectivePrice =
    sellAvaxResult && testSellAmount
      ? Number(formatEther(sellAvaxResult)) / Number(testSellAmount)
      : null;

  // Chart price (from latest trade)
  const chartPrice =
    trades.length > 0
      ? Number(trades[0].ethAmount) / Number(trades[0].tokenAmount)
      : null;

  if (!tokenExists) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <AlertTriangle className="h-12 w-12 mx-auto text-yellow-500 mb-4" />
          <h3 className="text-lg font-medium mb-2">Token Required</h3>
          <p className="text-muted-foreground">
            Enter a valid token address to compare price sources
          </p>
        </CardContent>
      </Card>
    );
  }

  // Collect all price data
  const priceData = [
    {
      source: "Factory Contract",
      hook: "useCurrentPrice",
      raw: factoryCurrentPrice ? formatEther(factoryCurrentPrice) : null,
      formatted: factoryCurrentPrice
        ? formatTokenPrice(formatEther(factoryCurrentPrice))
        : "Loading...",
      status: factoryCurrentPrice ? "success" : "loading",
      description: "Direct lastPrice mapping read",
    },
    {
      source: "Unified Hook",
      hook: "useUnifiedTokenPrice",
      raw: unifiedPrice.raw,
      formatted: unifiedPrice.formatted,
      status: unifiedPrice.error
        ? "error"
        : unifiedPrice.isLoading
        ? "loading"
        : "success",
      description: "Cached price with formatting",
    },
    {
      source: "Realtime Hook",
      hook: "useRealtimeTokenPrice",
      raw: realtimePrice.raw,
      formatted: realtimePrice.formatted,
      status: realtimePrice.raw ? "success" : "loading",
      description: "Event-driven price updates",
    },
    {
      source: "Token Stats",
      hook: "useTokenStats",
      raw: tokenStats.currentPrice,
      formatted: formatTokenPrice(tokenStats.currentPrice),
      status: tokenStats.error
        ? "error"
        : tokenStats.loading
        ? "loading"
        : "success",
      description: "Mixed contract + Firestore",
    },
    {
      source: "Token Context",
      hook: "useToken",
      raw: tokenContextData?.currentPrice,
      formatted: tokenContextData?.currentPrice
        ? formatTokenPrice(tokenContextData.currentPrice)
        : "N/A",
      status: tokenContextData ? "success" : "loading",
      description: "Context provider data",
    },
    {
      source: "Chart (Latest Trade)",
      hook: "useTokenTrades",
      raw: chartPrice?.toString(),
      formatted: chartPrice
        ? formatTokenPrice(chartPrice.toString())
        : "No trades",
      status: trades.length > 0 ? "success" : "warning",
      description: "Last trade effective price",
    },
  ];

  // Check for consistency
  const numericPrices = priceData
    .filter((p) => p.raw && p.status === "success")
    .map((p) => Number(p.raw));

  const avgPrice =
    numericPrices.length > 0
      ? numericPrices.reduce((a, b) => a + b, 0) / numericPrices.length
      : 0;

  const maxDeviation =
    numericPrices.length > 0
      ? Math.max(
          ...numericPrices.map((p) => Math.abs(p - avgPrice) / avgPrice)
        ) * 100
      : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5 text-orange-500" />
          Price Source Comparison & Discrepancy Analysis
          <Badge
            variant={
              maxDeviation > 1
                ? "destructive"
                : maxDeviation > 0.1
                ? "secondary"
                : "default"
            }
          >
            {maxDeviation > 1
              ? "High Variance"
              : maxDeviation > 0.1
              ? "Some Variance"
              : "Consistent"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Price Sources Comparison */}
        <div className="space-y-4">
          <h4 className="font-medium">All Price Sources:</h4>
          <div className="grid gap-3">
            {priceData.map((price, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 bg-muted rounded border"
              >
                <div className="flex items-center gap-3">
                  <Badge
                    variant={
                      price.status === "error"
                        ? "destructive"
                        : price.status === "loading"
                        ? "secondary"
                        : price.status === "warning"
                        ? "outline"
                        : "default"
                    }
                    className="w-16 justify-center"
                  >
                    {price.status === "success" ? (
                      <CheckCircle className="h-3 w-3" />
                    ) : price.status === "error" ? (
                      <AlertTriangle className="h-3 w-3" />
                    ) : price.status === "warning" ? (
                      <AlertTriangle className="h-3 w-3" />
                    ) : (
                      <RefreshCw className="h-3 w-3 animate-spin" />
                    )}
                  </Badge>
                  <div>
                    <div className="font-medium text-sm">{price.source}</div>
                    <div className="text-xs text-muted-foreground">
                      {price.description}
                    </div>
                    <div className="text-xs font-mono text-muted-foreground">
                      {price.hook}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold">{price.formatted}</div>
                  <div className="text-xs font-mono text-muted-foreground">
                    Raw: {price.raw || "N/A"}
                  </div>
                  {price.raw && avgPrice > 0 && (
                    <div className="text-xs">
                      Δ:{" "}
                      {(
                        ((Number(price.raw) - avgPrice) / avgPrice) *
                        100
                      ).toFixed(2)}
                      %
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Trading Calculations Analysis */}
        <div className="space-y-4">
          <h4 className="font-medium">Trading Calculations Analysis:</h4>

          <div className="grid md:grid-cols-2 gap-4">
            {/* Buy Test */}
            <div className="space-y-3">
              <Label htmlFor="test-buy">Test Buy Amount (AVAX)</Label>
              <Input
                id="test-buy"
                value={testBuyAmount}
                onChange={(e) => setTestBuyAmount(e.target.value)}
                type="number"
                step="0.1"
              />

              <div className="bg-green-50 dark:bg-green-950/20 p-3 rounded border">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="font-medium text-green-700 dark:text-green-400">
                    Buy Analysis
                  </span>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>AVAX spent:</span>
                    <span className="font-mono">{testBuyAmount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tokens received:</span>
                    <span className="font-mono">
                      {buyTokensResult
                        ? Number(formatEther(buyTokensResult)).toLocaleString()
                        : "Calculating..."}
                    </span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span>Effective price:</span>
                    <span className="font-mono">
                      {buyEffectivePrice
                        ? formatTokenPrice(buyEffectivePrice.toString())
                        : "..."}{" "}
                      AVAX/token
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>vs Current price:</span>
                    <span className="font-mono">
                      {buyEffectivePrice && factoryCurrentPrice
                        ? `${(
                            ((buyEffectivePrice -
                              Number(formatEther(factoryCurrentPrice))) /
                              Number(formatEther(factoryCurrentPrice))) *
                            100
                          ).toFixed(2)}%`
                        : "..."}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Sell Test */}
            <div className="space-y-3">
              <Label htmlFor="test-sell">Test Sell Amount (Tokens)</Label>
              <Input
                id="test-sell"
                value={testSellAmount}
                onChange={(e) => setTestSellAmount(e.target.value)}
                type="number"
                step="1"
              />

              <div className="bg-red-50 dark:bg-red-950/20 p-3 rounded border">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingDown className="h-4 w-4 text-red-600" />
                  <span className="font-medium text-red-700 dark:text-red-400">
                    Sell Analysis
                  </span>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Tokens sold:</span>
                    <span className="font-mono">
                      {Number(testSellAmount).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>AVAX received:</span>
                    <span className="font-mono">
                      {sellAvaxResult
                        ? Number(formatEther(sellAvaxResult)).toFixed(6)
                        : "Calculating..."}
                    </span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span>Effective price:</span>
                    <span className="font-mono">
                      {sellEffectivePrice
                        ? formatTokenPrice(sellEffectivePrice.toString())
                        : "..."}{" "}
                      AVAX/token
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>vs Current price:</span>
                    <span className="font-mono">
                      {sellEffectivePrice && factoryCurrentPrice
                        ? `${(
                            ((sellEffectivePrice -
                              Number(formatEther(factoryCurrentPrice))) /
                              Number(formatEther(factoryCurrentPrice))) *
                            100
                          ).toFixed(2)}%`
                        : "..."}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Symmetry Test */}
        <div className="space-y-4">
          <h4 className="font-medium">Buy/Sell Symmetry Test:</h4>
          <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded border">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Buy effective price:</span>
                <span className="font-mono">
                  {buyEffectivePrice ? buyEffectivePrice.toFixed(12) : "..."}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Sell effective price:</span>
                <span className="font-mono">
                  {sellEffectivePrice ? sellEffectivePrice.toFixed(12) : "..."}
                </span>
              </div>
              <div className="flex justify-between font-medium">
                <span>Price difference:</span>
                <span className="font-mono">
                  {buyEffectivePrice && sellEffectivePrice
                    ? `${(
                        ((buyEffectivePrice - sellEffectivePrice) /
                          sellEffectivePrice) *
                        100
                      ).toFixed(4)}%`
                    : "..."}
                </span>
              </div>
              <div className="text-xs text-muted-foreground pt-2">
                💡 Large differences indicate trading fees, slippage, or bonding
                curve mechanics
              </div>
            </div>
          </div>
        </div>

        {/* Summary & Recommendations */}
        <div className="bg-yellow-50 dark:bg-yellow-950/20 p-4 rounded border border-yellow-200 dark:border-yellow-800">
          <h5 className="font-medium text-yellow-800 dark:text-yellow-400 mb-2">
            🔍 Analysis Summary:
          </h5>
          <div className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
            <div>
              • Price variance across sources: {maxDeviation.toFixed(2)}%
            </div>
            <div>• Number of active price sources: {numericPrices.length}</div>
            <div>
              • Average price:{" "}
              {avgPrice > 0 ? formatTokenPrice(avgPrice.toString()) : "N/A"}{" "}
              AVAX
            </div>
            {maxDeviation > 1 && (
              <div className="font-medium text-red-600">
                ⚠️ High price variance detected - investigate hook
                inconsistencies
              </div>
            )}
            {buyEffectivePrice &&
              sellEffectivePrice &&
              Math.abs(buyEffectivePrice - sellEffectivePrice) /
                sellEffectivePrice >
                0.05 && (
                <div className="font-medium text-orange-600">
                  ⚠️ Significant buy/sell price asymmetry detected
                </div>
              )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
