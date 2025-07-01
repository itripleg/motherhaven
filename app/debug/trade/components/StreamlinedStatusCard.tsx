// app/debug/trade/components/StreamlinedStatusCard.tsx

"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, ExternalLink, Activity } from "lucide-react";
import { formatTokenPrice } from "@/utils/tokenPriceFormatter";

interface StreamlinedStatusCardProps {
  tokenAddress: string;
  tokenData: any;
  userAddress?: string;
  isConnected: boolean;
  tokenExists: boolean;
  refreshKey: number;
}

export function StreamlinedStatusCard({
  tokenAddress,
  tokenData,
  userAddress,
  isConnected,
  tokenExists,
  refreshKey,
}: StreamlinedStatusCardProps) {
  // Determine overall status
  const getOverallStatus = () => {
    if (!isConnected)
      return {
        color: "destructive",
        text: "Wallet Disconnected",
        icon: AlertCircle,
      };
    if (!tokenExists)
      return { color: "destructive", text: "Invalid Token", icon: AlertCircle };
    return { color: "default", text: "Ready to Trade", icon: CheckCircle };
  };

  const status = getOverallStatus();
  const StatusIcon = status.icon;

  return (
    <Card className="border-blue-200 bg-blue-50/30 dark:bg-blue-950/20">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          {/* Left: Status & Token Info */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <StatusIcon
                className={`h-5 w-5 ${
                  status.color === "destructive"
                    ? "text-red-500"
                    : "text-green-500"
                }`}
              />
              <Badge variant={status.color as any}>{status.text}</Badge>
            </div>

            {tokenExists && tokenData && (
              <div className="flex items-center gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Token:</span>
                  <span className="font-medium ml-1">
                    {tokenData.name} ({tokenData.symbol})
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Price:</span>
                  <span className="font-mono ml-1">
                    {formatTokenPrice(tokenData.currentPrice || "0")} AVAX
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">State:</span>
                  <span className="font-mono ml-1">{tokenData.state}</span>
                </div>
              </div>
            )}
          </div>

          {/* Right: Actions & Info */}
          <div className="flex items-center gap-3">
            {isConnected && (
              <div className="text-xs text-muted-foreground">
                {userAddress?.slice(0, 6)}...{userAddress?.slice(-4)}
              </div>
            )}

            {tokenExists && (
              <Button
                size="sm"
                variant="outline"
                className="text-xs"
                onClick={() => window.open(`/dex/${tokenAddress}`, "_blank")}
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Open Token
              </Button>
            )}

            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Activity className="h-3 w-3" />#{refreshKey}
            </div>
          </div>
        </div>

        {/* Warning Messages */}
        {!isConnected && (
          <div className="mt-3 flex items-center gap-2 text-yellow-700 dark:text-yellow-400 text-sm">
            <AlertCircle className="h-4 w-4" />
            <span>Connect your wallet to enable trading functionality</span>
          </div>
        )}

        {!tokenExists && isConnected && (
          <div className="mt-3 flex items-center gap-2 text-red-700 dark:text-red-400 text-sm">
            <AlertCircle className="h-4 w-4" />
            <span>Enter a valid token address in the URL (?token=0x...)</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
