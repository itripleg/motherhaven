"use client";
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "@/firebase";
import { Address } from "viem";

export interface Trade {
  blockNumber: number;
  ethAmount: string;
  pricePerToken: string;
  timestamp: string;
  token: Address;
  tokenAmount: string;
  trader: Address;
  transactionHash: string;
  type: "buy" | "sell";
}

interface TradesContextState {
  trades: { [tokenAddress: string]: Trade[] };
  loading: { [tokenAddress: string]: boolean };
  errors: { [tokenAddress: string]: string | null };
  watchTrades: (tokenAddress: string) => void;
  unwatchTrades: (tokenAddress: string) => void;
  getTrades: (tokenAddress: string) => Trade[];
}

const TradesContext = createContext<TradesContextState | null>(null);

export function TradesProvider({ children }: { children: React.ReactNode }) {
  const [trades, setTrades] = useState<{ [tokenAddress: string]: Trade[] }>({});
  const [loading, setLoading] = useState<{ [tokenAddress: string]: boolean }>(
    {}
  );
  const [errors, setErrors] = useState<{
    [tokenAddress: string]: string | null;
  }>({});
  const [activeSubscriptions] = useState(new Set<string>());

  const watchTrades = useCallback(
    (tokenAddress: string) => {
      if (!tokenAddress || activeSubscriptions.has(tokenAddress)) return;

      console.log(`📊 Starting to watch trades for token: ${tokenAddress}`);

      setLoading((prev) => ({ ...prev, [tokenAddress]: true }));

      // Create query for trades collection
      const tradesRef = collection(db, "trades");
      const tradesQuery = query(
        tradesRef,
        where("token", "==", tokenAddress.toLowerCase()),
        orderBy("timestamp", "desc"),
        limit(100) // Limit to last 100 trades
      );

      const unsubscribe = onSnapshot(
        tradesQuery,
        (snapshot) => {
          const newTrades: Trade[] = [];
          snapshot.forEach((doc) => {
            const data = doc.data() as Trade;
            newTrades.push({
              ...data,
              token: data.token as Address,
              trader: data.trader as Address,
            });
          });

          setTrades((prev) => ({
            ...prev,
            [tokenAddress]: newTrades,
          }));
          setErrors((prev) => ({ ...prev, [tokenAddress]: null }));
          setLoading((prev) => ({ ...prev, [tokenAddress]: false }));
        },
        (error) => {
          console.error(
            `❌ Error fetching trades for token ${tokenAddress}:`,
            error
          );
          setErrors((prev) => ({
            ...prev,
            [tokenAddress]: "Failed to load trades",
          }));
          setLoading((prev) => ({ ...prev, [tokenAddress]: false }));
        }
      );

      activeSubscriptions.add(tokenAddress);

      return () => {
        console.log(`👋 Stopping trades watch for token: ${tokenAddress}`);
        unsubscribe();
        activeSubscriptions.delete(tokenAddress);
      };
    },
    [activeSubscriptions]
  );

  const unwatchTrades = useCallback(
    (tokenAddress: string) => {
      if (!tokenAddress || !activeSubscriptions.has(tokenAddress)) return;

      console.log(`👋 Unwatching trades for token: ${tokenAddress}`);
      activeSubscriptions.delete(tokenAddress);

      // Clean up state
      setTrades((prev) => {
        const newTrades = { ...prev };
        delete newTrades[tokenAddress];
        return newTrades;
      });

      setLoading((prev) => {
        const newLoading = { ...prev };
        delete newLoading[tokenAddress];
        return newLoading;
      });

      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[tokenAddress];
        return newErrors;
      });
    },
    [activeSubscriptions]
  );

  const getTrades = useCallback(
    (tokenAddress: string): Trade[] => {
      return trades[tokenAddress] || [];
    },
    [trades]
  );

  const value = {
    trades,
    loading,
    errors,
    watchTrades,
    unwatchTrades,
    getTrades,
  };

  return (
    <TradesContext.Provider value={value}>{children}</TradesContext.Provider>
  );
}

// Base hook for accessing trades context
export function useTradesContext() {
  const context = useContext(TradesContext);
  if (!context) {
    throw new Error("useTradesContext must be used within a TradesProvider");
  }
  return context;
}

// Hook for accessing a specific token's trades
export function useTrades(tokenAddress: string | undefined) {
  const { trades, loading, errors, watchTrades } = useTradesContext();

  useEffect(() => {
    if (tokenAddress) {
      watchTrades(tokenAddress);
    }
  }, [tokenAddress, watchTrades]);

  return {
    trades: tokenAddress ? trades[tokenAddress] || [] : [],
    loading: tokenAddress ? loading[tokenAddress] || false : false,
    error: tokenAddress ? errors[tokenAddress] || null : null,
  };
}
