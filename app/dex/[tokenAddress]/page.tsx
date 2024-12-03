"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { usePublicClient } from "wagmi";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase";
import { TokenData, TokenState } from "@/types";
import { getFormattedTokenData } from "@/utils/tokenUtils";
import { useTokenStats } from "@/hooks/token/useTokenStats";
import TokenPage from "../components/TokenPage";
import { tokenEventEmitter } from "@/components/EventWatcher";
import { TokenProvider } from "@/contexts/TokenContext";

export default function Page() {
  const { tokenAddress } = useParams();
  const publicClient = usePublicClient();
  const [loading, setLoading] = useState(true);
  const [tokenData, setTokenData] = useState<TokenData | null>(null);

  const {
    currentPrice,
    volumeETH,
    tradeCount,
    uniqueHolders,
    tokenState,
    collateral,
    loading: statsLoading,
    error: statsError,
  } = useTokenStats({ tokenAddress: tokenAddress as string });

  // Fetch token data function
  const fetchTokenData = async () => {
    if (!tokenAddress || !publicClient) return;

    try {
      const tokenDocRef = doc(db, "tokens", tokenAddress as string);
      const tokenDoc = await getDoc(tokenDocRef);

      if (tokenDoc.exists()) {
        const data = tokenDoc.data();
        const formattedData = await getFormattedTokenData(
          tokenAddress as string,
          data,
          {
            currentPrice,
            volumeAVAX: volumeETH,
            tradeCount,
            uniqueHolders,
            tokenState,
            collateral,
          },
          publicClient
        );
        setTokenData(formattedData);
      }
    } catch (error) {
      console.error("Error fetching token data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchTokenData();
  }, [
    tokenAddress,
    publicClient,
    currentPrice,
    volumeETH,
    tradeCount,
    uniqueHolders,
    tokenState,
    collateral,
  ]);

  // Simple event listener
  useEffect(() => {
    if (!tokenAddress) return;

    const handleTokenEvent = () => {
      fetchTokenData();
    };

    tokenEventEmitter.addEventListener(
      String(tokenAddress).toLowerCase(),
      handleTokenEvent
    );

    return () => {
      tokenEventEmitter.removeEventListener(
        String(tokenAddress).toLowerCase(),
        handleTokenEvent
      );
    };
  }, [tokenAddress]);

  if (!publicClient) return <div>Initializing...</div>;
  if (loading || statsLoading) {
    return (
      <TokenProvider tokenAddress={tokenAddress as string}>
        <TokenPage
          loading
          tokenData={null}
          isConnected={false}
          address={String(tokenAddress)}
        />
      </TokenProvider>
    );
  }

  if (!tokenData) {
    return (
      <div className="p-4 text-center">
        <h1 className="text-2xl font-bold text-red-500">Token not found</h1>
      </div>
    );
  }

  if (statsError) {
    return (
      <div className="p-4 text-center">
        <h1 className="text-2xl font-bold text-red-500">
          Error loading token stats: {statsError}
        </h1>
      </div>
    );
  }

  return (
    <TokenProvider tokenAddress={tokenAddress as string}>
      <TokenPage
        tokenData={tokenData}
        isConnected={false}
        loading={false}
        address={String(tokenAddress)}
      />
    </TokenProvider>
  );
}
