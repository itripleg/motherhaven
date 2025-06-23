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
import { format, fromUnixTime } from "date-fns";
import { formatUnits, parseUnits } from "viem";
import { Token, Trade } from "@/types"; // Use the official types
import { useFactoryContract } from "@/new-hooks/useFactoryContract";

// 1. Update props to accept the full Token object
interface RechartsLineChartProps {
  trades: Trade[];
  loading: boolean;
  token: Token; // Changed from tokenSymbol
}

// 2. Update the tooltip to use a pre-formatted price string
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-2 bg-gray-800/80 backdrop-blur-sm border border-gray-700 rounded-lg text-white">
        {/* It now receives a 'formattedPrice' directly from the payload */}
        <p className="label text-sm">{`Price: ${payload[0].payload.formattedPrice} AVAX`}</p>
        <p className="intro text-xs text-gray-400">{`On: ${label}`}</p>
      </div>
    );
  }
  return null;
};

export default function RechartsLineChart({
  trades,
  loading,
  token,
}: RechartsLineChartProps) {
  const { formatPriceDecimals } = useFactoryContract();

  const { chartData, displayPrice } = useMemo(() => {
    // 3. Create a "Genesis Point" for the chart's origin
    // This ensures there are always at least two points to draw a line from the start.
    const genesisPoint = {
      timestamp: token.createdAt
        ? Math.floor(new Date(token.createdAt).getTime() / 1000)
        : Date.now() / 1000 - 3600,
      priceInWei: parseUnits(token.initialPrice, 18), // Use the token's initialPrice
    };

    const processedTrades = trades.map((trade) => ({
      timestamp: trade.timestamp,
      priceInWei: (BigInt(trade.ethAmount) * 10n ** 18n) / BigInt(trade.amount),
    }));

    // Combine the genesis point with actual trades
    const allPoints = [genesisPoint, ...processedTrades];

    const dataForChart = allPoints.map((point) => {
      const priceAsNumber = parseFloat(formatUnits(point.priceInWei, 18));
      return {
        // Data for plotting
        timestamp: format(fromUnixTime(point.timestamp), "MMM d, h:mm a"),
        price: priceAsNumber,
        // 4. Pre-format the price for consistent display in tooltips
        formattedPrice: formatPriceDecimals(point.priceInWei),
      };
    });

    // The final display price is always derived from the very last point in our series.
    const lastDisplayPrice =
      dataForChart.length > 0
        ? dataForChart[dataForChart.length - 1].formattedPrice
        : formatPriceDecimals(genesisPoint.priceInWei);

    return { chartData: dataForChart, displayPrice: lastDisplayPrice };
  }, [trades, token, formatPriceDecimals]);

  if (loading) {
    return (
      <div className="text-center text-gray-400 animate-pulse">
        Loading Chart...
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-white">
          {token.symbol} Price History
        </h3>
        <p className="text-2xl text-green-400">{displayPrice} AVAX</p>
      </div>
      <ResponsiveContainer width="100%" height="80%">
        <LineChart
          data={chartData}
          margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
          <XAxis
            dataKey="timestamp"
            stroke="#9ca3af"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="#9ca3af"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${value.toFixed(5)}`}
            domain={["dataMin", "dataMax"]}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="price"
            stroke="#4ade80"
            strokeWidth={2}
            dot={true} /* Enable dots */
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
