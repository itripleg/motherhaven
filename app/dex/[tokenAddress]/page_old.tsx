"use client";
import { TokenProvider } from "@/contexts/TokenContext";
import { db } from "@/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useState, useEffect } from "react";
import { TokenPage } from "../components/TokenPage";
import { useParams } from "next/navigation";
interface TokenMetadata {
  address: `0x${string}`;
  name: string;
  symbol: string;
  creator: string;
  imageUrl: string;
  fundingGoal: string;
  burnManager: string;
  createdAt: string;
  blockNumber: number;
}

// page.tsx
export default function TokenPageContainer() {
  const { tokenAddress } = useParams();
  const [metadata, setMetadata] = useState<TokenMetadata | null>(null);

  // Fetch only static metadata from Firestore
  useEffect(() => {
    if (!tokenAddress) return;

    const fetchMetadata = async () => {
      const docRef = doc(db, "tokens", tokenAddress);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        // Only grab the static/metadata fields
        const data = docSnap.data();
        setMetadata({
          address: tokenAddress as `0x${string}`,
          name: data.name,
          symbol: data.symbol,
          creator: data.creator,
          imageUrl: data.imageUrl,
          fundingGoal: data.fundingGoal,
          burnManager: data.burnManager,
          createdAt: data.createdAt,
          blockNumber: data.blockNumber,
        });
      }
    };

    fetchMetadata();
  }, [tokenAddress]);

  if (!tokenAddress) return <div>Invalid token address</div>;

  return (
    <TokenProvider tokenAddress={String(tokenAddress)}>
      <TokenPage metadata={metadata} isConnected={false} />
    </TokenProvider>
  );
}
