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
import { Token, Trade } from "@/types";
import { useFactoryContract } from "@/new-hooks/useFactoryContract";

interface RechartsLineChartProps {
  trades: Trade[];
  loading: boolean;
  token: Token;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-2 bg-gray-800/80 backdrop-blur-sm border border-gray-700 rounded-lg text-white">
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
  // Use the central formatter from the hook
  const { formatValue } = useFactoryContract();

  const { chartData, displayPrice } = useMemo(() => {
    // Genesis point ensures the chart starts from the token's creation
    const genesisPoint = {
      timestamp: token.createdAt
        ? Math.floor(new Date(token.createdAt).getTime() / 1000)
        : Date.now() / 1000,
      // Use parseUnits to convert the friendly initialPrice string into a bigint
      priceInWei: parseUnits(token.initialPrice, 18),
    };

    const processedTrades = trades.map((trade) => {
      // FIX: Correctly calculate price per token from trade data.
      // This assumes trade.ethAmount and trade.tokenAmount are in their smallest units (Wei).
      const priceInWei =
        (BigInt(trade.ethAmount) * BigInt(10 ** 18)) /
        BigInt(trade.tokenAmount);
      return {
        timestamp: Number(trade.timestamp), // Ensure timestamp is a number
        priceInWei,
      };
    });

    // Combine and sort all points to ensure chronological order
    const allPoints = [genesisPoint, ...processedTrades].sort(
      (a, b) => a.timestamp - b.timestamp
    );

    const dataForChart = allPoints.map((point) => ({
      timestamp: format(fromUnixTime(point.timestamp), "MMM d, h:mm a"),
      price: parseFloat(formatUnits(point.priceInWei, 18)),
      // Use the centralized formatter for consistent display
      formattedPrice: formatValue(point.priceInWei, 6),
    }));

    // Display price is the price of the last available point
    const lastDisplayPrice =
      dataForChart.length > 0
        ? dataForChart[dataForChart.length - 1].formattedPrice
        : formatValue(genesisPoint.priceInWei, 6);

    return { chartData: dataForChart, displayPrice: lastDisplayPrice };
  }, [trades, token, formatValue]);

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
            tickFormatter={(value) => `${Number(value).toFixed(5)}`}
            domain={["dataMin", "dataMax"]}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="price"
            stroke="#4ade80"
            strokeWidth={2}
            dot={true}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
