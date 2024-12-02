// /hooks/token/useTokenStats.tsx
import { useState, useEffect } from "react";
import { useReadContracts } from "wagmi";
import { formatEther } from "viem";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/firebase";
import { TokenState, TokenStatistics } from "@/types";
import { tokenEventEmitter } from "@/components/EventWatcher";
import { FACTORY_ADDRESS, FACTORY_ABI } from "@/types";

const factoryContract = {
  address: FACTORY_ADDRESS as `0x${string}`,
  abi: FACTORY_ABI,
} as const;

interface UseTokenStatsProps {
  tokenAddress?: string;
}

interface TokenStats extends TokenStatistics {
  loading: boolean;
  error: string | null;
  tokenState: TokenState;
  collateral: string;
}

const mapContractStateToAppState = (contractState: number): TokenState => {
  switch (contractState) {
    case 0:
      return TokenState.NOT_CREATED;
    case 1:
      return TokenState.TRADING;
    case 2: // GOAL_REACHED
    case 3: // HALTED
      return TokenState.HALTED;
    default:
      return TokenState.NOT_CREATED;
  }
};

export function useTokenStats({
  tokenAddress,
}: UseTokenStatsProps): TokenStats {
  const [stats, setStats] = useState<TokenStats>({
    loading: true,
    error: null,
    totalSupply: "0",
    currentPrice: "0",
    volumeETH: "0",
    tradeCount: 0,
    uniqueHolders: 0,
    tokenState: TokenState.NOT_CREATED,
    collateral: "0",
  });

  // Contract reads
  const { data: contractData, isError } = useReadContracts({
    contracts: tokenAddress
      ? [
          {
            ...factoryContract,
            functionName: "getCurrentPrice",
            args: [tokenAddress as `0x${string}`],
          },
          {
            ...factoryContract,
            functionName: "collateral",
            args: [tokenAddress as `0x${string}`],
          },
          {
            ...factoryContract,
            functionName: "getTokenState",
            args: [tokenAddress as `0x${string}`],
          },
        ]
      : [],
  });

  // Update stats when contract data changes
  useEffect(() => {
    if (!contractData || isError) return;

    const [currentPriceData, collateralData, tokenStateData] = contractData;

    // Type guard for successful reads
    const isSuccess = (data: any) =>
      data && "result" in data && data.status === "success";

    // Get values with type safety
    const currentPrice = isSuccess(currentPriceData)
      ? (currentPriceData?.result as bigint)
      : 0n;

    const collateral = isSuccess(collateralData)
      ? (collateralData?.result as bigint)
      : 0n;

    // Map the contract state to our simplified app state
    const rawContractState = isSuccess(tokenStateData)
      ? Number(tokenStateData?.result as bigint)
      : 0;

    const tokenState = mapContractStateToAppState(rawContractState);

    setStats((prev) => ({
      ...prev,
      currentPrice: formatEther(currentPrice),
      collateral: formatEther(collateral),
      tokenState,
      loading: false,
      error: null,
    }));
  }, [contractData, isError]);

  // Listen to Firestore updates for statistical data
  useEffect(() => {
    if (!tokenAddress) return;

    const unsubscribe = onSnapshot(
      doc(db, "tokens", tokenAddress),
      (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          setStats((prev) => ({
            ...prev,
            volumeETH: data.statistics?.volumeETH || "0",
            tradeCount: data.statistics?.tradeCount || 0,
            uniqueHolders: data.statistics?.uniqueHolders || 0,
          }));
        }
      },
      (error) => {
        console.error("Error listening to token updates:", error);
        setStats((prev) => ({ ...prev, error: error.message }));
      }
    );

    return () => unsubscribe();
  }, [tokenAddress]);

  // Listen to token events from the global emitter
  useEffect(() => {
    if (!tokenAddress) return;

    const handleTokenEvent = (event: { eventName: string; data: any }) => {
      switch (event.eventName) {
        case "TokensPurchased":
          setStats((prev) => ({
            ...prev,
            tradeCount: prev.tradeCount + 1,
            volumeETH: formatEther(
              BigInt(parseFloat(prev.volumeETH) * 10 ** 18) +
                BigInt(event.data.price)
            ),
          }));
          break;

        case "TokensSold":
          setStats((prev) => ({
            ...prev,
            tradeCount: prev.tradeCount + 1,
            volumeETH: formatEther(
              BigInt(parseFloat(prev.volumeETH) * 10 ** 18) +
                BigInt(event.data.ethAmount)
            ),
          }));
          break;

        case "TradingHalted":
          setStats((prev) => ({
            ...prev,
            tokenState: TokenState.HALTED, // Changed from GOAL_REACHED to HALTED
          }));
          break;
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

  return stats;
}
