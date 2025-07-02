// final-hooks/useTrades.ts
import { useState, useEffect, useMemo } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  getDocs,
} from "firebase/firestore";
import { db } from "@/firebase";
import { Address } from "viem";
import { Trade } from "@/types";
import { tokenEventEmitter } from "@/components/EventWatcher";

interface TradeAnalytics {
  totalVolume: string;
  tradeCount: number;
  buyCount: number;
  sellCount: number;
  avgTradeSize: string;
  lastTradeTime: string | null;
  buyPressure: number; // 0-1, where 1 = all buys, 0 = all sells
}

/**
 * Consolidated trades hook with real-time updates and analytics
 * Replaces useTokenTrades, useRecentTrades, and useTrades
 */
export function useTrades(tokenAddress?: Address, limitCount = 100) {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Subscribe to Firestore trades
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
      limit(limitCount)
    );

    const unsubscribe = onSnapshot(
      tradesQuery,
      (snapshot) => {
        const tradeData: Trade[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            blockNumber: data.blockNumber,
            ethAmount: data.ethAmount,
            pricePerToken: data.pricePerToken,
            timestamp: data.timestamp,
            token: data.token,
            tokenAmount: data.tokenAmount,
            trader: data.trader,
            transactionHash: data.transactionHash,
            type: data.type,
            fee: data.fee,
          } as Trade;
        });

        setTrades(tradeData);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error("Error fetching trades:", err);
        setError("Failed to load trades");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [tokenAddress, limitCount]);

  // Listen for optimistic updates from EventWatcher
  useEffect(() => {
    if (!tokenAddress) return;

    const handleOptimisticUpdate = (event: any) => {
      if (!["TokensPurchased", "TokensSold"].includes(event.eventName)) return;

      // Create optimistic trade
      const optimisticTrade: Trade = {
        trader: event.data.trader,
        token: tokenAddress,
        type: event.eventName === "TokensPurchased" ? "buy" : "sell",
        ethAmount: event.data.ethAmount?.toString() || "0",
        tokenAmount: event.data.tokenAmount?.toString() || "0",
        pricePerToken: event.data.price?.toString() || "0",
        timestamp: new Date().toISOString(),
        transactionHash:
          event.data.transactionHash || `optimistic_${Date.now()}`,
        blockNumber: 0,
      };

      // Add to top of trades list temporarily
      setTrades((prev) => [optimisticTrade, ...prev]);
    };

    tokenEventEmitter.addEventListener(
      tokenAddress.toLowerCase(),
      handleOptimisticUpdate
    );

    return () => {
      tokenEventEmitter.removeEventListener(
        tokenAddress.toLowerCase(),
        handleOptimisticUpdate
      );
    };
  }, [tokenAddress]);

  // Calculate analytics
  const analytics = useMemo((): TradeAnalytics => {
    if (trades.length === 0) {
      return {
        totalVolume: "0",
        tradeCount: 0,
        buyCount: 0,
        sellCount: 0,
        avgTradeSize: "0",
        lastTradeTime: null,
        buyPressure: 0,
      };
    }

    const buyTrades = trades.filter((t) => t.type === "buy");
    const sellTrades = trades.filter((t) => t.type === "sell");

    const totalVolume = trades.reduce(
      (sum, trade) => sum + parseFloat(trade.ethAmount),
      0
    );

    const avgTradeSize = totalVolume / trades.length;
    const buyPressure = buyTrades.length / trades.length;

    return {
      totalVolume: totalVolume.toFixed(4),
      tradeCount: trades.length,
      buyCount: buyTrades.length,
      sellCount: sellTrades.length,
      avgTradeSize: avgTradeSize.toFixed(4),
      lastTradeTime: trades[0]?.timestamp || null,
      buyPressure,
    };
  }, [trades]);

  // Get recent trades (last N trades)
  const getRecentTrades = (count: number) => {
    return trades.slice(0, count);
  };

  // Get trades in time window
  const getTradesInWindow = (hoursBack: number) => {
    const cutoff = Date.now() - hoursBack * 60 * 60 * 1000;
    return trades.filter((trade) => {
      const tradeTime = new Date(trade.timestamp).getTime();
      return tradeTime >= cutoff;
    });
  };

  // Calculate buy/sell pressure for time window
  const getBuySellPressure = (hoursBack = 24) => {
    const windowTrades = getTradesInWindow(hoursBack);
    if (windowTrades.length === 0) {
      return { buyAmount: 0, sellAmount: 0, buyPressure: 0 };
    }

    const buyAmount = windowTrades
      .filter((t) => t.type === "buy")
      .reduce((sum, t) => sum + parseFloat(t.ethAmount), 0);

    const sellAmount = windowTrades
      .filter((t) => t.type === "sell")
      .reduce((sum, t) => sum + parseFloat(t.ethAmount), 0);

    const totalAmount = buyAmount + sellAmount;
    const buyPressure = totalAmount > 0 ? buyAmount / totalAmount : 0;

    return { buyAmount, sellAmount, buyPressure };
  };

  return {
    // Core data
    trades,
    loading,
    error,

    // Analytics
    analytics,

    // Helper functions
    getRecentTrades,
    getTradesInWindow,
    getBuySellPressure,

    // Convenience getters
    recentTrades: getRecentTrades(8),
    trades24h: getTradesInWindow(24),
    buySellPressure24h: getBuySellPressure(24),
  };
}

/**
 * Hook for global recent trades across all tokens
 */
export function useGlobalRecentTrades(limitCount = 20) {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGlobalTrades = async () => {
      try {
        setLoading(true);
        const tradesRef = collection(db, "trades");
        const q = query(
          tradesRef,
          orderBy("timestamp", "desc"),
          limit(limitCount)
        );

        const snapshot = await getDocs(q);
        const tradeData: Trade[] = snapshot.docs.map(
          (doc) => doc.data() as Trade
        );

        setTrades(tradeData);
        setError(null);
      } catch (err) {
        console.error("Error fetching global trades:", err);
        setError("Failed to load global trades");
      } finally {
        setLoading(false);
      }
    };

    fetchGlobalTrades();
  }, [limitCount]);

  return {
    trades,
    loading,
    error,
  };
}
