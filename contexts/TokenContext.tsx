"use client";
import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { doc, onSnapshot, collection, query, limit as limitQuery, getDocs } from "firebase/firestore";
import { db } from "@/firebase";
import { Token, TokenState } from "@/types";
import { Address } from "viem";

interface TokenMap {
  [address: string]: Token;
}

interface TokenContextState {
  tokens: TokenMap;
  loading: { [address: string]: boolean };
  errors: { [address: string]: string | null };
  watchToken: (address: string) => void;
  unwatchToken: (address: string) => void;
  getToken: (address: string) => Token | null;
  getRecentTokens: () => Promise<Token[]>;
}

const TokenContext = createContext<TokenContextState | null>(null);

// Helper to safely get nested properties
export const safeGet = (obj: any, path: string, defaultValue: any) => {
  return path
    .split(".")
    .reduce((acc, part) => (acc && acc[part] ? acc[part] : defaultValue), obj);
};


const mapTokenData = (address: string, data: any): Token => {
  console.log('Raw Firestore data for token mapping:', { address, data });
  
  const tokenState = (data.currentState);
  
  const token = {
    // Basic token information
    // address: address.toLowerCase() as `0x${string}`,
    address: address as Address,
    name: data.name || "",
    symbol: data.symbol || "",
    imageUrl: data.imageUrl || "",
    description: data.description || "",

    // Contract parameters
    creator: (data.creator || "0x0").toLowerCase() as `0x${string}`,
    burnManager: (data.burnManager || "0x0").toLowerCase() as `0x${string}`,
    fundingGoal: data.fundingGoal?.toString() || "0",
    initialPrice: "0", // These fields don't exist in Firestore yet
    maxSupply: "0",
    priceRate: "0",
    tradeCooldown: 0,
    maxWalletPercentage: 0,

    // Current state
    state: tokenState,
    collateral: data.collateral?.toString() || "0",

    // Metadata
    createdAt: data.createdAt || "",
    blockNumber: data.blockNumber || 0,
    transactionHash: data.transactionHash || "",

    // Statistics
    stats: {
      totalSupply: safeGet(data, "statistics.totalSupply", "0").toString(),
      currentPrice: safeGet(data, "statistics.currentPrice", "0").toString(),
      volumeETH: safeGet(data, "statistics.volumeETH", "0").toString(),
      tradeCount: safeGet(data, "statistics.tradeCount", 0),
      uniqueHolders: safeGet(data, "statistics.uniqueHolders", 0),
      // Additional 24h stats (not in Firestore yet, using defaults)
      volumeETH24h: safeGet(data, "statistics.volumeETH", "0").toString(), // Fallback to total volume
      priceChange24h: 0,
      highPrice24h: safeGet(data, "statistics.currentPrice", "0").toString(),
      lowPrice24h: safeGet(data, "statistics.currentPrice", "0").toString(),
      buyPressure24h: 0,
    },

    // Latest trade (not in Firestore yet)
    lastTrade: data.lastTrade ? {
      timestamp: data.lastTrade.timestamp,
      type: data.lastTrade.type,
      price: data.lastTrade.price?.toString() || "0",
      amount: data.lastTrade.amount?.toString() || "0",
      ethAmount: data.lastTrade.ethAmount?.toString() || "0",
      trader: (data.lastTrade.trader || "0x0").toLowerCase() as `0x${string}`,
    } : undefined,
  };

  console.log('Mapped token data:', token);
  return token;
};

