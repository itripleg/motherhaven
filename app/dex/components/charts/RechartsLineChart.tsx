// Fixed RechartsLineChart.tsx - Proper genesis point handling
"use client";
import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Area,
  ComposedChart,
} from "recharts";
import { format, parseISO } from "date-fns";
import { formatUnits, parseUnits } from "viem";
import { Token, Trade } from "@/types";
import { useUnifiedTokenPrice } from "@/final-hooks/useUnifiedTokenPrice";
import { Address } from "viem";
import {
  formatTokenPrice,
  formatChartPrice,
  priceToNumber,
} from "@/utils/tokenPriceFormatter";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Activity, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";
import { FACTORY_CONSTANTS } from "@/types";

// This interface defines the shape of the data that our chart will use
interface ChartPoint {
  price: number;
  formattedPrice: string;
  timeLabel: string;
  timestamp: number;
  isGenesis?: boolean; // Mark genesis point for styling
}

// Props for the main component
interface RechartsLineChartProps {
  trades: Trade[];
  loading: boolean;
  token: Token;
}

// Enhanced custom tooltip component
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const dataPoint = payload[0].payload;
    const formattedPrice = dataPoint.formattedPrice;
    const isGenesis = dataPoint.isGenesis;

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="p-4 bg-background/95 backdrop-blur-md border border-primary/20 rounded-xl shadow-xl"
      >
        <p className="text-sm font-medium text-muted-foreground mb-2">
          {label}
        </p>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-primary" />
          <p className="text-lg font-bold text-primary">
            {formattedPrice} AVAX
          </p>
        </div>
        <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
          <BarChart3 className="h-3 w-3" />
          {isGenesis ? "Initial price" : "Trade execution price"}
        </p>
      </motion.div>
    );
  }
  return null;
};

// Validation function to filter out invalid trades
const validateTrade = (trade: Trade): boolean => {
  // Check for required fields
  if (!trade.pricePerToken || !trade.timestamp) {
    console.warn("Trade missing required fields:", trade);
    return false;
  }

  // Check for zero or negative prices
  const price = parseFloat(trade.pricePerToken);
  if (isNaN(price) || price <= 0) {
    console.warn("Trade has invalid price:", trade.pricePerToken);
    return false;
  }

  // Check for zero amounts (these shouldn't exist)
  if (trade.tokenAmount && trade.ethAmount) {
    const tokenAmount = parseFloat(trade.tokenAmount);
    const ethAmount = parseFloat(trade.ethAmount);

    if (tokenAmount <= 0 || ethAmount <= 0) {
      console.warn("Trade has zero amounts:", { tokenAmount, ethAmount });
      return false;
    }
  }

  // Check for reasonable timestamp
  const tradeTime = parseISO(trade.timestamp).getTime();
  const now = Date.now();
  const oneYearAgo = now - 365 * 24 * 60 * 60 * 1000;

  if (tradeTime < oneYearAgo || tradeTime > now + 60000) {
    // Allow 1 minute future for clock skew
    console.warn("Trade has unreasonable timestamp:", trade.timestamp);
    return false;
  }

  return true;
};

