// /new-hooks/useTokenTrades.ts

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
import { type Address } from "viem";
import { Trade } from "@/types"; // Use the single, official Trade type

/**
 * A robust hook to fetch both historical and real-time trade history for a given token.
 * It correctly maps the Firestore data structure to the official Trade type.
 */
export function useTokenTrades(tokenAddress?: Address) {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tokenAddress) {
      setLoading(false);
      return;
    }

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

          // --- DEFINITIVE FIX FOR DATA MAPPING ---

          // 1. Convert ISO string from Firestore to a UNIX timestamp number (in seconds)
          // This creates a consistent, usable format for all components.
          const timestampInSeconds = data.timestamp
            ? Math.floor(new Date(data.timestamp).getTime() / 1000)
            : 0;

          return {
            // 2. Use the correct timestamp format
            timestamp: timestampInSeconds,
            type: data.type || "buy",
            // 3. Use the correct field name from Firestore: `tokenAmount`
            amount: data.tokenAmount?.toString() || "0",
            ethAmount: data.ethAmount?.toString() || "0",
            trader: data.trader || "0x0000000000000000000000000000000000000000",
          };
        });

        setTrades(tradeDocs.reverse());
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error("Error fetching trades from Firestore:", err);
        setError("Failed to load trade history");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [tokenAddress]);

  return { trades, loading, error };
}
