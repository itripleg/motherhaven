import { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase";
import { TokenData } from "../types";

export function useTokenData(tokenAddress: string) {
  const [tokenData, setTokenData] = useState<TokenData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!tokenAddress) {
      setLoading(false);
      return;
    }

    async function fetchTokenData() {
      try {
        const tokenDocRef = doc(db, "tokens", tokenAddress);
        const tokenDoc = await getDoc(tokenDocRef);

        if (tokenDoc.exists()) {
          const data = tokenDoc.data();
          setTokenData({
            id: tokenDoc.id,
            name: data.name,
            symbol: data.symbol,
            address: data.address,
            description: data.description || undefined,
            creationTimestamp: data.timestamp,
            imageUrl: data.imageUrl || undefined,
            creator: data.creator,
            creationBlock: data.creationBlock,
            transactionHash: data.transactionHash,
          });
        } else {
          throw new Error("Token not found");
        }
      } catch (error) {
        setError(
          error instanceof Error ? error : new Error("Unknown error occurred")
        );
      } finally {
        setLoading(false);
      }
    }

    fetchTokenData();
  }, [tokenAddress]);

  return { tokenData, loading, error };
}
