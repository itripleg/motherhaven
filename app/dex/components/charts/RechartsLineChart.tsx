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
import { useFactoryContract } from "@/new-hooks/useFactoryContract";
import {
  formatTokenPrice,
  formatChartPrice,
  priceToNumber,
} from "@/utils/tokenPriceFormatter";

interface ChartPoint {
  price: number;
  formattedPrice: string;
  timeLabel: string;
  timestamp: number; // Add raw timestamp for debugging
}

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
  // Debug logs
  console.log("=== RechartsLineChart Debug ===");
  console.log("Token:", token);
  console.log("Trades count:", trades?.length || 0);
  console.log("First few trades:", trades?.slice(0, 3));
  console.log("Loading:", loading);

  const chartData: ChartPoint[] = useMemo(() => {
    console.log("Processing chart data...");

    if (!token) {
      console.log("No token data");
      return [];
    }

    // 1. Create the "Genesis Point" from the token's creation data
    const genesisTimestamp = token.createdAt
      ? parseISO(token.createdAt).getTime()
      : Date.now();
    const genesisPrice = parseUnits(token.initialPrice || "0", 18);

    console.log("Genesis point:", {
      timestamp: genesisTimestamp,
      price: token.initialPrice,
      priceInWei: genesisPrice.toString(),
    });

    const genesisPoint = {
      timestamp: genesisTimestamp,
      priceInWei: genesisPrice,
    };

    // 2. Process the raw trade data
    console.log("Processing trades...");
    const processedTrades =
      trades
        ?.map((trade, index) => {
          console.log(`Trade ${index}:`, {
            tokenAmount: trade.tokenAmount,
            ethAmount: trade.ethAmount,
            timestamp: trade.timestamp,
          });

          // Safeguard against bad data
          if (
            !trade.tokenAmount ||
            BigInt(trade.tokenAmount) === 0n ||
            !trade.timestamp ||
            !trade.ethAmount
          ) {
            console.log(`Skipping trade ${index} - invalid data`);
            return null;
          }

          const tradeTimestamp = parseISO(trade.timestamp).getTime();
          const priceInWei =
            (BigInt(trade.ethAmount) * BigInt(10 ** 18)) /
            BigInt(trade.tokenAmount);

          console.log(`Trade ${index} processed:`, {
            timestamp: tradeTimestamp,
            priceInWei: priceInWei.toString(),
          });

          return {
            timestamp: tradeTimestamp,
            priceInWei,
          };
        })
        .filter(
          (point): point is { timestamp: number; priceInWei: bigint } =>
            point !== null
        ) || [];

    console.log("Processed trades count:", processedTrades.length);

    // 3. Combine the genesis point with actual trades and sort chronologically
    const allPoints = [...processedTrades, genesisPoint].sort(
      (a, b) => a.timestamp - b.timestamp
    );

    console.log("All points count:", allPoints.length);
    console.log("All points sample:", allPoints.slice(0, 3));

    // 4. Format the sorted points into the final shape for the chart
    const finalData = allPoints.map((point, index) => {
      const price = priceToNumber(point.priceInWei);
      const formattedPrice = formatTokenPrice(
        formatUnits(point.priceInWei, 18)
      );
      const timeLabel = format(point.timestamp, "MMM d, h:mm a");

      console.log(`Final point ${index}:`, {
        price,
        formattedPrice,
        timeLabel,
        timestamp: point.timestamp,
      });

      return {
        price,
        formattedPrice,
        timeLabel,
        timestamp: point.timestamp,
      };
    });

    console.log("Final chart data:", finalData);
    return finalData;
  }, [trades, token]);

  // The price displayed in the header
  const displayPrice =
    chartData.length > 0
      ? chartData[chartData.length - 1].formattedPrice
      : formatTokenPrice(
          formatUnits(parseUnits(token?.initialPrice || "0", 18), 18)
        );

  console.log("Display price:", displayPrice);
  console.log("Chart data length:", chartData.length);

  if (loading) {
    return (
      <div className="text-center text-gray-400 animate-pulse">
        Loading Chart Data...
      </div>
    );
  }

  if (!token) {
    return (
      <div className="text-center text-red-400">No token data available</div>
    );
  }

  // Debug render info
  console.log("Rendering chart with:", {
    dataPoints: chartData.length,
    firstPoint: chartData[0],
    lastPoint: chartData[chartData.length - 1],
  });

  return (
    <div className="h-full w-full">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-white">
          {token.symbol} Price History
        </h3>
        <p className="text-2xl text-green-400">{displayPrice} AVAX</p>
        <p className="text-xs text-gray-500 mt-1">
          Debug: {chartData.length} data points
        </p>
      </div>

      {/* Debug Info */}
      <div className="mb-4 p-2 bg-gray-800 rounded text-xs text-gray-300">
        <div>
          Token: {token.name} ({token.symbol})
        </div>
        <div>Initial Price: {token.initialPrice}</div>
        <div>Trades: {trades?.length || 0}</div>
        <div>Chart Points: {chartData.length}</div>
        <div>
          First Point:{" "}
          {chartData[0]
            ? `${chartData[0].formattedPrice} at ${chartData[0].timeLabel}`
            : "None"}
        </div>
        <div>
          Last Point:{" "}
          {chartData[chartData.length - 1]
            ? `${chartData[chartData.length - 1].formattedPrice} at ${
                chartData[chartData.length - 1].timeLabel
              }`
            : "None"}
        </div>
      </div>

      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height="80%">
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
            <XAxis
              dataKey="timeLabel"
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
              tickFormatter={(value) => formatChartPrice(Number(value))}
              domain={["dataMin", "dataMax"]}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="price"
              stroke="#4ade80"
              strokeWidth={2}
              dot={chartData.length < 50}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex items-center justify-center h-4/5">
          <div className="text-center">
            <p className="text-gray-500 mb-2">No chart data available</p>
            <div className="text-sm text-gray-600">
              <div>Token created: {token.createdAt || "Unknown"}</div>
              <div>Initial price: {token.initialPrice || "Unknown"}</div>
              <div>Trades available: {trades?.length || 0}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
