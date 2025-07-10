// contexts/TokenDataProvider.tsx - FIXED MAX AMOUNT HANDLING
"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import { useAccount, useBalance } from "wagmi";
import { Address } from "viem";
import { Token } from "@/types";
import { useTokenData } from "@/final-hooks/useTokenData";
import { useAggregatedContractCalls } from "@/hooks/useAggregatedContractCalls";
import { tokenEventEmitter } from "@/components/EventWatcher";
import { useToast } from "@/hooks/use-toast";

// Utility to safely truncate amounts for display and calculations
function truncateAmount(amount: string, maxDecimals: number = 6): string {
  try {
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) return "0";

    // Use toFixed to properly truncate (not round up)
    return num.toFixed(maxDecimals);
  } catch (error) {
    console.error("Error truncating amount:", error);
    return "0";
  }
}

// Check if amount is valid for calculations (prevents API loops)
function isValidForCalculation(amount: string): boolean {
  if (!amount || amount === "0") return false;

  const num = parseFloat(amount);
  if (isNaN(num) || num <= 0) return false;

  // Check for reasonable decimal places
  const parts = amount.split(".");
  if (parts.length > 1 && parts[1].length > 10) {
    return false; // Too many decimal places
  }

  return true;
}

// Enhanced types with aggregated data
interface TokenWalletData {
  // Raw BigInt values from aggregated hook
  raw: {
    price: bigint;
    collateral: bigint;
    virtualSupply: bigint;
    fundingGoal: bigint;
    maxSupply: bigint;
    totalSupply: bigint;
  };

  // State and configuration
  tokenState: number;
  tradingFee: number;
  decimals: number;

  // User wallet data (original and truncated)
  avaxBalance: string;
  tokenBalance: string;
  truncatedTokenBalance: string; // For display and max calculations

  // Formatted values for display
  formatted: {
    price: string;
    collateral: string;
    avaxBalance: string;
    tokenBalance: string;
    fundingGoal: string;
    virtualSupply: string;
    maxSupply: string;
    totalSupply: string;
  };

  // Progress calculations (from aggregated hook)
  progress: {
    fundingPercentage: number;
    isGoalReached: boolean;
    supplyUtilization: number;
  };

