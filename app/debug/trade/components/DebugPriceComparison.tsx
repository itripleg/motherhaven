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

// FINAL-HOOKS: Updated imports to use consolidated final-hooks
import { useFactoryContract } from "@/final-hooks/useFactoryContract";
import { useUnifiedTokenPrice } from "@/final-hooks/useUnifiedTokenPrice";
import { useTrades } from "@/final-hooks/useTrades";
import { useTokenData } from "@/final-hooks/useTokenData";

// Keep legacy imports for comparison
// import { useToken } from "@/contexts/TokenContext";
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

  // FINAL-HOOKS: Use consolidated hooks
  const { usePrice, formatValue } = useFactoryContract();
  const unifiedPrice = useUnifiedTokenPrice(tokenAddress);
  const { trades } = useTrades(tokenAddress);
  const { token: finalHooksTokenData } = useTokenData(tokenAddress);

  // Legacy hooks for comparison
  // const { token: tokenContextData } = useToken(token);
  const { price: realtimePrice } = useRealtimeTokenPrice(tokenAddress);
  const tokenStats = useTokenStats({ tokenAddress: token });

  // FINAL-HOOKS: Get current price from factory contract
  const { price: factoryCurrentPrice, priceFormatted } = usePrice(tokenAddress);

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
    buyTokensResult && testBuyAmount && typeof buyTokensResult === "bigint"
      ? Number(testBuyAmount) / Number(formatEther(buyTokensResult))
      : null;

  const sellEffectivePrice =
    sellAvaxResult && testSellAmount && typeof sellAvaxResult === "bigint"
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

  // UPDATED: Collect price data with final-hooks emphasis
  const priceData = [
    // FINAL-HOOKS (Primary/Recommended)
    {
      source: "useFactoryContract (final-hooks)",
      hook: "usePrice",
      raw: factoryCurrentPrice ? formatEther(factoryCurrentPrice) : null,
      formatted: priceFormatted || "Loading...",
      status: factoryCurrentPrice ? "success" : "loading",
      description: "✅ Direct contract read with formatting",
      category: "final-hooks",
      recommended: true,
    },
    {
      source: "useUnifiedTokenPrice (final-hooks)",
      hook: "useUnifiedTokenPrice",
      raw: unifiedPrice.raw,
      formatted: unifiedPrice.formatted,
      status: unifiedPrice.error
        ? "error"
        : unifiedPrice.isLoading
        ? "loading"
        : "success",
      description: "✅ Single source of truth for price display",
      category: "final-hooks",
      recommended: true,
    },
    {
      source: "useTokenData (final-hooks)",
      hook: "useTokenData",
      raw: finalHooksTokenData?.lastPrice,
      formatted: finalHooksTokenData?.lastPrice
        ? `${finalHooksTokenData.lastPrice} AVAX`
        : "Loading...",
      status: finalHooksTokenData ? "success" : "loading",
      description: "✅ Combined Firestore + contract data",
      category: "final-hooks",
      recommended: true,
    },

    // LEGACY (For comparison)
    {
      source: "useRealtimeTokenPrice (legacy)",
      hook: "useRealtimeTokenPrice",
      raw: realtimePrice.raw,
      formatted: realtimePrice.formatted,
      status: realtimePrice.raw ? "success" : "loading",
      description: "⚠️ Legacy - should migrate to final-hooks",
      category: "legacy",
      recommended: false,
    },
    {
      source: "useTokenStats (legacy)",
      hook: "useTokenStats",
      raw: tokenStats.currentPrice,
      formatted: formatTokenPrice(tokenStats.currentPrice),
      status: tokenStats.error
        ? "error"
        : tokenStats.loading
        ? "loading"
        : "success",
      description: "⚠️ Legacy - mixed contract + Firestore",
      category: "legacy",
      recommended: false,
    },
    {
      source: "useToken Context (legacy)",
      hook: "useToken",
      raw: null, // FIXED: Remove tokenContextData?.currentPrice - no longer exists
      formatted: "N/A", // Token context no longer provides prices
      status: "deprecated",
      description: "⚠️ Legacy - context no longer provides currentPrice",
      category: "legacy",
      recommended: false,
    },
    {
      source: "Latest Trade Price",
      hook: "useTrades",
      raw: chartPrice?.toString(),
      formatted: chartPrice
        ? formatTokenPrice(chartPrice.toString())
        : "No trades",
      status: trades.length > 0 ? "success" : "warning",
      description: "Last trade effective price from final-hooks",
      category: "final-hooks",
      recommended: false, // Not for general price display
    },
  ];

  // Check for consistency among recommended sources
  const recommendedPrices = priceData
    .filter((p) => p.recommended && p.raw && p.status === "success")
    .map((p) => Number(p.raw));

  const avgPrice =
    recommendedPrices.length > 0
      ? recommendedPrices.reduce((a, b) => a + b, 0) / recommendedPrices.length
      : 0;

  const maxDeviation =
    recommendedPrices.length > 0
      ? Math.max(
          ...recommendedPrices.map((p) => Math.abs(p - avgPrice) / avgPrice)
        ) * 100
      : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5 text-orange-500" />
          Price Source Comparison: Final-Hooks vs Legacy
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-green-600">
              final-hooks ✓
            </Badge>
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
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Final-Hooks vs Legacy Split View */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Final-Hooks Sources */}
          <div className="space-y-4">
            <h4 className="font-medium text-green-700 dark:text-green-400 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Final-Hooks (Recommended)
            </h4>
            <div className="space-y-3">
              {priceData
                .filter((p) => p.category === "final-hooks")
                .map((price, i) => (
                  <div
                    key={i}
                    className="p-3 bg-green-50 dark:bg-green-950/20 rounded border border-green-200 dark:border-green-800"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            price.status === "error"
                              ? "destructive"
                              : price.status === "loading"
                              ? "secondary"
                              : "default"
                          }
                          className="text-xs"
                        >
                          {price.status === "success" ? (
                            <CheckCircle className="h-3 w-3" />
                          ) : price.status === "error" ? (
                            <AlertTriangle className="h-3 w-3" />
                          ) : (
                            <RefreshCw className="h-3 w-3 animate-spin" />
                          )}
                        </Badge>
                        {price.recommended && (
                          <Badge
                            variant="default"
                            className="text-xs bg-green-600"
                          >
                            Primary
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="font-medium text-sm">{price.source}</div>
                      <div className="text-xs text-muted-foreground">
                        {price.description}
                      </div>
                      <div className="font-mono font-bold text-green-700 dark:text-green-400">
                        {price.formatted}
                      </div>
                      <div className="text-xs font-mono text-muted-foreground">
                        Raw: {price.raw || "N/A"}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Legacy Sources */}
          <div className="space-y-4">
            <h4 className="font-medium text-orange-700 dark:text-orange-400 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Legacy (For Comparison)
            </h4>
            <div className="space-y-3">
              {priceData
                .filter((p) => p.category === "legacy")
                .map((price, i) => (
                  <div
                    key={i}
                    className="p-3 bg-orange-50 dark:bg-orange-950/20 rounded border border-orange-200 dark:border-orange-800"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Badge
                        variant={
                          price.status === "error"
                            ? "destructive"
                            : price.status === "loading"
                            ? "secondary"
                            : "outline"
                        }
                        className="text-xs"
                      >
                        {price.status === "success" ? (
                          <CheckCircle className="h-3 w-3" />
                        ) : price.status === "error" ? (
                          <AlertTriangle className="h-3 w-3" />
                        ) : (
                          <RefreshCw className="h-3 w-3 animate-spin" />
                        )}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <div className="font-medium text-sm">{price.source}</div>
                      <div className="text-xs text-muted-foreground">
                        {price.description}
                      </div>
                      <div className="font-mono font-bold text-orange-700 dark:text-orange-400">
                        {price.formatted}
                      </div>
                      <div className="text-xs font-mono text-muted-foreground">
                        Raw: {price.raw || "N/A"}
                      </div>
                      {price.raw && avgPrice > 0 && (
                        <div className="text-xs">
                          Δ vs avg:{" "}
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
                      {buyTokensResult && typeof buyTokensResult === "bigint"
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
                    <span>vs Final-hooks price:</span>
                    <span className="font-mono">
                      {buyEffectivePrice &&
                      factoryCurrentPrice &&
                      typeof factoryCurrentPrice === "bigint"
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
                      {sellAvaxResult && typeof sellAvaxResult === "bigint"
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
                    <span>vs Final-hooks price:</span>
                    <span className="font-mono">
                      {sellEffectivePrice &&
                      factoryCurrentPrice &&
                      typeof factoryCurrentPrice === "bigint"
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

        {/* Migration Summary */}
        <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded border border-green-200 dark:border-green-800">
          <h5 className="font-medium text-green-800 dark:text-green-400 mb-2">
            ✅ Final-Hooks Migration Benefits:
          </h5>
          <div className="text-sm text-green-700 dark:text-green-300 space-y-1">
            <div>
              • Consistent price across{" "}
              {
                priceData.filter(
                  (p) => p.category === "final-hooks" && p.recommended
                ).length
              }{" "}
              primary sources
            </div>
            <div>
              • Variance among recommended sources: {maxDeviation.toFixed(2)}%
            </div>
            <div>
              • Average final-hooks price:{" "}
              {avgPrice > 0 ? formatTokenPrice(avgPrice.toString()) : "N/A"}{" "}
              AVAX
            </div>
            <div>• Consolidated imports and reduced complexity</div>
            <div>• Single source of truth with useUnifiedTokenPrice</div>
            {maxDeviation > 1 && (
              <div className="font-medium text-red-600">
                ⚠️ High variance detected - check hook implementation
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
