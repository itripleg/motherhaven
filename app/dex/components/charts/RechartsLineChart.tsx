// app/dex/components/charts/RechartsLineChart.tsx
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

// This interface defines the shape of the data that our chart will use
interface ChartPoint {
  price: number;
  formattedPrice: string;
  timeLabel: string;
  timestamp: number;
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
          Trade execution price
        </p>
      </motion.div>
    );
  }
  return null;
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

  // Calculate chart data with genesis point
  const chartData: ChartPoint[] = useMemo(() => {
    const genesisTimestamp = token.createdAt
      ? parseISO(token.createdAt).getTime()
      : Date.now();

    const genesisPoint = {
      timestamp: genesisTimestamp,
      priceInWei: parseUnits(token.initialPrice || "0.00001", 18),
    };

    const processedTrades = trades
      .map((trade) => {
        if (!trade.pricePerToken || !trade.timestamp) {
          return null;
        }

        const tradeTimestamp = parseISO(trade.timestamp).getTime();
        const priceInWei = parseUnits(trade.pricePerToken, 18);

        return {
          timestamp: tradeTimestamp,
          priceInWei,
        };
      })
      .filter(
        (point): point is { timestamp: number; priceInWei: bigint } =>
          point !== null
      );

    const allPoints = [...processedTrades, genesisPoint].sort(
      (a, b) => a.timestamp - b.timestamp
    );

    return allPoints.map((point) => ({
      price: priceToNumber(point.priceInWei),
      formattedPrice: formatTokenPrice(formatUnits(point.priceInWei, 18)),
      timeLabel: format(point.timestamp, "MMM d, h:mm a"),
      timestamp: point.timestamp,
    }));
  }, [trades, token.createdAt, token.initialPrice]);

  // Enhanced analytics calculation
  const analytics = useMemo(() => {
    if (trades.length === 0) {
      return {
        tradeCount: 0,
        totalVolume: "0.0000",
        buyPressure: 0,
        priceChange: 0,
        priceDirection: "neutral" as "up" | "down" | "neutral",
      };
    }

    // Calculate volume in AVAX
    const totalVolumeWei = trades.reduce((sum, trade) => {
      const ethAmount = parseFloat(trade.ethAmount) || 0;
      return sum + ethAmount;
    }, 0);

    const totalVolumeAVAX = totalVolumeWei / 1e18;
    const buyTrades = trades.filter((t) => t.type === "buy");
    const buyPressure = buyTrades.length / trades.length;

    // Calculate price change
    const firstPrice = chartData[0]?.price || 0;
    const lastPrice = chartData[chartData.length - 1]?.price || 0;
    const priceChange =
      firstPrice > 0 ? ((lastPrice - firstPrice) / firstPrice) * 100 : 0;
    const priceDirection =
      priceChange > 0 ? "up" : priceChange < 0 ? "down" : "neutral";

    return {
      tradeCount: trades.length,
      totalVolume: totalVolumeAVAX.toFixed(4),
      buyPressure,
      priceChange,
      priceDirection,
    };
  }, [trades, chartData]);

  const displayPrice = priceLoading ? "Loading..." : currentPrice || "0.000000";

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
      {/* Simplified Analytics Cards Only */}
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

      {/* Chart with no borders */}
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
                activeDot={{
                  r: 6,
                  stroke: primaryColor,
                  strokeWidth: 3,
                  fill: "hsl(var(--background))",
                  style: {
                    filter: `drop-shadow(0 0 6px ${primaryColor})`,
                  },
                }}
                style={{
                  filter: `drop-shadow(0 2px 4px ${primaryColor}40)`,
                }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-80 lg:h-96 space-y-4">
          <div className="text-6xl opacity-20">📈</div>
          <div className="text-center">
            <p className="text-lg font-medium text-muted-foreground">
              No trade data yet
            </p>
            <p className="text-sm text-muted-foreground/70">
              Chart will appear after the first trade
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
