"use client";
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import {
  doc,
  onSnapshot,
  collection,
  query,
  limit as limitQuery,
  getDocs,
  orderBy,
  Unsubscribe,
} from "firebase/firestore";
import { db } from "@/firebase";
import { Address } from "viem";
import { Token, TokenState } from "@/types";
import {
  useFactoryConfigContext,
  FactoryConfig,
} from "./FactoryConfigProvider";

interface TokenContextState {
  tokens: { [address: string]: Token };
  loading: { [address: string]: boolean };
  errors: { [address: string]: string | null };
  watchToken: (address: string) => void;
  unwatchToken: (address: string) => void;
  getRecentTokens: (limit?: number) => Promise<Token[]>;
}

const TokenContext = createContext<TokenContextState | null>(null);

const mapTokenData = (
  address: string,
  data: any,
  factoryConfig: FactoryConfig
): Token => {
  console.log("Mapping token data:", { address, data, factoryConfig });

  return {
    address: address.toLowerCase() as Address,
    name: data.name || "Unnamed Token",
    symbol: data.symbol || "N/A",
    imageUrl: data.imageUrl || "",
    description: data.description || "",
    creator: (data.creator || "0x0").toLowerCase() as Address,
    burnManager: (data.burnManager || "0x0").toLowerCase() as Address,
    fundingGoal: data.fundingGoal?.toString() || "0",
    createdAt: data.createdAt || new Date().toISOString(),
    blockNumber: data.blockNumber || 0,
    transactionHash: data.transactionHash || "",
    ...factoryConfig,
    collateral: "0",
    virtualSupply: "0",
    state: TokenState.NOT_CREATED,
    currentPrice: "0",
    totalSupply: "0",
  };
};

