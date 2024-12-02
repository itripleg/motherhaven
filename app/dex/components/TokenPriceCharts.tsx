"use client";
import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import TokenPriceChart from "./charts/RechartsBarChart";
import RechartsChart from "./charts/RechartsLineChart";
import { TokenData } from "@/types";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { db } from "@/firebase";
import RechartsLineChart from "./charts/RechartsLineChart";

interface TokenPriceChartsProps {
  tokenData: TokenData;
  price: number;
}

interface Trade {
  pricePerToken: string;
  timestamp: string;
  type: "buy" | "sell";
  ethAmount: string;
  tokenAmount: string;
}

export function TokenPriceCharts({ tokenData, price }: TokenPriceChartsProps) {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrades = async () => {
      try {
        setLoading(true);
        const tradesRef = collection(db, "trades");
        const q = query(
          tradesRef,
          where("token", "==", tokenData.address),
          orderBy("timestamp", "desc")
        );

        const querySnapshot = await getDocs(q);
        const tradeData = querySnapshot.docs.map((doc) => ({
          pricePerToken: doc.data().pricePerToken,
          timestamp: doc.data().timestamp,
          type: doc.data().type,
          ethAmount: doc.data().ethAmount,
          tokenAmount: doc.data().tokenAmount,
        })) as Trade[];

        console.log("Fetched trades:", tradeData.length);
        setTrades(tradeData);
      } catch (error) {
        console.error("Error fetching trades:", error);
      } finally {
        setLoading(false);
      }
    };

    if (tokenData.address) {
      fetchTrades();
    }
  }, [tokenData.address]);

  return (
    <div className="grid gap-4 md:grid-cols-1">
      {/* <Card className="h-[400px] p-6">
        <TokenPriceChart
          trades={trades}
          loading={loading}
          currentPrice={String(price)}
          tokenSymbol={tokenData.symbol}
        />
      </Card> */}
      <Card className="h-[400px] p-6">
        <RechartsLineChart
          trades={trades}
          loading={loading}
          currentPrice={String(price)}
          tokenSymbol={tokenData.symbol}
        />
      </Card>
    </div>
  );
}
