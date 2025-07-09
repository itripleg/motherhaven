// contexts/TokenDataProvider.tsx
"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import { useAccount, useBalance, useReadContracts } from "wagmi";
import { Address, formatUnits, parseEther } from "viem";
import { FACTORY_ADDRESS, FACTORY_ABI, Token } from "@/types";
import { useTokenData } from "@/final-hooks/useTokenData";
import { tokenEventEmitter } from "@/components/EventWatcher";
import { useToast } from "@/hooks/use-toast";

// Types for the context
interface TokenWalletData {
  // Token contract data
  lastPrice: bigint;
  collateral: bigint;
  tokenState: number;
  virtualSupply: bigint;
  fundingGoal: bigint;

  // User wallet data
  avaxBalance: string;
  tokenBalance: string;

  // Formatted values for display
  formatted: {
    price: string;
    collateral: string;
    avaxBalance: string;
    tokenBalance: string;
    fundingGoal: string;
  };

  // Trading calculations (cached)
  calculations: {
    [key: string]: {
      tokensOut: bigint;
      ethCost: bigint;
      timestamp: number;
    };
  };

  // Loading states
  isLoading: boolean;
  isCalculating: boolean;
  lastUpdated: number;
}

interface TokenDataContextType {
  data: TokenWalletData | null;
  token: Token | null;

  // Smart calculation functions with debouncing
  calculateTokensForEth: (ethAmount: string) => Promise<string>;
  calculateEthForTokens: (tokenAmount: string) => Promise<string>;

  // Manual refresh
  refresh: () => void;

  // Utilities
  isValidAmount: (amount: string, type: "buy" | "sell") => boolean;
  getMaxBuyAmount: () => string;
  getMaxSellAmount: () => string;
}

const TokenDataContext = createContext<TokenDataContextType | undefined>(
  undefined
);

// Debouncing utility
class CalculationDebouncer {
  private timeouts: Map<string, NodeJS.Timeout> = new Map();
  private cache: Map<string, { result: any; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 10000; // 10 seconds
  private readonly DEBOUNCE_DELAY = 300; // 300ms

  debounce<T>(
    key: string,
    fn: () => Promise<T>,
    delay: number = this.DEBOUNCE_DELAY
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      // Check cache first
      const cached = this.cache.get(key);
      if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
        resolve(cached.result);
        return;
      }

      // Clear existing timeout
      const existingTimeout = this.timeouts.get(key);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
      }

      // Set new timeout
      const timeout = setTimeout(async () => {
        try {
          const result = await fn();
          this.cache.set(key, { result, timestamp: Date.now() });
          this.timeouts.delete(key);
          resolve(result);
        } catch (error) {
          this.timeouts.delete(key);
          reject(error);
        }
      }, delay);

      this.timeouts.set(key, timeout);
    });
  }

  clearCache() {
    this.cache.clear();
    this.timeouts.forEach((timeout) => clearTimeout(timeout));
    this.timeouts.clear();
  }
}

interface TokenDataProviderProps {
  tokenAddress: Address;
  children: React.ReactNode;
}

