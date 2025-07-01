// app/debug/token/page.tsx

"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  RefreshCw,
  Coins,
  AlertCircle,
  CheckCircle,
  Activity,
  BarChart3,
  DollarSign,
  Info,
  ExternalLink,
} from "lucide-react";
import { isAddress } from "viem";

// FINAL-HOOKS: Import from consolidated final-hooks directory
import { useTokenData } from "@/final-hooks/useTokenData";
import { useUnifiedTokenPrice } from "@/final-hooks/useUnifiedTokenPrice";

// Import component pieces
import { HookComparison } from "./components/HookComparison";
import { PriceTesting } from "./components/PriceTesting";
import { TokenDataDisplay } from "./components/TokenDataDisplay";
import { TradingTesting } from "./components/TradingTesting";

export default function DebugTokenPage() {
  const [mounted, setMounted] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const searchParams = useSearchParams();
  const testToken = searchParams.get("token") || "";
  const isValidToken = testToken && isAddress(testToken);

  // FINAL-HOOKS: Use consolidated token data hook
  const {
    token: tokenData,
    isLoading: tokenLoading,
    error: tokenError,
    exists: tokenExists,
  } = useTokenData(testToken as `0x${string}`);

  // FINAL-HOOKS: Get current price for status display
  const priceData = useUnifiedTokenPrice(testToken as `0x${string}`);

  useEffect(() => {
    setMounted(true);
  }, []);

  const forceRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  if (!mounted) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <Coins className="h-12 w-12 mx-auto text-muted-foreground animate-pulse mb-4" />
          <p className="text-muted-foreground">Loading token debugger...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Coins className="h-8 w-8 text-purple-500" />
            Token Hooks Debug (Final-Hooks)
          </h1>
          <p className="text-muted-foreground mt-2">
            Test final-hooks token functionality with comprehensive debugging
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-green-600">
            final-hooks ✓
          </Badge>
          <Button onClick={forceRefresh} variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Force Refresh
          </Button>
        </div>
      </div>

      {/* Enhanced Token Status Card using final-hooks */}
      <TokenStatusCard
        tokenAddress={testToken}
        tokenData={tokenData}
        priceData={priceData}
        isValidToken={!!isValidToken}
        tokenExists={tokenExists}
        tokenLoading={tokenLoading}
        tokenError={tokenError}
        refreshKey={refreshKey}
      />

      {/* Main Tabs with Component-Based Structure */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="hook-comparison">Hook Comparison</TabsTrigger>
          <TabsTrigger value="price-testing">Price Testing</TabsTrigger>
          <TabsTrigger value="trading-testing">Trading Testing</TabsTrigger>
          <TabsTrigger value="data-display">Data Display</TabsTrigger>
        </TabsList>

        {/* Overview Tab - Final-Hooks Demo */}
        <TabsContent value="overview">
          <FinalHooksOverview
            token={testToken}
            tokenExists={tokenExists}
            tokenData={tokenData}
            priceData={priceData}
            refreshKey={refreshKey}
          />
        </TabsContent>

        {/* Hook Comparison Tab */}
        <TabsContent value="hook-comparison">
          <HookComparison tokenAddress={testToken} onRefresh={forceRefresh} />
        </TabsContent>

        {/* Price Testing Tab */}
        <TabsContent value="price-testing">
          <PriceTesting tokenAddress={testToken} onRefresh={forceRefresh} />
        </TabsContent>

        {/* Trading Testing Tab */}
        <TabsContent value="trading-testing">
          <TradingTesting tokenAddress={testToken} onRefresh={forceRefresh} />
        </TabsContent>

        {/* Data Display Tab */}
        <TabsContent value="data-display">
          <TokenDataDisplay tokenAddress={testToken} onRefresh={forceRefresh} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Enhanced Token Status Card Component
function TokenStatusCard({
  tokenAddress,
  tokenData,
  priceData,
  isValidToken,
  tokenExists,
  tokenLoading,
  tokenError,
  refreshKey,
}: {
  tokenAddress: string;
  tokenData: any;
  priceData: any;
  isValidToken: boolean;
  tokenExists: boolean;
  tokenLoading: boolean;
  tokenError: string | null;
  refreshKey: number;
}) {
  const getStatusBadge = () => {
    if (!isValidToken) {
      return <Badge variant="destructive">Invalid Address</Badge>;
    }
    if (tokenLoading) {
      return <Badge variant="secondary">Loading...</Badge>;
    }
    if (tokenError) {
      return <Badge variant="destructive">Error</Badge>;
    }
    if (tokenExists) {
      return <Badge variant="default">Token Found</Badge>;
    }
    return <Badge variant="outline">Not Found</Badge>;
  };

  return (
    <Card className="border-purple-200 bg-purple-50/30 dark:bg-purple-950/20">
      <CardContent className="p-4 space-y-4">
        {/* Main Status Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Test Token:</span>
            {isValidToken ? (
              <>
                <Badge variant="outline" className="font-mono">
                  {tokenAddress.slice(0, 8)}...{tokenAddress.slice(-8)}
                </Badge>
                {getStatusBadge()}
                {tokenExists ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-500" />
                )}
              </>
            ) : (
              <>
                <Badge variant="destructive">No valid token</Badge>
                <AlertCircle className="h-4 w-4 text-red-500" />
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-green-600">
              final-hooks ✓
            </Badge>
            <div className="text-xs text-muted-foreground">
              Refresh #{refreshKey}
            </div>
          </div>
        </div>

        {/* Token Details using final-hooks data */}
        {tokenExists && tokenData && (
          <div className="grid md:grid-cols-3 gap-4 p-4 bg-background rounded-lg border">
            <div className="space-y-2">
              <h4 className="font-medium text-sm flex items-center gap-1">
                <Info className="h-4 w-4" />
                Token Metadata
              </h4>
              <div className="space-y-1 text-sm">
                <div>
                  <span className="text-muted-foreground">Name:</span>
                  <span className="ml-2 font-medium">{tokenData.name}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Symbol:</span>
                  <span className="ml-2 font-medium">{tokenData.symbol}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">State:</span>
                  <span className="ml-2 font-medium">{tokenData.state}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium text-sm flex items-center gap-1">
                <DollarSign className="h-4 w-4" />
                Real-time Data
              </h4>
              <div className="space-y-1 text-sm">
                <div>
                  <span className="text-muted-foreground">Current Price:</span>
                  <span className="ml-2 font-medium font-mono">
                    {priceData.formatted} AVAX
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Collateral:</span>
                  <span className="ml-2 font-medium">
                    {tokenData.collateral} AVAX
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Price Loading:</span>
                  <span className="ml-2 font-mono text-xs">
                    {priceData.isLoading.toString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium text-sm flex items-center gap-1">
                <Activity className="h-4 w-4" />
                Actions
              </h4>
              <div className="space-y-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full justify-start text-xs"
                  onClick={() => window.open(`/dex/${tokenAddress}`, "_blank")}
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Open Token Page
                </Button>
                <div className="text-xs text-muted-foreground">
                  Creator: {tokenData.creator?.slice(0, 8)}...
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Status Messages */}
        {tokenError && (
          <div className="bg-red-50 dark:bg-red-950/20 p-3 rounded border border-red-200 dark:border-red-800">
            <div className="flex items-center gap-2 text-red-700 dark:text-red-400 text-sm">
              <AlertCircle className="h-4 w-4" />
              <span className="font-medium">Error:</span>
              <span>{tokenError}</span>
            </div>
          </div>
        )}

        {!isValidToken && (
          <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-700 dark:text-blue-400">
              💡 Enter a valid token address (0x...) in the URL or input above
              to test final-hooks functionality
            </p>
          </div>
        )}

        {isValidToken && !tokenExists && !tokenLoading && (
          <div className="bg-yellow-50 dark:bg-yellow-950/20 p-3 rounded border border-yellow-200 dark:border-yellow-800">
            <p className="text-sm text-yellow-700 dark:text-yellow-400">
              ⚠️ Token address is valid but token doesn't exist in the factory
              contract or database
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Final-Hooks Overview Component
function FinalHooksOverview({
  token,
  tokenExists,
  tokenData,
  priceData,
  refreshKey,
}: {
  token: string;
  tokenExists: boolean;
  tokenData: any;
  priceData: any;
  refreshKey: number;
}) {
  if (!tokenExists) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <AlertCircle className="h-12 w-12 mx-auto text-yellow-500 mb-4" />
          <h3 className="text-lg font-medium mb-2">Token Required</h3>
          <p className="text-muted-foreground mb-4">
            Enter a valid token address to explore final-hooks functionality.
          </p>
          <Badge variant="outline" className="bg-green-50 text-green-700">
            final-hooks ready ✓
          </Badge>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Migration Status */}
      <Card className="border-green-200 bg-green-50/30 dark:bg-green-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Final-Hooks Migration Complete
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>useTokenData</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>useUnifiedTokenPrice</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>useTrades</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>useFactoryContract</span>
            </div>
          </div>
          <div className="mt-4 p-3 bg-white dark:bg-background rounded border">
            <p className="text-sm text-green-700 dark:text-green-400">
              ✅ All token-related functionality has been migrated to
              final-hooks with consolidated interfaces, consistent error
              handling, and improved performance.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Current Data Overview */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Token Data Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Info className="h-4 w-4 text-blue-500" />
              Token Data (useTokenData)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Name:</span>
                <span className="font-medium">{tokenData?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Symbol:</span>
                <span className="font-medium">{tokenData?.symbol}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">State:</span>
                <span className="font-mono">{tokenData?.state}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Collateral:</span>
                <span className="font-mono">{tokenData?.collateral} AVAX</span>
              </div>
            </div>
            <div className="bg-blue-50 dark:bg-blue-950/20 p-2 rounded text-xs">
              <strong>Source:</strong> Combined Firestore + contract data
            </div>
          </CardContent>
        </Card>

        {/* Price Data Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <DollarSign className="h-4 w-4 text-green-500" />
              Price (useUnifiedTokenPrice)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Formatted:</span>
                <span className="font-mono font-bold">
                  {priceData.formatted} AVAX
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Raw:</span>
                <span className="font-mono text-xs">{priceData.raw}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Loading:</span>
                <span className="font-mono">
                  {priceData.isLoading.toString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Error:</span>
                <span className="font-mono text-xs">
                  {priceData.error || "None"}
                </span>
              </div>
            </div>
            <div className="bg-green-50 dark:bg-green-950/20 p-2 rounded text-xs">
              <strong>Source:</strong> Factory contract lastPrice
            </div>
          </CardContent>
        </Card>

        {/* Benefits Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-4 w-4 text-purple-500" />
              Architecture Benefits
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                <span>Single source of truth</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                <span>Consistent formatting</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                <span>Reduced imports</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                <span>Better error handling</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                <span>Real-time updates</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Component Testing Links */}
      <Card>
        <CardHeader>
          <CardTitle>Component Testing</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 bg-muted rounded text-center">
              <Activity className="h-6 w-6 mx-auto mb-2 text-blue-500" />
              <div className="text-sm font-medium">Hook Comparison</div>
              <div className="text-xs text-muted-foreground">
                Compare final-hooks with legacy
              </div>
            </div>
            <div className="p-3 bg-muted rounded text-center">
              <DollarSign className="h-6 w-6 mx-auto mb-2 text-green-500" />
              <div className="text-sm font-medium">Price Testing</div>
              <div className="text-xs text-muted-foreground">
                Test price consistency
              </div>
            </div>
            <div className="p-3 bg-muted rounded text-center">
              <BarChart3 className="h-6 w-6 mx-auto mb-2 text-purple-500" />
              <div className="text-sm font-medium">Trading Testing</div>
              <div className="text-xs text-muted-foreground">
                Test calculations & trades
              </div>
            </div>
            <div className="p-3 bg-muted rounded text-center">
              <Info className="h-6 w-6 mx-auto mb-2 text-orange-500" />
              <div className="text-sm font-medium">Data Display</div>
              <div className="text-xs text-muted-foreground">
                Context vs final-hooks data
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Debug Information */}
      <Card className="bg-gray-50 dark:bg-gray-900/50">
        <CardHeader>
          <CardTitle className="text-sm">Debug Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
            <div>
              <span className="text-muted-foreground">Refresh Key:</span>
              <div>#{refreshKey}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Token Address:</span>
              <div className="truncate">{token}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Data Source:</span>
              <div>final-hooks</div>
            </div>
            <div>
              <span className="text-muted-foreground">Last Updated:</span>
              <div>{new Date().toLocaleTimeString()}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
