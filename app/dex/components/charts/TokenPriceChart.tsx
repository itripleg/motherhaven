"use client";

import { useEffect, useRef, useState } from "react";
import { createChart, ColorType, LineStyle } from "lightweight-charts";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { db } from "@/firebase";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

interface Trade {
  pricePaid: string;
  timestamp: Date;
  tokenAddress: string;
  type: "buy" | "sell";
}

interface Candlestick {
  open: number;
  high: number;
  low: number;
  close: number;
  time: number;
}

interface TokenPriceChartProps {
  tokenAddress: string;
  currentPrice?: string;
  tokenSymbol?: string;
}

type TimeFrame = "5m" | "15m" | "1h" | "4h" | "1d";

const TIME_INTERVALS: Record<TimeFrame, number> = {
  "5m": 300,
  "15m": 900,
  "1h": 3600,
  "4h": 14400,
  "1d": 86400,
};

export const TokenPriceChart = ({
  tokenAddress,
  currentPrice,
  tokenSymbol,
}: TokenPriceChartProps) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const seriesRef = useRef<any>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [timeFrame, setTimeFrame] = useState<TimeFrame>("1h");

  // Fetch historical trades
  useEffect(() => {
    const fetchTrades = async () => {
      try {
        const tradesRef = collection(db, "trades");
        const q = query(
          tradesRef,
          where("tokenAddress", "==", tokenAddress),
          orderBy("timestamp", "asc")
        );

        const querySnapshot = await getDocs(q);
        const tradeData = querySnapshot.docs.map((doc) => ({
          pricePaid: doc.data().pricePaid,
          timestamp: doc.data().timestamp.toDate(),
          tokenAddress: doc.data().tokenAddress,
          type: doc.data().type,
        })) as Trade[];

        console.log("Fetched trades:", tradeData);
        setTrades(tradeData);
      } catch (error) {
        console.error("Error fetching trades:", error);
      }
    };

    if (tokenAddress) {
      fetchTrades();
    }
  }, [tokenAddress]);

  const aggregateTrades = (
    trades: Trade[],
    interval: number
  ): Candlestick[] => {
    if (trades.length === 0) return [];

    const buckets: { [key: number]: { prices: number[]; lastPrice: number } } =
      {};

    // Process trades in chronological order
    trades.forEach((trade) => {
      const timestamp = Math.floor(trade.timestamp.getTime() / 1000);
      const bucketTime = Math.floor(timestamp / interval) * interval;
      const price = Math.abs(parseFloat(trade.pricePaid)); // Ensure positive price

      if (!buckets[bucketTime]) {
        buckets[bucketTime] = {
          prices: [],
          lastPrice: price,
        };
      }

      buckets[bucketTime].prices.push(price);
      buckets[bucketTime].lastPrice = price;
    });

    // Convert buckets to candlesticks
    const candlesticks: Candlestick[] = Object.entries(buckets).map(
      ([time, data]) => ({
        time: parseInt(time),
        open: data.prices[0],
        high: Math.max(...data.prices),
        low: Math.min(...data.prices),
        close: data.lastPrice,
      })
    );

    // Add current price if available
    if (currentPrice) {
      const currentTime = Math.floor(Date.now() / 1000 / interval) * interval;
      const currentPriceNum = parseFloat(currentPrice);

      if (
        candlesticks.length > 0 &&
        candlesticks[candlesticks.length - 1].time === currentTime
      ) {
        const last = candlesticks[candlesticks.length - 1];
        last.close = currentPriceNum;
        last.high = Math.max(last.high, currentPriceNum);
        last.low = Math.min(last.low, currentPriceNum);
      } else {
        candlesticks.push({
          time: currentTime,
          open: currentPriceNum,
          high: currentPriceNum,
          low: currentPriceNum,
          close: currentPriceNum,
        });
      }
    }

    return candlesticks.sort((a, b) => a.time - b.time);
  };

  // Create chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#d1d5db",
      },
      grid: {
        vertLines: { color: "#2f3540", style: LineStyle.Dotted },
        horzLines: { color: "#2f3540", style: LineStyle.Dotted },
      },
      rightPriceScale: {
        borderColor: "#2f3540",
        autoScale: true,
      },
      timeScale: {
        borderColor: "#2f3540",
        timeVisible: true,
        secondsVisible: false,
      },
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
    });

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: "#10b981",
      downColor: "#ef4444",
      borderVisible: false,
      wickUpColor: "#10b981",
      wickDownColor: "#ef4444",
    });

    chartRef.current = chart;
    seriesRef.current = candlestickSeries;

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
  }, []);

  // Update chart data
  useEffect(() => {
    if (!seriesRef.current || trades.length === 0) return;

    const candlesticks = aggregateTrades(trades, TIME_INTERVALS[timeFrame]);
    console.log("Candlesticks:", candlesticks);
    seriesRef.current.setData(candlesticks);

    if (chartRef.current) {
      chartRef.current.timeScale().fitContent();
    }
  }, [trades, currentPrice, timeFrame]);

  return (
    <div className="w-full h-full relative">
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
        <div className="text-sm text-gray-400">
          {tokenSymbol ? `${tokenSymbol}/AVAX` : "Price Chart"}
        </div>
        <ToggleGroup
          type="single"
          value={"1"}
          // value={timeFrame}
          // onValueChange={(value) => value && setTimeFrame(value as TimeFrame)}
        >
          <ToggleGroupItem value="5m" aria-label="5 Minutes">
            5m
          </ToggleGroupItem>
          <ToggleGroupItem value="15m" aria-label="15 Minutes">
            15m
          </ToggleGroupItem>
          <ToggleGroupItem value="1h" aria-label="1 Hour">
            1h
          </ToggleGroupItem>
          <ToggleGroupItem value="4h" aria-label="4 Hours">
            4h
          </ToggleGroupItem>
          <ToggleGroupItem value="1d" aria-label="1 Day">
            1d
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
      <div ref={chartContainerRef} className="w-full h-full" />
    </div>
  );
};

export default TokenPriceChart;
