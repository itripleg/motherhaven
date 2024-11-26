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

      // type Time = number | Date; // Allow both Unix timestamps and Date objects

      // const generateDummyData = (): LineData<Time>[] => {
      //   const now = new Date();
      //   return [
      //     { time: new Date(now.getTime() - 10 * 86400 * 1000), value: 8 }, // Example: Convert to Date
      //     { time: new Date(now.getTime() - 9 * 86400 * 1000), value: 11 },
      //     { time: new Date(now.getTime() - 8 * 86400 * 1000), value: 13 },
      //     { time: new Date(now.getTime() - 7 * 86400 * 1000), value: 14 },
      //     { time: new Date(now.getTime() - 6 * 86400 * 1000), value: 10 },
      //     { time: new Date(now.getTime() - 5 * 86400 * 1000), value: 15 },
      //     { time: new Date(now.getTime() - 4 * 86400 * 1000), value: 12 },
      //     { time: new Date(now.getTime() - 3 * 86400 * 1000), value: 18 },
      //     { time: new Date(now.getTime() - 2 * 86400 * 1000), value: 20 },
      //     { time: new Date(now.getTime() - 1 * 86400 * 1000), value: 16 },
      //     { time: new Date(now.getTime()), value: 22 },
      //   ];
      // };
      // // Prepare chart data (timestamp as Unix timestamp and price as price)
      // const chartData =
      //   trades.length > 0
      //     ? trades
      //         .map((trade) => ({
      //           time: Math.floor(trade.timestamp.getTime() / 1000),
      //           value: trade.price,
      //         }))
      //         .sort((a, b) => a.time - b.time)
      //     : generateDummyData();

      // priceSeries.setData(chartData);

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
