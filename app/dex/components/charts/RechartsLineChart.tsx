"use client";
import React, { useMemo, useEffect, useState } from "react";
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
import { tokenEventEmitter } from "@/components/EventWatcher";

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
  tokenAddress?: string;
}

const RechartsChart = ({
  trades: initialTrades,
  loading,
  currentPrice,
  tokenSymbol,
  tokenAddress,
}: RechartsChartProps) => {
  // State to hold live trades
  const [liveTrades, setLiveTrades] = useState<typeof initialTrades>([]);

  // Combine initial and live trades
  const allTrades = useMemo(
    () => [...initialTrades, ...liveTrades],
    [initialTrades, liveTrades]
  );

  useEffect(() => {
    if (!tokenAddress) return;

    const handleTokenEvent = (event: {
      eventName: string;
      data: {
        pricePerToken: bigint | number;
        ethAmount: bigint | number;
        tokenAmount: bigint | number;
      };
    }) => {
      if (
        event.eventName === "TokensPurchased" ||
        event.eventName === "TokensSold"
      ) {
        const newTrade = {
          pricePerToken: event.data.pricePerToken.toString(),
          timestamp: new Date().toISOString(),
          type:
            event.eventName === "TokensPurchased"
              ? ("buy" as const)
              : ("sell" as const),
          ethAmount: event.data.ethAmount.toString(),
          tokenAmount: event.data.tokenAmount.toString(),
        };

        setLiveTrades((prev) => [...prev, newTrade]);
      }
    };

    const normalizedAddress = tokenAddress.toLowerCase();

    // Subscribe to events for this token
    tokenEventEmitter.addEventListener(normalizedAddress, handleTokenEvent);

    return () => {
      // Cleanup subscription
      tokenEventEmitter.removeEventListener(
        normalizedAddress,
        handleTokenEvent
      );
    };
  }, [tokenAddress]);

  // Memoize chart data calculation
  const chartData = useMemo(() => {
    const data = [
      // Add all trades (both initial and live)
      ...allTrades.map((trade) => ({
        time: new Date(trade.timestamp).getTime(),
        price: parseFloat(trade.pricePerToken),
        volume: parseFloat(trade.ethAmount) / 1e18,
        type: trade.type,
      })),
      // Add current price if different from last trade
      ...(currentPrice &&
      allTrades.length > 0 &&
      parseFloat(currentPrice) !== parseFloat(allTrades[0].pricePerToken)
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
  }, [allTrades, currentPrice]);

  const CustomDot = (props: any) => {
    const { cx, cy, payload, index } = props;

    const colors = {
      buy: "#10b981",
      sell: "#ef4444",
      current: "#3b82f6",
    };

    return (
      <circle
        key={`dot-${index}`}
        cx={cx}
        cy={cy}
        r={4}
        fill={colors[payload.type as keyof typeof colors] || "#10b981"}
      />
    );
  };

  // Rest of your component remains the same...
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

  if (allTrades.length === 0) {
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
            dot={CustomDot}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RechartsChart;
