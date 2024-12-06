import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { doc, onSnapshot, updateDoc, increment } from "firebase/firestore";
import { formatEther, parseEther } from "viem";
import { db } from "@/firebase";
import { TokenState, TokenStats } from "@/types";

interface Token {
  address: string;
  name: string;
  symbol: string;
  imageUrl: string;
  creator: string;
  burnManager: string;
  state: TokenState;
  collateral: string;
  fundingGoal: string;
  createdAt: string;
  blockNumber: number;
  transactionHash: string;
  stats: TokenStats;
}

// Simplified context state
interface TokenContextState {
  token: Token | null;
  loading: boolean;
  error: string | null;
  updateTokenStats: (newStats: Partial<TokenStats>) => Promise<void>;
}

const TokenContext = createContext<TokenContextState | null>(null);

// Initial token state
const DEFAULT_TOKEN: Token = {
  address: "0x0",
  name: "",
  symbol: "",
  imageUrl: "",
  creator: "0x0",
  burnManager: "0x0",
  state: TokenState.NOT_CREATED,
  collateral: "0",
  fundingGoal: "0",
  createdAt: "",
  blockNumber: 0,
  transactionHash: "",
  stats: {
    totalSupply: "0",
    currentPrice: "0",
    volumeETH: "0",
    tradeCount: 0,
    uniqueHolders: 0,
  },
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

  // Update token stats in both Firestore and local state
  const updateTokenStats = useCallback(
    async (newStats: Partial<TokenStats>) => {
      if (!token) return;

      try {
        const tokenRef = doc(db, "tokens", token.address);

        // Update Firestore
        await updateDoc(tokenRef, {
          stats: { ...token.stats, ...newStats },
        });

        // Update local state
        setToken((currentToken: any) =>
          currentToken
            ? {
                ...currentToken,
                stats: { ...currentToken.stats, ...newStats },
              }
            : null
        );
      } catch (err) {
        console.error("Error updating token stats:", err);
        setError("Failed to update token statistics");
      }
    },
    [token]
  );

  // Listen to Firestore updates
  useEffect(() => {
    if (!tokenAddress) return;

    setLoading(true);
    const tokenRef = doc(db, "tokens", tokenAddress);

    const unsubscribe = onSnapshot(
      tokenRef,
      (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          setToken({
            address: tokenAddress,
            name: data.name,
            symbol: data.symbol,
            imageUrl: data.imageUrl,
            creator: data.creator,
            burnManager: data.burnManager,
            state: data.state,
            collateral: data.collateral,
            fundingGoal: data.fundingGoal,
            createdAt: data.createdAt,
            blockNumber: data.blockNumber,
            transactionHash: data.transactionHash,
            stats: {
              totalSupply: data.stats?.totalSupply || "0",
              currentPrice: data.stats?.currentPrice || "0",
              volumeETH: data.stats?.volumeETH || "0",
              tradeCount: data.stats?.tradeCount || 0,
              uniqueHolders: data.stats?.uniqueHolders || 0,
            },
          });
          setError(null);
        } else {
          setToken(null);
          setError("Token not found");
        }
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching token:", err);
        setError("Failed to load token data");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [tokenAddress]);

  const value = {
    token,
    loading,
    error,
    updateTokenStats,
  };

  return (
    <TokenContext.Provider value={value}>{children}</TokenContext.Provider>
  );
}

// Main hook for accessing token context
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

export function useTokenState() {
  const { token } = useToken();
  return token?.state;
}

export function useTokenMetadata() {
  const { token } = useToken();
  if (!token) return null;

  return {
    name: token.name,
    symbol: token.symbol,
    imageUrl: token.imageUrl,
    creator: token.creator,
  };
}
