"use client";

import { useEffect, useRef, useMemo } from "react";
import {
  createChart,
  IChartApi,
  CandlestickData,
  UTCTimestamp,
  PriceFormat,
  Time,
  LineData,
} from "lightweight-charts";
import { formatUnits, parseUnits } from "viem";
import { parseISO } from "date-fns";
import { Trade, Token } from "@/types";
import { formatTokenPrice, priceToNumber } from "@/utils/tokenPriceFormatter";

interface TVChartProps {
  trades: Trade[];
  token: Token;
  isDarkMode?: boolean;
  chartType?: "candlestick" | "line";
  height?: number;
}

export function TVChart({
  trades,
  token,
  isDarkMode = true,
  chartType = "line",
  height = 400,
}: TVChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  // Process trade data into chart format
  const chartData = useMemo(() => {
    // Create genesis point from token creation
    const genesisTimestamp = token.createdAt
      ? Math.floor(parseISO(token.createdAt).getTime() / 1000)
      : Math.floor(Date.now() / 1000);

    const genesisPrice = parseUnits(token.initialPrice, 18);
    const genesisPoint = {
      timestamp: genesisTimestamp as UTCTimestamp,
      priceInWei: genesisPrice,
    };

    // Process trades
    const processedTrades = trades
      .map((trade) => {
        if (
          !trade.tokenAmount ||
          BigInt(trade.tokenAmount) === 0n ||
          !trade.timestamp
        ) {
          return null;
        }

        const tradeTimestamp = Math.floor(
          parseISO(trade.timestamp).getTime() / 1000
        ) as UTCTimestamp;

        const priceInWei =
          (BigInt(trade.ethAmount) * BigInt(10 ** 18)) /
          BigInt(trade.tokenAmount);

        return {
          timestamp: tradeTimestamp,
          priceInWei,
          volume: Number(formatUnits(BigInt(trade.ethAmount), 18)),
        };
      })
      .filter((point): point is NonNullable<typeof point> => point !== null);

    // Combine and sort all points
    const allPoints = [{ ...genesisPoint, volume: 0 }, ...processedTrades].sort(
      (a, b) => a.timestamp - b.timestamp
    );

    if (chartType === "line") {
      // For line chart, return simple price data
      return allPoints.map((point) => ({
        time: point.timestamp,
        value: priceToNumber(point.priceInWei),
      })) as LineData<Time>[];
    } else {
      // For candlestick chart, group into candles
      const MINUTES_PER_CANDLE = 15;
      const SECONDS_PER_CANDLE = MINUTES_PER_CANDLE * 60;
      const candles: Record<number, CandlestickData<UTCTimestamp>> = {};

      allPoints.forEach((point) => {
        const candleTime =
          Math.floor(point.timestamp / SECONDS_PER_CANDLE) * SECONDS_PER_CANDLE;
        const price = priceToNumber(point.priceInWei);

        if (!candles[candleTime]) {
          candles[candleTime] = {
            time: candleTime as UTCTimestamp,
            open: price,
            high: price,
            low: price,
            close: price,
          };
        } else {
          const candle = candles[candleTime];
          candle.high = Math.max(candle.high, price);
          candle.low = Math.min(candle.low, price);
          candle.close = price;
        }
      });

      return Object.values(candles).sort(
        (a, b) => (a.time as number) - (b.time as number)
      ) as CandlestickData<UTCTimestamp>[];
    }
  }, [trades, token, chartType]);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chartOptions = {
      layout: {
        background: { color: isDarkMode ? "#1a1b1e" : "#ffffff" },
        textColor: isDarkMode ? "#d1d5db" : "#374151",
      },
      grid: {
        vertLines: { color: isDarkMode ? "#2f3336" : "#e5e7eb" },
        horzLines: { color: isDarkMode ? "#2f3336" : "#e5e7eb" },
      },
      width: chartContainerRef.current.clientWidth,
      height: height,
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderColor: isDarkMode ? "#2f3336" : "#e5e7eb",
        fixLeftEdge: true,
        fixRightEdge: true,
      },
      rightPriceScale: {
        borderColor: isDarkMode ? "#2f3336" : "#e5e7eb",
        scaleMargins: {
          top: 0.1,
          bottom: 0.1,
        },
      },
      handleScale: {
        axisPressedMouseMove: {
          time: true,
          price: true,
        },
      },
      crosshair: {
        vertLine: {
          color: isDarkMode ? "#6b7280" : "#9ca3af",
          width: 1,
          style: 1,
        },
        horzLine: {
          color: isDarkMode ? "#6b7280" : "#9ca3af",
          width: 1,
          style: 1,
        },
      },
    };

    const chart = createChart(chartContainerRef.current, chartOptions);
    chartRef.current = chart;

    // Create the appropriate series based on chart type
    if (chartType === "line") {
      const lineSeries = chart.addLineSeries({
        color: "#4ade80", // Green color to match your design
        lineWidth: 2,
        priceFormat: {
          type: "price",
          precision: 8,
          minMove: 0.00000001,
        } as PriceFormat,
      });

      if (chartData.length > 0) {
        lineSeries.setData(chartData as LineData<Time>[]);
      }
    } else {
      const candlestickSeries = chart.addCandlestickSeries({
        upColor: "#22c55e",
        downColor: "#ef4444",
        borderVisible: false,
        wickUpColor: "#22c55e",
        wickDownColor: "#ef4444",
        priceFormat: {
          type: "price",
          precision: 8,
          minMove: 0.00000001,
        } as PriceFormat,
      });

      if (chartData.length > 0) {
        candlestickSeries.setData(chartData as CandlestickData<UTCTimestamp>[]);
      }
    }

    // Fit content and handle resize
    if (chartData.length > 0) {
      chart.timeScale().fitContent();
      // Set visible range to show all data properly
      chart.timeScale().setVisibleRange({
        from: chartData[0].time as UTCTimestamp,
        to: chartData[chartData.length - 1].time as UTCTimestamp,
      });
    }

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: height,
        });
      }
    };

    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, [chartData, isDarkMode, chartType, height]);

  // Loading state
  if (!token || chartData.length === 0) {
    return (
      <div
        className="flex items-center justify-center bg-gray-900 rounded-lg"
        style={{ height: `${height}px` }}
      >
        <div className="text-center">
          <div className="text-gray-400 mb-2">
            {!token ? "Loading token data..." : "No price data available"}
          </div>
          {token && (
            <div className="text-sm text-gray-500">
              Initial Price: {formatTokenPrice(token.initialPrice)} AVAX
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Chart Header */}
      <div className="mb-4 px-2">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white">
              {token.symbol}/AVAX
            </h3>
            <p className="text-sm text-gray-400">
              {chartType === "candlestick" ? "Candlestick" : "Line"} Chart
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-400">Current Price</div>
            <div className="text-lg font-semibold text-green-400">
              {chartData.length > 0
                ? formatTokenPrice(
                    chartType === "line"
                      ? (
                          chartData[chartData.length - 1] as LineData<Time>
                        ).value.toString()
                      : (
                          chartData[
                            chartData.length - 1
                          ] as CandlestickData<UTCTimestamp>
                        ).close.toString()
                  )
                : formatTokenPrice(token.initialPrice)}{" "}
              AVAX
            </div>
          </div>
        </div>
      </div>

      {/* Chart Container */}
      <div
        ref={chartContainerRef}
        className="w-full rounded-lg overflow-hidden border border-gray-700"
        style={{ height: `${height}px` }}
      />

      {/* Chart Info */}
      <div className="mt-2 px-2 text-xs text-gray-500 flex items-center justify-between">
        <span>
          {trades.length} trade{trades.length !== 1 ? "s" : ""} •
          {chartType === "candlestick" ? " 15min candles" : " Real-time prices"}
        </span>
        <span>Powered by Lightweight Charts</span>
      </div>
    </div>
  );
}
