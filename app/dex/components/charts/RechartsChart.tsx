"use client";
import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { db } from "@/firebase";

interface RechartsChartProps {
  tokenAddress: string;
  currentPrice?: string;
  tokenSymbol?: string;
}

interface Trade {
  pricePaid: string;
  timestamp: Date;
  type: "buy" | "sell";
}

export function RechartsChart({
  tokenAddress,
  currentPrice,
  tokenSymbol,
}: RechartsChartProps) {
  const [trades, setTrades] = useState<Trade[]>([]);

  useEffect(() => {
    const fetchTrades = async () => {
      try {
        const tradesRef = collection(db, "trades");
        const q = query(
          tradesRef,
          where("tokenAddress", "==", tokenAddress),
          orderBy("timestamp", "desc")
        );

        const querySnapshot = await getDocs(q);
        const tradeData = querySnapshot.docs.map((doc) => ({
          pricePaid: doc.data().pricePaid,
          timestamp: doc.data().timestamp.toDate(),
          type: doc.data().type,
        })) as Trade[];

        setTrades(tradeData);
      } catch (error) {
        console.error("Error fetching trades:", error);
      }
    };

    if (tokenAddress) {
      fetchTrades();
    }
  }, [tokenAddress]);

  // Prepare chart data
  const chartData = [
    // Add all historical trades
    ...trades.map((trade) => ({
      time: trade.timestamp.getTime(),
      price: parseFloat(trade.pricePaid),
      type: trade.type,
    })),
    // Add current price as the latest point
    ...(currentPrice
      ? [
          {
            time: Date.now(),
            price: parseFloat(currentPrice),
            type: "current",
          },
        ]
      : []),
  ].sort((a, b) => a.time - b.time);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background/80 backdrop-blur-sm border rounded-lg p-2 shadow-lg">
          <p className="text-sm font-medium">
            {new Date(label).toLocaleString()}
          </p>
          <p className="text-sm text-primary">
            Price: {payload[0].value.toFixed(6)} AVAX
          </p>
          <p className="text-xs text-muted-foreground capitalize">
            Type: {payload[0].payload.type}
          </p>
        </div>
      );
    }
    return null;
  };

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
        {tokenSymbol ? `${tokenSymbol}/AVAX` : "Price Chart"}
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
            tickFormatter={(value) => new Date(value).toLocaleTimeString()}
            type="number"
            domain={["dataMin", "dataMax"]}
          />
          <YAxis
            stroke="#6b7280"
            tick={{ fill: "#6b7280" }}
            domain={yDomain}
            tickFormatter={(value) => value.toFixed(6)}
            tickCount={5}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="price"
            stroke="#10b981"
            strokeWidth={2}
            dot={{ fill: "#10b981", r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default RechartsChart;
