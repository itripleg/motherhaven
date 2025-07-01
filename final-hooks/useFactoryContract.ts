// final-hooks/useFactoryContract.ts
import { useReadContract, useWriteContract } from "wagmi";
import { FACTORY_ADDRESS, FACTORY_ABI } from "@/types";
import { type Address, formatUnits, parseEther } from "viem";

/**
 * Simplified factory contract hook - single source of truth for all factory interactions
 * Consolidates all factory-related functionality with consistent formatting
 */
export function useFactoryContract() {
  const { writeContract, isPending, error: writeError } = useWriteContract();

  // Helper to format bigint values consistently
  const formatValue = (
    value: bigint | undefined,
    decimals = 18,
    precision = 6
  ): string => {
    if (!value) return "0";
    try {
      const formatted = formatUnits(value, decimals);
      return parseFloat(formatted).toFixed(precision);
    } catch {
      return "0";
    }
  };

  // --- READ OPERATIONS ---

  /**
   * Get current/last price for a token
   */
  const usePrice = (tokenAddress?: Address) => {
    const { data, refetch, isLoading, error } = useReadContract({
      address: FACTORY_ADDRESS,
      abi: FACTORY_ABI,
      functionName: "lastPrice",
      args: tokenAddress ? [tokenAddress] : undefined,
      query: {
        enabled: Boolean(tokenAddress),
        refetchInterval: 10000, // 10 seconds
        staleTime: 5000,
      },
    });

    return {
      price: data as bigint | undefined,
      priceFormatted: formatValue(data as bigint | undefined),
      refetch,
      isLoading,
      error,
    };
  };

  /**
   * Get collateral amount for a token
   */
  const useCollateral = (tokenAddress?: Address) => {
    const { data, refetch, isLoading, error } = useReadContract({
      address: FACTORY_ADDRESS,
      abi: FACTORY_ABI,
      functionName: "collateral",
      args: tokenAddress ? [tokenAddress] : undefined,
      query: {
        enabled: Boolean(tokenAddress),
        refetchInterval: 15000, // 15 seconds
        staleTime: 10000,
      },
    });

    return {
      collateral: data as bigint | undefined,
      collateralFormatted: formatValue(data as bigint | undefined, 18, 4),
      refetch,
      isLoading,
      error,
    };
  };

  /**
   * Get token state
   */
  const useTokenState = (tokenAddress?: Address) => {
    const { data, refetch, isLoading, error } = useReadContract({
      address: FACTORY_ADDRESS,
      abi: FACTORY_ABI,
      functionName: "getTokenState",
      args: tokenAddress ? [tokenAddress] : undefined,
      query: {
        enabled: Boolean(tokenAddress),
        refetchInterval: 20000, // 20 seconds
        staleTime: 15000,
      },
    });

    return {
      state: data ? Number(data) : 0,
      refetch,
      isLoading,
      error,
    };
  };

  /**
   * Calculate token amount for ETH input
   */
  const useCalculateTokens = (tokenAddress?: Address, ethAmount?: string) => {
    const { data, isLoading, error } = useReadContract({
      address: FACTORY_ADDRESS,
      abi: FACTORY_ABI,
      functionName: "calculateTokenAmount",
      args:
        tokenAddress && ethAmount
          ? [tokenAddress, parseEther(ethAmount)]
          : undefined,
      query: {
        enabled: Boolean(
          tokenAddress && ethAmount && parseFloat(ethAmount) > 0
        ),
        staleTime: 5000,
      },
    });

    return {
      tokenAmount: data as bigint | undefined,
      tokenAmountFormatted: formatValue(data as bigint | undefined),
      isLoading,
      error,
    };
  };

  // --- WRITE OPERATIONS ---

  /**
   * Create a new token
   */
  const createToken = async (
    name: string,
    symbol: string,
    imageUrl: string,
    burnManager: Address
  ) => {
    return writeContract({
      address: FACTORY_ADDRESS,
      abi: FACTORY_ABI,
      functionName: "createToken",
      args: [name, symbol, imageUrl, burnManager],
    });
  };

  /**
   * Buy tokens
   */
  const buyTokens = async (tokenAddress: Address, ethAmount: string) => {
    return writeContract({
      address: FACTORY_ADDRESS,
      abi: FACTORY_ABI,
      functionName: "buy",
      args: [tokenAddress],
      value: parseEther(ethAmount),
    });
  };

  /**
   * Sell tokens
   */
  const sellTokens = async (tokenAddress: Address, tokenAmount: string) => {
    return writeContract({
      address: FACTORY_ADDRESS,
      abi: FACTORY_ABI,
      functionName: "sell",
      args: [tokenAddress, parseEther(tokenAmount)],
    });
  };

  // --- COMBINED HOOKS FOR COMMON USE CASES ---

  /**
   * Get all essential token data in one hook
   */
  const useTokenDetails = (tokenAddress?: Address) => {
    const priceData = usePrice(tokenAddress);
    const collateralData = useCollateral(tokenAddress);
    const stateData = useTokenState(tokenAddress);

    const refetchAll = () => {
      priceData.refetch();
      collateralData.refetch();
      stateData.refetch();
    };

    return {
      price: priceData.price,
      priceFormatted: priceData.priceFormatted,
      collateral: collateralData.collateral,
      collateralFormatted: collateralData.collateralFormatted,
      state: stateData.state,
      isLoading:
        priceData.isLoading || collateralData.isLoading || stateData.isLoading,
      error: priceData.error || collateralData.error || stateData.error,
      refetchAll,
    };
  };

  return {
    // Individual hooks
    usePrice,
    useCollateral,
    useTokenState,
    useCalculateTokens,

    // Combined hook
    useTokenDetails,

    // Write functions
    createToken,
    buyTokens,
    sellTokens,

    // Write state
    isPending,
    writeError,

    // Utility
    formatValue,
  };
}
