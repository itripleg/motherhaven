"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/firebase";
import { Token, TokenState, TokenStats } from "@/types";

interface TokenContextState {
  token: Token | null;
  loading: boolean;
  error: string | null;
}

const TokenContext = createContext<TokenContextState | null>(null);

// Helper to safely get nested properties
const safeGet = (obj: any, path: string, defaultValue: any) => {
  return path
    .split(".")
    .reduce((acc, part) => (acc && acc[part] ? acc[part] : defaultValue), obj);
};

export function TokenProvider({
  children,
  tokenAddress,
}: {
  children: React.ReactNode;
  tokenAddress: string;
}) {
  const [token, setToken] = useState<Token | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tokenAddress) return;

    setLoading(true);
    const tokenRef = doc(db, "tokens", tokenAddress);

    const unsubscribe = onSnapshot(
      tokenRef,
      (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          console.log("Raw Firestore data:", data); // Debug log

          try {
            const tokenData: Token = {
              // Basic token information
              address: tokenAddress as `0x${string}`,
              name: data.name || "",
              symbol: data.symbol || "",
              imageUrl: data.imageUrl || "",
              description: data.description,

              // Contract parameters
              creator: (data.creator || "0x0") as `0x${string}`,
              burnManager: (data.burnManager || "0x0") as `0x${string}`,
              fundingGoal: data.fundingGoal?.toString() || "0",
              initialPrice: safeGet(data, "initialPrice", "0").toString(),
              maxSupply: safeGet(data, "maxSupply", "0").toString(),
              priceRate: safeGet(data, "priceRate", "0").toString(),
              tradeCooldown: safeGet(data, "tradeCooldown", 0),
              maxWalletPercentage: safeGet(data, "maxWalletPercentage", 0),

              // Current state
              state: data.currentState || TokenState.Active,
              collateral: data.collateral?.toString() || "0",

              // Metadata
              createdAt: data.createdAt || "",
              blockNumber: data.blockNumber || 0,
              transactionHash: data.transactionHash || "",

              // Statistics
              stats: {
                totalSupply: safeGet(
                  data,
                  "statistics.totalSupply",
                  "0"
                ).toString(),
                currentPrice: safeGet(
                  data,
                  "statistics.currentPrice",
                  "0"
                ).toString(),
                volumeETH: safeGet(
                  data,
                  "statistics.volumeETH",
                  "0"
                ).toString(),
                tradeCount: safeGet(data, "statistics.tradeCount", 0),
                uniqueHolders: safeGet(data, "statistics.uniqueHolders", 0),

                // 24h metrics
                volumeETH24h: safeGet(
                  data,
                  "statistics.volumeETH24h",
                  "0"
                ).toString(),
                priceChange24h: safeGet(data, "statistics.priceChange24h", 0),
                highPrice24h: safeGet(
                  data,
                  "statistics.highPrice24h",
                  "0"
                ).toString(),
                lowPrice24h: safeGet(
                  data,
                  "statistics.lowPrice24h",
                  "0"
                ).toString(),
                buyPressure24h: safeGet(data, "statistics.buyPressure24h", 0),
              },

              // Latest trade (if exists)
              lastTrade: data.lastTrade
                ? {
                    timestamp: data.lastTrade.timestamp,
                    type: data.lastTrade.type,
                    price: data.lastTrade.price.toString(),
                    amount: data.lastTrade.amount.toString(),
                    ethAmount: data.lastTrade.ethAmount.toString(),
                    trader: data.lastTrade.trader as `0x${string}`,
                  }
                : undefined,
            };

            console.log("Mapped token data:", tokenData); // Debug log
            setToken(tokenData);
            setError(null);
          } catch (err) {
            console.error("Error mapping token data:", err);
            setError("Error processing token data");
            setToken(null);
          }
        } else {
          setToken(null);
          setError("Token not found");
        }
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching token:", err);
        setError("Failed to load token data");
        setToken(null);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [tokenAddress]);

  const value = {
    token,
    loading,
    error,
  };

  return (
    <TokenContext.Provider value={value}>{children}</TokenContext.Provider>
  );
}

// Hook for accessing token context
export function useToken() {
  const context = useContext(TokenContext);
  if (!context) {
    throw new Error("useToken must be used within a TokenProvider");
  }
  return context;
}

// Convenience hooks for specific token data
export function useTokenStats() {
  const { token } = useToken();
  return token?.stats;
}

export function useTokenMetadata() {
  const { token } = useToken();
  if (!token) return null;

  return {
    name: token.name,
    symbol: token.symbol,
    imageUrl: token.imageUrl,
    description: token.description,
    creator: token.creator,
  };
}