export function TokenDataProvider({
  tokenAddress,
  children,
}: TokenDataProviderProps) {
  const { address } = useAccount();
  const { toast } = useToast();
  const [data, setData] = useState<TokenWalletData | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // Get token metadata from Firestore
  const { token, isLoading: tokenLoading } = useTokenData(tokenAddress);

  // Debouncer instance
  const debouncerRef = useRef(new CalculationDebouncer());
  const lastEventRef = useRef(0);

  // AVAX Balance
  const { data: avaxBalance, refetch: refetchAvax } = useBalance({
    address,
    query: { enabled: !!address },
  });

  // Token Balance
  const { data: tokenBalance, refetch: refetchToken } = useBalance({
    address,
    token: tokenAddress,
    query: { enabled: !!address },
  });

  // Batch contract reads for all essential data
  const {
    data: contractData,
    refetch: refetchContract,
    isLoading: contractLoading,
  } = useReadContracts({
    contracts: [
      {
        address: FACTORY_ADDRESS,
        abi: FACTORY_ABI,
        functionName: "lastPrice",
        args: [tokenAddress],
      },
      {
        address: FACTORY_ADDRESS,
        abi: FACTORY_ABI,
        functionName: "collateral",
        args: [tokenAddress],
      },
      {
        address: FACTORY_ADDRESS,
        abi: FACTORY_ABI,
        functionName: "getTokenState",
        args: [tokenAddress],
      },
      {
        address: FACTORY_ADDRESS,
        abi: FACTORY_ABI,
        functionName: "virtualSupply",
        args: [tokenAddress],
      },
      {
        address: FACTORY_ADDRESS,
        abi: FACTORY_ABI,
        functionName: "getFundingGoal",
        args: [tokenAddress],
      },
    ],
    query: {
      enabled: !!tokenAddress,
      refetchInterval: 30000, // 30 seconds for basic data
      staleTime: 15000, // Consider stale after 15 seconds
    },
  });

  // Process and update data when contract data changes
  useEffect(() => {
    if (!contractData || contractLoading) return;

    try {
      const [priceData, collateralData, stateData, supplyData, goalData] =
        contractData;

      // Safely extract bigint values
      const lastPrice = priceData?.result
        ? BigInt(priceData.result.toString())
        : 0n;
      const collateral = collateralData?.result
        ? BigInt(collateralData.result.toString())
        : 0n;
      const tokenState = stateData?.result ? Number(stateData.result) : 0;
      const virtualSupply = supplyData?.result
        ? BigInt(supplyData.result.toString())
        : 0n;
      const fundingGoal = goalData?.result
        ? BigInt(goalData.result.toString())
        : 0n;

      const newData: TokenWalletData = {
        lastPrice,
        collateral,
        tokenState,
        virtualSupply,
        fundingGoal,
        avaxBalance: avaxBalance?.formatted || "0",
        tokenBalance: tokenBalance?.formatted || "0",
        formatted: {
          price: formatUnits(lastPrice, 18),
          collateral: formatUnits(collateral, 18),
          avaxBalance: avaxBalance?.formatted || "0",
          tokenBalance: tokenBalance?.formatted || "0",
          fundingGoal: formatUnits(fundingGoal, 18),
        },
        calculations: data?.calculations || {},
        isLoading: false,
        isCalculating,
        lastUpdated: Date.now(),
      };

      setData(newData);
    } catch (error) {
      console.error("Error processing contract data:", error);
      toast({
        title: "Data Error",
        description: "Failed to process token data",
        variant: "destructive",
      });
    }
  }, [
    contractData,
    contractLoading,
    avaxBalance,
    tokenBalance,
    isCalculating,
    data?.calculations,
    toast,
  ]);

  // Listen for trade events and refresh data
  useEffect(() => {
    if (!tokenAddress) return;

    const handleTokenEvent = (event: any) => {
      const now = Date.now();
      // Prevent spam updates
      if (now - lastEventRef.current < 2000) return;
      lastEventRef.current = now;

      if (["TokensPurchased", "TokensSold"].includes(event.eventName)) {
        console.log(`🔄 Trade detected for ${tokenAddress}, refreshing...`);

        // Clear calculation cache
        debouncerRef.current.clearCache();

        // Refresh contract data and balances
        setTimeout(() => {
          refetchContract();
          if (address) {
            refetchAvax();
            refetchToken();
          }
        }, 1500); // Wait for blockchain state to settle
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
  }, [tokenAddress, address, refetchContract, refetchAvax, refetchToken]);

  // Smart calculation function with debouncing
  const calculateTokensForEth = useCallback(
    async (ethAmount: string): Promise<string> => {
      if (!ethAmount || parseFloat(ethAmount) <= 0) return "0";

      const cacheKey = `tokens-for-eth-${ethAmount}`;
      setIsCalculating(true);

      try {
        const result = await debouncerRef.current.debounce(
          cacheKey,
          async () => {
            const { data: tokensOut } = await fetch("/api/calculate-tokens", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                tokenAddress,
                ethAmount,
                type: "buy",
              }),
            }).then((res) => res.json());

            return formatUnits(BigInt(tokensOut), 18);
          }
        );

        return result;
      } catch (error) {
        console.error("Error calculating tokens:", error);
        return "0";
      } finally {
        setIsCalculating(false);
      }
    },
    [tokenAddress]
  );

  const calculateEthForTokens = useCallback(
    async (tokenAmount: string): Promise<string> => {
      if (!tokenAmount || parseFloat(tokenAmount) <= 0) return "0";

      const cacheKey = `eth-for-tokens-${tokenAmount}`;
      setIsCalculating(true);

      try {
        const result = await debouncerRef.current.debounce(
          cacheKey,
          async () => {
            const { data: ethOut } = await fetch("/api/calculate-tokens", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                tokenAddress,
                tokenAmount,
                type: "sell",
              }),
            }).then((res) => res.json());

            return formatUnits(BigInt(ethOut), 18);
          }
        );

        return result;
      } catch (error) {
        console.error("Error calculating ETH:", error);
        return "0";
      } finally {
        setIsCalculating(false);
      }
    },
    [tokenAddress]
  );

  // Validation functions
  const isValidAmount = useCallback(
    (amount: string, type: "buy" | "sell"): boolean => {
      if (!data || !amount) return false;

      const amountNum = parseFloat(amount);
      if (isNaN(amountNum) || amountNum <= 0) return false;

      if (type === "buy") {
        const maxAvax = parseFloat(data.formatted.avaxBalance);
        return amountNum <= maxAvax * 0.99; // Leave some for gas
      } else {
        const maxTokens = parseFloat(data.formatted.tokenBalance);
        return amountNum <= maxTokens;
      }
    },
    [data]
  );

  const getMaxBuyAmount = useCallback((): string => {
    if (!data) return "0";
    const maxAvax = parseFloat(data.formatted.avaxBalance);
    return (maxAvax * 0.95).toFixed(6); // Leave 5% for gas
  }, [data]);

  const getMaxSellAmount = useCallback((): string => {
    if (!data) return "0";
    return data.formatted.tokenBalance;
  }, [data]);

  // Manual refresh function
  const refresh = useCallback(() => {
    debouncerRef.current.clearCache();
    refetchContract();
    if (address) {
      refetchAvax();
      refetchToken();
    }
  }, [refetchContract, refetchAvax, refetchToken, address]);

  const contextValue: TokenDataContextType = {
    data,
    token,
    calculateTokensForEth,
    calculateEthForTokens,
    refresh,
    isValidAmount,
    getMaxBuyAmount,
    getMaxSellAmount,
  };

  return (
    <TokenDataContext.Provider value={contextValue}>
      {children}
    </TokenDataContext.Provider>
  );
}