export function TokenProvider({ children }: { children: React.ReactNode }) {
  const { config: factoryConfig, isLoading: isConfigLoading } =
    useFactoryConfigContext();
  const [tokens, setTokens] = useState<{ [address: string]: Token }>({});
  const [loading, setLoading] = useState<{ [address: string]: boolean }>({});
  const [errors, setErrors] = useState<{ [address: string]: string | null }>(
    {}
  );
  const subscriptions = useRef<{ [key: string]: Unsubscribe }>({}).current;
  const refCounts = useRef<{ [key: string]: number }>({}).current; // Add reference counting

  console.log("TokenProvider render:", {
    isConfigLoading,
    hasFactoryConfig: !!factoryConfig,
    tokensCount: Object.keys(tokens).length,
    loadingCount: Object.keys(loading).length,
  });

  const watchToken = useCallback(
    (tokenAddress: string) => {
      console.log("watchToken called:", {
        tokenAddress,
        hasFactoryConfig: !!factoryConfig,
        isConfigLoading,
        alreadyWatching: !!subscriptions[tokenAddress.toLowerCase()],
        currentRefCount: refCounts[tokenAddress.toLowerCase()] || 0,
      });

      if (!factoryConfig || !tokenAddress) {
        console.log("Early return from watchToken - no config or address");
        return;
      }

      const lowercasedAddress = tokenAddress.toLowerCase();

      // Increment reference count
      refCounts[lowercasedAddress] = (refCounts[lowercasedAddress] || 0) + 1;
      console.log(
        "📈 Incremented ref count for",
        lowercasedAddress,
        "to",
        refCounts[lowercasedAddress]
      );

      // Only set up subscription if this is the first reference
      if (refCounts[lowercasedAddress] === 1) {
        console.log(
          "🚀 Setting loading to TRUE for:",
          lowercasedAddress,
          "(first reference)"
        );
        setLoading((prev) => {
          const newLoading = { ...prev, [lowercasedAddress]: true };
          console.log("📊 New loading state (start):", newLoading);
          return newLoading;
        });
        const tokenRef = doc(db, "tokens", lowercasedAddress);

        console.log(
          "Setting up Firestore subscription for:",
          lowercasedAddress
        );

        const unsubscribe = onSnapshot(
          tokenRef,
          (doc) => {
            console.log("Firestore snapshot received:", {
              address: lowercasedAddress,
              exists: doc.exists(),
              data: doc.data(),
            });

            if (doc.exists()) {
              const tokenData = mapTokenData(
                lowercasedAddress,
                doc.data(),
                factoryConfig
              );
              setTokens((prev) => ({
                ...prev,
                [lowercasedAddress]: tokenData,
              }));
              setErrors((prev) => ({ ...prev, [lowercasedAddress]: null }));
              console.log(
                "✅ Setting loading to FALSE for:",
                lowercasedAddress
              );
            } else {
              console.log("Token document does not exist:", lowercasedAddress);
              setErrors((prev) => ({
                ...prev,
                [lowercasedAddress]: "Token not found in database",
              }));
              console.log(
                "❌ Setting loading to FALSE for:",
                lowercasedAddress
              );
            }
            setLoading((prev) => {
              const newLoading = { ...prev, [lowercasedAddress]: false };
              console.log("📊 New loading state:", newLoading);
              return newLoading;
            });
          },
          (error) => {
            console.error("Firestore subscription error:", error);
            setErrors((prev) => ({
              ...prev,
              [lowercasedAddress]: error.message,
            }));
            console.log(
              "🔥 Setting loading to FALSE due to error for:",
              lowercasedAddress
            );
            setLoading((prev) => {
              const newLoading = { ...prev, [lowercasedAddress]: false };
              console.log("📊 New loading state (error):", newLoading);
              return newLoading;
            });
          }
        );

        subscriptions[lowercasedAddress] = unsubscribe;
      } else {
        console.log(
          "🔄 Subscription already exists for",
          lowercasedAddress,
          "- just incremented ref count"
        );
      }
    },
    [subscriptions, factoryConfig, isConfigLoading, refCounts]
  );

  const unwatchToken = useCallback(
    (tokenAddress: string) => {
      const lowercasedAddress = tokenAddress.toLowerCase();
      const currentRefCount = refCounts[lowercasedAddress] || 0;

      console.log(
        "unwatchToken called:",
        lowercasedAddress,
        "current ref count:",
        currentRefCount
      );

      if (currentRefCount <= 0) {
        console.log(
          "⚠️ Ref count already 0 or negative for",
          lowercasedAddress
        );
        return;
      }

      // Decrement reference count
      refCounts[lowercasedAddress] = currentRefCount - 1;
      console.log(
        "📉 Decremented ref count for",
        lowercasedAddress,
        "to",
        refCounts[lowercasedAddress]
      );

      // Only clean up subscription if no more references
      if (refCounts[lowercasedAddress] === 0) {
        console.log(
          "🧹 Cleaning up subscription for",
          lowercasedAddress,
          "(no more references)"
        );
        if (subscriptions[lowercasedAddress]) {
          subscriptions[lowercasedAddress]();
          delete subscriptions[lowercasedAddress];
        }
      } else {
        console.log(
          "🔄 Still have",
          refCounts[lowercasedAddress],
          "references for",
          lowercasedAddress,
          "- keeping subscription"
        );
      }
    },
    [subscriptions, refCounts]
  );

  const getRecentTokens = useCallback(
    async (limit: number = 10): Promise<Token[]> => {
      if (!factoryConfig) return [];
      const tokensRef = collection(db, "tokens");
      const q = query(
        tokensRef,
        orderBy("createdAt", "desc"),
        limitQuery(limit)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) =>
        mapTokenData(doc.id, doc.data(), factoryConfig)
      );
    },
    [factoryConfig]
  );

  return (
    <TokenContext.Provider
      value={{
        tokens,
        loading,
        errors,
        watchToken,
        unwatchToken,
        getRecentTokens,
      }}
    >
      {children}
    </TokenContext.Provider>
  );
}

export function useTokenContext() {
  const context = useContext(TokenContext);
  if (!context)
    throw new Error("useTokenContext must be used within a TokenProvider");
  return context;
}

export function useToken(address: string) {
  const { tokens, loading, errors, watchToken, unwatchToken } =
    useTokenContext();
  const lowercasedAddress = address?.toLowerCase();

  console.log("useToken called:", {
    address,
    lowercasedAddress,
    hasToken: !!tokens[lowercasedAddress],
    isLoading: loading[lowercasedAddress],
    error: errors[lowercasedAddress],
  });

  useEffect(() => {
    console.log("useToken useEffect:", {
      lowercasedAddress,
      shouldWatch: !!lowercasedAddress,
    });

    if (lowercasedAddress) {
      watchToken(lowercasedAddress);
      return () => {
        unwatchToken(lowercasedAddress);
      };
    }
  }, [lowercasedAddress]); // REMOVED watchToken, unwatchToken from dependencies

  const result = {
    token: tokens[lowercasedAddress] || null,
    loading: loading[lowercasedAddress] || false,
    error: errors[lowercasedAddress] || null,
  };

  console.log("🎯 useToken returning:", {
    address: lowercasedAddress,
    hasToken: !!result.token,
    loading: result.loading,
    error: result.error,
    rawLoadingState: loading[lowercasedAddress],
    allLoadingStates: loading,
  });

  return result;
}
