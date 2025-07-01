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
import { useTokenTrades } from "@/new-hooks/useTokenTrades";
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
  const { trades, loading, error, refetch } = useTokenTrades(token?.address);

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

  const buyTrades = trades.filter((t) => t.type === "buy").length;
  const sellTrades = trades.filter((t) => t.type === "sell").length;
  const latestTrade = trades[0];

  return (
    <div className="space-y-6">
      {/* Chart Header with Quick Stats */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-purple-500" />
              Price Chart & Trade Data
            </CardTitle>
            <div className="flex items-center gap-3">
              {/* Quick Trade Stats */}
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
                  Total: <span className="font-mono">{trades.length}</span>
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
                  onClick={() => refetch?.()}
                  variant="outline"
                  size="sm"
                  className="gap-1"
                >
                  <RefreshCw className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>

          {/* Latest Trade Info */}
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
            </div>
          )}
        </CardHeader>
      </Card>

      {/* Main Chart */}
      <Card>
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
                <p className="text-muted-foreground">
                  This token hasn't been traded yet. The chart will appear once
                  trades are made.
                </p>
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

      {/* Compact Trade Summary */}
      {trades.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {trades.slice(0, 3).map((trade, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-2 bg-muted rounded text-sm"
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
    </div>
  );
}