// The main chart component
export default function RechartsLineChart({
  trades,
  loading,
  token,
}: RechartsLineChartProps) {
  // Get current price using unified price hook for consistency
  const { formatted: currentPrice, isLoading: priceLoading } =
    useUnifiedTokenPrice(token.address as Address);

  // Get the primary color from CSS custom properties
  const primaryColor = useMemo(() => {
    if (typeof window !== "undefined") {
      const root = document.documentElement;
      const hsl = getComputedStyle(root).getPropertyValue("--primary").trim();
      if (hsl) {
        return `hsl(${hsl})`;
      }
    }
    return "#8b5cf6"; // Fallback color
  }, []);

  // Calculate chart data with proper genesis point
  const chartData: ChartPoint[] = useMemo(() => {
    // Filter and validate trades first
    const validTrades = trades.filter(validateTrade);

    // Sort trades by timestamp to ensure chronological order
    const sortedTrades = validTrades.sort((a, b) => {
      const timeA = parseISO(a.timestamp).getTime();
      const timeB = parseISO(b.timestamp).getTime();
      return timeA - timeB;
    });

    // Convert trades to chart points
    const tradePoints = sortedTrades.map((trade) => {
      const tradeTimestamp = parseISO(trade.timestamp).getTime();
      const priceInWei = parseUnits(trade.pricePerToken, 18);

      return {
        price: priceToNumber(priceInWei),
        formattedPrice: formatTokenPrice(trade.pricePerToken),
        timeLabel: format(tradeTimestamp, "MMM d, h:mm a"),
        timestamp: tradeTimestamp,
        isGenesis: false,
      };
    });

    // Always add genesis point if we have token creation time
    if (token.createdAt) {
      const creationTime = parseISO(token.createdAt).getTime();
      const initialPrice = parseFloat(FACTORY_CONSTANTS.INITIAL_PRICE);

      const genesisPoint: ChartPoint = {
        price: initialPrice,
        formattedPrice: formatTokenPrice(FACTORY_CONSTANTS.INITIAL_PRICE),
        timeLabel: format(creationTime, "MMM d, h:mm a"),
        timestamp: creationTime,
        isGenesis: true,
      };

      // Insert genesis point at the beginning, ensuring chronological order
      const allPoints = [genesisPoint, ...tradePoints];

      // Sort again to ensure proper chronological order
      return allPoints.sort((a, b) => a.timestamp - b.timestamp);
    }

    // If no creation time, just return trade points
    return tradePoints;
  }, [trades, token.createdAt]);

  // Enhanced analytics calculation with validation
  const analytics = useMemo(() => {
    // Only use validated trades for analytics
    const validTrades = trades.filter(validateTrade);

    if (validTrades.length === 0) {
      return {
        tradeCount: 0,
        totalVolume: "0.0000",
        buyPressure: 0,
        priceChange: 0,
        priceDirection: "neutral" as "up" | "down" | "neutral",
      };
    }

    // Calculate volume in AVAX with validation
    const totalVolumeWei = validTrades.reduce((sum, trade) => {
      if (!trade.ethAmount) return sum;
      const ethAmount = parseFloat(trade.ethAmount);
      if (isNaN(ethAmount) || ethAmount <= 0) return sum;
      return sum + ethAmount;
    }, 0);

    const totalVolumeAVAX = totalVolumeWei / 1e18;
    const buyTrades = validTrades.filter((t) => t.type === "buy");
    const buyPressure = buyTrades.length / validTrades.length;

    // Calculate price change from genesis to latest trade
    let priceChange = 0;
    let priceDirection: "up" | "down" | "neutral" = "neutral";

    if (chartData.length >= 2) {
      // Find genesis and latest actual trade prices
      const genesisPoint = chartData.find((point) => point.isGenesis);
      const latestTradePoint = chartData
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
      tradeCount: validTrades.length,
      totalVolume: totalVolumeAVAX.toFixed(4),
      buyPressure,
      priceChange,
      priceDirection,
    };
  }, [trades, chartData]);

  // Get current price - use lastPrice from token as fallback for consistency
  const getCurrentPrice = () => {
    if (!priceLoading && currentPrice && currentPrice !== "0.000000") {
      return currentPrice;
    }
    // Fallback to token's lastPrice for consistency
    if (token.lastPrice && parseFloat(token.lastPrice) > 0) {
      return formatTokenPrice(token.lastPrice);
    }
    // Final fallback to initial price if no trades yet
    return formatTokenPrice(FACTORY_CONSTANTS.INITIAL_PRICE);
  };

  const displayPrice = getCurrentPrice();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 text-center space-y-4">
        <div>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="mx-auto w-8 h-8 border-2 border-primary border-t-transparent rounded-full mb-4"
          />
          <p className="text-muted-foreground">Loading Chart Data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full space-y-6">
      {/* Analytics Cards */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
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

      {/* Chart - Show genesis point + trades or just current price */}
      {chartData.length > 0 ? (
        <div className="h-80 lg:h-96 p-6">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              margin={{
                top: 10,
                right: 10,
                left: 0,
                bottom: 40,
              }}
            >
              {/* Simple, effective grid */}
              <CartesianGrid
                strokeDasharray="2 2"
                stroke="hsl(var(--muted-foreground))"
                strokeOpacity={0.1}
              />

              {/* Gradient Definition */}
              <defs>
                <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor={primaryColor}
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="100%"
                    stopColor={primaryColor}
                    stopOpacity={0.05}
                  />
                </linearGradient>
              </defs>

              <XAxis
                dataKey="timeLabel"
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
                angle={-45}
                textAnchor="end"
                height={40}
                tick={{ fill: "hsl(var(--muted-foreground))" }}
              />

              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => formatChartPrice(Number(value))}
                domain={["dataMin", "dataMax"]}
                width={80}
                tick={{ fill: "hsl(var(--muted-foreground))" }}
              />

              <Tooltip content={<CustomTooltip />} />

              {/* Area fill under the line */}
              <Area
                type="monotone"
                dataKey="price"
                stroke="none"
                fill="url(#priceGradient)"
                fillOpacity={1}
              />

              {/* Main price line */}
              <Line
                type="monotone"
                dataKey="price"
                stroke={primaryColor}
                strokeWidth={3}
                dot={false}
                activeDot={(props: any) => {
                  // Special styling for genesis point when hovered
                  if (props.payload?.isGenesis) {
                    return (
                      <circle
                        cx={props.cx}
                        cy={props.cy}
                        r={8}
                        fill={primaryColor}
                        stroke="hsl(var(--background))"
                        strokeWidth={3}
                        opacity={1}
                        style={{
                          filter: `drop-shadow(0 0 8px ${primaryColor})`,
                        }}
                      />
                    );
                  }
                  // Default active dot for trades
                  return (
                    <circle
                      cx={props.cx}
                      cy={props.cy}
                      r={6}
                      fill="hsl(var(--background))"
                      stroke={primaryColor}
                      strokeWidth={3}
                      style={{
                        filter: `drop-shadow(0 0 6px ${primaryColor})`,
                      }}
                    />
                  );
                }}
                style={{
                  filter: `drop-shadow(0 2px 4px ${primaryColor}40)`,
                }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      ) : (
        // Show current price when no chart data
        <div className="flex flex-col items-center justify-center h-80 lg:h-96 space-y-4">
          <div className="text-center space-y-2">
            <div className="text-6xl opacity-20">📈</div>
            <p className="text-lg font-medium text-primary">
              Current Price: {displayPrice} AVAX
            </p>
            <p className="text-sm text-muted-foreground">
              Chart will show price history starting from{" "}
              {formatTokenPrice(FACTORY_CONSTANTS.INITIAL_PRICE)} AVAX
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
