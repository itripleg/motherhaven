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

// 1. The shape of the data this context will provide
interface TokenContextState {
  tokens: { [address: string]: Token };
  loading: { [address: string]: boolean };
  errors: { [address: string]: string | null };
  watchToken: (address: string) => void;
  unwatchToken: (address: string) => void;
  getRecentTokens: (limit?: number) => Promise<Token[]>;
}

const TokenContext = createContext<TokenContextState | null>(null);

// 2. The helper function to create a complete Token object
const mapTokenData = (
  address: string,
  data: any,
  factoryConfig: FactoryConfig
): Token => {
  return {
    // Data from Firestore
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

    // Data from the FactoryConfig context (no more hardcoding)
    ...factoryConfig,

    // Default values for live state, to be filled by other hooks later
    collateral: "0",
    virtualSupply: "0",
    state: TokenState.NOT_CREATED,
    currentPrice: "0",
    totalSupply: "0",
  };
};

// 3. The main Provider component
export function TokenProvider({ children }: { children: React.ReactNode }) {
  const { config: factoryConfig, isLoading: isConfigLoading } =
    useFactoryConfigContext();
  const [tokens, setTokens] = useState<{ [address: string]: Token }>({});
  const [loading, setLoading] = useState<{ [address: string]: boolean }>({});
  const [errors, setErrors] = useState<{ [address: string]: string | null }>(
    {}
  );

  // Ref to store the unsubscribe functions for active Firestore listeners
  const subscriptions = useRef<{ [key: string]: Unsubscribe }>({}).current;

  const watchToken = useCallback(
    (tokenAddress: string) => {
      const lowercasedAddress = tokenAddress.toLowerCase();
      // Do not proceed if config isn't loaded or if we already have a subscription
      if (
        !factoryConfig ||
        !lowercasedAddress ||
        subscriptions[lowercasedAddress]
      )
        return;

      setLoading((prev) => ({ ...prev, [lowercasedAddress]: true }));
      const tokenRef = doc(db, "tokens", lowercasedAddress);

      const unsubscribe = onSnapshot(tokenRef, (doc) => {
        if (doc.exists()) {
          const tokenData = mapTokenData(
            lowercasedAddress,
            doc.data(),
            factoryConfig
          );
          setTokens((prev) => ({ ...prev, [lowercasedAddress]: tokenData }));
          setErrors((prev) => ({ ...prev, [lowercasedAddress]: null }));
        } else {
          setErrors((prev) => ({
            ...prev,
            [lowercasedAddress]: "Token not found",
          }));
        }
        setLoading((prev) => ({ ...prev, [lowercasedAddress]: false }));
      });

      // Store the cleanup function
      subscriptions[lowercasedAddress] = unsubscribe;
    },
    [subscriptions, factoryConfig]
  );

  const unwatchToken = useCallback(
    (tokenAddress: string) => {
      const lowercasedAddress = tokenAddress.toLowerCase();
      const unsubscribe = subscriptions[lowercasedAddress];
      if (unsubscribe) {
        unsubscribe(); // Clean up the Firestore listener
        delete subscriptions[lowercasedAddress];
      }
    },
    [subscriptions]
  );

  const getRecentTokens = useCallback(
    async (limit: number = 10): Promise<Token[]> => {
      if (!factoryConfig) return [];
      try {
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
      } catch (err) {
        console.error("Error fetching recent tokens:", err);
        return [];
      }
    },
    [factoryConfig]
  );

  const contextValue = {
    tokens,
    loading,
    errors,
    watchToken,
    unwatchToken,
    getRecentTokens,
  };

  return (
    <TokenContext.Provider value={contextValue}>
      {children}
    </TokenContext.Provider>
  );
}

// 4. The consumer hooks that components will use
export function useTokenContext() {
  const context = useContext(TokenContext);
  if (!context) {
    throw new Error("useTokenContext must be used within a TokenProvider");
  }
  return context;
}

export function useToken(address: string) {
  const { tokens, loading, errors, watchToken, unwatchToken } =
    useTokenContext();
  const lowercasedAddress = address?.toLowerCase();

  useEffect(() => {
    if (lowercasedAddress) {
      watchToken(lowercasedAddress);
    }
    // This cleanup function is crucial. It calls unwatchToken when the component unmounts.
    return () => {
      if (lowercasedAddress) {
        unwatchToken(lowercasedAddress);
      }
    };
  }, [lowercasedAddress, watchToken, unwatchToken]);

  return {
    token: tokens[lowercasedAddress] || null,
    loading: loading[lowercasedAddress] || false,
    error: errors[lowercasedAddress] || null,
  };
}
