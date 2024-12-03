"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { usePublicClient } from "wagmi";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase";
import {
  TokenData,
  TokenContractState,
  TokenMetrics,
  TokenState,
} from "@/types";
import { TokenPage } from "../components/TokenPage";
import { tokenEventEmitter } from "@/components/EventWatcher";
import { TokenProvider } from "@/contexts/TokenContext";
import { TOKEN_ABI } from "@/types";

interface TokenPageProps {
  tokenAddress: string;
  isConnected: boolean;
}

interface ContractData {
  currentPrice: string;
  totalSupply: string;
  collateral: string;
  state: TokenState;
}

// Separate hook for contract data
function useContractData(tokenAddress: string) {
  const publicClient = usePublicClient();
  const [contractData, setContractData] = useState<ContractData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchContractData() {
      if (!tokenAddress || !publicClient) return;

      try {
        // Fetch current contract state using multicall for efficiency
        const [currentPrice, totalSupply, collateral, state] =
          await Promise.all([
            publicClient.readContract({
              address: tokenAddress as `0x${string}`,
              abi: TOKEN_ABI,
              functionName: "getCurrentPrice",
            }),
            // Add other contract reads here
          ]);

        setContractData({
          currentPrice: currentPrice.toString(),
          totalSupply: totalSupply.toString(),
          collateral: collateral.toString(),
          state,
        });
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch contract data"
        );
      } finally {
        setLoading(false);
      }
    }

    fetchContractData();
  }, [tokenAddress, publicClient]);

  return { contractData, loading, error };
}

export default function TokenPageContainer() {
  const { tokenAddress } = useParams();
  const [loading, setLoading] = useState(true);
  const [tokenData, setTokenData] = useState<TokenData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    contractData,
    loading: contractLoading,
    error: contractError,
  } = useContractData(tokenAddress as string);

  // Fetch token data from Firebase
  const fetchTokenData = async () => {
    if (!tokenAddress || !contractData) return;

    try {
      const tokenDocRef = doc(db, "tokens", tokenAddress as string);
      const tokenDoc = await getDoc(tokenDocRef);

      if (!tokenDoc.exists()) {
        setError("Token not found");
        return;
      }

      const firestoreData = tokenDoc.data();

      // Combine Firestore data with current contract state
      const formattedData: TokenData = {
        // Immutable data from Firestore
        id: tokenAddress as string,
        address: tokenAddress as `0x${string}`,
        name: firestoreData.name,
        symbol: firestoreData.symbol,
        creator: firestoreData.creator,
        description: firestoreData.description,
        imageUrl: firestoreData.imageUrl,
        initialPrice: firestoreData.initialPrice,
        maxSupply: firestoreData.maxSupply,
        priceRate: firestoreData.priceRate,
        tradeCooldown: firestoreData.tradeCooldown,
        maxWalletPercentage: firestoreData.maxWalletPercentage,
        createdAt: firestoreData.createdAt,
        creationBlock: firestoreData.creationBlock,
        transactionHash: firestoreData.transactionHash,

        // Current contract state
        contractState: {
          currentPrice: contractData.currentPrice,
          totalSupply: contractData.totalSupply,
          collateral: contractData.collateral,
          state: contractData.state,
        },

        // Metrics from Firestore
        metrics: {
          volumeETH24h: firestoreData.metrics.volumeETH24h,
          tradeCount24h: firestoreData.metrics.tradeCount24h,
          priceChange24h: firestoreData.metrics.priceChange24h,
          highPrice24h: firestoreData.metrics.highPrice24h,
          lowPrice24h: firestoreData.metrics.lowPrice24h,
          totalVolumeETH: firestoreData.metrics.totalVolumeETH,
          totalTradeCount: firestoreData.metrics.totalTradeCount,
          uniqueHolders: firestoreData.metrics.uniqueHolders,
          marketCap: firestoreData.metrics.marketCap,
          buyPressure24h: firestoreData.metrics.buyPressure24h,
          lastTradeTimestamp: firestoreData.metrics.lastTradeTimestamp,
          timeToGoal: firestoreData.metrics.timeToGoal,
        },

        lastTrade: firestoreData.lastTrade,
      };

      setTokenData(formattedData);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch token data"
      );
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    if (contractData) {
      fetchTokenData();
    }
  }, [tokenAddress, contractData]);

  // Listen for token events
  useEffect(() => {
    if (!tokenAddress) return;

    const handleTokenEvent = () => {
      fetchTokenData();
    };

    const eventKey = String(tokenAddress).toLowerCase();
    tokenEventEmitter.addEventListener(eventKey, handleTokenEvent);

    return () => {
      tokenEventEmitter.removeEventListener(eventKey, handleTokenEvent);
    };
  }, [tokenAddress]);

  if (!tokenAddress) return <div>Invalid token address</div>;

  if (loading || contractLoading) {
    return (
      <TokenProvider tokenAddress={tokenAddress as string}>
        <TokenPage
          loading={true}
          tokenData={null}
          isConnected={false}
          address={String(tokenAddress)}
        />
      </TokenProvider>
    );
  }

  if (error || contractError) {
    return (
      <div className="p-4 text-center">
        <h1 className="text-2xl font-bold text-red-500">
          {error || contractError}
        </h1>
      </div>
    );
  }

  if (!tokenData) {
    return (
      <div className="p-4 text-center">
        <h1 className="text-2xl font-bold text-red-500">Token not found</h1>
      </div>
    );
  }

  return (
    <TokenProvider tokenAddress={String(tokenAddress)}>
      <TokenPage
        tokenData={tokenData}
        isConnected={false}
        loading={false}
        address={String(tokenAddress)}
      />
    </TokenProvider>
  );
}
