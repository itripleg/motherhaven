// components/trading/chart/TokenChart.tsx
"use client";
import React, { useState } from "react";
import { Address } from "viem";
import { Token } from "@/types";
import { useTrades } from "@/final-hooks/useTrades";
import { useChartData } from "./useChartData";
import { TimeFrameSelector } from "./TimeFrameSelector";
import { ChartCore } from "./ChartCore";
import { ChartAnalytics } from "./ChartAnalytics";
import { ChartEmpty } from "./ChartEmpty";
import { ChartLoading } from "./ChartLoading";
import { useReactivePrimaryColor } from "./hooks/useReactivePrimaryColor";
import { TimeFrame } from "./types";
import { motion } from "framer-motion";

interface TokenChartProps {
  token: Token;
  className?: string;
  height?: string;
  showTimeFrames?: boolean;
  showAnalytics?: boolean;
  defaultTimeFrame?: TimeFrame;
}

export function TokenChart({
  token,
  className = "",
  height = "h-80 lg:h-96",
  showTimeFrames = true,
  showAnalytics = true,
  defaultTimeFrame = "all",
}: TokenChartProps) {
  const [currentTimeFrame, setCurrentTimeFrame] =
    useState<TimeFrame>(defaultTimeFrame);

  // Fetch trades data
  const { trades, loading: tradesLoading } = useTrades(
    token.address as Address
  );

  // Process chart data with current timeframe
  const chartData = useChartData(trades, token, currentTimeFrame);

  // Get reactive primary color for theming
  const primaryColor = useReactivePrimaryColor();

  const isLoading = tradesLoading;

  if (isLoading) {
    return <ChartLoading height={height} />;
  }

  return (
    <motion.div
      className={`w-full space-y-6 ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header with Analytics and Time Frame Selector */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Analytics Section */}
        {showAnalytics && (
          <ChartAnalytics
            token={token}
            trades={trades}
            chartData={chartData}
            primaryColor={primaryColor}
          />
        )}

        {/* Time Frame Selector */}
        {showTimeFrames && (
          <TimeFrameSelector
            currentTimeFrame={currentTimeFrame}
            onTimeFrameChange={setCurrentTimeFrame}
            className="lg:ml-auto"
          />
        )}
      </div>

      {/* Chart Area */}
      {chartData.points.length > 0 ? (
        <ChartCore
          data={chartData}
          primaryColor={primaryColor}
          height={height}
        />
      ) : (
        <ChartEmpty token={token} height={height} />
      )}
    </motion.div>
  );
}
