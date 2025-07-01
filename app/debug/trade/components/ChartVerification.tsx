// app/debug/trade/components/ChartVerification.tsx

"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  BarChart3,
  RefreshCw,
  TrendingUp,
  Clock,
  Database,
} from "lucide-react";
import { useTokenTrades } from "@/new-hooks/useTokenTrades";
import RechartsLineChart from "@/app/dex/components/charts/RechartsLineChart";
import { formatDistanceToNow, parseISO } from "date-fns";

interface ChartVerificationProps {
  token: any;
  tokenExists: boolean;
  refreshKey: number;
}

export function ChartVerification({
  token,
  tokenExists,
  refreshKey,
}: ChartVerificationProps) {
  const { trades, loading, error, refetch } = useTokenTrades(token?.address);

  if (!tokenExists) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <AlertCircle className="h-12 w-12 mx-auto text-yellow-500 mb-4" />
          <h3 className="text-lg font-medium mb-2">Token Required</h3>
          <p className="text-muted-foreground">
            Enter a valid token address to test chart accuracy
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Chart Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-blue-500" />
            Chart Data Status
            <div className="ml-auto flex items-center gap-2">
              <Button
                onClick={() => refetch?.()}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="space-y-1">
              <span className="text-muted-foreground">Data Status</span>
              <div className="flex items-center gap-2">
                {error ? (
                  <>
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <Badge variant="destructive">Error</Badge>
                  </>
                ) : loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <Badge variant="secondary">Loading</Badge>
                  </>
                ) : (
                  <>
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    <Badge variant="default">Ready</Badge>
                  </>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-muted-foreground">Trade Count</span>
              <div className="font-mono text-lg">{trades.length}</div>
            </div>

            <div className="space-y-1">
              <span className="text-muted-foreground">Token Symbol</span>
              <div className="font-mono">{token?.symbol || "N/A"}</div>
            </div>

            <div className="space-y-1">
              <span className="text-muted-foreground">Refresh #</span>
              <div className="font-mono">{refreshKey}</div>
            </div>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-950/20 rounded border border-red-200 dark:border-red-800">
              <div className="flex items-center gap-2 text-red-700 dark:text-red-400 text-sm">
                <AlertCircle className="h-4 w-4" />
                <span>Chart Error: {error}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-purple-500" />
            Price Chart Verification
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[400px]">
          {error ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <AlertCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
                <p className="text-red-500 font-medium">Chart Error</p>
                <p className="text-muted-foreground text-sm">{error}</p>
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

      {/* Trade Data Analysis */}
      {trades.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              Trade Data Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Recent Trades Summary */}
              <div className="space-y-4">
                <h5 className="font-medium">Recent Trades (Latest 5)</h5>
                <div className="space-y-2">
                  {trades.slice(0, 5).map((trade, i) => (
                    <div key={i} className="bg-muted p-3 rounded text-sm">
                      <div className="flex justify-between items-center mb-2">
                        <Badge
                          variant={
                            trade.type === "buy" ? "default" : "secondary"
                          }
                          className="text-xs"
                        >
                          {trade.type.toUpperCase()}
                        </Badge>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(parseISO(trade.timestamp), {
                            addSuffix: true,
                          })}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-muted-foreground">Trader:</span>
                          <div className="font-mono">
                            {trade.trader.slice(0, 8)}...
                          </div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Block:</span>
                          <div className="font-mono">{trade.blockNumber}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">
                            Token Amount:
                          </span>
                          <div className="font-mono">
                            {Number(trade.tokenAmount).toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">
                            ETH Amount:
                          </span>
                          <div className="font-mono">
                            {Number(trade.ethAmount).toFixed(6)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Chart Statistics */}
              <div className="space-y-4">
                <h5 className="font-medium">Chart Statistics</h5>
                <div className="space-y-3">
                  <div className="bg-muted p-3 rounded">
                    <div className="text-sm space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Total Trades:
                        </span>
                        <span className="font-mono">{trades.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Buy Trades:
                        </span>
                        <span className="font-mono text-green-600">
                          {trades.filter((t) => t.type === "buy").length}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Sell Trades:
                        </span>
                        <span className="font-mono text-red-600">
                          {trades.filter((t) => t.type === "sell").length}
                        </span>
                      </div>
                    </div>
                  </div>

                  {trades.length > 0 && (
                    <div className="bg-muted p-3 rounded">
                      <div className="text-sm space-y-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Oldest Trade:
                          </span>
                          <span className="font-mono text-xs">
                            {formatDistanceToNow(
                              parseISO(trades[trades.length - 1].timestamp),
                              { addSuffix: true }
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Latest Trade:
                          </span>
                          <span className="font-mono text-xs">
                            {formatDistanceToNow(
                              parseISO(trades[0].timestamp),
                              { addSuffix: true }
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Time Span:
                          </span>
                          <span className="font-mono text-xs">
                            {formatDistanceToNow(
                              parseISO(trades[trades.length - 1].timestamp)
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded border border-blue-200 dark:border-blue-800">
                    <h6 className="font-medium text-blue-700 dark:text-blue-400 mb-2 text-sm">
                      Chart Verification Notes:
                    </h6>
                    <ul className="text-xs text-blue-600 dark:text-blue-300 space-y-1">
                      <li>• Chart should show price progression over time</li>
                      <li>• Each trade should affect the visible price line</li>
                      <li>• Buy trades typically increase price</li>
                      <li>• Sell trades typically decrease price</li>
                      <li>• Genesis price should be the starting point</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Raw Trade Data (for debugging) */}
      {trades.length > 0 && (
        <Card className="bg-gray-50 dark:bg-gray-900/50">
          <CardHeader>
            <CardTitle className="text-sm">
              Raw Trade Data (First Trade)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs font-mono bg-background p-3 rounded border overflow-auto max-h-48">
              {JSON.stringify(trades[0], null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* No Data State */}
      {!loading && !error && trades.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <BarChart3 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium mb-2">No Trade Data</h3>
            <p className="text-muted-foreground">
              This token hasn't been traded yet. The chart will appear once
              trades are made.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
