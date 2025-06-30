"use client";
import React, { useMemo } from "react";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { format, parseISO } from "date-fns";
import { formatUnits, parseUnits } from "viem";
import { Trade, Token } from "@/types";
import { formatTokenPrice, priceToNumber } from "@/utils/tokenPriceFormatter";

interface TokenBarChartProps {
  trades: Trade[];
  token: Token;
  loading: boolean;
}

interface CandleData {
  timestamp: number;
  timeLabel: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  tradeCount: number;
}

const TokenBarChart = ({ trades, token, loading }: TokenBarChartProps) => {
  // Group trades into time intervals for candlestick data
  const candleData = useMemo(() => {
    if (!token || !trades.length) return [];

    const intervalMinutes = 30; // 30-minute intervals
    const intervalMs = intervalMinutes * 60 * 1000;
    const candleMap = new Map<number, CandleData>();

    // Add genesis point
    const genesisTimestamp = token.createdAt
      ? parseISO(token.createdAt).getTime()
      : Date.now();
    const genesisPrice = priceToNumber(
      parseUnits(token.initialPrice || "0", 18)
    );
    const genesisInterval =
      Math.floor(genesisTimestamp / intervalMs) * intervalMs;

    candleMap.set(genesisInterval, {
      timestamp: genesisInterval,
      timeLabel: format(genesisInterval, "MMM d, HH:mm"),
      open: genesisPrice,
      high: genesisPrice,
      low: genesisPrice,
      close: genesisPrice,
      volume: 0,
      tradeCount: 0,
    });

    // Process trades
    trades.forEach((trade) => {
      if (!trade.tokenAmount || !trade.ethAmount || !trade.timestamp) return;

      const timestamp = parseISO(trade.timestamp).getTime();
      const interval = Math.floor(timestamp / intervalMs) * intervalMs;
      const price = priceToNumber(
        (BigInt(trade.ethAmount) * BigInt(10 ** 18)) / BigInt(trade.tokenAmount)
      );
      const volume = Number(formatUnits(BigInt(trade.ethAmount), 18));

      if (!candleMap.has(interval)) {
        candleMap.set(interval, {
          timestamp: interval,
          timeLabel: format(interval, "MMM d, HH:mm"),
          open: price,
          high: price,
          low: price,
          close: price,
          volume: volume,
          tradeCount: 1,
        });
      } else {
        const candle = candleMap.get(interval)!;
        candle.high = Math.max(candle.high, price);
        candle.low = Math.min(candle.low, price);
        candle.close = price; // Last trade in interval
        candle.volume += volume;
        candle.tradeCount += 1;
      }
    });

    return Array.from(candleMap.values()).sort(
      (a, b) => a.timestamp - b.timestamp
    );
  }, [trades, token]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background/90 backdrop-blur-sm border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium text-foreground mb-2">{label}</p>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Open:</span>
              <span className="text-blue-400 font-mono">
                {formatTokenPrice(data.open.toString())} AVAX
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">High:</span>
              <span className="text-green-400 font-mono">
                {formatTokenPrice(data.high.toString())} AVAX
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Low:</span>
              <span className="text-red-400 font-mono">
                {formatTokenPrice(data.low.toString())} AVAX
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Close:</span>
              <span className="text-primary font-mono">
                {formatTokenPrice(data.close.toString())} AVAX
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Volume:</span>
              <span className="text-yellow-400 font-mono">
                {data.volume.toFixed(4)} AVAX
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Trades:</span>
              <span className="text-purple-400 font-mono">
                {data.tradeCount}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          Loading OHLC data...
        </div>
      </div>
    );
  }

  if (!token || candleData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
        <div className="text-center">
          <p className="mb-2">No OHLC data available</p>
          <p className="text-xs">Need more trade data to generate candles</p>
        </div>
      </div>
    );
  }

  // Calculate price range for better scaling
  const allPrices = candleData.flatMap((d) => [d.open, d.high, d.low, d.close]);
  const minPrice = Math.min(...allPrices);
  const maxPrice = Math.max(...allPrices);
  const priceDiff = maxPrice - minPrice;
  const yDomain = [
    Math.max(0, minPrice - priceDiff * 0.1),
    maxPrice + priceDiff * 0.1,
  ];

  const maxVolume = Math.max(...candleData.map((d) => d.volume));

  return (
    <div className="w-full h-full">
      {/* Header */}
      <div className="mb-4 px-2">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-foreground">
              {token.symbol} OHLC + Volume
            </h3>
            <p className="text-sm text-muted-foreground">
              30-minute intervals with volume bars
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Latest Price</div>
            <div className="text-lg font-semibold text-green-400">
              {formatTokenPrice(
                candleData[candleData.length - 1]?.close.toString() || "0"
              )}{" "}
              AVAX
            </div>
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height="85%">
        <ComposedChart
          data={candleData}
          margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />

          <XAxis
            dataKey="timeLabel"
            stroke="#9ca3af"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />

          {/* Price Y-axis (left) */}
          <YAxis
            yAxisId="price"
            domain={yDomain}
            stroke="#9ca3af"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => formatTokenPrice(value.toString())}
          />

          {/* Volume Y-axis (right) */}
          <YAxis
            yAxisId="volume"
            orientation="right"
            domain={[0, maxVolume * 1.2]}
            stroke="#9ca3af"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${value.toFixed(2)}`}
          />

          <Tooltip content={<CustomTooltip />} />

          {/* Volume bars (background) */}
          <Bar
            dataKey="volume"
            yAxisId="volume"
            fill="#3b82f6"
            opacity={0.3}
            barSize={20}
          />

          {/* OHLC Lines */}
          <Line
            type="stepAfter"
            dataKey="high"
            stroke="#22c55e"
            strokeWidth={2}
            dot={false}
            yAxisId="price"
            name="High"
          />
          <Line
            type="stepAfter"
            dataKey="low"
            stroke="#ef4444"
            strokeWidth={2}
            dot={false}
            yAxisId="price"
            name="Low"
          />
          <Line
            type="stepAfter"
            dataKey="open"
            stroke="#8b5cf6"
            strokeWidth={2}
            dot={false}
            yAxisId="price"
            name="Open"
          />
          <Line
            type="stepAfter"
            dataKey="close"
            stroke="#f59e0b"
            strokeWidth={3}
            dot={false}
            yAxisId="price"
            name="Close"
          />

          {/* Reference line for initial price */}
          <ReferenceLine
            y={priceToNumber(parseUnits(token.initialPrice || "0", 18))}
            stroke="#6b7280"
            strokeDasharray="5 5"
            yAxisId="price"
            label={{ value: "Initial", position: "right" }}
          />
        </ComposedChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-2 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-0.5 bg-green-500" />
          <span className="text-muted-foreground">High</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-0.5 bg-red-500" />
          <span className="text-muted-foreground">Low</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-0.5 bg-purple-500" />
          <span className="text-muted-foreground">Open</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-0.5 bg-yellow-500" />
          <span className="text-muted-foreground">Close</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-1 bg-blue-500 opacity-30" />
          <span className="text-muted-foreground">Volume</span>
        </div>
      </div>
    </div>
  );
};

export default TokenBarChart;
