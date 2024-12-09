// hooks/contracts/useFactoryContracts.ts
import { useReadContracts } from "wagmi";
import { formatEther, Address } from "viem";
import { FACTORY_ADDRESS, FACTORY_ABI } from "@/types";

const factoryContract = {
  address: FACTORY_ADDRESS as `0x${string}`,
  abi: FACTORY_ABI,
} as const;

export function useFactoryContracts(tokenAddress?: Address) {
  const {
    data: contractData,
    isError,
    refetch,
    isLoading,
  } = useReadContracts({
    contracts: tokenAddress
      ? [
          {
            ...factoryContract,
            functionName: "getCurrentPrice",
            args: [tokenAddress],
          },
          {
            ...factoryContract,
            functionName: "collateral",
            args: [tokenAddress],
          },
        ]
      : [],
  });

  return {
    currentPrice: contractData?.[0]?.result
      ? formatEther(contractData[0].result as bigint)
      : "0",
    collateral: contractData?.[1]?.result
      ? formatEther(contractData[1].result as bigint)
      : "0",
    isLoading,
    isError,
    refetch,
  };
}

// contexts/TokenContext.tsx
import { createContext, useContext, useEffect } from "react";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "@/firebase";
import { tokenEventEmitter } from "@/components/EventWatcher";

interface TokenContextValue {
  price: string;
  collateral: string;
  loading: boolean;
  error: string | null;
}

const TokenContext = createContext<TokenContextValue | null>(null);

export function TokenProvider({
  children,
  tokenAddress,
}: {
  children: React.ReactNode;
  tokenAddress: string;
}) {
  const {
    currentPrice: price,
    collateral,
    isLoading: loading,
    isError,
    refetch,
  } = useFactoryContracts(tokenAddress as `0x${string}`);

  // Keep Firestore in sync
  useEffect(() => {
    if (!tokenAddress || loading) return;

    const updateFirestore = async () => {
      const tokenRef = doc(db, "tokens", tokenAddress);
      await updateDoc(tokenRef, {
        "statistics.currentPrice": price,
        "statistics.collateral": collateral,
      });
    };

    updateFirestore().catch(console.error);
  }, [tokenAddress, price, collateral, loading]);

  // Listen to trade events
  useEffect(() => {
    if (!tokenAddress) return;

    const handleTokenEvent = (event: any) => {
      if (
        event.eventName === "TokensPurchased" ||
        event.eventName === "TokensSold"
      ) {
        refetch();
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
  }, [tokenAddress, refetch]);

  const value: TokenContextValue = {
    price,
    collateral,
    loading,
    error: isError ? "Failed to fetch token data" : null,
  };

  return (
    <TokenContext.Provider value={value}>{children}</TokenContext.Provider>
  );
}

export function useToken() {
  const context = useContext(TokenContext);
  if (!context) {
    throw new Error("useToken must be used within a TokenProvider");
  }
  return context;
}

// Debug component
function TokenDebug() {
  const { price, collateral, loading, error } = useToken();

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="space-y-2">
      <div>Current Price: {price} ETH</div>
      <div>Collateral: {collateral} ETH</div>
    </div>
  );
}
