// contexts/TokenDataProvider.tsx - DEBUG VERSION
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

// Debug utility function
function debugLog(message: string, data?: any) {
  console.log(`[TokenDataProvider] ${message}`, data || "");
}

function safeFormatUnits(value: any, decimals: number = 18): string {
  try {
    debugLog(`Attempting to format: ${typeof value}`, value);

    if (value === null || value === undefined) {
      debugLog("Value is null/undefined, returning 0");
      return "0";
    }

    // Handle string conversion
    if (typeof value === "string") {
      debugLog("Converting string to BigInt", value);
      value = BigInt(value);
    }

    // Handle number conversion (this might be the issue!)
    if (typeof value === "number") {
      debugLog("⚠️  WARNING: Received number, converting to BigInt", value);
      if (!Number.isInteger(value)) {
        debugLog("❌ ERROR: Cannot convert float to BigInt", value);
        throw new Error(`Cannot convert non-integer ${value} to BigInt`);
      }
      value = BigInt(Math.floor(value));
    }

    if (typeof value !== "bigint") {
      debugLog("❌ ERROR: Value is not BigInt after conversion", typeof value);
      throw new Error(`Expected BigInt, got ${typeof value}`);
    }

    const result = formatUnits(value, decimals);
    debugLog("✅ Successfully formatted", result);
    return result;
  } catch (error) {
    debugLog("❌ ERROR in safeFormatUnits", error);
    console.error("Full error details:", error);
    return "0";
  }
}

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

  debugLog("Provider initialized with tokenAddress", tokenAddress);

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

    debugLog("Processing contract data", contractData);

    try {
      const [priceData, collateralData, stateData, supplyData, goalData] =
        contractData;

      debugLog("Raw contract results:", {
        priceData: priceData?.result,
        collateralData: collateralData?.result,
        stateData: stateData?.result,
        supplyData: supplyData?.result,
        goalData: goalData?.result,
      });

      // ⚠️ THIS IS LIKELY WHERE THE ERROR HAPPENS
      // Let's safely extract bigint values with detailed logging
      const lastPrice = (() => {
        try {
          const result = priceData?.result;
          debugLog("Processing lastPrice", {
            type: typeof result,
            value: result,
          });
          if (!result) return 0n;
          return BigInt(result.toString());
        } catch (error) {
          debugLog("❌ ERROR processing lastPrice", error);
          return 0n;
        }
      })();

      const collateral = (() => {
        try {
          const result = collateralData?.result;
          debugLog("Processing collateral", {
            type: typeof result,
            value: result,
          });
          if (!result) return 0n;
          return BigInt(result.toString());
        } catch (error) {
          debugLog("❌ ERROR processing collateral", error);
          return 0n;
        }
      })();

      const tokenState = (() => {
        try {
          const result = stateData?.result;
          debugLog("Processing tokenState", {
            type: typeof result,
            value: result,
          });
          return result ? Number(result) : 0;
        } catch (error) {
          debugLog("❌ ERROR processing tokenState", error);
          return 0;
        }
      })();

      const virtualSupply = (() => {
        try {
          const result = supplyData?.result;
          debugLog("Processing virtualSupply", {
            type: typeof result,
            value: result,
          });
          if (!result) return 0n;
          return BigInt(result.toString());
        } catch (error) {
          debugLog("❌ ERROR processing virtualSupply", error);
          return 0n;
        }
      })();

      const fundingGoal = (() => {
        try {
          const result = goalData?.result;
          debugLog("Processing fundingGoal", {
            type: typeof result,
            value: result,
          });
          if (!result) return 0n;
          return BigInt(result.toString());
        } catch (error) {
          debugLog("❌ ERROR processing fundingGoal", error);
          return 0n;
        }
      })();

      debugLog("Processed BigInt values:", {
        lastPrice: lastPrice.toString(),
        collateral: collateral.toString(),
        tokenState,
        virtualSupply: virtualSupply.toString(),
        fundingGoal: fundingGoal.toString(),
      });

      const newData: TokenWalletData = {
        lastPrice,
        collateral,
        tokenState,
        virtualSupply,
        fundingGoal,
        avaxBalance: avaxBalance?.formatted || "0",
        tokenBalance: tokenBalance?.formatted || "0",
        formatted: {
          price: safeFormatUnits(lastPrice, 18),
          collateral: safeFormatUnits(collateral, 18),
          avaxBalance: avaxBalance?.formatted || "0",
          tokenBalance: tokenBalance?.formatted || "0",
          fundingGoal: safeFormatUnits(fundingGoal, 18),
        },
        calculations: data?.calculations || {},
        isLoading: false,
        isCalculating,
        lastUpdated: Date.now(),
      };

      debugLog("Setting new data", newData.formatted);
      setData(newData);
    } catch (error) {
      debugLog("❌ CRITICAL ERROR processing contract data", error);
      console.error("Full error stack:", error);
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
            debugLog("Making API call for tokens calculation", {
              ethAmount,
              tokenAddress,
            });

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
              throw new Error(`API error: ${response.status}`);
            }

            const { data: tokensOut } = await response.json();
            debugLog("API response for tokens", tokensOut);

            return tokensOut;
          }
        );

        return result;
      } catch (error) {
        debugLog("❌ ERROR calculating tokens", error);
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
            debugLog("Making API call for ETH calculation", {
              tokenAmount,
              tokenAddress,
            });

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
              throw new Error(`API error: ${response.status}`);
            }

            const { data: ethOut } = await response.json();
            debugLog("API response for ETH", ethOut);

            return ethOut;
          }
        );

        return result;
      } catch (error) {
        debugLog("❌ ERROR calculating ETH", error);
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
