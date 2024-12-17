"use client";
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import {
  doc,
  onSnapshot,
  collection,
  query,
  limit as limitQuery,
  getDocs,
} from "firebase/firestore";
import { db } from "@/firebase";
import { Address, formatEther } from "viem";
import { useFactoryContract } from "@/new-hooks/useFactoryContract";
import { useTokenContract } from "@/new-hooks/useTokenContract";

// Types for immutable token data
interface TokenData {
  address: Address;
  name: string;
  symbol: string;
  imageUrl: string;
  description: string;
  creator: Address;
  burnManager: Address;
  fundingGoal: string;
  createdAt: string;
  blockNumber: number;
  transactionHash: string;
}

interface TokenMap {
  [address: string]: TokenData;
}

interface TokenContextState {
  tokens: TokenMap;
  loading: { [address: string]: boolean };
  errors: { [address: string]: string | null };
  watchToken: (address: string) => void;
  unwatchToken: (address: string) => void;
  getToken: (address: string) => TokenData | null;
  getRecentTokens: () => Promise<TokenData[]>;
}

// Create context
const TokenContext = createContext<TokenContextState | null>(null);

// Map token data from Firestore to our TokenData type
const mapTokenData = (address: string, data: any): TokenData => {
  return {
    address: address.toLowerCase() as Address,
    name: data.name || "",
    symbol: data.symbol || "",
    imageUrl: data.imageUrl || "",
    description: data.description || "",
    creator: (data.creator || "0x0").toLowerCase() as Address,
    burnManager: (data.burnManager || "0x0").toLowerCase() as Address,
    fundingGoal: data.fundingGoal?.toString() || "0",
    createdAt: data.createdAt || "",
    blockNumber: data.blockNumber || 0,
    transactionHash: data.transactionHash || "",
  };
};

// Provider component
export function TokenProvider({ children }: { children: React.ReactNode }) {
  const [tokens, setTokens] = useState<TokenMap>({});
  const [loading, setLoading] = useState<{ [address: string]: boolean }>({});
  const [errors, setErrors] = useState<{ [address: string]: string | null }>(
    {}
  );
  const [activeSubscriptions] = useState(new Set<string>());

  const watchToken = useCallback(
    (tokenAddress: string) => {
      if (!tokenAddress || activeSubscriptions.has(tokenAddress)) return;

      setLoading((prev) => ({ ...prev, [tokenAddress]: true }));
      const tokenRef = doc(db, "tokens", tokenAddress.toLowerCase());

      const unsubscribe = onSnapshot(
        tokenRef,
        (doc) => {
          if (doc.exists()) {
            const data = doc.data();
            try {
              const tokenData = mapTokenData(tokenAddress, data);
              setTokens((prev) => ({ ...prev, [tokenAddress]: tokenData }));
              setErrors((prev) => ({ ...prev, [tokenAddress]: null }));
            } catch (err) {
              console.error(
                `Error mapping token data for ${tokenAddress}:`,
                err
              );
              setErrors((prev) => ({
                ...prev,
                [tokenAddress]: "Error processing token data",
              }));
            }
          } else {
            setErrors((prev) => ({
              ...prev,
              [tokenAddress]: "Token not found",
            }));
          }
          setLoading((prev) => ({ ...prev, [tokenAddress]: false }));
        },
        (err) => {
          console.error(`Error fetching token ${tokenAddress}:`, err);
          setErrors((prev) => ({
            ...prev,
            [tokenAddress]: "Failed to load token data",
          }));
          setLoading((prev) => ({ ...prev, [tokenAddress]: false }));
        }
      );

      activeSubscriptions.add(tokenAddress);
      return () => {
        unsubscribe();
        activeSubscriptions.delete(tokenAddress);
      };
    },
    [activeSubscriptions]
  );

  const unwatchToken = useCallback(
    (tokenAddress: string) => {
      if (!tokenAddress || !activeSubscriptions.has(tokenAddress)) return;
      activeSubscriptions.delete(tokenAddress);

      setTokens((prev) => {
        const newTokens = { ...prev };
        delete newTokens[tokenAddress];
        return newTokens;
      });

      setLoading((prev) => {
        const newLoading = { ...prev };
        delete newLoading[tokenAddress];
        return newLoading;
      });

      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[tokenAddress];
        return newErrors;
      });
    },
    [activeSubscriptions]
  );

  const getToken = useCallback(
    (address: string): TokenData | null => {
      return tokens[address] || null;
    },
    [tokens]
  );

  const getRecentTokens = useCallback(
    async (limit: number = 10): Promise<TokenData[]> => {
      try {
        const tokensRef = collection(db, "tokens");
        const q = query(tokensRef, limitQuery(limit));
        const querySnapshot = await getDocs(q);

        const recentTokens: TokenData[] = [];
        querySnapshot.forEach((doc) => {
          try {
            const tokenData = mapTokenData(doc.id, doc.data());
            recentTokens.push(tokenData);
          } catch (err) {
            console.error(`Error mapping recent token ${doc.id}:`, err);
          }
        });

        return recentTokens;
      } catch (err) {
        console.error("Error fetching recent tokens:", err);
        return [];
      }
    },
    []
  );

  return (
    <TokenContext.Provider
      value={{
        tokens,
        loading,
        errors,
        watchToken,
        unwatchToken,
        getToken,
        getRecentTokens,
      }}
    >
      {children}
    </TokenContext.Provider>
  );
}

// Hook for accessing token context
export function useTokenContext() {
  const context = useContext(TokenContext);
  if (!context) {
    throw new Error("useTokenContext must be used within a TokenProvider");
  }
  return context;
}

// Hook for accessing a specific token's immutable data
export function useToken(address: string) {
  const { tokens, loading, errors, watchToken } = useTokenContext();

  useEffect(() => {
    if (address) {
      watchToken(address);
    }
  }, [address, watchToken]);

  return {
    token: tokens[address] || null,
    loading: loading[address] || false,
    error: errors[address] || null,
  };
}

// Create a new hook for accessing token contract state
export function useTokenContractState(address: Address) {
  const { useTokenState, useCollateral, useCurrentPrice, formatPriceDecimals } =
    useFactoryContract();

  // Get state from factory contract
  const { data: state } = useTokenState(address);

  // Get collateral from factory contract
  const { data: collateral } = useCollateral(address);

  // Get current price from factory contract
  const { data: currentPrice } = useCurrentPrice(address);

  // Get total supply from token contract
  const { useTotalSupply } = useTokenContract(address);
  const { data: totalSupply } = useTotalSupply();

  return {
    state: Number(state || 0),
    collateral: collateral || "0",
    currentPrice: currentPrice
      ? formatPriceDecimals(currentPrice as bigint)
      : "0",
    totalSupply: totalSupply || "0",
  };
}

export { TokenContext };