export function TokenProvider({ children }: { children: React.ReactNode }) {
  const [tokens, setTokens] = useState<TokenMap>({});
  const [loading, setLoading] = useState<{ [address: string]: boolean }>({});
  const [errors, setErrors] = useState<{ [address: string]: string | null }>({});
  const [activeSubscriptions] = useState(new Set<string>());

  const watchToken = useCallback((tokenAddress: string) => {
    if (!tokenAddress || activeSubscriptions.has(tokenAddress)) return;

    console.log(`📌 Starting to watch token: ${tokenAddress}`);
    
    setLoading(prev => ({ ...prev, [tokenAddress]: true }));
    const tokenRef = doc(db, "tokens", tokenAddress.toLowerCase());

    const unsubscribe = onSnapshot(
      tokenRef,
      (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          console.log(`📥 Received update for token ${tokenAddress}:`, data);

          try {
            const tokenData = mapTokenData(tokenAddress, data);
            setTokens(prev => ({ ...prev, [tokenAddress]: tokenData }));
            setErrors(prev => ({ ...prev, [tokenAddress]: null }));
          } catch (err) {
            console.error(`❌ Error mapping token data for ${tokenAddress}:`, err);
            setErrors(prev => ({ 
              ...prev, 
              [tokenAddress]: "Error processing token data" 
            }));
          }
        } else {
          console.log(`⚠️ Token not found: ${tokenAddress}`);
          setErrors(prev => ({ ...prev, [tokenAddress]: "Token not found" }));
        }
        setLoading(prev => ({ ...prev, [tokenAddress]: false }));
      },
      (err) => {
        console.error(`❌ Error fetching token ${tokenAddress}:`, err);
        setErrors(prev => ({ 
          ...prev, 
          [tokenAddress]: "Failed to load token data" 
        }));
        setLoading(prev => ({ ...prev, [tokenAddress]: false }));
      }
    );

    activeSubscriptions.add(tokenAddress);
    
    // Store cleanup function
    return () => {
      console.log(`👋 Stopping watch for token: ${tokenAddress}`);
      unsubscribe();
      activeSubscriptions.delete(tokenAddress);
    };
  }, [activeSubscriptions]);

  const unwatchToken = useCallback((tokenAddress: string) => {
    if (!tokenAddress || !activeSubscriptions.has(tokenAddress)) return;
    
    console.log(`👋 Unwatching token: ${tokenAddress}`);
    activeSubscriptions.delete(tokenAddress);
    
    // Remove token data
    setTokens(prev => {
      const newTokens = { ...prev };
      delete newTokens[tokenAddress];
      return newTokens;
    });
    
    // Clean up loading and error states
    setLoading(prev => {
      const newLoading = { ...prev };
      delete newLoading[tokenAddress];
      return newLoading;
    });
    
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[tokenAddress];
      return newErrors;
    });
  }, [activeSubscriptions]);

  const getToken = useCallback((address: string): Token | null => {
    return tokens[address] || null;
  }, [tokens]);

  const getRecentTokens = useCallback(async (limit: number = 10): Promise<Token[]> => {
    try {
      console.log(`📊 Fetching ${limit} recent tokens...`);
      const tokensRef = collection(db, "tokens");
      const q = query(tokensRef, limitQuery(limit));
      const querySnapshot = await getDocs(q);
      
      const recentTokens: Token[] = [];
      querySnapshot.forEach(doc => {
        try {
          const tokenData = mapTokenData(doc.id, doc.data());
          recentTokens.push(tokenData);
        } catch (err) {
          console.error(`❌ Error mapping recent token ${doc.id}:`, err);
        }
      });
      
      return recentTokens;
    } catch (err) {
      console.error("❌ Error fetching recent tokens:", err);
      return [];
    }
  }, []);

  const value = {
    tokens,
    loading,
    errors,
    watchToken,
    unwatchToken,
    getToken,
    getRecentTokens,
  };

  return (
    <TokenContext.Provider value={value}>{children}</TokenContext.Provider>
  );
}

// Base hook for accessing token context
export function useTokenContext() {
  const context = useContext(TokenContext);
  if (!context) {
    throw new Error("useTokenContext must be used within a TokenProvider");
  }
  return context;
}

// Hook for accessing a specific token's data
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

// Convenience hooks for specific token data
export function useTokenStats(address: string) {
  const { token } = useToken(address);
  return token?.stats;
}

export function useTokenMetadata(address: string) {
  const { token } = useToken(address);
  if (!token) return null;

  return {
    name: token.name,
    symbol: token.symbol,
    imageUrl: token.imageUrl,
    description: token.description,
    creator: token.creator,
  };
}