// components/trading/chart/ChartAnalytics.tsx
"use client";
import React, { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Activity, BarChart3 } from "lucide-react";
import { Token, Trade } from "@/types";
import { ChartData } from "./types";
import { useUnifiedTokenPrice } from "@/final-hooks/useUnifiedTokenPrice";
import { Address } from "viem";
import { formatTokenPrice } from "@/utils/tokenPriceFormatter";
import { FACTORY_CONSTANTS } from "@/types";

interface ChartAnalyticsProps {
  token: Token;
  trades: Trade[];
  chartData: ChartData;
  primaryColor: string;
}

export function ChartAnalytics({
  token,
  trades,
  chartData,
  primaryColor,
}: ChartAnalyticsProps) {
  // Get current price using unified price hook for consistency
  const { formatted: currentPrice, isLoading: priceLoading } =
    useUnifiedTokenPrice(token.address as Address);

  // Calculate analytics
  const analytics = useMemo(() => {
    // Get trade count from token statistics (more accurate than counting visible trades)
    const tradeCountFromToken = token.statistics?.tradeCount || 0;

    // Filter valid trades for volume and buy pressure calculations
    const validTrades = trades.filter((trade) => {
      const price = parseFloat(trade.pricePerToken);
      return (
        trade.pricePerToken && trade.timestamp && !isNaN(price) && price > 0
      );
    });

    // If no statistics available and no valid trades, return empty state
    if (tradeCountFromToken === 0 && validTrades.length === 0) {
      return {
        tradeCount: 0,
        totalVolume: "0.0000",
        buyPressure: 0,
        priceChange: 0,
        priceDirection: "neutral" as "up" | "down" | "neutral",
      };
    }

    // Calculate volume - use token statistics if available, otherwise calculate from visible trades
    let totalVolumeAVAX = 0;
    if (token.statistics?.volumeETH) {
      // Use pre-calculated volume from token statistics
      totalVolumeAVAX = parseFloat(token.statistics.volumeETH);
    } else if (validTrades.length > 0) {
      // Fallback: calculate from visible trades
      const totalVolumeWei = validTrades.reduce((sum, trade) => {
        if (!trade.ethAmount) return sum;
        const ethAmount = parseFloat(trade.ethAmount);
        if (isNaN(ethAmount) || ethAmount <= 0) return sum;
        return sum + ethAmount;
      }, 0);
      totalVolumeAVAX = totalVolumeWei / 1e18;
    }

    // Calculate buy pressure from visible trades (this is still accurate from recent trades)
    let buyPressure = 0;
    if (validTrades.length > 0) {
      const buyTrades = validTrades.filter((t) => t.type === "buy");
      buyPressure = buyTrades.length / validTrades.length;
    }

    // Calculate price change from genesis to latest trade
    let priceChange = 0;
    let priceDirection: "up" | "down" | "neutral" = "neutral";

    if (chartData.points.length >= 2) {
      const genesisPoint = chartData.points.find((point) => point.isGenesis);
      const latestTradePoint = chartData.points
        .filter((point) => !point.isGenesis)
        .slice(-1)[0];

      if (genesisPoint && latestTradePoint) {
        const genesisPrice = genesisPoint.price;
        const latestPrice = latestTradePoint.price;

        if (genesisPrice > 0) {
          priceChange = ((latestPrice - genesisPrice) / genesisPrice) * 100;
          priceDirection =
            priceChange > 0 ? "up" : priceChange < 0 ? "down" : "neutral";
        }
      }
    }

    return {
      tradeCount: tradeCountFromToken, // Use accurate count from token statistics
      totalVolume: totalVolumeAVAX.toFixed(4),
      buyPressure,
      priceChange,
      priceDirection,
    };
  }, [trades, chartData.points, token.statistics]);

  // Get current price for display
  const getCurrentPrice = () => {
    if (!priceLoading && currentPrice && currentPrice !== "0.000000") {
      return currentPrice;
    }
    // Fallback to token's lastPrice
    if (token.lastPrice && parseFloat(token.lastPrice) > 0) {
      return formatTokenPrice(token.lastPrice);
    }
    // Final fallback to initial price
    return formatTokenPrice(FACTORY_CONSTANTS.INITIAL_PRICE);
  };

  const displayPrice = getCurrentPrice();

  return (
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
      {/* Current Price and Change */}
      <div className="flex items-center gap-4">
        <div className="text-3xl font-bold text-primary">
          {displayPrice} AVAX
        </div>
        {analytics.priceDirection !== "neutral" && (
          <Badge
            variant="outline"
            className={`flex items-center gap-1 ${
              analytics.priceDirection === "up"
                ? "text-green-400 border-green-400/30 bg-green-400/10"
                : "text-red-400 border-red-400/30 bg-red-400/10"
            }`}
          >
            {analytics.priceDirection === "up" ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {analytics.priceChange > 0 ? "+" : ""}
            {analytics.priceChange.toFixed(2)}%
          </Badge>
        )}
      </div>

      {/* Analytics Cards */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 px-3 py-2 bg-primary/10 rounded-lg border border-primary/20">
          <Activity className="h-4 w-4 text-primary" />
          <div className="text-sm">
            <span className="font-semibold text-foreground">
              {analytics.tradeCount}
            </span>
            <span className="text-muted-foreground ml-1">Trades</span>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-2 bg-primary/10 rounded-lg border border-primary/20">
          <TrendingUp className="h-4 w-4 text-primary" />
          <div className="text-sm">
            <span className="font-semibold text-foreground">
              {analytics.totalVolume}
            </span>
            <span className="text-muted-foreground ml-1">AVAX</span>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-2 bg-primary/10 rounded-lg border border-primary/20">
          <div
            className={`h-4 w-4 rounded-full ${
              analytics.buyPressure > 0.6
                ? "bg-green-400"
                : analytics.buyPressure > 0.4
                ? "bg-yellow-400"
                : "bg-red-400"
            }`}
          />
          <div className="text-sm">
            <span className="font-semibold text-foreground">
              {(analytics.buyPressure * 100).toFixed(0)}%
            </span>
            <span className="text-muted-foreground ml-1">Buy</span>
          </div>
        </div>
      </div>
    </div>
  );
}