  // Trading calculations (cached)
  calculations: {
    [key: string]: {
      result: string;
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

// Enhanced debouncing utility with better caching
class CalculationDebouncer {
  private timeouts: Map<string, NodeJS.Timeout> = new Map();
  private cache: Map<string, { result: any; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 15000; // 15 seconds
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

  // Get cache stats for debugging
  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
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

  // 🚀 MAIN OPTIMIZATION: Use aggregated contract calls instead of multiple calls
  const aggregatedData = useAggregatedContractCalls(tokenAddress);

  // Debouncer instance
  const debouncerRef = useRef(new CalculationDebouncer());
  const lastEventRef = useRef(0);

  // User wallet balances (these still need individual calls)
  const { data: avaxBalance, refetch: refetchAvax } = useBalance({
    address,
    query: {
      enabled: !!address,
      refetchInterval: 30000, // 30 seconds
      staleTime: 15000,
    },
  });

  const { data: tokenBalance, refetch: refetchToken } = useBalance({
    address,
    token: tokenAddress,
    query: {
      enabled: !!address,
      refetchInterval: 30000, // 30 seconds
      staleTime: 15000,
    },
  });

  // Process and update data when aggregated contract data changes
  useEffect(() => {
    if (aggregatedData.isLoading) return;

    try {
      // Get raw token balance and create truncated version
      const rawTokenBalance = tokenBalance?.formatted || "0";
      const truncatedTokenBalance = truncateAmount(rawTokenBalance, 6);

      const newData: TokenWalletData = {
        // Use raw data from aggregated hook
        raw: aggregatedData.raw,

        // State and config from aggregated hook
        tokenState: aggregatedData.state,
        tradingFee: aggregatedData.tradingFee,
        decimals: aggregatedData.decimals,

        // User wallet data (both original and truncated)
        avaxBalance: avaxBalance?.formatted || "0",
        tokenBalance: rawTokenBalance,
        truncatedTokenBalance: truncatedTokenBalance,

        // Formatted values combining aggregated + wallet data
        formatted: {
          price: aggregatedData.formatted.price,
          collateral: aggregatedData.formatted.collateral,
          avaxBalance: avaxBalance?.formatted || "0",
          tokenBalance: truncateAmount(rawTokenBalance, 4), // Display with 4 decimals
          fundingGoal: aggregatedData.formatted.fundingGoal,
          virtualSupply: aggregatedData.formatted.virtualSupply,
          maxSupply: aggregatedData.formatted.maxSupply,
          totalSupply: aggregatedData.formatted.totalSupply,
        },

        // Progress calculations from aggregated hook
        progress: aggregatedData.progress,

        // Preserve existing calculations cache
        calculations: data?.calculations || {},

        // Loading states
        isLoading: false,
        isCalculating,
        lastUpdated: aggregatedData.lastUpdated,
      };

      setData(newData);
    } catch (error) {
      console.error("Error processing aggregated contract data:", error);
      toast({
        title: "Data Error",
        description: "Failed to process token data",
        variant: "destructive",
      });
    }
  }, [
    aggregatedData,
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

        // The aggregated hook will automatically refetch due to its refetchInterval
        // We just need to refresh user balances
        setTimeout(() => {
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
  }, [tokenAddress, address, refetchAvax, refetchToken]);

  // Enhanced calculation functions with better error handling
  const calculateTokensForEth = useCallback(
    async (ethAmount: string): Promise<string> => {
      if (!ethAmount || parseFloat(ethAmount) <= 0) return "0";

      // Prevent calculation if amount is invalid
      if (!isValidForCalculation(ethAmount)) {
        console.warn("Skipping calculation for invalid amount:", ethAmount);
        return "0";
      }

      const cacheKey = `tokens-for-eth-${ethAmount}-${tokenAddress}`;
      setIsCalculating(true);

      try {
        const result = await debouncerRef.current.debounce(
          cacheKey,
          async () => {
            const response = await fetch("/api/calculate-tokens", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                tokenAddress,
                ethAmount,
                type: "buy",
              }),
            });

            if (!response.ok) {
              const errorData = await response.json().catch(() => ({}));
              throw new Error(
                errorData.error || `API error: ${response.status}`
              );
            }

            const { data: tokensOut, success } = await response.json();

            if (!success) {
              throw new Error("API returned unsuccessful response");
            }

            return tokensOut;
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

      // Prevent calculation if amount is invalid
      if (!isValidForCalculation(tokenAmount)) {
        console.warn("Skipping calculation for invalid amount:", tokenAmount);
        return "0";
      }

      const cacheKey = `eth-for-tokens-${tokenAmount}-${tokenAddress}`;
      setIsCalculating(true);

      try {
        const result = await debouncerRef.current.debounce(
          cacheKey,
          async () => {
            const response = await fetch("/api/calculate-tokens", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                tokenAddress,
                tokenAmount,
                type: "sell",
              }),
            });

            if (!response.ok) {
              const errorData = await response.json().catch(() => ({}));
              throw new Error(
                errorData.error || `API error: ${response.status}`
              );
            }

            const { data: ethOut, success } = await response.json();

            if (!success) {
              throw new Error("API returned unsuccessful response");
            }

            return ethOut;
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

  // FIXED: Enhanced validation functions that use truncated amounts
  const isValidAmount = useCallback(
    (amount: string, type: "buy" | "sell"): boolean => {
      if (!data || !amount) return false;

      const amountNum = parseFloat(amount);
      if (isNaN(amountNum) || amountNum <= 0) return false;

      if (type === "buy") {
        const maxAvax = parseFloat(data.formatted.avaxBalance);
        if (amountNum > maxAvax) return false;
        // Leave some for gas (more sophisticated calculation)
        const gasBuffer = Math.max(0.001, maxAvax * 0.01); // 1% or 0.001 AVAX minimum
        return amountNum <= maxAvax - gasBuffer;
      } else {
        // FIXED: Use truncated token balance for validation
        const maxTokens = parseFloat(data.truncatedTokenBalance);
        return amountNum <= maxTokens;
      }
    },
    [data]
  );

  const getMaxBuyAmount = useCallback((): string => {
    if (!data) return "0";
    const maxAvax = parseFloat(data.formatted.avaxBalance);
    const gasBuffer = Math.max(0.001, maxAvax * 0.01); // Dynamic gas buffer
    const maxBuy = Math.max(0, maxAvax - gasBuffer);
    return maxBuy.toFixed(6);
  }, [data]);

  // FIXED: Return truncated token balance for max sell
  const getMaxSellAmount = useCallback((): string => {
    if (!data) return "0";
    // Return the pre-truncated balance to avoid validation mismatches
    return data.truncatedTokenBalance;
  }, [data]);

  // Manual refresh function (now simpler due to aggregated hook)
  const refresh = useCallback(() => {
    debouncerRef.current.clearCache();

    // Refresh user balances (aggregated hook refreshes automatically)
    if (address) {
      refetchAvax();
      refetchToken();
    }

    // Log cache stats for debugging
    const cacheStats = debouncerRef.current.getCacheStats();
    console.log("Cache cleared. Stats:", cacheStats);
  }, [refetchAvax, refetchToken, address]);

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

// Enhanced debugging helper (optional - can remove in production)
export function useTokenDataDebug() {
  const context = useTokenDataContext();

  return {
    hasData: !!context.data,
    isLoading: context.data?.isLoading ?? true,
    isCalculating: context.data?.isCalculating ?? false,
    lastUpdated: context.data?.lastUpdated ?? 0,
    cacheSize: context.data?.calculations
      ? Object.keys(context.data.calculations).length
      : 0,
    fundingProgress: context.data?.progress.fundingPercentage ?? 0,
    isGoalReached: context.data?.progress.isGoalReached ?? false,
    // Debug token balance info
    rawTokenBalance: context.data?.tokenBalance ?? "0",
    truncatedTokenBalance: context.data?.truncatedTokenBalance ?? "0",
    displayTokenBalance: context.data?.formatted.tokenBalance ?? "0",
  };
}
