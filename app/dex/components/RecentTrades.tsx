// ===========================
// Themed RecentTrades Component
// ===========================

"use client";

import React from "react";
import { useTrades } from "@/contexts/TradesContext";
import { formatUnits } from "viem";
import { formatDistanceToNow, parseISO } from "date-fns";
import { ArrowUpRight, ArrowDownLeft, Activity } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { AddressComponent } from "@/components/AddressComponent";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";

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
    !trade.timestamp ||
    !trade.transactionHash // Add this validation
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

  // Check for valid trader address format
  if (!trade.trader.startsWith("0x") || trade.trader.length !== 42) {
    return false;
  }

  // Check for valid transaction hash format
  if (
    !trade.transactionHash.startsWith("0x") ||
    trade.transactionHash.length !== 66
  ) {
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

// Format large numbers for display
const formatAmount = (amount: string, decimals: number = 6): string => {
  try {
    const formatted = formatUnits(BigInt(amount), 18);
    const num = parseFloat(formatted);

    if (num >= 1000000) {
      return (num / 1000000).toFixed(2) + "M";
    } else if (num >= 1000) {
      return (num / 1000).toFixed(2) + "K";
    } else if (num >= 1) {
      return num.toFixed(2);
    } else {
      return num.toFixed(decimals);
    }
  } catch (error) {
    return "0";
  }
};

export default function RecentTrades({ tokenAddress }: RecentTradesProps) {
  const { trades, loading, error } = useTrades(tokenAddress);

  // Filter and validate trades
  const validTrades = React.useMemo(() => {
    return trades.filter(validateTradeForDisplay);
  }, [trades]);

  const renderSkeleton = () => (
    <div className="space-y-3">
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className="flex items-center gap-3 p-3 rounded-lg"
        >
          <Skeleton className="h-5 w-5 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
          <div className="text-right space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-3 w-12" />
          </div>
        </motion.div>
      ))}
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-background/50 backdrop-blur-sm rounded-xl overflow-hidden">
      {/* Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {loading ? (
          <div className="p-4">{renderSkeleton()}</div>
        ) : error ? (
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="text-center space-y-2">
              <div className="text-2xl opacity-50">⚠️</div>
              <p className="text-sm text-destructive font-medium">
                Error loading trades
              </p>
              <p className="text-xs text-muted-foreground">{error}</p>
            </div>
          </div>
        ) : validTrades.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="text-center space-y-3">
              <div className="text-4xl opacity-30">📊</div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">
                  No trades yet
                </p>
                <p className="text-xs text-muted-foreground/70">
                  Trades will appear here after transactions
                </p>
              </div>
            </div>
          </div>
        ) : (
          <ScrollArea className="flex-1">
            <div className="space-y-2 p-4">
              <AnimatePresence>
                {validTrades.slice(0, 20).map((trade, index) => {
                  // Additional validation at render time
                  const tokenAmount = parseFloat(trade.tokenAmount);
                  const ethAmount = parseFloat(trade.ethAmount);

                  // Skip rendering if amounts are still invalid
                  if (tokenAmount <= 0 || ethAmount <= 0) {
                    return null;
                  }

                  const isBuy = trade.type === "buy";

                  return (
                    <motion.div
                      key={`${trade.transactionHash}-${trade.trader}-${trade.timestamp}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.3, delay: index * 0.02 }}
                      className="group"
                    >
                      <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/20 transition-all duration-200 border border-transparent hover:border-border/30">
                        {/* Trade Type Icon */}
                        <div
                          className={`p-1.5 rounded-lg ${
                            isBuy
                              ? "bg-green-500/20 text-green-400"
                              : "bg-red-500/20 text-red-400"
                          }`}
                        >
                          {isBuy ? (
                            <ArrowUpRight className="h-4 w-4" />
                          ) : (
                            <ArrowDownLeft className="h-4 w-4" />
                          )}
                        </div>

                        {/* Trade Details */}
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center gap-2">
                            <AddressComponent
                              hash={trade.transactionHash}
                              type="tx"
                              className="text-sm font-medium truncate"
                              compact={false}
                              showActions={true}
                            />
                            <div
                              className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                isBuy
                                  ? "bg-green-500/20 text-green-400"
                                  : "bg-red-500/20 text-red-400"
                              }`}
                            >
                              {isBuy ? "BUY" : "SELL"}
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatTimestamp(trade.timestamp)}
                          </div>
                        </div>

                        {/* Amounts */}
                        <div className="text-right space-y-1">
                          <div className="text-sm font-mono font-medium text-foreground">
                            {formatAmount(trade.tokenAmount, 2)}
                          </div>
                          <div className="text-xs text-muted-foreground font-mono">
                            {formatAmount(trade.ethAmount, 4)} AVAX
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {/* Show more indicator if there are many trades */}
              {validTrades.length > 20 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-3"
                >
                  <div className="text-xs text-muted-foreground">
                    Showing latest 20 of {validTrades.length} trades
                  </div>
                </motion.div>
              )}
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
}
