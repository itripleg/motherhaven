"use client";

import { useEffect, useRef } from "react";
import { createChart, LineData } from "lightweight-charts";

interface TokenPriceChartProps {
  trades?: { timestamp: Date; price: number }[];
}

export const TokenPriceChart = ({ trades = [] }: TokenPriceChartProps) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chartContainerRef.current) {
      const chart = createChart(chartContainerRef.current, {
        width: chartContainerRef.current.clientWidth,
        height: chartContainerRef.current.clientHeight,
        crosshair: {
          vertLine: {
            color: "#ffffff",
            width: 1,
            style: 0,
            visible: true,
          },
          horzLine: {
            color: "#ffffff",
            width: 1,
            style: 0,
            visible: true,
          },
        },
      });

      const priceSeries = chart.addLineSeries({
        color: "#ff6600",
        lineWidth: 2,
      });

      // Generate dummy data sorted by time
      const generateDummyData = (): LineData[] => {
        const now = new Date();
        return [
          { time: Math.floor(now.getTime() / 1000 - 6 * 86400), value: 10 },
          { time: Math.floor(now.getTime() / 1000 - 5 * 86400), value: 15 },
          { time: Math.floor(now.getTime() / 1000 - 4 * 86400), value: 12 },
          { time: Math.floor(now.getTime() / 1000 - 3 * 86400), value: 18 },
          { time: Math.floor(now.getTime() / 1000 - 2 * 86400), value: 20 },
          { time: Math.floor(now.getTime() / 1000 - 1 * 86400), value: 16 },
          { time: Math.floor(now.getTime() / 1000), value: 22 },
        ];
      };

      // Prepare chart data (timestamp as Unix timestamp and price as price)
      const chartData =
        trades.length > 0
          ? trades
              .map((trade) => ({
                time: Math.floor(trade.timestamp.getTime() / 1000),
                value: trade.price,
              }))
              .sort((a, b) => a.time - b.time)
          : generateDummyData();

      priceSeries.setData(chartData);

      // Resize chart on window resize
      const handleResize = () => {
        if (chartContainerRef.current) {
          chart.resize(
            chartContainerRef.current.clientWidth,
            chartContainerRef.current.clientHeight
          );
        }
      };

      window.addEventListener("resize", handleResize);

      return () => {
        window.removeEventListener("resize", handleResize);
        chart.remove();
      };
    }
  }, [trades]);

  return <div ref={chartContainerRef} className="w-full h-full" />;
};
