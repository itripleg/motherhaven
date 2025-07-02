// app/_debug/factory/components/FactoryContractReads.tsx

"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, BarChart3, DollarSign, Coins } from "lucide-react";
import { isAddress } from "viem";
import { useFactoryContract } from "@/final-hooks/useFactoryContract";

interface FactoryContractReadsProps {
  token: string;
  refreshKey: number;
}

export function FactoryContractReads({
  token,
  refreshKey,
}: FactoryContractReadsProps) {
  // FIXED: Updated to use correct hook names from final-hooks
  const { useTokenState, useCollateral, usePrice, formatValue } =
    useFactoryContract();

  // Only call hooks if we have a valid token
  const tokenAddress =
    token && isAddress(token) ? (token as `0x${string}`) : undefined;

  // FIXED: Updated hook usage to match final-hooks implementation
  const {
    state: tokenState,
    isLoading: stateLoading,
    error: stateError,
  } = useTokenState(tokenAddress);

  const {
    collateral: collateralRaw,
    collateralFormatted,
    isLoading: collateralLoading,
    error: collateralError,
  } = useCollateral(tokenAddress);

  const {
    price: priceRaw,
    priceFormatted,
    isLoading: priceLoading,
    error: priceError,
  } = usePrice(tokenAddress);

  const anyLoading = stateLoading || collateralLoading || priceLoading;
  const anyError = stateError || collateralError || priceError;

  return (
    <div className="grid gap-6">
      {/* Overview Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-500" />
            useFactoryContract Hook Overview (Final-Hooks)
            <Badge
              variant={
                anyError ? "destructive" : anyLoading ? "secondary" : "default"
              }
            >
              {anyError ? "Has Errors" : anyLoading ? "Loading" : "Success"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="space-y-1">
              <span className="text-muted-foreground">Token Required</span>
              <div className="font-mono">
                {token ? "✅ Provided" : "❌ Missing"}
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-muted-foreground">Any Loading</span>
              <div className="font-mono">{anyLoading.toString()}</div>
            </div>
            <div className="space-y-1">
              <span className="text-muted-foreground">Any Errors</span>
              <div className="font-mono">{anyError ? "Yes" : "No"}</div>
            </div>
            <div className="space-y-1">
              <span className="text-muted-foreground">Hook Source</span>
              <div className="font-mono text-green-600">final-hooks</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Individual Hook Results */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Token State */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-4 w-4 text-purple-500" />
              useTokenState
              <Badge
                variant={
                  stateError
                    ? "destructive"
                    : stateLoading
                    ? "secondary"
                    : "default"
                }
              >
                {stateError ? "Error" : stateLoading ? "Loading" : "Success"}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Loading:</span>
                <span className="font-mono">{stateLoading.toString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Error:</span>
                <span className="font-mono text-red-500">
                  {stateError?.message || "None"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Raw Value:</span>
                <span className="font-mono">
                  {tokenState?.toString() || "None"}
                </span>
              </div>
            </div>

            {tokenState !== undefined && (
              <div className="bg-muted p-3 rounded">
                <h5 className="text-xs font-medium mb-2">State Mapping:</h5>
                <div className="text-xs space-y-1">
                  <div>0: NOT_CREATED</div>
                  <div>1: TRADING</div>
                  <div>2: GOAL_REACHED</div>
                  <div>3: HALTED</div>
                  <div className="font-bold text-primary">
                    Current: {tokenState} (
                    {tokenState === 0
                      ? "NOT_CREATED"
                      : tokenState === 1
                      ? "TRADING"
                      : tokenState === 2
                      ? "GOAL_REACHED"
                      : tokenState === 3
                      ? "HALTED"
                      : "UNKNOWN"}
                    )
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Collateral */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <DollarSign className="h-4 w-4 text-green-500" />
              useCollateral
              <Badge
                variant={
                  collateralError
                    ? "destructive"
                    : collateralLoading
                    ? "secondary"
                    : "default"
                }
              >
                {collateralError
                  ? "Error"
                  : collateralLoading
                  ? "Loading"
                  : "Success"}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Loading:</span>
                <span className="font-mono">
                  {collateralLoading.toString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Error:</span>
                <span className="font-mono text-red-500">
                  {collateralError?.message || "None"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Raw (Wei):</span>
                <span className="font-mono text-xs">
                  {collateralRaw?.toString() || "None"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Formatted:</span>
                <span className="font-mono font-bold">
                  {collateralFormatted}
                </span>
              </div>
            </div>

            {collateralRaw && (
              <div className="bg-muted p-3 rounded">
                <h5 className="text-xs font-medium mb-2">
                  formatValue() Tests:
                </h5>
                <div className="text-xs space-y-1">
                  <div>
                    formatValue(raw, 2): {formatValue(collateralRaw, 2)}
                  </div>
                  <div>
                    formatValue(raw, 4): {formatValue(collateralRaw, 4)}
                  </div>
                  <div>
                    formatValue(raw, 6): {formatValue(collateralRaw, 6)}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Current Price */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Coins className="h-4 w-4 text-yellow-500" />
              usePrice
              <Badge
                variant={
                  priceError
                    ? "destructive"
                    : priceLoading
                    ? "secondary"
                    : "default"
                }
              >
                {priceError ? "Error" : priceLoading ? "Loading" : "Success"}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Loading:</span>
                <span className="font-mono">{priceLoading.toString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Error:</span>
                <span className="font-mono text-red-500">
                  {priceError?.message || "None"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Raw (Wei):</span>
                <span className="font-mono text-xs">
                  {priceRaw?.toString() || "None"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Formatted:</span>
                <span className="font-mono font-bold">{priceFormatted}</span>
              </div>
            </div>

            {priceRaw && (
              <div className="bg-muted p-3 rounded">
                <h5 className="text-xs font-medium mb-2">Price Analysis:</h5>
                <div className="text-xs space-y-1">
                  <div>
                    Scientific: {Number(priceFormatted).toExponential(2)}
                  </div>
                  <div>Fixed(8): {Number(priceFormatted).toFixed(8)}</div>
                  <div>
                    In USD (≈$2000): $
                    {(Number(priceFormatted) * 2000).toFixed(4)}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
