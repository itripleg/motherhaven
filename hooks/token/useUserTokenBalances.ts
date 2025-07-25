// hooks/token/useUserTokenBalances.ts
import { useState, useEffect, useCallback } from "react";
import { useAccount, useReadContracts } from "wagmi";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/firebase";
import { formatEther } from "viem";

// ERC20 ABI for balanceOf function
const ERC20_ABI = [
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "owner", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "decimals",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
  },
] as const;

interface TokenBalance {
  address: string;
  name: string;
  symbol: string;
  balance: string;
  formattedBalance: string;
  decimals: number;
  imageUrl?: string;
}

interface UseUserTokenBalancesReturn {
  balances: TokenBalance[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  totalTokens: number;
}

// Cache to prevent excessive RPC calls
const balanceCache = new Map<
  string,
  { data: TokenBalance[]; timestamp: number }
>();
const CACHE_DURATION = 30000; // 30 seconds

export function useUserTokenBalances(): UseUserTokenBalancesReturn {
  const { address, isConnected } = useAccount();
  const [tokens, setTokens] = useState<
    Array<{
      address: string;
      name: string;
      symbol: string;
      decimals: number;
      imageUrl?: string;
    }>
  >([]);
  const [balances, setBalances] = useState<TokenBalance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shouldFetch, setShouldFetch] = useState(false);

  // Check cache first
  const getCachedData = useCallback(() => {
    if (!address) return null;
    const cached = balanceCache.get(address.toLowerCase());
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }
    return null;
  }, [address]);

  // Set cache
  const setCachedData = useCallback(
    (data: TokenBalance[]) => {
      if (!address) return;
      balanceCache.set(address.toLowerCase(), {
        data,
        timestamp: Date.now(),
      });
    },
    [address]
  );

  // Fetch available tokens from Firebase (this should be cached/optimized)
  useEffect(() => {
    const fetchTokens = async () => {
      if (!isConnected || !address) {
        setIsLoading(false);
        return;
      }

      try {
        setError(null);

        // Check cache first
        const cachedBalances = getCachedData();
        if (cachedBalances) {
          setBalances(cachedBalances);
          setIsLoading(false);
          return;
        }

        // Fetch all tokens from Firebase (consider adding pagination/limits in production)
        const tokensRef = collection(db, "tokens");
        const tokensQuery = query(tokensRef);

        const querySnapshot = await getDocs(tokensQuery);
        const tokenList = querySnapshot.docs.map((doc) => ({
          address: doc.id,
          name: doc.data().name || "Unknown Token",
          symbol: doc.data().symbol || "TOKEN",
          decimals: doc.data().decimals || 18,
          imageUrl: doc.data().imageUrl,
        }));

        // Limit to prevent RPC overload - only check first 50 tokens
        const limitedTokens = tokenList.slice(0, 50);
        setTokens(limitedTokens);
        setShouldFetch(true);
      } catch (err) {
        console.error("Error fetching tokens:", err);
        setError("Failed to fetch token list");
        setIsLoading(false);
      }
    };

    fetchTokens();
  }, [address, isConnected, getCachedData]);

  // Prepare contracts for balance checking
  const contracts = tokens.map((token) => ({
    address: token.address as `0x${string}`,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: [address as `0x${string}`],
  }));

  // Read balances using wagmi
  const {
    data: contractData,
    isLoading: contractsLoading,
    refetch: refetchContracts,
    error: contractError,
  } = useReadContracts({
    contracts,
    query: {
      enabled: shouldFetch && tokens.length > 0 && !!address,
      refetchInterval: 60000, // Refetch every minute
      staleTime: 30000, // Consider data stale after 30 seconds
    },
  });

  // Process balance data
  useEffect(() => {
    if (!contractData || contractsLoading) return;

    try {
      const processedBalances: TokenBalance[] = [];

      tokens.forEach((token, index) => {
        const result = contractData[index];

        if (result?.status === "success" && result.result) {
          const rawBalance = BigInt(result.result.toString());
          const balance = formatEther(rawBalance);
          const numericBalance = parseFloat(balance);

          // Only include tokens with non-zero balance
          if (numericBalance > 0) {
            processedBalances.push({
              address: token.address,
              name: token.name,
              symbol: token.symbol,
              balance: rawBalance.toString(),
              formattedBalance: numericBalance.toFixed(6),
              decimals: token.decimals,
              imageUrl: token.imageUrl,
            });
          }
        }
      });

      // Sort by balance descending
      processedBalances.sort(
        (a, b) =>
          parseFloat(b.formattedBalance) - parseFloat(a.formattedBalance)
      );

      setBalances(processedBalances);
      setCachedData(processedBalances);
      setError(null);
    } catch (err) {
      console.error("Error processing balances:", err);
      setError("Failed to process token balances");
    } finally {
      setIsLoading(false);
    }
  }, [contractData, contractsLoading, tokens, setCachedData]);

  // Handle contract errors
  useEffect(() => {
    if (contractError) {
      console.error("Contract error:", contractError);
      setError("Failed to fetch token balances from blockchain");
      setIsLoading(false);
    }
  }, [contractError]);

  const refetch = useCallback(() => {
    // Clear cache and refetch
    if (address) {
      balanceCache.delete(address.toLowerCase());
    }
    setShouldFetch(false);
    setIsLoading(true);

    // Trigger refetch
    setTimeout(() => {
      setShouldFetch(true);
      refetchContracts();
    }, 100);
  }, [address, refetchContracts]);

  return {
    balances,
    isLoading: isLoading || contractsLoading,
    error,
    refetch,
    totalTokens: balances.length,
  };
}
