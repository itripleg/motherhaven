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
} from "lucide-react";
import { useToken } from "@/contexts/TokenContext";
import { Address } from "viem";

interface TokenDataDisplayProps {
  tokenAddress: string;
  onRefresh: () => void;
}

export function TokenDataDisplay({
  tokenAddress,
  onRefresh,
}: TokenDataDisplayProps) {
  const { token, loading, error } = useToken(tokenAddress);

  const getStatusIcon = () => {
    if (loading)
      return <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />;
    if (error) return <XCircle className="h-4 w-4 text-red-500" />;
    if (token) return <CheckCircle className="h-4 w-4 text-green-500" />;
    return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
  };

  const getStatusBadge = () => {
    if (loading) return <Badge variant="secondary">Loading</Badge>;
    if (error) return <Badge variant="destructive">Error</Badge>;
    if (token) return <Badge variant="default">Loaded</Badge>;
    return <Badge variant="outline">No Data</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5 text-blue-500" />
          Token Context Data
          {getStatusBadge()}
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
      <CardContent className="space-y-4">
        {/* Status Overview */}
        <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
          {getStatusIcon()}
          <div className="flex-1">
            <div className="font-medium">
              {loading
                ? "Loading token data..."
                : error
                ? "Failed to load token data"
                : token
                ? `Token: ${token.name} (${token.symbol})`
                : "No token data available"}
            </div>
            {error && <div className="text-sm text-red-500 mt-1">{error}</div>}
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
            </div>

            {/* Image Position Debug */}
            {token.imagePosition && (
              <div className="space-y-2">
                <h5 className="text-sm font-medium">Image Position Data:</h5>
                <div className="bg-muted p-3 rounded text-xs font-mono">
                  <div>X: {token.imagePosition.x}%</div>
                  <div>Y: {token.imagePosition.y}%</div>
                  <div>Scale: {token.imagePosition.scale}x</div>
                  <div>Rotation: {token.imagePosition.rotation}°</div>
                  {/* @ts-expect-error type error */}
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
  );
}
