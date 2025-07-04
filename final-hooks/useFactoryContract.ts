// final-hooks/useFactoryContract.ts
import { useReadContract, useWriteContract } from "wagmi";
import { FACTORY_ADDRESS, FACTORY_ABI } from "@/types";
import { type Address, formatUnits, parseEther, zeroAddress } from "viem";

/**
 * Simplified factory contract hook - single source of truth for all factory interactions
 * Updated to match GrandFactory.sol contract
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
   * Calculate ETH cost for buying specific amount of tokens
   * Updated to match: calculateBuyPrice(address tokenAddress, uint256 tokenAmount)
   */
  const useCalculateBuyPrice = (
    tokenAddress?: Address,
    tokenAmount?: string
  ) => {
    const { data, isLoading, error } = useReadContract({
      address: FACTORY_ADDRESS,
      abi: FACTORY_ABI,
      functionName: "calculateBuyPrice",
      args:
        tokenAddress && tokenAmount
          ? [tokenAddress, parseEther(tokenAmount)]
          : undefined,
      query: {
        enabled: Boolean(
          tokenAddress && tokenAmount && parseFloat(tokenAmount) > 0
        ),
        staleTime: 5000,
      },
    });

    return {
      ethAmount: data as bigint | undefined,
      ethAmountFormatted: formatValue(data as bigint | undefined),
      isLoading,
      error,
    };
  };

  /**
   * Calculate ETH received for selling tokens
   * Updated to match: calculateSellPrice(address tokenAddress, uint256 tokenAmount)
   */
  const useCalculateSellPrice = (
    tokenAddress?: Address,
    tokenAmount?: string
  ) => {
    const { data, isLoading, error } = useReadContract({
      address: FACTORY_ADDRESS,
      abi: FACTORY_ABI,
      functionName: "calculateSellPrice",
      args:
        tokenAddress && tokenAmount
          ? [tokenAddress, parseEther(tokenAmount)]
          : undefined,
      query: {
        enabled: Boolean(
          tokenAddress && tokenAmount && parseFloat(tokenAmount) > 0
        ),
        staleTime: 5000,
      },
    });

    return {
      ethAmount: data as bigint | undefined,
      ethAmountFormatted: formatValue(data as bigint | undefined),
      isLoading,
      error,
    };
  };

  /**
   * Get last price for a token
   * Updated to match: lastPrice(address)
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
   * Updated to match: collateral(address)
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
   * Updated to match: getTokenState(address)
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
   * Updated to match: calculateTokenAmount(address tokenAddress, uint256 ethAmount)
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

  /**
   * Get virtual supply for a token
   * Updated to match: virtualSupply(address)
   */
  const useVirtualSupply = (tokenAddress?: Address) => {
    const { data, refetch, isLoading, error } = useReadContract({
      address: FACTORY_ADDRESS,
      abi: FACTORY_ABI,
      functionName: "virtualSupply",
      args: tokenAddress ? [tokenAddress] : undefined,
      query: {
        enabled: Boolean(tokenAddress),
        refetchInterval: 15000, // 15 seconds
        staleTime: 10000,
      },
    });

    return {
      supply: data as bigint | undefined,
      supplyFormatted: formatValue(data as bigint | undefined),
      refetch,
      isLoading,
      error,
    };
  };

  /**
   * Get funding goal for a token
   * Updated to match: getFundingGoal(address)
   */
  const useFundingGoal = (tokenAddress?: Address) => {
    const { data, isLoading, error } = useReadContract({
      address: FACTORY_ADDRESS,
      abi: FACTORY_ABI,
      functionName: "getFundingGoal",
      args: tokenAddress ? [tokenAddress] : undefined,
      query: {
        enabled: Boolean(tokenAddress),
        staleTime: 60000, // 1 minute - funding goals don't change often
      },
    });

    return {
      goal: data as bigint | undefined,
      goalFormatted: formatValue(data as bigint | undefined, 18, 4),
      isLoading,
      error,
    };
  };

  /**
   * Get all tokens created by factory
   * Updated to match: getAllTokens()
   */
  const useAllTokens = () => {
    const { data, refetch, isLoading, error } = useReadContract({
      address: FACTORY_ADDRESS,
      abi: FACTORY_ABI,
      functionName: "getAllTokens",
      query: {
        staleTime: 30000, // 30 seconds
      },
    });

    return {
      tokens: data as Address[] | undefined,
      refetch,
      isLoading,
      error,
    };
  };

  // --- WRITE OPERATIONS ---

  /**
   * Create a new token
   * Updated to match: createToken(string name, string symbol, string imageUrl, address burnManager, uint256 minTokensOut)
   */
  const createToken = async (
    name: string,
    symbol: string,
    imageUrl: string = "",
    burnManager: Address = zeroAddress,
    minTokensOut: string = "0",
    ethValue: string = "0"
  ) => {
    return writeContract({
      address: FACTORY_ADDRESS,
      abi: FACTORY_ABI,
      functionName: "createToken",
      args: [name, symbol, imageUrl, burnManager, parseEther(minTokensOut)],
      value: parseEther(ethValue),
    });
  };

  /**
   * Buy tokens
   * Updated to match: buy(address tokenAddress, uint256 minTokensOut)
   */
  const buyTokens = async (
    tokenAddress: Address,
    ethAmount: string,
    minTokensOut: string = "0"
  ) => {
    return writeContract({
      address: FACTORY_ADDRESS,
      abi: FACTORY_ABI,
      functionName: "buy",
      args: [tokenAddress, parseEther(minTokensOut)],
      value: parseEther(ethAmount),
    });
  };

  /**
   * Sell tokens
   * Updated to match: sell(address tokenAddress, uint256 tokenAmount)
   */
  const sellTokens = async (tokenAddress: Address, tokenAmount: string) => {
    return writeContract({
      address: FACTORY_ADDRESS,
      abi: FACTORY_ABI,
      functionName: "sell",
      args: [tokenAddress, parseEther(tokenAmount)],
    });
  };

  /**
   * Resume trading (creator only)
   * Updated to match: resumeTrading(address tokenAddress)
   */
  const resumeTrading = async (tokenAddress: Address) => {
    return writeContract({
      address: FACTORY_ADDRESS,
      abi: FACTORY_ABI,
      functionName: "resumeTrading",
      args: [tokenAddress],
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
    const supplyData = useVirtualSupply(tokenAddress);
    const goalData = useFundingGoal(tokenAddress);

    const refetchAll = () => {
      priceData.refetch();
      collateralData.refetch();
      stateData.refetch();
      supplyData.refetch();
    };

    return {
      price: priceData.price,
      priceFormatted: priceData.priceFormatted,
      collateral: collateralData.collateral,
      collateralFormatted: collateralData.collateralFormatted,
      state: stateData.state,
      supply: supplyData.supply,
      supplyFormatted: supplyData.supplyFormatted,
      goal: goalData.goal,
      goalFormatted: goalData.goalFormatted,
      isLoading:
        priceData.isLoading ||
        collateralData.isLoading ||
        stateData.isLoading ||
        supplyData.isLoading ||
        goalData.isLoading,
      error:
        priceData.error ||
        collateralData.error ||
        stateData.error ||
        supplyData.error ||
        goalData.error,
      refetchAll,
    };
  };

  return {
    // Individual hooks
    usePrice,
    useCollateral,
    useTokenState,
    useVirtualSupply,
    useFundingGoal,
    useCalculateTokens,
    useCalculateBuyPrice,
    useCalculateSellPrice,
    useAllTokens,

    // Combined hook
    useTokenDetails,

    // Write functions
    createToken,
    buyTokens,
    sellTokens,
    resumeTrading,

    // Write state
    isPending,
    writeError,

    // Utility
    formatValue,
  };
}
