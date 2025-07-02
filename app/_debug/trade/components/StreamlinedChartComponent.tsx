// app/debug/trade/components/StreamlinedChartComponent.tsx

"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  BarChart3,
  RefreshCw,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
// FINAL-HOOKS: Updated import to use consolidated final-hooks
import { useTrades } from "@/final-hooks/useTrades";
import RechartsLineChart from "@/app/dex/components/charts/RechartsLineChart";
import { formatDistanceToNow, parseISO } from "date-fns";

interface StreamlinedChartComponentProps {
  token: any;
  tokenExists: boolean;
  refreshKey: number;
}

export function StreamlinedChartComponent({
  token,
  tokenExists,
  refreshKey,
}: StreamlinedChartComponentProps) {
  // FINAL-HOOKS: Use consolidated trades hook with enhanced analytics
  const { trades, loading, error, analytics } = useTrades(token?.address);

  if (!tokenExists) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <AlertCircle className="h-12 w-12 mx-auto text-yellow-500 mb-4" />
          <h3 className="text-lg font-medium mb-2">Token Required</h3>
          <p className="text-muted-foreground">
            Enter a valid token address to view price chart
          </p>
        </CardContent>
      </Card>
    );
  }

  // FINAL-HOOKS: Use analytics from the hook instead of manual calculations
  const buyTrades = analytics.buyCount;
  const sellTrades = analytics.sellCount;
  const latestTrade = trades[0];

  return (
    <div className="space-y-6">
      {/* Chart Header with Quick Stats using final-hooks analytics */}
      <Card className="border-green-200 bg-green-50/30 dark:bg-green-950/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-purple-500" />
              Price Chart & Trade Data (Final-Hooks)
              <Badge variant="outline" className="text-green-600">
                final-hooks ✓
              </Badge>
            </CardTitle>
            <div className="flex items-center gap-3">
              {/* Enhanced Quick Trade Stats using analytics */}
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span className="font-mono">{buyTrades}</span>
                  <span className="text-muted-foreground">buys</span>
                </div>
                <div className="flex items-center gap-1">
                  <TrendingDown className="h-4 w-4 text-red-500" />
                  <span className="font-mono">{sellTrades}</span>
                  <span className="text-muted-foreground">sells</span>
                </div>
                <div className="text-muted-foreground">
                  Total:{" "}
                  <span className="font-mono">{analytics.tradeCount}</span>
                </div>
                <div className="text-muted-foreground">
                  Volume:{" "}
                  <span className="font-mono">{analytics.totalVolume}</span>{" "}
                  AVAX
                </div>
              </div>

              {/* Status & Refresh */}
              <div className="flex items-center gap-2">
                {error ? (
                  <Badge variant="destructive">Error</Badge>
                ) : loading ? (
                  <Badge variant="secondary">Loading</Badge>
                ) : (
                  <Badge variant="default">{trades.length} trades</Badge>
                )}

                <Button
                  onClick={() => window.location.reload()}
                  variant="outline"
                  size="sm"
                  className="gap-1"
                >
                  <RefreshCw className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>

          {/* Enhanced Latest Trade Info with analytics */}
          {latestTrade && (
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>Latest trade:</span>
              <Badge
                variant={latestTrade.type === "buy" ? "default" : "secondary"}
                className="text-xs"
              >
                {latestTrade.type.toUpperCase()}
              </Badge>
              <span className="font-mono">
                {latestTrade.trader.slice(0, 8)}...
              </span>
              <span>
                {formatDistanceToNow(parseISO(latestTrade.timestamp), {
                  addSuffix: true,
                })}
              </span>
              <span className="text-green-600">
                Buy pressure: {(analytics.buyPressure * 100).toFixed(1)}%
              </span>
            </div>
          )}
        </CardHeader>
      </Card>

      {/* Main Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            Real-time Chart Data
            <Badge variant="outline" className="text-green-600">
              Firestore + Events
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[400px] p-6">
          {error ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <AlertCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
                <p className="text-red-500 font-medium">Chart Error</p>
                <p className="text-muted-foreground text-sm">{error}</p>
              </div>
            </div>
          ) : trades.length === 0 && !loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium mb-2">No Trade Data</h3>
                <p className="text-muted-foreground mb-4">
                  This token hasn't been traded yet. The chart will appear once
                  trades are made.
                </p>
                <Badge variant="outline" className="text-green-600">
                  final-hooks ready for real-time updates
                </Badge>
              </div>
            </div>
          ) : (
            <RechartsLineChart
              trades={trades}
              loading={loading}
              token={token}
            />
          )}
        </CardContent>
      </Card>

      {/* Enhanced Trade Summary with analytics */}
      {trades.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              Recent Activity
              <Badge variant="outline" className="text-xs">
                final-hooks analytics
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Analytics Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-3 bg-muted rounded">
              <div className="text-center">
                <div className="text-xs text-muted-foreground">
                  Avg Trade Size
                </div>
                <div className="font-mono text-sm">
                  {analytics.avgTradeSize} AVAX
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-muted-foreground">
                  Buy Pressure
                </div>
                <div className="font-mono text-sm text-green-600">
                  {(analytics.buyPressure * 100).toFixed(1)}%
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-muted-foreground">
                  Total Volume
                </div>
                <div className="font-mono text-sm">
                  {analytics.totalVolume} AVAX
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-muted-foreground">Last Trade</div>
                <div className="font-mono text-xs">
                  {analytics.lastTradeTime
                    ? formatDistanceToNow(new Date(analytics.lastTradeTime), {
                        addSuffix: true,
                      })
                    : "N/A"}
                </div>
              </div>
            </div>

            {/* Recent Trades List */}
            <div className="space-y-2">
              {trades.slice(0, 3).map((trade, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-2 bg-background rounded border text-sm"
                >
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={trade.type === "buy" ? "default" : "secondary"}
                      className="text-xs w-12 justify-center"
                    >
                      {trade.type.toUpperCase()}
                    </Badge>
                    <span className="font-mono text-xs">
                      {trade.trader.slice(0, 8)}...
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>
                      {Number(trade.tokenAmount).toLocaleString()} tokens
                    </span>
                    <span>{Number(trade.ethAmount).toFixed(4)} AVAX</span>
                    <span>
                      {formatDistanceToNow(parseISO(trade.timestamp), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                </div>
              ))}

              {trades.length > 3 && (
                <div className="text-center text-xs text-muted-foreground pt-2">
                  ... and {trades.length - 3} more trades
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Final-Hooks Benefits Display */}
      <Card className="bg-green-50 dark:bg-green-950/20 border-green-200">
        <CardContent className="p-4">
          <h5 className="font-medium text-green-700 dark:text-green-400 mb-2">
            ✅ Final-Hooks Chart Benefits:
          </h5>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-green-600 dark:text-green-300">
            <ul className="space-y-1">
              <li>• Real-time Firestore sync for instant updates</li>
              <li>• Built-in analytics (buy pressure, avg size, etc.)</li>
              <li>• Optimistic updates via EventWatcher</li>
            </ul>
            <ul className="space-y-1">
              <li>• Consistent data structure across all components</li>
              <li>• Time-window filtering capabilities</li>
              <li>• Reduced complexity with single import</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
