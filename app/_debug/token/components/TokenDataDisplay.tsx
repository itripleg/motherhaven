// app/debug/token/components/TokenDataDisplay.tsx
"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Database,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Info,
  Activity,
  Globe,
} from "lucide-react";
// FINAL-HOOKS: Updated to use new consolidated hooks
import { useTokenData } from "@/final-hooks/useTokenData";
import { useFactoryContract } from "@/final-hooks/useFactoryContract";
import { useUnifiedTokenPrice } from "@/final-hooks/useUnifiedTokenPrice";
import { Address } from "viem";

interface TokenDataDisplayProps {
  tokenAddress: string;
  onRefresh: () => void;
}

export function TokenDataDisplay({
  tokenAddress,
  onRefresh,
}: TokenDataDisplayProps) {
  // FINAL-HOOKS: Use unified token data hook
  const {
    token,
    isLoading,
    error,
    statistics,
    hasFirestoreData,
    hasContractData,
    refetchContract,
  } = useTokenData(tokenAddress as Address);

  // FINAL-HOOKS: Get additional contract data for debugging
  const { useTokenDetails } = useFactoryContract();
  const contractData = useTokenDetails(tokenAddress as Address);

  // FINAL-HOOKS: Get price data for debugging
  const priceData = useUnifiedTokenPrice(tokenAddress as Address);

  const getStatusIcon = () => {
    if (isLoading)
      return <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />;
    if (error) return <XCircle className="h-4 w-4 text-red-500" />;
    if (token) return <CheckCircle className="h-4 w-4 text-green-500" />;
    return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
  };

  const getStatusBadge = () => {
    if (isLoading) return <Badge variant="secondary">Loading</Badge>;
    if (error) return <Badge variant="destructive">Error</Badge>;
    if (token) return <Badge variant="default">Loaded</Badge>;
    return <Badge variant="outline">No Data</Badge>;
  };

  const handleRefresh = () => {
    refetchContract();
    onRefresh();
  };

  return (
    <div className="space-y-4">
      {/* Main Token Data Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-blue-500" />
            Final-Hooks Token Data
            {getStatusBadge()}
            <Button
              onClick={handleRefresh}
              variant="outline"
              size="sm"
              className="ml-auto"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status Overview */}
          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
            {getStatusIcon()}
            <div className="flex-1">
              <div className="font-medium">
                {isLoading
                  ? "Loading token data..."
                  : error
                  ? "Failed to load token data"
                  : token
                  ? `Token: ${token.name} (${token.symbol})`
                  : "No token data available"}
              </div>
              {error && (
                <div className="text-sm text-red-500 mt-1">{error}</div>
              )}
            </div>
          </div>

          {/* Data Source Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2 p-2 bg-muted rounded">
              <Globe className="h-4 w-4 text-blue-500" />
              <span className="text-sm">Firestore Data:</span>
              <Badge variant={hasFirestoreData ? "default" : "secondary"}>
                {hasFirestoreData ? "Connected" : "No Data"}
              </Badge>
            </div>
            <div className="flex items-center gap-2 p-2 bg-muted rounded">
              <Activity className="h-4 w-4 text-green-500" />
              <span className="text-sm">Contract Data:</span>
              <Badge variant={hasContractData ? "default" : "secondary"}>
                {hasContractData ? "Live" : "No Data"}
              </Badge>
            </div>
          </div>

          {/* Token Metadata */}
          {token && (
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <Info className="h-4 w-4" />
                Token Metadata
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Name:</span>
                  <div className="font-medium">{token.name || "N/A"}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Symbol:</span>
                  <div className="font-medium">{token.symbol || "N/A"}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Address:</span>
                  <div className="font-mono text-xs">
                    {token.address || "N/A"}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Creator:</span>
                  <div className="font-mono text-xs">
                    {token.creator || "N/A"}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Created:</span>
                  <div className="text-xs">
                    {token.createdAt
                      ? new Date(token.createdAt).toLocaleString()
                      : "N/A"}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">State:</span>
                  <div className="font-medium">
                    {token.state !== undefined ? token.state : "N/A"}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Last Price:</span>
                  <div className="font-medium">
                    {token.lastPrice || "0"} AVAX
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Collateral:</span>
                  <div className="font-medium">
                    {token.collateral || "0"} AVAX
                  </div>
                </div>
              </div>

              {/* Statistics from Firestore */}
              {statistics && (
                <div className="space-y-2">
                  <h5 className="text-sm font-medium">Statistics:</h5>
                  <div className="bg-muted p-3 rounded text-xs">
                    <div>Volume: {statistics.volumeETH} AVAX</div>
                    <div>Trade Count: {statistics.tradeCount}</div>
                    <div>Unique Holders: {statistics.uniqueHolders}</div>
                    <div>Current Price: {statistics.currentPrice} AVAX</div>
                  </div>
                </div>
              )}

              {/* Image Position Debug */}
              {token.imagePosition && (
                <div className="space-y-2">
                  <h5 className="text-sm font-medium">Image Position Data:</h5>
                  <div className="bg-muted p-3 rounded text-xs font-mono">
                    <div>X: {token.imagePosition.x}%</div>
                    <div>Y: {token.imagePosition.y}%</div>
                    <div>Scale: {token.imagePosition.scale}x</div>
                    <div>Rotation: {token.imagePosition.rotation}°</div>
                    <div>Fit: {token.imagePosition.fit || "cover"}</div>
                  </div>
                </div>
              )}

              {/* Raw Data Preview */}
              <details className="space-y-2">
                <summary className="text-sm font-medium cursor-pointer hover:text-primary">
                  Raw Token Data (Click to expand)
                </summary>
                <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-40">
                  {JSON.stringify(token, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contract Data Debug Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-green-500" />
            Live Contract Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Price (Raw):</span>
                <div className="font-mono text-xs">
                  {contractData.priceFormatted}
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Collateral (Raw):</span>
                <div className="font-mono text-xs">
                  {contractData.collateralFormatted}
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Contract State:</span>
                <div className="font-medium">{contractData.state}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Loading:</span>
                <Badge
                  variant={contractData.isLoading ? "secondary" : "outline"}
                >
                  {contractData.isLoading ? "Loading" : "Loaded"}
                </Badge>
              </div>
            </div>

            {contractData.error && (
              <div className="text-sm text-red-500 bg-red-50 p-2 rounded">
                Contract Error: {contractData.error.message}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Price Hook Debug Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-purple-500" />
            Price Hook Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Formatted Price:</span>
                <div className="font-medium">{priceData.formatted}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Raw Price:</span>
                <div className="font-mono text-xs">{priceData.raw}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Wei Value:</span>
                <div className="font-mono text-xs">
                  {priceData.wei?.toString() || "N/A"}
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Loading:</span>
                <Badge variant={priceData.isLoading ? "secondary" : "outline"}>
                  {priceData.isLoading ? "Loading" : "Loaded"}
                </Badge>
              </div>
            </div>

            {priceData.error && (
              <div className="text-sm text-red-500 bg-red-50 p-2 rounded">
                Price Error: {priceData.error}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