// Hook to use the context
export function useTokenDataContext(): TokenDataContextType {
  const context = useContext(TokenDataContext);
  if (!context) {
    throw new Error(
      "useTokenDataContext must be used within a TokenDataProvider"
    );
  }
  return context;
}

// Usage example:
/*
// In your token page component:
<TokenDataProvider tokenAddress={tokenAddress}>
  <TokenTradeCard />
  <TokenHeader />
  <RecentTrades />
</TokenDataProvider>

// In your components:
function TokenTradeCard() {
  const { 
    data, 
    calculateTokensForEth, 
    isValidAmount, 
    getMaxBuyAmount 
  } = useTokenDataContext();
  
  const [amount, setAmount] = useState("");
  const [estimatedTokens, setEstimatedTokens] = useState("0");
  
  // Debounced calculation
  useEffect(() => {
    if (amount && isValidAmount(amount, 'buy')) {
      calculateTokensForEth(amount).then(setEstimatedTokens);
    }
  }, [amount, calculateTokensForEth, isValidAmount]);
  
  return (
    <div>
      <input 
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="0.0"
      />
      <button onClick={() => setAmount(getMaxBuyAmount())}>
        Max
      </button>
      <div>Estimated tokens: {estimatedTokens}</div>
    </div>
  );
}
*/
