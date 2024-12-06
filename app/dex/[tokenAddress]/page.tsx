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
import { Skeleton } from "@/components/ui/skeleton";
import { TokenNotFound } from "../components/TokenNotFound";

import { Token, TokenState, isValidToken } from "@/types";

export default function Page() {
  const { tokenAddress } = useParams();
  const [token, setToken] = useState<Token | null>(null);
  const [loading, setLoading] = useState(true);
<<<<<<< Updated upstream
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
=======
  const [error, setError] = useState<string | null>(null);

>>>>>>> Stashed changes
  const fetchTokenData = async () => {
    if (!tokenAddress) return;

    try {
<<<<<<< Updated upstream
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
=======
      const doc = await getDoc(doc(db, "tokens", tokenAddress));

      if (doc.exists()) {
        const data = doc.data();
        if (isValidToken(data)) {
          setToken(data);
        } else {
          setError("Invalid token data");
        }
      } else {
        setError("Token not found");
      }
    } catch (error) {
      setError("Error loading token");
>>>>>>> Stashed changes
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
<<<<<<< Updated upstream
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
      <div className="container mx-auto py-8">
        <Skeleton className="h-12 w-3/4 mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Skeleton className="h-[200px]" />
          <Skeleton className="h-[200px]" />
          <Skeleton className="h-[200px]" />
=======
    if (tokenAddress && publicClient) {
      console.log("Fetching token data for:", tokenAddress);
      fetchTokenData();
    }
  }, [tokenAddress, publicClient, currentPrice, collateral, tokenState]);

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-red-500 text-center">
          <p>Error encountered:</p>
          <p>{error}</p>
>>>>>>> Stashed changes
        </div>
      </div>
    );
  }

<<<<<<< Updated upstream
  if (!tokenData) {
    return <TokenNotFound address={String(tokenAddress)} />;
  }

  if (statsError) {
    return (
      <div className="p-4 text-center">
        <h1 className="text-2xl font-bold text-red-500">
          Error loading token stats: {statsError}
        </h1>
=======
  if (!publicClient) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div>Connecting to network...</div>
>>>>>>> Stashed changes
      </div>
    );
  }

  return (
    <TokenPage
      tokenData={tokenData}
      price={Number(currentPrice || 0)}
      tokenState={tokenState}
      isConnected={false}
      loading={false}
      address={String(tokenAddress)}
    />
  );
}
