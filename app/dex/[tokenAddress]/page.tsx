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

  useEffect(() => {
    async function fetchTokenData() {
      if (!tokenAddress || !publicClient) return;

      try {
        const tokenDocRef = doc(db, "tokens", tokenAddress as string);
        const tokenDoc = await getDoc(tokenDocRef);

        if (tokenDoc.exists()) {
          const data = tokenDoc.data();
          console.log("This is the tokenDoc.data : ", data); //this has the correct currentState!
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
          console.log(
            "This is the formatted data being called from the [tokenAddress]/page.tsx getFormattedTokenData function : ",
            formattedData
          ); // this is returning the wrong currentState for the token - it's not matching what's in the firestore!
        }
      } catch (error) {
        console.error("Error fetching token data:", error);
      } finally {
        setLoading(false);
      }
    }

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

  if (!publicClient) return <div>Initializing...</div>;
  if (loading || statsLoading) {
    return (
      <TokenPage
        loading
        tokenData={null}
        price={0}
        tokenState={tokenState}
        isConnected={false}
        address={String(tokenAddress)}
      />
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
