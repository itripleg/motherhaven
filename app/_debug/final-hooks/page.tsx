// app/_debug/final-hooks/page.tsx

"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  RefreshCw,
  Database,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Users,
  Zap,
} from "lucide-react";
import { isAddress, Address } from "viem";

// FIXED: Only import the hooks that are still available
import { useTokenData, useTokenInfo } from "@/final-hooks/useTokenData";
import { useTrades } from "@/final-hooks/useTrades";
import { useFactoryConfigContext } from "@/contexts/FactoryConfigProvider";

// Loading component for Suspense fallback
function FinalHooksDebugLoading() {
  return (
    <div className="space-y-6">
      <div className="text-center py-12">
        <Database className="h-12 w-12 mx-auto text-muted-foreground animate-pulse mb-4" />
        <p className="text-muted-foreground">Loading final-hooks debugger...</p>
      </div>
    </div>
  );
}

// Content component that uses search params
function FinalHooksDebugContent() {
  const [mounted, setMounted] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const searchParams = useSearchParams();
  const testToken = searchParams.get("token") || "";
  const isValidToken = testToken && isAddress(testToken);

  useEffect(() => {
    setMounted(true);
  }, []);

  const forceRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  if (!mounted) {
    return <FinalHooksDebugLoading />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Zap className="h-8 w-8 text-green-500" />
            Final-Hooks Architecture Debug
          </h1>
          <p className="text-muted-foreground mt-2">
            Test the consolidated final-hooks architecture (replacement for old
            contexts)
          </p>
        </div>

        <Button onClick={forceRefresh} variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Force Refresh
        </Button>
      </div>

      {/* Token Status */}
      <Card className="border-green-200 bg-green-50/30 dark:bg-green-950/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Test Token:</span>
              {isValidToken ? (
                <>
                  <Badge variant="default" className="font-mono">
                    {testToken.slice(0, 8)}...{testToken.slice(-8)}
                  </Badge>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </>
              ) : (
                <>
                  <Badge variant="destructive">No valid token</Badge>
                  <AlertCircle className="h-4 w-4 text-red-500" />
                </>
              )}
            </div>

            <div className="text-xs text-muted-foreground">
              Refresh Key: #{refreshKey}
            </div>
          </div>

          {!isValidToken && (
            <p className="text-sm text-muted-foreground mt-2">
              💡 Add a valid token address in the URL (?token=0x...) to test
              final-hooks
            </p>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="token-data" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="token-data">Token Data Hook</TabsTrigger>
          <TabsTrigger value="trades-hook">Trades Hook</TabsTrigger>
          <TabsTrigger value="factory-config">Factory Config</TabsTrigger>
        </TabsList>

        {/* Token Data Hook Tab */}
        <TabsContent value="token-data">
          <div className="grid gap-6">
            <TokenDataDebug token={testToken} refreshKey={refreshKey} />
            <TokenInfoDebug token={testToken} refreshKey={refreshKey} />
          </div>
        </TabsContent>

        {/* Trades Hook Tab */}
        <TabsContent value="trades-hook">
          <div className="grid gap-6">
            <TradesHookDebug token={testToken} refreshKey={refreshKey} />
          </div>
        </TabsContent>

        {/* Factory Config Tab */}
        <TabsContent value="factory-config">
          <FactoryConfigDebug refreshKey={refreshKey} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Main page component with Suspense wrapper
export default function DebugFinalHooksPage() {
  return (
    <Suspense fallback={<FinalHooksDebugLoading />}>
      <FinalHooksDebugContent />
    </Suspense>
  );
}

// Token Data Hook Debug (using useTokenData from final-hooks)
function TokenDataDebug({
  token,
  refreshKey,
}: {
  token: string;
  refreshKey: number;
}) {
  const {
    token: tokenData,
    statistics,
    isLoading,
    error,
    hasFirestoreData,
    hasContractData,
    refetchContract,
  } = useTokenData(token && isAddress(token) ? (token as Address) : undefined);

  const getStatusBadge = () => {
    if (error) return <Badge variant="destructive">Error</Badge>;
    if (isLoading) return <Badge variant="secondary">Loading</Badge>;
    if (tokenData) return <Badge variant="default">Success</Badge>;
    return <Badge variant="outline">No Data</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5 text-blue-500" />
          useTokenData Hook (Final-Hooks)
          {getStatusBadge()}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Grid */}
        <div className="grid grid-cols-4 gap-4 text-sm">
          <div className="space-y-1">
            <span className="text-muted-foreground">Loading</span>
            <div className="font-mono">{isLoading.toString()}</div>
          </div>
          <div className="space-y-1">
            <span className="text-muted-foreground">Error</span>
            <div className="font-mono text-red-500">{error || "None"}</div>
          </div>
          <div className="space-y-1">
            <span className="text-muted-foreground">Firestore Data</span>
            <div className="font-mono">
              {hasFirestoreData ? "✅ Yes" : "❌ No"}
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-muted-foreground">Contract Data</span>
            <div className="font-mono">
              {hasContractData ? "✅ Yes" : "❌ No"}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button onClick={refetchContract} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-1" />
            Refetch Contract
          </Button>
        </div>

        {/* Token Data Display */}
        {tokenData && (
          <div className="bg-muted p-4 rounded-lg space-y-3">
            <h4 className="font-semibold text-sm">
              Token Data (Combined Firestore + Contract):
            </h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">Name:</span>
                <div className="font-medium">{tokenData.name}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Symbol:</span>
                <div className="font-medium">{tokenData.symbol}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Creator:</span>
                <div className="font-mono text-xs">{tokenData.creator}</div>
              </div>
              <div>
                <span className="text-muted-foreground">State:</span>
                <div className="font-medium">{tokenData.currentState}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Last Price:</span>
                <div className="font-medium">{tokenData.lastPrice} AVAX</div>
              </div>
              <div>
                <span className="text-muted-foreground">Collateral:</span>
                <div className="font-medium">{tokenData.collateral} AVAX</div>
              </div>
            </div>

            {statistics && (
              <div className="mt-3 p-3 bg-background rounded border">
                <h5 className="text-xs font-medium text-muted-foreground mb-2">
                  Statistics:
                </h5>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>Volume: {statistics.volumeETH} AVAX</div>
                  <div>Trades: {statistics.tradeCount}</div>
                  <div>Holders: {statistics.uniqueHolders}</div>
                </div>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-950/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
            <h4 className="font-semibold text-sm text-red-700 dark:text-red-400 mb-2">
              Error Details:
            </h4>
            <p className="text-sm text-red-600 dark:text-red-300">{error}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Token Info Hook Debug (lightweight version)
function TokenInfoDebug({
  token,
  refreshKey,
}: {
  token: string;
  refreshKey: number;
}) {
  const { tokenInfo, loading } = useTokenInfo(
    token && isAddress(token) ? (token as Address) : undefined
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5 text-purple-500" />
          useTokenInfo Hook (Lightweight)
          <Badge
            variant={loading ? "secondary" : tokenInfo ? "default" : "outline"}
          >
            {loading ? "Loading" : tokenInfo ? "Success" : "No Data"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-sm">
            <span className="font-medium">Purpose:</span>
            <p className="text-muted-foreground mt-1">
              Lightweight hook for basic token info (name, symbol, image)
              without heavy contract data
            </p>
          </div>

          {tokenInfo && (
            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-semibold text-sm mb-2">Token Info:</h4>
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Name:</span>
                  <div className="font-medium">{tokenInfo.name}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Symbol:</span>
                  <div className="font-medium">{tokenInfo.symbol}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Has Image:</span>
                  <div className="font-medium">
                    {tokenInfo.imageUrl ? "✅ Yes" : "❌ No"}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Trades Hook Debug (using useTrades from final-hooks)
function TradesHookDebug({
  token,
  refreshKey,
}: {
  token: string;
  refreshKey: number;
}) {
  const { trades, loading, error, analytics } = useTrades(
    token && isAddress(token) ? (token as Address) : undefined
  );

  const getStatusBadge = () => {
    if (error) return <Badge variant="destructive">Error</Badge>;
    if (loading) return <Badge variant="secondary">Loading</Badge>;
    if (trades.length > 0) return <Badge variant="default">Success</Badge>;
    return <Badge variant="outline">No Data</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-green-500" />
          useTrades Hook (Final-Hooks)
          {getStatusBadge()}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Grid */}
        <div className="grid grid-cols-4 gap-4 text-sm">
          <div className="space-y-1">
            <span className="text-muted-foreground">Loading</span>
            <div className="font-mono">{loading.toString()}</div>
          </div>
          <div className="space-y-1">
            <span className="text-muted-foreground">Error</span>
            <div className="font-mono text-red-500">{error || "None"}</div>
          </div>
          <div className="space-y-1">
            <span className="text-muted-foreground">Trade Count</span>
            <div className="font-mono">{trades.length}</div>
          </div>
          <div className="space-y-1">
            <span className="text-muted-foreground">Has Analytics</span>
            <div className="font-mono">{analytics ? "✅ Yes" : "❌ No"}</div>
          </div>
        </div>

        {/* Analytics */}
        {analytics && (
          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-semibold text-sm mb-3">Trade Analytics:</h4>
            <div className="grid grid-cols-4 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">Total Volume:</span>
                <div className="font-medium">{analytics.totalVolume} AVAX</div>
              </div>
              <div>
                <span className="text-muted-foreground">Trade Count:</span>
                <div className="font-medium">{analytics.tradeCount}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Buy Pressure:</span>
                <div className="font-medium">
                  {(analytics.buyPressure * 100).toFixed(1)}%
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Avg Trade Size:</span>
                <div className="font-medium">{analytics.avgTradeSize} AVAX</div>
              </div>
            </div>
          </div>
        )}

        {/* Recent Trades */}
        {trades.length > 0 && (
          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-semibold text-sm mb-3">
              Recent Trades (Latest 3):
            </h4>
            <div className="space-y-2">
              {trades.slice(0, 3).map((trade, i) => (
                <div
                  key={i}
                  className="text-sm border rounded p-2 bg-background"
                >
                  <div className="flex justify-between items-center mb-1">
                    <Badge
                      variant={trade.type === "buy" ? "default" : "secondary"}
                    >
                      {trade.type.toUpperCase()}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      <Clock className="h-3 w-3 inline mr-1" />
                      {new Date(trade.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>ETH: {trade.ethAmount}</div>
                    <div>Tokens: {trade.tokenAmount}</div>
                    <div>Trader: {trade.trader.slice(0, 8)}...</div>
                    <div>Block: {trade.blockNumber}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-950/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
            <h4 className="font-semibold text-sm text-red-700 dark:text-red-400 mb-2">
              Error Details:
            </h4>
            <p className="text-sm text-red-600 dark:text-red-300">{error}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Factory Config Debug (unchanged - this context still exists)
function FactoryConfigDebug({ refreshKey }: { refreshKey: number }) {
  const { config, isLoading } = useFactoryConfigContext();

  const getStatusBadge = () => {
    if (isLoading) return <Badge variant="secondary">Loading</Badge>;
    if (config) return <Badge variant="default">Loaded</Badge>;
    return <Badge variant="destructive">Failed</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-indigo-500" />
          Factory Config Context (Still Valid)
          {getStatusBadge()}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <span className="text-muted-foreground">Loading</span>
            <div className="font-mono">{isLoading.toString()}</div>
          </div>
          <div className="space-y-1">
            <span className="text-muted-foreground">Has Config</span>
            <div className="font-mono">{config ? "✅ Yes" : "❌ No"}</div>
          </div>
        </div>

        {config && (
          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-semibold text-sm mb-3">
              Factory Configuration:
            </h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">Decimals:</span>
                <div className="font-mono">{config.decimals}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Initial Price:</span>
                <div className="font-mono">{config.initialPrice}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Max Supply:</span>
                <div className="font-mono">{config.maxSupply}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Trading Fee:</span>
                <div className="font-mono">{config.tradingFee}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Max Wallet %:</span>
                <div className="font-mono">{config.maxWalletPercentage}%</div>
              </div>
              <div>
                <span className="text-muted-foreground">Price Rate:</span>
                <div className="font-mono">{config.priceRate}</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
