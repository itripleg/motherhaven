"use client";

import { TokenProvider, useToken } from "@/contexts/TokenContext";
import { TokenPage } from "../components/TokenPage";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase";

// Define the metadata type
interface TokenMetadata {
  address: `0x${string}`;
  name: string;
  symbol: string;
  imageUrl?: string | null;
}

function TokenDebug() {
  const { price, collateral, loading, error } = useToken();

  return (
    <div className="p-4 space-y-2 text-white">
      <div>Price: {price} AVAX</div>
      <div>Collateral: {collateral} AVAX</div>
      {loading && <div>Loading...</div>}
      {error && <div>Error: {error}</div>}
    </div>
  );
}

export default function TokenPageContainer() {
  const { tokenAddress } = useParams();
  const [metadata, setMetadata] = useState<TokenMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMetadata() {
      if (!tokenAddress) return;

      try {
        setLoading(true);
        const docRef = doc(db, "tokens", tokenAddress as string);
        const docSnap = await getDoc(docRef);

        console.log("Firestore data:", docSnap.data()); // Debug log

        if (docSnap.exists()) {
          const data = docSnap.data();
          const formattedMetadata = {
            address: tokenAddress as `0x${string}`,
            name: data.name,
            symbol: data.symbol,
            imageUrl: data.imageUrl || null,
          };
          console.log("Formatted metadata:", formattedMetadata); // Debug log
          setMetadata(formattedMetadata);
        } else {
          setError("Token not found");
        }
      } catch (err) {
        console.error("Error fetching metadata:", err);
        setError(
          err instanceof Error ? err.message : "Error fetching token data"
        );
      } finally {
        setLoading(false);
      }
    }

    fetchMetadata();
  }, [tokenAddress]);

  if (!tokenAddress) return <div>Invalid token address</div>;

  return (
    <TokenProvider tokenAddress={String(tokenAddress)}>
      <div>
        <TokenDebug />
        {loading ? (
          <div>Loading metadata...</div>
        ) : error ? (
          <div>Error: {error}</div>
        ) : (
          <TokenPage metadata={metadata} isConnected={false} />
        )}
      </div>
    </TokenProvider>
  );
}
