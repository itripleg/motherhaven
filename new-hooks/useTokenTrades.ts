// hooks/useTokenTrades.ts
import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
} from "firebase/firestore";
import { db } from "@/firebase";
import { Address, formatEther } from "viem";
import { tokenEventEmitter } from "@/components/EventWatcher";

export interface Trade {
  type: "buy" | "sell" | "halt";
  pricePerToken: string;
  timestamp: string;
  ethAmount?: string;
  tokenAmount?: string;
  collateral?: string;
  blockNumber: number;
}

export function useTokenTrades(tokenAddress?: Address) {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Listen to historical trades from Firestore
  useEffect(() => {
    if (!tokenAddress) return;

    setLoading(true);
    const tradesRef = collection(db, "trades");
    const tradesQuery = query(
      tradesRef,
      where("token", "==", tokenAddress.toLowerCase()),
      orderBy("timestamp", "desc"),
      limit(100)
    );

    const unsubscribe = onSnapshot(
      tradesQuery,
      (snapshot) => {
        const tradeDocs: Trade[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            type: data.type,
            pricePerToken: data.pricePerToken,
            timestamp: data.timestamp,
            ethAmount: data.ethAmount,
            tokenAmount: data.tokenAmount,
            collateral: data.collateral,
            blockNumber: data.blockNumber,
          };
        });
        setTrades(tradeDocs);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error("Error fetching trades:", err);
        setError("Failed to load trade history");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [tokenAddress]);

  // Listen to real-time trade events
  useEffect(() => {
    if (!tokenAddress) return;

    const handleTokenEvent = (event: any) => {
      if (
        event.eventName === "TokensPurchased" ||
        event.eventName === "TokensSold"
      ) {
        // Format the amounts from BigInt
        const ethAmount = formatEther(event.data.price);
        const tokenAmount = formatEther(event.data.amount);

        // Calculate price per token
        const pricePerToken = (
          Number(ethAmount) / Number(tokenAmount)
        ).toString();

        const newTrade: Trade = {
          type: event.eventName === "TokensPurchased" ? "buy" : "sell",
          pricePerToken,
          timestamp: new Date().toISOString(),
          ethAmount,
          tokenAmount,
          blockNumber: event.blockNumber,
        };

        setTrades((prev) => [newTrade, ...prev]);
      } else if (event.eventName === "TradingHalted") {
        const haltTrade: Trade = {
          type: "halt",
          pricePerToken: "0",
          timestamp: new Date().toISOString(),
          collateral: formatEther(event.data.collateral),
          blockNumber: event.blockNumber,
        };

        setTrades((prev) => [haltTrade, ...prev]);
      }
    };

    tokenEventEmitter.addEventListener(
      tokenAddress.toLowerCase(),
      handleTokenEvent
    );
    return () => {
      tokenEventEmitter.removeEventListener(
        tokenAddress.toLowerCase(),
        handleTokenEvent
      );
    };
  }, [tokenAddress]);

  return { trades, loading, error };
}
