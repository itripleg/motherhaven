"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InfoIcon, ArrowUpIcon, ArrowDownIcon } from "lucide-react";
import { useMemo } from "react";
import { useTokenTrades } from "@/new-hooks/useTokenTrades"; // 1. Use our centralized hook
import { Trade } from "@/types"; // 2. Use the official, unified Trade type
import { formatUnits, Address } from "viem";

interface RecentTradesProps {
  tokenAddress: string;
}

// Helper function for safe, consistent formatting
const formatDisplayAmount = (amountInWei: string): string => {
  try {
    const value = parseFloat(formatUnits(BigInt(amountInWei), 18));
    if (value < 0.0001) return value.toFixed(6);
    return value.toFixed(4);
  } catch {
    return "0.00";
  }
};

export default function RecentTrades({ tokenAddress }: RecentTradesProps) {
  // 3. Get all data from our single, robust hook. No more internal fetching!
  const { trades, loading, error } = useTokenTrades(tokenAddress as Address);

  // 4. Calculate buy/sell pressure with useMemo for efficiency.
  const buySellPressure = useMemo(() => {
    return trades.reduce(
      (acc, trade) => {
        try {
          const ethAmount = parseFloat(
            formatUnits(BigInt(trade.ethAmount), 18)
          );
          if (trade.type === "buy") {
            acc.buyAmount += ethAmount;
          } else {
            acc.sellAmount += ethAmount;
          }
        } catch {}
        return acc;
      },
      { buyAmount: 0, sellAmount: 0 }
    );
  }, [trades]);

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleTimeString([], {
      // Assuming timestamp is in seconds
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <Card className="w-full hidden md:block max-w-md h-[420px]">
        <CardHeader className="py-3">
          <CardTitle className="text-lg">Loading trades...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full hidden md:block max-w-md h-[420px]">
        <CardHeader className="py-3">
          <CardTitle className="text-lg text-red-500">{error}</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="w-full hidden md:block max-w-md h-[420px]">
      <CardHeader className="py-3">
        <CardTitle className="text-lg flex items-center gap-2">
          Recent Trades
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 overflow-auto max-h-[360px] scrollbar-thin">
        <div className="bg-card rounded-lg p-3 border">
          <h4 className="text-sm font-medium mb-2">Buy/Sell Volume</h4>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-green-500">
              <ArrowUpIcon className="h-4 w-4" />
              <span>{buySellPressure.buyAmount.toFixed(4)} ETH</span>
            </div>
            <div className="flex items-center gap-2 text-red-500">
              <ArrowDownIcon className="h-4 w-4" />
              <span>{buySellPressure.sellAmount.toFixed(4)} ETH</span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          {trades.length === 0 ? (
            <div className="text-center text-muted-foreground py-4">
              No trades yet
            </div>
          ) : (
            // 5. The JSX can remain largely the same, as it now receives correctly typed data.
            [...trades].reverse().map((trade, index) => (
              <div
                key={`${trade.timestamp}-${index}`}
                className="bg-card rounded-lg p-2 border hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-sm font-bold ${
                      trade.type === "buy" ? "text-green-500" : "text-red-500"
                    }`}
                  >
                    {trade.type.toUpperCase()}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatTimestamp(trade.timestamp)}
                  </span>
                </div>
                <div className="text-xs grid grid-cols-2 gap-1 mt-1">
                  <div>
                    <span className="text-muted-foreground">Amount:</span>{" "}
                    {formatDisplayAmount(trade.amount)}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Value:</span>{" "}
                    {formatDisplayAmount(trade.ethAmount)} ETH
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
