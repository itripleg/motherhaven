"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { usePublicClient } from "wagmi";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase";
import { TokenData } from "@/types";
import { TokenPage } from "../components/TokenPage";
import { TokenProvider } from "@/contexts/TokenContext";
import { formatFirestoreData } from "@/utils/tokenFormatters";
import { useTokenStats } from "@/hooks/token/useTokenStats";

export default function Page() {
  const { tokenAddress } = useParams();
  const publicClient = usePublicClient();
  const [loading, setLoading] = useState(true);
  const [tokenData, setTokenData] = useState<TokenData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    currentPrice,
    volumeETH,
    tradeCount,
    uniqueHolders,
    tokenState,
    collateral,
    loading: statsLoading,
  } = useTokenStats({ tokenAddress: tokenAddress as string });

  const fetchTokenData = async () => {
    if (!tokenAddress || !publicClient) return;

    try {
      const tokenDocRef = doc(db, "tokens", tokenAddress as string);
      const tokenDoc = await getDoc(tokenDocRef);

      if (tokenDoc.exists()) {
        const rawData = tokenDoc.data();
        console.log("Raw Firestore data:", rawData);

        const formattedData = formatFirestoreData(tokenDoc.id, rawData, {
          currentPrice,
          collateral: String(collateral),
          tokenState,
        });

        console.log("Formatted token data:", formattedData);
        setTokenData(formattedData);
      } else {
        setError("Token not found");
        setTokenData(null);
      }
    } catch (error) {
      console.error("Error fetching token data:", error);
      setError("Error loading token data");
      setTokenData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTokenData();
  }, [tokenAddress, publicClient, currentPrice, collateral, tokenState]);

  if (!publicClient) return <div>Initializing...</div>;

  return (
    <TokenProvider tokenAddress={tokenAddress as string}>
      <TokenPage
        tokenData={tokenData}
        isConnected={false}
        loading={loading || statsLoading}
        address={String(tokenAddress)}
      />
    </TokenProvider>
  );
}
