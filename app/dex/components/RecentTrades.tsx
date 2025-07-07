// ===========================
// Fixed RecentTrades Component
// ===========================

// Fixed RecentTrades.tsx - Remove optimistic updates and validate data
"use client";

import React from "react";
import { useTrades } from "@/contexts/TradesContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatUnits } from "viem";
import { formatDistanceToNow, parseISO } from "date-fns";
import { ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { AddressComponent } from "@/components/AddressComponent";

interface RecentTradesProps {
  tokenAddress: string;
}

// Enhanced validation function for trades
const validateTradeForDisplay = (trade: any): boolean => {
  // Check for required fields
  if (
    !trade.trader ||
    !trade.tokenAmount ||
    !trade.ethAmount ||
    !trade.timestamp
  ) {
    return false;
  }

  // Check for valid amounts - both token and ETH amounts must be positive
  const tokenAmount = parseFloat(trade.tokenAmount);
  const ethAmount = parseFloat(trade.ethAmount);

  if (
    isNaN(tokenAmount) ||
    isNaN(ethAmount) ||
    tokenAmount <= 0 ||
    ethAmount <= 0
  ) {
    return false;
  }

  // Check for valid trade type
  if (trade.type !== "buy" && trade.type !== "sell") {
    return false;
  }

  // Check for valid address format
  if (!trade.trader.startsWith("0x") || trade.trader.length !== 42) {
    return false;
  }

  return true;
};

// Fixed timestamp formatting function
const formatTimestamp = (timestampStr: string): string => {
  try {
    const date = parseISO(timestampStr);

    // Validate the parsed date
    if (isNaN(date.getTime())) {
      console.error("Invalid date from timestamp:", timestampStr);
      return "Invalid date";
    }

    return formatDistanceToNow(date, { addSuffix: true });
  } catch (error) {
    console.error("Failed to format timestamp:", timestampStr, error);
    return "Invalid date";
  }
};

export default function RecentTrades({ tokenAddress }: RecentTradesProps) {
  const { trades, loading, error } = useTrades(tokenAddress);

  // Filter and validate trades
  const validTrades = React.useMemo(() => {
    return trades.filter(validateTradeForDisplay);
  }, [trades]);

  const renderSkeleton = () => (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-6 rounded-full" />
            <div className="space-y-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
          <Skeleton className="h-4 w-12" />
        </div>
      ))}
    </div>
  );

  return (
    <Card className="h-[600px] overflow-y-scroll scrollbar-thin">
      <CardHeader>
        <CardTitle className="text-base text-center">Recent Trades</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          renderSkeleton()
        ) : error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : validTrades.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-2 opacity-50">📊</div>
            <p className="text-sm text-muted-foreground">
              No valid trades yet.
            </p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Trades will appear here after successful transactions
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {validTrades.slice(0, 10).map((trade) => {
              // Additional validation at render time
              const tokenAmount = parseFloat(trade.tokenAmount);
              const ethAmount = parseFloat(trade.ethAmount);

              // Skip rendering if amounts are still invalid
              if (tokenAmount <= 0 || ethAmount <= 0) {
                return null;
              }

              return (
                <div
                  key={`${trade.transactionHash}-${trade.trader}-${trade.timestamp}`}
                  className="flex items-center justify-between text-sm p-2 rounded-lg hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {trade.type === "buy" ? (
                      <ArrowUpRight className="h-5 w-5 text-green-500" />
                    ) : (
                      <ArrowDownLeft className="h-5 w-5 text-red-500" />
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1">
                        <AddressComponent hash={trade.trader} type="address" />
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatTimestamp(trade.timestamp)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className={`font-mono text-sm ${
                        trade.type === "buy" ? "text-green-500" : "text-red-500"
                      }`}
                    >
                      {formatUnits(BigInt(trade.tokenAmount), 18).slice(0, 8)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatUnits(BigInt(trade.ethAmount), 18).slice(0, 6)}{" "}
                      AVAX
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
