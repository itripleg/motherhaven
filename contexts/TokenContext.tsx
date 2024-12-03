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
import { TokenState, TokenContractState, TokenMetrics } from "@/types";

interface TokenContextState {
  contractState: TokenContractState;
  metrics: TokenMetrics;
  updateVolume: (ethAmount: string) => Promise<void>;
}

const defaultContractState: TokenContractState = {
  currentPrice: "0",
  totalSupply: "0",
  collateral: "0",
  state: TokenState.NOT_CREATED,
};

const defaultMetrics: TokenMetrics = {
  volumeETH24h: "0",
  tradeCount24h: 0,
  priceChange24h: 0,
  highPrice24h: "0",
  lowPrice24h: "0",
  totalVolumeETH: "0",
  totalTradeCount: 0,
  uniqueHolders: 0,
  marketCap: "0",
  buyPressure24h: 0,
  lastTradeTimestamp: "",
};

const TokenContext = createContext<TokenContextState | null>(null);

export function TokenProvider({
  children,
  tokenAddress,
}: {
  children: React.ReactNode;
  tokenAddress: string;
}) {
  const [contractState, setContractState] =
    useState<TokenContractState>(defaultContractState);
  const [metrics, setMetrics] = useState<TokenMetrics>(defaultMetrics);

  // Update Firestore and local state
  const updateVolume = useCallback(
    async (ethAmount: string) => {
      if (!tokenAddress) return;

      const tokenRef = doc(db, "tokens", tokenAddress);
      try {
        const ethAmountNumber = Number(formatEther(BigInt(ethAmount)));

        // Update Firestore
        await updateDoc(tokenRef, {
          "metrics.totalVolumeETH": increment(ethAmountNumber),
          "metrics.volumeETH24h": increment(ethAmountNumber),
          "metrics.totalTradeCount": increment(1),
          "metrics.tradeCount24h": increment(1),
        });

        // Update local state
        setMetrics((prev) => ({
          ...prev,
          totalVolumeETH: formatEther(
            BigInt(parseEther(prev.totalVolumeETH)) + BigInt(ethAmount)
          ),
          volumeETH24h: formatEther(
            BigInt(parseEther(prev.volumeETH24h)) + BigInt(ethAmount)
          ),
          totalTradeCount: prev.totalTradeCount + 1,
          tradeCount24h: prev.tradeCount24h + 1,
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

        // Update contract state
        setContractState({
          currentPrice: data.contractState?.currentPrice || "0",
          totalSupply: data.contractState?.totalSupply || "0",
          collateral: data.contractState?.collateral || "0",
          state: data.contractState?.state || TokenState.NOT_CREATED,
        });

        // Update metrics
        setMetrics({
          volumeETH24h: data.metrics?.volumeETH24h || "0",
          tradeCount24h: data.metrics?.tradeCount24h || 0,
          priceChange24h: data.metrics?.priceChange24h || 0,
          highPrice24h: data.metrics?.highPrice24h || "0",
          lowPrice24h: data.metrics?.lowPrice24h || "0",
          totalVolumeETH: data.metrics?.totalVolumeETH || "0",
          totalTradeCount: data.metrics?.totalTradeCount || 0,
          uniqueHolders: data.metrics?.uniqueHolders || 0,
          marketCap: data.metrics?.marketCap || "0",
          buyPressure24h: data.metrics?.buyPressure24h || 0,
          lastTradeTimestamp: data.metrics?.lastTradeTimestamp || "",
          timeToGoal: data.metrics?.timeToGoal,
        });
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

    const eventKey = tokenAddress.toLowerCase();
    tokenEventEmitter.addEventListener(eventKey, handleTokenEvent);

    return () => {
      tokenEventEmitter.removeEventListener(eventKey, handleTokenEvent);
    };
  }, [tokenAddress, updateVolume]);

  const value: TokenContextState = {
    contractState,
    metrics,
    updateVolume,
  };

  return (
    <TokenContext.Provider value={value}>{children}</TokenContext.Provider>
  );
}

// Rename to useTokenContext to avoid confusion with the hook
export function useTokenContext() {
  const context = useContext(TokenContext);
  if (!context) {
    throw new Error("useTokenContext must be used within a TokenProvider");
  }
  return context;
}

// Optional: Export specialized hooks for specific parts of the context
export function useTokenMetricsContext() {
  const context = useTokenContext();
  return context.metrics;
}

export function useTokenContractContext() {
  const context = useTokenContext();
  return context.contractState;
}
