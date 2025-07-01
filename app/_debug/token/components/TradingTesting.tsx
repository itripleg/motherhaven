// app/debug/token/components/TradingTesting.tsx
"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowUpDown,
  Calculator,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  RefreshCw,
  DollarSign,
  Activity,
} from "lucide-react";
import { Address, parseEther, formatEther } from "viem";
import { useReadContract } from "wagmi";
import { useTrades } from "@/final-hooks/useTrades";
import { FACTORY_ADDRESS, FACTORY_ABI } from "@/types";

interface TradingTestingProps {
  tokenAddress: string;
  onRefresh: () => void;
}

export function TradingTesting({
  tokenAddress,
  onRefresh,
}: TradingTestingProps) {
  const [buyAmount, setBuyAmount] = useState("1.0");
  const [sellAmount, setSellAmount] = useState("1000");

  // Get trades data
  const {
    trades,
    loading: tradesLoading,
    error: tradesError,
  } = useTrades(tokenAddress as Address);

  // Buy calculation
  const {
    data: buyResult,
    isLoading: buyLoading,
    error: buyError,
  } = useReadContract({
    address: FACTORY_ADDRESS,
    abi: FACTORY_ABI,
    functionName: "calculateTokenAmount",
    args: tokenAddress
      ? [tokenAddress as Address, parseEther(buyAmount || "0")]
      : undefined,
    query: {
      enabled: Boolean(tokenAddress && buyAmount && Number(buyAmount) > 0),
    },
  });

  // Sell calculation
  const {
    data: sellResult,
    isLoading: sellLoading,
    error: sellError,
  } = useReadContract({
    address: FACTORY_ADDRESS,
    abi: FACTORY_ABI,
    functionName: "calculateSellPrice",
    args: tokenAddress
      ? [tokenAddress as Address, parseEther(sellAmount || "0")]
      : undefined,
    query: {
      enabled: Boolean(tokenAddress && sellAmount && Number(sellAmount) > 0),
    },
  });

  // Calculate effective prices
  const buyEffectivePrice =
    buyResult && buyAmount
      ? Number(buyAmount) / Number(formatEther(buyResult as bigint))
      : null;

  const sellEffectivePrice =
    sellResult && sellAmount
      ? Number(formatEther(sellResult as bigint)) / Number(sellAmount)
      : null;

  // Calculate price impact and asymmetry
  const priceAsymmetry =
    buyEffectivePrice && sellEffectivePrice
      ? Math.abs(buyEffectivePrice - sellEffectivePrice) / sellEffectivePrice
      : null;

  // Calculate trade statistics
  const buyTrades = trades.filter((t) => t.type === "buy");
  const sellTrades = trades.filter((t) => t.type === "sell");
  const totalVolume = trades.reduce(
    (sum, trade) => sum + parseFloat(trade.ethAmount),
    0
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowUpDown className="h-5 w-5 text-purple-500" />
          Trading Calculations & Analysis
          <Badge
            variant={
              tradesError
                ? "destructive"
                : tradesLoading
                ? "secondary"
                : "default"
            }
          >
            {tradesError ? "Error" : tradesLoading ? "Loading" : "Active"}
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
        {/* Trading Calculator */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Buy Calculation */}
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span className="font-medium">Buy Calculation</span>
                <Badge
                  variant={
                    buyError
                      ? "destructive"
                      : buyLoading
                      ? "secondary"
                      : "default"
                  }
                >
                  {buyError ? "Error" : buyLoading ? "Loading" : "Success"}
                </Badge>
              </div>

              <div className="space-y-3">
                <div>
                  <Label htmlFor="buyAmount">AVAX Amount</Label>
                  <Input
                    id="buyAmount"
                    type="number"
                    value={buyAmount}
                    onChange={(e) => setBuyAmount(e.target.value)}
                    placeholder="1.0"
                    className="font-mono"
                  />
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Tokens Received:
                    </span>
                    <span className="font-mono">
                      {buyLoading
                        ? "..."
                        : buyResult
                        ? Number(formatEther(buyResult as bigint)).toFixed(2)
                        : "0"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Effective Price:
                    </span>
                    <span className="font-mono">
                      {buyEffectivePrice ? buyEffectivePrice.toFixed(12) : "0"}{" "}
                      AVAX/token
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Raw Result:</span>
                    <span className="font-mono text-xs">
                      {buyResult ? (buyResult as bigint).toString() : "0"} wei
                    </span>
                  </div>
                </div>

                {buyError && (
                  <div className="p-2 bg-red-50 dark:bg-red-950/20 rounded text-sm text-red-600">
                    <strong>Error:</strong> {buyError.message}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Sell Calculation */}
          <Card className="border-l-4 border-l-red-500">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <TrendingDown className="h-4 w-4 text-red-500" />
                <span className="font-medium">Sell Calculation</span>
                <Badge
                  variant={
                    sellError
                      ? "destructive"
                      : sellLoading
                      ? "secondary"
                      : "default"
                  }
                >
                  {sellError ? "Error" : sellLoading ? "Loading" : "Success"}
                </Badge>
              </div>

              <div className="space-y-3">
                <div>
                  <Label htmlFor="sellAmount">Token Amount</Label>
                  <Input
                    id="sellAmount"
                    type="number"
                    value={sellAmount}
                    onChange={(e) => setSellAmount(e.target.value)}
                    placeholder="1000"
                    className="font-mono"
                  />
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      AVAX Received:
                    </span>
                    <span className="font-mono">
                      {sellLoading
                        ? "..."
                        : sellResult
                        ? Number(formatEther(sellResult as bigint)).toFixed(4)
                        : "0"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Effective Price:
                    </span>
                    <span className="font-mono">
                      {sellEffectivePrice
                        ? sellEffectivePrice.toFixed(12)
                        : "0"}{" "}
                      AVAX/token
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Raw Result:</span>
                    <span className="font-mono text-xs">
                      {sellResult ? (sellResult as bigint).toString() : "0"} wei
                    </span>
                  </div>
                </div>

                {sellError && (
                  <div className="p-2 bg-red-50 dark:bg-red-950/20 rounded text-sm text-red-600">
                    <strong>Error:</strong> {sellError.message}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Price Asymmetry Analysis */}
        {buyEffectivePrice && sellEffectivePrice && (
          <Card className="border-l-4 border-l-orange-500">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Calculator className="h-4 w-4 text-orange-500" />
                <span className="font-medium">Price Asymmetry Analysis</span>
                <Badge
                  variant={
                    priceAsymmetry && priceAsymmetry > 0.15
                      ? "destructive"
                      : priceAsymmetry && priceAsymmetry > 0.05
                      ? "secondary"
                      : "default"
                  }
                >
                  {priceAsymmetry && priceAsymmetry > 0.15
                    ? "High"
                    : priceAsymmetry && priceAsymmetry > 0.05
                    ? "Medium"
                    : "Low"}
                </Badge>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Buy Price:</span>
                  <div className="font-mono">
                    {buyEffectivePrice.toFixed(12)}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Sell Price:</span>
                  <div className="font-mono">
                    {sellEffectivePrice.toFixed(12)}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Asymmetry:</span>
                  <div className="font-mono">
                    {priceAsymmetry ? (priceAsymmetry * 100).toFixed(2) : "0"}%
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Status:</span>
                  <div className="flex items-center gap-1">
                    {priceAsymmetry && priceAsymmetry > 0.15 ? (
                      <>
                        <AlertTriangle className="h-3 w-3 text-red-500" />
                        <span className="text-red-600">High</span>
                      </>
                    ) : priceAsymmetry && priceAsymmetry > 0.05 ? (
                      <>
                        <AlertTriangle className="h-3 w-3 text-yellow-500" />
                        <span className="text-yellow-600">Medium</span>
                      </>
                    ) : (
                      <>
                        <DollarSign className="h-3 w-3 text-green-500" />
                        <span className="text-green-600">Good</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {priceAsymmetry && priceAsymmetry > 0.05 && (
                <div className="mt-3 p-2 bg-yellow-50 dark:bg-yellow-950/20 rounded text-sm text-yellow-700 dark:text-yellow-300">
                  <strong>Note:</strong> Significant price asymmetry detected.
                  This could indicate:
                  <ul className="mt-1 ml-4 list-disc text-xs">
                    <li>Different fee structures for buy/sell</li>
                    <li>Liquidity imbalances</li>
                    <li>Price impact from trade size</li>
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Recent Trades Summary */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="h-4 w-4 text-blue-500" />
              <span className="font-medium">Recent Trades Summary</span>
              <Badge variant={tradesLoading ? "secondary" : "default"}>
                {tradesLoading ? "Loading" : `${trades.length} trades`}
              </Badge>
            </div>

            {tradesLoading ? (
              <div className="text-center py-4 text-muted-foreground">
                Loading trades data...
              </div>
            ) : tradesError ? (
              <div className="text-center py-4 text-red-500">
                Error loading trades: {tradesError}
              </div>
            ) : trades.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                No trades found for this token
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Total Trades:</span>
                    <div className="font-mono font-bold">{trades.length}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Buy Trades:</span>
                    <div className="font-mono text-green-600">
                      {buyTrades.length}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Sell Trades:</span>
                    <div className="font-mono text-red-600">
                      {sellTrades.length}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Total Volume:</span>
                    <div className="font-mono">
                      {totalVolume.toFixed(4)} AVAX
                    </div>
                  </div>
                </div>

                {/* Recent trades list */}
                <div className="space-y-2">
                  <h5 className="text-sm font-medium">
                    Recent Trades (Last 5):
                  </h5>
                  <div className="space-y-1">
                    {trades.slice(0, 5).map((trade, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center p-2 bg-muted rounded text-xs"
                      >
                        <div className="flex items-center gap-2">
                          {trade.type === "buy" ? (
                            <TrendingUp className="h-3 w-3 text-green-500" />
                          ) : (
                            <TrendingDown className="h-3 w-3 text-red-500" />
                          )}
                          <span className="font-mono">
                            {trade.type.toUpperCase()}
                          </span>
                        </div>
                        <div className="font-mono">
                          {Number(trade.ethAmount).toFixed(4)} AVAX
                        </div>
                        <div className="text-muted-foreground">
                          {new Date(trade.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Buy/Sell Pressure */}
                <div className="bg-muted p-3 rounded">
                  <h5 className="text-sm font-medium mb-2">
                    Buy/Sell Pressure:
                  </h5>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-green-500 rounded"></div>
                      <span>
                        Buy:{" "}
                        {buyTrades.length > 0
                          ? ((buyTrades.length / trades.length) * 100).toFixed(
                              1
                            )
                          : 0}
                        %
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-red-500 rounded"></div>
                      <span>
                        Sell:{" "}
                        {sellTrades.length > 0
                          ? ((sellTrades.length / trades.length) * 100).toFixed(
                              1
                            )
                          : 0}
                        %
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Trading Recommendations */}
        <div className="p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
          <h4 className="font-medium mb-2 text-purple-700 dark:text-purple-300">
            🎯 Trading Analysis:
          </h4>
          <ul className="text-sm space-y-1 text-purple-600 dark:text-purple-400">
            <li>
              • Use <strong>calculateTokenAmount</strong> to preview buy
              transactions
            </li>
            <li>
              • Use <strong>calculateSellPrice</strong> to preview sell
              transactions
            </li>
            <li>• Monitor price asymmetry for arbitrage opportunities</li>
            {priceAsymmetry && priceAsymmetry > 0.1 && (
              <li className="text-orange-600 dark:text-orange-400">
                • ⚠️ High asymmetry detected - consider market impact
              </li>
            )}
            {buyTrades.length > sellTrades.length * 2 && (
              <li className="text-green-600 dark:text-green-400">
                • 📈 Strong buy pressure detected
              </li>
            )}
            {sellTrades.length > buyTrades.length * 2 && (
              <li className="text-red-600 dark:text-red-400">
                • 📉 Strong sell pressure detected
              </li>
            )}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
