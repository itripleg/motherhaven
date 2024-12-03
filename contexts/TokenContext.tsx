// contexts/TokenContext.tsx
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { doc, onSnapshot, updateDoc, increment } from "firebase/firestore";
import { db } from "@/firebase";
import { formatEther, parseEther } from "viem";
import { tokenEventEmitter } from "@/components/EventWatcher";
import { TokenState, TokenStatistics } from "@/types";

interface TokenContextType extends TokenStatistics {
  tokenState: TokenState;
  updateVolume: (ethAmount: string) => Promise<void>;
}

const defaultStats: TokenStatistics = {
  currentPrice: "0",
  collateral: "0",
  volumeETH: "0",
  tradeCount: 0,
  uniqueTraders: 0,
};

const TokenContext = createContext<TokenContextType | null>(null);

export function TokenProvider({
  children,
  tokenAddress,
}: {
  children: React.ReactNode;
  tokenAddress: string;
}) {
  const [stats, setStats] = useState<TokenStatistics>(defaultStats);
  const [tokenState, setTokenState] = useState<TokenState>(
    TokenState.NOT_CREATED
  );

  // Update Firestore and local state
  const updateVolume = useCallback(
    async (ethAmount: string) => {
      if (!tokenAddress) return;

      const tokenRef = doc(db, "tokens", tokenAddress);
      try {
        // Update Firestore
        await updateDoc(tokenRef, {
          "statistics.volumeETH": increment(
            Number(formatEther(BigInt(ethAmount)))
          ),
          "statistics.tradeCount": increment(1),
        });

        // Update local state
        setStats((prev) => ({
          ...prev,
          volumeETH: formatEther(
            BigInt(parseEther(prev.volumeETH)) + BigInt(ethAmount)
          ),
          tradeCount: prev.tradeCount + 1,
        }));
      } catch (error) {
        console.error("Error updating volume:", error);
      }
    },
    [tokenAddress]
  );

  // Listen to Firestore updates
  useEffect(() => {
    if (!tokenAddress) return;

    const tokenRef = doc(db, "tokens", tokenAddress);
    const unsubscribe = onSnapshot(tokenRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setStats({
          currentPrice: data.statistics?.currentPrice || "0",
          collateral: data.statistics?.collateral || "0",
          volumeETH: data.statistics?.volumeETH || "0",
          tradeCount: data.statistics?.tradeCount || 0,
          uniqueTraders: data.statistics?.uniqueTraders || 0,
          lastTradeTimestamp: data.statistics?.lastTradeTimestamp,
          priceHistory: data.statistics?.priceHistory,
          metrics24h: data.statistics?.metrics24h,
        });
        setTokenState(data.currentState || TokenState.NOT_CREATED);
      }
    });

    return () => unsubscribe();
  }, [tokenAddress]);

  // Listen to trade events
  useEffect(() => {
    if (!tokenAddress) return;

    const handleTokenEvent = (event: any) => {
      if (
        event.eventName === "TokensPurchased" ||
        event.eventName === "TokensSold"
      ) {
        updateVolume(event.data.ethAmount.toString());
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
  }, [tokenAddress, updateVolume]);

  const value: TokenContextType = {
    ...stats,
    tokenState,
    updateVolume,
  };

  return (
    <TokenContext.Provider value={value}>{children}</TokenContext.Provider>
  );
}

export function useToken() {
  const context = useContext(TokenContext);
  if (!context) {
    throw new Error("useToken must be used within a TokenProvider");
  }
  return context;
}
