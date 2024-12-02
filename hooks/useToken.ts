// useToken.ts - Main unified hook
import { useState, useEffect, useMemo } from "react";
import { useReadContracts } from "wagmi";
import { formatEther, parseEther } from "viem";
import {
  collection,
  doc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "@/firebase";
import { Token, TokenStatistics, TokenState, TokenTrade } from "@/types";
import { tokenEventEmitter } from "@/components/EventWatcher";
import { FACTORY_ADDRESS, FACTORY_ABI } from "@/types";

const TRADE_LIMIT = 50;
const UPDATE_INTERVAL = 30000; // 30 seconds

interface UseTokenOptions {
  address?: string;
  includeStats?: boolean;
  includeTrades?: boolean;
  tradeLimit?: number;
}

interface TokenHookReturn {
  // Basic token data
  token: Token | null;

  // Extended statistics
  stats: TokenStatistics | null;

  // Recent trades
  trades: TokenTrade[];

  // Trading pressure
  buySellPressure: {
    buyAmount: string;
    sellAmount: string;
  };

  // Status
  loading: boolean;
  error: string | null;

  // Contract state
  tokenState: TokenState;
  collateral: string;
}

export function useToken({
  address,
  includeStats = true,
  includeTrades = false,
  tradeLimit = TRADE_LIMIT,
}: UseTokenOptions): TokenHookReturn {
  const [token, setToken] = useState<Token | null>(null);
  const [stats, setStats] = useState<TokenStatistics | null>(null);
  const [trades, setTrades] = useState<TokenTrade[]>([]);
  const [buySellPressure, setBuySellPressure] = useState({
    buyAmount: "0",
    sellAmount: "0",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Contract reads
  const { data: contractData, refetch } = useReadContracts({
    contracts: address
      ? [
          {
            address: FACTORY_ADDRESS as `0x${string}`,
            abi: FACTORY_ABI,
            functionName: "getCurrentPrice",
            args: [address as `0x${string}`],
          },
          {
            address: FACTORY_ADDRESS as `0x${string}`,
            abi: FACTORY_ABI,
            functionName: "collateral",
            args: [address as `0x${string}`],
          },
          {
            address: FACTORY_ADDRESS as `0x${string}`,
            abi: FACTORY_ABI,
            functionName: "getTokenState",
            args: [address as `0x${string}`],
          },
        ]
      : [],
  });

  // Basic token data subscription
  useEffect(() => {
    if (!address) return;

    const unsubscribe = onSnapshot(
      doc(db, "tokens", address),
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          setToken({
            id: snapshot.id,
            name: data.name,
            symbol: data.symbol,
            address: data.address,
            currentPrice: Number(data.statistics?.currentPrice || 0),
            createdAt: new Date(data.createdAt),
            imageUrl: data.imageUrl,
          });

          if (includeStats) {
            setStats({
              totalSupply: data.statistics?.totalSupply || "0",
              currentPrice: data.statistics?.currentPrice || "0",
              volumeETH: data.statistics?.volumeETH || "0",
              tradeCount: data.statistics?.tradeCount || 0,
              uniqueHolders: data.statistics?.uniqueHolders || 0,
              priceChange24h: data.statistics?.priceChange24h,
              highPrice24h: data.statistics?.highPrice24h,
              lowPrice24h: data.statistics?.lowPrice24h,
              lastTradeTimestamp: data.statistics?.lastTradeTimestamp,
            });
          }
        }
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching token:", err);
        setError("Failed to load token data");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [address, includeStats]);

  // Trades subscription
  useEffect(() => {
    if (!address || !includeTrades) return;

    const tradesRef = collection(db, "trades");
    const q = query(
      tradesRef,
      where("token", "==", address),
      orderBy("timestamp", "desc"),
      limit(tradeLimit)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const tradeData = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            timestamp: data.timestamp,
            type: data.type,
            price: data.pricePerToken,
            amount: data.tokenAmount,
            ethAmount: data.ethAmount,
            trader: data.trader,
          };
        });

        setTrades(tradeData);

        // Calculate buy/sell pressure
        const pressure = tradeData.reduce(
          (acc, trade) => ({
            buyAmount:
              trade.type === "buy"
                ? (
                    BigInt(parseEther(acc.buyAmount)) +
                    BigInt(parseEther(trade.ethAmount))
                  ).toString()
                : acc.buyAmount,
            sellAmount:
              trade.type === "sell"
                ? (
                    BigInt(parseEther(acc.sellAmount)) +
                    BigInt(parseEther(trade.ethAmount))
                  ).toString()
                : acc.sellAmount,
          }),
          { buyAmount: "0", sellAmount: "0" }
        );

        setBuySellPressure({
          buyAmount: formatEther(pressure.buyAmount),
          sellAmount: formatEther(pressure.sellAmount),
        });
      },
      (err) => {
        console.error("Error fetching trades:", err);
        setError("Failed to load trade data");
      }
    );

    return () => unsubscribe();
  }, [address, includeTrades, tradeLimit]);

  // Event listener for updates
  useEffect(() => {
    if (!address) return;

    const handleTokenEvent = async (event: {
      eventName: string;
      data: any;
    }) => {
      if (["TokensPurchased", "TokensSold"].includes(event.eventName)) {
        await refetch();
      }
    };

    tokenEventEmitter.addEventListener(address.toLowerCase(), handleTokenEvent);

    return () => {
      tokenEventEmitter.removeEventListener(
        address.toLowerCase(),
        handleTokenEvent
      );
    };
  }, [address, refetch]);

  // Parse contract data
  const { tokenState, collateral } = useMemo(() => {
    if (!contractData) {
      return { tokenState: TokenState.NOT_CREATED, collateral: "0" };
    }

    const [priceData, collateralData, stateData] = contractData;

    return {
      tokenState: Number(stateData?.result || 0),
      collateral: formatEther((collateralData?.result as bigint) || 0n),
    };
  }, [contractData]);

  return {
    token,
    stats,
    trades,
    buySellPressure,
    loading,
    error,
    tokenState,
    collateral,
  };
}

// Optional: Export specialized hooks for specific use cases
export function useTokenStats(address?: string) {
  return useToken({ address, includeStats: true, includeTrades: false });
}

export function useTokenTrades(address?: string) {
  return useToken({ address, includeStats: false, includeTrades: true });
}

export function useTokenPriceOnly(address?: string) {
  return useToken({ address, includeStats: false, includeTrades: false });
}
