"use client";
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  limit,
  Unsubscribe,
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
  const subscriptions = useRef<{ [key: string]: Unsubscribe }>({}).current;

  const watchTrades = useCallback(
    (tokenAddress: string) => {
      const lowercasedAddress = tokenAddress.toLowerCase();
      if (!tokenAddress || subscriptions[lowercasedAddress]) return;

      setLoading((prev) => ({ ...prev, [lowercasedAddress]: true }));

      const tradesRef = collection(db, "trades");
      const tradesQuery = query(
        tradesRef,
        where("token", "==", lowercasedAddress),
        orderBy("timestamp", "desc"),
        limit(100)
      );

      const unsubscribe = onSnapshot(
        tradesQuery,
        (snapshot) => {
          const newTrades: Trade[] = snapshot.docs.map(
            (doc) => doc.data() as Trade
          );
          setTrades((prev) => ({
            ...prev,
            [lowercasedAddress]: newTrades,
          }));
          setErrors((prev) => ({ ...prev, [lowercasedAddress]: null }));
          setLoading((prev) => ({ ...prev, [lowercasedAddress]: false }));
        },
        (error) => {
          console.error(
            `Error fetching trades for token ${lowercasedAddress}:`,
            error
          );
          setErrors((prev) => ({
            ...prev,
            [lowercasedAddress]: "Failed to load trades",
          }));
          setLoading((prev) => ({ ...prev, [lowercasedAddress]: false }));
        }
      );

      subscriptions[lowercasedAddress] = unsubscribe;
    },
    [subscriptions]
  );

  const unwatchTrades = useCallback(
    (tokenAddress: string) => {
      const lowercasedAddress = tokenAddress.toLowerCase();
      if (subscriptions[lowercasedAddress]) {
        subscriptions[lowercasedAddress]();
        delete subscriptions[lowercasedAddress];
      }
    },
    [subscriptions]
  );

  const value = {
    trades,
    loading,
    errors,
    watchTrades,
    unwatchTrades,
  };

  return (
    <TradesContext.Provider value={value}>{children}</TradesContext.Provider>
  );
}

export function useTradesContext() {
  const context = useContext(TradesContext);
  if (!context) {
    throw new Error("useTradesContext must be used within a TradesProvider");
  }
  return context;
}

export function useTrades(tokenAddress: string | undefined) {
  const { trades, loading, errors, watchTrades, unwatchTrades } =
    useTradesContext();

  useEffect(() => {
    if (tokenAddress) {
      watchTrades(tokenAddress);
      return () => {
        unwatchTrades(tokenAddress);
      };
    }
  }, [tokenAddress, watchTrades, unwatchTrades]);

  const lowercasedAddress = tokenAddress?.toLowerCase();

  return {
    trades: lowercasedAddress ? trades[lowercasedAddress] || [] : [],
    loading: lowercasedAddress ? loading[lowercasedAddress] ?? true : false,
    error: lowercasedAddress ? errors[lowercasedAddress] || null : null,
  };
}
