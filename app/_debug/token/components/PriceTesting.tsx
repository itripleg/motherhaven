// app/debug/token/components/PriceTesting.tsx
"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Activity,
} from "lucide-react";
import { Address } from "viem";
import { useUnifiedTokenPrice } from "@/final-hooks/useUnifiedTokenPrice";
import { useFactoryContract } from "@/final-hooks/useFactoryContract";
import { useRealtimeTokenPrice } from "@/hooks/token/useRealtimeTokenPrices";

interface PriceTestingProps {
  tokenAddress: string;
  onRefresh: () => void;
}

export function PriceTesting({ tokenAddress, onRefresh }: PriceTestingProps) {
  const { usePrice, useCollateral } = useFactoryContract();

  // Get prices from different sources
  const unifiedPrice = useUnifiedTokenPrice(tokenAddress as Address);
  const {
    price: factoryPrice,
    isLoading: factoryLoading,
    error: factoryError,
  } = usePrice(tokenAddress as Address);
  const { collateral, isLoading: collateralLoading } = useCollateral(
    tokenAddress as Address
  );
  const { price: realtimePrice, isLoading: realtimeLoading } =
    useRealtimeTokenPrice(tokenAddress as Address);

  // Price comparison and variance calculation
  const priceData = [
    {
      name: "Unified Price",
      value: unifiedPrice.formatted,
      raw: unifiedPrice.raw,
      loading: unifiedPrice.isLoading,
      error: unifiedPrice.error,
      source: "final-hooks/useUnifiedTokenPrice",
      recommended: true,
    },
    {
      name: "Factory Price",
      value: factoryPrice
        ? (Number(factoryPrice.toString()) / 1e18).toFixed(6)
        : "0",
      raw: factoryPrice?.toString() || "0",
      loading: factoryLoading,
      error: factoryError?.message,
      source: "final-hooks/useFactoryContract",
      recommended: true,
    },
    {
      name: "Realtime Price",
      value: realtimePrice.formatted,
      raw: realtimePrice.raw,
      loading: realtimeLoading,
      //   @ts-expect-error type error
      error: realtimePrice.error,
      source: "hooks/token/useRealtimeTokenPrices",
      recommended: false,
    },
  ];

  // Calculate price variance
  const validPrices = priceData
    .filter((p) => !p.loading && !p.error && p.value && Number(p.value) > 0)
    .map((p) => Number(p.value));

  const priceVariance =
    validPrices.length > 1 ? calculateVariance(validPrices) : 0;

  const anyLoading = priceData.some((p) => p.loading);
  const anyError = priceData.some((p) => p.error);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-green-500" />
          Price Testing & Comparison
          <Badge
            variant={
              anyError ? "destructive" : anyLoading ? "secondary" : "default"
            }
          >
            {anyError ? "Has Errors" : anyLoading ? "Loading" : "Active"}
          </Badge>
          <Button
            onClick={onRefresh}
            variant="outline"
            size="sm"
            className="ml-auto"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Price Variance Overview */}
        <div className="p-4 bg-muted rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4" />
            <span className="font-medium">Price Consistency Analysis</span>
          </div>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Valid Sources:</span>
              <div className="font-mono">
                {validPrices.length}/{priceData.length}
              </div>
            </div>
            <div>
              <span className="text-muted-foreground">Variance:</span>
              <div className="font-mono">
                {priceVariance < 0.01 ? (
                  <span className="text-green-600">
                    {(priceVariance * 100).toFixed(2)}%
                  </span>
                ) : priceVariance < 0.05 ? (
                  <span className="text-yellow-600">
                    {(priceVariance * 100).toFixed(2)}%
                  </span>
                ) : (
                  <span className="text-red-600">
                    {(priceVariance * 100).toFixed(2)}%
                  </span>
                )}
              </div>
            </div>
            <div>
              <span className="text-muted-foreground">Status:</span>
              <div className="flex items-center gap-1">
                {priceVariance < 0.01 ? (
                  <>
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    <span className="text-green-600">Consistent</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-3 w-3 text-yellow-500" />
                    <span className="text-yellow-600">Variance</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Individual Price Sources */}
        <div className="space-y-4">
          <h4 className="font-medium">Price Sources Comparison:</h4>
          {priceData.map((price, index) => (
            <Card key={index} className="border-l-4 border-l-muted">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    <span className="font-medium">{price.name}</span>
                    {price.recommended && (
                      <Badge variant="outline" className="text-green-600">
                        Recommended
                      </Badge>
                    )}
                  </div>
                  <Badge
                    variant={
                      price.error
                        ? "destructive"
                        : price.loading
                        ? "secondary"
                        : "default"
                    }
                  >
                    {price.error
                      ? "Error"
                      : price.loading
                      ? "Loading"
                      : "Success"}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Formatted:</span>
                    <div className="font-mono font-bold">
                      {price.loading ? "..." : price.value || "0"} AVAX
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Raw:</span>
                    <div className="font-mono text-xs truncate">
                      {price.loading ? "..." : price.raw || "0"}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Loading:</span>
                    <div className="font-mono">{price.loading.toString()}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Source:</span>
                    <div className="text-xs text-muted-foreground">
                      {price.source}
                    </div>
                  </div>
                </div>

                {price.error && (
                  <div className="mt-3 p-2 bg-red-50 dark:bg-red-950/20 rounded text-sm text-red-600">
                    <strong>Error:</strong> {price.error}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Collateral Information */}
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="h-4 w-4 text-blue-500" />
              <span className="font-medium">Token Collateral</span>
              <Badge variant={collateralLoading ? "secondary" : "default"}>
                {collateralLoading ? "Loading" : "Loaded"}
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">Amount:</span>
                <div className="font-mono font-bold">
                  {collateralLoading
                    ? "..."
                    : collateral
                    ? (Number(collateral.toString()) / 1e18).toFixed(4)
                    : "0"}{" "}
                  AVAX
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Raw Wei:</span>
                <div className="font-mono text-xs">
                  {collateralLoading ? "..." : collateral?.toString() || "0"}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Price Analysis */}
        {validPrices.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium">Price Analysis:</h4>
            <div className="bg-muted p-3 rounded text-sm space-y-1">
              <div>
                Average Price:{" "}
                {(
                  validPrices.reduce((a, b) => a + b, 0) / validPrices.length
                ).toFixed(8)}{" "}
                AVAX
              </div>
              <div>
                Highest Price: {Math.max(...validPrices).toFixed(8)} AVAX
              </div>
              <div>
                Lowest Price: {Math.min(...validPrices).toFixed(8)} AVAX
              </div>
              <div>
                Price Range:{" "}
                {(Math.max(...validPrices) - Math.min(...validPrices)).toFixed(
                  8
                )}{" "}
                AVAX
              </div>
            </div>
          </div>
        )}

        {/* Recommendations */}
        <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
          <h4 className="font-medium mb-2 text-blue-700 dark:text-blue-300">
            💡 Recommendations:
          </h4>
          <ul className="text-sm space-y-1 text-blue-600 dark:text-blue-400">
            <li>
              • Use <strong>useUnifiedTokenPrice</strong> for consistent price
              display
            </li>
            <li>
              • Use <strong>useFactoryContract.usePrice</strong> for contract
              interactions
            </li>
            <li>
              • Avoid multiple price hooks in same component for performance
            </li>
            {priceVariance > 0.05 && (
              <li className="text-red-600 dark:text-red-400">
                • ⚠️ High price variance detected - investigate data sources
              </li>
            )}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

function calculateVariance(prices: number[]): number {
  if (prices.length < 2) return 0;
  const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
  return Math.max(...prices.map((p) => Math.abs(p - avg) / avg));
}
