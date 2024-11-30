"use client";
import React, { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format } from "date-fns";

interface RechartsChartProps {
  trades: Array<{
    pricePerToken: string;
    timestamp: string;
    type: "buy" | "sell";
    ethAmount: string;
    tokenAmount: string;
  }>;
  loading: boolean;
  currentPrice?: string;
  tokenSymbol?: string;
}

const RechartsChart = ({
  trades,
  loading,
  currentPrice,
  tokenSymbol,
}: RechartsChartProps) => {
  // Memoize chart data calculation
  const chartData = useMemo(() => {
    const data = [
      // Add all historical trades
      ...trades.map((trade) => ({
        time: new Date(trade.timestamp).getTime(),
        price: parseFloat(trade.pricePerToken),
        volume: parseFloat(trade.ethAmount) / 1e18, // Convert from wei to ETH
        type: trade.type,
      })),
      // Add current price as the latest point if different from last trade
      ...(currentPrice &&
      trades.length > 0 &&
      parseFloat(currentPrice) !== parseFloat(trades[0].pricePerToken)
        ? [
            {
              time: Date.now(),
              price: parseFloat(currentPrice),
              volume: 0,
              type: "current",
            },
          ]
        : []),
    ].sort((a, b) => a.time - b.time);

    return data;
  }, [trades, currentPrice]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background/80 backdrop-blur-sm border rounded-lg p-2 shadow-lg">
          <p className="text-sm font-medium">
            {format(new Date(label), "MMM dd yyyy HH:mm")}
          </p>
          <p className="text-sm text-primary">
            Price: {data.price.toFixed(12)} ETH
          </p>
          {data.type !== "current" && (
            <p className="text-sm text-primary">
              Volume: {data.volume.toFixed(4)} ETH
            </p>
          )}
          <p className="text-xs text-muted-foreground capitalize">
            Type: {data.type}
          </p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
        Loading trades...
      </div>
    );
  }

  if (trades.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
        No trades found for this token
      </div>
    );
  }

  // Calculate price range for better scaling
  const prices = chartData.map((d) => d.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceDiff = maxPrice - minPrice;
  const yDomain = [
    Math.max(0, minPrice - priceDiff * 0.1),
    maxPrice + priceDiff * 0.1,
  ];

  return (
    <div className="w-full h-full">
      <div className="absolute top-4 left-4 text-sm text-muted-foreground">
        {tokenSymbol ? `${tokenSymbol}/ETH` : "Price Chart"}
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{ top: 40, right: 30, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#2f3540" />
          <XAxis
            dataKey="time"
            stroke="#6b7280"
            tick={{ fill: "#6b7280" }}
            tickFormatter={(value) => {
              const date = new Date(value);
              return `${date.getHours()}:${String(date.getMinutes()).padStart(
                2,
                "0"
              )}`;
            }}
            type="number"
            domain={["dataMin", "dataMax"]}
          />

          <YAxis
            stroke="#6b7280"
            tick={{ fill: "#6b7280" }}
            domain={yDomain}
            tickFormatter={(value) => value.toFixed(12)}
            tickCount={5}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="price"
            stroke="#10b981"
            strokeWidth={2}
            dot={(props) => {
              const { payload } = props;
              // Customize dots based on trade type
              const colors = {
                buy: "#10b981",
                sell: "#ef4444",
                current: "#3b82f6",
              };
              return (
                <circle
                  {...props}
                  fill={
                    colors[payload.type as keyof typeof colors] || "#10b981"
                  }
                  r={4}
                />
              );
            }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RechartsChart;
