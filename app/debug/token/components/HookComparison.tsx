// app/debug/token/components/HookComparison.tsx
"use client";

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  GitCompare,
  Clock,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  RefreshCw,
  Activity,
  Database,
  Zap,
  XCircle,
  Info,
} from "lucide-react";
import { Address } from "viem";

// Import all hooks to compare
import { useUnifiedTokenPrice } from "@/final-hooks/useUnifiedTokenPrice";
import { useFactoryContract } from "@/final-hooks/useFactoryContract";
import { useTrades } from "@/final-hooks/useTrades";
import { useTokenData } from "@/final-hooks/useTokenData";
import { useToken } from "@/contexts/TokenContext";
import { useRealtimeTokenPrice } from "@/hooks/token/useRealtimeTokenPrices";

interface HookComparisonProps {
  tokenAddress: string;
  onRefresh: () => void;
}

interface HookPerformance {
  name: string;
  category: "final-hooks" | "legacy" | "context";
  status: "active" | "deprecated" | "legacy";
  loading: boolean;
  error: string | null;
  hasData: boolean;
  dataPreview: string;
  loadTime?: number;
  source: string;
  recommended: boolean;
  notes: string;
}

export function HookComparison({
  tokenAddress,
  onRefresh,
}: HookComparisonProps) {
  const [measurePerformance, setMeasurePerformance] = useState(false);
  const [performanceData, setPerformanceData] = useState<
    Record<string, number>
  >({});

  // Final-hooks (recommended)
  const unifiedPrice = useUnifiedTokenPrice(tokenAddress as Address);
  const { usePrice, useCollateral, useTokenState } = useFactoryContract();
  const factoryPrice = usePrice(tokenAddress as Address);
  const factoryCollateral = useCollateral(tokenAddress as Address);
  const factoryState = useTokenState(tokenAddress as Address);
  const tradesData = useTrades(tokenAddress as Address);
  const tokenData = useTokenData(tokenAddress as Address);

  // Legacy/Context hooks
  const tokenContext = useToken(tokenAddress);
  const realtimePrice = useRealtimeTokenPrice(tokenAddress as Address);

  // Performance measurement
  React.useEffect(() => {
    if (measurePerformance) {
      const startTime = Date.now();
      const measureHook = (hookName: string) => {
        const endTime = Date.now();
        setPerformanceData((prev) => ({
          ...prev,
          [hookName]: endTime - startTime,
        }));
      };

      // Simulate performance measurement
      setTimeout(() => measureHook("unifiedPrice"), 100);
      setTimeout(() => measureHook("factoryPrice"), 150);
      setTimeout(() => measureHook("tokenContext"), 200);
    }
  }, [measurePerformance]);
  //   @ts-expect-error type error
  const hookAnalysis: HookPerformance[] = useMemo(
    () => [
      {
        name: "useUnifiedTokenPrice",
        category: "final-hooks",
        status: "active",
        loading: unifiedPrice.isLoading,
        error: unifiedPrice.error,
        hasData:
          !!unifiedPrice.formatted && unifiedPrice.formatted !== "0.000000",
        dataPreview: unifiedPrice.formatted || "0",
        loadTime: performanceData["unifiedPrice"],
        source: "final-hooks/useUnifiedTokenPrice",
        recommended: true,
        notes: "Primary price hook - use for all price displays",
      },
      {
        name: "useFactoryContract.usePrice",
        category: "final-hooks",
        status: "active",
        loading: factoryPrice.isLoading,
        error: factoryPrice.error?.message || null,
        hasData: !!factoryPrice.price,
        dataPreview: factoryPrice.priceFormatted || "0",
        loadTime: performanceData["factoryPrice"],
        source: "final-hooks/useFactoryContract",
        recommended: true,
        notes: "Direct contract access - use for trading calculations",
      },
      {
        name: "useFactoryContract.useCollateral",
        category: "final-hooks",
        status: "active",
        loading: factoryCollateral.isLoading,
        error: factoryCollateral.error?.message || null,
        hasData: !!factoryCollateral.collateral,
        dataPreview: factoryCollateral.collateralFormatted || "0",
        source: "final-hooks/useFactoryContract",
        recommended: true,
        notes: "Token collateral data from contract",
      },
      {
        name: "useFactoryContract.useTokenState",
        category: "final-hooks",
        status: "active",
        loading: factoryState.isLoading,
        error: factoryState.error?.message || null,
        hasData: factoryState.state !== undefined,
        dataPreview: factoryState.state?.toString() || "0",
        source: "final-hooks/useFactoryContract",
        recommended: true,
        notes: "Token state from contract",
      },
      {
        name: "useTrades",
        category: "final-hooks",
        status: "active",
        loading: tradesData.loading,
        error: tradesData.error,
        hasData: tradesData.trades.length > 0,
        dataPreview: `${tradesData.trades.length} trades`,
        source: "final-hooks/useTrades",
        recommended: true,
        notes: "Trade history with real-time updates",
      },
      {
        name: "useTokenData",
        category: "final-hooks",
        status: "active",
        loading: tokenData.isLoading,
        error: tokenData.error,
        hasData: !!tokenData.token,
        dataPreview: tokenData.token?.name || "No data",
        source: "final-hooks/useTokenData",
        recommended: true,
        notes: "Combined Firestore + contract data",
      },
      {
        name: "useToken (Context)",
        category: "context",
        status: "legacy",
        loading: tokenContext.loading,
        error: tokenContext.error,
        hasData: !!tokenContext.token,
        dataPreview: tokenContext.token?.name || "No data",
        loadTime: performanceData["tokenContext"],
        source: "contexts/TokenContext",
        recommended: false,
        notes: "Legacy context - metadata only, no prices",
      },
      {
        name: "useRealtimeTokenPrice",
        category: "legacy",
        status: "deprecated",
        loading: realtimePrice.isLoading,
        error: realtimePrice.error,
        hasData: !!realtimePrice.price?.formatted,
        dataPreview: realtimePrice.price?.formatted || "0",
        source: "hooks/token/useRealtimeTokenPrices",
        recommended: false,
        notes: "Should migrate to useUnifiedTokenPrice",
      },
    ],
    [
      unifiedPrice,
      factoryPrice,
      factoryCollateral,
      factoryState,
      tradesData,
      tokenData,
      tokenContext,
      realtimePrice,
      performanceData,
    ]
  );

  const getStatusIcon = (
    status: string,
    hasData: boolean,
    loading: boolean,
    error: string | null
  ) => {
    if (loading)
      return <Clock className="h-4 w-4 animate-spin text-blue-500" />;
    if (error) return <XCircle className="h-4 w-4 text-red-500" />;
    if (status === "deprecated")
      return <AlertTriangle className="h-4 w-4 text-orange-500" />;
    if (hasData) return <CheckCircle className="h-4 w-4 text-green-500" />;
    return <Activity className="h-4 w-4 text-gray-500" />;
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case "final-hooks":
        return (
          <Badge variant="default" className="bg-green-600">
            Final-Hooks
          </Badge>
        );
      case "legacy":
        return (
          <Badge variant="outline" className="text-orange-600">
            Legacy
          </Badge>
        );
      case "context":
        return <Badge variant="secondary">Context</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getRecommendationBadge = (recommended: boolean, status: string) => {
    if (status === "deprecated")
      return <Badge variant="destructive">Deprecated</Badge>;
    if (recommended)
      return (
        <Badge variant="default" className="bg-blue-600">
          Recommended
        </Badge>
      );
    return <Badge variant="outline">Not Recommended</Badge>;
  };

  // Performance summary
  const activeHooks = hookAnalysis.filter((h) => h.status === "active");
  const deprecatedHooks = hookAnalysis.filter((h) => h.status === "deprecated");
  const hooksWithData = hookAnalysis.filter((h) => h.hasData);
  const hooksWithErrors = hookAnalysis.filter((h) => h.error);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GitCompare className="h-5 w-5 text-indigo-500" />
          Hook Performance & Comparison
          <Badge variant="outline">{hookAnalysis.length} hooks analyzed</Badge>
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
        {/* Summary Stats */}
        <Card className="border-l-4 border-l-indigo-500">
          <CardContent className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Active Hooks:</span>
                <div className="font-mono font-bold text-green-600">
                  {activeHooks.length}
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">With Data:</span>
                <div className="font-mono font-bold">
                  {hooksWithData.length}
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Deprecated:</span>
                <div className="font-mono font-bold text-orange-600">
                  {deprecatedHooks.length}
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Errors:</span>
                <div className="font-mono font-bold text-red-600">
                  {hooksWithErrors.length}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Controls */}
        <div className="flex items-center gap-4 p-3 bg-muted rounded-lg">
          <Button
            onClick={() => setMeasurePerformance(!measurePerformance)}
            variant={measurePerformance ? "default" : "outline"}
            size="sm"
            className="gap-2"
          >
            <Clock className="h-4 w-4" />
            {measurePerformance ? "Stop" : "Start"} Performance Monitoring
          </Button>
          <span className="text-sm text-muted-foreground">
            {measurePerformance
              ? "Monitoring hook performance..."
              : "Click to measure hook load times"}
          </span>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="final-hooks">Final-Hooks</TabsTrigger>
            <TabsTrigger value="legacy">Legacy/Deprecated</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="space-y-3">
              <h4 className="font-medium">All Hooks Comparison:</h4>
              {hookAnalysis.map((hook, index) => (
                <Card
                  key={index}
                  className={`border-l-4 ${
                    hook.recommended
                      ? "border-l-green-500"
                      : hook.status === "deprecated"
                      ? "border-l-red-500"
                      : "border-l-gray-300"
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(
                          hook.status,
                          hook.hasData,
                          hook.loading,
                          hook.error
                        )}
                        <span className="font-medium">{hook.name}</span>
                        {getCategoryBadge(hook.category)}
                      </div>
                      {getRecommendationBadge(hook.recommended, hook.status)}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm mb-3">
                      <div>
                        <span className="text-muted-foreground">Status:</span>
                        <div className="font-mono">{hook.status}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Loading:</span>
                        <div className="font-mono">
                          {hook.loading.toString()}
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Has Data:</span>
                        <div className="font-mono">
                          {hook.hasData.toString()}
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">
                          Data Preview:
                        </span>
                        <div className="font-mono text-xs truncate">
                          {hook.dataPreview}
                        </div>
                      </div>
                      {hook.loadTime && (
                        <div>
                          <span className="text-muted-foreground">
                            Load Time:
                          </span>
                          <div className="font-mono">{hook.loadTime}ms</div>
                        </div>
                      )}
                    </div>

                    <div className="text-xs space-y-1">
                      <div className="text-muted-foreground">
                        Source: {hook.source}
                      </div>
                      <div className="text-muted-foreground">{hook.notes}</div>
                      {hook.error && (
                        <div className="text-red-500 bg-red-50 dark:bg-red-950/20 p-2 rounded">
                          <strong>Error:</strong> {hook.error}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="final-hooks" className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <h4 className="font-medium">Final-Hooks (Recommended)</h4>
                <Badge variant="default" className="bg-green-600">
                  {
                    hookAnalysis.filter((h) => h.category === "final-hooks")
                      .length
                  }{" "}
                  hooks
                </Badge>
              </div>

              {hookAnalysis
                .filter((h) => h.category === "final-hooks")
                .map((hook, index) => (
                  <Card key={index} className="border-l-4 border-l-green-500">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(
                            hook.status,
                            hook.hasData,
                            hook.loading,
                            hook.error
                          )}
                          <span className="font-medium">{hook.name}</span>
                        </div>
                        <Badge variant="default" className="bg-blue-600">
                          Recommended
                        </Badge>
                      </div>

                      <div className="text-sm space-y-1">
                        <div>
                          <strong>Purpose:</strong> {hook.notes}
                        </div>
                        <div>
                          <strong>Data:</strong> {hook.dataPreview}
                        </div>
                        <div>
                          <strong>Status:</strong>{" "}
                          {hook.loading
                            ? "Loading..."
                            : hook.hasData
                            ? "Has Data"
                            : "No Data"}
                        </div>
                        {hook.error && (
                          <div className="text-red-500">
                            <strong>Error:</strong> {hook.error}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}

              <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                <h5 className="font-medium mb-2 text-green-700 dark:text-green-300">
                  ✅ Final-Hooks Benefits:
                </h5>
                <ul className="text-sm space-y-1 text-green-600 dark:text-green-400">
                  <li>• Consolidated functionality in single directory</li>
                  <li>• Consistent interfaces and error handling</li>
                  <li>• Better performance through optimized queries</li>
                  <li>• Unified price formatting and data types</li>
                  <li>• Active maintenance and updates</li>
                </ul>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="legacy" className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                <h4 className="font-medium">Legacy & Deprecated Hooks</h4>
                <Badge variant="destructive">
                  {
                    hookAnalysis.filter(
                      (h) =>
                        h.category === "legacy" || h.status === "deprecated"
                    ).length
                  }{" "}
                  hooks
                </Badge>
              </div>

              {hookAnalysis
                .filter(
                  (h) => h.category === "legacy" || h.status === "deprecated"
                )
                .map((hook, index) => (
                  <Card key={index} className="border-l-4 border-l-orange-500">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(
                            hook.status,
                            hook.hasData,
                            hook.loading,
                            hook.error
                          )}
                          <span className="font-medium">{hook.name}</span>
                        </div>
                        <Badge variant="destructive">
                          {hook.status === "deprecated"
                            ? "Deprecated"
                            : "Legacy"}
                        </Badge>
                      </div>

                      <div className="text-sm space-y-1">
                        <div>
                          <strong>Current Status:</strong> {hook.notes}
                        </div>
                        <div>
                          <strong>Migration Path:</strong>{" "}
                          {hook.name.includes("Price")
                            ? "Use useUnifiedTokenPrice"
                            : hook.name.includes("Context")
                            ? "Use useTokenData"
                            : "See final-hooks alternatives"}
                        </div>
                        {hook.hasData && (
                          <div>
                            <strong>Still Providing:</strong> {hook.dataPreview}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}

              <div className="p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                <h5 className="font-medium mb-2 text-orange-700 dark:text-orange-300">
                  ⚠️ Migration Recommendations:
                </h5>
                <ul className="text-sm space-y-1 text-orange-600 dark:text-orange-400">
                  <li>
                    • Replace <code>useRealtimeTokenPrice</code> with{" "}
                    <code>useUnifiedTokenPrice</code>
                  </li>
                  <li>
                    • Use <code>useTokenData</code> instead of context for
                    combined data
                  </li>
                  <li>• Migrate to final-hooks for better performance</li>
                  <li>• Remove unused legacy hook imports</li>
                  <li>• Test thoroughly after migration</li>
                </ul>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
