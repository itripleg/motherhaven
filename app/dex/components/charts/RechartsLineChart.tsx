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

// This interface defines the shape of the data that our chart will use
interface ChartPoint {
  price: number;
  formattedPrice: string;
  timeLabel: string;
  timestamp: number; // Add timestamp for proper sorting
}

// Props for the main component
interface RechartsLineChartProps {
  trades: Trade[];
  loading: boolean;
  token: Token;
}

// A custom tooltip component for the chart
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    // Get the formatted price that was already calculated for this data point
    const dataPoint = payload[0].payload;
    const formattedPrice = dataPoint.formattedPrice; // Use the pre-calculated formatted price

    return (
      <div className="p-3 bg-gray-800/90 backdrop-blur-sm border border-gray-600 rounded-lg text-white shadow-lg">
        <p className="text-sm font-medium text-gray-300 mb-1">{label}</p>
        <p className="text-lg font-bold text-green-400">
          {formattedPrice} AVAX
        </p>
        <p className="text-xs text-gray-400 mt-1">
          📊 Trade avg price (from Firestore)
        </p>
      </div>
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

  // useMemo will re-calculate the chart data only when its dependencies change
  const chartData: ChartPoint[] = useMemo(() => {
    // 1. Create the "Genesis Point" from the token's creation data
    const genesisTimestamp = token.createdAt
      ? parseISO(token.createdAt).getTime()
      : Date.now();

    const genesisPoint = {
      timestamp: genesisTimestamp,
      priceInWei: parseUnits(token.initialPrice || "0.00001", 18),
    };

    // 2. Process the raw trade data from Firestore
    const processedTrades = trades
      .map((trade) => {
        // Safeguard against bad data
        if (!trade.pricePerToken || !trade.timestamp) {
          return null;
        }

        const tradeTimestamp = parseISO(trade.timestamp).getTime();

        // Use the pricePerToken that's already stored in the trade
        // This should match what the factory contract stored in lastPrice mapping
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

    // 3. Combine the genesis point with actual trades and sort chronologically
    const allPoints = [...processedTrades, genesisPoint].sort(
      (a, b) => a.timestamp - b.timestamp
    );

    // 4. Format the sorted points into the final shape for the chart
    return allPoints.map((point) => ({
      price: priceToNumber(point.priceInWei), // Convert to number for chart calculations
      formattedPrice: formatTokenPrice(formatUnits(point.priceInWei, 18)), // Use unified formatting
      timeLabel: format(point.timestamp, "MMM d, h:mm a"),
      timestamp: point.timestamp, // Keep timestamp for proper sorting
    }));
  }, [trades, token.createdAt, token.initialPrice]);

  // Calculate analytics with proper formatting
  const analytics = useMemo(() => {
    if (trades.length === 0) {
      return {
        tradeCount: 0,
        totalVolume: "0.0000",
        buyPressure: 0,
      };
    }

    // Calculate volume in AVAX (not wei)
    const totalVolumeWei = trades.reduce((sum, trade) => {
      const ethAmount = parseFloat(trade.ethAmount) || 0;
      return sum + ethAmount;
    }, 0);

    // Convert from wei to AVAX and format
    const totalVolumeAVAX = totalVolumeWei / 1e18;

    const buyTrades = trades.filter((t) => t.type === "buy");
    const buyPressure = buyTrades.length / trades.length;

    return {
      tradeCount: trades.length,
      totalVolume: totalVolumeAVAX.toFixed(4),
      buyPressure,
    };
  }, [trades]);

  // The price displayed in the header uses the current live price from unified hook
  const displayPrice = priceLoading ? "Loading..." : currentPrice || "0.000000";

  if (loading) {
    return (
      <div className="text-center text-gray-400 animate-pulse">
        Loading Chart Data...
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      {/* Chart Header */}
      <div className="mb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        {" "}
        {/* Reduced margin bottom */}
        <div>
          <h3 className="text-base font-bold text-white">
            {" "}
            {/* Slightly smaller text */}
            {token.symbol} Price History
          </h3>
          <p className="text-xl text-green-400">
            {" "}
            {/* Slightly smaller text */}
            {displayPrice} AVAX
            {priceLoading && (
              <span className="text-xs text-gray-400 ml-2">
                🔄 Loading contract.lastPrice...
              </span>
            )}
            {!priceLoading && (
              <span className="text-xs text-gray-400 ml-2">
                🔗 contract.lastPrice (most recent trade avg)
              </span>
            )}
          </p>
        </div>
        {/* Analytics - Responsive */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <span className="whitespace-nowrap">
            Trades: {analytics.tradeCount}
          </span>
          <span className="whitespace-nowrap">
            Volume: {analytics.totalVolume} AVAX
          </span>
          <span className="whitespace-nowrap">
            Buy Pressure: {(analytics.buyPressure * 100).toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Chart */}
      {chartData.length > 0 ? (
        <div className="h-72 sm:h-80 md:h-96 max-h-96">
          {" "}
          {/* Cap at 384px (96 * 4px) */}
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{
                top: 5,
                right: 10,
                left: 0,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
              <XAxis
                dataKey="timeLabel"
                stroke="#9ca3af"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis
                stroke="#9ca3af"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                // Use the same formatting as tooltip for consistency
                tickFormatter={(value) => formatChartPrice(Number(value))}
                domain={["dataMin", "dataMax"]}
                width={80} // Fixed width to prevent overflow
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="price"
                stroke="#4ade80"
                strokeWidth={2}
                dot={chartData.length < 50}
                activeDot={{ r: 4, stroke: "#4ade80", strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="flex items-center justify-center h-72 sm:h-80 md:h-96 max-h-96">
          <p className="text-gray-500">No trade data available.</p>
        </div>
      )}
    </div>
  );
}
