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
} from "./FactoryConfigProvider"; // This import is relative and correct

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

  const watchToken = useCallback(
    (tokenAddress: string) => {
      if (
        !factoryConfig ||
        !tokenAddress ||
        subscriptions[tokenAddress.toLowerCase()]
      )
        return;
      const lowercasedAddress = tokenAddress.toLowerCase();
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
        }
        setLoading((prev) => ({ ...prev, [lowercasedAddress]: false }));
      });
      subscriptions[lowercasedAddress] = unsubscribe;
    },
    [subscriptions, factoryConfig]
  );

  const unwatchToken = useCallback(
    (tokenAddress: string) => {
      const lowercasedAddress = tokenAddress.toLowerCase();
      if (subscriptions[lowercasedAddress]) {
        subscriptions[lowercasedAddress]();
        delete subscriptions[lowercasedAddress];
      }
    },
    [subscriptions]
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

  useEffect(() => {
    if (lowercasedAddress) watchToken(lowercasedAddress);
    return () => {
      if (lowercasedAddress) unwatchToken(lowercasedAddress);
    };
  }, [lowercasedAddress, watchToken, unwatchToken]);

  return {
    token: tokens[lowercasedAddress] || null,
    loading: loading[lowercasedAddress] || false,
    error: errors[lowercasedAddress] || null,
  };
}
